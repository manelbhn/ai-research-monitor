# services/keyword_cleaner.py
# ─────────────────────────────────────────
# Chiraz's part — T3
# Cleans raw keywords extracted by Amani's
# keyword_extractor.py and builds the
# frequency dataset for the trend chart
# ─────────────────────────────────────────

import re
from collections import defaultdict
from rapidfuzz import fuzz

# ── Stopwords to remove ───────────────────────────────────────────────────────
# These are generic words that add no value as trend keywords
EXTRA_STOPWORDS = {
    "study", "paper", "research", "propose", "proposed", "approach",
    "method", "methods", "result", "results", "based", "using", "used",
    "show", "shown", "analysis", "novel", "new", "work", "framework",
    "model", "models", "system", "systems", "data", "dataset", "datasets",
    "performance", "experiment", "experiments", "evaluation", "review",
    "survey", "task", "tasks", "training", "testing", "learning"
}


def _normalize(keyword: str) -> str:
    """Lowercase, strip punctuation, collapse spaces."""
    kw = keyword.lower().strip()
    kw = re.sub(r"[^a-z0-9 ]", "", kw)
    kw = re.sub(r"\s+", " ", kw)
    return kw


def remove_stopwords(keywords: list[str]) -> list[str]:
    """
    Removes keywords that are pure stopwords or too generic.

    Example:
        ["deep learning", "study", "proposed method", "neural network"]
        → ["deep learning", "neural network"]
    """
    cleaned = []
    for kw in keywords:
        norm = _normalize(kw)
        words = set(norm.split())
        # skip if ALL words in the keyword are stopwords
        if not words.issubset(EXTRA_STOPWORDS):
            cleaned.append(norm)
    return cleaned


def merge_near_duplicates(keywords: list[str],
                           threshold: int = 85) -> list[str]:
    """
    Merges keywords that are very similar (e.g. 'deep learn' vs 'deep learning').
    Keeps the longest version as the canonical form.

    threshold: 0-100, higher = stricter (85 is a good default)

    Example:
        ["deep learn", "deep learning", "cnn", "convolutional neural network"]
        → ["deep learning", "convolutional neural network"]
    """
    merged   = []
    used     = set()

    # sort longest first so we keep the most complete form
    keywords = sorted(set(keywords), key=len, reverse=True)

    for kw in keywords:
        if kw in used:
            continue
        group = [kw]
        for other in keywords:
            if other == kw or other in used:
                continue
            if fuzz.ratio(kw, other) >= threshold:
                group.append(other)
                used.add(other)
        # keep the longest keyword in the group
        canonical = max(group, key=len)
        merged.append(canonical)
        used.add(kw)

    return merged


def clean_keywords(keywords: list[str]) -> list[str]:
    """
    Full cleaning pipeline for a list of raw keywords:
    1. Normalize
    2. Remove stopwords
    3. Merge near-duplicates

    This is the main function to call.
    """
    keywords = [_normalize(kw) for kw in keywords]
    keywords = remove_stopwords(keywords)
    keywords = merge_near_duplicates(keywords)
    return keywords


def clean_papers_keywords(papers: list[dict]) -> list[dict]:
    """
    Cleans the 'keywords' field of each paper in-place.

    Input:  papers with raw 'keywords' list (from keyword_extractor.py)
    Output: same papers with cleaned 'keywords'
    """
    for paper in papers:
        raw      = paper.get("keywords", [])
        cleaned  = clean_keywords(raw)
        paper["keywords"] = cleaned
    return papers


def build_keyword_frequency(papers: list[dict],
                             min_papers: int = 2) -> dict:
    """
    Builds keyword frequency grouped by month.
    Filters out keywords that appear in only 1 paper.

    Input:
        papers     — list of paper dicts with 'keywords' and 'date' fields
        min_papers — minimum number of papers a keyword must appear in

    Output dict structure (ready for the trend chart endpoint):
    {
        "deep learning": {
            "2023-01": 3,
            "2023-02": 5,
            "2023-04": 2,
        },
        "transformer": {
            "2023-01": 1,
            "2023-03": 4,
        },
        ...
    }
    """
    # keyword → { "YYYY-MM" → count }
    freq: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    # keyword → set of paper titles (to count unique papers per keyword)
    keyword_papers: dict[str, set] = defaultdict(set)

    for paper in papers:
        date     = paper.get("date") or ""
        title    = paper.get("title") or ""
        keywords = paper.get("keywords") or []

        # extract YYYY-MM from various date formats
        # handles: "2023-01-15", "2023-01-15T10:00:00Z", "2023"
        match = re.search(r"(\d{4})-?(\d{2})?", date)
        if match:
            year  = match.group(1)
            month = match.group(2) or "01"
            month_key = f"{year}-{month}"
        else:
            continue  # skip papers with no parseable date

        for kw in keywords:
            freq[kw][month_key]         += 1
            keyword_papers[kw].add(title)

    # filter: keep only keywords that appear in >= min_papers papers
    result = {
        kw: dict(sorted(months.items()))   # sort by date
        for kw, months in freq.items()
        if len(keyword_papers[kw]) >= min_papers
    }

    return result


def run_trend_pipeline(papers: list[dict]) -> dict:
    """
    Full pipeline: takes papers (already having 'keywords' from Amani),
    cleans them, and returns the frequency dict for the trend chart.

    This is the function called by the /trends endpoint.
    """
    print(f"\n[TREND] Cleaning keywords for {len(papers)} papers...")
    papers = clean_papers_keywords(papers)

    print("[TREND] Building frequency dataset...")
    freq = build_keyword_frequency(papers, min_papers=2)

    print(f"[TREND] Done — {len(freq)} unique keywords tracked.")
    return freq
