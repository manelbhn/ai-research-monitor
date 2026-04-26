# services/keyword_extractor.py
# ─────────────────────────────────────────
# Amani's part — T3
# Extracts top keywords from each abstract
# using KeyBERT
# ─────────────────────────────────────────

from keybert import KeyBERT

_model = KeyBERT()


def extract_keywords(abstract: str, top_n: int = 8) -> list[str]:
    """
    Extracts top keywords from a single abstract.

    Returns a flat list of keyword strings.
    Example: ["deep learning", "neural network", "image classification"]
    """
    if not abstract or len(abstract.strip()) < 20:
        return []

    results = _model.extract_keywords(
        abstract,
        keyphrase_ngram_range=(1, 2),   # single words + bigrams
        stop_words="english",
        top_n=top_n,
        use_mmr=True,                   # diversity — avoids near-duplicate keywords
        diversity=0.5,
    )

    # results = [("deep learning", 0.85), ("neural network", 0.72), ...]
    # we return only the keyword strings, not the scores
    return [kw for kw, score in results]


def extract_keywords_from_papers(papers: list[dict]) -> list[dict]:
    """
    Adds a 'keywords' field to each paper dict.

    Input:  list of paper dicts (must have 'abstract' field)
    Output: same list with 'keywords' added to each paper

    Example output:
    [
        {
            "title": "...",
            "abstract": "...",
            "keywords": ["deep learning", "cnn", "image recognition"],
            ...
        },
        ...
    ]
    """
    for paper in papers:
        abstract = paper.get("abstract") or ""
        paper["keywords"] = extract_keywords(abstract)
        print(f"  [KEYWORDS] '{paper.get('title', '')[:50]}' → {paper['keywords']}")

    return papers
