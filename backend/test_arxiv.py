from services.arxiv_fetcher import fetch_arxiv

papers = fetch_arxiv("  couscous")

print("Total:", len(papers))

# ✅ Handle empty case
if not papers:
    print("No papers found (this is expected for invalid query)")
else:
    for key in ["id", "title", "abstract", "authors", "publication_date", "pdf_link"]:
        assert key in papers[0], f"Missing {key}"

    print(papers[0])