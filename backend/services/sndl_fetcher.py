import requests
def fetch_sndl(topic, date_from=None, date_to=None):
    url = "https://api.openalex.org/works"

    filters = []
    if date_from:
        filters.append(f"from_publication_date:{date_from}")
    if date_to: 
        filters.append(f"to_publication_date:{date_to}")
    
    params = {
        "search": topic,
        "per_page": 20,
        "sort": "relevance_score:desc",
        "select": "title,abstract_inverted_index,authorships,publication_year,open_access,doi,cited_by_count"
    }

    if filters:
        params["filter"] = ",".join(filters)

    try:
        response = requests.get(url, params=params, timeout=15)

        if response.status_code != 200:
            print(f"Erreur OpenAlex {response.status_code}: {response.text}")
            return []

        data = response.json()
        papers = []

        for paper in data.get("results", []):

            authors = []
            for a in paper.get("authorships", []):
                name = a.get("author", {}).get("display_name")
                institutions = [i.get("display_name") for i in a.get("institutions", [])]
                if name:
                    authors.append({
                        "name": name,
                        "institutions": institutions
                    })

            oa = paper.get("open_access", {})
            pdf_link = oa.get("oa_url")
            abstract = reconstruct_abstract(paper.get("abstract_inverted_index"))

            papers.append({
                "title": paper.get("title"),
                "abstract": abstract,
                "authors": authors,
                "date": str(paper.get("publication_year")),
                "pdf_link": pdf_link,
                "doi": paper.get("doi"),
                "citations": paper.get("cited_by_count"),
                "source": "OpenAlex"
            })

        return papers

    except Exception as e:
        print(f"Erreur: {e}")
        return []


def reconstruct_abstract(inverted_index):
    if not inverted_index:
        return None
    
    words = {}
    for word, positions in inverted_index.items():
        for pos in positions:
            words[pos] = word
    
    return " ".join(words[i] for i in sorted(words.keys()))