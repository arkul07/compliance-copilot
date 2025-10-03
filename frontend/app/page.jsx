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
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [explainData, setExplainData] = useState(null);
  const [loadingExplain, setLoadingExplain] = useState(false);

  // Loading states
  const [isAnalyzingRisk, setIsAnalyzingRisk] = useState(false);
  const [isExtractingTables, setIsExtractingTables] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isSearchingPathway, setIsSearchingPathway] = useState(false);
  const [isLoadingPathwayStats, setIsLoadingPathwayStats] = useState(false);
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  
  // LandingAI ADE status
  const [landingaiStatus, setLandingaiStatus] = useState(null);
  const [extractedFields, setExtractedFields] = useState([]);
  
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
    setIsRunningCheck(true);
    try {
      // First upload the contract if a file is selected
      if (contractFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", contractFile);
        
        const uploadResponse = await fetch(`${API_BASE}/upload_contract`, {
          method: "POST",
          body: uploadFormData,
        });
        
        if (!uploadResponse.ok) {
          console.error("Failed to upload contract");
          alert("❌ Failed to upload contract. Please try again.");
      return;
    }
    
        const uploadData = await uploadResponse.json();
        console.log("Contract uploaded successfully:", uploadData);
      }
      
      // Then run the compliance check
      const response = await fetch(`${API_BASE}/check?region=${region}`, {
        method: "GET",
      });
      
      if (response.ok) {
        const data = await response.json();
        setFlags(data);
        console.log(`✅ Found ${data.length} compliance flags for ${region} region`);
        
        // Show LandingAI ADE activity
        setLandingaiStatus({
          status: "active",
          message: "LandingAI ADE successfully analyzed contract fields",
          fields_extracted: data.length > 0 ? "Multiple compliance fields detected" : "No compliance issues found"
        });
        
        // Show success message
      if (data.length === 0) {
        alert("✅ No compliance issues found for the selected region!");
      } else {
          alert(`🔍 Found ${data.length} compliance issue(s). Check the flags below for details.`);
        }
      } else {
        console.error("Compliance check failed:", response.status);
        alert("❌ Compliance check failed. Please try again.");
      }
    } catch (error) {
      console.error("Error running check:", error);
      alert("❌ Error running compliance check. Please try again.");
    } finally {
      setIsRunningCheck(false);
    }
  };

  const explain = async (flagId) => {
    setLoadingExplain(true);
    setShowExplainModal(true);
    
    try {
      const response = await fetch(`${API_BASE}/explain?id=${flagId}&region=${region}`);
      if (response.ok) {
        const data = await response.json();
        setExplainData(data);
      } else {
        setExplainData({ 
          error: `Failed to get explanation: ${response.status} ${response.statusText}` 
        });
      }
    } catch (error) {
      setExplainData({ 
        error: `Request failed: ${error.message}` 
      });
    } finally {
      setLoadingExplain(false);
    }
  };

  const closeExplainModal = () => {
    setShowExplainModal(false);
    setExplainData(null);
    setLoadingExplain(false);
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
      
      // Show LandingAI ADE table extraction activity
      setLandingaiStatus({
        status: "active",
        message: "LandingAI ADE DPT-2 model extracted structured tables",
        fields_extracted: `Found ${data.tables?.length || 0} tables with AI analysis`,
        ai_analysis: data.ai_analysis
      });
      
      console.log("LandingAI ADE Table Extraction:", data);
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
      
      // Also check LandingAI ADE status
      if (data.landingai_available) {
        setLandingaiStatus({
          status: "available",
          message: "LandingAI ADE is configured and ready",
          fields_extracted: "DPT-2 model ready for document analysis"
        });
      } else {
        setLandingaiStatus({
          status: "unavailable",
          message: "LandingAI ADE not configured",
          fields_extracted: "Using fallback extraction methods"
        });
      }
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
               {landingaiStatus && (
                 <div style={{ 
                   background: landingaiStatus.status === "active" || landingaiStatus.status === "available" ? "#f0fdf4" : "#fef2f2",
                   border: `1px solid ${landingaiStatus.status === "active" || landingaiStatus.status === "available" ? "#bbf7d0" : "#fecaca"}`,
                   padding: "6px 12px", 
                   borderRadius: "20px",
                   fontSize: "12px",
                   fontWeight: "600",
                   color: landingaiStatus.status === "active" || landingaiStatus.status === "available" ? "#16a34a" : "#dc2626",
                   display: "flex",
                   alignItems: "center",
                   gap: "6px"
                 }}>
                   <div style={{
                     width: "8px",
                     height: "8px",
                     borderRadius: "50%",
                     background: landingaiStatus.status === "active" || landingaiStatus.status === "available" ? "#16a34a" : "#dc2626"
                   }}></div>
                   🤖 LandingAI ADE
                 </div>
               )}
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
             <button 
               onClick={runCheck} 
               className="button-primary"
               disabled={isRunningCheck}
               style={{
                 opacity: isRunningCheck ? 0.7 : 1,
                 cursor: isRunningCheck ? "not-allowed" : "pointer"
               }}
             >
               {isRunningCheck ? "⏳ Analyzing..." : "🔍 Run Compliance Check"}
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
            <div style={{ 
              background: "rgba(254, 243, 199, 0.3)", 
              padding: "12px", 
              borderRadius: "8px", 
              marginBottom: "16px",
              border: "1px solid rgba(251, 191, 36, 0.3)"
            }}>
              <div style={{ fontSize: "14px", color: "#92400e", fontWeight: "500" }}>
                ⚠️ <strong>What This Means:</strong> Risk correlations identify hidden compliance issues that emerge when multiple contract elements interact. These are often missed by traditional single-field analysis.
              </div>
            </div>
            <div style={{ display: "grid", gap: "16px" }}>
              {riskCorrelations.map((correlation, index) => (
                <div key={index} style={{
                  background: correlation.risk_level === "HIGH" ? "rgba(254, 226, 226, 0.8)" : 
                             correlation.risk_level === "MEDIUM" ? "rgba(254, 243, 199, 0.8)" : 
                             "rgba(240, 253, 244, 0.8)",
                  padding: "20px",
                  borderRadius: "12px",
                  border: `2px solid ${correlation.risk_level === "HIGH" ? "#fecaca" : 
                                         correlation.risk_level === "MEDIUM" ? "#fde68a" : 
                                         "#bbf7d0"}`,
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                }}>
                  {/* Header with risk level indicator */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <div style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: correlation.risk_level === "HIGH" ? "#dc2626" : 
                                 correlation.risk_level === "MEDIUM" ? "#d97706" : 
                                 "#16a34a"
                    }}></div>
                    <div style={{ fontWeight: "700", fontSize: "16px", color: "#1f2937" }}>
                      {correlation.correlation_type?.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    <div style={{
                      background: correlation.risk_level === "HIGH" ? "#dc2626" : 
                                 correlation.risk_level === "MEDIUM" ? "#d97706" : 
                                 "#16a34a",
                      color: "white",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600"
                    }}>
                      {correlation.risk_level} RISK
                    </div>
                  </div>

                  {/* Detailed explanation */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontWeight: "600", marginBottom: "8px", color: "#374151", fontSize: "15px" }}>
                      📋 What's Happening:
                    </div>
                    <div style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.6", marginBottom: "12px" }}>
                      {correlation.description}
                    </div>
                  </div>

                  {/* Violation details */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontWeight: "600", marginBottom: "8px", color: "#374151", fontSize: "15px" }}>
                      ⚖️ Potential Violations:
                    </div>
                    <div style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.6" }}>
                      {correlation.correlation_type === "temporal_conflict" && (
                        <div>
                          <strong>• Notice Period Conflicts:</strong> Different sections of the contract specify conflicting notice periods, which could lead to legal disputes about which terms apply.<br/>
                          <strong>• Termination Rights:</strong> Conflicting termination clauses may violate employment law requirements for consistent contract terms.<br/>
                          <strong>• Legal Uncertainty:</strong> Ambiguous terms create legal risk and potential for costly litigation.
                        </div>
                      )}
                      {correlation.correlation_type === "jurisdiction_conflict" && (
                        <div>
                          <strong>• Governing Law Conflicts:</strong> Multiple jurisdictions specified may violate conflict of law principles.<br/>
                          <strong>• Regulatory Compliance:</strong> Different legal frameworks may have incompatible requirements.<br/>
                          <strong>• Enforcement Issues:</strong> Courts may refuse to enforce contracts with conflicting jurisdiction clauses.
                        </div>
                      )}
                      {correlation.correlation_type === "data_flow_risk" && (
                        <div>
                          <strong>• Data Protection Violations:</strong> Cross-border data transfers without proper safeguards may violate GDPR, CCPA, or other privacy laws.<br/>
                          <strong>• Consent Requirements:</strong> Inadequate consent mechanisms for data processing across different systems.<br/>
                          <strong>• Regulatory Reporting:</strong> Failure to comply with data breach notification requirements across jurisdictions.
                        </div>
                      )}
                      {correlation.correlation_type === "supplier_risk" && (
                        <div>
                          <strong>• Third-Party Liability:</strong> Inadequate due diligence on suppliers may violate anti-corruption laws.<br/>
                          <strong>• Supply Chain Compliance:</strong> Failure to ensure supplier compliance with applicable regulations.<br/>
                          <strong>• Reputational Risk:</strong> Association with non-compliant suppliers may violate corporate governance requirements.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Affected fields */}
                  {correlation.fields && correlation.fields.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ fontWeight: "600", marginBottom: "8px", color: "#374151", fontSize: "15px" }}>
                        📄 Affected Contract Sections:
                      </div>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {correlation.fields.map((field, fieldIndex) => (
                          <div key={fieldIndex} style={{
                            background: "rgba(255,255,255,0.7)",
                            padding: "12px",
                            borderRadius: "8px",
                            border: "1px solid rgba(0,0,0,0.1)"
                          }}>
                            <div style={{ fontWeight: "500", color: "#1f2937", marginBottom: "4px" }}>
                              {field.name?.replace(/_/g, ' ').toUpperCase()}
                            </div>
                            <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.4" }}>
                              {(() => {
                                let displayValue = field.value;
                                if (typeof displayValue === 'string') {
                                  // Clean up any Chunk object strings
                                  if (displayValue.includes('Chunk(')) {
                                    // Extract markdown content from Chunk string
                                    const markdownMatch = displayValue.match(/markdown="([^"]*)"/);
                                    if (markdownMatch) {
                                      displayValue = markdownMatch[1];
                                    } else {
                                      displayValue = displayValue.substring(0, 200) + '...';
                                    }
                                  }
                                  // Clean up HTML tags and show clean text
                                  displayValue = displayValue
                                    .replace(/<[^>]*>/g, '') // Remove HTML tags
                                    .replace(/&lt;/g, '<')
                                    .replace(/&gt;/g, '>')
                                    .replace(/&amp;/g, '&')
                                    .trim();
                                  
                                  // If text is long, show with expandable dropdown
                                  if (displayValue.length > 200) {
                                    return (
                                      <div>
                                        <div style={{ marginBottom: "8px" }}>
                                          {displayValue.substring(0, 200)}...
                                        </div>
                                        <details style={{ cursor: "pointer" }}>
                                          <summary style={{ 
                                            color: "#3b82f6", 
                                            fontWeight: "500",
                                            fontSize: "12px",
                                            marginBottom: "8px"
                                          }}>
                                            📖 Show Full Text
                                          </summary>
                                          <div style={{
                                            background: "rgba(248, 250, 252, 0.8)",
                                            padding: "12px",
                                            borderRadius: "6px",
                                            border: "1px solid rgba(0,0,0,0.1)",
                                            marginTop: "8px",
                                            whiteSpace: "pre-wrap",
                                            fontSize: "12px",
                                            lineHeight: "1.5",
                                            maxHeight: "300px",
                                            overflowY: "auto"
                                          }}>
                                            {displayValue}
                                          </div>
                                        </details>
                                      </div>
                                    );
                                  } else {
                                    return displayValue;
                                  }
                                }
                                return 'Contract field data';
                              })()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div style={{
                    background: "rgba(59, 130, 246, 0.1)",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(59, 130, 246, 0.2)"
                  }}>
                    <div style={{ fontWeight: "600", marginBottom: "6px", color: "#1e40af", fontSize: "14px" }}>
                      💡 Recommended Actions:
                    </div>
                    <div style={{ fontSize: "13px", color: "#1e40af", lineHeight: "1.5" }}>
                      {correlation.correlation_type === "temporal_conflict" && (
                        "• Standardize notice periods across all contract sections • Review termination clauses for consistency • Consult legal counsel to resolve conflicts"
                      )}
                      {correlation.correlation_type === "jurisdiction_conflict" && (
                        "• Choose a single governing law • Ensure all clauses are compatible with chosen jurisdiction • Review for regulatory compliance"
                      )}
                      {correlation.correlation_type === "data_flow_risk" && (
                        "• Implement proper data transfer mechanisms (SCCs, adequacy decisions) • Ensure consent is obtained for all data processing • Review data breach notification procedures"
                      )}
                      {correlation.correlation_type === "supplier_risk" && (
                        "• Conduct thorough due diligence on all suppliers • Implement supplier compliance monitoring • Establish clear contractual obligations for compliance"
                      )}
                    </div>
                  </div>

                  {/* Footer with confidence score */}
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px solid rgba(0,0,0,0.1)"
                  }}>
                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                      Confidence: {Math.round((correlation.confidence || 0.7) * 100)}% | Region: {correlation.region || 'N/A'}
                    </div>
                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                      AI-Powered Analysis
                    </div>
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

         {/* LandingAI ADE Status */}
         {landingaiStatus && (
           <div className="section-card">
             <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: "600", color: "#1f2937" }}>
               🤖 LandingAI ADE Status
             </h2>
             <div style={{
               background: landingaiStatus.status === "active" ? "#f0fdf4" : "#fef2f2",
               border: `2px solid ${landingaiStatus.status === "active" ? "#bbf7d0" : "#fecaca"}`,
               borderRadius: "12px",
               padding: "20px",
               marginBottom: "16px"
             }}>
               <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                 <div style={{
                   width: "12px",
                   height: "12px",
                   borderRadius: "50%",
                   background: landingaiStatus.status === "active" ? "#16a34a" : "#dc2626"
                 }}></div>
                 <div style={{ fontWeight: "600", color: "#1f2937" }}>
                   {landingaiStatus.message}
                 </div>
               </div>
               <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>
                 {landingaiStatus.fields_extracted}
               </div>
               {landingaiStatus.ai_analysis && (
                 <div style={{ 
                   background: "rgba(255,255,255,0.8)", 
                   padding: "12px", 
                   borderRadius: "8px",
                   marginTop: "12px"
                 }}>
                   <div style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>
                     AI Analysis Results:
                   </div>
                   <div style={{ fontSize: "12px", color: "#6b7280" }}>
                     Compliance Issues Found: {landingaiStatus.ai_analysis.compliance_issues_found || 0}
                   </div>
                 </div>
               )}
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

      {/* Explain Modal */}
      {showExplainModal && (
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
       </div>
     </div>
  );
}
