from typing import List
from .models.schemas import ComplianceFlag, Evidence, ContractField
from .retriever import retrieve

CATEGORIES = ["privacy", "labor", "tax"]

def check(fields: List[ContractField], region: str) -> List[ComplianceFlag]:
    flags: List[ComplianceFlag] = []
    for cat in CATEGORIES:
        hits = retrieve(cat, top_k=1)
        if not hits:
            continue
        rule_text, _ = hits[0]
        # naive mapping: improve later
        for f in fields:
            if cat == "privacy" and f.name == "data_processing":
                risk = "LOW" if any(w in rule_text.lower() for w in ["controller", "processor"]) else "HIGH" 
                flags.append(ComplianceFlag(
                    id=f"{cat}-{f.name}",
                    category=cat,
                    region=region,
                    risk_level=risk,
                    rationale=f"Field '{f.name}' value '{f.value}' vs privacy rule snippet.",
                    contract_evidence=f.evidence,
                    rule_evidence=Evidence(file="rules_store", section="top_hit"),
                ))
            if cat == "labor" and f.name == "termination_notice":
                risk = "LOW" if any(x in f.value.lower() for x in ["30", "60"]) else "MED"
                flags.append(ComplianceFlag(
                    id=f"{cat}-{f.name}",
                    category=cat,
                    region=region,
                    risk_level=risk,
                    rationale=f"Termination notice '{f.value}' vs labor rule.",
                    contract_evidence=f.evidence,
                    rule_evidence=Evidence(file="rules_store", section="top_hit"),
                ))
            if cat == "tax" and f.name == "tax_withholding_clause":
                risk = "LOW" if "applicable" in f.value.lower() else "HIGH"
                flags.append(ComplianceFlag(
                    id=f"{cat}-{f.name}",
                    category=cat,
                    region=region,
                    risk_level=risk,
                    rationale=f"Tax withholding clause '{f.value}' vs tax rule.",
                    contract_evidence=f.evidence,
                    rule_evidence=Evidence(file="rules_store", section="top_hit"),
                ))
    return flags