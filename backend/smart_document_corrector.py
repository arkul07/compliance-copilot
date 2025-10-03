"""
Smart Document Auto-Correction System
Uses LandingAI ADE and Pathway to automatically correct compliance issues
"""
import logging
import json
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from datetime import datetime
from landingai_client import extract_fields, extract_tables
from pathway_pipeline import hybrid_search
from retriever import retrieve
from ai_compliance_checker import ai_compliance_checker
from risk_correlation import risk_engine

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
        """Generate correction for a compliance flag"""
        category = flag.category
        risk_level = flag.risk_level
        
        # Search for correction rules using Pathway
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
            "confidence": 0.8,
            "location": flag.contract_evidence.model_dump() if flag.contract_evidence else None,
            "reason": f"Compliance issue detected: {flag.rationale}"
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

# Global instance
smart_corrector = SmartDocumentCorrector()
