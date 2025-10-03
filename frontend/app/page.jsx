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
        background: #ffffff;
      }
      
      .glass-effect {
        background: #ffffff;
        border: 1px solid #d1d5db;
      }
      
      .card-hover {
        transition: all 0.3s ease;
      }
      
      .card-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      }
      
      .section-card {
        background: #ffffff;
        border: 1px solid #d1d5db;
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
        background: #000000;
        color: white;
        border: 1px solid #000000;
        padding: 12px 24px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
      }
      
      .button-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        background: #333333;
      }
      
      .button-secondary {
        background: #ffffff;
        color: #000000;
        border: 1px solid #d1d5db;
        padding: 10px 20px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;
      }
      
      .button-secondary:hover {
        background: #f3f4f6;
        transform: translateY(-1px);
      }
      
      .region-selector {
        display: flex;
        gap: 8px;
        background: #f3f4f6;
        padding: 4px;
        border-radius: 12px;
        border: 1px solid #d1d5db;
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
        background: #000000;
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
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
        background: #ffffff;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        border: 1px solid #d1d5db;
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
  
  // Smart Document Correction state
  const [documentAnalysis, setDocumentAnalysis] = useState(null);
  const [correctedDocument, setCorrectedDocument] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Simplified Compliance state
  const [simplifiedAnalysis, setSimplifiedAnalysis] = useState(null);
  const [isSimplifiedAnalyzing, setIsSimplifiedAnalyzing] = useState(false);
  const [domain, setDomain] = useState("general");
  
  // Simplified explain modal state
  const [showSimplifiedExplainModal, setShowSimplifiedExplainModal] = useState(false);
  const [simplifiedExplainData, setSimplifiedExplainData] = useState(null);
  const [loadingSimplifiedExplain, setLoadingSimplifiedExplain] = useState(false);
  
  // Data anonymization state
  const [anonymizationEnabled, setAnonymizationEnabled] = useState(false);
  const [anonymizationMethod, setAnonymizationMethod] = useState("mask");
  const [anonymizationInfo, setAnonymizationInfo] = useState(null);
  
  // Smart Document Correction state
  const [smartAnalysis, setSmartAnalysis] = useState(null);
  const [smartCorrectedDocument, setSmartCorrectedDocument] = useState(null);
  const [isSmartAnalyzing, setIsSmartAnalyzing] = useState(false);
  const [isSmartGenerating, setIsSmartGenerating] = useState(false);
  const [smartCorrectionInfo, setSmartCorrectionInfo] = useState(null);
  
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

  const explainSimplified = async (flagId) => {
    setLoadingSimplifiedExplain(true);
    setShowSimplifiedExplainModal(true);
    
    try {
      const response = await fetch(`${API_BASE}/explain?id=${flagId}&region=${region}`);
      if (response.ok) {
        const data = await response.json();
        setSimplifiedExplainData(data);
      } else {
        setSimplifiedExplainData({ 
          error: `Failed to get explanation: ${response.status} ${response.statusText}` 
        });
      }
    } catch (error) {
      setSimplifiedExplainData({ 
        error: `Request failed: ${error.message}` 
      });
    } finally {
      setLoadingSimplifiedExplain(false);
    }
  };

  const closeSimplifiedExplainModal = () => {
    setShowSimplifiedExplainModal(false);
    setSimplifiedExplainData(null);
  };

  // Anonymization functions
  const loadAnonymizationInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/anonymization_info`);
      if (response.ok) {
        const data = await response.json();
        setAnonymizationInfo(data);
      }
    } catch (error) {
      console.error("Failed to load anonymization info:", error);
    }
  };

  const anonymizeData = async (data) => {
    if (!anonymizationEnabled) return data;
    
    try {
      const response = await fetch(`${API_BASE}/anonymize_data?method=${anonymizationMethod}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        const anonymizedData = await response.json();
        return anonymizedData;
      }
    } catch (error) {
      console.error("Failed to anonymize data:", error);
    }
    
    return data;
  };

  // Smart Document Correction functions
  const loadSmartCorrectionInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/smart_correction_info`);
      if (response.ok) {
        const data = await response.json();
        setSmartCorrectionInfo(data);
      }
    } catch (error) {
      console.error("Failed to load smart correction info:", error);
    }
  };

  const smartAnalyzeDocument = async () => {
    setIsSmartAnalyzing(true);
    try {
      const response = await fetch(`${API_BASE}/smart_analyze_document?region=${region}`);
      if (response.ok) {
        const data = await response.json();
        setSmartAnalysis(data);
      } else {
        const errorData = await response.json();
        console.error("Smart analysis failed:", errorData);
        if (errorData.detail && errorData.detail.includes("no contracts uploaded")) {
          alert("❌ No contract uploaded. Please upload a contract first using the file input above.");
        } else {
          alert("❌ Smart analysis failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error in smart analysis:", error);
      alert("❌ Error in smart analysis. Please try again.");
    } finally {
      setIsSmartAnalyzing(false);
    }
  };

  const smartGenerateCorrectedDocument = async () => {
    if (!smartAnalysis) return;
    
    setIsSmartGenerating(true);
    try {
      const response = await fetch(`${API_BASE}/smart_generate_corrected_document?region=${region}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(smartAnalysis),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSmartCorrectedDocument(data);
      } else {
        console.error("Smart document generation failed");
      }
    } catch (error) {
      console.error("Error generating smart corrected document:", error);
    } finally {
      setIsSmartGenerating(false);
    }
  };

  const downloadSmartCorrectedDocument = () => {
    if (!smartCorrectedDocument) return;
    
    const dataStr = JSON.stringify(smartCorrectedDocument, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `smart_corrected_document_${region}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  // Smart Document Correction functions
  const analyzeDocument = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_BASE}/analyze_document?region=${region}`);
      if (response.ok) {
        const data = await response.json();
        setDocumentAnalysis(data);
        console.log("Document analysis:", data);
      } else {
        console.error("Document analysis failed");
      }
    } catch (error) {
      console.error("Error analyzing document:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateCorrectedDocument = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${API_BASE}/generate_corrected_document?region=${region}`);
      if (response.ok) {
        const data = await response.json();
        setCorrectedDocument(data);
        console.log("Corrected document:", data);
      } else {
        console.error("Document generation failed");
      }
    } catch (error) {
      console.error("Error generating corrected document:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCorrectedDocument = async () => {
    try {
      const response = await fetch(`${API_BASE}/download_corrected_document?region=${region}`);
      if (response.ok) {
        const data = await response.json();
        // Create download link
        const blob = new Blob([data.corrected_document.corrected_content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
    a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
    a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error("Download failed");
      }
    } catch (error) {
      console.error("Error downloading corrected document:", error);
    }
  };

  // Simplified Compliance functions
  const runSimplifiedAnalysis = async () => {
    setIsSimplifiedAnalyzing(true);
    try {
      const response = await fetch(`${API_BASE}/simplified_analysis?region=${region}&domain=${domain}`);
      if (response.ok) {
        const data = await response.json();
        setSimplifiedAnalysis(data);
        console.log("Simplified analysis:", data);
      } else {
        console.error("Simplified analysis failed");
      }
    } catch (error) {
      console.error("Error running simplified analysis:", error);
    } finally {
      setIsSimplifiedAnalyzing(false);
    }
  };

  // Auto-refresh Pathway stats and live activity
  useEffect(() => {
    getPathwayStats();
    getLiveActivity();
    loadAnonymizationInfo();
    loadSmartCorrectionInfo();
    
    const interval = setInterval(() => {
      getPathwayStats();
      getLiveActivity();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {/* Header */}
      <div style={{ 
        padding: "20px 0", 
        borderBottom: "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "#ffffff"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: "32px", 
                fontWeight: "800", 
                color: "#000000"
              }}>
                🤖 Compliance Copilot
              </h1>
              <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: "14px" }}>
                AI-Powered Contract Compliance Analysis
              </p>
            </div>
             <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
               <div style={{ 
                 background: "#f3f4f6", 
                 padding: "6px 12px", 
                 borderRadius: "20px",
                 fontSize: "12px",
                 fontWeight: "600",
                 color: "#000000",
                 border: "1px solid #d1d5db"
               }}>
                 {region} Region
               </div>
               
               {/* Data Anonymization Toggle */}
               <div style={{ 
                 background: anonymizationEnabled ? "#fef2f2" : "#f3f4f6",
                 border: `1px solid ${anonymizationEnabled ? "#fecaca" : "#d1d5db"}`,
                 padding: "6px 12px", 
                 borderRadius: "20px",
                 fontSize: "12px",
                 fontWeight: "600",
                 color: "#000000",
                 cursor: "pointer",
                 display: "flex",
                 alignItems: "center",
                 gap: "6px"
               }}
               onClick={() => setAnonymizationEnabled(!anonymizationEnabled)}
               title={anonymizationEnabled ? "Data anonymization enabled" : "Click to enable data anonymization"}
               >
                 <div style={{
                   width: "8px",
                   height: "8px",
                   borderRadius: "50%",
                   background: anonymizationEnabled ? "#dc2626" : "#6b7280"
                 }}></div>
                 🔒 {anonymizationEnabled ? "Anonymized" : "Anonymize"}
               </div>
               {landingaiStatus && (
                 <div style={{ 
                   background: "#f3f4f6",
                   border: "1px solid #d1d5db",
                   padding: "6px 12px", 
                   borderRadius: "20px",
                   fontSize: "12px",
                   fontWeight: "600",
                   color: "#000000",
                   display: "flex",
                   alignItems: "center",
                   gap: "6px"
                 }}>
                   <div style={{
                     width: "8px",
                     height: "8px",
                     borderRadius: "50%",
                     background: "#000000"
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

           {/* Data Anonymization Settings */}
          {anonymizationEnabled && (
            <div style={{ 
              background: "#fef2f2", 
              padding: "16px", 
              borderRadius: "8px", 
              marginBottom: "16px",
              border: "1px solid #fecaca"
            }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "#1f2937" }}>
                🔒 Data Anonymization Settings
              </h3>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>
                  Method:
                </label>
                <select
                  value={anonymizationMethod}
                  onChange={(e) => setAnonymizationMethod(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "12px",
                    background: "white"
                  }}
                >
                  <option value="mask">Mask (Preserve Structure)</option>
                  <option value="hash">Hash (SHA-256)</option>
                  <option value="replace">Replace (Generic Placeholders)</option>
                  <option value="remove">Remove (Redact)</option>
                </select>
              </div>
              <div style={{ fontSize: "11px", color: "#6b7280" }}>
                {anonymizationInfo && anonymizationInfo.available_methods[anonymizationMethod]}
              </div>
            </div>
          )}

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
            <button 
              onClick={smartAnalyzeDocument} 
              className="button-secondary" 
              disabled={isSmartAnalyzing}
              title={contractFile ? "Analyze uploaded contract with Claude AI" : "Upload a contract first to use smart analysis"}
              style={{
                opacity: contractFile ? 1 : 0.6,
                cursor: contractFile ? "pointer" : "not-allowed"
              }}
            >
              {isSmartAnalyzing ? "⏳ Analyzing..." : "🤖 Smart Analysis"}
              {contractFile && <span style={{ marginLeft: "8px", fontSize: "12px" }}>📄</span>}
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
                      background: "#f3f4f6",
                      border: "#000000", 
                      text: "#000000",
                      priority: "🔴"
                    };
                  } else if (riskLevel === "MEDIUM") {
                    return {
                      background: "#f9fafb",
                      border: "#6b7280",
                      text: "#000000", 
                      priority: "🟡"
                    };
                  } else {
                    return {
                      background: "#ffffff",
                      border: "#d1d5db",
                      text: "#000000",
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

        {/* Smart Document Correction */}
        {smartAnalysis && (
          <div className="section-card">
            <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: "600", color: "#1f2937" }}>
              🤖 Smart Document Correction (Claude AI)
            </h2>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ 
                background: "#f0f9ff", 
                padding: "12px", 
                borderRadius: "6px",
                fontSize: "14px",
                color: "#1e40af",
                border: "1px solid #bfdbfe"
              }}>
                <strong>Claude AI Enhanced</strong> - Intelligent correction suggestions with legal reasoning
              </div>
            </div>

            {/* Smart Summary */}
            {smartAnalysis.smart_summary && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>
                  📋 Executive Summary
                </h4>
                <div style={{ 
                  background: "#f8fafc", 
                  padding: "16px", 
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0"
                }}>
                  <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
                    {smartAnalysis.smart_summary.executive_summary}
                  </p>
                  <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#6b7280" }}>
                    <span>Compliance Score: {smartAnalysis.smart_summary.compliance_score}/100</span>
                    <span>Risk Level: {smartAnalysis.smart_summary.risk_assessment}</span>
                    <span>AI Enhanced: {smartAnalysis.smart_summary.ai_enhanced ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Correction Opportunities */}
            {smartAnalysis.correction_opportunities && smartAnalysis.correction_opportunities.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>
                  🔧 Correction Opportunities ({smartAnalysis.correction_opportunities.length})
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {smartAnalysis.correction_opportunities.map((correction, index) => (
                    <div key={index} style={{ 
                      background: correction.ai_generated ? "#fef3c7" : "#f3f4f6",
                      border: `1px solid ${correction.ai_generated ? "#f59e0b" : "#d1d5db"}`,
                      padding: "16px", 
                      borderRadius: "6px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                        <div>
                          <strong style={{ fontSize: "14px" }}>
                            {correction.ai_generated ? "🤖 AI Suggestion" : "📋 Rule-Based"} - {correction.type}
                          </strong>
                          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                            {correction.category} • {correction.risk_level} • Confidence: {Math.round(correction.confidence * 100)}%
                          </div>
                        </div>
                        <div style={{ 
                          background: correction.priority_level === "HIGH" ? "#fef2f2" : 
                                    correction.priority_level === "MEDIUM" ? "#fffbeb" : "#f0fdf4",
                          color: correction.priority_level === "HIGH" ? "#dc2626" : 
                                correction.priority_level === "MEDIUM" ? "#d97706" : "#059669",
                          padding: "4px 8px", 
                          borderRadius: "4px", 
                          fontSize: "11px", 
                          fontWeight: "600"
                        }}>
                          {correction.priority_level}
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: "8px" }}>
                        <strong style={{ fontSize: "13px" }}>Suggestion:</strong>
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
                          {correction.correction_suggestion}
                        </p>
                      </div>
                      
                      {correction.detailed_explanation && (
                        <div style={{ marginBottom: "8px" }}>
                          <strong style={{ fontSize: "13px" }}>Legal Reasoning:</strong>
                          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#6b7280" }}>
                            {correction.detailed_explanation}
                          </p>
                        </div>
                      )}
                      
                      {correction.suggested_clause && (
                        <div style={{ marginBottom: "8px" }}>
                          <strong style={{ fontSize: "13px" }}>Suggested Clause:</strong>
                          <div style={{ 
                            background: "#f8fafc", 
                            padding: "8px", 
                            borderRadius: "4px", 
                            fontSize: "12px",
                            fontFamily: "monospace",
                            border: "1px solid #e2e8f0",
                            marginTop: "4px"
                          }}>
                            {correction.suggested_clause}
                          </div>
                        </div>
                      )}
                      
                      {correction.implementation_notes && (
                        <div>
                          <strong style={{ fontSize: "13px" }}>Implementation:</strong>
                          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#6b7280" }}>
                            {correction.implementation_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button 
                onClick={smartGenerateCorrectedDocument} 
                className="button-primary"
                disabled={isSmartGenerating}
                style={{
                  opacity: isSmartGenerating ? 0.7 : 1,
                  cursor: isSmartGenerating ? "not-allowed" : "pointer"
                }}
              >
                {isSmartGenerating ? "⏳ Generating..." : "📝 Generate Corrected Document"}
              </button>
              
              {smartCorrectedDocument && (
                <button 
                  onClick={downloadSmartCorrectedDocument} 
                  className="button-secondary"
                >
                  💾 Download Corrected Document
                </button>
              )}
            </div>

            {/* Corrected Document Results */}
            {smartCorrectedDocument && (
              <div style={{ marginTop: "20px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>
                  ✅ Corrected Document Generated
                </h4>
                <div style={{ 
                  background: "#f0fdf4", 
                  padding: "16px", 
                  borderRadius: "6px",
                  border: "1px solid #bbf7d0"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: "14px", color: "#166534" }}>
                        Document Successfully Corrected
                      </strong>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                        Changes Applied: {smartCorrectedDocument.changes_applied} • 
                        AI Corrections: {smartCorrectedDocument.ai_corrections_count} • 
                        Region: {smartCorrectedDocument.region}
                      </div>
                    </div>
                    <div style={{ 
                      background: "#dcfce7", 
                      color: "#166534", 
                      padding: "6px 12px", 
                      borderRadius: "4px", 
                      fontSize: "12px", 
                      fontWeight: "600"
                    }}>
                      Claude Enhanced
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Simplified Compliance (Claude + LandingAI ADE + Pathway) */}
        <div className="section-card">
          <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: "600", color: "#1f2937" }}>
            🤖 Simplified Compliance Analysis
          </h2>
          <div style={{ 
            background: "rgba(139, 69, 19, 0.1)", 
            padding: "16px", 
            borderRadius: "8px", 
            marginBottom: "16px",
            border: "1px solid rgba(139, 69, 19, 0.2)"
          }}>
            <div style={{ fontSize: "14px", color: "#8b4513", fontWeight: "500", marginBottom: "8px" }}>
              🧠 Claude + LandingAI ADE + Pathway Integration
            </div>
            <div style={{ fontSize: "13px", color: "#8b4513", lineHeight: "1.5" }}>
              Claude generates rules → LandingAI ADE extracts fields → Pathway finds relevant rules → Display flags & correlations
            </div>
          </div>
          
          {/* Claude Status */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ 
              background: "rgba(16, 185, 129, 0.1)", 
              padding: "12px", 
              borderRadius: "6px", 
              border: "1px solid rgba(16, 185, 129, 0.2)",
              marginBottom: "16px"
            }}>
              <div style={{ fontSize: "14px", color: "#059669", fontWeight: "500" }}>
                ✅ Claude API Ready
              </div>
              <div style={{ fontSize: "12px", color: "#047857" }}>
                Claude is configured and ready to generate compliance rules
              </div>
            </div>
          </div>

          {/* Domain Selection */}
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#1f2937" }}>
              🏢 Domain Selection
            </h3>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              style={{
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                background: "white"
              }}
            >
              <option value="general">General</option>
              <option value="employment">Employment</option>
              <option value="privacy">Privacy</option>
              <option value="supply_chain">Supply Chain</option>
              <option value="financial">Financial</option>
              <option value="healthcare">Healthcare</option>
            </select>
          </div>

          {/* Analysis Button */}
          <div style={{ marginBottom: "20px" }}>
            <button
              onClick={runSimplifiedAnalysis}
              disabled={isSimplifiedAnalyzing}
              style={{
                background: isSimplifiedAnalyzing ? "#9ca3af" : "#8b4513",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: isSimplifiedAnalyzing ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "14px"
              }}
            >
              {isSimplifiedAnalyzing ? "⏳ Analyzing..." : "🔍 Run Simplified Analysis"}
            </button>
          </div>

          {/* Analysis Results */}
          {simplifiedAnalysis && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#1f2937" }}>
                📊 Analysis Results
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                <div style={{ background: "rgba(255,255,255,0.8)", padding: "12px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Claude Rules</div>
                  <div style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937" }}>
                    {simplifiedAnalysis.claude_rules?.length || 0}
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.8)", padding: "12px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Relevant Rules</div>
                  <div style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937" }}>
                    {simplifiedAnalysis.relevant_rules?.length || 0}
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.8)", padding: "12px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Compliance Flags</div>
                  <div style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937" }}>
                    {simplifiedAnalysis.compliance_flags?.length || 0}
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.8)", padding: "12px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Risk Correlations</div>
                  <div style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937" }}>
                    {simplifiedAnalysis.risk_correlations?.length || 0}
                  </div>
                </div>
              </div>

              {/* Claude Rules */}
              {simplifiedAnalysis.claude_rules && simplifiedAnalysis.claude_rules.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "#1f2937" }}>
                    🧠 Claude Generated Rules
                  </h4>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {simplifiedAnalysis.claude_rules.slice(0, 3).map((rule, index) => (
                      <div key={index} style={{
                        background: "rgba(255,255,255,0.8)",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "1px solid rgba(0,0,0,0.1)"
                      }}>
                        <div style={{ fontWeight: "600", color: "#1f2937", marginBottom: "4px" }}>
                          {rule.title}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          {rule.description}
                        </div>
                        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
                          {rule.category} • {rule.risk_level}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compliance Flags */}
              {simplifiedAnalysis.compliance_flags && simplifiedAnalysis.compliance_flags.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "#1f2937" }}>
                    ⚠️ Compliance Flags ({simplifiedAnalysis.compliance_flags.length})
                  </h4>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {simplifiedAnalysis.compliance_flags.slice(0, 5).map((flag, index) => {
                      const getFlagColors = (riskLevel) => {
                        if (riskLevel === "HIGH") {
                          return {
                            background: "#fef2f2",     // Light red background
                            border: "#fecaca",         // Light red border
                            text: "#000000",
                            priority: "🔴"
                          };
                        } else if (riskLevel === "MEDIUM") {
                          return {
                            background: "#fffbeb",     // Light yellow background
                            border: "#fde68a",         // Light yellow border
                            text: "#000000", 
                            priority: "🟡"
                          };
                        } else {
                          return {
                            background: "#f0fdf4",     // Light green background
                            border: "#bbf7d0",         // Light green border
                            text: "#000000",
                            priority: "🟢"
                          };
                        }
                      };
                      
                      const colors = getFlagColors(flag.risk_level);
                      
                      return (
                        <div key={index} style={{
                          background: colors.background,
                          border: `2px solid ${colors.border}`,
                          padding: "12px",
                          borderRadius: "6px",
                          position: "relative"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                            <div>
                              <div style={{ fontWeight: "600", color: colors.text, marginBottom: "4px" }}>
                                {flag.rule_title}
                              </div>
                              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                                {flag.description}
                              </div>
                              <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                                {flag.field_name} • {flag.risk_level} • Pathway Score: {flag.pathway_score?.toFixed(2) || "N/A"}
                              </div>
                            </div>
                            <button
                              onClick={() => explainSimplified(flag.id)}
                              style={{
                                background: "#000000",
                                color: "white",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                cursor: "pointer",
                                fontWeight: "500"
                              }}
                            >
                              Explain
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Risk Correlations */}
              {simplifiedAnalysis.risk_correlations && simplifiedAnalysis.risk_correlations.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "#1f2937" }}>
                    🔗 Risk Correlations
                  </h4>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {simplifiedAnalysis.risk_correlations.map((correlation, index) => {
                      const getRiskColors = (riskLevel) => {
                        if (riskLevel === "HIGH") {
                          return {
                            background: "#fef2f2",     // Light red background
                            border: "#fecaca",         // Light red border
                            text: "#000000",
                            priority: "🔴"
                          };
                        } else if (riskLevel === "MEDIUM") {
                          return {
                            background: "#fffbeb",     // Light yellow background
                            border: "#fde68a",         // Light yellow border
                            text: "#000000", 
                            priority: "🟡"
                          };
                        } else {
                          return {
                            background: "#f0fdf4",     // Light green background
                            border: "#bbf7d0",         // Light green border
                            text: "#000000",
                            priority: "🟢"
                          };
                        }
                      };
                      
                      const colors = getRiskColors(correlation.risk_level);
                      
                      return (
                        <div key={index} style={{
                          background: colors.background,
                          border: `2px solid ${colors.border}`,
                          padding: "12px",
                          borderRadius: "6px",
                          position: "relative"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                            <div>
                              <div style={{ fontWeight: "600", color: colors.text, marginBottom: "4px" }}>
                                {correlation.correlation_type?.replace(/_/g, ' ').toUpperCase()}
                              </div>
                              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                                {correlation.description}
                              </div>
                              <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                                {correlation.flag_count} flags • {correlation.category} • {correlation.risk_level}
                              </div>
                            </div>
                            <div style={{ 
                              fontSize: "16px",
                              marginLeft: "8px"
                            }}>
                              {colors.priority}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Smart Document Correction */}
        <div className="section-card">
          <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: "600", color: "#1f2937" }}>
            🚀 Smart Document Correction
          </h2>
          <div style={{ 
            background: "rgba(59, 130, 246, 0.1)", 
            padding: "16px", 
            borderRadius: "8px", 
            marginBottom: "16px",
            border: "1px solid rgba(59, 130, 246, 0.2)"
          }}>
            <div style={{ fontSize: "14px", color: "#1e40af", fontWeight: "500", marginBottom: "8px" }}>
              🤖 AI-Powered Document Correction
            </div>
            <div style={{ fontSize: "13px", color: "#1e40af", lineHeight: "1.5" }}>
              Use LandingAI ADE and Pathway to automatically analyze and correct compliance issues in your documents.
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <button
              onClick={analyzeDocument}
              disabled={isAnalyzing}
              style={{
                background: isAnalyzing ? "#9ca3af" : "#3b82f6",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: isAnalyzing ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "14px"
              }}
            >
              {isAnalyzing ? "⏳ Analyzing..." : "🔍 Analyze Document"}
            </button>
            
            <button
              onClick={generateCorrectedDocument}
              disabled={isGenerating || !documentAnalysis}
              style={{
                background: isGenerating || !documentAnalysis ? "#9ca3af" : "#10b981",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: isGenerating || !documentAnalysis ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "14px"
              }}
            >
              {isGenerating ? "⏳ Generating..." : "📝 Generate Corrections"}
            </button>
            
            {correctedDocument && (
              <button
                onClick={downloadCorrectedDocument}
                style={{
                  background: "#f59e0b",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px"
                }}
              >
                📥 Download Corrected Document
              </button>
            )}
          </div>

          {/* Document Analysis Results */}
          {documentAnalysis && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#1f2937" }}>
                📊 Analysis Results
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                <div style={{ background: "rgba(255,255,255,0.8)", padding: "12px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Correction Opportunities</div>
                  <div style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937" }}>
                    {documentAnalysis.correction_opportunities?.length || 0}
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.8)", padding: "12px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Compliance Flags</div>
                  <div style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937" }}>
                    {documentAnalysis.compliance_flags?.length || 0}
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.8)", padding: "12px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Risk Correlations</div>
                  <div style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937" }}>
                    {documentAnalysis.risk_correlations?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Correction Opportunities */}
          {documentAnalysis?.correction_opportunities && documentAnalysis.correction_opportunities.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#1f2937" }}>
                🔧 Correction Opportunities
              </h3>
              <div style={{ display: "grid", gap: "12px" }}>
                {documentAnalysis.correction_opportunities.map((correction, index) => (
                  <div key={index} style={{
                    background: "rgba(255,255,255,0.8)",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid rgba(0,0,0,0.1)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: correction.risk_level === "HIGH" ? "#dc2626" : "#d97706"
                      }}></div>
                      <div style={{ fontWeight: "600", color: "#1f2937" }}>
                        {correction.type?.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div style={{
                        background: correction.risk_level === "HIGH" ? "#dc2626" : "#d97706",
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "10px",
                        fontWeight: "600"
                      }}>
                        {correction.risk_level}
                      </div>
                    </div>
                    <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>
                      {correction.reason}
                    </div>
                    <div style={{ fontSize: "13px", color: "#1f2937", fontWeight: "500", marginBottom: "4px" }}>
                      💡 Suggestion: {correction.correction_suggestion}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", fontStyle: "italic" }}>
                      Template: {correction.correction_template}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Corrected Document Results */}
          {correctedDocument && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#1f2937" }}>
                ✅ Corrected Document Generated
              </h3>
              <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                <div style={{ fontSize: "14px", color: "#059669", fontWeight: "500", marginBottom: "8px" }}>
                  🎉 Document Successfully Corrected!
                </div>
                <div style={{ fontSize: "13px", color: "#047857", lineHeight: "1.5" }}>
                  Changes Applied: {correctedDocument.changes_applied} | 
                  Generation Time: {new Date(correctedDocument.generation_timestamp).toLocaleTimeString()}
                </div>
                {correctedDocument.change_summary && (
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "#047857" }}>
                    <div style={{ fontWeight: "500", marginBottom: "4px" }}>Summary:</div>
                    <div>High Priority: {correctedDocument.change_summary.high_priority_corrections} | 
                         Medium Priority: {correctedDocument.change_summary.medium_priority_corrections}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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

      {/* Simplified Explain Modal */}
      {showSimplifiedExplainModal && (
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
              onClick={closeSimplifiedExplainModal}
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
              📋 Simplified Compliance Explanation
            </h3>

            {loadingSimplifiedExplain ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ fontSize: "18px", color: "#6b7280" }}>⏳ Loading explanation...</div>
              </div>
            ) : simplifiedExplainData ? (
              <div>
                {simplifiedExplainData.error ? (
                  <div style={{ 
                    background: "#fef2f2", 
                    border: "1px solid #fecaca", 
                    padding: "16px", 
                    borderRadius: "8px",
                    color: "#dc2626"
                  }}>
                    ❌ {simplifiedExplainData.error}
                  </div>
                ) : (
                  <div>
                    {/* Flag Details */}
                    <div style={{ marginBottom: "20px" }}>
                      <h4 style={{ margin: "0 0 8px 0", color: "#1f2937" }}>Flag Details</h4>
                      <div style={{ 
                        background: "#f9fafb", 
                        padding: "12px", 
                        borderRadius: "6px",
                        border: "1px solid #d1d5db"
                      }}>
                        <div style={{ marginBottom: "8px" }}>
                          <strong>ID:</strong> {simplifiedExplainData.id}
                        </div>
                        <div style={{ marginBottom: "8px" }}>
                          <strong>Field:</strong> {simplifiedExplainData.field_name}
                        </div>
                        <div style={{ marginBottom: "8px" }}>
                          <strong>Value:</strong> {simplifiedExplainData.field_value}
                        </div>
                        <div style={{ marginBottom: "8px" }}>
                          <strong>Risk Level:</strong> {simplifiedExplainData.risk_level}
                        </div>
                        <div>
                          <strong>Category:</strong> {simplifiedExplainData.category}
                        </div>
                      </div>
                    </div>

                    {/* Rule Snippet */}
                    {simplifiedExplainData.rule_snippet && (
                      <div style={{ marginBottom: "20px" }}>
                        <h4 style={{ margin: "0 0 8px 0", color: "#1f2937" }}>Compliance Rule</h4>
                        <div style={{ 
                          background: "#f9fafb", 
                          padding: "12px", 
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          fontSize: "14px",
                          lineHeight: "1.5"
                        }}>
                          {simplifiedExplainData.rule_snippet}
                        </div>
                      </div>
                    )}

                    {/* Risk Correlation */}
                    {simplifiedAnalysis && simplifiedAnalysis.risk_correlations && simplifiedAnalysis.risk_correlations.length > 0 && (
                      <div style={{ marginBottom: "20px" }}>
                        <h4 style={{ margin: "0 0 8px 0", color: "#1f2937" }}>Risk Correlations</h4>
                        <div style={{ display: "grid", gap: "8px" }}>
                          {simplifiedAnalysis.risk_correlations.slice(0, 3).map((correlation, index) => {
                            const getRiskColors = (riskLevel) => {
                              if (riskLevel === "HIGH") {
                                return {
                                  background: "#fef2f2",     // Light red background
                                  border: "#fecaca",         // Light red border
                                  text: "#000000",
                                  priority: "🔴"
                                };
                              } else if (riskLevel === "MEDIUM") {
                                return {
                                  background: "#fffbeb",     // Light yellow background
                                  border: "#fde68a",         // Light yellow border
                                  text: "#000000", 
                                  priority: "🟡"
                                };
                              } else {
                                return {
                                  background: "#f0fdf4",     // Light green background
                                  border: "#bbf7d0",         // Light green border
                                  text: "#000000",
                                  priority: "🟢"
                                };
                              }
                            };
                            
                            const colors = getRiskColors(correlation.risk_level);
                            
                            return (
                              <div key={index} style={{
                                background: colors.background,
                                border: `2px solid ${colors.border}`,
                                padding: "12px",
                                borderRadius: "6px",
                                position: "relative"
                              }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                  <div>
                                    <div style={{ fontWeight: "600", color: colors.text, marginBottom: "4px" }}>
                                      {correlation.correlation_type?.replace(/_/g, ' ').toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                                      Risk Level: {correlation.risk_level}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                                      {correlation.description}
                                    </div>
                                  </div>
                                  <div style={{ 
                                    fontSize: "16px",
                                    marginLeft: "8px"
                                  }}>
                                    {colors.priority}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action Section */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
                      <button 
                        onClick={closeSimplifiedExplainModal}
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
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
       </div>
     </div>
  );
}
