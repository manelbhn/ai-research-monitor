from services.arxiv_fetcher import fetch_arxiv
from services.semantic_fetcher import fetch_semantic
from services.utils import deduplicate
from services.db_service import save_papers
from models.database import Session, Paper


def get_all_papers(topic):
    # ✅ DO NOT print exception details anymore
    try:
        arxiv = fetch_arxiv(topic)
    except Exception:
        print("arXiv unavailable (offline mode)")
        arxiv = []

    try:
        semantic = fetch_semantic(topic)
    except Exception:
        print("Semantic unavailable (offline mode)")
        semantic = []

    papers = arxiv + semantic
    papers = deduplicate(papers)

    # If APIs worked
    if papers:
        save_papers(papers)
        return papers

    # Fallback
    print("Using database fallback...")

    session = Session()
    db_papers = session.query(Paper).limit(200).all()
    session.close()

    result = []
    for p in db_papers:
        result.append({
            "id": p.paper_id,
            "title": p.title,
            "abstract": p.abstract,
            "authors": p.authors.split(", "),
            "publication_date": p.date,
            "pdf_link": p.pdf,
            "source": p.source,
            "citation_count": p.citation_count
        })

    return result