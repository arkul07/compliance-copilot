"""
AI Agent for Dynamic Compliance Rule Discovery
Integrates with your existing agent orchestrator
"""

import json
import logging
from typing import Dict, List, Any, Optional
from .agent_orchestrator import TaskRequest, TaskResult
from ..ai_rule_discovery import AIRuleDiscovery

logger = logging.getLogger(__name__)

class RuleDiscoveryAgent:
    """AI agent for discovering and validating compliance rules"""
    
    def __init__(self):
        self.ai_discovery = AIRuleDiscovery()
        self.discovered_rules = []
        self.rule_validation_cache = {}
    
    async def discover_compliance_rules(self, 
                                     contract_text: str,
                                     domain: str,
                                     jurisdiction: str) -> TaskResult:
        """Discover compliance rules using AI"""
        
        try:
            # Use AI to discover rules
            discovered_rules = self.ai_discovery.discover_rules_for_contract(
                contract_text, domain, jurisdiction
            )
            
            # Validate discovered rules
            validated_rules = []
            for rule in discovered_rules:
                validation = self.ai_discovery.validate_rule_accuracy(rule, jurisdiction)
                if validation["valid"]:
                    rule["validation"] = validation
                    validated_rules.append(rule)
            
            # Store discovered rules
            self.discovered_rules.extend(validated_rules)
            
            result = {
                "success": True,
                "discovered_rules": len(validated_rules),
                "rules": validated_rules,
                "domain": domain,
                "jurisdiction": jurisdiction,
                "agent": "rule_discovery"
            }
            
            return TaskResult(
                success=True,
                result=result,
                agent_used="rule_discovery",
                execution_time=0.0
            )
            
        except Exception as e:
            logger.error(f"Rule discovery failed: {e}")
            return TaskResult(
                success=False,
                agent_used="rule_discovery",
                execution_time=0.0,
                error=str(e)
            )
    
    async def get_regulatory_updates(self, 
                                   domain: str,
                                   jurisdiction: str) -> TaskResult:
        """Get latest regulatory updates using AI"""
        
        try:
            updates = self.ai_discovery.get_regulatory_updates(domain, jurisdiction)
            
            result = {
                "success": True,
                "updates": updates,
                "domain": domain,
                "jurisdiction": jurisdiction,
                "agent": "rule_discovery"
            }
            
            return TaskResult(
                success=True,
                result=result,
                agent_used="rule_discovery",
                execution_time=0.0
            )
            
        except Exception as e:
            logger.error(f"Regulatory updates failed: {e}")
            return TaskResult(
                success=False,
                agent_used="rule_discovery",
                execution_time=0.0,
                error=str(e)
            )
    
    async def analyze_cross_jurisdiction_compliance(self,
                                                  contract_data: Dict[str, Any],
                                                  jurisdictions: List[str]) -> TaskResult:
        """Analyze compliance across multiple jurisdictions"""
        
        try:
            analysis = self.ai_discovery.analyze_cross_jurisdiction_compliance(
                contract_data, jurisdictions
            )
            
            result = {
                "success": True,
                "cross_jurisdiction_analysis": analysis,
                "jurisdictions": jurisdictions,
                "agent": "rule_discovery"
            }
            
            return TaskResult(
                success=True,
                result=result,
                agent_used="rule_discovery",
                execution_time=0.0
            )
            
        except Exception as e:
            logger.error(f"Cross-jurisdiction analysis failed: {e}")
            return TaskResult(
                success=False,
                agent_used="rule_discovery",
                execution_time=0.0,
                error=str(e)
            )
