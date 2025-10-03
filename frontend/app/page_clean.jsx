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
      
      .section-card {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
      }
      
      .section-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(0,0,0,0.15);
      }
      
      .button-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        transition: all 0.3s ease;
      }
      
      .button-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
      }
      
      .button-secondary {
        background: rgba(255, 255, 255, 0.9);
        color: #374151;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 10px 20px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;
      }
      
      .button-secondary:hover {
        background: rgba(255, 255, 255, 1);
        transform: translateY(-1px);
      }
      
      .region-selector {
        display: flex;
        gap: 8px;
        background: rgba(255, 255, 255, 0.1);
        padding: 4px;
        border-radius: 12px;
      }
      
      .region-option {
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;
        border: none;
        background: transparent;
        color: #6b7280;
      }
      
      .region-option.active {
        background: rgba(255, 255, 255, 0.9);
        color: #1f2937;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }
      
      .stat-card {
        background: rgba(255, 255, 255, 0.9);
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .flag-card {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all 0.3s ease;
      }
      
      .flag-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
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
  
  // Loading states
  const [isAnalyzingRisk, setIsAnalyzingRisk] = useState(false);
  const [isExtractingTables, setIsExtractingTables] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isSearchingPathway, setIsSearchingPathway] = useState(false);
  const [isLoadingPathwayStats, setIsLoadingPathwayStats] = useState(false);
  
  // Agent states
  const [agents, setAgents] = useState([]);
  const [agentStatus, setAgentStatus] = useState({});
  const [agentResults, setAgentResults] = useState(null);

  // Helper functions
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setContractFile(file);
    }
  };

  const runCheck = async () => {
    try {
      const formData = new FormData();
      if (contractFile) {
        formData.append("file", contractFile);
      }
      
      const response = await fetch(`${API_BASE}/check?region=${region}`, {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setFlags(data);
      }
    } catch (error) {
      console.error("Error running check:", error);
    }
  };

  const explain = async (flagId) => {
    try {
      const response = await fetch(`${API_BASE}/explain?id=${flagId}&region=${region}`);
      if (response.ok) {
        const data = await response.json();
        alert(`Explanation: ${data.rule_snippet}`);
      }
    } catch (error) {
      console.error("Error getting explanation:", error);
    }
  };

  const downloadJSON = () => {
    const dataStr = JSON.stringify(flags, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "compliance_flags.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const headers = ["ID", "Category", "Region", "Risk Level", "Rationale"];
    const csvContent = [
      headers.join(","),
      ...flags.map(flag => [
        flag.id,
        flag.category,
        flag.region,
        flag.risk_level,
        `"${flag.rationale}"`
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "compliance_flags.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Novel features functions
  const analyzeRiskCorrelation = async () => {
    setIsAnalyzingRisk(true);
    try {
      const response = await fetch(`${API_BASE}/risk_correlation?region=${region}`);
      const data = await response.json();
      setRiskCorrelations(data.correlations || []);
    } catch (error) {
      console.error("Risk correlation analysis failed:", error);
    } finally {
      setIsAnalyzingRisk(false);
    }
  };

  const extractTables = async () => {
    setIsExtractingTables(true);
    try {
      const response = await fetch(`${API_BASE}/extract_tables`);
      const data = await response.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error("Table extraction failed:", error);
    } finally {
      setIsExtractingTables(false);
    }
  };

  const checkSystemStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const response = await fetch(`${API_BASE}/system_status`);
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error("System status check failed:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Pathway functions
  const searchPathway = async () => {
    if (!pathwaySearchQuery.trim()) return;
    
    setIsSearchingPathway(true);
    try {
      const response = await fetch(`${API_BASE}/pathway_search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: pathwaySearchQuery })
      });
      const data = await response.json();
      setPathwayResults(data.results || []);
    } catch (error) {
      console.error("Pathway search failed:", error);
    } finally {
      setIsSearchingPathway(false);
    }
  };

  const getPathwayStats = async () => {
    setIsLoadingPathwayStats(true);
    try {
      const response = await fetch(`${API_BASE}/pathway_stats`);
      const data = await response.json();
      setPathwayStats(data);
    } catch (error) {
      console.error("Failed to load Pathway stats:", error);
    } finally {
      setIsLoadingPathwayStats(false);
    }
  };

  const getLiveActivity = async () => {
    try {
      const response = await fetch(`${API_BASE}/pathway_live_activity`);
      const data = await response.json();
      setLiveActivity(data.activities || []);
    } catch (error) {
      console.error("Failed to load live activity:", error);
    }
  };

  const addNewDocument = async () => {
    if (!newDocumentContent.trim() || !newDocumentName.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE}/pathway_add_document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newDocumentContent,
          name: newDocumentName,
          type: newDocumentType
        })
      });
      
      if (response.ok) {
        setNewDocumentContent("");
        setNewDocumentName("");
        getPathwayStats();
        getLiveActivity();
      }
    } catch (error) {
      console.error("Failed to add document:", error);
    }
  };

  // Auto-refresh Pathway stats and live activity
  useEffect(() => {
    getPathwayStats();
    getLiveActivity();
    
    const interval = setInterval(() => {
      getPathwayStats();
      getLiveActivity();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="gradient-bg" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="glass-effect" style={{ 
        padding: "20px 0", 
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: "32px", 
                fontWeight: "800", 
                color: "#1f2937",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                🤖 Compliance Copilot
              </h1>
              <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: "14px" }}>
                AI-Powered Contract Compliance Analysis
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ 
                background: "rgba(255,255,255,0.9)", 
                padding: "6px 12px", 
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#374151"
              }}>
                {region} Region
              </div>
              <button 
                onClick={() => setShowHowToUseModal(true)}
                className="button-primary"
              >
                📖 How to Use
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
        
        {/* Control Panel */}
        <div className="section-card">
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "600", color: "#1f2937" }}>
              🎛️ Control Panel
            </h2>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
              Configure compliance analysis parameters
            </p>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {/* Region Selection */}
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#374151" }}>
                Region
              </label>
              <div className="region-selector">
                {["EU", "US", "IN", "UK"].map((r) => (
                  <button
                    key={r}
                    className={`region-option ${region === r ? "active" : ""}`}
                    onClick={() => setRegion(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#374151" }}>
                Contract File
              </label>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
            <button onClick={runCheck} className="button-primary">
              🔍 Run Compliance Check
            </button>
            <button onClick={analyzeRiskCorrelation} className="button-secondary" disabled={isAnalyzingRisk}>
              {isAnalyzingRisk ? "⏳ Analyzing..." : "🔗 Analyze Risk Correlation"}
            </button>
            <button onClick={extractTables} className="button-secondary" disabled={isExtractingTables}>
              {isExtractingTables ? "⏳ Extracting..." : "📊 Extract Tables"}
            </button>
            <button onClick={checkSystemStatus} className="button-secondary" disabled={isCheckingStatus}>
              {isCheckingStatus ? "⏳ Checking..." : "🔧 System Status"}
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {flags.length > 0 && (
          <div className="stats-grid">
            <div className="stat-card">
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>
                {flags.length}
              </div>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>Total Flags</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#dc2626" }}>
                {flags.filter(f => f.risk_level === "HIGH").length}
              </div>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>High Risk</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#d97706" }}>
                {flags.filter(f => f.risk_level === "MEDIUM").length}
              </div>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>Medium Risk</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#16a34a" }}>
                {flags.filter(f => f.risk_level === "LOW").length}
              </div>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>Low Risk</div>
            </div>
          </div>
        )}

        {/* Compliance Flags */}
        {flags.length > 0 && (
          <div className="section-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "600", color: "#1f2937" }}>
                  🚩 Compliance Flags ({flags.length})
                </h2>
                <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
                  AI-powered compliance analysis results
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={downloadJSON} className="button-secondary">
                  📄 JSON
                </button>
                <button onClick={downloadCSV} className="button-secondary">
                  📊 CSV
                </button>
              </div>
            </div>
            
            <div style={{ maxHeight: "500px", overflow: "auto" }}>
              {flags.map((flag, index) => {
                const getFlagColors = (riskLevel) => {
                  if (riskLevel === "HIGH") {
                    return {
                      background: "#fef2f2",
                      border: "#fecaca", 
                      text: "#dc2626",
                      priority: "🔴"
                    };
                  } else if (riskLevel === "MEDIUM") {
                    return {
                      background: "#fffbeb",
                      border: "#fed7aa",
                      text: "#d97706", 
                      priority: "🟡"
                    };
                  } else {
                    return {
                      background: "#f0fdf4",
                      border: "#bbf7d0",
                      text: "#16a34a",
                      priority: "🟢"
                    };
                  }
                };
                
                const colors = getFlagColors(flag.risk_level);
                
                return (
                  <div key={index} className="flag-card" style={{ 
                    background: colors.background,
                    border: `2px solid ${colors.border}`,
                    position: "relative"
                  }}>
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
                          background: colors.background,
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
                        background: "rgba(255,255,255,0.8)",
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
                    
                    {/* Priority indicator */}
                    <div style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      fontSize: "18px"
                    }}>
                      {colors.priority}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Risk Correlations */}
        {riskCorrelations.length > 0 && (
          <div className="section-card">
            <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: "600", color: "#1f2937" }}>
              🔗 Risk Correlations ({riskCorrelations.length})
            </h2>
            <div style={{ display: "grid", gap: "12px" }}>
              {riskCorrelations.map((correlation, index) => (
                <div key={index} style={{
                  background: "rgba(255,255,255,0.8)",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.2)"
                }}>
                  <div style={{ fontWeight: "600", marginBottom: "8px", color: "#1f2937" }}>
                    {correlation.correlation_type}
                  </div>
                  <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>
                    {correlation.description}
                  </div>
                  <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                    Risk Level: {correlation.risk_level} | Confidence: {correlation.confidence}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tables */}
        {tables.length > 0 && (
          <div className="section-card">
            <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: "600", color: "#1f2937" }}>
              📊 Extracted Tables ({tables.length})
            </h2>
            <div style={{ display: "grid", gap: "16px" }}>
              {tables.map((table, index) => (
                <div key={index} style={{
                  background: "rgba(255,255,255,0.8)",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.2)"
                }}>
                  <div style={{ fontWeight: "600", marginBottom: "12px", color: "#1f2937" }}>
                    Table {index + 1}
                  </div>
                  <div style={{ overflow: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          {table.headers?.map((header, i) => (
                            <th key={i} style={{ padding: "8px 12px", textAlign: "left", fontSize: "12px", fontWeight: "600" }}>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows?.map((row, rowIndex) => (
                          <tr key={rowIndex} style={{ borderBottom: "1px solid #e5e7eb" }}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} style={{ padding: "8px 12px", fontSize: "12px" }}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Status */}
        {systemStatus && (
          <div className="section-card">
            <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: "600", color: "#1f2937" }}>
              🔧 System Status
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              {Object.entries(systemStatus).map(([key, value]) => (
                <div key={key} style={{
                  background: "rgba(255,255,255,0.8)",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.2)"
                }}>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                    {key.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937" }}>
                    {typeof value === 'boolean' ? (value ? '✅' : '❌') : value}
                  </div>
                </div>
              ))}
            </div>
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
              maxWidth: "600px",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
            }}>
              <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: "600" }}>
                📖 How to Use Compliance Copilot
              </h2>
              <div style={{ fontSize: "14px", lineHeight: "1.6", color: "#374151" }}>
                <p><strong>1. Select Region:</strong> Choose the jurisdiction (EU, US, IN, UK) for compliance analysis.</p>
                <p><strong>2. Upload Contract:</strong> Upload your contract file (PDF, DOC, DOCX).</p>
                <p><strong>3. Run Analysis:</strong> Click "Run Compliance Check" to analyze the contract.</p>
                <p><strong>4. Review Flags:</strong> Examine compliance flags with color-coded risk levels.</p>
                <p><strong>5. Get Explanations:</strong> Click "Explain" on any flag for detailed information.</p>
                <p><strong>6. Export Results:</strong> Download results as JSON or CSV for further analysis.</p>
              </div>
              <button
                onClick={() => setShowHowToUseModal(false)}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  marginTop: "20px"
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
