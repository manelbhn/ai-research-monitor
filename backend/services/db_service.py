from models.database import Session, Paper

def save_papers(papers):
    session = Session()

    for p in papers:
        exists = session.query(Paper).filter_by(title=p["title"]).first()

        if not exists:
            paper = Paper(
                paper_id=p["id"],
                title=p["title"],
                abstract=p["abstract"],
                authors=", ".join(p["authors"]),
                date=p["publication_date"],
                pdf=p["pdf_link"],
                source=p["source"],
                citation_count=p["citation_count"]
            )
            session.add(paper)

    session.commit()
    session.close()