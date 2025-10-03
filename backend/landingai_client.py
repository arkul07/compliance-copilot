# Stub to be replaced with real LandingAI ADE integration.
# Provide a simple fallback so the app runs even before wiring ADE.
from typing import List
from .models.schemas import ContractField, Evidence

def extract_fields(pdf_path: str) -> List[ContractField]:
    # TODO: call LandingAI ADE and normalize results.
    # Temporary stub returns example fields to unblock development.
    return [
        ContractField(name="jurisdiction", value="EU", evidence=Evidence(file=pdf_path, page=1)),
        ContractField(name="data_processing", value="controller", evidence=Evidence(file=pdf_path, page=2)),
        ContractField(name="termination_notice", value="30 days", evidence=Evidence(file=pdf_path, page=3)),
        ContractField(name="tax_withholding_clause", value="applicable", evidence=Evidence(file=pdf_path, page=4)),
    ]