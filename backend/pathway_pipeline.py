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

def get_live_document_count():
    """Get real-time document count from monitored directories."""
    import os
    from pathlib import Path
    
    rules_dir = Path("backend/rules")
    contracts_dir = Path("backend/contracts")
    
    count = 0
    if rules_dir.exists():
        count += len(list(rules_dir.rglob("*.md")))
    if contracts_dir.exists():
        count += len(list(contracts_dir.rglob("*.json")))
        count += len(list(contracts_dir.rglob("*.pdf")))
    
    return count

def get_recent_changes():
    """Get recently modified files to show live activity."""
    import os
    from pathlib import Path
    import time
    
    recent_files = []
    current_time = time.time()
    
    # Check rules directory
    rules_dir = Path("backend/rules")
    if rules_dir.exists():
        for file_path in rules_dir.rglob("*.md"):
            try:
                mtime = os.path.getmtime(file_path)
                if current_time - mtime < 3600:  # Modified in last hour
                    recent_files.append({
                        "path": str(file_path),
                        "modified": mtime,
                        "type": "rule"
                    })
            except:
                pass
    
    # Check contracts directory
    contracts_dir = Path("backend/contracts")
    if contracts_dir.exists():
        for file_path in contracts_dir.rglob("*"):
            try:
                mtime = os.path.getmtime(file_path)
                if current_time - mtime < 3600:  # Modified in last hour
                    recent_files.append({
                        "path": str(file_path),
                        "modified": mtime,
                        "type": "contract"
                    })
            except:
                pass
    
    return sorted(recent_files, key=lambda x: x["modified"], reverse=True)

def extract_context_with_highlight(content: str, query_lower: str, query_words: list) -> str:
    """Extract relevant context with highlighted search terms."""
    import re
    
    # Find the best match position
    best_pos = -1
    best_score = 0
    
    # Look for exact phrase match first
    if query_lower in content.lower():
        best_pos = content.lower().find(query_lower)
        best_score = 10
    else:
        # Find best word match
        for word in query_words:
            pos = content.lower().find(word)
            if pos != -1:
                # Calculate score based on position and context
                score = 5 - (pos / len(content)) * 2  # Prefer earlier matches
                if score > best_score:
                    best_score = score
                    best_pos = pos
    
    if best_pos == -1:
        # Fallback to beginning of content
        return content[:500] + "..." if len(content) > 500 else content
    
    # Extract context around the match (200 chars before, 300 chars after)
    start = max(0, best_pos - 200)
    end = min(len(content), best_pos + 300)
    context = content[start:end]
    
    # Add ellipsis if we're not at the beginning/end
    if start > 0:
        context = "..." + context
    if end < len(content):
        context = context + "..."
    
    # Highlight search terms in the context
    highlighted_context = highlight_search_terms(context, query_lower, query_words)
    
    return highlighted_context

def highlight_search_terms(text: str, query_lower: str, query_words: list) -> str:
    """Highlight search terms in the text."""
    import re
    
    # Create a copy to work with
    highlighted = text
    
    # Highlight exact phrase match first (case insensitive)
    if query_lower in text.lower():
        # Find all occurrences of the exact phrase
        pattern = re.escape(query_lower)
        highlighted = re.sub(
            f'({pattern})', 
            r'<mark>\1</mark>', 
            highlighted, 
            flags=re.IGNORECASE
        )
    
    # Highlight individual words (case insensitive)
    for word in query_words:
        if len(word) > 2:  # Only highlight words longer than 2 characters
            # Don't highlight if already highlighted as part of phrase
            pattern = f'\\b{re.escape(word)}\\b'
            highlighted = re.sub(
                f'(?<!<mark>)(?<!</mark>)({pattern})', 
                r'<mark>\1</mark>', 
                highlighted, 
                flags=re.IGNORECASE
            )
    
    return highlighted

def _run_pathway():
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        import pathway as pw
        from pathway.xpacks.llm.vector_store import VectorStoreServer
        from sentence_transformers import SentenceTransformer

        logger.info("Starting Pathway pipeline...")

        # Create data sources for both rules and contracts
        rules_dir = "backend/rules"
        contracts_dir = "backend/contracts"

        # Create data sources using the correct format
        try:
            # Use plaintext format to avoid Unicode issues with binary files
            rules_data = pw.io.fs.read(
                rules_dir,
                format="plaintext",
                mode="streaming", 
                with_metadata=True
            )
            contracts_data = pw.io.fs.read(
                contracts_dir,
                format="plaintext", 
                mode="streaming",
                with_metadata=True
            )
            logger.info(f"Reading from {rules_dir} and {contracts_dir}")
        except Exception as e:
            logger.error(f"Failed to read directories: {e}")
            return

        # Combine data sources
        data_sources = [rules_data, contracts_data]

        # Create embedder using Pathway's built-in SentenceTransformerEmbedder
        try:
            from pathway.xpacks.llm.embedders import SentenceTransformerEmbedder
            embedder = SentenceTransformerEmbedder(
                model="sentence-transformers/all-MiniLM-L6-v2"
            )
            logger.info("Created SentenceTransformerEmbedder")
        except Exception as e:
            logger.error(f"Failed to create embedder: {e}")
            return

        try:
            # Create vector store server with data sources
            vector_store = VectorStoreServer(
                *data_sources,
                embedder=embedder
            )
            logger.info("Created vector store server")
            
            # Start the server
            logger.info("Starting Pathway server on port 8765...")
            vector_store.run_server(host="127.0.0.1", port=8765)
        except Exception as e:
            logger.error(f"Failed to create vector store: {e}")
            # Try to start a simple fallback server
            logger.info("Attempting fallback server startup...")
            try:
                import threading
                import time
                from http.server import HTTPServer, BaseHTTPRequestHandler
                import json
                
                class FallbackHandler(BaseHTTPRequestHandler):
                    def do_GET(self):
                        if self.path == '/v1/statistics':
                            self.send_response(200)
                            self.send_header('Content-type', 'application/json')
                            self.end_headers()
                            response = {"document_count": 0, "last_indexed": "fallback", "status": "fallback"}
                            self.wfile.write(json.dumps(response).encode())
                        elif self.path.startswith('/v1/retrieve'):
                            self.send_response(200)
                            self.send_header('Content-type', 'application/json')
                            self.end_headers()
                            response = {"results": []}
                            self.wfile.write(json.dumps(response).encode())
                        else:
                            self.send_response(404)
                            self.end_headers()
                
                def run_fallback_server():
                    server = HTTPServer(('127.0.0.1', 8765), FallbackHandler)
                    logger.info("Fallback server running on port 8765")
                    server.serve_forever()
                
                threading.Thread(target=run_fallback_server, daemon=True).start()
                time.sleep(2)
                logger.info("Fallback server started successfully")
            except Exception as fallback_error:
                logger.error(f"Fallback server also failed: {fallback_error}")
            
    except Exception as e:
        logger.error(f"[pathway] not running, using fallback: {e}")
        print(f"[pathway] not running, using fallback: {e}")

# ---------------- Query helper used by retriever -----------------------------
def hybrid_search(query: str, top_k: int = 3) -> List[Tuple[str, float]]:
    """Enhanced document search with semantic matching."""
    import os
    import re
    from pathlib import Path
    import logging
    
    logger = logging.getLogger(__name__)
    logger.info(f"Searching documents for: {query}")
    
    try:
        # Try Pathway server first
        import json, urllib.request
        query_data = {"query": query, "k": top_k}
        req = urllib.request.Request(
            "http://127.0.0.1:8765/v1/retrieve",
            data=json.dumps(query_data).encode(),
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req, timeout=2.0) as r:
            data = json.loads(r.read().decode("utf-8"))
            if isinstance(data, dict) and "results" in data:
                results = [(it["text"], float(it["score"])) for it in data.get("results", [])]
                logger.info(f"Pathway returned {len(results)} results")
                return results
    except Exception as e:
        logger.info(f"Pathway server not available, using enhanced search: {e}")
    
    # Enhanced fallback search
    results = []
    query_lower = query.lower()
    query_words = [w for w in re.findall(r'\b\w+\b', query_lower) if len(w) > 2]
    
    # Search in rules directory
    rules_dir = Path("backend/rules")
    if rules_dir.exists():
        for file_path in rules_dir.rglob("*.md"):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Calculate relevance score
                    score = 0
                    content_lower = content.lower()
                    
                    # Exact phrase match (highest score)
                    if query_lower in content_lower:
                        score += 10
                    
                    # Word matches
                    for word in query_words:
                        word_count = content_lower.count(word)
                        score += word_count * 2
                    
                    # Semantic keyword matching
                    semantic_keywords = {
                        'gdpr': ['privacy', 'data', 'protection', 'consent', 'personal'],
                        'privacy': ['data', 'personal', 'consent', 'protection', 'gdpr'],
                        'labor': ['employment', 'worker', 'employee', 'workplace', 'termination'],
                        'tax': ['withholding', 'revenue', 'financial', 'payment', 'income'],
                        'confidentiality': ['secret', 'proprietary', 'non-disclosure', 'private'],
                        'termination': ['end', 'conclude', 'finish', 'notice', 'period']
                    }
                    
                    for query_word in query_words:
                        if query_word in semantic_keywords:
                            for semantic_word in semantic_keywords[query_word]:
                                score += content_lower.count(semantic_word) * 0.5
                    
                    if score > 0:
                        # Extract relevant snippet with context
                        snippet = extract_context_with_highlight(content, query_lower, query_words)
                        results.append((snippet, float(score)))
            except Exception as e:
                logger.warning(f"Error reading {file_path}: {e}")
    
    # Search in contracts directory
    contracts_dir = Path("backend/contracts")
    if contracts_dir.exists():
        for file_path in contracts_dir.rglob("*.json"):
            try:
                import json
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    content = str(data)
                    content_lower = content.lower()
                    
                    score = 0
                    if query_lower in content_lower:
                        score += 10
                    
                    for word in query_words:
                        score += content_lower.count(word) * 2
                    
                    if score > 0:
                        snippet = extract_context_with_highlight(content, query_lower, query_words)
                        results.append((snippet, float(score)))
            except Exception as e:
                logger.warning(f"Error reading {file_path}: {e}")
    
    # Sort by score and return top results
    results.sort(key=lambda x: x[1], reverse=True)
    logger.info(f"Enhanced search returned {len(results[:top_k])} results")
    return results[:top_k]