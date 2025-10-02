import streamlit as st
import httpx
from io import BytesIO
import json
import csv
from typing import List, Dict, Any
import datetime as dt
import pandas as pd

API_BASE = st.secrets.get("API_BASE", "http://127.0.0.1:8000")

st.set_page_config(page_title="Global Compliance Copilot", layout="wide")
st.title("Global Compliance Copilot (API-connected)")

if "flags" not in st.session_state:
    st.session_state["flags"] = []
if "editor_name" not in st.session_state:
    st.session_state["editor_name"] = "new_rule.md"
if "editor_text" not in st.session_state:
    st.session_state["editor_text"] = ""

region = st.selectbox("Region", ["EU", "US", "IN"], index=0)

colC, colR = st.columns(2)

# ---------------- Contract upload ----------------
with colC:
    st.subheader("Upload contract (PDF)")
    contract_file = st.file_uploader("Choose PDF", type=["pdf"], key="contract_pdf")
    if st.button("Upload contract"):
        if not contract_file:
            st.warning("Please choose a contract PDF.")
        else:
            try:
                files = {"file": (contract_file.name, contract_file.getvalue(), "application/pdf")}
                r = httpx.post(f"{API_BASE}/upload_contract", files=files, timeout=90)
                r.raise_for_status()
                data = r.json()
                st.success(f"Uploaded: {data.get('path','')}")
                st.write({"extracted_fields": data.get("fields", [])})
            except Exception as e:
                st.error(f"Upload failed: {e}")

# ---------------- Rule upload / text ----------------
with colR:
    st.subheader("Upload rule (md/pdf/txt) or paste text")
    rule_file = st.file_uploader("Rule file", type=["md", "pdf", "txt"], key="rule_file")
    rule_text = st.text_area("Or paste a short rule snippet", height=120)
    if st.button("Add rule"):
        try:
            if rule_file is not None:
                files = {"file": (rule_file.name, rule_file.getvalue(), "application/octet-stream")}
            elif rule_text.strip():
                buf = BytesIO(rule_text.encode("utf-8"))
                files = {"file": ("snippet.md", buf.getvalue(), "text/markdown")}
            else:
                st.warning("Provide a rule file or paste text.")
                files = None

            if files:
                r = httpx.post(f"{API_BASE}/upload_rule", files=files, timeout=60)
                r.raise_for_status()
                st.success("Rule added.")
        except Exception as e:
            st.error(f"Add rule failed: {e}")

st.markdown("---")

# ---------------- Inline Rule Editor ----------------
with st.expander("Inline Rule Editor (create/update)"):
    try:
        lr = httpx.get(f"{API_BASE}/rules", timeout=30)
        lr.raise_for_status()
        rules = lr.json().get("items", [])
        names = [it["name"] for it in rules]
    except Exception:
        rules, names = [], []

    left, right = st.columns([2, 3])

    with left:
        st.caption("Existing rules")
        selected = st.selectbox("Choose", ["(none)"] + names, index=0)
        if st.button("Load selected") and selected != "(none)":
            try:
                gr = httpx.get(f"{API_BASE}/rule", params={"name": selected}, timeout=30)
                gr.raise_for_status()
                body = gr.json()
                st.session_state["editor_name"] = body.get("name", selected)
                st.session_state["editor_text"] = body.get("text", "")
            except Exception as e:
                st.error(f"Load failed: {e}")

        st.text_input("Rule name", key="editor_name")
        if st.button("Save rule"):
            try:
                payload = {"name": st.session_state["editor_name"], "text": st.session_state["editor_text"]}
                sr = httpx.post(f"{API_BASE}/rule", json=payload, timeout=60)
                sr.raise_for_status()
                st.success(f"Saved: {sr.json().get('name')}")
            except Exception as e:
                st.error(f"Save failed: {e}")

    with right:
        st.text_area("Rule text (md/txt)", key="editor_text", height=260)

st.markdown("---")

# ---------------- Check compliance ----------------
if st.button("Check compliance"):
    try:
        r = httpx.get(f"{API_BASE}/check", params={"region": region}, timeout=90)
        r.raise_for_status()
        st.session_state["flags"] = r.json()
    except Exception as e:
        st.error(f"Check failed: {e}")

flags: List[Dict[str, Any]] = st.session_state.get("flags", [])

# ---------------- Metrics & Visuals ----------------
def _flags_df(rows: List[Dict[str, Any]]) -> pd.DataFrame:
    if not rows:
        return pd.DataFrame(columns=["category", "risk_level"])
    return pd.DataFrame(
        [{"category": r.get("category", "?"), "risk_level": r.get("risk_level", "?")} for r in rows]
    )

st.subheader("Overview")
df = _flags_df(flags)

if df.empty:
    st.info("No flags yet. Upload a contract, add a rule, then click **Check compliance**.")
else:
    by_level = (
        df["risk_level"].value_counts().reindex(["HIGH", "MED", "LOW"]).fillna(0).astype(int)
    )
    by_cat_level = (
        df.pivot_table(index="category", columns="risk_level", aggfunc="size", fill_value=0)
        .reindex(columns=["HIGH", "MED", "LOW"], fill_value=0)
        .sort_index()
    )
    total = int(len(df))
    high = int(by_level.get("HIGH", 0))
    med = int(by_level.get("MED", 0))
    low = int(by_level.get("LOW", 0))
    high_pct = 0 if total == 0 else round(high * 100 / total, 1)

    c1, c2, c3, c4 = st.columns(4)
    with c1: st.metric("Total flags", total)
    with c2: st.metric("HIGH", high, f"{high_pct}% of total")
    with c3: st.metric("MED", med)
    with c4: st.metric("LOW", low)

    st.subheader("Risk distribution (all flags)")
    st.bar_chart(by_level)

    st.subheader("High-risk by category")
    if "HIGH" in by_cat_level.columns and not by_cat_level.empty:
        st.bar_chart(by_cat_level["HIGH"])

    st.subheader("Category × Risk matrix")
    st.dataframe(by_cat_level, use_container_width=True)

# ---------------- Flags list & Explain ----------------
st.subheader(f"Flags ({len(flags)})")
for i, fl in enumerate(flags):
    header = f"[{fl.get('risk_level','?')}] {fl.get('category','?')} – {fl.get('id','?')}"
    with st.expander(header, expanded=False):

        st.json(fl)
        if st.button(f"Explain {fl.get('id','?')}", key=f"exp_{i}"):
            try:
                xr = httpx.get(f"{API_BASE}/explain", params={"id": fl.get("id",""), "region": region}, timeout=60)
                xr.raise_for_status()
                try:
                    st.code(json.dumps(xr.json(), indent=2))
                except Exception:
                    st.code(xr.text)
            except Exception as e:
                st.error(f"Explain failed: {e}")

# ---------------- Export ----------------
def flags_to_csv(rows: List[Dict[str, Any]]) -> str:
    from io import StringIO
    s = StringIO()
    fieldnames = [
        "id", "category", "region", "risk_level", "rationale",
        "contract_file", "contract_page", "rule_file", "rule_section"
    ]
    w = csv.DictWriter(s, fieldnames=fieldnames)
    w.writeheader()
    for r in rows:
        ce = r.get("contract_evidence", {}) or {}
        re = r.get("rule_evidence", {}) or {}
        w.writerow({
            "id": r.get("id",""),
            "category": r.get("category",""),
            "region": r.get("region",""),
            "risk_level": r.get("risk_level",""),
            "rationale": r.get("rationale",""),
            "contract_file": ce.get("file",""),
            "contract_page": ce.get("page",""),
            "rule_file": re.get("file",""),
            "rule_section": re.get("section",""),
        })
    return s.getvalue()

cJ, cC = st.columns(2)
with cJ:
    st.download_button(
        "Download JSON",
        data=json.dumps(flags, indent=2),
        file_name=f"flags_{dt.datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
        mime="application/json",
        disabled=not bool(flags),
    )
with cC:
    st.download_button(
        "Download CSV",
        data=flags_to_csv(flags),
        file_name=f"flags_{dt.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
        mime="text/csv",
        disabled=not bool(flags),
    )

st.caption(f"API base: {API_BASE}")