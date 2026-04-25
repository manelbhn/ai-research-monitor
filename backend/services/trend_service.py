from collections import defaultdict

def compute_trends(papers, keywords):
    trend = defaultdict(lambda: defaultdict(int))

    for p in papers:
        # ✅ Safe abstract handling
        abstract = p.get("abstract") or ""
        abstract = abstract.lower()

        # ✅ Safe date handling
        date = p.get("publication_date", "")
        if len(date) < 7:
            continue

        month = date[:7]

        for kw in keywords:
            if kw.lower() in abstract:
                trend[kw][month] += 1

    # ✅ Convert to normal dict (IMPORTANT for frontend)
    clean_trend = {
        keyword: dict(months)
        for keyword, months in trend.items()
    }

    return clean_trend