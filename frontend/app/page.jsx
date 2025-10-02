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

  async function uploadContract() {
    if (!contractFile) return alert("Choose a contract PDF first.");
    const fd = new FormData();
    fd.append("file", contractFile, contractFile.name);
    const r = await fetch(`${API_BASE}/upload_contract`, { method: "POST", body: fd });
    if (!r.ok) return alert("Upload failed");
    const data = await r.json();
    alert("Contract uploaded");
    console.log("extracted_fields", data.fields);
  }

  async function addRule() {
    if (!ruleFile && !ruleText.trim()) return alert("Provide a rule file or text.");
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
    if (!r.ok) return alert("Add rule failed");
    alert("Rule added");
    await refreshRules();
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
    const r = await fetch(`${API_BASE}/check?region=${region}`);
    if (!r.ok) return alert("Check failed");
    const data = await r.json();
    setFlags(data);
  }

  async function explain(id) {
    const r = await fetch(`${API_BASE}/explain?id=${encodeURIComponent(id)}&region=${region}`);
    const text = await r.text();
    try {
      const j = JSON.parse(text);
      alert(`Explain:\n${JSON.stringify(j, null, 2)}`);
    } catch {
      alert(text);
    }
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

  const box = { border: "1px solid #e5e7eb", padding: 16, borderRadius: 12, marginBottom: 16 };

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Global Compliance Copilot</h1>
      <div style={{ marginBottom: 16 }}>
        <label>Region:&nbsp;</label>
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option>EU</option>
          <option>US</option>
          <option>IN</option>
        </select>
        <span style={{ marginLeft: 12, color: "#6b7280" }}>API: {API_BASE}</span>
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={box}>
          <h3>Upload contract (PDF)</h3>
          <input type="file" accept="application/pdf" onChange={(e) => setContractFile(e.target.files?.[0] || null)} />
          <div style={{ marginTop: 8 }}>
            <button onClick={uploadContract}>Upload contract</button>
          </div>
        </div>

        <div style={box}>
          <h3>Add rule (file or text)</h3>
          <input type="file" accept=".md,.txt,application/pdf" onChange={(e) => setRuleFile(e.target.files?.[0] || null)} />
          <div style={{ margin: "8px 0" }}>OR</div>
          <textarea rows={5} style={{ width: "100%" }} placeholder="Paste rule snippet" value={ruleText} onChange={(e) => setRuleText(e.target.value)} />
          <div style={{ marginTop: 8 }}>
            <button onClick={addRule}>Add rule</button>
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
              <button onClick={saveRule}>Save</button>
            </div>
            <textarea rows={10} style={{ width: "100%" }} value={editorText} onChange={(e) => setEditorText(e.target.value)} />
          </div>
        </div>
      </section>

      <section style={box}>
        <h3>Run compliance</h3>
        <button onClick={checkCompliance}>Check</button>
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
                    <button onClick={() => explain(f.id)}>Explain</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button onClick={downloadJSON} disabled={flags.length === 0}>Download JSON</button>
          <button onClick={downloadCSV} disabled={flags.length === 0}>Download CSV</button>
        </div>
      </section>
    </main>
  );
}
