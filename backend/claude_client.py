"""
Claude API Client for Rule Generation
Generates compliance rules based on region and domain
"""
import logging
import json
import os
from typing import List, Dict, Any, Optional
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)

class ClaudeClient:
    """Claude API client for generating compliance rules"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.anthropic.com/v1/messages"
        self.headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
    
    def generate_compliance_rules(self, region: str, domain: str, document_fields: List[Dict]) -> Dict[str, Any]:
        """Generate compliance rules based on region, domain, and document fields"""
        
        # Extract field names for context
        field_names = [field.get('name', '') for field in document_fields if isinstance(field, dict)]
        field_context = ", ".join(field_names[:10])  # Limit to first 10 fields
        
        prompt = f"""
You are a comprehensive compliance expert. Generate a COMPREHENSIVE list of compliance rules for:
- Region: {region}
- Domain: {domain}
- Document Fields: {field_context}

Generate 15-25 specific compliance rules that would apply to this type of document in this region.
Cover ALL major compliance categories: privacy, labor, tax, contract, data protection, employment, termination, notice periods, jurisdiction, force majeure, etc.

Each rule should include:
1. Rule ID (short identifier)
2. Rule Title (descriptive name)
3. Rule Description (what the rule requires)
4. Compliance Check (how to verify compliance)
5. Risk Level (HIGH/MEDIUM/LOW)
6. Category (privacy/labor/tax/contract/etc.)

Format as JSON with this structure:
{{
  "rules": [
    {{
      "id": "rule_id",
      "title": "Rule Title",
      "description": "Detailed rule description",
      "compliance_check": "How to check compliance",
      "risk_level": "HIGH/MEDIUM/LOW",
      "category": "category_name"
    }}
  ]
}}

IMPORTANT: Generate rules for ALL these categories:
- Privacy & Data Protection (GDPR, CCPA, DPDP, etc.)
- Labor & Employment (notice periods, working hours, termination)
- Tax & Financial (withholding, VAT, GST, etc.)
- Contract Terms (jurisdiction, force majeure, liability)
- Industry-Specific (supply chain, manufacturing, etc.)

Make sure to cover both general compliance and {region}-specific requirements for {domain} documents.
"""

        try:
            response = requests.post(
                self.base_url,
                headers=self.headers,
                json={
                    "model": "claude-3-sonnet-20240229",
                    "max_tokens": 2000,
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data.get('content', [{}])[0].get('text', '{}')
                
                # Parse JSON response
                try:
                    rules_data = json.loads(content)
                    return {
                        "success": True,
                        "region": region,
                        "domain": domain,
                        "rules": rules_data.get("rules", []),
                        "generated_at": "2024-01-01T00:00:00Z"  # Simplified timestamp
                    }
                except json.JSONDecodeError:
                    # Fallback if JSON parsing fails
                    return self._create_fallback_rules(region, domain)
            else:
                logger.error(f"Claude API error: {response.status_code}")
                return self._create_fallback_rules(region, domain)
                
        except Exception as e:
            logger.error(f"Error calling Claude API: {e}")
            return self._create_fallback_rules(region, domain)
    
    def _create_fallback_rules(self, region: str, domain: str) -> Dict[str, Any]:
        """Create fallback rules when Claude API is unavailable"""
        
        fallback_rules = {
            "EU": [
                {
                    "id": "eu_gdpr_consent",
                    "title": "GDPR Consent Requirements",
                    "description": "Explicit consent must be obtained for data processing",
                    "compliance_check": "Check for explicit consent clauses",
                    "risk_level": "HIGH",
                    "category": "privacy"
                },
                {
                    "id": "eu_data_minimization",
                    "title": "Data Minimization Principle",
                    "description": "Only collect data necessary for the purpose",
                    "compliance_check": "Verify data collection is limited to purpose",
                    "risk_level": "MEDIUM",
                    "category": "privacy"
                },
                {
                    "id": "eu_employment_notice",
                    "title": "EU Employment Notice Periods",
                    "description": "Adequate notice periods for employment termination",
                    "compliance_check": "Check for proper notice period clauses",
                    "risk_level": "HIGH",
                    "category": "labor"
                },
                {
                    "id": "eu_working_hours",
                    "title": "Working Time Directive",
                    "description": "Compliance with EU working time regulations",
                    "compliance_check": "Verify working hours compliance",
                    "risk_level": "MEDIUM",
                    "category": "labor"
                },
                {
                    "id": "eu_vat_compliance",
                    "title": "VAT Compliance",
                    "description": "Proper VAT handling and reporting",
                    "compliance_check": "Check for VAT compliance clauses",
                    "risk_level": "HIGH",
                    "category": "tax"
                },
                {
                    "id": "eu_jurisdiction",
                    "title": "Jurisdiction and Governing Law",
                    "description": "Clear jurisdiction and governing law clauses",
                    "compliance_check": "Verify jurisdiction clauses",
                    "risk_level": "MEDIUM",
                    "category": "contract"
                },
                {
                    "id": "eu_force_majeure",
                    "title": "Force Majeure Clauses",
                    "description": "Proper force majeure provisions",
                    "compliance_check": "Check for force majeure clauses",
                    "risk_level": "MEDIUM",
                    "category": "contract"
                }
            ],
            "US": [
                {
                    "id": "us_ccpa_privacy",
                    "title": "CCPA Privacy Rights",
                    "description": "California Consumer Privacy Act compliance",
                    "compliance_check": "Check for CCPA compliance clauses",
                    "risk_level": "HIGH",
                    "category": "privacy"
                },
                {
                    "id": "us_labor_notice",
                    "title": "Employment Notice Requirements",
                    "description": "Proper notice periods for employment changes",
                    "compliance_check": "Verify notice period clauses",
                    "risk_level": "MEDIUM",
                    "category": "labor"
                },
                {
                    "id": "us_tax_withholding",
                    "title": "Tax Withholding Requirements",
                    "description": "Proper tax withholding and reporting",
                    "compliance_check": "Check for tax withholding clauses",
                    "risk_level": "HIGH",
                    "category": "tax"
                },
                {
                    "id": "us_employment_law",
                    "title": "Federal Employment Law",
                    "description": "Compliance with federal employment regulations",
                    "compliance_check": "Verify employment law compliance",
                    "risk_level": "HIGH",
                    "category": "labor"
                },
                {
                    "id": "us_jurisdiction",
                    "title": "Jurisdiction and Governing Law",
                    "description": "Clear jurisdiction and governing law clauses",
                    "compliance_check": "Verify jurisdiction clauses",
                    "risk_level": "MEDIUM",
                    "category": "contract"
                },
                {
                    "id": "us_liability",
                    "title": "Liability and Indemnification",
                    "description": "Proper liability and indemnification clauses",
                    "compliance_check": "Check for liability clauses",
                    "risk_level": "MEDIUM",
                    "category": "contract"
                }
            ],
            "IN": [
                {
                    "id": "in_dpdp_consent",
                    "title": "DPDP Act Consent",
                    "description": "Digital Personal Data Protection Act compliance",
                    "compliance_check": "Check for DPDP consent mechanisms",
                    "risk_level": "HIGH",
                    "category": "privacy"
                },
                {
                    "id": "in_labor_law",
                    "title": "Indian Labor Law Compliance",
                    "description": "Industrial Disputes Act and related laws",
                    "compliance_check": "Verify labor law compliance clauses",
                    "risk_level": "MEDIUM",
                    "category": "labor"
                },
                {
                    "id": "in_gst_compliance",
                    "title": "GST Compliance",
                    "description": "Goods and Services Tax compliance",
                    "compliance_check": "Check for GST compliance clauses",
                    "risk_level": "HIGH",
                    "category": "tax"
                },
                {
                    "id": "in_employment_notice",
                    "title": "Employment Notice Periods",
                    "description": "Proper notice periods as per Indian law",
                    "compliance_check": "Verify notice period clauses",
                    "risk_level": "MEDIUM",
                    "category": "labor"
                },
                {
                    "id": "in_jurisdiction",
                    "title": "Jurisdiction and Governing Law",
                    "description": "Clear jurisdiction and governing law clauses",
                    "compliance_check": "Verify jurisdiction clauses",
                    "risk_level": "MEDIUM",
                    "category": "contract"
                }
            ]
        }
        
        return {
            "success": True,
            "region": region,
            "domain": domain,
            "rules": fallback_rules.get(region, fallback_rules["EU"]),
            "generated_at": "2024-01-01T00:00:00Z",
            "fallback": True
        }

# Global instance - API key will be set from environment variable
claude_client = ClaudeClient(os.getenv("CLAUDE_API_KEY", "your-claude-api-key-here"))

def get_claude_client():
    """Get the global Claude client instance"""
    return claude_client
