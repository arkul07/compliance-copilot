# Minimal placeholder; integrate Pathway ingestion later.
# Keep a simple in-memory store so retriever/checker can run.
from pathlib import Path
from typing import List

_RULES: List[str] = []

def start_pipeline():
    """Initialize Pathway pipeline. Placeholder for now."""
    # Load existing seed rules into memory
    seed_dir = Path(__file__).parent / "rules" / "seed"
    for rule_file in seed_dir.glob("*.md"):
        if rule_file.is_file():
            _RULES.append(rule_file.read_text(errors="ignore"))

def add_rule_text(text: str):
    _RULES.append(text)

def add_rule_file(path: str):
    p = Path(path)
    _RULES.append(p.read_text(errors="ignore"))

def add_contract_file(path: str):
    """Add contract file to pipeline. Placeholder for now."""
    pass

def get_rules() -> List[str]:
    return list(_RULES)

