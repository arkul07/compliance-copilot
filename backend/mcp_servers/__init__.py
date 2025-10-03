"""
MCP Servers for Compliance Copilot
Provides LandingAI and Pathway capabilities as MCP tools for Inkeep integration
"""
from .landingai_mcp import LandingAIMCPServer
from .pathway_mcp import PathwayMCPServer

def register_mcp_servers():
    """
    Registers all MCP servers for the application.
    This function can be called during application startup.
    """
    landingai_server = LandingAIMCPServer()
    pathway_server = PathwayMCPServer()
    
    # In a real Inkeep integration, you would register these servers
    # with the Inkeep agent framework. For this hackathon, we're
    # defining them to show the architecture.
    print(f"Registered MCP Server: {landingai_server.name}")
    print(f"Registered MCP Server: {pathway_server.name}")
    
    return [landingai_server, pathway_server]

__all__ = ["LandingAIMCPServer", "PathwayMCPServer", "register_mcp_servers"]
