# Pathway live ingestion + hybrid index with safe fallback.
from __future__ import annotations
from pathlib import Path
from typing import List, Tuple
import threading

# ---------------- Fallback store (works even without Pathway) ----------------
_FALLBACK_RULES: List[str] = []

def add_rule_text(text: str) -> None:
    _FALLBACK_RULES.append(text)

def add_rule_file(path: str) -> None:
    p = Path(path)
    if not p.exists():
        return
    try:
        _FALLBACK_RULES.append(p.read_text(errors="ignore"))
    except Exception:
        try:
            from pypdf import PdfReader
            txt = "".join((pg.extract_text() or "") for pg in PdfReader(str(p)).pages)
            _FALLBACK_RULES.append(txt)
        except Exception:
            pass

def add_contract_file(path: str) -> None:
    # Pathway pipeline will watch contracts dir; fallback does not use contracts
    pass

def get_rules() -> List[str]:
    return list(_FALLBACK_RULES)

# ---------------- Pathway runtime (optional, starts if installed) ------------
_PIPELINE_STARTED = False
_PIPELINE_LOCK = threading.RLock()

def start_pipeline() -> None:
    """Idempotent: start Pathway in a background thread if available."""
    global _PIPELINE_STARTED
    with _PIPELINE_LOCK:
        if _PIPELINE_STARTED:
            return
        _PIPELINE_STARTED = True
        threading.Thread(target=_run_pathway, name="pathway-pipeline", daemon=True).start()

def _run_pathway():
    try:
        import pathway as pw
        from pathway.xpacks.llm import index as pw_index
        from sentence_transformers import SentenceTransformer

        rules_dir = "backend/rules"
        contracts_dir = "backend/contracts"

        # Stream file readers
        rules = pw.io.fs.read(rules_dir, with_metadata=True, mode="streaming")
        contracts = pw.io.fs.read(contracts_dir, with_metadata=True, mode="streaming")

        @pw.udf
        def _kind(path: str) -> str:
            path = path.replace("\\", "/")
            return "rule" if "/rules/" in path else "contract"

        docs_rules = rules.select(text=pw.this.data, path=pw.this.path, kind=_kind(pw.this.path))
        docs_contracts = contracts.select(text=pw.this.data, path=pw.this.path, kind=_kind(pw.this.path))
        docs = pw.union(docs_rules, docs_contracts)

        # Small local embedder
        model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        class LocalEmbedder(pw_index.Embedder):
            def embed(self, texts: list[str]) -> list[list[float]]:
                return [model.encode(t, normalize_embeddings=True).tolist() for t in texts]

        idx = pw_index.HybridIndex(
            docs.text,
            docs.select(id=pw.this._pw_id, metadata=pw.this.path),
            embedder=LocalEmbedder(),
            bm25=True,
        )

        # Tiny HTTP bridge to query the index
        server = pw.io.http.RestServer(port=8765)

        @server.route("/query")
        def _query(req) -> dict:
            q = req.params.get("q", "")
            k = int(req.params.get("k", "3"))
            res = idx.search(q, k=k)
            return {"results": [{"text": r.text, "score": float(r.score), "meta": r.metadata} for r in res]}

        pw.run()
    except Exception as e:
        print("[pathway] not running, using fallback:", e)

# ---------------- Query helper used by retriever -----------------------------
def hybrid_search(query: str, top_k: int = 3) -> List[Tuple[str, float]]:
    """Try Pathway HTTP bridge; otherwise score fallback rules by simple keywords."""
    import json, urllib.request, urllib.parse
    try:
        q = urllib.parse.quote(query)
        with urllib.request.urlopen(f"http://127.0.0.1:8765/query?q={q}&k={top_k}", timeout=1.8) as r:
            data = json.loads(r.read().decode("utf-8"))
            return [(it["text"], float(it["score"])) for it in data.get("results", [])]
    except Exception:
        toks = [t for t in query.lower().split() if t.strip()]
        scored = []
        for r in _FALLBACK_RULES:
            s = sum(r.lower().count(t) for t in toks)
            if s:
                scored.append((r[:800], float(s)))
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]