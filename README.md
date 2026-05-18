# AI Research Monitor

A full-stack web application for discovering and monitoring academic research papers.
Users can search for papers, explore topic gaps , track trending research,
and manage a personal profile with saved favorites and followed topics.
The backend is built with FastAPI (Python) and the frontend with Next.js (TypeScript).

---

## Project Structure

```
ai-research-monitor/
|
|-- backend/                        # All Python server-side code
|   |
|   |-- models/
|   |   |-- database.py             # Database models and SQLAlchemy setup
|   |
|   |-- routers/                    # API route handlers (one file per feature)
|   |   |-- auth.py                 # Register, login, token management
|   |   |-- gap.py                  # Topic gap detection endpoint
|   |   |-- search.py               # Paper search endpoint
|   |   |-- trending.py             # Trending papers endpoint
|   |
|   |-- services/                   # Business logic, separate from routing
|       |-- arxiv_fetcher.py        # Fetches papers from the ArXiv API
|       |-- db_service.py           # Database read/write operations
|       |-- pipeline.py             # Main search/processing pipeline
|       |-- ranker.py               # Ranks papers by relevance
|       |-- semantic_fetcher.py     # Fetches data from Semantic Scholar API
|       |-- summarizer.py           # Generates paper summaries
|       |-- trend_service.py        # Logic for detecting trending papers
|       |-- utils.py                # Shared helper functions
|
|-- src/                            # All Next.js frontend code
|   |
|   |-- app/                        # Next.js App Router (each folder = a page)
|   |   |
|   |   |-- api/                    # Next.js server-side API routes
|   |   |   |-- export-csv/         # Exports waitlist data as a CSV file
|   |   |   |-- get-emails/         # Retrieves waitlist email addresses
|   |   |   |-- subscribe/          # Handles new waitlist subscriptions
|   |   |   |-- waitlist/           # General waitlist management
|   |   |
|   |   |-- login/                  # Login page
|   |   |-- signup/                 # Registration page
|   |   |-- papers/[id]/            # Individual paper detail page (dynamic route)
|   |   |-- profile/                # User profile page
|   |   |-- results/                # Search results listing page
|   |   |-- topic-gap/              # Topic gap analysis page
|   |   |-- trends/                 # Trending papers page
|   |   |-- waitlist/               # Waitlist landing page
|   |   |
|   |   |-- layout.tsx              # Root layout shared across all pages
|   |   |-- page.tsx                # Home page (search entry point)
|   |   |-- globals.css             # Global styles applied everywhere
|   |
|   |-- components/                 # Reusable UI components
|   |   |
|   |   |-- auth/                   # Components related to authentication
|   |   |   |-- AuthButtons.tsx     # Login / sign up button group
|   |   |   |-- AuthForm.tsx        # Shared form for login and registration
|   |   |   |-- FavoritePaperButton.tsx   # Button to save a paper to favorites
|   |   |   |-- FollowTopicButton.tsx     # Button to follow a research topic
|   |   |   |-- SearchHistoryTracker.tsx  # Tracks and displays past searches
|   |   |
|   |   |-- home-page/
|   |   |   |-- HomeSearchForm.tsx  # Main search bar shown on the home page
|   |   |
|   |   |-- providers/
|   |   |   |-- AppPreferencesProvider.tsx  # Context provider for user preferences
|   |   |
|   |   |-- second-page/results/    # Components shown on the search results page
|   |       |-- data.ts             # Static data or type definitions for results
|   |       |-- icons.tsx           # Icon components used in result cards
|   |       |-- PaperSummaryA.tsx   # Paper card component (summary view)
|   |       |-- SearchComplete.tsx  # Shown when a search finishes loading
|   |
|   |-- lib/                        # Frontend utility functions and API helpers
|       |-- api.ts                  # Functions for calling the FastAPI backend
|       |-- client-auth.ts          # Client-side auth token handling
|       |-- i18n.ts                 # Internationalisation / language support
|       |-- waitlist-admin.ts       # Admin utilities for managing the waitlist
|       |-- waitlist-csv.ts         # CSV generation logic for waitlist export
|       |-- waitlist-db.ts          # Waitlist database interactions
|       |-- waitlist-validation.ts  # Input validation for waitlist forms
|
|-- main.py                         # FastAPI application entry point
|-- schemas.py                      # Pydantic request/response schemas
|-- papers.db                       # SQLite database file (auto-created on first run)
|-- papers_cache.json               # Cache for previously fetched papers
|-- requirements.txt                # Python dependencies list
|-- .env                            # Backend environment variables (not committed)
|-- .env.local                      # Frontend environment variables (not committed)
|-- next.config.ts                  # Next.js configuration
|-- package.json                    # Node.js dependencies and scripts
|-- tsconfig.json                   # TypeScript compiler configuration
|-- proxy.ts                        # Optional proxy config for local development
|-- AGENTS.md                       # Notes for AI agent context
|-- CLAUDE.md                       # Claude-specific project instructions
|-- README.md                       # This file
```

---

## Prerequisites

Before running this project, make sure you have the following installed on your machine:

- Python 3.10 or higher
- Node.js 18 or higher
- npm (comes bundled with Node.js)
- Git

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/manelbhn/ai-research-monitor.git
cd ai-research-monitor
```

### 2. Backend setup

Create and activate a virtual environment to keep Python dependencies isolated from the rest of your system.(optional)

On Windows:
```bash
python -m venv .venv
.venv\Scripts\activate
```

On macOS or Linux:
```bash
python -m venv .venv
source .venv/bin/activate
```

Install all required Python packages:
```bash
pip install -r requirements.txt
```

Create a `.env` file in the root directory and fill in the values below:
```
GROQ_API_KEY=your_secret_key_here
OPENAlex_API_KEY=your_openai_api_key_here
SEMANTIC_API_KEY=your_openai_api_key_here(optional)
```

### 3. Frontend setup

Install the Node.js dependencies:
```bash
npm install
```

Create a `.env.local` file in the root directory with the following content:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Running the Application

Both the backend and the frontend must be running at the same time.
Open two separate terminal windows and run one command in each.
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
```bash
npm run dev
```
The application will be accessible in your browser at: http://localhost:3000 (will be deployed soon)

---

## Running the Tests

The backend includes several test scripts. Run each one individually:(optional)

```bash
python test_arxiv.py
python test_pipeline.py
python test_semantic.py
python test_summarizer.py
python test_trends.py
```

---

## Features

- search across academic papers from ArXiv and OpenAlex (or semantic)
- Topic gap detection to surface under-researched areas in a field
- Trending papers section based on recent activity and followed topics
- User authentication (register, login, token-based sessions)
- Personal profile with saved favorite papers and followed topics
- Waitlist system 

---

## Notes

- The `papers.db` SQLite file is created automatically the first time you run the backend. You do not need to create it manually.
- The `.env` and `.env.local` files contain API keys. You must create them yourself after cloning.
- If you do not have an Groq API key, the summarization feature will be unavailable. All other features will still work normally.