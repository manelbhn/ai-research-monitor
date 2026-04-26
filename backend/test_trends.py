from services.pipeline import get_all_papers
from services.trend_service import compute_trends
import json

papers = get_all_papers("computer vision")

keywords = ["computer", "vision"]

trends = compute_trends(papers, keywords)

print(json.dumps(trends, indent=4))