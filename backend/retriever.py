# Simple keyword-based retriever as a fallback before Pathway wiring.
# Replace body with Pathway hybrid search later.
from typing import List, Tuple
from .pathway_pipeline import get_rules

KEYWORDS = {
    "privacy": ["gdpr", "personal data", "processing", "controller", "processor"],
    "labor": ["notice", "termination", "employment", "working hours"],
    "tax": ["withholding", "tax", "vat", "gst"],
}

def retrieve(category: str, top_k: int = 3) -> List[Tuple[str, float]]:
    rules = get_rules()
    words = KEYWORDS.get(category, [])
    ranked = []
    for r in rules:
        score = sum(r.lower().count(w) for w in words)
        if score:
            ranked.append((r, float(score)))
    ranked.sort(key=lambda x: x[1], reverse=True)
    return ranked[:top_k]

