from services.semantic_fetcher import fetch_semantic

papers = fetch_semantic("medecine in algeria")

print("Count:", len(papers))

if papers:
    print(papers[0])
else:
    print("No papers returned")