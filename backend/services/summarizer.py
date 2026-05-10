import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ── Models in fallback order ───────────────────────────────────────────────────
MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-8b-8192",
    "gemma2-9b-it",
    "mixtral-8x7b-32768",
]

DETAIL_LEVELS = {
    "short": {
        "instruction": "Write exactly 4-5 sentences. Cover only the problem, method, and key result.",
        "max_tokens": 200,
        "temperature": 0.2,
    },
    "medium": {
        "instruction": "Write exactly 6-8 sentences. Cover background, problem, method, results, and impact.",
        "max_tokens": 400,
        "temperature": 0.3,
    },
    "detailed": {
        "instruction": "Write at least 10 sentences. Cover background, problem, method, results, impact, limitations, future work, and contributions.",
        "max_tokens": 800,
        "temperature": 0.4,
    },
}


def summarize_paper(abstract: str, detail_level: str = "medium") -> str:
    if not abstract or len(abstract.strip()) < 20:
        return "No abstract available."

    config = DETAIL_LEVELS.get(detail_level, DETAIL_LEVELS["medium"])

    prompt = f"""You are a research assistant. Summarize the following research paper abstract.

Instructions: {config["instruction"]}
Rules:
- Be precise and avoid repetition.
- Do not copy sentences from the abstract.
- Do not add any heading or label, just the summary text.

Abstract:
{abstract}

Summary:"""

    # Try each model in order until one works
    for model in MODELS:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=config["max_tokens"],
                temperature=config["temperature"],
            )
            return response.choices[0].message.content.strip()

        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "rate_limit" in error_str.lower():
                print(f"[summarizer] {model} rate limited, trying next model...")
                continue
            else:
                return "Summary temporarily unavailable. Please try again later."

    return "Summary unavailable: all models rate limited. Try again tomorrow."