from typing import List, Tuple
from .pathway_pipeline import hybrid_search

KEYWORDS = {
    "privacy": ["gdpr", "personal data", "processing", "controller", "processor"],
    "labor":   ["notice", "termination", "employment", "working hours"],
    "tax":     ["withholding", "tax", "vat", "gst"],
}

def retrieve(category: str, top_k: int = 3) -> List[Tuple[str, float]]:
    words = KEYWORDS.get(category, [])
    query = " ".join(words) if words else ""
    return hybrid_search(query, top_k=top_k)