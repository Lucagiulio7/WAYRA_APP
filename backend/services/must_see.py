import re
import unicodedata
from typing import Iterable


MUST_SEE_BY_CITY: dict[str, list[tuple[str, int]]] = {
    "roma": [
        ("Colosseo", 1),
        ("Fori Imperiali", 2),
        ("Foro Romano e Palatino", 2),
        ("Basilica di San Pietro", 3),
        ("Cappella Sistina", 4),
        ("Musei Vaticani e Cappella Sistina", 4),
        ("Fontana di Trevi", 5),
        ("Pantheon", 6),
        ("Piazza Navona", 7),
        ("Castel Sant'Angelo", 8),
    ],
    "parigi": [
        ("Musee du Louvre", 1),
        ("Musée du Louvre", 1),
        ("Louvre Museum", 1),
        ("Tour Eiffel", 2),
        ("Eiffel Tower", 2),
        ("Notre-Dame de Paris", 3),
        ("Arc de Triomphe", 4),
        ("Basilique du Sacre-Coeur", 5),
        ("Basilique du Sacré-Coeur", 5),
        ("Sacre-Coeur Basilica", 5),
        ("Sacré-Coeur Basilica", 5),
        ("Musee d'Orsay", 6),
        ("Musée d'Orsay", 6),
        ("Orsay Museum", 6),
        ("Sainte-Chapelle", 7),
    ],
    "londra": [
        ("Tower of London", 1),
        ("British Museum", 2),
        ("Buckingham Palace", 3),
        ("Westminster Abbey", 4),
        ("Big Ben", 5),
        ("Houses of Parliament", 6),
        ("National Gallery", 7),
        ("St Paul's Cathedral", 8),
    ],
    "barcellona": [
        ("Sagrada Familia", 1),
        ("Park Guell", 2),
        ("Park Güell", 2),
        ("Casa Batllo", 3),
        ("Casa Batlló", 3),
        ("La Pedrera", 4),
        ("Casa Mila", 4),
        ("Casa Milà", 4),
        ("Barri Gotic", 5),
        ("Barri Gòtic", 5),
    ],
    "madrid": [
        ("Museo del Prado", 1),
        ("Palacio Real", 2),
        ("Plaza Mayor", 3),
        ("Parque del Retiro", 4),
        ("Museo Reina Sofia", 5),
        ("Museo Reina Sofía", 5),
    ],
    "lisbona": [
        ("Mosteiro dos Jeronimos", 1),
        ("Mosteiro dos Jerónimos", 1),
        ("Torre de Belem", 2),
        ("Torre de Belém", 2),
        ("Castelo de Sao Jorge", 3),
        ("Castelo de São Jorge", 3),
        ("Praca do Comercio", 4),
        ("Praça do Comércio", 4),
        ("Arco da Rua Augusta", 5),
    ],
    "napoli": [
        ("Cappella Sansevero", 1),
        ("Cristo Velato", 1),
        ("Duomo di Napoli", 2),
        ("Spaccanapoli", 3),
        ("Napoli Sotterranea", 4),
        ("Museo Archeologico Nazionale", 5),
        ("Maschio Angioino", 6),
    ],
}


def _normalize(value: str | None) -> str:
    if not value:
        return ""
    text = unicodedata.normalize("NFKD", value)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.lower().replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def _names_for(attraction: dict) -> Iterable[str]:
    yield attraction.get("name") or ""
    yield attraction.get("name_en") or ""


def annotate_must_see(attraction: dict) -> dict:
    city = _normalize(attraction.get("city"))
    names = {_normalize(name) for name in _names_for(attraction)}
    tags = {_normalize(tag) for tag in (attraction.get("tags") or [])}

    priority = None
    for raw_name, rank in MUST_SEE_BY_CITY.get(city, []):
        normalized = _normalize(raw_name)
        if normalized in names or any(
            len(normalized) >= 6 and (normalized in name or name in normalized)
            for name in names
        ):
            priority = rank if priority is None else min(priority, rank)

    if priority is None and ({"imperdibile", "must see", "mustsee"} & tags):
        priority = 99

    if priority is not None:
        attraction["must_see"] = True
        attraction["must_see_rank"] = priority
    else:
        attraction.setdefault("must_see", False)
        attraction.setdefault("must_see_rank", None)
    return attraction


def annotate_must_see_many(attractions: list[dict]) -> list[dict]:
    annotated = [annotate_must_see(dict(attraction)) for attraction in attractions]
    by_city: dict[str, list[dict]] = {}
    for attraction in annotated:
        by_city.setdefault(_normalize(attraction.get("city")), []).append(attraction)

    for city, items in by_city.items():
        if city in MUST_SEE_BY_CITY or any(item.get("must_see") for item in items):
            continue
        fallback = sorted(
            [
                item for item in items
                if not item.get("is_food_spot") and item.get("category_level") == 1
            ],
            key=lambda item: (
                -(item.get("estimated_visit_time") or 0),
                item.get("id") or 0,
            ),
        )[:5]
        for rank, item in enumerate(fallback, start=1):
            item["must_see"] = True
            item["must_see_rank"] = rank
    return annotated
