from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.search import router as search_router
from routers.auth import router as auth_router
from routers.gap import router as gap_router
from routers.trending import router as trending_router

app = FastAPI(
    title="AI Research Monitor API",
    description="Fetches, summarizes, and ranks academic papers by topic.",
    version="1.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(search_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(gap_router, prefix="/api")
app.include_router(trending_router, prefix="/api")

# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "AI Research Monitor API is running."}