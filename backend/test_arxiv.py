from services.arxiv_fetcher import fetch_arxiv

papers = fetch_arxiv("machine learning", "2023-01-01", "2024-01-01")

print("Found:", len(papers))

for p in papers[:3]:
    print(p["title"])
    print(p["pdf"])
    print("-----")