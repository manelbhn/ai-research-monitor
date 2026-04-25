from services.pipeline import get_all_papers

papers = get_all_papers("couscous")

print("Total:", len(papers))

if papers:
    print(papers[0])