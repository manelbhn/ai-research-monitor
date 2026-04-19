import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def summarize_paper(abstract: str) -> str:
    """
    Takes a paper abstract and returns a clean AI summary.
    """
    if not abstract or len(abstract.strip()) < 20:
        return "No abstract available."

    prompt = f"""You are a research assistant. Summarize the following research paper abstract 
in 2-3 clear sentences for a researcher. Focus on: what problem it solves, 
the method used, and the key result. Be concise and precise.

Abstract:
{abstract}

Summary:"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        return f"Summary unavailable: {str(e)}"