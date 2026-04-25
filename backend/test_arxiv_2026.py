from services.arxiv_fetcher import fetch_arxiv
from datetime import datetime
import json

topic = "machine learning"

date_from = "2026-01-01"
date_to = "2026-12-31"

papers = fetch_arxiv(topic, date_from, date_to)

print("=== TEST: 2026 PAPERS ===")
print("Total papers found:", len(papers))
print()

valid = True

for p in papers:
    paper_date = datetime.strptime(p["date"], "%Y-%m-%dT%H:%M:%SZ")

    if paper_date.year != 2026:
        valid = False
        print("❌ ERROR:", p["title"], p["date"])

print("\n=== SAMPLE OUTPUT ===")
print(json.dumps(papers[:2], indent=4))

if valid:
    print("\n✅ All papers are from 2026")
else:
    print("\n❌ Some papers are NOT from 2026")