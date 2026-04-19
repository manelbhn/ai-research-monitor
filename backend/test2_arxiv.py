import json
from services.arxiv_fetcher import fetch_arxiv

papers = fetch_arxiv("machine learning", "2023-01-01", "2024-01-01")

# Print nicely formatted JSON
print(json.dumps(papers[:2], indent=4))