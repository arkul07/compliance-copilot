# Inkeep Integration Setup

## MCP Server Configuration

Your compliance copilot has the following MCP servers ready for Inkeep:

### 1. LandingAI MCP Server
- **Server Name**: `landingai-ade`
- **Tools Available**:
  - `extract_document_fields` - Extract structured fields from documents
  - `extract_document_tables` - Extract tables from documents  
  - `check_ade_availability` - Check LandingAI service status

### 2. Pathway MCP Server
- **Server Name**: `pathway-live`
- **Tools Available**:
  - `start_live_pipeline` - Start Pathway live indexing
  - `add_document_to_index` - Add documents to live index
  - `add_rule_text` - Add rule text to index
  - `check_pipeline_status` - Check Pathway status

## Agent Configuration for Inkeep

### Document Processing Agent
```yaml
name: "Document Processing Agent"
description: "Specialized agent for document extraction and processing using LandingAI ADE"
capabilities:
  - Field Extraction
  - Table Extraction  
  - Document Analysis
mcp_server: "landingai-ade"
tools:
  - extract_document_fields
  - extract_document_tables
  - check_ade_availability
```

### Search & Discovery Agent
```yaml
name: "Search & Discovery Agent"
description: "Specialized agent for real-time search and document discovery using Pathway"
capabilities:
  - Live Search
  - Document Indexing
  - Pipeline Management
mcp_server: "pathway-live"
tools:
  - start_live_pipeline
  - add_document_to_index
  - add_rule_text
  - check_pipeline_status
```

### Compliance Orchestrator Agent
```yaml
name: "Compliance Orchestrator Agent"
description: "Master agent that coordinates LandingAI and Pathway for complex compliance workflows"
capabilities:
  - Multi-Agent Coordination
  - Risk Analysis
  - Jurisdiction Analysis
mcp_servers:
  - "landingai-ade"
  - "pathway-live"
tools:
  - All LandingAI tools
  - All Pathway tools
  - Orchestration workflows
```

## Connecting to Inkeep Visual Builder

1. **Access Visual Builder**: Go to https://inkeep.com/visual-builder
2. **Create New Agent**: Click "Create Agent" 
3. **Connect MCP Server**: 
   - Server URL: `http://127.0.0.1:8001/agents/`
   - Select your MCP servers (landingai-ade, pathway-live)
4. **Configure Agent**: Use the agent configurations above
5. **Test Connection**: Verify tools are available
6. **Deploy Agent**: Make it available for use

## API Endpoints for Inkeep

Your agents are exposed via these endpoints:

- **Agent Status**: `GET /agents/status`
- **List Agents**: `GET /agents/list`
- **Execute Task**: `POST /agents/execute`
- **Compliance Analysis**: `POST /agents/compliance/analyze`
- **Risk Correlation**: `POST /agents/search/risk-correlation`
- **Document Extraction**: `POST /agents/document/extract`

## Testing Your Agents

1. **Start your backend**: `python3 -m uvicorn backend.app:app --host 127.0.0.1 --port 8001`
2. **Verify agents are running**: `curl http://127.0.0.1:8001/agents/status`
3. **Test agent execution**: Use the Inkeep Visual Builder to test your agents
4. **Monitor results**: Check agent performance and results in the Visual Builder

## Next Steps

1. **Set up Inkeep account** if you haven't already
2. **Connect your MCP servers** to Inkeep Visual Builder
3. **Create agent workflows** using the visual interface
4. **Test agent coordination** between LandingAI and Pathway
5. **Deploy agents** for production use
