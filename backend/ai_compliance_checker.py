"""
AI-Powered Compliance Checker using LandingAI ADE
Enhanced compliance analysis with semantic understanding
"""

import logging
from typing import List, Dict, Any, Tuple
from models.schemas import ComplianceFlag, Evidence, ContractField
from landingai_client import extract_fields, extract_tables
from retriever import retrieve
from risk_correlation import risk_engine

logger = logging.getLogger(__name__)

class AIComplianceChecker:
    """AI-powered compliance checker using LandingAI ADE and semantic analysis"""
    
    def __init__(self):
        self.compliance_rules = {
            "privacy": {
                "gdpr_requirements": {
                    "description": "GDPR compliance requirements (EU only)",
                    "keywords": ["controller", "processor", "consent", "data subject", "personal data", "gdpr"],
                    "risk_indicators": ["unlimited", "unrestricted", "no consent", "no purpose limitation"],
                    "positive_indicators": ["explicit consent", "purpose limitation", "data minimization"],
                    "regions": ["EU", "UK"]  # Only apply to EU and UK
                },
                "ccpa_requirements": {
                    "description": "CCPA compliance requirements (US only)", 
                    "keywords": ["consumer rights", "opt-out", "data collection", "third party", "ccpa"],
                    "risk_indicators": ["no opt-out", "unlimited sharing", "no disclosure"],
                    "positive_indicators": ["consumer rights", "opt-out mechanism", "data collection notice"],
                    "regions": ["US"]  # Only apply to US
                },
                "indian_privacy_requirements": {
                    "description": "Indian privacy law requirements (India only)",
                    "keywords": ["personal data", "data protection", "consent", "indian privacy"],
                    "risk_indicators": ["no consent", "unlimited use", "no data protection"],
                    "positive_indicators": ["explicit consent", "data protection measures", "privacy notice"],
                    "regions": ["IN"]  # Only apply to India
                }
            },
            "labor": {
                "eu_labor_requirements": {
                    "description": "EU labor law requirements (EU only)",
                    "keywords": ["notice period", "termination", "employment", "working hours", "eu labor"],
                    "risk_indicators": ["no notice", "insufficient notice", "immediate termination"],
                    "positive_indicators": ["adequate notice", "statutory minimum", "reasonable period"],
                    "regions": ["EU", "UK"]
                },
                "us_labor_requirements": {
                    "description": "US labor law requirements (US only)",
                    "keywords": ["notice period", "termination", "employment", "working hours", "us labor"],
                    "risk_indicators": ["no notice", "insufficient notice", "immediate termination"],
                    "positive_indicators": ["adequate notice", "statutory minimum", "reasonable period"],
                    "regions": ["US"]
                },
                "indian_labor_requirements": {
                    "description": "Indian labor law requirements (India only)",
                    "keywords": ["notice period", "termination", "employment", "working hours", "indian labor"],
                    "risk_indicators": ["no notice", "insufficient notice", "immediate termination"],
                    "positive_indicators": ["adequate notice", "statutory minimum", "reasonable period"],
                    "regions": ["IN"]
                }
            },
            "tax": {
                "eu_tax_requirements": {
                    "description": "EU tax requirements (VAT) (EU only)",
                    "keywords": ["vat", "tax", "reporting", "compliance", "eu tax"],
                    "risk_indicators": ["no vat", "incorrect rates", "no reporting"],
                    "positive_indicators": ["proper vat", "correct rates", "timely reporting"],
                    "regions": ["EU", "UK"]
                },
                "us_tax_requirements": {
                    "description": "US tax withholding requirements (US only)",
                    "keywords": ["withholding", "tax", "reporting", "compliance", "us tax"],
                    "risk_indicators": ["no withholding", "incorrect rates", "no reporting"],
                    "positive_indicators": ["proper withholding", "correct rates", "timely reporting"],
                    "regions": ["US"]
                },
                "indian_tax_requirements": {
                    "description": "Indian tax requirements (GST) (India only)",
                    "keywords": ["gst", "tax", "reporting", "compliance", "indian tax"],
                    "risk_indicators": ["no gst", "incorrect rates", "no reporting"],
                    "positive_indicators": ["proper gst", "correct rates", "timely reporting"],
                    "regions": ["IN"]
                }
            }
        }
    
    def check_compliance_ai(self, fields: List[ContractField], region: str) -> List[ComplianceFlag]:
        """AI-powered compliance checking using LandingAI ADE and semantic analysis"""
        
        flags = []
        processed_combinations = set()  # Track processed field-rule combinations
        
        # Get region-specific rule categories
        region_categories = self._get_region_specific_categories(region)
        
        # Only apply rules relevant to the selected region
        for category in region_categories:
            if category not in self.compliance_rules:
                continue
                
            # Filter rules by region
            region_specific_rules = self._filter_rules_by_region(self.compliance_rules[category], region)
            if not region_specific_rules:
                continue
                
            rule_hits = retrieve(category, region, top_k=3)
            if not rule_hits:
                continue
                
            # Analyze each field against AI-enhanced rules (avoid duplicates)
            for field in fields:
                field_flags = self._analyze_field_ai_unique(field, category, region_specific_rules, rule_hits, region, processed_combinations)
                flags.extend(field_flags)
        
        # Add AI-powered risk correlation analysis
        risk_correlations = risk_engine.analyze_cross_document_risks(fields, region)
        for correlation in risk_correlations:
            if correlation.get("risk_level") in ["HIGH", "MEDIUM"]:
                flags.append(ComplianceFlag(
                    id=f"ai-risk-{correlation['correlation_type']}",
                    category="ai_analysis",
                    region=region,
                    risk_level=correlation["risk_level"],
                    rationale=f"AI-detected {correlation['correlation_type']}: {correlation['description']}",
                    contract_evidence=Evidence(file="ai_analysis", page=0, section="risk_correlation"),
                    rule_evidence=Evidence(file="ai_engine", section="correlation_analysis")
                ))
        
        return flags
    
    def _filter_rules_by_region(self, rules: Dict, region: str) -> Dict:
        """Filter rules to only include those applicable to the specified region"""
        
        region_upper = region.upper()
        filtered_rules = {}
        
        for rule_name, rule_config in rules.items():
            # Check if rule has region restrictions
            if "regions" in rule_config:
                if region_upper in rule_config["regions"]:
                    filtered_rules[rule_name] = rule_config
            else:
                # If no region restriction, apply to all regions
                filtered_rules[rule_name] = rule_config
        
        return filtered_rules
    
    def _get_region_specific_categories(self, region: str) -> List[str]:
        """Get rule categories that are relevant for the specific region"""
        
        region_upper = region.upper()
        
        if region_upper == "EU":
            # EU-specific: GDPR privacy, EU labor law, EU tax (VAT)
            return ["privacy", "labor", "tax"]
        elif region_upper == "US":
            # US-specific: CCPA privacy, US labor law, US tax withholding
            return ["privacy", "labor", "tax"]
        elif region_upper == "IN":
            # India-specific: Indian privacy law, Indian labor law, GST
            return ["privacy", "labor", "tax"]
        elif region_upper == "UK":
            # UK-specific: UK GDPR, UK employment law, UK tax
            return ["privacy", "labor", "tax"]
        else:
            # Default: apply all categories
            return ["privacy", "labor", "tax"]
    
    def _analyze_field_ai_unique(self, field: ContractField, category: str, rules: Dict, 
                                 rule_hits: List[Tuple], region: str, processed_combinations: set) -> List[ComplianceFlag]:
        """AI-powered analysis of a single field with duplicate prevention"""
        
        flags = []
        field_text = f"{field.name} {field.value}".lower()
        
        # Get the most relevant rule text
        rule_text = rule_hits[0][0] if rule_hits else ""
        
        # Analyze against each rule type (only once per field-category combination)
        for rule_name, rule_config in rules.items():
            combination_key = f"{field.name}-{category}-{rule_name}"
            
            if combination_key in processed_combinations:
                continue
                
            processed_combinations.add(combination_key)
            
            analysis = self._semantic_analysis(field_text, rule_text, rule_config)
            
            if analysis["has_issues"]:
                flags.append(ComplianceFlag(
                    id=f"{category}-{field.name}-{rule_name}",
                    category=category,
                    region=region,
                    risk_level=analysis["risk_level"],
                    rationale=f"AI Analysis: {analysis['explanation']}",
                    contract_evidence=field.evidence,
                    rule_evidence=Evidence(file="ai_enhanced_rules", section=rule_name)
                ))
        
        return flags
    
    def _analyze_field_ai(self, field: ContractField, category: str, rules: Dict, 
                         rule_hits: List[Tuple], region: str) -> List[ComplianceFlag]:
        """AI-powered analysis of a single field (legacy method)"""
        
        flags = []
        field_text = f"{field.name} {field.value}".lower()
        
        # Get the most relevant rule text
        rule_text = rule_hits[0][0] if rule_hits else ""
        
        # Analyze against each rule type
        for rule_name, rule_config in rules.items():
            analysis = self._semantic_analysis(field_text, rule_text, rule_config)
            
            if analysis["has_issues"]:
                flags.append(ComplianceFlag(
                    id=f"{category}-{field.name}-{rule_name}",
                    category=category,
                    region=region,
                    risk_level=analysis["risk_level"],
                    rationale=f"AI Analysis: {analysis['explanation']}",
                    contract_evidence=field.evidence,
                    rule_evidence=Evidence(file="ai_enhanced_rules", section=rule_name)
                ))
        
        return flags
    
    def _semantic_analysis(self, field_text: str, rule_text: str, rule_config: Dict) -> Dict[str, Any]:
        """Perform semantic analysis of field against rule"""
        
        # Check for risk indicators
        risk_indicators_found = []
        for indicator in rule_config.get("risk_indicators", []):
            if indicator.lower() in field_text:
                risk_indicators_found.append(indicator)
        
        # Check for positive indicators
        positive_indicators_found = []
        for indicator in rule_config.get("positive_indicators", []):
            if indicator.lower() in field_text:
                positive_indicators_found.append(indicator)
        
        # Determine risk level and explanation
        if risk_indicators_found and not positive_indicators_found:
            return {
                "has_issues": True,
                "risk_level": "HIGH",
                "explanation": f"Risk indicators found: {', '.join(risk_indicators_found)}. Missing positive indicators."
            }
        elif risk_indicators_found and positive_indicators_found:
            return {
                "has_issues": True,
                "risk_level": "MEDIUM", 
                "explanation": f"Mixed signals: risk indicators ({', '.join(risk_indicators_found)}) but also positive indicators ({', '.join(positive_indicators_found)})"
            }
        elif not positive_indicators_found:
            return {
                "has_issues": True,
                "risk_level": "MEDIUM",
                "explanation": f"Missing positive compliance indicators: {', '.join(rule_config.get('positive_indicators', []))}"
            }
        else:
            return {
                "has_issues": False,
                "risk_level": "LOW",
                "explanation": f"Good compliance indicators found: {', '.join(positive_indicators_found)}"
            }
    
    def extract_tables_for_compliance(self, contract_path: str) -> List[Dict[str, Any]]:
        """Extract tables using LandingAI ADE for compliance analysis"""
        
        try:
            tables = extract_tables(contract_path)
            compliance_tables = []
            
            for table in tables:
                # Analyze table for compliance indicators
                table_analysis = self._analyze_table_compliance(table)
                if table_analysis["compliance_issues"]:
                    compliance_tables.append({
                        "table": table,
                        "analysis": table_analysis,
                        "contract_path": contract_path
                    })
            
            return compliance_tables
            
        except Exception as e:
            logger.error(f"Table extraction failed: {e}")
            return []
    
    def _analyze_table_compliance(self, table: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze extracted table for compliance issues"""
        
        headers = table.get("headers", [])
        rows = table.get("rows", [])
        
        compliance_issues = []
        
        # Look for compliance-related headers
        compliance_headers = ["compliance", "requirement", "status", "deadline", "penalty"]
        for header in headers:
            if any(comp in header.lower() for comp in compliance_headers):
                compliance_issues.append(f"Compliance-related table found: {header}")
        
        # Look for risk indicators in table data
        for row in rows:
            for cell in row:
                if isinstance(cell, str):
                    if any(risk in cell.lower() for risk in ["non-compliant", "violation", "penalty", "fine"]):
                        compliance_issues.append(f"Risk indicator in table: {cell}")
        
        return {
            "compliance_issues": compliance_issues,
            "risk_level": "HIGH" if len(compliance_issues) > 2 else "MEDIUM" if compliance_issues else "LOW"
        }

# Global instance
ai_compliance_checker = AIComplianceChecker()
