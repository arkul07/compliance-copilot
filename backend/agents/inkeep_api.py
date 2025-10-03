"""
Inkeep Integration API
Provides REST API endpoints for agent orchestration
"""
import json
import logging
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from .agent_orchestrator import AgentOrchestrator, TaskRequest, TaskResult
from .inkeep_config import AGENT_REGISTRY, get_agent_config, create_agent_workflow

logger = logging.getLogger(__name__)

# Create router for agent endpoints
router = APIRouter(prefix="/agents", tags=["agents"])

# Initialize orchestrator
orchestrator = AgentOrchestrator()

# Pydantic models for request/response
class TaskRequestModel(BaseModel):
    task_type: str
    parameters: Dict[str, Any]
    priority: int = 1
    agent_preference: Optional[str] = None

class WorkflowRequestModel(BaseModel):
    workflow_name: str
    tasks: List[TaskRequestModel]

class AgentStatusResponse(BaseModel):
    agents: List[str]
    task_queue_length: int
    results_cache_size: int
    status: str

@router.get("/status")
async def get_agent_status() -> AgentStatusResponse:
    """Get status of all agents"""
    status = orchestrator.get_agent_status()
    return AgentStatusResponse(**status)

@router.get("/list")
async def list_agents():
    """List all available agents and their capabilities"""
    agents_info = {}
    for agent_name, config in AGENT_REGISTRY.items():
        agents_info[agent_name] = {
            "name": config.name,
            "description": config.description,
            "capabilities": [cap.name for cap in config.capabilities],
            "mcp_servers": config.mcp_servers,
            "workflow_priority": config.workflow_priority
        }
    return agents_info

@router.post("/execute")
async def execute_task(task_request: TaskRequestModel) -> Dict[str, Any]:
    """Execute a single task using the appropriate agent"""
    try:
        # Convert to TaskRequest object
        task = TaskRequest(
            task_type=task_request.task_type,
            parameters=task_request.parameters,
            priority=task_request.priority,
            agent_preference=task_request.agent_preference
        )
        
        # Execute task
        result = await orchestrator.execute_task(task)
        
        return {
            "success": result.success,
            "result": result.result,
            "agent_used": result.agent_used,
            "execution_time": result.execution_time,
            "error": result.error
        }
        
    except Exception as e:
        logger.error(f"Task execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/workflow")
async def execute_workflow(workflow_request: WorkflowRequestModel) -> Dict[str, Any]:
    """Execute a workflow with multiple tasks"""
    try:
        # Convert to TaskRequest objects
        tasks = [
            TaskRequest(
                task_type=task.task_type,
                parameters=task.parameters,
                priority=task.priority,
                agent_preference=task.agent_preference
            )
            for task in workflow_request.tasks
        ]
        
        # Create workflow
        workflow = orchestrator.create_workflow(workflow_request.workflow_name, tasks)
        
        # Execute tasks sequentially
        results = []
        for task in tasks:
            result = await orchestrator.execute_task(task)
            results.append({
                "task_type": task.task_type,
                "success": result.success,
                "result": result.result,
                "agent_used": result.agent_used,
                "execution_time": result.execution_time,
                "error": result.error
            })
        
        return {
            "workflow_name": workflow_request.workflow_name,
            "total_tasks": len(tasks),
            "results": results,
            "overall_success": all(r["success"] for r in results)
        }
        
    except Exception as e:
        logger.error(f"Workflow execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/capabilities/{agent_name}")
async def get_agent_capabilities(agent_name: str):
    """Get capabilities for a specific agent"""
    config = get_agent_config(agent_name)
    if not config:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")
    
    return {
        "agent_name": agent_name,
        "capabilities": [
            {
                "name": cap.name,
                "description": cap.description,
                "tools": cap.tools,
                "mcp_server": cap.mcp_server
            }
            for cap in config.capabilities
        ]
    }

@router.post("/workflow/create")
async def create_workflow_config(
    primary_agent: str = Query(..., description="Primary agent for the workflow"),
    secondary_agents: List[str] = Query(default=[], description="Secondary agents for the workflow")
):
    """Create a workflow configuration"""
    try:
        workflow = create_agent_workflow(primary_agent, secondary_agents)
        return workflow
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Specialized endpoints for common workflows
@router.post("/compliance/analyze")
async def analyze_compliance(
    document_path: str = Query("backend/contracts/sample/contract.pdf", description="Path to the document to analyze"),
    region: str = Query("EU", description="Region for compliance analysis")
):
    """Analyze compliance for a document using the orchestrator agent"""
    try:
        task = TaskRequest(
            task_type="compliance_analysis",
            parameters={
                "document_path": document_path,
                "region": region
            }
        )
        
        result = await orchestrator.execute_task(task)
        
        return {
            "success": result.success,
            "compliance_analysis": result.result,
            "agent_used": result.agent_used,
            "execution_time": result.execution_time,
            "error": result.error
        }
        
    except Exception as e:
        logger.error(f"Compliance analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search/risk-correlation")
async def analyze_risk_correlation(
    query: str = Query(..., description="Search query for risk correlation"),
    top_k: int = Query(5, description="Number of results to return")
):
    """Analyze risk correlations using the search agent"""
    try:
        task = TaskRequest(
            task_type="risk_correlation",
            parameters={
                "query": query,
                "top_k": top_k
            }
        )
        
        result = await orchestrator.execute_task(task)
        
        return {
            "success": result.success,
            "risk_correlation": result.result,
            "agent_used": result.agent_used,
            "execution_time": result.execution_time,
            "error": result.error
        }
        
    except Exception as e:
        logger.error(f"Risk correlation analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/document/extract")
async def extract_document_data(
    document_path: str = Query("backend/contracts/sample/contract.pdf", description="Path to the document"),
    extraction_type: str = Query("fields", description="Type of extraction (fields or tables)")
):
    """Extract data from a document using the document processing agent"""
    try:
        task_type = "extract_fields" if extraction_type == "fields" else "extract_tables"
        
        task = TaskRequest(
            task_type=task_type,
            parameters={
                "document_path": document_path
            }
        )
        
        result = await orchestrator.execute_task(task)
        
        return {
            "success": result.success,
            "extraction_result": result.result,
            "agent_used": result.agent_used,
            "execution_time": result.execution_time,
            "error": result.error
        }
        
    except Exception as e:
        logger.error(f"Document extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
