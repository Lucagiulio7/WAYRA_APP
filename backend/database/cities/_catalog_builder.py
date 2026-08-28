"""Small constructors for self-contained, four-language city modules."""

from __future__ import annotations


def attractions(city: str, zones: list[dict], first_block: int) -> list[dict]:
    result = []
    for zone_index, zone in enumerate(zones):
        intro = zone["intro"]
        for index, item in enumerate(zone["items"]):
            names, details, lat, lon, minutes, kind, url = item
            descriptions = [f"{intro[lang]} {details[lang]}" for lang in range(4)]
            result.append({
                "city": city, "block_id": first_block + zone_index, "zone": zone["id"],
                "category_level": 1 + index // 2,
                "name": names[0], "name_en": names[1], "name_fr": names[2], "name_es": names[3],
                "description": descriptions[0], "description_en": descriptions[1],
                "description_fr": descriptions[2], "description_es": descriptions[3],
                "latitude": lat, "longitude": lon, "estimated_visit_time": minutes,
                "tags": [kind, zone["id"]], "attraction_type": kind, "ticket_url": url,
            })
    return result


def food_spots(city: str, venues: dict[str, list[str]], centres: dict[str, tuple[float, float]]) -> list[dict]:
    copy = (
        "Locale selezionato per un pasto coerente con questa zona; verifica sempre orari e prenotazione.",
        "A selected place for a meal that fits this area; always check opening hours and booking.",
        "Une adresse sélectionnée pour un repas adapté à ce secteur; vérifiez toujours horaires et réservation.",
        "Un local seleccionado para una comida acorde con esta zona; comprueba siempre horarios y reserva.",
    )
    result = []
    for zone, names in venues.items():
        lat, lon = centres[zone]
        for index, name in enumerate(names):
            result.append({
                "city": city, "zone": zone, "category_level": 1 + index // 3,
                "name": name, "name_en": name, "name_fr": name, "name_es": name,
                "description": copy[0], "description_en": copy[1], "description_fr": copy[2], "description_es": copy[3],
                "latitude": round(lat + (index % 4 - 1.5) * .0012, 5),
                "longitude": round(lon + (index // 4 - .5) * .0018, 5),
                "estimated_visit_time": 75, "tags": ["ristorante", zone],
                "food_type": "ristorante", "meal_type": "both",
                "price_range": "€€" if index < 6 else "€€€", "rating": round(4.1 + index % 5 * .1, 1),
            })
    return result


def fact(icon: str, titles: tuple[str, str, str, str], bodies: tuple[str, str, str, str]) -> dict:
    return {
        "icon": icon, "title": titles[0], "title_en": titles[1], "title_fr": titles[2], "title_es": titles[3],
        "body": bodies[0], "body_en": bodies[1], "body_fr": bodies[2], "body_es": bodies[3],
    }


def neighborhood(index: int, city: str, names, descriptions, tags) -> dict:
    return {
        "id": 2000 + index, "city": city,
        "name": names[0], "name_en": names[1], "name_fr": names[2], "name_es": names[3],
        "description": descriptions[0], "description_en": descriptions[1],
        "description_fr": descriptions[2], "description_es": descriptions[3],
        "vibe_tags": tags, "sort_order": index,
    }
