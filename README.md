# Global Compliance Copilot (MVP)

A real-time **compliance assistant** that reads contracts/policies, compares them to jurisdictional rules, and flags risks with evidence — showcasing **LandingAI ADE** (document extraction) + **Pathway** (live hybrid indexing).

---

## TL;DR
- **Flow:** Upload contract → (ADE) extract key fields → (Pathway) retrieve rule snippets → check → show flags with evidence.  
- **Wow:** Add a *new* rule file during the demo → rerun check → results update **immediately**.  
- **Scope (MVP):** 3 categories (privacy, labor, tax) × 2 regions (EU, US). 4 fields.

---

## Setup
**Prereqs:** Python 3.10+, Node.js 18+, Git.  
**Windows PowerShell**
```powershell
Set-ExecutionPolicy -Scope Process RemoteSigned -Force
./scripts/dev_bootstrap.ps1
```

**macOS/Linux**

```bash
chmod +x scripts/dev_bootstrap.sh
./scripts/dev_bootstrap.sh
```

If sanity check passes, continue.

---

## Run

**Terminal 1 (API)**

```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.app:app --reload
```

**Terminal 2 (UI)**

```bash
cd frontend
npm install
npm run dev
```

API: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
UI : [http://localhost:3000](http://localhost:3000)

---

## Using the App

1. **Upload a contract (PDF).**
2. **Add rules** by file (md/pdf/txt) or paste a snippet.
3. Click **Check compliance** → flags appear with rationale + evidence.
4. Add another rule and **Check** again to show real-time change.
5. **Download** flags as JSON/CSV.

---

## API (planned/now)

* `GET /health` — health check
* `POST /upload_contract` — save PDF, run ADE (or stub), persist normalized fields
* `POST /upload_rule` — save rule doc, index
* `GET /check?region=EU|US|IN` — run retrieval + checks → list of `ComplianceFlag`
* `GET /explain?id=...` — return contract evidence + top rule snippet

Models in `backend/models/schemas.py`.

---

## MVP Fields (normalized)

* `jurisdiction`
* `data_processing` (controller/processor)
* `termination_notice` (e.g., "30 days")
* `tax_withholding_clause` ("applicable"/"not applicable")

---

## Demo Script (judges)

1. Upload **contract.pdf** → show extracted fields.
2. Add rule files: `eu_gdpr_privacy.md`, `us_tax_withholding.md`.
3. **Check (EU)** → 2–4 flags.
4. Add `eu_labor_notice.md` → **Check** again → results change instantly.
5. Export CSV; show `ARCHITECTURE.md`.

---

## Troubleshooting

* **Python <3.10 / not found** → install latest Python, rerun bootstrap.
* **Install errors** → `python -m pip install --upgrade pip` then `pip install -r requirements.txt`.
* **Streamlit import issues** → run from repo root; `backend/__init__.py` exists.
* **Ports busy** → `uvicorn ... --port 8001`, Streamlit auto-picks another port.
* **No ADE key** → stub extraction runs; set `LANDINGAI_API_KEY` in `.env` to enable real ADE.

---

## Scoring Fit

* **Impact:** concrete flags + evidence; show before/after adding a rule.
* **Technical soundness:** ADE + Pathway, live updates, failure fallbacks.
* **Originality:** multi-jurisdiction, live adaptation.
* **Presentation:** short story, reproducible steps.

---

## Environment

Copy `.env.example` → `.env` and set:

```
LANDINGAI_API_KEY=YOUR_KEY
```

## Safety

* Don't commit secrets.
* Keep human-in-the-loop for HIGH risk decisions.
* Handle PII carefully.

License: MIT (or your choice).