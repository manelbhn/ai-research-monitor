from services.summarizer import summarize_paper
from services.ranker import rank_papers

# Test summarizer
abstract = """We propose a new transformer-based model for Arabic dialect identification. 
Our approach fine-tunes AraBERT on a dataset of 50,000 tweets from 5 Maghrebi dialects 
including Algerian, Moroccan, and Tunisian. We achieve 89% accuracy, outperforming 
previous baselines by 12 points."""

summary = summarize_paper(abstract)
print("SUMMARY:", summary)
print()

# Test ranker
papers = [
    {
        "title": "AraBERT for Algerian Dialect NLP",
        "abstract": abstract,
        "published_date": "2024-03-15",
        "citations": 45
    },
    {
        "title": "Machine Translation Survey",
        "abstract": "A survey of neural machine translation methods.",
        "published_date": "2022-01-10",
        "citations": 200
    },
    {
        "title": "Algerian Dialect Sentiment Analysis",
        "abstract": "We analyze sentiment in Algerian dialect social media posts.",
        "published_date": "2025-01-20",
        "citations": 5
    }
]

ranked = rank_papers(papers, "Algerian dialect NLP")
for p in ranked:
    print(f"Score {p['relevance_score']} — {p['title']}")