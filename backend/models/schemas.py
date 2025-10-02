from pydantic import BaseModel
from typing import Optional

class Evidence(BaseModel):
    file: str
    page: Optional[int] = None
    section: Optional[str] = None

class ContractField(BaseModel):
    name: str
    value: str
    evidence: Evidence

class ComplianceFlag(BaseModel):
    id: str
    category: str      # privacy | labor | tax
    region: str        # EU | US | IN
    risk_level: str    # HIGH | MED | LOW
    rationale: str
    contract_evidence: Evidence
    rule_evidence: Evidence

