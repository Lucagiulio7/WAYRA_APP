def generate_day_description(day_plan):
    attractions_names = [a["name"] for a in day_plan]

    prompt = f"""
    Scrivi una breve descrizione (max 5 righe) per un itinerario giornaliero a Roma.

    Attrazioni:
    {", ".join(attractions_names)}

    Stile: coinvolgente ma sintetico.
    """

    return call_llm(prompt)