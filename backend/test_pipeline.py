import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from services.arxiv_fetcher import fetch_arxiv
from services.sndl_fetcher  import fetch_sndl
from services.summarizer    import summarize_paper
from services.ranker        import rank_papers

# ─────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────
TOPIC       = "DATA MINING"
DATE_FROM   = "2023-01-01"
DATE_TO     = "2024-01-01"
DETAIL      = "medium"           # "short" | "medium" | "detailed"
MAX_WORKERS = 5                  # papers summarized at the same time
SOURCES     = ["arxiv", "sndl"]  # choose one or both
# ─────────────────────────────────────────


def separator(label: str = "", char: str = "-", width: int = 60):
    if label:
        print(f"\n--- {label} {char * (width - len(label) - 5)}")
    else:
        print(char * width)


# ─────────────────────────────────────────
# NORMALIZE
# Ensures every paper dict has the same keys
# regardless of which fetcher produced it
# ─────────────────────────────────────────
def normalize_paper(paper: dict) -> dict:
    # authors: sndl returns list of dicts, arxiv returns list of strings
    authors = paper.get("authors", [])
    if authors and isinstance(authors[0], dict):
        authors = [a.get("name", "") for a in authors]

    return {
        "title"    : paper.get("title")    or "N/A",
        "abstract" : paper.get("abstract") or "",
        "authors"  : authors,
        "date"     : paper.get("date")     or str(paper.get("publication_year", "")),
        "pdf"      : paper.get("pdf")      or paper.get("pdf_link") or "",
        "doi"      : paper.get("doi",      ""),
        "citations": paper.get("citations", 0),
        "source"   : paper.get("source")   or "unknown",
        "summary"  : paper.get("summary",  None),
    }


# ─────────────────────────────────────────
# STEP 1 — FETCH
# ─────────────────────────────────────────
def test_fetch(topic, date_from, date_to, sources):
    separator("STEP 1 - Fetching papers")
    print(f"Topic     : {topic}")
    print(f"Date range: {date_from} -> {date_to}")
    print(f"Sources   : {', '.join(sources)}")

    all_papers = []
    start = time.time()

    if "arxiv" in sources:
        print("\n  [arxiv] Fetching...")
        try:
            arxiv_papers = fetch_arxiv(topic, date_from, date_to)
            arxiv_papers = [normalize_paper(p) for p in arxiv_papers]
            print(f"  [arxiv] {len(arxiv_papers)} papers fetched.")
            all_papers.extend(arxiv_papers)
        except Exception as e:
            print(f"  [arxiv] FAILED: {e}")

    if "sndl" in sources:
        print("\n  [sndl/OpenAlex] Fetching...")
        try:
            sndl_papers = fetch_sndl(topic, date_from, date_to)
            sndl_papers = [normalize_paper(p) for p in sndl_papers]
            print(f"  [sndl/OpenAlex] {len(sndl_papers)} papers fetched.")
            all_papers.extend(sndl_papers)
        except Exception as e:
            print(f"  [sndl/OpenAlex] FAILED: {e}")

    elapsed = time.time() - start

    if not all_papers:
        print("\n[FAILED] No papers returned from any source.")
        sys.exit(1)

    # cross-source deduplication by title
    seen   = set()
    unique = []
    for p in all_papers:
        key = p["title"].lower().strip()
        if key not in seen:
            seen.add(key)
            unique.append(p)

    print(f"\n[OK] Total: {len(unique)} unique papers from all sources in {elapsed:.2f}s")
    return unique


# ─────────────────────────────────────────
# STEP 2 — SUMMARIZE
# ─────────────────────────────────────────
def test_summarize_all(papers: list, detail: str):
    separator(f"STEP 2 - Summarizing all papers in parallel (level: {detail})")

    start  = time.time()
    failed = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_paper = {
            executor.submit(summarize_paper, paper["abstract"], detail): paper
            for paper in papers
        }

        for future in as_completed(future_to_paper):
            paper = future_to_paper[future]
            try:
                summary          = future.result()
                paper["summary"] = summary

                print(f"  [DONE] [{paper['source']}] '{paper['title'][:50]}'")

                if summary.startswith("Summary unavailable"):
                    failed += 1
                    print(f"  [WARN] A paper failed: {summary}")

            except Exception as e:
                paper["summary"] = "Summary unavailable: unexpected error."
                failed += 1
                print(f"  [WARN] Unexpected error: {str(e)}")

    elapsed = time.time() - start
    print(f"[OK] Summarized {len(papers) - failed}/{len(papers)} papers in {elapsed:.2f}s")
    return papers


# ─────────────────────────────────────────
# STEP 3 — RANK
# ─────────────────────────────────────────
def test_ranker(papers: list, topic: str):
    separator("STEP 3 - Ranking papers")

    start   = time.time()
    ranked  = rank_papers(papers, topic)
    elapsed = time.time() - start

    print(f"[OK] Ranked {len(ranked)} papers in {elapsed:.2f}s")
    return ranked


# ─────────────────────────────────────────
# DISPLAY
# ─────────────────────────────────────────
def display_results(ranked: list):
    separator("RESULTS")
    print(f"Total papers: {len(ranked)}\n")

    for i, paper in enumerate(ranked, start=1):
        print(f"#{i}  Score    : {paper.get('relevance_score', 'N/A')}")
        print(f"    Source   : {paper['source']}")
        print(f"    Title    : {paper['title']}")
        print(f"    Authors  : {', '.join(paper['authors'][:3]) if paper['authors'] else 'N/A'}")
        print(f"    Date     : {paper['date']}")
        print(f"    Citations: {paper.get('citations', 'N/A')}")
        print(f"    PDF      : {paper['pdf'] or paper.get('doi') or 'N/A'}")
        print(f"    Summary  : {paper.get('summary', 'N/A')}")
        print("." * 60)


# ─────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────
def run_pipeline():
    print("=" * 60)
    print("PIPELINE START")
    print("=" * 60)

    papers = test_fetch(TOPIC, DATE_FROM, DATE_TO, SOURCES)
    papers = test_summarize_all(papers, DETAIL)
    ranked = test_ranker(papers, TOPIC)
    display_results(ranked)

    print("=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    run_pipeline()