import os
from anthropic import Anthropic

_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def call_llm(prompt: str, max_tokens: int = 300) -> str:
    """Chiama Claude per generare testo descrittivo (max_tokens parole)."""
    message = _client.messages.create(
        model="claude-3-5-haiku-20241022",
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def generate_day_description(day_plan: list[dict]) -> str:
    """Genera una breve descrizione coinvolgente per un giorno di itinerario."""
    city = day_plan[0].get("city", "questa città") if day_plan else "questa città"
    attractions_names = [a.get("name", "") for a in day_plan]

    prompt = (
        f"Scrivi una breve descrizione (massimo 4 righe) per un itinerario giornaliero a {city}.\n\n"
        f"Attrazioni visitate:\n{', '.join(attractions_names)}\n\n"
        "Stile: coinvolgente, evocativo ma sintetico. Scrivi in italiano."
    )

    return call_llm(prompt)
