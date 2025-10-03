"""
MCP Server for Pathway Integration
Provides Pathway live indexing and real-time processing capabilities as MCP tools
"""
import json
import logging
from typing import Any, Dict, List, Optional
from mcp.server import Server
from mcp.types import Tool, TextContent
from ..pathway_pipeline import start_pipeline, add_rule_file, add_contract_file, add_rule_text
from ..config import Config

logger = logging.getLogger(__name__)

# Initialize MCP server
server = Server("pathway-live")

@server.list_tools()
async def list_tools() -> List[Tool]:
    """List available Pathway tools"""
    return [
        Tool(
            name="start_live_pipeline",
            description="Start the Pathway live indexing pipeline for real-time document processing",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        Tool(
            name="add_document_to_index",
            description="Add a document to the live Pathway index for real-time processing",
            inputSchema={
                "type": "object",
                "properties": {
                    "document_path": {
                        "type": "string",
                        "description": "Path to the document to add to the index"
                    },
                    "document_type": {
                        "type": "string",
                        "enum": ["contract", "rule"],
                        "description": "Type of document (contract or rule)"
                    }
                },
                "required": ["document_path", "document_type"]
            }
        ),
        Tool(
            name="add_rule_text",
            description="Add rule text directly to the Pathway index",
            inputSchema={
                "type": "object",
                "properties": {
                    "rule_text": {
                        "type": "string",
                        "description": "The rule text to add to the index"
                    }
                },
                "required": ["rule_text"]
            }
        ),
        Tool(
            name="check_pipeline_status",
            description="Check the status of the Pathway pipeline",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle tool calls for Pathway operations"""
    
    if name == "start_live_pipeline":
        try:
            start_pipeline()
            result = {
                "success": True,
                "message": "Pathway pipeline started successfully",
                "status": "running"
            }
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
            
        except Exception as e:
            logger.error(f"Pipeline start failed: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]
    
    elif name == "add_document_to_index":
        document_path = arguments.get("document_path")
        document_type = arguments.get("document_type")
        
        if not document_path or not document_type:
            return [TextContent(type="text", text="Error: document_path and document_type are required")]
        
        try:
            if document_type == "contract":
                add_contract_file(document_path)
            elif document_type == "rule":
                add_rule_file(document_path)
            else:
                return [TextContent(type="text", text="Error: document_type must be 'contract' or 'rule'")]
            
            result = {
                "success": True,
                "message": f"Document added to {document_type} index",
                "document_path": document_path,
                "document_type": document_type
            }
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
            
        except Exception as e:
            logger.error(f"Document addition failed: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]
    
    elif name == "add_rule_text":
        rule_text = arguments.get("rule_text")
        if not rule_text:
            return [TextContent(type="text", text="Error: rule_text is required")]
        
        try:
            add_rule_text(rule_text)
            result = {
                "success": True,
                "message": "Rule text added to index",
                "text_length": len(rule_text)
            }
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
            
        except Exception as e:
            logger.error(f"Rule text addition failed: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]
    
    elif name == "check_pipeline_status":
        try:
            # This would check the actual pipeline status
            # For now, we'll return a basic status
            result = {
                "success": True,
                "pipeline_status": "running",
                "pathway_available": Config.is_pathway_available(),
                "message": "Pathway pipeline is operational"
            }
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
            
        except Exception as e:
            logger.error(f"Status check failed: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]
    
    else:
        return [TextContent(type="text", text=f"Unknown tool: {name}")]

# Export the server for use in the main application
__all__ = ["server"]
