import os
import sys
import json

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.trend_service import compute_trends

router = APIRouter()

CACHE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "papers_cache.json")


def _load_cache() -> dict:
    if not os.path.exists(CACHE_FILE):
        return {}
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


# ── Schemas ────────────────────────────────────────────────────────────────────

class TrendingPaper(BaseModel):
    title: str
    abstract: str
    authors: List[str]
    date: str
    pdf: str
    source: str
    summary: str
    relevance_score: float


class TrendingResponse(BaseModel):
    total: int
    papers: List[TrendingPaper]
    trends: Dict[str, Dict[str, int]]   # keyword → {month → count}
    topics: List[str]                   # list of cached topics


# ── Route ──────────────────────────────────────────────────────────────────────

@router.get("/trending", response_model=TrendingResponse)
def get_trending(topic: str = ""):
    """
    Returns papers from cache with trend analysis.
    No API calls — reads from papers already fetched by searches.
    """
    cache = _load_cache()

    if not cache:
        return TrendingResponse(total=0, papers=[], trends={}, topics=[])

    # Collect all cached topics
    topics = [v.get("topic", "") for v in cache.values() if v.get("topic")]

    # Get papers — filter by topic if provided, otherwise use all
    all_papers = []
    for key, entry in cache.items():
        if not isinstance(entry, dict):
            continue
        cached_topic = entry.get("topic", "").lower()
        if topic and topic.lower() not in cached_topic:
            continue
        papers = entry.get("papers", [])
        all_papers.extend(papers)

    # Deduplicate by title
    seen = set()
    unique_papers = []
    for p in all_papers:
        title = p.get("title", "")
        if title not in seen:
            seen.add(title)
            unique_papers.append(p)

    # Sort by relevance score
    unique_papers.sort(key=lambda p: p.get("relevance_score", 0), reverse=True)

    # Extract keywords from all paper titles for trend analysis
    stop_words = {"a","an","the","of","in","for","and","on","with","to","is","are","via","using","based","from"}
    keyword_counts: Dict[str, int] = {}
    for p in unique_papers:
        words = p.get("title", "").split()
        for w in words:
            clean = w.replace(",","").replace(".","").replace(":","").lower()
            if len(clean) > 4 and clean not in stop_words:
                keyword_counts[clean] = keyword_counts.get(clean, 0) + 1

    # Top 5 keywords for trend analysis
    top_keywords = sorted(keyword_counts, key=keyword_counts.get, reverse=True)[:5]

    # Convert papers to format trend_service expects
    trend_papers = []
    for p in unique_papers:
        trend_papers.append({
            "abstract": p.get("abstract", ""),
            "publication_date": p.get("date", ""),
        })

    # Compute trends using trend_service
    trends = compute_trends(trend_papers, top_keywords) if top_keywords else {}

    # Build response papers
    response_papers = []
    for p in unique_papers[:20]:  # max 20
        authors = p.get("authors", [])
        if isinstance(authors, str):
            authors = [a.strip() for a in authors.split(",")]

        response_papers.append(
            TrendingPaper(
                title=p.get("title", "Untitled"),
                abstract=p.get("abstract", ""),
                authors=authors,
                date=p.get("date", ""),
                pdf=p.get("pdf", ""),
                source=p.get("source", "arxiv"),
                summary=p.get("summary", ""),
                relevance_score=float(p.get("relevance_score", 0)),
            )
        )

    return TrendingResponse(
        total=len(response_papers),
        papers=response_papers,
        trends=trends,
        topics=topics,
    )