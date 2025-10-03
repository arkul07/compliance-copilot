"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export default function Home() {
  const [region, setRegion] = useState("EU");
  const [flags, setFlags] = useState([]);
  const [contractFile, setContractFile] = useState(null);

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
        <h1 style={{ marginBottom: 8, color: "#1f2937", fontSize: "28px", fontWeight: "600" }}>🔍 Global Compliance Copilot</h1>
        <p style={{ color: "#6b7280", marginBottom: 20 }}>AI-powered contract compliance analysis across jurisdictions</p>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: "12px" }}>
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

      <section style={box}>
        <h3>Flags ({flags.length})</h3>
        {flags.length === 0 ? (
          <div>No flags yet.</div>
        ) : (
          <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th align="left">Risk</th>
                <th align="left">Category</th>
                <th align="left">ID</th>
                <th align="left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((f) => (
                <tr key={f.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td>{f.risk_level}</td>
                  <td>{f.category}</td>
                  <td>{f.id}</td>
                  <td>
                    <button onClick={() => explain(f.id)} style={{...buttonStyle, background: "#7c3aed", padding: "4px 8px", fontSize: "12px"}}>ℹ️ Explain</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button onClick={downloadJSON} disabled={flags.length === 0} style={{...buttonStyle, background: "#dc2626", opacity: flags.length === 0 ? 0.5 : 1}}>📄 Download JSON</button>
          <button onClick={downloadCSV} disabled={flags.length === 0} style={{...buttonStyle, background: "#dc2626", opacity: flags.length === 0 ? 0.5 : 1}}>📊 Download CSV</button>
        </div>
      </section>

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
    </main>
  );
}



