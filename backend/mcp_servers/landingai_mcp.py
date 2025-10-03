"""
MCP Server for LandingAI ADE Integration
Provides LandingAI document extraction capabilities as MCP tools
"""
import json
import logging
from typing import Any, Dict, List, Optional
from mcp.server import Server
from mcp.types import Tool, TextContent
from ..landingai_client import extract_fields, extract_tables, get_ade_client
from ..config import Config

logger = logging.getLogger(__name__)

# Initialize MCP server
server = Server("landingai-ade")

@server.list_tools()
async def list_tools() -> List[Tool]:
    """List available LandingAI ADE tools"""
    return [
        Tool(
            name="extract_document_fields",
            description="Extract structured fields from a document using LandingAI ADE with DPT-2 model",
            inputSchema={
                "type": "object",
                "properties": {
                    "document_path": {
                        "type": "string",
                        "description": "Path to the PDF document to extract fields from"
                    }
                },
                "required": ["document_path"]
            }
        ),
        Tool(
            name="extract_document_tables",
            description="Extract tables from a document using LandingAI ADE",
            inputSchema={
                "type": "object",
                "properties": {
                    "document_path": {
                        "type": "string",
                        "description": "Path to the PDF document to extract tables from"
                    }
                },
                "required": ["document_path"]
            }
        ),
        Tool(
            name="check_ade_availability",
            description="Check if LandingAI ADE is available and configured",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle tool calls for LandingAI ADE operations"""
    
    if name == "extract_document_fields":
        document_path = arguments.get("document_path")
        if not document_path:
            return [TextContent(type="text", text="Error: document_path is required")]
        
        try:
            fields = extract_fields(document_path)
            result = {
                "success": True,
                "fields": [
                    {
                        "name": field.name,
                        "value": field.value,
                        "evidence": {
                            "file": field.evidence.file,
                            "page": field.evidence.page,
                            "section": field.evidence.section
                        }
                    }
                    for field in fields
                ],
                "count": len(fields)
            }
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
            
        except Exception as e:
            logger.error(f"Field extraction failed: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]
    
    elif name == "extract_document_tables":
        document_path = arguments.get("document_path")
        if not document_path:
            return [TextContent(type="text", text="Error: document_path is required")]
        
        try:
            tables = extract_tables(document_path)
            result = {
                "success": True,
                "tables": tables,
                "count": len(tables)
            }
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
            
        except Exception as e:
            logger.error(f"Table extraction failed: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]
    
    elif name == "check_ade_availability":
        try:
            ade_client = get_ade_client()
            is_available = ade_client is not None
            config_available = Config.is_landingai_available()
            
            result = {
                "ade_available": is_available,
                "config_available": config_available,
                "api_key_configured": Config.LANDINGAI_API_KEY is not None
            }
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
            
        except Exception as e:
            logger.error(f"Availability check failed: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]
    
    else:
        return [TextContent(type="text", text=f"Unknown tool: {name}")]

# Export the server for use in the main application
__all__ = ["server"]
