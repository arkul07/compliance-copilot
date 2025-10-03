"""
Inkeep Agent Configuration
Defines specialized agents for LandingAI and Pathway tasks
"""
import json
from typing import Dict, List, Any
from dataclasses import dataclass

@dataclass
class AgentCapability:
    """Defines what an agent can do"""
    name: str
    description: str
    tools: List[str]
    mcp_server: str

@dataclass
class AgentConfig:
    """Configuration for an Inkeep agent"""
    name: str
    description: str
    capabilities: List[AgentCapability]
    mcp_servers: List[str]
    workflow_priority: int

# Define our specialized agents
DOCUMENT_PROCESSING_AGENT = AgentConfig(
    name="Document Processing Agent",
    description="Specialized agent for document extraction and processing using LandingAI ADE",
    capabilities=[
        AgentCapability(
            name="Field Extraction",
            description="Extract structured fields from documents",
            tools=["extract_document_fields"],
            mcp_server="landingai-ade"
        ),
        AgentCapability(
            name="Table Extraction", 
            description="Extract tables and structured data from documents",
            tools=["extract_document_tables"],
            mcp_server="landingai-ade"
        ),
        AgentCapability(
            name="Document Analysis",
            description="Analyze document structure and content",
            tools=["check_ade_availability"],
            mcp_server="landingai-ade"
        )
    ],
    mcp_servers=["landingai-ade"],
    workflow_priority=1
)

SEARCH_DISCOVERY_AGENT = AgentConfig(
    name="Search & Discovery Agent", 
    description="Specialized agent for real-time search and document discovery using Pathway",
    capabilities=[
        AgentCapability(
            name="Live Search",
            description="Search across indexed documents in real-time",
            tools=["search_documents", "get_search_stats"],
            mcp_server="pathway-live"
        ),
        AgentCapability(
            name="Document Indexing",
            description="Add and manage documents in the live index",
            tools=["add_document_to_index", "add_rule_text"],
            mcp_server="pathway-live"
        ),
        AgentCapability(
            name="Pipeline Management",
            description="Manage the Pathway live pipeline",
            tools=["start_live_pipeline", "check_pipeline_status"],
            mcp_server="pathway-live"
        )
    ],
    mcp_servers=["pathway-live"],
    workflow_priority=2
)

COMPLIANCE_ORCHESTRATOR_AGENT = AgentConfig(
    name="Compliance Orchestrator Agent",
    description="Master agent that coordinates LandingAI and Pathway for complex compliance workflows",
    capabilities=[
        AgentCapability(
            name="Multi-Agent Coordination",
            description="Coordinate between document processing and search agents",
            tools=["orchestrate_workflow", "generate_compliance_report"],
            mcp_server="hybrid"
        ),
        AgentCapability(
            name="Risk Analysis",
            description="Analyze compliance risks across documents",
            tools=["analyze_risk_correlation", "assess_compliance_gaps"],
            mcp_server="hybrid"
        ),
        AgentCapability(
            name="Jurisdiction Analysis",
            description="Analyze compliance across different jurisdictions",
            tools=["multi_jurisdiction_analysis", "region_specific_compliance"],
            mcp_server="hybrid"
        )
    ],
    mcp_servers=["landingai-ade", "pathway-live"],
    workflow_priority=3
)

# Agent registry
AGENT_REGISTRY = {
    "document_processing": DOCUMENT_PROCESSING_AGENT,
    "search_discovery": SEARCH_DISCOVERY_AGENT, 
    "compliance_orchestrator": COMPLIANCE_ORCHESTRATOR_AGENT
}

def get_agent_config(agent_name: str) -> AgentConfig:
    """Get configuration for a specific agent"""
    return AGENT_REGISTRY.get(agent_name)

def list_available_agents() -> List[str]:
    """List all available agents"""
    return list(AGENT_REGISTRY.keys())

def get_agent_capabilities(agent_name: str) -> List[AgentCapability]:
    """Get capabilities for a specific agent"""
    config = get_agent_config(agent_name)
    return config.capabilities if config else []

def create_agent_workflow(primary_agent: str, secondary_agents: List[str] = None) -> Dict[str, Any]:
    """Create a workflow configuration for agent coordination"""
    primary_config = get_agent_config(primary_agent)
    if not primary_config:
        raise ValueError(f"Unknown agent: {primary_agent}")
    
    workflow = {
        "primary_agent": primary_agent,
        "secondary_agents": secondary_agents or [],
        "mcp_servers": primary_config.mcp_servers,
        "capabilities": [cap.name for cap in primary_config.capabilities],
        "workflow_priority": primary_config.workflow_priority
    }
    
    return workflow
