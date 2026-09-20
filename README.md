# DataLens AI 📊

> Upload your cleaned CSV or Excel data — get a full analyst dashboard instantly. No manual chart configuration needed.

## Features

- **Auto Dashboard Generation** — AI reads your data and generates the right charts automatically
- **Smart Chart Selection** — line, bar, pie, scatter, horizontal bar — picked by column type
- **KPI Cards** — totals, averages, row counts auto-computed
- **Anomaly Detection** — Z-score + IQR outlier flagging with severity levels
- **Plain English Q&A** — ask questions like "Which product had highest sales in Q3?"
- **AI Summary** — 3-sentence natural language insight about your dataset

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS + Recharts |
| Backend | FastAPI + Pandas + DuckDB |
| AI | Groq (NL→SQL) + Gemini (Summary + Charts) |

---

## Setup

### 1. Get API Keys (free)

- **Groq**: https://console.groq.com → Create API key
- **Gemini**: https://makersuite.google.com/app/apikey → Create API key

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Set API keys
cp .env.example .env
# Edit .env and add your GROQ_API_KEY and GEMINI_API_KEY

# Run server
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Usage

1. Open http://localhost:5173
2. Upload any cleaned CSV or Excel file
3. Dashboard generates automatically in seconds
4. Use the chat panel to ask questions in plain English

---

## Sample Data

Use any CSV with numeric and category columns. Example structure:

```
Date,Product,Category,Revenue,Units,Region
2024-01-01,Laptop Pro,Electronics,45000,3,South
2024-01-02,Phone X,Electronics,12000,8,North
...
```

---

## Project Structure

```
datalens-ai/
├── backend/
│   ├── main.py                    # FastAPI app entry
│   ├── store.py                   # In-memory data store
│   ├── routes/
│   │   ├── upload.py              # File upload endpoint
│   │   ├── charts.py              # Chart generation endpoint
│   │   ├── query.py               # NL→SQL endpoint
│   │   ├── anomaly.py             # Anomaly detection endpoint
│   │   └── summary.py             # AI summary endpoint
│   └── services/
│       ├── data_profiler.py       # Column type inference + KPIs
│       ├── chart_recommender.py   # Auto chart selection logic
│       ├── anomaly_detector.py    # Z-score + IQR detection
│       ├── nl_to_sql.py           # Groq NL→SQL pipeline
│       └── ai_summary.py          # Gemini summary generation
└── frontend/
    └── src/
        ├── pages/
        │   ├── UploadPage.jsx     # Landing + upload screen
        │   └── DashboardPage.jsx  # Main dashboard
        └── components/
            ├── KPICards.jsx       # Summary stat cards
            ├── ChartCard.jsx      # Individual chart renderer
            ├── AnomalyPanel.jsx   # Anomaly list
            ├── ChatPanel.jsx      # Q&A chat interface
            └── AISummary.jsx      # Gemini insight banner
```

---

## Built by

MCA Final Year Project — Full Stack AI Business Analytics Dashboard
