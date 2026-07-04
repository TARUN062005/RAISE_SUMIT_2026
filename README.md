# Hospital Enterprise Clinical Trial Agent

An autonomous, multi-agent assistant built for clinical trial research coordinators to evaluate patient eligibility, cross-reference drug exclusions, and verify hospital record freshness policies using Vultr Serverless Inference.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Query, React Router, Lucide Icons.
- **Backend**: Python 3.11/3.12, FastAPI, Pydantic v2, Motor (async MongoDB driver), Uvicorn, HTTPX.
- **Database**: MongoDB.
- **AI**: Vultr Serverless Inference (OpenAI-compatible chat completions).

## Architecture Diagram

```
[React Frontend]
       │
       ▼ (HTTP REST / SSE Stream)
[FastAPI REST API]
       │
       ▼
[Agent Orchestrator (Manual ReAct Loop)]
       │
       ▼
[Tool Registry]
 ├── PatientRecordTool
 ├── TrialEligibilityTool
 ├── DrugInteractionTool
 ├── FreshnessTool
 └── ReportTool
       │
       ▼
[MongoDB Collections]
```

## ReAct Loop & Citation Validation

1. **ReAct Orchestration Loop**: The agent utilizes a plain Python manual ReAct loop executing up to a hard cap of 10 steps. System instructions enforce a strict output JSON contract containing `thought` and either `action` (specifying a tool to call) or `final_answer`.
2. **Step Caching**: To prevent redundant database queries, tool results are cached in the run's memory structure using input serialization hashes. If the same tool with identical inputs is requested, the cached observation is returned instantly.
3. **Citation Validation**: When the model issues its `final_answer`, citations are validated by cross-referencing their target identifiers against records successfully retrieved during the agent execution. If any citation references unretrieved data, the agent is re-prompted once for correction. Persistent unverified citations are removed to prevent hallucinations.
4. **Deterministic Report Compilation**: The final structured report metrics, policy comparisons, and criterion satisfaction states are compiled deterministically in Python using the `ReportTool`, ensuring complete mathematical accuracy.

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB instance running locally or on Atlas

### Installation

1. Clone the repository and navigate to the project root.
2. Setup environment configuration:
   ```bash
   copy .env.example .env
   ```
   Edit `.env` to specify your `VULTR_API_KEY` and `MONGO_URI`.

3. Install backend dependencies and seed the database:
   ```bash
   pip install -r backend/requirements.txt
   $env:PYTHONPATH="."
   python backend/app/seed/run_all.py
   ```

4. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. Start the FastAPI backend:
   ```bash
   uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
2. Start the Vite React development server:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.
