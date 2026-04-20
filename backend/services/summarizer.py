import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ── Level config: instruction + dedicated token budget ──────────────────────
DETAIL_LEVELS = {
    "short": {
        "instruction": "Write exactly 4-5 sentences. Cover only the problem, method, and key result.",
        "max_tokens":  200,
        "temperature": 0.2,   # more focused for short output
    },
    "medium": {
        "instruction": "Write exactly 6-8 sentences. Cover background, problem, method, results, and impact.",
        "max_tokens":  400,
        "temperature": 0.3,
    },
    "detailed": {
        "instruction": "Write at least 10 sentences. Cover background, problem, method, results, impact, limitations, future work, and contributions. Be thorough.",
        "max_tokens":  800,
        "temperature": 0.4,   # slightly more expressive for long output
    },
}


def summarize_paper(abstract: str, detail_level: str = "medium") -> str:
    """
    Summarizes a research paper abstract.
    detail_level: "short" | "medium" | "detailed"
    """
    if not abstract or len(abstract.strip()) < 20:
        return "No abstract available."

    # Fall back to medium if an unrecognized level is passed
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

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=config["max_tokens"],      # ← scales with level
            temperature=config["temperature"],    # ← scales with level
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        return f"Summary unavailable: {str(e)}"