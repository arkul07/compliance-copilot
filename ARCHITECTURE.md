# Architecture

```mermaid
flowchart LR
    U[User / UI] -->|Upload PDF| ADE[LandingAI ADE (DPT-2)]
    ADE -->|Normalized fields + evidence| P[Pathway Live Index]
    R[Rule Docs (md/pdf/txt)] -->|Watch & Ingest| P
    P -->|Hybrid Retrieval (BM25 + Vector)| AG[Compliance Checker]
    AG -->|Flags + Evidence| UI[Streamlit UI]
```

**Key pieces**

* **LandingAI ADE**: extracts tables/clauses → normalized fields + page/section.
* **Pathway**: watches `/backend/contracts` & `/backend/rules`, maintains **hybrid index**.
* **Checker**: compares fields ↔ rule snippets → emits `ComplianceFlag` with rationale + citations.
* **API**: `/upload_*`, `/check`, `/explain`.
* **UI**: file upload, region select, flags list, explain, export CSV/JSON.

**Failure modes & fallbacks**

* No ADE key → stub extraction.
* No Pathway → fallback keyword search; app still runs.
* Idempotent `start_pipeline()`; safe on restarts.

**Data**

* Contracts: `backend/contracts/sample/*.pdf` (+ `.json` for normalized fields).
* Rules: `backend/rules/seed/*.md|.pdf|.txt`.