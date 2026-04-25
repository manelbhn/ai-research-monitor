from rapidfuzz import fuzz

def deduplicate(papers):
    unique = []

    for p in papers:
        duplicate = False

        for u in unique:
            if fuzz.ratio(p["title"], u["title"]) > 90:
                duplicate = True
                break

        if not duplicate:
            unique.append(p)

    return unique