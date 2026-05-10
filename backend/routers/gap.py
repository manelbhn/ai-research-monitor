import os
import sys
import json
import hashlib

from fastapi import APIRouter, HTTPException

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from groq import Groq
from dotenv import load_dotenv
from schemas import GapRequest, GapResponse, GapCard

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ── Cache setup ────────────────────────────────────────────────────────────────
CACHE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "papers_cache.json")


def _cache_key(topic: str) -> str:
    return hashlib.md5(topic.strip().lower().encode()).hexdigest()


def _load_cache() -> dict:
    if not os.path.exists(CACHE_FILE):
        return {}
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _get_summaries_from_cache(topic: str) -> list[str]:
    """
    Read summaries saved by search router.
    Returns empty list if topic not cached yet.
    """
    cache = _load_cache()
    key = _cache_key(topic)
    if key in cache:
        summaries = cache[key].get("summaries", [])
        print(f"[gap] Using {len(summaries)} cached summaries for: {topic}")
        return summaries
    print(f"[gap] No cache found for: {topic}")
    return []


# ── Gap detection ──────────────────────────────────────────────────────────────

def detect_gaps(topic: str, summaries: list[str]) -> list[GapCard]:
    summaries_text = "\n\n".join(
        f"Paper {i + 1}: {s}" for i, s in enumerate(summaries[:15])
    )

    prompt = f"""You are an expert research analyst. Below are AI-generated summaries of recent academic papers on the topic: "{topic}".

Your task is to identify 4 to 6 specific research gaps — areas that are clearly missing, underexplored, or not addressed by these papers.

For each gap, provide:
- "gap": a short clear name for the missing research area (max 8 words)
- "reason": 1-2 sentences explaining what evidence in the papers shows this is missing
- "opportunity": an integer score from 0 to 100 indicating how big the opportunity is (100 = completely unexplored, 0 = well covered)
- "action": 1-2 sentences recommending what a researcher should do to address this gap

Rules:
- Base your analysis strictly on what the papers cover and what they miss
- Be specific to the topic "{topic}" — do not give generic AI gaps
- Return ONLY a valid JSON array, no explanation, no markdown, no code blocks
- Format: [{{"gap": "...", "reason": "...", "opportunity": 85, "action": "..."}}]

Paper summaries:
{summaries_text}

JSON:"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1200,
        temperature=0.4,
    )

    raw = response.choices[0].message.content.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    parsed = json.loads(raw)

    gaps = []
    for item in parsed:
        gaps.append(GapCard(
            gap=item.get("gap", "Unknown gap"),
            reason=item.get("reason", ""),
            opportunity=int(item.get("opportunity", 50)),
            action=item.get("action", ""),
        ))

    return sorted(gaps, key=lambda g: g.opportunity, reverse=True)


# ── Route ──────────────────────────────────────────────────────────────────────

@router.post("/gap", response_model=GapResponse)
def analyze_gap(request: GapRequest):
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")

    raw = ""
    try:
        # Step 1 — try to get summaries from cache (no extra API calls)
        summaries = _get_summaries_from_cache(request.topic)

        # Step 2 — if not cached, use summaries sent by frontend
        if not summaries:
            summaries = request.summaries

        if not summaries:
            raise HTTPException(
                status_code=400,
                detail="No summaries available. Please search this topic first."
            )

        gaps = detect_gaps(request.topic, summaries)
        return GapResponse(topic=request.topic, gaps=gaps)

    except json.JSONDecodeError as e:
        print(f"[gap] JSON parse error: {e}")
        print(f"[gap] Raw response was: {raw}")
        raise HTTPException(
            status_code=500,
            detail=f"AI returned invalid JSON: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[gap] Unexpected error: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Gap detection failed: {str(e)}"
        )