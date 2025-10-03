from __future__ import annotations
from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pathlib import Path
import json

# Import agent endpoints
from .agents.inkeep_api import router as agents_router

from .landingai_client import extract_fields, extract_tables
from .checker import check
from .ai_compliance_checker import ai_compliance_checker
from .models.schemas import ComplianceFlag, ContractField, Evidence
from .pathway_pipeline import start_pipeline, add_rule_file, add_contract_file, add_rule_text
from .risk_correlation import risk_engine
from .config import Config
from . import __init__ as _pkg  # noqa

APP_TITLE = "Global Compliance Copilot API"
app = FastAPI(title=APP_TITLE)

# ---------- CORS for Next.js ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include agent endpoints
app.include_router(agents_router)

BASE_DIR = Path(__file__).parent
CONTRACTS_DIR = BASE_DIR / "contracts" / "sample"
RULES_DIR = BASE_DIR / "rules" / "seed"
CONTRACTS_DIR.mkdir(parents=True, exist_ok=True)
RULES_DIR.mkdir(parents=True, exist_ok=True)

# ---------- Startup ----------
@app.on_event("startup")
def _startup():
    try:
        start_pipeline()  # idempotent
    except Exception:
        pass

# ---------- Utils ----------
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

# ---------- Health ----------
@app.get("/health")
def health():
    return {"ok": True}

# ---------- Upload rule (file) ----------
@app.post("/upload_rule")
async def upload_rule(file: UploadFile = File(...)) -> dict:
    path = _save_upload(file, RULES_DIR)
    try:
        add_rule_file(str(path))
    except Exception:
        pass
    # Always add to in-memory rules store for immediate compliance checking
    try:
        content = path.read_text(errors="ignore")
        add_rule_text(content)
    except Exception:
        pass
    return {"ok": True, "path": str(path)}

# ---------- Upload contract (file) ----------
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

# ---------- Check + Explain ----------
@app.get("/check", response_model=List[ComplianceFlag])
def run_check(
    region: str = Query("EU", pattern="^(EU|US|IN|UK)$"),
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
    
    # Use AI-powered compliance checking
    flags = ai_compliance_checker.check_compliance_ai(fields, region)
    
    # Also run traditional checking for comparison
    traditional_flags = check(fields, region)
    
    # Combine results (AI flags take precedence)
    all_flags = flags + [f for f in traditional_flags if not any(af.id == f.id for af in flags)]
    
    return all_flags

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
    hits = retrieve(category, region, top_k=1)
    rule_text = hits[0][0] if hits else ""
    return {
        "id": id,
        "region": region,
        "contract": {"path": str(cpath), "evidence": field_ev.model_dump() if field_ev else None},
        "rule_snippet": rule_text[:2000],
    }

# ---------- Inline Rule Editor ----------
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
    name = (payload.get("name") or "rule_snippet.md").strip()
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

# ---------- Novel Features ----------

@app.get("/risk_correlation")
def analyze_risk_correlation(
    region: str = Query("EU", pattern="^(EU|US|IN|UK)$"),
    contract_path: Optional[str] = None,
):
    """Analyze cross-document risk correlations - Novel Feature"""
    if contract_path:
        cpath = Path(contract_path)
        if not cpath.exists():
            raise HTTPException(status_code=400, detail="contract_path not found")
    else:
        cpath = _latest_contract()
        if not cpath:
            raise HTTPException(status_code=400, detail="no contracts uploaded")
    
    fields = extract_fields(str(cpath))
    correlations = risk_engine.analyze_cross_document_risks(fields, region)
    summary = risk_engine.get_risk_summary(correlations)
    
    return {
        "contract_path": str(cpath),
        "region": region,
        "correlations": correlations,
        "summary": summary
    }

@app.get("/extract_tables")
def extract_document_tables(
    contract_path: Optional[str] = None,
):
    """Extract tables from documents using LandingAI ADE - Novel Feature"""
    if contract_path:
        cpath = Path(contract_path)
        if not cpath.exists():
            raise HTTPException(status_code=400, detail="contract_path not found")
    else:
        cpath = _latest_contract()
        if not cpath:
            raise HTTPException(status_code=400, detail="no contracts uploaded")
    
    tables = extract_tables(str(cpath))
    
    # AI-powered table compliance analysis
    compliance_tables = ai_compliance_checker.extract_tables_for_compliance(str(cpath))
    
    return {
        "contract_path": str(cpath),
        "tables": tables,
        "count": len(tables),
        "ai_analysis": {
            "compliance_tables": compliance_tables,
            "compliance_issues_found": len(compliance_tables)
        }
    }

@app.get("/system_status")
def get_system_status():
    """Get system status including LandingAI and Pathway availability"""
    return {
        "landingai_available": Config.is_landingai_available(),
        "pathway_available": Config.is_pathway_available(),
        "api_host": Config.API_HOST,
        "api_port": Config.API_PORT,
        "frontend_url": Config.FRONTEND_URL
    }

@app.get("/pathway_search")
def search_pathway(
    query: str = Query(..., description="Search query"),
    top_k: int = Query(5, description="Number of results to return")
):
    """Search documents using Pathway's hybrid search"""
    try:
        from .pathway_pipeline import hybrid_search
        results = hybrid_search(query, top_k)
        
        # Format results for frontend
        formatted_results = []
        for text, score in results:
            formatted_results.append({
                "text": text,
                "score": score,
                "metadata": {
                    "path": "pathway_search",
                    "source": "hybrid_search"
                }
            })
        
        return {
            "query": query,
            "results": formatted_results,
            "count": len(formatted_results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pathway search failed: {str(e)}")

@app.get("/pathway_stats")
def get_pathway_stats():
    """Get Pathway server statistics"""
    try:
        from .pathway_pipeline import get_live_document_count, get_recent_changes
        import time
        
        # Get real-time document count
        doc_count = get_live_document_count()
        
        # Get recent changes
        recent_changes = get_recent_changes()
        
        return {
            "server_running": True,
            "document_count": doc_count,
            "recent_changes": len(recent_changes),
            "last_indexed": time.strftime("%Y-%m-%d %H:%M:%S"),
            "port": 8765,
            "status": "active",
            "live_monitoring": True
        }
    except Exception as e:
        return {
            "server_running": False,
            "document_count": 0,
            "last_indexed": "Unknown",
            "port": 8765,
            "status": f"error: {str(e)}",
            "live_monitoring": False
        }

@app.get("/pathway_live_activity")
def get_live_activity():
    """Get real-time activity feed"""
    try:
        from .pathway_pipeline import get_recent_changes
        import time
        
        recent_changes = get_recent_changes()
        
        # Format for frontend
        activity = []
        for change in recent_changes[:10]:  # Last 10 changes
            activity.append({
                "file": change["path"].split("/")[-1],
                "type": change["type"],
                "time_ago": int(time.time() - change["modified"]),
                "timestamp": change["modified"]
            })
        
        return {
            "activity": activity,
            "total_changes": len(recent_changes),
            "last_update": time.time()
        }
    except Exception as e:
        return {
            "activity": [],
            "total_changes": 0,
            "error": str(e)
        }

@app.post("/pathway_add_document")
def add_document_live(
    content: str = Form(...),
    filename: str = Form(...),
    doc_type: str = Form("rule")
):
    """Add a new document to the live index"""
    try:
        from .pathway_pipeline import add_rule_text, add_contract_file
        from pathlib import Path
        import time
        
        if doc_type == "rule":
            # Add to rules
            add_rule_text(content)
            # Save to file
            rules_dir = Path("backend/rules")
            rules_dir.mkdir(exist_ok=True)
            file_path = rules_dir / filename
            file_path.write_text(content)
        else:
            # Add to contracts
            contracts_dir = Path("backend/contracts")
            contracts_dir.mkdir(exist_ok=True)
            file_path = contracts_dir / filename
            file_path.write_text(content)
            add_contract_file(str(file_path))
        
        return {
            "status": "success",
            "message": f"Document '{filename}' added successfully",
            "timestamp": time.time(),
            "type": doc_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add document: {str(e)}")