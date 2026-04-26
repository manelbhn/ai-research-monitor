# test_trends.py
# ─────────────────────────────────────────
# Amani + Chiraz — lancez ce fichier pour
# tester vos deux parties ensemble
# ─────────────────────────────────────────

from services.keyword_extractor import extract_keywords_from_papers
from services.keyword_cleaner   import clean_papers_keywords, build_keyword_frequency

# ── Fausses données pour tester sans avoir besoin du vrai pipeline ────────────
FAKE_PAPERS = [
    {
        "title"   : "Deep Learning for Image Classification",
        "abstract": "We propose a deep learning approach using convolutional neural networks for image classification. Our method achieves 95% accuracy on ImageNet.",
        "date"    : "2023-01-15",
        "source"  : "arxiv"
    },
    {
        "title"   : "Transformer Models in NLP",
        "abstract": "This paper presents a transformer-based model for natural language processing tasks. We evaluate on BERT and GPT architectures and show improved results.",
        "date"    : "2023-02-10",
        "source"  : "arxiv"
    },
    {
        "title"   : "Neural Networks for Medical Imaging",
        "abstract": "Deep neural networks are applied to medical image segmentation. Our convolutional approach outperforms existing methods on MRI datasets.",
        "date"    : "2023-01-20",
        "source"  : "OpenAlex"
    },
    {
        "title"   : "Reinforcement Learning in Robotics",
        "abstract": "We use reinforcement learning to train robotic agents in simulation. The deep learning policy achieves human-level performance on manipulation tasks.",
        "date"    : "2023-03-05",
        "source"  : "arxiv"
    },
    {
        "title"   : "Graph Neural Networks Survey",
        "abstract": "A comprehensive survey of graph neural network architectures for node classification, link prediction, and graph classification tasks.",
        "date"    : "2023-02-28",
        "source"  : "OpenAlex"
    },
]


def test_pipeline():
    print("=" * 60)
    print("TREND PIPELINE TEST")
    print("=" * 60)

    # ── STEP 1 : Amani — extraction KeyBERT ──────────────────────
    print("\n--- STEP 1 : Keyword Extraction (Amani) ---")
    papers = extract_keywords_from_papers(FAKE_PAPERS)

    print("\nRésultat après extraction :")
    for p in papers:
        print(f"  {p['title'][:45]:<45} → {p['keywords']}")

    # ── STEP 2 : Chiraz — nettoyage ──────────────────────────────
    print("\n--- STEP 2 : Keyword Cleaning (Chiraz) ---")
    papers = clean_papers_keywords(papers)

    print("\nRésultat après nettoyage :")
    for p in papers:
        print(f"  {p['title'][:45]:<45} → {p['keywords']}")

    # ── STEP 3 : fréquence par mois (pour Hind) ──────────────────
    print("\n--- STEP 3 : Frequency Dataset (pour Hind) ---")
    freq = build_keyword_frequency(papers, min_papers=1)  # min_papers=1 pour les tests

    print("\nDataset final (ce que Hind reçoit) :")
    for kw, months in freq.items():
        print(f"  '{kw}' → {months}")

    print("\n" + "=" * 60)
    print(f"✓ {len(freq)} keywords trackés au total")
    print("=" * 60)


if __name__ == "__main__":
    test_pipeline()
