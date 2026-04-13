from services.arxiv_fetcher import fetch_arxiv
from services.summarizer import summarize_paper
from services.ranker import rank_papers

papers = fetch_arxiv("deep learning", "2023-01-01", "2024-01-01")

for paper in papers:
    paper["summary"] = summarize_paper(paper["abstract"])

ranked_papers = rank_papers(papers, "deep learning")

for paper in ranked_papers:
    print(f"Score: {paper['relevance_score']}")
    print(f"Title: {paper['title']}")
    print(f"Summary: {paper['summary']}")
    print("---")