import asyncio
import sys
import os

from fastapi import APIRouter, HTTPException

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from schemas import SearchRequest, SearchResponse, PaperResult
from services.arxiv_fetcher import fetch_arxiv          # returns list of dicts with keys: title, abstract, authors, date, pdf, source
from services.summarizer import summarize_paper          # summarize_paper(abstract, detail_level)
from services.ranker import rank_papers                  # rank_papers(papers, topic) → adds relevance_score, sorts

router = APIRouter()



async def _fetch_all(topic: str, date_from, date_to, sources: list) -> list:
    tasks = []

    if "arxiv" in sources:
        tasks.append(
            asyncio.to_thread(fetch_arxiv, topic, date_from, date_to)
        )

    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_papers = []
    for r in results:
        if isinstance(r, Exception):
            print(f"[fetch error] {r}")
        elif isinstance(r, list):
            all_papers.extend(r)

    return all_papers


# ── Summarize all papers in parallel ──────────────────────────────────────────
# arxiv_fetcher already deduplicates, but we run summarize on whatever comes back

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



@router.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")

    # 1. Fetch
    raw_papers = await _fetch_all(
        request.topic,
        request.date_from,
        request.date_to,
        request.sources or ["arxiv"],
    )

    if not raw_papers:
        return SearchResponse(topic=request.topic, total=0, papers=[])

    # 2. Summarize (parallel)
    summarized = await _summarize_all(raw_papers, request.detail_level or "medium")

    # 3. Rank — rank_papers() adds relevance_score and sorts the list
    ranked = rank_papers(summarized, request.topic)

    # 4. Build response
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

    return SearchResponse(
        topic=request.topic,
        total=len(paper_results),
        papers=paper_results,
    )