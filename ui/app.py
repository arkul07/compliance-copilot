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

    st.subheader("Add/Edit rules")

    # --------- File upload ---------
    rule_file = st.file_uploader("Rule file", type=["md", "pdf", "txt"], key="rule_file")

    if rule_file:
        try:
            rule_text = rule_file.read().decode("utf-8", errors="ignore")
            st.text_area("Content:", rule_text[:500] + "..." if len(rule_text) > 500 else rule_text)

        except Exception as e:
            st.error(f"Error reading file: {e}")
            rule_text = ""

    st.text_area("Text:", st.session_state["editor_text"])

    if st.button("Save rule"):
        st.session_state["editor_text"] = ""

# -------------------- Check compliance --------------------
st.markdown("---")

if st.button("🔍 Check compliance"):

    try:
        r = httpx.get(f"{API_BASE}/check", params={"region": region})
        r.raise_for_status()
        flags_data = r.json()
        st.session_state["flags"] = flags_data

    except Exception as e:
        st.error(f"Check failed: {e}")
        # Mock data for demo
        st.session_state["flags"] = [
            {
                "id": "privacy-data_processing",
                "category": "privacy",
                "region": region,
                "risk_level": "HIGH",
                "rationale": "Field 'data_processing' value 'controller' vs privacy rule snippet.",
                "contract_evidence": {"file": "sample.pdf", "page": 2},
                "rule_evidence": {"file": "rules_store", "section": "top_hit"},
            },
            {
                "id": "labor-termination_notice",
                "category": "labor",
                "region": region,
                "risk_level": "LOW",
                "rationale": "Termination notice '30 days' vs labor rule.",
                "contract_evidence": {"file": "sample.pdf", "page": 3},
                "rule_evidence": {"file": "rules_store", "section": "top_hit"},
            }
        ]

# ----------- Results ------------
st.subheader(f"📋 Compliance Flags ({len(st.session_state['flags'])})")

for i, flag in enumerate(st.session_state["flags"]):
    with st.expander(f"{flag['category'].upper()} - {flag['risk_level']}"):

        st.write(f"**Issue:** {flag['rationale']}")

        col1, col2 = st.columns(2)
        with col1:
            st.info(f"📄 Contract: {flag['contract_evidence']['file']}, page {flag['contract_evidence']['page']}")
        with col2:
            st.info(f"📋 Rule: {flag['rule_evidence']['file']}, {flag['rule_evidence']['section']}")

# -------------------- Explain --------------------
st.markdown("---")
st.subheader("🔍 Explain")

flag_ids = [flag["id"] for flag in st.session_state["flags"]]
if flag_ids:

    flag_id = st.selectbox("Pick a flag:", flag_ids)

    if st.button("Explain"):

        try:
            r = httpx.get(f"{API_BASE}/explain", params={"id": flag_id})
            r.raise_for_status()
            explain_data = r.json()

            st.write("**Contract evidence:**")
            st.json(explain_data["contract"])

            st.write("**Rule snippet:**")
            st.code(explain_data["rule"])

        except Exception as e:
            st.error(f"Explain failed: {e}")
            st.json({"message": "Mock explanation for demo"})

# -------------------- Export --------------------
st.markdown("---")
st.subheader("📤 Export")

if st.session_state["flags"]:

    colA, colB = st.columns(2)

    with colA:
        json_data = {
            "timestamp": datetime.datetime.now().isoformat(),
            "region": region,
            "flags": st.session_state["flags"]
        }
        json_str = json.dumps(json_data, indent=2)
        st.download_button(
            label="📄 Download JSON",
            data=json_str,
            file_name=f"flags_{region}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
            mime="application/json"
        )

    with colB:
        # CSV export
        rows = []
        for f in st.session_state["flags"]:
            rows.append({
                "ID": f["id"],
                "Category": f["category"],
                "Risk": f["risk_level"],
                "Rationale": f["rationale"],
            })

        df_csv = pd.DataFrame(rows)
        csv_buffer = BytesIO()
        df_csv.to_csv(csv_buffer, index=False)
        csv_data = csv_buffer.getvalue().decode()

        st.download_button(
            label="📊 Download CSV",
            data=csv_data,
            file_name=f"flags_{region}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            mime="text/csv"
        )