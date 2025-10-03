"""
Simplified Compliance Engine
Claude + LandingAI ADE + Pathway integration
"""
import logging
from typing import List, Dict, Any, Optional
from claude_client import get_claude_client
from landingai_client import extract_fields
from pathway_pipeline import hybrid_search

logger = logging.getLogger(__name__)

class SimplifiedComplianceEngine:
    """Simplified compliance checking using Claude + LandingAI ADE + Pathway"""
    
    def __init__(self):
        self.claude_client = get_claude_client()
    
    def analyze_document(self, document_path: str, region: str, domain: str = "general") -> Dict[str, Any]:
        """Complete document analysis workflow"""
        
        logger.info(f"Analyzing document: {document_path} for region: {region}, domain: {domain}")
        
        # Step 1: Extract fields using LandingAI ADE
        logger.info("Step 1: Extracting fields with LandingAI ADE")
        fields = extract_fields(document_path)
        field_data = [f.model_dump() if hasattr(f, 'model_dump') else f for f in fields]
        
        # Step 2: Generate rules using Claude
        logger.info("Step 2: Generating rules with Claude")
        if self.claude_client:
            rules_response = self.claude_client.generate_compliance_rules(region, domain, field_data)
        else:
            # Fallback if Claude not available
            from claude_client import ClaudeClient
            temp_client = ClaudeClient("dummy_key")
            rules_response = temp_client._create_fallback_rules(region, domain)
        
        claude_rules = rules_response.get("rules", [])
        
        # Step 3: Use Pathway to find relevant rules
        logger.info("Step 3: Finding relevant rules with Pathway")
        relevant_rules = self._find_relevant_rules_with_pathway(field_data, claude_rules, region)
        
        # Step 4: Enhanced compliance checking with fallback to normal system
        logger.info("Step 4: Enhanced compliance checking")
        compliance_flags = self._enhanced_compliance_check(field_data, relevant_rules, region)
        
        # Step 5: Analyze risk correlations
        logger.info("Step 5: Analyzing risk correlations")
        risk_correlations = self._analyze_risk_correlations(field_data, compliance_flags)
        
        return {
            "document_path": document_path,
            "region": region,
            "domain": domain,
            "extracted_fields": field_data,
            "claude_rules": claude_rules,
            "relevant_rules": relevant_rules,
            "compliance_flags": compliance_flags,
            "risk_correlations": risk_correlations,
            "analysis_timestamp": "2024-01-01T00:00:00Z"
        }
    
    def _find_relevant_rules_with_pathway(self, fields: List[Dict], claude_rules: List[Dict], region: str) -> List[Dict]:
        """Use Pathway to find most relevant rules from Claude's rules"""
        
        relevant_rules = []
        
        for rule in claude_rules:
            try:
                # Search for this rule using Pathway
                query = f"{rule.get('title', '')} {rule.get('description', '')} {region}"
                pathway_results = hybrid_search(query, top_k=3)
                
                if pathway_results:
                    # Rule is relevant if Pathway finds matches
                    rule["pathway_relevance"] = True
                    rule["pathway_score"] = pathway_results[0][1] if pathway_results else 0.0
                    relevant_rules.append(rule)
                else:
                    # Still include rule but mark as low relevance
                    rule["pathway_relevance"] = False
                    rule["pathway_score"] = 0.0
                    relevant_rules.append(rule)
                    
            except Exception as e:
                logger.error(f"Error searching rule with Pathway: {e}")
                # Include rule anyway
                rule["pathway_relevance"] = False
                rule["pathway_score"] = 0.0
                relevant_rules.append(rule)
        
        # Sort by Pathway relevance and score
        relevant_rules.sort(key=lambda x: (x.get("pathway_relevance", False), x.get("pathway_score", 0)), reverse=True)
        
        return relevant_rules[:5]  # Return top 5 most relevant rules
    
    def _enhanced_compliance_check(self, fields: List[Dict], rules: List[Dict], region: str) -> List[Dict]:
        """Enhanced compliance checking with fallback to normal system"""
        
        # First, try Claude-based compliance checking
        claude_flags = self._check_compliance(fields, rules)
        
        # If we don't have enough flags or coverage, fallback to normal system
        if len(claude_flags) < 10:  # Lower threshold to trigger fallback more often
            logger.info("Claude flags insufficient, using normal compliance system as fallback")
            try:
                from checker import check
                from models.schemas import ContractField
                
                # Convert field data to ContractField objects
                contract_fields = []
                for field_data in fields:
                    if isinstance(field_data, dict):
                        contract_field = ContractField(
                            name=field_data.get("name", "unknown"),
                            value=field_data.get("value", ""),
                            evidence=field_data.get("evidence", None)
                        )
                        contract_fields.append(contract_field)
                
                # Run normal compliance check
                normal_flags = check(contract_fields, region)
                
                # Convert normal flags to our format
                enhanced_flags = []
                for flag in normal_flags:
                    enhanced_flag = {
                        "id": flag.id,
                        "rule_id": flag.id,
                        "rule_title": flag.rationale,
                        "field_name": flag.field_name,
                        "field_value": flag.field_value,
                        "risk_level": flag.risk_level,
                        "category": flag.category,
                        "description": flag.rationale,
                        "matches": ["compliance_issue"],
                        "pathway_score": 0.8,  # High confidence for normal system
                        "source": "normal_system"
                    }
                    enhanced_flags.append(enhanced_flag)
                
                # Combine Claude flags with normal system flags
                all_flags = claude_flags + enhanced_flags
                
                # Remove duplicates based on field_name and rule_title
                unique_flags = []
                seen_combinations = set()
                for flag in all_flags:
                    combination = f"{flag['field_name']}_{flag['rule_title']}"
                    if combination not in seen_combinations:
                        unique_flags.append(flag)
                        seen_combinations.add(combination)
                
                logger.info(f"Enhanced compliance check: {len(claude_flags)} Claude flags + {len(enhanced_flags)} normal flags = {len(unique_flags)} total")
                return unique_flags
                
            except Exception as e:
                logger.error(f"Fallback to normal system failed: {e}")
                return claude_flags
        
        return claude_flags
    
    def _check_compliance(self, fields: List[Dict], rules: List[Dict]) -> List[Dict]:
        """Check compliance against rules"""
        
        flags = []
        
        for rule in rules:
            # Simple compliance check - look for rule keywords in field values
            rule_keywords = rule.get("compliance_check", "").lower().split()
            
            for field in fields:
                field_value = str(field.get("value", "")).lower()
                
                # Check if any rule keywords are in the field value
                matches = [keyword for keyword in rule_keywords if keyword in field_value]
                
                if matches:
                    # Create compliance flag
                    flag = {
                        "id": f"{rule.get('id', 'unknown')}_{field.get('name', 'unknown')}",
                        "rule_id": rule.get("id", "unknown"),
                        "rule_title": rule.get("title", "Unknown Rule"),
                        "field_name": field.get("name", "Unknown Field"),
                        "field_value": field.get("value", ""),
                        "risk_level": rule.get("risk_level", "MEDIUM"),
                        "category": rule.get("category", "general"),
                        "description": f"Compliance issue found in {field.get('name', 'field')}: {rule.get('description', '')}",
                        "matches": matches,
                        "pathway_score": rule.get("pathway_score", 0.0),
                        "source": "claude_system"
                    }
                    flags.append(flag)
        
        return flags
    
    def _analyze_risk_correlations(self, fields: List[Dict], flags: List[Dict]) -> List[Dict]:
        """Analyze risk correlations between fields and flags"""
        
        correlations = []
        
        if len(flags) > 1:
            # Group flags by category
            category_groups = {}
            for flag in flags:
                category = flag.get("category", "general")
                if category not in category_groups:
                    category_groups[category] = []
                category_groups[category].append(flag)
            
            # Create correlations for categories with multiple flags
            for category, category_flags in category_groups.items():
                if len(category_flags) > 1:
                    correlation = {
                        "correlation_type": f"{category}_compliance_cluster",
                        "description": f"Multiple {category} compliance issues detected",
                        "risk_level": "HIGH" if len(category_flags) > 2 else "MEDIUM",
                        "affected_fields": [flag.get("field_name") for flag in category_flags],
                        "flag_count": len(category_flags),
                        "category": category
                    }
                    correlations.append(correlation)
        
        return correlations

# Global instance
simplified_engine = SimplifiedComplianceEngine()
