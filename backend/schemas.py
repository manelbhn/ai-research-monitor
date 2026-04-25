from pydantic import BaseModel
from typing import List, Optional


# ── Search ─────────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    topic: str
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    sources: Optional[List[str]] = ["arxiv"]
    max_results: Optional[int] = 20
    detail_level: Optional[str] = "medium"


class PaperResult(BaseModel):
    title: str
    abstract: str
    authors: List[str]
    date: str
    pdf: str
    source: str
    summary: str
    relevance_score: float


class SearchResponse(BaseModel):
    topic: str
    total: int
    papers: List[PaperResult]


# ── Gap Detection ──────────────────────────────────────────────────────────────

class GapRequest(BaseModel):
    topic: str
    summaries: List[str]      # list of AI summaries from the search results


class GapCard(BaseModel):
    gap: str                  # name of the gap
    reason: str               # why it's missing based on the papers
    opportunity: int          # 0-100 score
    action: str               # recommended next step for researcher


class GapResponse(BaseModel):
    topic: str
    gaps: List[GapCard]