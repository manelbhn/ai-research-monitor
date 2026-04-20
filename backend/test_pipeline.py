# test_pipeline.py

import sys
import time
from services.arxiv_fetcher import fetch_arxiv
from services.summarizer import summarize_paper
from services.ranker import rank_papers

# ─────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────
TOPIC       = "deep learning"
DATE_FROM   = "2023-01-01"
DATE_TO     = "2024-01-01"
DETAIL      = "medium"   # default until frontend is connected
                         # options: "short" | "medium" | "detailed"
# ─────────────────────────────────────────


def separator(label: str = "", char: str = "-", width: int = 60):
    if label:
        print(f"\n--- {label} {char * (width - len(label) - 5)}")
    else:
        print(char * width)


def test_fetch(topic, date_from, date_to):
    separator("STEP 1 - Fetching papers")
    print(f"Topic     : {topic}")
    print(f"Date range: {date_from} -> {date_to}")

    start   = time.time()
    papers  = fetch_arxiv(topic, date_from, date_to)
    elapsed = time.time() - start

    if not papers:
        print("[FAILED] No papers returned. Check your topic or date range.")
        sys.exit(1)

    print(f"[OK] Fetched {len(papers)} papers in {elapsed:.2f}s")
    return papers


def test_summarize_all(papers: list, detail: str):
    separator(f"STEP 2 - Summarizing all papers (level: {detail})")

    start  = time.time()
    failed = 0

    for i, paper in enumerate(papers):
        summary          = summarize_paper(paper["abstract"], detail_level=detail)
        paper["summary"] = summary

        if summary.startswith("Summary unavailable"):
            failed += 1
            print(f"  [WARN] Paper {i+1} failed: {summary}")

    elapsed = time.time() - start
    print(f"[OK] Summarized {len(papers) - failed}/{len(papers)} papers in {elapsed:.2f}s")
    return papers


def test_ranker(papers: list, topic: str):
    separator("STEP 3 - Ranking papers")

    start   = time.time()
    ranked  = rank_papers(papers, topic)
    elapsed = time.time() - start

    print(f"[OK] Ranked {len(ranked)} papers in {elapsed:.2f}s")
    return ranked


def display_results(ranked: list):
    separator("RESULTS")
    print(f"Total papers: {len(ranked)}\n")

    for i, paper in enumerate(ranked, start=1):
        print(f"#{i}  Score  : {paper['relevance_score']}")
        print(f"    Title  : {paper['title']}")
        print(f"    Summary: {paper.get('summary', 'N/A')}")
        print("." * 60)


def run_pipeline():
    print("=" * 60)
    print("PIPELINE START")
    print("=" * 60)

    papers = test_fetch(TOPIC, DATE_FROM, DATE_TO)
    papers = test_summarize_all(papers, DETAIL)
    ranked = test_ranker(papers, TOPIC)
    display_results(ranked)

    print("=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    run_pipeline()