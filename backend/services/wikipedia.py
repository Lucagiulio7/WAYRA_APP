"""
Wikipedia API integration with in-memory caching.
Returns a 2-3 sentence extract for a given page title.
"""
import re
import requests
from functools import lru_cache

WIKIPEDIA_API = "https://it.wikipedia.org/api/rest_v1/page/summary/{slug}"
WIKIPEDIA_API_EN = "https://en.wikipedia.org/api/rest_v1/page/summary/{slug}"
TIMEOUT = 5


@lru_cache(maxsize=256)
def get_summary(wikipedia_slug: str) -> str:
    """Fetch a short extract from Wikipedia (Italian first, fallback English)."""
    if not wikipedia_slug:
        return ""

    for url_template in [WIKIPEDIA_API, WIKIPEDIA_API_EN]:
        try:
            url = url_template.format(slug=wikipedia_slug)
            resp = requests.get(url, timeout=TIMEOUT, headers={"User-Agent": "ViaggioApp/1.0"})
            if resp.status_code == 200:
                data = resp.json()
                extract = data.get("extract", "")
                return _trim_to_sentences(extract, max_sentences=2)
        except requests.RequestException:
            continue

    return ""


def _trim_to_sentences(text: str, max_sentences: int = 2) -> str:
    """Keep only the first N sentences of a text."""
    if not text:
        return ""
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return " ".join(sentences[:max_sentences])
