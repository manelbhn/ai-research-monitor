import os
import sys
import json
import re
from datetime import datetime, timedelta, timezone
from collections import defaultdict

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.trend_service import compute_trends

router = APIRouter()

CACHE_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "papers_cache.json"
)


def _load_cache() -> dict:
    if not os.path.exists(CACHE_FILE):
        return {}
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            content = json.load(f)
            return content if isinstance(content, dict) else {}
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
    citation_count: int = 0
    is_rising: bool = False        # True if paper is from recent period


class RisingKeyword(BaseModel):
    keyword: str
    recent_count: int              # count in recent period
    older_count: int               # count in older period
    growth: float                  # % growth


class TrendingResponse(BaseModel):
    total: int
    papers: List[TrendingPaper]
    most_cited: List[TrendingPaper]    # top papers by citation count
    trends: Dict[str, Dict[str, int]]  # keyword → {month → count}
    rising_keywords: List[RisingKeyword]  # keywords trending up
    topics: List[str]                  # list of cached topics


# ── Helpers ────────────────────────────────────────────────────────────────────

STOP_WORDS = {
    "a","an","the","of","in","for","and","on","with","to","is","are","via",
    "using","based","from","this","that","we","our","its","into","these",
    "their","which","have","been","also","when","where","while","such",
    "both","each","more","most","than","then","they","them","some","many",
    "paper","study","research","proposed","approach","method","results",
    "show","analysis","novel","new","work","framework","model","system",
    "data","dataset","performance","experiment","evaluation","review",
    "survey","task","training","testing","used","large","learning",
}


def _extract_bigrams_from_text(text: str) -> list[str]:
    """Extract meaningful 2-word phrases from text."""
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
    words = [w for w in words if w not in STOP_WORDS]
    bigrams = [f"{words[i]} {words[i+1]}" for i in range(len(words) - 1)]
    return bigrams


def _parse_date(date_str: str) -> Optional[datetime]:
    """Parse various date formats."""
    if not date_str:
        return None
    try:
        # Try ISO format first
        clean = date_str[:10]  # take YYYY-MM-DD
        return datetime.strptime(clean, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except Exception:
        try:
            return datetime.strptime(date_str[:4], "%Y").replace(tzinfo=timezone.utc)
        except Exception:
            return None


def _filter_by_period(papers: list, period: str) -> list:
    """Filter papers by time period."""
    now = datetime.now(timezone.utc)

    period_map = {
        "3months": timedelta(days=90),
        "6months": timedelta(days=180),
        "1year": timedelta(days=365),
        "all": None,
    }

    delta = period_map.get(period)
    if delta is None:
        return papers

    cutoff = now - delta
    filtered = []
    for p in papers:
        date = _parse_date(p.get("date", ""))
        if date and date >= cutoff:
            filtered.append(p)

    return filtered if filtered else papers  # fallback to all if none match


def _detect_rising_keywords(papers: list) -> list[RisingKeyword]:
    """
    Detect keywords that are trending UP.
    Compare keyword frequency in recent 6 months vs older papers.
    """
    now = datetime.now(timezone.utc)
    recent_cutoff = now - timedelta(days=180)

    recent_counts: Dict[str, int] = defaultdict(int)
    older_counts: Dict[str, int] = defaultdict(int)

    for p in papers:
        text = p.get("summary", "") or p.get("abstract", "")
        if not text or "unavailable" in text.lower():
            text = p.get("abstract", "")

        bigrams = _extract_bigrams_from_text(text)
        date = _parse_date(p.get("date", ""))

        if date and date >= recent_cutoff:
            for bg in bigrams:
                recent_counts[bg] += 1
        else:
            for bg in bigrams:
                older_counts[bg] += 1

    # Calculate growth for keywords that appear in recent papers
    rising = []
    for kw, recent in recent_counts.items():
        if recent < 2:  # need at least 2 mentions to be meaningful
            continue
        older = older_counts.get(kw, 0)

        if older == 0:
            growth = 100.0  # completely new keyword
        else:
            growth = ((recent - older) / older) * 100

        if growth > 20:  # at least 20% growth
            rising.append(RisingKeyword(
                keyword=kw,
                recent_count=recent,
                older_count=older,
                growth=round(growth, 1),
            ))

    # Sort by growth descending, take top 8
    rising.sort(key=lambda x: x.growth, reverse=True)
    return rising[:8]


# ── Route ──────────────────────────────────────────────────────────────────────

@router.get("/trending", response_model=TrendingResponse)
def get_trending(topic: str = "", period: str = "all"):
    """
    Returns papers from cache with trend analysis.
    - topic: filter by topic
    - period: "3months" | "6months" | "1year" | "all"
    """
    cache = _load_cache()

    if not cache:
        return TrendingResponse(
            total=0, papers=[], most_cited=[],
            trends={}, rising_keywords=[], topics=[]
        )

    # Collect all cached topics
    topics = [v.get("topic", "") for v in cache.values() if isinstance(v, dict) and v.get("topic")]

    # Get papers filtered by topic
    all_papers = []
    for key, entry in cache.items():
        if not isinstance(entry, dict):
            continue
        cached_topic = entry.get("topic", "").lower()
        if topic and topic.lower() not in cached_topic:
            continue
        all_papers.extend(entry.get("papers", []))

    # Deduplicate by title
    seen = set()
    unique_papers = []
    for p in all_papers:
        title = p.get("title", "")
        if title not in seen:
            seen.add(title)
            unique_papers.append(p)

    # Filter by time period
    period_filtered = _filter_by_period(unique_papers, period)

    # Mark papers as rising (from last 3 months)
    now = datetime.now(timezone.utc)
    recent_cutoff = now - timedelta(days=90)
    for p in period_filtered:
        date = _parse_date(p.get("date", ""))
        p["is_rising"] = bool(date and date >= recent_cutoff)

    # Sort by relevance score
    period_filtered.sort(key=lambda p: p.get("relevance_score", 0), reverse=True)

    # Most cited papers (from Semantic Scholar which has citation_count)
    cited_papers = [p for p in unique_papers if p.get("citation_count", 0) > 0]
    cited_papers.sort(key=lambda p: p.get("citation_count", 0), reverse=True)

    # Rising keywords — from summaries
    rising_keywords = _detect_rising_keywords(unique_papers)

    # Extract keywords from summaries for trend chart
    keyword_counts: Dict[str, int] = defaultdict(int)
    for p in period_filtered:
        text = p.get("summary", "") or p.get("abstract", "")
        if not text or "unavailable" in text.lower():
            text = p.get("abstract", "")
        for bg in _extract_bigrams_from_text(text):
            keyword_counts[bg] += 1

    top_keywords = sorted(keyword_counts, key=keyword_counts.get, reverse=True)[:5]

    # Compute trends using trend_service
    trend_papers = [
        {
            "abstract": p.get("summary") or p.get("abstract", ""),
            "publication_date": p.get("date", ""),
        }
        for p in period_filtered
    ]
    trends = compute_trends(trend_papers, top_keywords) if top_keywords else {}

    # Build response papers
    def _build_paper(p: dict) -> TrendingPaper:
        authors = p.get("authors", [])
        if isinstance(authors, str):
            authors = [a.strip() for a in authors.split(",")]
        return TrendingPaper(
            title=p.get("title", "Untitled"),
            abstract=p.get("abstract", ""),
            authors=authors,
            date=p.get("date", ""),
            pdf=p.get("pdf", ""),
            source=p.get("source", "arxiv"),
            summary=p.get("summary", ""),
            relevance_score=float(p.get("relevance_score", 0)),
            citation_count=int(p.get("citation_count", 0)),
            is_rising=bool(p.get("is_rising", False)),
        )

    response_papers = [_build_paper(p) for p in period_filtered[:20]]
    most_cited = [_build_paper(p) for p in cited_papers[:5]]

    return TrendingResponse(
        total=len(response_papers),
        papers=response_papers,
        most_cited=most_cited,
        trends=trends,
        rising_keywords=rising_keywords,
        topics=topics,
    )