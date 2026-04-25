import requests
import time
from requests.exceptions import RequestException

from dotenv import load_dotenv
import os

load_dotenv()

API_KEY = os.getenv("SEMANTIC_API_KEY")


def fetch_semantic(topic, limit=50, retries=3):
    url = "https://api.semanticscholar.org/graph/v1/paper/search"

    params = {
        "query": topic,
        "limit": limit,
        "fields": "title,abstract,authors,year,citationCount,url"
    }

    headers = {
        "User-Agent": "Mozilla/5.0",
 	"x-api-key": API_KEY
    }

    for attempt in range(retries):
        try:
            response = requests.get(url, params=params, headers=headers, timeout=10)
        except RequestException as e:
            print("Semantic unavailable (offline mode)")
            return []

        if response.status_code == 200:
            data = response.json()
            papers = []

            for p in data.get("data", []):
                papers.append({
                    "id": p.get("paperId"),
                    "title": p.get("title", ""),
                    "abstract": p.get("abstract") or "",
                    "authors": [a["name"] for a in p.get("authors", [])],
                    "publication_date": str(p.get("year", "")),
                    "pdf_link": p.get("url", ""),
                    "source": "semantic",
                    "citation_count": p.get("citationCount", 0)
                })

            return papers

        elif response.status_code == 429:
            print(f"Rate limited (attempt {attempt+1})... waiting")
            time.sleep(0.5)

        else:
            print("Semantic Scholar error:", response.status_code)
            return []

    print("Semantic Scholar failed after retries")
    return []