import asyncio
import sys
import os
import json
import hashlib

from fastapi import APIRouter, HTTPException

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from schemas import SearchRequest, SearchResponse, PaperResult
from services.pipeline import get_all_papers        # uses both arXiv + Semantic
from services.summarizer import summarize_paper
from services.ranker import rank_papers

router = APIRouter()

# ── Cache setup ────────────────────────────────────────────────────────────────
CACHE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "papers_cache.json")


def _cache_key(topic: str) -> str:
    """Normalize topic to a consistent cache key."""
    return hashlib.md5(topic.strip().lower().encode()).hexdigest()


def _load_cache() -> dict:
    if not os.path.exists(CACHE_FILE):
        return {}
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_cache(cache: dict) -> None:
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[cache] Failed to save: {e}")


# ── Normalize paper keys ───────────────────────────────────────────────────────
# pipeline.py returns keys from both fetchers — normalize to a common shape:
# arxiv:    title, abstract, authors(list), date, pdf, source
# semantic: title, abstract, authors(list), publication_date, pdf_link, source, citation_count

def _normalize(paper: dict) -> dict:
    return {
        "title": paper.get("title", "Untitled"),
        "abstract": paper.get("abstract", ""),
        "authors": paper.get("authors", []),
        "date": paper.get("date") or paper.get("publication_date", ""),
        "pdf": paper.get("pdf") or paper.get("pdf_link", ""),
        "source": paper.get("source", "arxiv"),
        "citation_count": paper.get("citation_count", 0),
        "summary": paper.get("summary", ""),
        "relevance_score": paper.get("relevance_score", 0),
    }


# ── Summarize all papers in parallel ──────────────────────────────────────────

async def _summarize_all(papers: list, detail_level: str) -> list:
    async def _one(paper):
        try:
            paper["summary"] = await asyncio.to_thread(
                summarize_paper,
                paper.get("abstract", ""),
                detail_level,
            )
        except Exception as e:
            print(f"[summarizer error] {e}")
            paper["summary"] = "Summary unavailable."
        return paper

    return list(await asyncio.gather(*[_one(p) for p in papers]))


# ── Route ──────────────────────────────────────────────────────────────────────

@router.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")

    cache_key = _cache_key(request.topic)
    cache = _load_cache()

    # ── Cache hit — return immediately ─────────────────────────────────────────
    if cache_key in cache:
        print(f"[cache] HIT for topic: {request.topic}")
        cached = cache[cache_key]
        return SearchResponse(
            topic=request.topic,
            total=len(cached["papers"]),
            papers=[PaperResult(**p) for p in cached["papers"]],
        )

    # ── Cache miss — fetch, summarize, rank ────────────────────────────────────
    print(f"[cache] MISS for topic: {request.topic} — fetching...")

    # 1. Fetch from both arXiv and Semantic Scholar via pipeline
    raw_papers = await asyncio.to_thread(get_all_papers, request.topic)

    if not raw_papers:
        return SearchResponse(topic=request.topic, total=0, papers=[])

    # 2. Normalize keys from both fetchers
    normalized = [_normalize(p) for p in raw_papers]

    # 3. Summarize in parallel
    summarized = await _summarize_all(normalized, request.detail_level or "medium")

    # 4. Rank
    ranked = rank_papers(summarized, request.topic)

    # 5. Build response objects
    paper_results = []
    for p in ranked:
        authors = p.get("authors", [])
        if isinstance(authors, str):
            authors = [a.strip() for a in authors.split(",")]

        paper_results.append(
            PaperResult(
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

    # 6. Save to cache — store summaries so gap detection can reuse them
    cache[cache_key] = {
        "topic": request.topic,
        "papers": [p.model_dump() for p in paper_results],
        "summaries": [p.summary for p in paper_results],
    }
    _save_cache(cache)
    print(f"[cache] SAVED {len(paper_results)} papers for topic: {request.topic}")

    

    return SearchResponse(
        topic=request.topic,
        total=len(paper_results),
        papers=paper_results,
    )


   #this function is for cash if pappers does not get its summaries will not be sored in cash 
  #  6. Save to cache only if all summaries succeeded
# all_summarized = all(
#     "unavailable" not in p.summary.lower()
#     for p in paper_results
# )

# if all_summarized:
#     cache[cache_key] = {
#         "topic": request.topic,
#         "papers": [p.model_dump() for p in paper_results],
#         "summaries": [p.summary for p in paper_results],
#     }
#     _save_cache(cache)
#     print(f"[cache] SAVED {len(paper_results)} papers for topic: {request.topic}")
# else:
#     print(f"[cache] NOT saved — some summaries failed, will retry next search")