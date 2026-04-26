import requests, time, urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime

def fetch_arxiv(topic, date_from=None, date_to=None, max_pages=3, page_size=100):
    all_papers = []

    query = urllib.parse.quote(f"all:{topic}")

    for page in range(max_pages):
        start = page * page_size

        url = (
            f"http://export.arxiv.org/api/query?"
            f"search_query={query}"
            f"&start={start}"
            f"&max_results={page_size}"
            f"&sortBy=submittedDate"
            f"&sortOrder=descending"
        )

        response = requests.get(url)

        if response.status_code != 200 or not response.text.startswith("<?xml"):
            print("Invalid response from arXiv")
            continue

        root = ET.fromstring(response.content)

        for entry in root.findall("{http://www.w3.org/2005/Atom}entry"):
            try:
                published = entry.find("{http://www.w3.org/2005/Atom}published").text
                paper_date = datetime.strptime(published, "%Y-%m-%dT%H:%M:%SZ")

                if date_from and paper_date < datetime.strptime(date_from, "%Y-%m-%d"):
                    continue
                if date_to and paper_date > datetime.strptime(date_to, "%Y-%m-%d"):
                    continue

                paper_id = entry.find("{http://www.w3.org/2005/Atom}id").text.split("/")[-1]

                paper = {
                    "id": paper_id,
                    "title": entry.find("{http://www.w3.org/2005/Atom}title").text.strip(),
                    "abstract": entry.find("{http://www.w3.org/2005/Atom}summary").text.strip(),
                    "authors": [
                        a.find("{http://www.w3.org/2005/Atom}name").text
                        for a in entry.findall("{http://www.w3.org/2005/Atom}author")
                    ],
                    "publication_date": published,
                    "pdf_link": f"https://arxiv.org/pdf/{paper_id}.pdf",
                    "source": "arxiv",
                    "citation_count": 0
                }

                all_papers.append(paper)

            except Exception as e:
                print("Parsing error:", e)

        time.sleep(3)

    return all_papers