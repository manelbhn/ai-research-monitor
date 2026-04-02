from datetime import datetime, timezone

def rank_papers(papers: list, topic: str) -> list:
    """
    Scores each paper and returns them sorted highest to lowest.
    Score is based on: keyword match + recency + citations.
    """
    keywords = topic.lower().split()

    for paper in papers:
        score = 0

        # --- Keyword match score (0 to 40 points) ---
        title = (paper.get("title") or "").lower()
        abstract = (paper.get("abstract") or "").lower()
        for kw in keywords:
            if kw in title:
                score += 10       # title match is worth more
            if kw in abstract:
                score += 3

        # --- Recency score (0 to 30 points) ---
        pub_date = paper.get("published_date") or paper.get("date")
        if pub_date:
            try:
                if isinstance(pub_date, str):
                    pub_date = datetime.fromisoformat(pub_date[:10])
                pub_date = pub_date.replace(tzinfo=timezone.utc)
                days_old = (datetime.now(timezone.utc) - pub_date).days
                # Papers newer than 1 year get full 30 points, older papers get less
                recency = max(0, 30 - int(days_old / 12))
                score += recency
            except:
                pass

        # --- Citations score (0 to 30 points) ---
        citations = paper.get("citations") or 0
        score += min(30, citations // 10)

        paper["relevance_score"] = score

    return sorted(papers, key=lambda p: p["relevance_score"], reverse=True)