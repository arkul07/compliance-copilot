"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8001";

export default function Home() {
  // Add CSS animation for spinner and search highlighting
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      mark {
        background-color: #fef3c7 !important;
        padding: 1px 3px !important;
        border-radius: 3px !important;
        font-weight: 600 !important;
        color: #92400e !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
      }
      
      .gradient-bg {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      .glass-effect {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .card-hover {
        transition: all 0.3s ease;
      }
      
      .card-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const [region, setRegion] = useState("EU");
  const [flags, setFlags] = useState([]);
  const [contractFile, setContractFile] = useState(null);
  
  // Novel features state
  const [riskCorrelations, setRiskCorrelations] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [tables, setTables] = useState([]);
  
  // Pathway features state
  const [pathwaySearchQuery, setPathwaySearchQuery] = useState("");
  const [pathwayResults, setPathwayResults] = useState([]);
  const [pathwayStats, setPathwayStats] = useState(null);
  const [liveActivity, setLiveActivity] = useState([]);
  const [newDocumentContent, setNewDocumentContent] = useState("");
  const [newDocumentName, setNewDocumentName] = useState("");
  const [newDocumentType, setNewDocumentType] = useState("rule");
  
  // Modal states
  const [showRiskInfoModal, setShowRiskInfoModal] = useState(false);
  const [showTableInfoModal, setShowTableInfoModal] = useState(false);
  const [showPathwayInfoModal, setShowPathwayInfoModal] = useState(false);
  const [showHowToUseModal, setShowHowToUseModal] = useState(false);
  
  // Agent states
  const [agents, setAgents] = useState({});
  const [agentStatus, setAgentStatus] = useState(null);
  const [agentResults, setAgentResults] = useState(null);
  
  // Loading states
  const [isAnalyzingRisk, setIsAnalyzingRisk] = useState(false);
  const [isExtractingTables, setIsExtractingTables] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isSearchingPathway, setIsSearchingPathway] = useState(false);
  const [isLoadingPathwayStats, setIsLoadingPathwayStats] = useState(false);

  const [ruleFile, setRuleFile] = useState(null);
  const [ruleText, setRuleText] = useState("");

  // Inline rule editor
  const [rules, setRules] = useState([]);
  const [editorName, setEditorName] = useState("new_rule.md");
  const [editorText, setEditorText] = useState("");

  // Modal state
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [explainData, setExplainData] = useState(null);
  const [loadingExplain, setLoadingExplain] = useState(false);

  async function uploadContract() {
    if (!contractFile) {
      alert("Please choose a contract PDF file first.");
      return;
    }
    
    try {
      const fd = new FormData();
      fd.append("file", contractFile, contractFile.name);
      const r = await fetch(`${API_BASE}/upload_contract`, { method: "POST", body: fd });
      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        alert(`Upload failed: ${r.status} ${errorData.detail || r.statusText}`);
        return;
      }
      const data = await r.json();
      alert(`✅ Contract uploaded successfully!\n\nExtracted ${data.fields?.length || 0} fields.`);
      console.log("extracted_fields", data.fields);
    } catch (error) {
      alert(`❌ Upload error: ${error.message}`);
    }
  }

  // Agent functions
  const loadAgents = async () => {
    try {
      const response = await fetch(`${API_BASE}/agents/list`);
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error("Failed to load agents:", error);
    }
  };

  const loadAgentStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/agents/status`);
      const data = await response.json();
      setAgentStatus(data);
    } catch (error) {
      console.error("Failed to load agent status:", error);
    }
  };

  // Enhanced functions that use agents in the background
  const analyzeRiskCorrelationWithAgent = async () => {
    setIsAnalyzingRisk(true);
    try {
      // Call the direct risk correlation endpoint
      const response = await fetch(`${API_BASE}/risk_correlation?region=${region}`);
      const result = await response.json();
      
      // Transform the API response to match frontend expectations
      const correlations = result.correlations || [];
      setRiskCorrelations(correlations);
      setAgentResults({
        success: true,
        agent_used: "Risk Correlation Engine",
        execution_time: 0.0,
        result: result
      });
    } catch (error) {
      console.error("Risk correlation analysis failed:", error);
      setRiskCorrelations([{
        correlation_type: "Analysis Failed",
        risk_level: "Unknown",
        confidence: 0,
        description: "Unable to analyze risk correlation",
        risk_indicators: [],
        region: region
      }]);
    } finally {
      setIsAnalyzingRisk(false);
    }
  };

  const extractTablesWithAgent = async () => {
    setIsExtractingTables(true);
    try {
      const response = await fetch(`${API_BASE}/agents/document/extract?document_path=${encodeURIComponent("backend/contracts/sample/contract.pdf")}&extraction_type=tables`, {
        method: "POST"
      });
      const result = await response.json();
      setTables(result.extraction_result?.tables || []);
      setAgentResults(result);
    } catch (error) {
      console.error("Table extraction failed:", error);
      setTables([{
        headers: ["Error", "Message"],
        rows: [["Extraction Failed", error.message]]
      }]);
    } finally {
      setIsExtractingTables(false);
    }
  };

  async function addRule() {
    if (!ruleFile && !ruleText.trim()) {
      alert("Please provide either a rule file or paste rule text.");
      return;
    }
    
    try {
      let fd;
      if (ruleFile) {
        fd = new FormData();
        fd.append("file", ruleFile, ruleFile.name);
      } else {
        const blob = new Blob([ruleText], { type: "text/markdown" });
        fd = new FormData();
        fd.append("file", blob, "snippet.md");
      }
      const r = await fetch(`${API_BASE}/upload_rule`, { method: "POST", body: fd });
      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        alert(`❌ Add rule failed: ${r.status} ${errorData.detail || r.statusText}`);
        return;
      }
      alert("✅ Rule added successfully!");
      await refreshRules();
    } catch (error) {
      alert(`❌ Add rule error: ${error.message}`);
    }
  }

  async function refreshRules() {
    try {
      const r = await fetch(`${API_BASE}/rules`);
      if (!r.ok) return;
      const data = await r.json();
      setRules(data.items || []);
    } catch {}
  }

  useEffect(() => {
    refreshRules();
  }, []);

  async function loadRule(name) {
    const r = await fetch(`${API_BASE}/rule?name=${encodeURIComponent(name)}`);
    if (!r.ok) return alert("Load failed");
    const data = await r.json();
    setEditorName(data.name || name);
    setEditorText(data.text || "");
  }

  async function saveRule() {
    const r = await fetch(`${API_BASE}/rule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editorName, text: editorText }),
    });
    if (!r.ok) return alert("Save failed");
    alert("Rule saved");
    await refreshRules();
  }

  async function checkCompliance() {
    try {
      const r = await fetch(`${API_BASE}/check?region=${region}`);
      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        alert(`❌ Compliance check failed:\n${r.status} - ${errorData.detail || r.statusText}`);
        return;
      }
      const data = await r.json();
      setFlags(data);
      if (data.length === 0) {
        alert("✅ No compliance issues found for the selected region!");
      } else {
        alert(`🔍 Found ${data.length} compliance issue(s). Check the flags table below for details.`);
      }
    } catch (error) {
      alert(`❌ Compliance check error: ${error.message}`);
    }
  }

  async function explain(id) {
    setLoadingExplain(true);
    setShowExplainModal(true);
    
    try {
      const r = await fetch(`${API_BASE}/explain?id=${encodeURIComponent(id)}&region=${region}`);
      if (!r.ok) {
        setExplainData({ 
          error: `Failed to get explanation: ${r.status} ${r.statusText}` 
        });
        return;
      }
      
      const text = await r.text();
      try {
        const j = JSON.parse(text);
        setExplainData(j);
      } catch {
        setExplainData({ 
          error: `Invalid response format`,
          rawResponse: text 
        });
      }
    } catch (error) {
      setExplainData({ 
        error: `Request failed: ${error.message}` 
      });
    } finally {
      setLoadingExplain(false);
    }
  }

  function closeExplainModal() {
    setShowExplainModal(false);
    setExplainData(null);
    setLoadingExplain(false);
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(flags, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flags_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCSV() {
    const header = [
      "id","category","region","risk_level","rationale",
      "contract_file","contract_page","rule_file","rule_section"
    ];
    const rows = flags.map((r) => {
      const ce = r.contract_evidence || {};
      const re = r.rule_evidence || {};
      return [
        r.id || "", r.category || "", r.region || "", r.risk_level || "", r.rationale || "",
        ce.file || "", ce.page || "", re.file || "", re.section || ""
      ];
    });
    const csv = [header, ...rows].map((row) => row.map((x) => `"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flags_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Novel Features Functions
  async function analyzeRiskCorrelation() {
    // Use the agent-enhanced version
    await analyzeRiskCorrelationWithAgent();
  }

  async function extractTables() {
    // Use the agent-enhanced version
    await extractTablesWithAgent();
  }

  async function checkSystemStatus() {
    setIsCheckingStatus(true);
    try {
      const r = await fetch(`${API_BASE}/system_status`);
      if (!r.ok) return;
      const data = await r.json();
      setSystemStatus(data);
    } catch (error) {
      console.error("System status check failed:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  }

  // Pathway Functions
  async function searchPathway() {
    if (!pathwaySearchQuery.trim()) {
      alert("Please enter a search query");
      return;
    }
    
    setIsSearchingPathway(true);
    try {
      const r = await fetch(`${API_BASE}/pathway_search?query=${encodeURIComponent(pathwaySearchQuery)}&top_k=5`);
      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        alert(`❌ Pathway search failed:\n${r.status} - ${errorData.detail || r.statusText}`);
        return;
      }
      const data = await r.json();
      setPathwayResults(data.results || []);
      alert(`🔍 Pathway Search Complete!\n\nFound ${data.results?.length || 0} relevant documents.`);
    } catch (error) {
      alert(`❌ Pathway search error: ${error.message}`);
    } finally {
      setIsSearchingPathway(false);
    }
  }

  async function getPathwayStats() {
    setIsLoadingPathwayStats(true);
    try {
      const r = await fetch(`${API_BASE}/pathway_stats`);
      if (!r.ok) return;
      const data = await r.json();
      setPathwayStats(data);
    } catch (error) {
      console.error("Pathway stats check failed:", error);
    } finally {
      setIsLoadingPathwayStats(false);
    }
  }

  // Real-time activity functions
  async function getLiveActivity() {
    try {
      const r = await fetch(`${API_BASE}/pathway_live_activity`);
      if (!r.ok) return;
      const data = await r.json();
      setLiveActivity(data.activity || []);
    } catch (error) {
      console.error("Live activity check failed:", error);
    }
  }

  async function addNewDocument() {
    if (!newDocumentContent.trim() || !newDocumentName.trim()) {
      alert("Please provide both content and filename");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('content', newDocumentContent);
      formData.append('filename', newDocumentName);
      formData.append('doc_type', newDocumentType);

      const r = await fetch(`${API_BASE}/pathway_add_document`, {
        method: 'POST',
        body: formData
      });

      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        alert(`❌ Failed to add document:\n${r.status} - ${errorData.detail || r.statusText}`);
        return;
      }

      const data = await r.json();
      alert(`✅ Document added successfully!\n\n${data.message}`);
      
      // Clear form
      setNewDocumentContent("");
      setNewDocumentName("");
      
      // Refresh stats and activity
      getPathwayStats();
      getLiveActivity();
    } catch (error) {
      alert(`❌ Error adding document: ${error.message}`);
    }
  }

  // Auto-refresh for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      getPathwayStats();
      getLiveActivity();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Load agents on component mount
  useEffect(() => {
    loadAgents();
    loadAgentStatus();
  }, []);

  const box = { border: "1px solid #e5e7eb", padding: 16, borderRadius: 12, marginBottom: 16, background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" };
  const buttonStyle = { 
    background: "#2563eb", 
    color: "white", 
    border: "none", 
    padding: "8px 16px", 
    borderRadius: "6px", 
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500"
  };

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ background: "white", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <h1 style={{ marginBottom: 8, color: "#1f2937", fontSize: "28px", fontWeight: "600" }}>🔍 Global Compliance Copilot</h1>
            <p style={{ color: "#6b7280", marginBottom: 20 }}>AI-powered contract compliance analysis across jurisdictions</p>
          </div>
          <button
            onClick={() => setShowHowToUseModal(true)}
            style={{
              background: "#3b82f6",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)"
            }}
          >
            📖 How to Use
          </button>
        </div>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <label style={{ fontWeight: "500", color: "#374151" }}>Region:</label>
          <select 
            value={region} 
            onChange={(e) => setRegion(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px" }}
          >
            <option>EU</option>
            <option>US</option>
            <option>IN</option>
          </select>
          
          {/* AI Agents Status */}
          {agentStatus && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              padding: "6px 12px", 
              background: "#f0f9ff", 
              borderRadius: "6px", 
              border: "1px solid #bfdbfe",
              fontSize: "12px"
            }}>
              <span style={{ color: "#1e40af", fontWeight: "500" }}>🤖 AI Agents:</span>
              <span style={{ color: "#1e40af" }}>{agentStatus.agents?.length || 0} Active</span>
              <div style={{ 
                width: "8px", 
                height: "8px", 
                borderRadius: "50%", 
                background: agentStatus.status === "operational" ? "#10b981" : "#ef4444" 
              }}></div>
            </div>
          )}
          
          <span style={{ marginLeft: 12, color: "#6b7280", fontSize: "12px" }}>API: {API_BASE}</span>
        </div>
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={box}>
          <h3>Upload contract (PDF)</h3>
          <input 
            type="file" 
            accept="application/pdf" 
            onChange={(e) => setContractFile(e.target.files?.[0] || null)}
            style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
          />
          <div style={{ marginTop: 8 }}>
            <button onClick={uploadContract} style={buttonStyle}>📄 Upload Contract</button>
          </div>
        </div>

        <div style={box}>
          <h3>Add rule (file or text)</h3>
          <input 
            type="file" 
            accept=".md,.txt,application/pdf" 
            onChange={(e) => setRuleFile(e.target.files?.[0] || null)}
            style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
          />
          <div style={{ margin: "8px 0", textAlign: "center", color: "#6b7280", fontWeight: "500" }}>OR</div>
          <textarea 
            rows={5} 
            style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", resize: "vertical" }} 
            placeholder="Paste rule snippet..." 
            value={ruleText} 
            onChange={(e) => setRuleText(e.target.value)} 
          />
          <div style={{ marginTop: 8 }}>
            <button onClick={addRule} style={buttonStyle}>📋 Add Rule</button>
          </div>
        </div>
      </section>

      <section style={box}>
        <h3>Inline Rule Editor</h3>
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 12 }}>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>Existing rules</div>
            <ul style={{ maxHeight: 220, overflow: "auto", paddingLeft: 16, margin: 0 }}>
              {rules.map((r) => (
                <li key={r.path} style={{ cursor: "pointer", marginBottom: 4 }} onClick={() => loadRule(r.name)}>
                  {r.name}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={editorName} onChange={(e) => setEditorName(e.target.value)} style={{ flex: 1 }} />
              <button onClick={saveRule} style={buttonStyle}>💾 Save</button>
            </div>
            <textarea rows={10} style={{ width: "100%" }} value={editorText} onChange={(e) => setEditorText(e.target.value)} />
          </div>
        </div>
      </section>

      <section style={box}>
        <h3>Run compliance</h3>
        <button onClick={checkCompliance} style={{...buttonStyle, background: "#059669", padding: "12px 24px", fontSize: "16px"}}>🔍 Run Compliance Check</button>
      </section>

      {/* Novel Features Section */}
      <section style={box}>
        <h3>🚀 Novel Features (Hackathon)</h3>
        
        {/* Progress Indicator */}
        {(isAnalyzingRisk || isExtractingTables || isCheckingStatus) && (
          <div style={{
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <div style={{
              width: "20px",
              height: "20px",
              border: "2px solid #3b82f6",
              borderTop: "2px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            <span style={{ color: "#1e40af", fontWeight: "500" }}>
              {isAnalyzingRisk && "🔍 Analyzing risk correlations..."}
              {isExtractingTables && "📊 Extracting tables with LandingAI ADE..."}
              {isCheckingStatus && "🔧 Checking system status..."}
            </span>
          </div>
        )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <button 
              onClick={analyzeRiskCorrelation} 
              disabled={isAnalyzingRisk}
              style={{
                ...buttonStyle, 
                background: isAnalyzingRisk ? "#9ca3af" : "#7c3aed", 
                padding: "10px 16px",
                opacity: isAnalyzingRisk ? 0.7 : 1,
                cursor: isAnalyzingRisk ? "not-allowed" : "pointer"
              }}
            >
              {isAnalyzingRisk ? "⏳ Analyzing..." : "🔗 Risk Correlation Analysis"}
            </button>
            <button 
              onClick={extractTables} 
              disabled={isExtractingTables}
              style={{
                ...buttonStyle, 
                background: isExtractingTables ? "#9ca3af" : "#dc2626", 
                padding: "10px 16px",
                opacity: isExtractingTables ? 0.7 : 1,
                cursor: isExtractingTables ? "not-allowed" : "pointer"
              }}
            >
              {isExtractingTables ? "⏳ Extracting..." : "📊 Extract Tables (LandingAI ADE)"}
            </button>
          </div>
          <button 
            onClick={checkSystemStatus} 
            disabled={isCheckingStatus}
            style={{
              ...buttonStyle, 
              background: isCheckingStatus ? "#9ca3af" : "#6b7280", 
              padding: "8px 16px", 
              fontSize: "14px",
              opacity: isCheckingStatus ? 0.7 : 1,
              cursor: isCheckingStatus ? "not-allowed" : "pointer"
            }}
          >
            {isCheckingStatus ? "⏳ Checking..." : "🔧 Check System Status"}
          </button>
      </section>

      <section style={box}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3>🚩 Flags ({flags.length})</h3>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={downloadJSON} disabled={flags.length === 0} style={{...buttonStyle, background: "#dc2626", opacity: flags.length === 0 ? 0.5 : 1}}>📄 Download JSON</button>
            <button onClick={downloadCSV} disabled={flags.length === 0} style={{...buttonStyle, background: "#dc2626", opacity: flags.length === 0 ? 0.5 : 1}}>📊 Download CSV</button>
          </div>
        </div>
        
        {flags.length === 0 ? (
          <div>No flags yet.</div>
        ) : (
          <>
            {/* Priority Summary */}
            <div style={{ 
              display: "flex", 
              gap: "12px", 
              marginBottom: "16px", 
              padding: "12px", 
              background: "#f8fafc", 
              borderRadius: "8px",
              border: "1px solid #e2e8f0"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#dc2626" }}></div>
                <span style={{ fontSize: "12px", fontWeight: "600" }}>
                  HIGH: {flags.filter(f => f.risk_level === "HIGH").length}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#d97706" }}></div>
                <span style={{ fontSize: "12px", fontWeight: "600" }}>
                  MEDIUM: {flags.filter(f => f.risk_level === "MEDIUM").length}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#16a34a" }}></div>
                <span style={{ fontSize: "12px", fontWeight: "600" }}>
                  LOW: {flags.filter(f => f.risk_level === "LOW").length}
                </span>
              </div>
            </div>
            
            <div style={{ maxHeight: 400, overflow: "auto" }}>
              {flags.map((flag, index) => {
                // Enhanced color coding based on risk level
                const getFlagColors = (riskLevel) => {
                  if (riskLevel === "HIGH") {
                    return {
                      background: "#fef2f2",
                      border: "#fecaca", 
                      text: "#dc2626",
                      badge: "#fef2f2",
                      priority: "🔴"
                    };
                  } else if (riskLevel === "MEDIUM") {
                    return {
                      background: "#fffbeb",
                      border: "#fed7aa",
                      text: "#d97706", 
                      badge: "#fffbeb",
                      priority: "🟡"
                    };
                  } else {
                    return {
                      background: "#f0fdf4",
                      border: "#bbf7d0",
                      text: "#16a34a",
                      badge: "#f0fdf4", 
                      priority: "🟢"
                    };
                  }
                };
                
                const colors = getFlagColors(flag.risk_level);
                
                return (
                  <div key={index} style={{ 
                    padding: "16px", 
                    margin: "12px 0", 
                    background: colors.background,
                    border: `2px solid ${colors.border}`,
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    position: "relative"
                  }}>
                    {/* Priority indicator */}
                    <div style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      fontSize: "18px"
                    }}>
                      {colors.priority}
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <div style={{ 
                          fontWeight: "600", 
                          fontSize: "16px",
                          color: colors.text,
                          marginBottom: "4px"
                        }}>
                          {flag.id}
                        </div>
                        <div style={{ 
                          fontSize: "12px", 
                          color: colors.text,
                          fontWeight: "600",
                          background: colors.badge,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          display: "inline-block"
                        }}>
                          {flag.risk_level} RISK
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: "12px", 
                        color: "#6b7280",
                        background: "#f3f4f6",
                        padding: "4px 8px",
                        borderRadius: "6px"
                      }}>
                        {flag.category} • {flag.region}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: "14px", color: "#374151", marginBottom: "12px", lineHeight: "1.5" }}>
                      {flag.rationale}
                    </div>
                    
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      fontSize: "12px",
                      color: "#6b7280"
                    }}>
                      <div>
                        Contract: {flag.contract_evidence?.file?.split('/').pop() || 'Unknown'} 
                        {flag.contract_evidence?.page && ` (Page ${flag.contract_evidence.page})`}
                      </div>
                      <button 
                        onClick={() => explain(flag.id)}
                        style={{
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "11px"
                        }}
                      >
                        📋 Explain
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

        {/* Risk Correlations Display */}
        {riskCorrelations.length > 0 && (
          <section style={box}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3>🔗 Risk Correlations ({riskCorrelations.length})</h3>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ 
                  fontSize: "12px", 
                  color: "#6b7280", 
                  background: "#f0f9ff", 
                  padding: "6px 12px", 
                  borderRadius: "6px",
                  border: "1px solid #bae6fd"
                }}>
                  💡 Finds hidden connections between documents and clauses
                </div>
                <button 
                  onClick={() => setShowRiskInfoModal(true)}
                  style={{
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500"
                  }}
                >
                  ℹ️ Info
                </button>
              </div>
            </div>
            <div style={{ maxHeight: 400, overflow: "auto" }}>
              {riskCorrelations.map((correlation, index) => (
                <div key={index} style={{ 
                  padding: "16px", 
                  margin: "12px 0", 
                  background: correlation.risk_level === "HIGH" ? "#fef2f2" : correlation.risk_level === "MEDIUM" ? "#fffbeb" : "#f0fdf4",
                  border: `2px solid ${correlation.risk_level === "HIGH" ? "#fecaca" : correlation.risk_level === "MEDIUM" ? "#fed7aa" : "#bbf7d0"}`,
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ 
                        fontWeight: "600", 
                        fontSize: "16px",
                        color: correlation.risk_level === "HIGH" ? "#dc2626" : correlation.risk_level === "MEDIUM" ? "#d97706" : "#16a34a",
                        marginBottom: "4px"
                      }}>
                        {correlation.correlation_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div style={{ 
                        fontSize: "12px", 
                        color: correlation.risk_level === "HIGH" ? "#dc2626" : correlation.risk_level === "MEDIUM" ? "#d97706" : "#16a34a",
                        fontWeight: "600",
                        background: correlation.risk_level === "HIGH" ? "#fef2f2" : correlation.risk_level === "MEDIUM" ? "#fffbeb" : "#f0fdf4",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        display: "inline-block"
                      }}>
                        {correlation.risk_level} RISK
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: "12px", 
                      color: "#6b7280",
                      background: "#f3f4f6",
                      padding: "4px 8px",
                      borderRadius: "6px"
                    }}>
                      {Math.round(correlation.confidence * 100)}% confidence
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "14px", color: "#374151", marginBottom: "12px", lineHeight: "1.5" }}>
                    {correlation.description}
                  </div>
                  
                  {correlation.risk_indicators && correlation.risk_indicators.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
                        Risk Indicators:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                        {correlation.risk_indicators.map((indicator, idx) => (
                          <span key={idx} style={{
                            background: "#e5e7eb",
                            color: "#374151",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "500"
                          }}>
                            {indicator.indicator || indicator}
                          </span>
                        ))}
                      </div>
                      
                      {/* Detailed explanations for each risk indicator */}
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        <strong>Detailed Analysis:</strong>
                        {correlation.risk_indicators.map((indicator, idx) => (
                          <div key={idx} style={{ 
                            margin: "4px 0", 
                            padding: "8px", 
                            background: "#f9fafb", 
                            borderRadius: "6px",
                            border: "1px solid #e5e7eb"
                          }}>
                            <div style={{ fontWeight: "600", color: "#374151", marginBottom: "2px" }}>
                              {indicator.indicator || indicator} in {indicator.field}
                            </div>
                            <div style={{ fontSize: "11px", color: "#6b7280" }}>
                              Value: {typeof indicator.value === 'string' ? indicator.value.substring(0, 100) + '...' : JSON.stringify(indicator.value).substring(0, 100) + '...'}
                            </div>
                            {indicator.evidence && (
                              <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>
                                Evidence: {indicator.evidence.file} (Page {indicator.evidence.page})
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    fontSize: "12px", 
                    color: "#9ca3af",
                    borderTop: "1px solid #e5e7eb",
                    paddingTop: "8px"
                  }}>
                    <span>Fields: {correlation.matching_fields} | Indicators: {correlation.risk_indicators?.length || 0}</span>
                    <span>Region: {correlation.region}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pathway Search Section */}
        <section style={box}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3>🔍 Pathway Live Search</h3>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div style={{ 
                fontSize: "12px", 
                color: "#6b7280", 
                background: "#f0f9ff", 
                padding: "6px 12px", 
                borderRadius: "6px",
                border: "1px solid #bae6fd"
              }}>
                💡 Real-time document indexing with hybrid search
              </div>
              <button 
                onClick={() => setShowPathwayInfoModal(true)}
                style={{
                  background: "#7c3aed",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500"
                }}
              >
                ℹ️ Info
              </button>
            </div>
          </div>
          
          {/* Search Input */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <input
              type="text"
              placeholder="Search documents (e.g., 'GDPR privacy', 'labor law', 'tax withholding')"
              value={pathwaySearchQuery}
              onChange={(e) => setPathwaySearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px"
              }}
              onKeyPress={(e) => e.key === 'Enter' && searchPathway()}
            />
            <button 
              onClick={searchPathway}
              disabled={isSearchingPathway}
              style={{
                ...buttonStyle, 
                background: isSearchingPathway ? "#9ca3af" : "#7c3aed", 
                padding: "8px 16px",
                opacity: isSearchingPathway ? 0.7 : 1,
                cursor: isSearchingPathway ? "not-allowed" : "pointer"
              }}
            >
              {isSearchingPathway ? "⏳ Searching..." : "🔍 Search"}
            </button>
          </div>

          {/* Pathway Stats */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <button 
              onClick={getPathwayStats}
              disabled={isLoadingPathwayStats}
              style={{
                ...buttonStyle, 
                background: isLoadingPathwayStats ? "#9ca3af" : "#6b7280", 
                padding: "6px 12px", 
                fontSize: "12px",
                opacity: isLoadingPathwayStats ? 0.7 : 1,
                cursor: isLoadingPathwayStats ? "not-allowed" : "pointer"
              }}
            >
              {isLoadingPathwayStats ? "⏳ Loading..." : "📊 Get Stats"}
            </button>
          </div>

          {/* Real-time Activity Feed */}
          {liveActivity.length > 0 && (
            <div style={{ 
              background: "#f0f9ff", 
              border: "1px solid #bae6fd", 
              borderRadius: "8px", 
              padding: "12px", 
              marginBottom: "16px" 
            }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#1e40af" }}>⚡ Live Activity</h4>
              <div style={{ maxHeight: "200px", overflow: "auto" }}>
                {liveActivity.map((activity, index) => (
                  <div key={index} style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    padding: "4px 0",
                    borderBottom: index < liveActivity.length - 1 ? "1px solid #e5e7eb" : "none"
                  }}>
                    <div style={{ fontSize: "12px" }}>
                      <span style={{ fontWeight: "600" }}>{activity.file}</span>
                      <span style={{ color: "#6b7280", marginLeft: "8px" }}>
                        ({activity.type})
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                      {activity.time_ago < 60 ? `${activity.time_ago}s ago` : 
                       activity.time_ago < 3600 ? `${Math.floor(activity.time_ago/60)}m ago` : 
                       `${Math.floor(activity.time_ago/3600)}h ago`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Document */}
          <div style={{ 
            background: "#f8fafc", 
            border: "1px solid #e2e8f0", 
            borderRadius: "8px", 
            padding: "16px", 
            marginBottom: "16px" 
          }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#374151" }}>📝 Add New Document</h4>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <input
                type="text"
                placeholder="Filename (e.g., new_rule.md)"
                value={newDocumentName}
                onChange={(e) => setNewDocumentName(e.target.value)}
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "12px"
                }}
              />
              <select
                value={newDocumentType}
                onChange={(e) => setNewDocumentType(e.target.value)}
                style={{
                  padding: "6px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "12px"
                }}
              >
                <option value="rule">Rule</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            <textarea
              placeholder="Enter document content..."
              value={newDocumentContent}
              onChange={(e) => setNewDocumentContent(e.target.value)}
              style={{
                width: "100%",
                height: "100px",
                padding: "8px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "12px",
                resize: "vertical",
                marginBottom: "8px"
              }}
            />
            <button 
              onClick={addNewDocument}
              style={{
                ...buttonStyle, 
                background: "#10b981", 
                padding: "6px 12px", 
                fontSize: "12px"
              }}
            >
              ➕ Add Document
            </button>
          </div>

          {/* Pathway Stats Display */}
          {pathwayStats && (
            <div style={{ 
              background: "#f8fafc", 
              border: "1px solid #e2e8f0", 
              borderRadius: "8px", 
              padding: "12px", 
              marginBottom: "16px" 
            }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#374151" }}>📊 Live Statistics</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px", fontSize: "12px" }}>
                <div>Documents: {pathwayStats.document_count || 0}</div>
                <div>Recent Changes: {pathwayStats.recent_changes || 0}</div>
                <div>Status: {pathwayStats.live_monitoring ? "🟢 Live" : "🔴 Static"}</div>
                <div>Last Update: {pathwayStats.last_indexed || "Unknown"}</div>
              </div>
            </div>
          )}

          {/* Search Results Display */}
          {pathwayResults.length > 0 && (
            <div style={{ maxHeight: 400, overflow: "auto" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#374151" }}>🔍 Search Results ({pathwayResults.length})</h4>
              {pathwayResults.map((result, index) => (
                <div key={index} style={{ 
                  padding: "12px", 
                  margin: "8px 0", 
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "flex-start",
                    marginBottom: "8px"
                  }}>
                    <div style={{ 
                      fontSize: "12px", 
                      color: "#6b7280",
                      background: "#f3f4f6",
                      padding: "2px 6px",
                      borderRadius: "4px"
                    }}>
                      Score: {result.score ? result.score.toFixed(3) : "N/A"}
                    </div>
                    <div style={{ 
                      fontSize: "11px", 
                      color: "#9ca3af"
                    }}>
                      Result {index + 1}
                    </div>
                  </div>
                  
                  <div style={{ 
                    fontSize: "13px", 
                    color: "#374151", 
                    lineHeight: "1.4",
                    maxHeight: "150px",
                    overflow: "hidden"
                  }}>
                    {result.text ? (
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: result.text
                        }}
                      />
                    ) : "No text content"}
                  </div>
                  
                  {result.metadata && (
                    <div style={{ 
                      marginTop: "8px",
                      fontSize: "11px", 
                      color: "#6b7280",
                      borderTop: "1px solid #e5e7eb",
                      paddingTop: "6px"
                    }}>
                      <strong>Source:</strong> {result.metadata.path || "Unknown"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* System Status Display */}
        {systemStatus && (
        <section style={box}>
          <h3>🔧 System Status</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ padding: "12px", background: systemStatus.landingai_available ? "#f0fdf4" : "#fef2f2", borderRadius: "8px" }}>
              <div style={{ fontWeight: "600", marginBottom: "4px" }}>LandingAI ADE</div>
              <div style={{ color: systemStatus.landingai_available ? "#15803d" : "#dc2626" }}>
                {systemStatus.landingai_available ? "✅ Available" : "❌ Not Configured"}
              </div>
            </div>
            <div style={{ padding: "12px", background: systemStatus.pathway_available ? "#f0fdf4" : "#fef2f2", borderRadius: "8px" }}>
              <div style={{ fontWeight: "600", marginBottom: "4px" }}>Pathway</div>
              <div style={{ color: systemStatus.pathway_available ? "#15803d" : "#dc2626" }}>
                {systemStatus.pathway_available ? "✅ Available" : "❌ Not Configured"}
              </div>
            </div>
          </div>
        </section>
      )}

        {/* Tables Display */}
        {tables.length > 0 && (
          <section style={box}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3>📊 Extracted Tables ({tables.length})</h3>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ 
                  fontSize: "12px", 
                  color: "#6b7280", 
                  background: "#f0f9ff", 
                  padding: "6px 12px", 
                  borderRadius: "6px",
                  border: "1px solid #bae6fd"
                }}>
                  💡 Tables show compliance matrices, risk assessments, and regulatory mappings
                </div>
                <button 
                  onClick={() => setShowTableInfoModal(true)}
                  style={{
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500"
                  }}
                >
                  ℹ️ Info
                </button>
              </div>
            </div>
            <div style={{ maxHeight: 500, overflow: "auto" }}>
              {tables.map((table, index) => (
                <div key={index} style={{ 
                  padding: "16px", 
                  margin: "12px 0", 
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "12px"
                  }}>
                    <h4 style={{ 
                      margin: 0, 
                      fontSize: "16px", 
                      fontWeight: "600",
                      color: "#1f2937"
                    }}>
                      {table.title || `Table ${index + 1}`}
                    </h4>
                    <div style={{ 
                      fontSize: "12px", 
                      color: "#6b7280",
                      background: "#f3f4f6",
                      padding: "4px 8px",
                      borderRadius: "6px"
                    }}>
                      Confidence: {Math.round((table.confidence || 0.9) * 100)}%
                    </div>
                  </div>
                  
                  {/* Render table content as a proper table */}
                  <div style={{ 
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    overflow: "hidden"
                  }}>
                    {table.content && (
                      <div style={{ padding: "12px" }}>
                        {table.content.split('\n').map((row, rowIndex) => {
                          const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
                          if (cells.length === 0) return null;
                          
                          return (
                            <div key={rowIndex} style={{
                              display: "grid",
                              gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
                              gap: "8px",
                              padding: rowIndex === 0 ? "8px 12px" : "6px 12px",
                              background: rowIndex === 0 ? "#f1f5f9" : "transparent",
                              borderBottom: rowIndex === 0 ? "2px solid #cbd5e1" : "1px solid #e2e8f0",
                              fontWeight: rowIndex === 0 ? "600" : "400",
                              fontSize: "14px"
                            }}>
                              {cells.map((cell, cellIndex) => {
                                // Color code based on content
                                let cellStyle = {
                                  padding: "4px 8px",
                                  color: rowIndex === 0 ? "#374151" : "#6b7280",
                                  borderRight: cellIndex < cells.length - 1 ? "1px solid #e2e8f0" : "none"
                                };
                                
                                // Add color coding for risk levels and status
                                if (cell.toLowerCase().includes('high') || cell.toLowerCase().includes('critical')) {
                                  cellStyle.background = "#fef2f2";
                                  cellStyle.color = "#dc2626";
                                  cellStyle.fontWeight = "600";
                                } else if (cell.toLowerCase().includes('medium') || cell.toLowerCase().includes('review')) {
                                  cellStyle.background = "#fffbeb";
                                  cellStyle.color = "#d97706";
                                  cellStyle.fontWeight = "600";
                                } else if (cell.toLowerCase().includes('low') || cell.toLowerCase().includes('compliant')) {
                                  cellStyle.background = "#f0fdf4";
                                  cellStyle.color = "#16a34a";
                                  cellStyle.fontWeight = "600";
                                } else if (cell.toLowerCase().includes('yes') || cell.toLowerCase().includes('no')) {
                                  cellStyle.fontWeight = "600";
                                }
                                
                                return (
                                  <div key={cellIndex} style={cellStyle}>
                                    {cell}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginTop: "12px",
                    fontSize: "12px",
                    color: "#6b7280"
                  }}>
                    <span>Page {table.page || 1}</span>
                    <span>Table ID: {table.table_id || `table_${index + 1}`}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      {/* Explain Modal */}
      {showExplainModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "800px",
            maxHeight: "80vh",
            width: "90%",
            overflow: "auto",
            position: "relative",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
          }}>
            {/* Close button */}
            <button 
              onClick={closeExplainModal}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ✕
            </button>

            {/* Content */}
            <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#1f2937" }}>
              📋 Compliance Explanation
            </h3>

            {loadingExplain ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ fontSize: "18px", color: "#6b7280" }}>Loading...</div>
              </div>
            ) : explainData?.error ? (
              <div style={{ padding: "16px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
                <div style={{ color: "#dc2626", fontWeight: "500", marginBottom: "8px" }}>Error</div>
                <div style={{ color: "#991b1b" }}>{explainData.error}</div>
                {explainData.rawResponse && (
                  <details style={{ marginTop: "12px" }}>
                    <summary style={{ cursor: "pointer", color: "#dc2626" }}>Raw Response</summary>
                    <pre style={{ 
                      background: "#f9fafb", 
                      padding: "8px", 
                      borderRadius: "4px", 
                      fontSize: "12px",
                      overflow: "auto",
                      marginTop: "8px"
                    }}>{explainData.rawResponse}</pre>
                  </details>
                )}
              </div>
            ) : explainData ? (
              <div>
                {/* Header Info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                  <div style={{ padding: "12px", background: "#f3f4f6", borderRadius: "8px" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Flag ID</div>
                    <div style={{ fontWeight: "500" }}>{explainData.id}</div>
                  </div>
                  <div style={{ padding: "12px", background: "#f3f4f6", borderRadius: "8px" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Region</div>
                    <div style={{ fontWeight: "500" }}>{explainData.region}</div>
                  </div>
                </div>

                {/* Contract Evidence */}
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "#374151" }}>📄 Contract Evidence</h4>
                  {explainData.contract ? (
                    <div style={{ padding: "16px", background: "#f0f9ff", borderRadius: "8px", border: "1px solid #bae6fd" }}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong>File:</strong> <code>{explainData.contract.path}</code>
                      </div>
                      {explainData.contract.evidence && (
                        <div>
                          <div style={{ marginBottom: "8px" }}>
                            <strong>Location:</strong> Page {explainData.contract.evidence.page}
                          </div>
                          <div style={{ marginBottom: "8px" }}>
                            <strong>Text Found:</strong> "{explainData.contract.evidence.text || 'Contract field content'}"
                          </div>
                          <div style={{ fontSize: "12px", color: "#0c4a6e" }}>
                            This text was extracted from the contract file during analysis.
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: "12px", background: "#f9fafb", borderRadius: "6px", color: "#6b7280" }}>
                      No contract evidence available
                    </div>
                  )}
                </div>

                {/* Rule Evidence */}
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "#374151" }}>📋 Compliance Rule</h4>
                  {explainData.rule_snippet ? (
                    <div style={{ padding: "16px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                      <div style={{ 
                        whiteSpace: "pre-wrap", 
                        fontSize: "14px",
                        lineHeight: "1.5",
                        color: "#166534"
                      }}>
                        {explainData.rule_snippet}
                      </div>
                      <div style={{ fontSize: "12px", color: "#15803d", marginTop: "8px" }}>
                        This rule snippet was matched against your compliance rules.
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "12px", background: "#f9fafb", borderRadius: "6px", color: "#6b7280" }}>
                      No rule snippet available
                    </div>
                  )}
                </div>

                {/* Action Section */}
                <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
                  <button 
                    onClick={closeExplainModal}
                    style={{
                      background: "#6b7280",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Risk Correlations Info Modal */}
      {showRiskInfoModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto"
          }}>
            <h3 style={{ marginTop: 0, color: "#7c3aed" }}>🔗 Risk Correlation Analysis</h3>
            <p><strong>What it does:</strong> Finds hidden connections and conflicts between different documents, clauses, and compliance requirements.</p>
            
            <h4 style={{ color: "#374151", marginTop: "20px" }}>Why This Matters:</h4>
            <ul style={{ paddingLeft: "20px" }}>
              <li><strong>Cross-Document Conflicts:</strong> Identifies when clauses in different contracts contradict each other</li>
              <li><strong>Jurisdiction Mismatches:</strong> Spots when tax, labor, or privacy laws conflict across regions</li>
              <li><strong>Hidden Dependencies:</strong> Reveals how changes in one document affect compliance in others</li>
              <li><strong>Risk Amplification:</strong> Shows how multiple small issues combine into major risks</li>
            </ul>

            <h4 style={{ color: "#374151", marginTop: "20px" }}>Real Business Value:</h4>
            <ul style={{ paddingLeft: "20px" }}>
              <li><strong>Due Diligence:</strong> Catch compliance conflicts before they become legal issues</li>
              <li><strong>Risk Management:</strong> Prioritize which compliance issues need immediate attention</li>
              <li><strong>Cost Savings:</strong> Avoid expensive legal disputes and regulatory fines</li>
              <li><strong>Strategic Planning:</strong> Understand how regulatory changes affect your entire contract portfolio</li>
            </ul>

            <h4 style={{ color: "#374151", marginTop: "20px" }}>How It Works:</h4>
            <p>The AI analyzes document content using LandingAI ADE to extract key compliance fields, then uses advanced correlation algorithms to find patterns and conflicts that human reviewers might miss.</p>

            <button 
              onClick={() => setShowRiskInfoModal(false)}
              style={{
                background: "#7c3aed",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                marginTop: "16px"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Tables Info Modal */}
      {showTableInfoModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto"
          }}>
            <h3 style={{ marginTop: 0, color: "#dc2626" }}>📊 Table Extraction & Analysis</h3>
            <p><strong>What it does:</strong> Uses LandingAI ADE's DPT-2 model to extract structured data from documents, converting unstructured PDFs into queryable compliance matrices and risk assessments.</p>
            
            <h4 style={{ color: "#374151", marginTop: "20px" }}>Types of Tables Extracted:</h4>
            <ul style={{ paddingLeft: "20px" }}>
              <li><strong>Compliance Matrices:</strong> Track which requirements are met/missing across different regulations</li>
              <li><strong>Risk Assessment Tables:</strong> Quantify risk levels and mitigation strategies</li>
              <li><strong>Tax Withholding Schedules:</strong> Different rates by country and treaty benefits</li>
              <li><strong>Financial Data Tables:</strong> Revenue, costs, liabilities from financial statements</li>
              <li><strong>Regulatory Mapping:</strong> Map requirements to specific regulations and standards</li>
            </ul>

            <h4 style={{ color: "#374151", marginTop: "20px" }}>Business Applications:</h4>
            <ul style={{ paddingLeft: "20px" }}>
              <li><strong>Due Diligence:</strong> Quickly scan compliance status across multiple documents</li>
              <li><strong>Audit Preparation:</strong> Generate compliance dashboards automatically</li>
              <li><strong>Risk Management:</strong> Identify high-risk areas that need immediate attention</li>
              <li><strong>Cross-border Analysis:</strong> Compare requirements across different jurisdictions</li>
              <li><strong>Financial Analysis:</strong> Extract and analyze financial data from complex documents</li>
            </ul>

            <h4 style={{ color: "#374151", marginTop: "20px" }}>Technical Innovation:</h4>
            <p>Uses LandingAI's latest DPT-2 model for superior table extraction, providing confidence scores, evidence tracking, and structured output that can be queried and analyzed programmatically.</p>

            <button 
              onClick={() => setShowTableInfoModal(false)}
              style={{
                background: "#dc2626",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                marginTop: "16px"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Pathway Info Modal */}
      {showPathwayInfoModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto"
          }}>
            <h3 style={{ marginTop: 0, color: "#7c3aed" }}>🔍 Pathway Live Search</h3>
            <p><strong>What it does:</strong> Provides real-time document indexing and hybrid search across your compliance rules and contracts using Pathway's live vector store.</p>
            
            <h4 style={{ color: "#374151", marginTop: "20px" }}>Key Features:</h4>
            <ul style={{ paddingLeft: "20px" }}>
              <li><strong>Real-time Indexing:</strong> Automatically indexes documents as they're added or modified</li>
              <li><strong>Hybrid Search:</strong> Combines vector similarity with BM25 keyword matching for better results</li>
              <li><strong>Live Updates:</strong> Search results update instantly when documents change</li>
              <li><strong>Semantic Understanding:</strong> Finds relevant content even with different wording</li>
            </ul>

            <h4 style={{ color: "#374151", marginTop: "20px" }}>How It Works:</h4>
            <ul style={{ paddingLeft: "20px" }}>
              <li><strong>Document Processing:</strong> Pathway monitors the rules and contracts directories</li>
              <li><strong>Vector Embeddings:</strong> Uses sentence transformers to create semantic representations</li>
              <li><strong>Hybrid Index:</strong> Maintains both vector and keyword indexes for comprehensive search</li>
              <li><strong>Real-time Queries:</strong> Search across all indexed content with relevance scoring</li>
            </ul>

            <h4 style={{ color: "#374151", marginTop: "20px" }}>Business Value:</h4>
            <ul style={{ paddingLeft: "20px" }}>
              <li><strong>Instant Knowledge:</strong> Find relevant compliance rules and contract clauses instantly</li>
              <li><strong>Comprehensive Coverage:</strong> Search across all documents simultaneously</li>
              <li><strong>Contextual Results:</strong> Get semantically relevant results, not just keyword matches</li>
              <li><strong>Always Up-to-date:</strong> Results reflect the latest document changes automatically</li>
            </ul>

            <button 
              onClick={() => setShowPathwayInfoModal(false)}
              style={{
                background: "#7c3aed",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                marginTop: "16px"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* AI Agent Results */}
      {agentResults && (
        <div style={{ 
          background: "#f0f9ff", 
          padding: "16px", 
          borderRadius: "8px", 
          marginBottom: "16px", 
          border: "1px solid #bfdbfe" 
        }}>
          <h4 style={{ color: "#1e40af", marginBottom: "8px" }}>🤖 AI Agent Results</h4>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>
            <strong>Agent Used:</strong> {agentResults.agent_used} | 
            <strong> Execution Time:</strong> {agentResults.execution_time?.toFixed(2)}s |
            <strong> Status:</strong> {agentResults.success ? "✅ Success" : "❌ Failed"}
          </div>
          {agentResults.success && agentResults.result && (
            <details style={{ marginTop: "8px" }}>
              <summary style={{ cursor: "pointer", color: "#1e40af", fontSize: "12px" }}>
                🔧 View Agent Details
              </summary>
              <pre style={{ 
                background: "white", 
                padding: "8px", 
                borderRadius: "4px", 
                marginTop: "8px", 
                fontSize: "10px", 
                overflow: "auto",
                maxHeight: "200px",
                border: "1px solid #e5e7eb"
              }}>
                {JSON.stringify(agentResults.result, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* How to Use Modal */}
      {showHowToUseModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            padding: "32px",
            borderRadius: "16px",
            maxWidth: "800px",
            width: "90%",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0, color: "#1f2937", fontSize: "24px", fontWeight: "600" }}>📖 How to Use Compliance Copilot</h2>
              <button 
                onClick={() => setShowHowToUseModal(false)}
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ lineHeight: "1.6", color: "#374151" }}>
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ color: "#1f2937", fontSize: "18px", marginBottom: "12px" }}>🎯 Overview</h3>
                <p>Compliance Copilot is an AI-powered system that helps analyze contracts and documents for compliance across different jurisdictions. It combines LandingAI for document extraction and Pathway for real-time document indexing and search.</p>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ color: "#1f2937", fontSize: "18px", marginBottom: "12px" }}>🚀 Getting Started</h3>
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", marginBottom: "12px" }}>
                  <h4 style={{ color: "#1e40af", marginBottom: "8px" }}>Step 1: Upload a Contract</h4>
                  <p>• Click "Choose File" in the Contract Upload section</p>
                  <p>• Select a PDF contract document</p>
                  <p>• Click "Upload & Analyze" to process the document</p>
                </div>
                
                <div style={{ background: "#f0fdf4", padding: "16px", borderRadius: "8px", marginBottom: "12px" }}>
                  <h4 style={{ color: "#16a34a", marginBottom: "8px" }}>Step 2: Add Compliance Rules</h4>
                  <p>• Use the "Add Rule" section to upload rule files</p>
                  <p>• Or use the inline editor to create custom rules</p>
                  <p>• Rules are automatically indexed for real-time search</p>
                </div>

                <div style={{ background: "#fef3c7", padding: "16px", borderRadius: "8px" }}>
                  <h4 style={{ color: "#d97706", marginBottom: "8px" }}>Step 3: Analyze Compliance</h4>
                  <p>• Click "Check Compliance" to analyze the contract</p>
                  <p>• Review the compliance flags and evidence</p>
                  <p>• Use the region selector to check jurisdiction-specific rules</p>
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ color: "#1f2937", fontSize: "18px", marginBottom: "12px" }}>🔍 Advanced Features</h3>
                
                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ color: "#7c3aed", marginBottom: "8px" }}>🔗 Risk Correlation Analysis</h4>
                  <p>• Click "Risk Correlation Analysis" to find hidden connections between documents</p>
                  <p>• Identifies cross-document conflicts and dependencies</p>
                  <p>• Shows risk levels and confidence scores</p>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ color: "#dc2626", marginBottom: "8px" }}>📊 Table Extraction</h4>
                  <p>• Click "Extract Tables" to extract structured data from documents</p>
                  <p>• Uses LandingAI ADE for accurate table recognition</p>
                  <p>• Perfect for compliance matrices and risk assessments</p>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ color: "#7c3aed", marginBottom: "8px" }}>🔍 Pathway Live Search</h4>
                  <p>• Search across all documents in real-time</p>
                  <p>• See highlighted search terms in context</p>
                  <p>• Add new documents that are immediately searchable</p>
                  <p>• Watch the live activity feed for document changes</p>
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ color: "#1f2937", fontSize: "18px", marginBottom: "12px" }}>💡 Demo Scenarios</h3>
                
                <div style={{ background: "#f0f9ff", padding: "16px", borderRadius: "8px", marginBottom: "12px" }}>
                  <h4 style={{ color: "#1e40af", marginBottom: "8px" }}>Scenario 1: GDPR Compliance Check</h4>
                  <p>1. Upload a data processing contract</p>
                  <p>2. Search for "GDPR data processing" in Pathway search</p>
                  <p>3. Check compliance to see GDPR-specific flags</p>
                  <p>4. Use risk correlation to find related privacy clauses</p>
                </div>

                <div style={{ background: "#f0fdf4", padding: "16px", borderRadius: "8px", marginBottom: "12px" }}>
                  <h4 style={{ color: "#16a34a", marginBottom: "8px" }}>Scenario 2: Employment Law Analysis</h4>
                  <p>1. Upload an employment contract</p>
                  <p>2. Search for "working time regulations"</p>
                  <p>3. Extract tables to see compliance matrices</p>
                  <p>4. Check region-specific employment law compliance</p>
                </div>

                <div style={{ background: "#fef3c7", padding: "16px", borderRadius: "8px" }}>
                  <h4 style={{ color: "#d97706", marginBottom: "8px" }}>Scenario 3: Real-Time Document Management</h4>
                  <p>1. Add a new compliance rule using the document upload form</p>
                  <p>2. Watch the live activity feed update</p>
                  <p>3. Search for the new rule immediately</p>
                  <p>4. See statistics update in real-time</p>
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ color: "#1f2937", fontSize: "18px", marginBottom: "12px" }}>🎨 UI Features</h3>
                <ul style={{ paddingLeft: "20px" }}>
                  <li><strong>Region Selector:</strong> Choose EU, US, or India for jurisdiction-specific analysis</li>
                  <li><strong>Live Statistics:</strong> Real-time document counts and activity tracking</li>
                  <li><strong>Highlighted Search:</strong> Search terms are highlighted in context</li>
                  <li><strong>Info Modals:</strong> Click ℹ️ buttons for detailed explanations</li>
                  <li><strong>Loading States:</strong> Visual feedback during processing</li>
                </ul>
              </div>

              <div style={{ background: "#fef2f2", padding: "16px", borderRadius: "8px" }}>
                <h4 style={{ color: "#dc2626", marginBottom: "8px" }}>⚠️ Important Notes</h4>
                <ul style={{ paddingLeft: "20px", margin: 0 }}>
                  <li>Ensure both backend (port 8001) and frontend (port 3000) are running</li>
                  <li>LandingAI API key is configured for document extraction</li>
                  <li>Pathway provides real-time indexing and search capabilities</li>
                  <li>All data is processed locally for privacy and security</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}



