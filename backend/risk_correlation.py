"""
Risk Correlation Engine
Analyzes cross-document risk patterns and hidden connections
This is a novel feature that goes beyond basic compliance checking
"""
import logging
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime
from models.schemas import ContractField, ComplianceFlag, Evidence
from pathway_pipeline import hybrid_search

logger = logging.getLogger(__name__)

class RiskCorrelationEngine:
    """Analyzes risk patterns across multiple documents and time periods"""
    
    def __init__(self):
        self.correlation_rules = {
            "supplier_risk": {
                "description": "Detect supplier-related risks across documents",
                "patterns": ["supplier", "vendor", "third-party", "subcontractor"],
                "risk_indicators": ["adverse media", "sanctions", "litigation"]
            },
            "jurisdiction_conflict": {
                "description": "Identify conflicting jurisdiction requirements",
                "patterns": ["governing law", "jurisdiction", "applicable law"],
                "risk_indicators": ["conflict", "contradiction", "incompatible"]
            },
            "data_flow_risk": {
                "description": "Track data flow risks across documents",
                "patterns": ["data transfer", "personal data", "cross-border"],
                "risk_indicators": ["gdpr", "ccpa", "privacy", "consent"]
            },
            "financial_risk": {
                "description": "Correlate financial risks across documents",
                "patterns": ["payment", "liability", "indemnification", "insurance"],
                "risk_indicators": ["unlimited", "uncapped", "excessive", "penalty"]
            }
        }
    
    def analyze_cross_document_risks(self, fields: List[ContractField], region: str) -> List[Dict[str, Any]]:
        """
        Analyze risks across multiple documents to find hidden correlations
        """
        logger.info(f"Analyzing cross-document risks for region: {region}")
        
        correlations = []
        
        # Analyze each correlation rule
        for rule_name, rule_config in self.correlation_rules.items():
            correlation = self._analyze_rule_correlation(fields, rule_name, rule_config, region)
            if correlation:
                correlations.append(correlation)
        
        # Analyze temporal patterns
        temporal_risks = self._analyze_temporal_patterns(fields, region)
        correlations.extend(temporal_risks)
        
        # Analyze jurisdiction conflicts
        jurisdiction_conflicts = self._analyze_jurisdiction_conflicts(fields, region)
        correlations.extend(jurisdiction_conflicts)
        
        logger.info(f"Found {len(correlations)} risk correlations")
        return correlations
    
    def _analyze_rule_correlation(self, fields: List[ContractField], rule_name: str, 
                                rule_config: Dict[str, Any], region: str) -> Optional[Dict[str, Any]]:
        """Analyze correlation for a specific rule"""
        
        # Find fields that match the patterns
        matching_fields = []
        for field in fields:
            field_text = f"{field.name} {field.value}".lower()
            for pattern in rule_config["patterns"]:
                if pattern.lower() in field_text:
                    matching_fields.append(field)
                    break
        
        if not matching_fields:
            return None
        
        # Check for risk indicators
        risk_indicators_found = []
        for field in matching_fields:
            field_text = f"{field.name} {field.value}".lower()
            for indicator in rule_config["risk_indicators"]:
                if indicator.lower() in field_text:
                    risk_indicators_found.append({
                        "indicator": indicator,
                        "field": field.name,
                        "value": field.value,
                        "evidence": field.evidence
                    })
        
        if risk_indicators_found:
            return {
                "correlation_type": rule_name,
                "description": rule_config["description"],
                "risk_level": "HIGH" if len(risk_indicators_found) > 2 else "MEDIUM",
                "matching_fields": len(matching_fields),
                "risk_indicators": risk_indicators_found,
                "region": region,
                "confidence": min(0.9, 0.5 + (len(risk_indicators_found) * 0.1))
            }
        
        return None
    
    def _analyze_temporal_patterns(self, fields: List[ContractField], region: str) -> List[Dict[str, Any]]:
        """Analyze temporal risk patterns"""
        temporal_risks = []
        
        # Look for time-sensitive clauses
        time_sensitive_fields = []
        for field in fields:
            if any(keyword in field.value.lower() for keyword in ["notice", "termination", "renewal", "expiry"]):
                time_sensitive_fields.append(field)
        
        if len(time_sensitive_fields) > 1:
            # Check for conflicting time periods
            notice_periods = []
            for field in time_sensitive_fields:
                if "notice" in field.name.lower() or "termination" in field.name.lower():
                    notice_periods.append(field)
            
            if len(notice_periods) > 1:
                # Extract plain text from field values (handle Chunk objects)
                processed_fields = []
                for f in notice_periods:
                    field_value = f.value
                    # If it's a Chunk object, extract the text content
                    if hasattr(field_value, 'markdown'):
                        field_value = field_value.markdown
                    elif hasattr(field_value, 'text'):
                        field_value = field_value.text
                    elif isinstance(field_value, str) and 'Chunk(' in field_value:
                        # Extract text from Chunk string representation
                        import re
                        markdown_match = re.search(r'markdown="([^"]*)"', str(field_value))
                        if markdown_match:
                            field_value = markdown_match.group(1)
                        else:
                            field_value = str(field_value)[:200] + "..." if len(str(field_value)) > 200 else str(field_value)
                    
                    # Clean up the text content
                    if isinstance(field_value, str):
                        # Remove HTML tags and clean up the text
                        import re
                        field_value = re.sub(r'<[^>]*>', '', field_value)  # Remove HTML tags
                        field_value = re.sub(r'<a[^>]*>', '', field_value)  # Remove anchor tags
                        field_value = re.sub(r'</a>', '', field_value)     # Remove closing anchor tags
                        field_value = re.sub(r'\n+', ' ', field_value)     # Replace multiple newlines with space
                        field_value = re.sub(r'\s+', ' ', field_value)     # Replace multiple spaces with single space
                        field_value = field_value.strip()
                        
                        # Truncate if too long
                        if len(field_value) > 300:
                            field_value = field_value[:300] + "..."
                    
                    processed_fields.append({
                        "name": f.name, 
                        "value": field_value
                    })
                
                temporal_risks.append({
                    "correlation_type": "temporal_conflict",
                    "description": "Conflicting notice periods found across documents",
                    "risk_level": "MEDIUM",
                    "fields": processed_fields,
                    "region": region,
                    "confidence": 0.7
                })
        
        return temporal_risks
    
    def _analyze_jurisdiction_conflicts(self, fields: List[ContractField], region: str) -> List[Dict[str, Any]]:
        """Analyze jurisdiction conflicts"""
        jurisdiction_conflicts = []
        
        # Find jurisdiction-related fields
        jurisdiction_fields = []
        for field in fields:
            if any(keyword in field.name.lower() for keyword in ["jurisdiction", "governing", "law", "legal"]):
                jurisdiction_fields.append(field)
        
        if len(jurisdiction_fields) > 1:
            # Check for conflicting jurisdictions
            jurisdictions = set()
            for field in jurisdiction_fields:
                value = field.value.lower()
                if any(jurisdiction in value for jurisdiction in ["eu", "us", "uk", "germany", "france", "california", "new york"]):
                    jurisdictions.add(field.value)
            
            if len(jurisdictions) > 1:
                jurisdiction_conflicts.append({
                    "correlation_type": "jurisdiction_conflict",
                    "description": "Multiple jurisdictions found - potential legal conflicts",
                    "risk_level": "HIGH",
                    "jurisdictions": list(jurisdictions),
                    "region": region,
                    "confidence": 0.8
                })
        
        return jurisdiction_conflicts
    
    def get_risk_summary(self, correlations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a risk summary from correlations"""
        if not correlations:
            return {
                "overall_risk": "LOW",
                "total_correlations": 0,
                "high_risk_count": 0,
                "medium_risk_count": 0,
                "recommendations": ["No significant risk correlations found"]
            }
        
        high_risk = len([c for c in correlations if c.get("risk_level") == "HIGH"])
        medium_risk = len([c for c in correlations if c.get("risk_level") == "MEDIUM"])
        
        overall_risk = "HIGH" if high_risk > 0 else "MEDIUM" if medium_risk > 0 else "LOW"
        
        recommendations = []
        if high_risk > 0:
            recommendations.append("Immediate review required for high-risk correlations")
        if medium_risk > 0:
            recommendations.append("Consider reviewing medium-risk correlations")
        
        return {
            "overall_risk": overall_risk,
            "total_correlations": len(correlations),
            "high_risk_count": high_risk,
            "medium_risk_count": medium_risk,
            "recommendations": recommendations,
            "correlations": correlations
        }

# Global instance
risk_engine = RiskCorrelationEngine()
