import math
import re
import unicodedata
from typing import Iterable


MUST_SEE_BY_CITY: dict[str, list[tuple[str, int]]] = {
    "bruxelles": [
        ("Grand-Place", 1),
        ("Atomium", 2),
        ("Museo Magritte", 3),
        ("Gallerie Reali Saint-Hubert", 4),
        ("Mont des Arts", 5),
        ("Parlamentarium", 6),
        ("Arco del Cinquantenario", 7),
        ("Manneken Pis", 8),
    ],
    "zurigo": [
        ("Grossmünster", 1),
        ("Fraumünster", 2),
        ("Lindenhof", 3),
        ("Kunsthaus Zürich", 4),
        ("Museo Nazionale Svizzero", 5),
        ("Lungolago Bürkliplatz-Quaibrücke", 6),
        ("Uetliberg", 7),
        ("Bahnhofstrasse", 8),
    ],
    "lubiana": [
        ("Castello di Lubiana", 1),
        ("Triplo Ponte", 2),
        ("Piazza Prešeren", 3),
        ("Mercato Centrale e colonnato di Plečnik", 4),
        ("Ponte dei Draghi", 5),
        ("Casa di Plečnik", 6),
        ("Parco Tivoli", 7),
        ("Metelkova mesto", 8),
    ],
    "valletta": [
        ("Concattedrale di San Giovanni", 1),
        ("Giardini Upper Barrakka", 2),
        ("Palazzo del Gran Maestro", 3),
        ("Fort St Elmo e Museo Nazionale della Guerra", 4),
        ("Fort St Angelo", 5),
        ("Città fortificata di Mdina", 6),
        ("Ipogeo di Ħal Saflieni", 7),
        ("Templi di Ħaġar Qim e Mnajdra", 8),
    ],
    "reykjavik": [
        ("Hallgrímskirkja", 1),
        ("Harpa", 2),
        ("Sun Voyager", 3),
        ("Perlan", 4),
        ("Museo Nazionale d'Islanda", 5),
        ("Settlement Exhibition", 6),
        ("Porto Vecchio", 7),
        ("Sky Lagoon", 8),
    ],
    "dubrovnik": [
        ("Mura di Dubrovnik", 1),
        ("Stradun", 2),
        ("Palazzo del Rettore", 3),
        ("Forte Lovrijenac", 4),
        ("Porto Vecchio", 5),
        ("Riserva naturale di Lokrum", 6),
        ("Funivia del Monte Srd", 7),
        ("Cattedrale dell'Assunzione", 8),
    ],
    "helsinki": [
        ("Fortezza marina di Suomenlinna", 1),
        ("Cattedrale di Helsinki", 2),
        ("Piazza del Senato", 3),
        ("Chiesa nella Roccia", 4),
        ("Biblioteca centrale Oodi", 5),
        ("Monumento a Sibelius", 6),
        ("Cattedrale Uspenski", 7),
        ("Löyly", 8),
    ],
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
    "porto": [
        ("Ribeira", 1),
        ("Ponte Dom Luís I upper deck", 2),
        ("Sé do Porto", 3),
        ("Livraria Lello", 4),
        ("Torre dos Clérigos", 5),
        ("São Bento Station", 6),
    ],
    "antalya": [
        ("Kaleiçi", 1),
        ("Porta di Adriano", 2),
        ("Moschea Yivli Minare area", 3),
        ("Cascate inferiori di Düden", 4),
        ("Termessos", 5),
    ],
    "valencia": [
        ("Ciudad de las Artes y las Ciencias", 1),
        ("Lonja de la Seda", 2),
        ("Cattedrale di Valencia", 3),
        ("Mercado Central", 4),
        ("Oceanogràfic", 5),
    ],
    "candia": [
        ("Sito di Cnosso", 1),
        ("Museo Archeologico di Candia", 2),
        ("Fortezza di Koules", 3),
        ("Fontana Morosini", 4),
        ("Loggia Veneziana", 5),
    ],
    "annecy": [
        ("Palais de l'Île", 1),
        ("Lac d'Annecy", 2),
        ("Pont des Amours", 3),
        ("Château d'Annecy", 4),
        ("Jardins de l'Europe", 5),
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


def _matches_registry_name(registry_name: str, attraction_name: str) -> bool:
    if registry_name == attraction_name:
        return True

    # Multi-word aliases can intentionally be shorter than the catalog name,
    # while a single place name must not mark all of its sub-attractions.
    if len(registry_name.split()) < 2:
        return False
    return registry_name in attraction_name or attraction_name in registry_name


def _distance_km(first: dict, second: dict) -> float:
    lat1 = math.radians(first["latitude"])
    lat2 = math.radians(second["latitude"])
    d_lat = lat2 - lat1
    d_lon = math.radians(second["longitude"] - first["longitude"])
    value = math.sin(d_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(d_lon / 2) ** 2
    return 6371.0 * 2 * math.asin(math.sqrt(value))


def annotate_must_see(attraction: dict) -> dict:
    city = _normalize(attraction.get("city"))
    names = {_normalize(name) for name in _names_for(attraction)}
    tags = {_normalize(tag) for tag in (attraction.get("tags") or [])}

    priority = None
    for raw_name, rank in MUST_SEE_BY_CITY.get(city, []):
        normalized = _normalize(raw_name)
        if any(_matches_registry_name(normalized, name) for name in names):
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
        candidates = [
            item for item in items
            if not item.get("is_food_spot") and item.get("category_level") == 1
        ]
        all_attractions = [item for item in items if not item.get("is_food_spot")]

        def nearby_count(item: dict, radius_km: float) -> int:
            return sum(
                1 for other in all_attractions
                if other.get("id") != item.get("id") and _distance_km(item, other) <= radius_km
            )

        viable_candidates = [item for item in candidates if nearby_count(item, 3.0) >= 3]
        if len(viable_candidates) >= 5:
            candidates = viable_candidates

        def fallback_rank(item: dict) -> tuple:
            nearby = nearby_count(item, 3.0)
            very_close = sum(
                1 for other in all_attractions
                if other.get("id") != item.get("id") and _distance_km(item, other) <= 1.5
            )
            return (
                -very_close,
                -nearby,
                -(item.get("estimated_visit_time") or 0),
                item.get("id") or 0,
            )

        fallback = sorted(candidates, key=fallback_rank)[:5]
        for rank, item in enumerate(fallback, start=1):
            item["must_see"] = True
            item["must_see_rank"] = rank
    return annotated
