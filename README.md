# TitanCloud – Enterprise Cloud SRE & Incident Runbook Assistant

An enterprise-grade, production-style RAG (Retrieval-Augmented Generation) application designed for Site Reliability Engineering (SRE) teams to search, diagnose, and remediate incidents using the canonical 50-page TitanCloud technical incident runbook.

---

## 🚀 Key Highlights & Features

1. **Strict RAG Grounding & Zero Hallucination**:
   - Strictly answers questions using only retrieved runbook document context.
   - Enforces explicit fallback: `"I could not find this information in the TitanCloud SRE Incident Runbook."`
   - External queries (such as stock market prices) are safely intercepted and refused.
   - Every fact cites exact source document names and 1-indexed page numbers.

2. **Full-Stack Architecture**:
   - **Frontend**: React 18, Vite, Tailwind CSS (Dark charcoal enterprise theme), Lucide React icons, Recharts telemetry visualizations.
   - **Backend**: Python 3.9+, FastAPI, RESTful endpoints with full CORS and lifecycle management.
   - **AI / RAG Pipeline**: LangChain, Google Gemini API (`gemini-1.5-flash`), `sentence-transformers` (`all-MiniLM-L6-v2`), ChromaDB persistent vector database.
   - **PDF Processing**: PyMuPDF (`fitz`) extracting 50 technical pages with page boundary preservation and 700–1000 character sliding window chunks.
   - **Storage & Telemetry**: ChromaDB vector index (`./chroma_db`) and SQLite database (`titancloud.db`) tracking query latency, chat history, and audit trails.

3. **5-Question Benchmark Assessment Suite**:
   - Pre-configured module running 5 live benchmark tests directly against the RAG pipeline:
     - **Q1 (SLA Service Credits)**: Monthly cluster uptime at 99.2% &rarr; **25% service credit** (Page 9).
     - **Q2 (Patroni High-Availability)**: `ERR_PG_REPLICA_LAG` failover threshold &rarr; **45 seconds** (Page 22).
     - **Q3 (External Market Data Refusal)**: NASDAQ stock price request &rarr; **Refusal without fabricated ticker or price**.
     - **Q4 (PagerDuty Escalation Matrix)**: L1 on-call acknowledgement for P0 alert &rarr; **5 minutes** (acknowledgement) / **15 minutes** (escalation to VP of Infrastructure, Page 41).
     - **Q5 (Missing Information / Domain Boundary)**: Company-issued iPhone 15 cracked screen procedure &rarr; **Refusal (not documented in SRE runbook)**.

---

## 📂 Project Structure

```text
GEN__AI__Exam/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py             # REST endpoints (chat, documents, assessment, health, stats)
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py             # App configuration, env variables, strict prompt
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   └── db.py                 # SQLite operational database (docs, logs, messages)
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py            # Pydantic request/response data contracts
│   │   ├── rag/
│   │   │   ├── __init__.py
│   │   │   └── pipeline.py           # End-to-end RAG orchestrator & assessment evaluator
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── gemini_service.py     # Gemini client + strict grounding + extractive fallback
│   │       ├── pdf_service.py        # PyMuPDF extractor with 1-indexed page preserving chunker
│   │       └── vector_service.py     # ChromaDB persistent vector database with SentenceTransformers
│   ├── main.py                       # FastAPI application entry point
│   └── requirements.txt              # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx            # Enterprise top header with model status pill
│   │   │   └── Sidebar.jsx           # 7-item navigation sidebar with live telemetry
│   │   ├── pages/
│   │   │   ├── OverviewPage.jsx      # Operational metrics, Recharts latency curve, recent queries
│   │   │   ├── AssistantPage.jsx     # Chatbot with citations drawer, pills, copy answer
│   │   │   ├── DocumentsPage.jsx     # PDF uploader, 50-page one-click indexer, document table
│   │   │   ├── AssessmentPage.jsx    # 5-test assessment module with 100% pass verification
│   │   │   ├── HistoryPage.jsx       # Searchable incident audit trail
│   │   │   ├── HealthPage.jsx        # Live status of FastAPI, ChromaDB, Gemini, SQLite
│   │   │   └── SettingsPage.jsx      # API key configuration, top-k slider, grounding contract
│   │   ├── services/
│   │   │   └── api.js                # Frontend API client
│   │   ├── App.jsx                   # Main layout container
│   │   ├── index.css                 # Base stylesheet with Tailwind & custom scrollbars
│   │   └── main.jsx                  # React DOM root entry
│   ├── index.html                    # HTML5 template with Inter fonts & dark styling
│   ├── package.json                  # Frontend dependencies
│   ├── tailwind.config.js            # TitanCloud dark color tokens
│   └── vite.config.js                # Vite build config with /api reverse proxy
├── data/
│   └── titancloud_sre_incident_runbook_50p.pdf # Canonical 50-page technical incident runbook
├── chroma_db/                        # ChromaDB persistent vector database
├── titancloud.db                     # SQLite audit & chat history database
├── .env.example                      # Template environment variables
└── README.md                         # Complete documentation
```

---

## 🛠️ Installation & Setup Instructions

### Prerequisites
- Python 3.9+ installed (`python3 --version`)
- Node.js 18+ and npm installed (`node -v`, `npm -v`)
- (Optional) Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

---

### Step 1: Clone or Navigate to the Workspace

```bash
cd /Users/sarthakthakur/Desktop/GEN__AI__Exam
```

---

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` (optional, can also be configured directly via the UI Settings page):
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8000
HOST=0.0.0.0
EMBEDDING_MODEL_NAME=all-MiniLM-L6-v2
```

---

### Step 3: Backend Setup & Execution

1. Create and activate a Python virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r backend/requirements.txt
```

3. Run the FastAPI backend server:
```bash
PYTHONPATH=. ./venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*The backend will automatically initialize SQLite and auto-index the 50-page PDF runbook (`titancloud_sre_incident_runbook_50p.pdf`) into ChromaDB.*

---

### Step 4: Frontend Setup & Execution

In a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

Open your browser to:
**`http://127.0.0.1:5173/`**

---

## 🧪 Testing the 5 Predefined Assessment Questions

Navigate to the **Assessment Tests** tab in the sidebar and click **"Run Full Assessment Suite"** (or trigger `POST /api/assessment/run` via curl):

| Test ID | Question Focus | Expected Result | Verified Source Page | Grounding Status |
| :--- | :--- | :--- | :--- | :--- |
| **Q1** | SLA credit for 99.2% monthly uptime | **25% service credit** | **Page 9** | `VERIFIED_RUNBOOK` ✅ |
| **Q2** | `ERR_PG_REPLICA_LAG` failover threshold | **45 seconds** | **Page 22** | `VERIFIED_RUNBOOK` ✅ |
| **Q3** | NASDAQ stock ticker price | **Refusal (no fabricated price)** | *Refusal* | `EXTERNAL_DECLINED` ✅ |
| **Q4** | L1 alert acknowledgement before VP escalation | **5 mins acknowledge / 15 mins to VP** | **Page 41** | `VERIFIED_RUNBOOK` ✅ |
| **Q5** | Company-issued iPhone 15 screen replacement | **Information not found in SRE runbook** | *Refusal* | `NOT_FOUND_ACKNOWLEDGED` ✅ |

**Summary Result**: **5/5 tests passed (100% compliance rate)**.

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Comprehensive health check (FastAPI, ChromaDB, Gemini, SQLite) |
| `GET` | `/api/stats` | SRE overview operational metrics and recent activity |
| `GET` | `/api/documents` | Lists all uploaded and indexed SRE runbooks |
| `POST` | `/api/documents/upload` | Uploads and indexes a new PDF with PyMuPDF |
| `POST` | `/api/documents/index-default` | Indexes the default 50-page runbook |
| `POST` | `/api/documents/{id}/reindex` | Re-extracts and re-chunks a document |
| `DELETE` | `/api/documents/{id}` | Deletes a document from ChromaDB and SQLite |
| `POST` | `/api/chat` | Natural language SRE question with RAG citations |
| `GET` | `/api/chat/history` | Fetches conversation sessions and messages |
| `DELETE` | `/api/chat/history` | Clears conversation logs |
| `POST` | `/api/assessment/run` | Executes the 5-test assessment suite |
| `GET` | `/api/config` | Retrieves current RAG hyperparameter settings |
| `POST` | `/api/config` | Updates Gemini API key or retrieval parameters dynamically |

---

## 🔒 Security & Best Practices

- Gemini API keys are processed strictly on the backend and never exposed to the browser.
- Configurable directly from the UI Settings page or `.env` file.
- ChromaDB vector embeddings and SQLite databases persist across application restarts.
- File uploads are validated to ensure only genuine PDF files are processed.
