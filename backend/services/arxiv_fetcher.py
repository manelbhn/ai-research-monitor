import requests
from models.database import Session, Paper
from rapidfuzz import fuzz
import xml.etree.ElementTree as ET
from datetime import datetime

def fetch_arxiv(topic, date_from=None, date_to=None):
    url = f"http://export.arxiv.org/api/query?search_query=all:{topic}&start=0&max_results=20"

    response = requests.get(url)
    root = ET.fromstring(response.content)

    papers = []

    for entry in root.findall("{http://www.w3.org/2005/Atom}entry"):
        title = entry.find("{http://www.w3.org/2005/Atom}title").text
        abstract = entry.find("{http://www.w3.org/2005/Atom}summary").text
        published = entry.find("{http://www.w3.org/2005/Atom}published").text

        authors = [
            author.find("{http://www.w3.org/2005/Atom}name").text
            for author in entry.findall("{http://www.w3.org/2005/Atom}author")
        ]

        pdf_link = ""
        for link in entry.findall("{http://www.w3.org/2005/Atom}link"):
            if link.attrib.get("type") == "application/pdf":
                pdf_link = link.attrib.get("href")

        paper_date = datetime.strptime(published, "%Y-%m-%dT%H:%M:%SZ")

        if date_from and paper_date < datetime.strptime(date_from, "%Y-%m-%d"):
            continue

        if date_to and paper_date > datetime.strptime(date_to, "%Y-%m-%d"):
            continue

        papers.append({
            "title": title.strip(),
            "abstract": abstract.strip(),
            "authors": authors,
            "date": published,
            "pdf": pdf_link,
            "source": "arxiv"
        })

    papers = deduplicate(papers)
    save_papers(papers)
    return papers

def deduplicate(papers):
    unique = []

    for paper in papers:
        duplicate = False
        for u in unique:
            if fuzz.ratio(paper["title"], u["title"]) > 90:
                duplicate = True
                break

        if not duplicate:
            unique.append(paper)

    return unique

def save_papers(papers):
    session = Session()

    for p in papers:
        exists = session.query(Paper).filter_by(title=p["title"]).first()

        if not exists:
            paper = Paper(
                title=p["title"],
                abstract=p["abstract"],
                authors=", ".join(p["authors"]),
                date=p["date"],
                pdf=p["pdf"],
                source=p["source"]
            )
            session.add(paper)

    session.commit()
    session.close()