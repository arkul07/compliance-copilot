from __future__ import annotations
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pathlib import Path
import json

from .landingai_client import extract_fields
from .checker import check
from .models.schemas import ComplianceFlag, ContractField, Evidence
from .pathway_pipeline import start_pipeline, add_rule_file, add_contract_file

APP_TITLE = "Global Compliance Copilot API v2"
app = FastAPI(title=APP_TITLE)

# Allow Next.js on localhost:3000 (adjust if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
CONTRACTS_DIR = BASE_DIR / "contracts" / "sample"
RULES_DIR = BASE_DIR / "rules" / "seed"
CONTRACTS_DIR.mkdir(parents=True, exist_ok=True)
RULES_DIR.mkdir(parents=True, exist_ok=True)

# ---------------- Startup ----------------
@app.on_event("startup")
def _startup():
    try:
        start_pipeline()
    except Exception:
        pass

# ---------------- Utilities ----------------
def _save_upload(file: UploadFile, dest_dir: Path) -> Path:
    dest_dir.mkdir(parents=True, exist_ok=True)
    path = dest_dir / file.filename
    with path.open("wb") as f:
        f.write(file.file.read())
    return path

def _latest_contract() -> Optional[Path]:
    pdfs = list(CONTRACTS_DIR.glob("*.pdf"))
    if not pdfs:
        return None
    pdfs.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return pdfs[0]

# ---------------- Health ----------------
@app.get("/health")
def health():
    return {"ok": True}

# ---------------- Rule upload (file) ----------------
@app.post("/upload_rule")
async def upload_rule(file: UploadFile = File(...)) -> dict:
    path = _save_upload(file, RULES_DIR)
    try:
        add_rule_file(str(path))
    except Exception:
        pass
    return {"ok": True, "path": str(path)}

# ---------------- Contract upload (file) ----------------
@app.post("/upload_contract")
async def upload_contract(file: UploadFile = File(...)) -> dict:
    path = _save_upload(file, CONTRACTS_DIR)
    try:
        add_contract_file(str(path))
    except Exception:
        pass
    fields: List[ContractField] = extract_fields(str(path))
    out_json = path.with_suffix(".json")
    with out_json.open("w", encoding="utf-8") as f:
        json.dump([f_.model_dump() for f_ in fields], f, ensure_ascii=False, indent=2)
    return {"ok": True, "path": str(path), "fields": [f_.model_dump() for f_ in fields]}

# ---------------- Check + Explain ----------------
@app.get("/check", response_model=List[ComplianceFlag])
def run_check(
    region: str = Query("EU", pattern="^(EU|US|IN)$"),
    contract_path: Optional[str] = None,
):
    if contract_path:
        cpath = Path(contract_path)
        if not cpath.exists():
            raise HTTPException(status_code=400, detail="contract_path not found")
    else:
        cpath = _latest_contract()
        if not cpath:
            raise HTTPException(status_code=400, detail="no contracts uploaded")
    fields = extract_fields(str(cpath))
    flags = check(fields, region)
    return flags

@app.get("/explain")
def explain_flag(id: str, region: str = "EU") -> dict:
    if "-" in id:
        category, field_name = id.split("-", 1)
    else:
        category, field_name = ("privacy", id)
    cpath = _latest_contract()
    if not cpath:
        raise HTTPException(status_code=400, detail="no contracts uploaded")
    fields = extract_fields(str(cpath))
    field_ev: Optional[Evidence] = None
    for f in fields:
        if f.name == field_name:
            field_ev = f.evidence
            break
    from .retriever import retrieve
    hits = retrieve(category, top_k=1)
    rule_text = hits[0][0] if hits else ""
    return {
        "id": id,
        "region": region,
        "contract": {"path": str(cpath), "evidence": field_ev.model_dump() if field_ev else None},
        "rule_snippet": rule_text[:2000],
    }

# ---------------- Inline Rule Editor APIs ----------------
@app.get("/rules")
def list_rules() -> dict:
    items = []
    for p in RULES_DIR.glob("*"):
        if p.is_file() and p.suffix.lower() in {".md", ".txt", ".pdf"}:
            items.append({
                "name": p.name,
                "path": str(p),
                "size": p.stat().st_size,
                "mtime": p.stat().st_mtime,
                "ext": p.suffix.lower(),
            })
    items.sort(key=lambda x: x["name"])
    return {"items": items}

@app.get("/rule")
def get_rule(name: str) -> dict:
    p = RULES_DIR / name
    if not p.exists():
        raise HTTPException(status_code=404, detail="rule not found")
    if p.suffix.lower() == ".pdf":
        try:
            from pypdf import PdfReader
            text = ""
            for pg in PdfReader(str(p)).pages:
                text += pg.extract_text() or ""
        except Exception:
            text = ""
    else:
        text = p.read_text(encoding="utf-8", errors="ignore")
    return {"name": name, "text": text}

@app.post("/rule")
def save_rule(payload: dict) -> dict:
    name = (payload.get("name") or '').strip()
    if not name:
        name = "rule_snippet.md"
    else:
        if "." not in name:
            name += ".md"
    text = payload.get("text", "")
    p = RULES_DIR / name
    p.write_text(text, encoding="utf-8")
    try:
        add_rule_file(str(p))
    except Exception:
        pass
    return {"ok": True, "name": name, "path": str(p)}