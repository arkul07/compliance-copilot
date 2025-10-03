"""
Smart Document Auto-Correction System
Uses Claude AI, LandingAI ADE and Pathway to intelligently correct compliance issues
"""
import logging
import json
import os
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from datetime import datetime
from landingai_client import extract_fields, extract_tables
from pathway_pipeline import hybrid_search
from retriever import retrieve
from ai_compliance_checker import ai_compliance_checker
from risk_correlation import risk_engine
from claude_client import claude_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class SmartDocumentCorrector:
    """AI-powered document correction using LandingAI ADE and Pathway"""
    
    def __init__(self):
        self.correction_rules = {
            "privacy": {
                "gdpr_consent": {
                    "pattern": r"consent|agreement|permission",
                    "correction": "explicit consent",
                    "template": "The data subject has provided explicit, informed, and unambiguous consent for the processing of their personal data for the specified purpose."
                },
                "data_minimization": {
                    "pattern": r"data collection|personal information",
                    "correction": "data minimization",
                    "template": "Only personal data that is necessary for the specified purpose shall be collected and processed."
                }
            },
            "labor": {
                "notice_period": {
                    "pattern": r"termination|notice",
                    "correction": "adequate notice period",
                    "template": "Either party may terminate this agreement with [X] days written notice."
                },
                "working_hours": {
                    "pattern": r"working hours|overtime",
                    "correction": "compliant working hours",
                    "template": "Working hours shall comply with applicable labor laws and regulations."
                }
            },
            "tax": {
                "withholding": {
                    "pattern": r"tax|withholding",
                    "correction": "proper tax withholding",
                    "template": "All applicable taxes shall be withheld and remitted in accordance with local tax regulations."
                }
            }
        }
    
    def analyze_document_for_corrections(self, document_path: str, region: str) -> Dict[str, Any]:
        """Analyze document and identify correction opportunities"""
        logger.info(f"Analyzing document for corrections: {document_path}")
        
        # Step 1: Extract document structure using LandingAI ADE
        fields = extract_fields(document_path)
        tables = extract_tables(document_path)
        
        # Step 2: Run compliance analysis
        compliance_flags = ai_compliance_checker.check_compliance_ai(fields, region)
        risk_correlations = risk_engine.analyze_cross_document_risks(fields, region)
        
        # Step 3: Identify correction opportunities
        correction_opportunities = self._identify_correction_opportunities(
            fields, compliance_flags, risk_correlations, region
        )
        
        return {
            "document_path": document_path,
            "region": region,
            "fields": [f.model_dump() for f in fields],
            "tables": tables,
            "compliance_flags": [f.model_dump() for f in compliance_flags],
            "risk_correlations": risk_correlations,
            "correction_opportunities": correction_opportunities,
            "analysis_timestamp": datetime.now().isoformat()
        }
    
    def _identify_correction_opportunities(self, fields: List, compliance_flags: List, 
                                         risk_correlations: List, region: str) -> List[Dict[str, Any]]:
        """Identify specific correction opportunities"""
        opportunities = []
        
        # Analyze compliance flags for correction opportunities
        for flag in compliance_flags:
            if flag.risk_level in ["HIGH", "MEDIUM"]:
                correction = self._generate_correction_for_flag(flag, region)
                if correction:
                    opportunities.append(correction)
        
        # Analyze risk correlations for correction opportunities
        for correlation in risk_correlations:
            if correlation.get("risk_level") in ["HIGH", "MEDIUM"]:
                correction = self._generate_correction_for_correlation(correlation, region)
                if correction:
                    opportunities.append(correction)
        
        return opportunities
    
    def _generate_correction_for_flag(self, flag, region: str) -> Optional[Dict[str, Any]]:
        """Generate correction for a compliance flag using Claude AI"""
        category = flag.category
        risk_level = flag.risk_level
        
        # Use Claude to generate intelligent correction suggestions
        claude_correction = self._get_claude_correction_for_flag(flag, region)
        
        if claude_correction:
            return claude_correction
        
        # Fallback to rule-based correction
        correction_rules = self._search_correction_rules(category, region)
        
        if not correction_rules:
            return None
        
        # Generate correction suggestion
        correction = {
            "type": "compliance_flag_correction",
            "flag_id": flag.id,
            "category": category,
            "risk_level": risk_level,
            "original_text": flag.rationale,
            "correction_suggestion": correction_rules[0]["correction"],
            "correction_template": correction_rules[0]["template"],
            "confidence": 0.6,
            "location": flag.contract_evidence.model_dump() if flag.contract_evidence else None,
            "reason": f"Compliance issue detected: {flag.rationale}",
            "ai_generated": False
        }
        
        return correction
    
    def _generate_correction_for_correlation(self, correlation: Dict, region: str) -> Optional[Dict[str, Any]]:
        """Generate correction for a risk correlation"""
        correlation_type = correlation.get("correlation_type")
        risk_level = correlation.get("risk_level")
        
        # Search for correction rules using Pathway
        correction_rules = self._search_correction_rules(correlation_type, region)
        
        if not correction_rules:
            return None
        
        # Generate correction suggestion
        correction = {
            "type": "risk_correlation_correction",
            "correlation_type": correlation_type,
            "risk_level": risk_level,
            "original_description": correlation.get("description"),
            "correction_suggestion": correction_rules[0]["correction"],
            "correction_template": correction_rules[0]["template"],
            "confidence": 0.7,
            "affected_fields": correlation.get("fields", []),
            "reason": f"Risk correlation detected: {correlation.get('description')}"
        }
        
        return correction
    
    def _search_correction_rules(self, category: str, region: str) -> List[Dict[str, Any]]:
        """Search for correction rules using Pathway"""
        try:
            # Use Pathway to search for correction rules
            query = f"{category} correction template {region}"
            results = hybrid_search(query, top_k=5)
            
            correction_rules = []
            for rule_text, score in results:
                correction_rules.append({
                    "rule_text": rule_text,
                    "score": score,
                    "correction": self._extract_correction_from_rule(rule_text),
                    "template": self._extract_template_from_rule(rule_text)
                })
            
            return correction_rules
        except Exception as e:
            logger.error(f"Error searching correction rules: {e}")
            return []
    
    def _extract_correction_from_rule(self, rule_text: str) -> str:
        """Extract correction suggestion from rule text"""
        # Simple extraction logic - can be enhanced with AI
        if "consent" in rule_text.lower():
            return "Add explicit consent clause"
        elif "notice" in rule_text.lower():
            return "Specify adequate notice period"
        elif "tax" in rule_text.lower():
            return "Add proper tax withholding clause"
        else:
            return "Review and update clause for compliance"
    
    def _extract_template_from_rule(self, rule_text: str) -> str:
        """Extract correction template from rule text"""
        # Simple template extraction - can be enhanced with AI
        if "consent" in rule_text.lower():
            return "The data subject has provided explicit, informed, and unambiguous consent for the processing of their personal data."
        elif "notice" in rule_text.lower():
            return "Either party may terminate this agreement with adequate written notice as required by applicable law."
        elif "tax" in rule_text.lower():
            return "All applicable taxes shall be withheld and remitted in accordance with local tax regulations."
        else:
            return "This clause shall comply with all applicable laws and regulations."
    
    def generate_corrected_document(self, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate corrected document with tracked changes"""
        logger.info("Generating corrected document")
        
        corrections = analysis_result["correction_opportunities"]
        document_path = analysis_result["document_path"]
        
        # Create corrected document content
        corrected_content = self._apply_corrections_to_document(document_path, corrections)
        
        # Generate change summary
        change_summary = self._generate_change_summary(corrections)
        
        # Create corrected document metadata
        corrected_document = {
            "original_path": document_path,
            "corrected_content": corrected_content,
            "changes_applied": len(corrections),
            "change_summary": change_summary,
            "corrections": corrections,
            "generation_timestamp": datetime.now().isoformat(),
            "region": analysis_result["region"]
        }
        
        return corrected_document
    
    def _apply_corrections_to_document(self, document_path: str, corrections: List[Dict]) -> str:
        """Apply corrections to document content"""
        # Read original document content
        with open(document_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Apply corrections (simplified - in real implementation, would use proper document processing)
        corrected_content = content
        
        for correction in corrections:
            # Add correction as comment/annotation
            correction_comment = f"\n\n<!-- CORRECTION: {correction['correction_suggestion']} -->\n<!-- TEMPLATE: {correction['correction_template']} -->\n"
            corrected_content += correction_comment
        
        return corrected_content
    
    def _generate_change_summary(self, corrections: List[Dict]) -> Dict[str, Any]:
        """Generate summary of changes made"""
        summary = {
            "total_corrections": len(corrections),
            "high_priority_corrections": len([c for c in corrections if c.get("risk_level") == "HIGH"]),
            "medium_priority_corrections": len([c for c in corrections if c.get("risk_level") == "MEDIUM"]),
            "categories": list(set([c.get("category", "unknown") for c in corrections])),
            "correction_types": list(set([c.get("type") for c in corrections]))
        }
        
        return summary
    
    def _get_claude_correction_for_flag(self, flag, region: str) -> Optional[Dict[str, Any]]:
        """Use Claude AI to generate intelligent correction suggestions for compliance flags"""
        try:
            # Prepare context for Claude
            context = {
                "flag_details": {
                    "category": flag.category,
                    "risk_level": flag.risk_level,
                    "rationale": flag.rationale,
                    "field_name": flag.field_name if hasattr(flag, 'field_name') else None,
                    "field_value": flag.field_value if hasattr(flag, 'field_value') else None
                },
                "region": region,
                "contract_evidence": flag.contract_evidence.model_dump() if flag.contract_evidence else None
            }
            
            # Create prompt for Claude
            prompt = f"""
            You are a legal compliance expert specializing in {region} regulations. 
            
            COMPLIANCE ISSUE DETECTED:
            - Category: {context['flag_details']['category']}
            - Risk Level: {context['flag_details']['risk_level']}
            - Issue: {context['flag_details']['rationale']}
            - Field: {context['flag_details']['field_name']} = {context['flag_details']['field_value']}
            - Region: {region}
            
            Please provide a detailed correction suggestion that includes:
            1. Specific language to add/modify in the contract
            2. Legal reasoning for the correction
            3. Compliance requirements that must be met
            4. Suggested clause or amendment text
            5. Implementation guidance
            
            Format your response as JSON with these fields:
            - correction_suggestion: Brief description of what needs to be changed
            - detailed_explanation: Legal reasoning and requirements
            - suggested_clause: Specific text to add/modify
            - implementation_notes: How to implement the correction
            - confidence_score: 0.0-1.0 confidence in the suggestion
            - priority_level: HIGH/MEDIUM/LOW priority for the correction
            """
            
            # Call Claude API
            response = claude_client.generate_compliance_rules(
                region=region,
                domain="contract_correction",
                document_fields=[context['flag_details']]
            )
            
            # Parse Claude's response
            if response and not response.get("fallback", False):
                claude_rules = response.get("rules", [])
                if claude_rules:
                    # Use the first rule as the correction suggestion
                    rule = claude_rules[0]
                    
                    correction = {
                        "type": "claude_ai_correction",
                        "flag_id": flag.id,
                        "category": flag.category,
                        "risk_level": flag.risk_level,
                        "original_text": flag.rationale,
                        "correction_suggestion": rule.get("description", "AI-generated correction"),
                        "detailed_explanation": rule.get("description", ""),
                        "suggested_clause": rule.get("description", ""),
                        "implementation_notes": f"Apply this correction to address {flag.category} compliance requirements",
                        "confidence": 0.9,
                        "priority_level": "HIGH" if flag.risk_level == "HIGH" else "MEDIUM",
                        "location": context['contract_evidence'],
                        "reason": f"AI-generated correction for: {flag.rationale}",
                        "ai_generated": True,
                        "claude_rule_id": rule.get("id", "unknown")
                    }
                    
                    return correction
            
        except Exception as e:
            logger.error(f"Error getting Claude correction for flag: {e}")
        
        return None
    
    def _get_claude_correction_for_correlation(self, correlation: Dict, region: str) -> Optional[Dict[str, Any]]:
        """Use Claude AI to generate intelligent correction suggestions for risk correlations"""
        try:
            # Prepare context for Claude
            context = {
                "correlation_details": correlation,
                "region": region
            }
            
            # Create prompt for Claude
            prompt = f"""
            You are a legal compliance expert specializing in {region} regulations.
            
            RISK CORRELATION DETECTED:
            - Type: {correlation.get('correlation_type', 'unknown')}
            - Risk Level: {correlation.get('risk_level', 'unknown')}
            - Description: {correlation.get('description', 'No description')}
            - Affected Fields: {correlation.get('fields', [])}
            - Region: {region}
            
            Please provide a detailed correction suggestion that addresses this risk correlation.
            Include specific language, legal reasoning, and implementation guidance.
            
            Format your response as JSON with these fields:
            - correction_suggestion: Brief description of what needs to be changed
            - detailed_explanation: Legal reasoning and requirements
            - suggested_clause: Specific text to add/modify
            - implementation_notes: How to implement the correction
            - confidence_score: 0.0-1.0 confidence in the suggestion
            - priority_level: HIGH/MEDIUM/LOW priority for the correction
            """
            
            # Call Claude API
            response = claude_client.generate_compliance_rules(
                region=region,
                domain="risk_correlation_correction",
                document_fields=[context['correlation_details']]
            )
            
            # Parse Claude's response
            if response and not response.get("fallback", False):
                claude_rules = response.get("rules", [])
                if claude_rules:
                    # Use the first rule as the correction suggestion
                    rule = claude_rules[0]
                    
                    correction = {
                        "type": "claude_ai_correlation_correction",
                        "correlation_type": correlation.get("correlation_type"),
                        "risk_level": correlation.get("risk_level"),
                        "original_description": correlation.get("description"),
                        "correction_suggestion": rule.get("description", "AI-generated correlation correction"),
                        "detailed_explanation": rule.get("description", ""),
                        "suggested_clause": rule.get("description", ""),
                        "implementation_notes": f"Apply this correction to address {correlation.get('correlation_type')} risk correlation",
                        "confidence": 0.85,
                        "priority_level": "HIGH" if correlation.get("risk_level") == "HIGH" else "MEDIUM",
                        "affected_fields": correlation.get("fields", []),
                        "reason": f"AI-generated correction for risk correlation: {correlation.get('description')}",
                        "ai_generated": True,
                        "claude_rule_id": rule.get("id", "unknown")
                    }
                    
                    return correction
            
        except Exception as e:
            logger.error(f"Error getting Claude correction for correlation: {e}")
        
        return None
    
    def generate_smart_corrections_summary(self, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a comprehensive summary of smart corrections using Claude"""
        try:
            corrections = analysis_result.get("correction_opportunities", [])
            
            # Prepare context for Claude summary
            context = {
                "total_corrections": len(corrections),
                "ai_corrections": len([c for c in corrections if c.get("ai_generated", False)]),
                "rule_corrections": len([c for c in corrections if not c.get("ai_generated", False)]),
                "high_priority": len([c for c in corrections if c.get("priority_level") == "HIGH"]),
                "medium_priority": len([c for c in corrections if c.get("priority_level") == "MEDIUM"]),
                "categories": list(set([c.get("category", "unknown") for c in corrections])),
                "region": analysis_result.get("region", "unknown")
            }
            
            # Create prompt for Claude summary
            prompt = f"""
            You are a legal compliance expert. Generate a comprehensive summary of document corrections.
            
            CORRECTION ANALYSIS:
            - Total Corrections: {context['total_corrections']}
            - AI-Generated: {context['ai_corrections']}
            - Rule-Based: {context['rule_corrections']}
            - High Priority: {context['high_priority']}
            - Medium Priority: {context['medium_priority']}
            - Categories: {', '.join(context['categories'])}
            - Region: {context['region']}
            
            Provide a professional summary including:
            1. Executive summary of compliance issues found
            2. Priority recommendations for immediate action
            3. Legal implications of not addressing these issues
            4. Implementation roadmap for corrections
            5. Risk assessment of current document state
            
            Format as JSON with fields:
            - executive_summary: Brief overview
            - priority_recommendations: List of high-priority actions
            - legal_implications: Legal risks and consequences
            - implementation_roadmap: Step-by-step implementation plan
            - risk_assessment: Current risk level and mitigation
            - compliance_score: 0-100 score for current compliance level
            """
            
            # Call Claude API for summary
            response = claude_client.generate_compliance_rules(
                region=context['region'],
                domain="correction_summary",
                document_fields=[context]
            )
            
            if response and not response.get("fallback", False):
                claude_rules = response.get("rules", [])
                if claude_rules:
                    # Use Claude's response as the summary
                    summary = {
                        "executive_summary": claude_rules[0].get("description", "AI-generated compliance correction summary"),
                        "priority_recommendations": [
                            f"Address {cat} compliance issues" for cat in context['categories']
                        ],
                        "legal_implications": "Non-compliance may result in regulatory penalties and legal risks",
                        "implementation_roadmap": [
                            "1. Review high-priority corrections",
                            "2. Implement suggested clauses",
                            "3. Validate compliance with legal team",
                            "4. Update document and re-analyze"
                        ],
                        "risk_assessment": "HIGH" if context['high_priority'] > 0 else "MEDIUM",
                        "compliance_score": max(0, 100 - (context['total_corrections'] * 10)),
                        "ai_enhanced": True,
                        "generation_timestamp": datetime.now().isoformat()
                    }
                    
                    return summary
            
        except Exception as e:
            logger.error(f"Error generating smart corrections summary: {e}")
        
        # Fallback to basic summary
        return {
            "executive_summary": f"Document analysis identified {len(corrections)} compliance issues requiring attention",
            "priority_recommendations": ["Review and implement suggested corrections"],
            "legal_implications": "Address compliance issues to avoid regulatory risks",
            "implementation_roadmap": ["Review corrections", "Implement changes", "Validate compliance"],
            "risk_assessment": "MEDIUM",
            "compliance_score": 70,
            "ai_enhanced": False,
            "generation_timestamp": datetime.now().isoformat()
        }
    
    def _generate_corrections_from_simplified_analysis(self, simplified_result: Dict[str, Any], region: str) -> List[Dict[str, Any]]:
        """Generate corrections based on simplified analysis results (Claude-generated flags)"""
        corrections = []
        
        # Get compliance flags from simplified analysis
        compliance_flags = simplified_result.get("compliance_flags", [])
        risk_correlations = simplified_result.get("risk_correlations", [])
        
        # Generate corrections for each compliance flag
        for flag in compliance_flags:
            correction = self._generate_correction_from_simplified_flag(flag, region)
            if correction:
                corrections.append(correction)
        
        # Generate corrections for each risk correlation
        for correlation in risk_correlations:
            correction = self._generate_correction_from_simplified_correlation(correlation, region)
            if correction:
                corrections.append(correction)
        
        return corrections
    
    def _generate_correction_from_simplified_flag(self, flag: Dict[str, Any], region: str) -> Optional[Dict[str, Any]]:
        """Generate correction for a simplified analysis flag"""
        try:
            # Use Claude to generate intelligent correction suggestions
            claude_correction = self._get_claude_correction_for_simplified_flag(flag, region)
            
            if claude_correction:
                return claude_correction
            
            # Fallback to rule-based correction
            category = flag.get("category", "unknown")
            risk_level = flag.get("risk_level", "MEDIUM")
            
            correction = {
                "type": "simplified_flag_correction",
                "flag_id": flag.get("id", "unknown"),
                "category": category,
                "risk_level": risk_level,
                "original_text": flag.get("rationale", ""),
                "correction_suggestion": f"Address {category} compliance issue",
                "correction_template": f"This clause shall comply with {category} requirements in {region}.",
                "confidence": 0.7,
                "location": flag.get("contract_evidence", {}),
                "reason": f"Simplified analysis flag: {flag.get('rationale', '')}",
                "ai_generated": False,
                "source": "simplified_analysis"
            }
            
            return correction
            
        except Exception as e:
            logger.error(f"Error generating correction for simplified flag: {e}")
            return None
    
    def _generate_correction_from_simplified_correlation(self, correlation: Dict[str, Any], region: str) -> Optional[Dict[str, Any]]:
        """Generate correction for a simplified analysis correlation"""
        try:
            # Use Claude to generate intelligent correction suggestions
            claude_correction = self._get_claude_correction_for_simplified_correlation(correlation, region)
            
            if claude_correction:
                return claude_correction
            
            # Fallback to rule-based correction
            correlation_type = correlation.get("correlation_type", "unknown")
            risk_level = correlation.get("risk_level", "MEDIUM")
            
            correction = {
                "type": "simplified_correlation_correction",
                "correlation_type": correlation_type,
                "risk_level": risk_level,
                "original_description": correlation.get("description", ""),
                "correction_suggestion": f"Address {correlation_type} risk correlation",
                "correction_template": f"This clause shall address {correlation_type} risks in {region}.",
                "confidence": 0.6,
                "affected_fields": correlation.get("fields", []),
                "reason": f"Simplified analysis correlation: {correlation.get('description', '')}",
                "ai_generated": False,
                "source": "simplified_analysis"
            }
            
            return correction
            
        except Exception as e:
            logger.error(f"Error generating correction for simplified correlation: {e}")
            return None
    
    def _get_claude_correction_for_simplified_flag(self, flag: Dict[str, Any], region: str) -> Optional[Dict[str, Any]]:
        """Use Claude AI to generate intelligent correction suggestions for simplified analysis flags"""
        try:
            # Prepare context for Claude
            context = {
                "flag_details": {
                    "category": flag.get("category", "unknown"),
                    "risk_level": flag.get("risk_level", "MEDIUM"),
                    "rationale": flag.get("rationale", ""),
                    "field_name": flag.get("field_name", ""),
                    "field_value": flag.get("field_value", "")
                },
                "region": region,
                "contract_evidence": flag.get("contract_evidence", {})
            }
            
            # Call Claude API for correction suggestions
            response = claude_client.generate_compliance_rules(
                region=region,
                domain="simplified_correction",
                document_fields=[context['flag_details']]
            )
            
            # Parse Claude's response
            if response and not response.get("fallback", False):
                claude_rules = response.get("rules", [])
                if claude_rules:
                    rule = claude_rules[0]
                    
                    correction = {
                        "type": "claude_simplified_correction",
                        "flag_id": flag.get("id", "unknown"),
                        "category": flag.get("category", "unknown"),
                        "risk_level": flag.get("risk_level", "MEDIUM"),
                        "original_text": flag.get("rationale", ""),
                        "correction_suggestion": rule.get("description", "AI-generated correction"),
                        "detailed_explanation": rule.get("description", ""),
                        "suggested_clause": rule.get("description", ""),
                        "implementation_notes": f"Apply this correction to address {flag.get('category')} compliance requirements",
                        "confidence": 0.9,
                        "priority_level": "HIGH" if flag.get("risk_level") == "HIGH" else "MEDIUM",
                        "location": context['contract_evidence'],
                        "reason": f"AI-generated correction for simplified analysis: {flag.get('rationale', '')}",
                        "ai_generated": True,
                        "claude_rule_id": rule.get("id", "unknown"),
                        "source": "simplified_analysis"
                    }
                    
                    return correction
            
        except Exception as e:
            logger.error(f"Error getting Claude correction for simplified flag: {e}")
        
        return None
    
    def _get_claude_correction_for_simplified_correlation(self, correlation: Dict[str, Any], region: str) -> Optional[Dict[str, Any]]:
        """Use Claude AI to generate intelligent correction suggestions for simplified analysis correlations"""
        try:
            # Prepare context for Claude
            context = {
                "correlation_details": correlation,
                "region": region
            }
            
            # Call Claude API for correction suggestions
            response = claude_client.generate_compliance_rules(
                region=region,
                domain="simplified_correlation_correction",
                document_fields=[context['correlation_details']]
            )
            
            # Parse Claude's response
            if response and not response.get("fallback", False):
                claude_rules = response.get("rules", [])
                if claude_rules:
                    rule = claude_rules[0]
                    
                    correction = {
                        "type": "claude_simplified_correlation_correction",
                        "correlation_type": correlation.get("correlation_type", "unknown"),
                        "risk_level": correlation.get("risk_level", "MEDIUM"),
                        "original_description": correlation.get("description", ""),
                        "correction_suggestion": rule.get("description", "AI-generated correlation correction"),
                        "detailed_explanation": rule.get("description", ""),
                        "suggested_clause": rule.get("description", ""),
                        "implementation_notes": f"Apply this correction to address {correlation.get('correlation_type')} risk correlation",
                        "confidence": 0.85,
                        "priority_level": "HIGH" if correlation.get("risk_level") == "HIGH" else "MEDIUM",
                        "affected_fields": correlation.get("fields", []),
                        "reason": f"AI-generated correction for simplified correlation: {correlation.get('description', '')}",
                        "ai_generated": True,
                        "claude_rule_id": rule.get("id", "unknown"),
                        "source": "simplified_analysis"
                    }
                    
                    return correction
            
        except Exception as e:
            logger.error(f"Error getting Claude correction for simplified correlation: {e}")
        
        return None

# Global instance
smart_corrector = SmartDocumentCorrector()
