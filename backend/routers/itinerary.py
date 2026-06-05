from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import true, false
from sqlalchemy.orm import Session
from slowapi import Limiter
import re
import unicodedata
from urllib.parse import quote_plus

from database.db import get_db
from database.models import Attraction, Food
from database.cities import ALL_CITIES
from services.itinerary_builder import build_itinerary
from services.rate_limit import proxy_aware_remote_address

router = APIRouter(prefix="/api/itinerary", tags=["itinerary"])
limiter = Limiter(key_func=proxy_aware_remote_address)

CULTURE_FACTS: dict[str, list[dict]] = {city.CITY_ID: city.CULTURE_FACTS for city in ALL_CITIES}
FOODS_BY_CITY: dict[str, list[dict]] = {city.CITY_ID: city.FOODS_BY_CITY for city in ALL_CITIES}

FOOD_TERM_STOPWORDS = {
    "alla",
    "allo",
    "con",
    "della",
    "dello",
    "dish",
    "dolce",
    "food",
    "piatto",
    "pasta",
    "rome",
    "roma",
    "roman",
    "romana",
    "romano",
    "tipico",
    "traditional",
    "with",
}


def _normalise_text(value: object) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def _food_terms(food: Food) -> set[str]:
    values: list[object] = [
        food.name,
        food.name_en,
        food.description,
        food.description_en,
        *food.ingredients_list(),
        *food.ingredients_en_list(),
    ]
    terms: set[str] = set()
    for value in values:
        terms.update(
            token
            for token in _normalise_text(value).split()
            if len(token) >= 4 and token not in FOOD_TERM_STOPWORDS
        )
    return terms


def _food_spot_text(spot: Attraction) -> str:
    return _normalise_text(
        " ".join(
            str(value or "")
            for value in [
                spot.name,
                spot.name_en,
                spot.description,
                spot.description_en,
                spot.food_type,
                spot.meal_type,
                *spot.tags_list(),
            ]
        )
    )


def _restaurant_maps_link(name: str, city: str) -> str:
    city_query = city.replace("_", " ").strip()
    query = quote_plus(" ".join(part for part in [name.strip(), city_query] if part))
    return f"https://www.google.com/maps/search/?api=1&query={query}"


def _recommended_place(spot: Attraction, city: str) -> dict:
    return {
        "name": spot.name,
        "name_en": spot.name_en,
        "maps_link": _restaurant_maps_link(spot.name, city),
        "rating": spot.rating,
        "food_type": spot.food_type,
    }


def _normalise_curated_place(place: dict | str) -> dict:
    if isinstance(place, str):
        return {"name": place.strip()}
    if isinstance(place, dict):
        return place
    return {}


def _place_from_curated_data(place: dict, food_spots: list[Attraction], city: str) -> dict:
    spot_by_name = {_normalise_text(spot.name): spot for spot in food_spots}
    name = str(place.get("name") or "").strip()
    matched_spot = spot_by_name.get(_normalise_text(name))
    if matched_spot:
        data = _recommended_place(matched_spot, city)
        data["curated"] = True
        return data

    return {
        "name": name,
        "name_en": place.get("name_en"),
        "maps_link": _restaurant_maps_link(name, city),
        "rating": place.get("rating"),
        "food_type": place.get("food_type"),
        "curated": True,
    }


def _curated_places_for_food(city: str, food: Food, food_spots: list[Attraction]) -> list[dict]:
    food_name = _normalise_text(food.name)
    food_name_en = _normalise_text(food.name_en)
    for item in FOODS_BY_CITY.get(city, []):
        item_names = {_normalise_text(item.get("name")), _normalise_text(item.get("name_en"))}
        if food_name in item_names or (food_name_en and food_name_en in item_names):
            places = [_normalise_curated_place(place) for place in item.get("places") or []]
            return [
                _place_from_curated_data(place, food_spots, city)
                for place in places
                if place.get("name")
            ]
    return []


def _recommended_places_for_food(food: Food, food_spots: list[Attraction], city: str, limit: int = 3) -> list[dict]:
    if not food_spots:
        return []

    terms = _food_terms(food)
    scored: list[tuple[int, float, str, Attraction]] = []

    for spot in food_spots:
        spot_text = _food_spot_text(spot)
        matches = sum(1 for term in terms if term in spot_text)
        if matches:
            scored.append((matches, spot.rating or 0, spot.name.lower(), spot))

    if not scored:
        food_name = _normalise_text(f"{food.name} {food.name_en}")
        is_quick_food = any(
            term in food_name
            for term in ["baccala", "dolce", "gelato", "pizza", "suppli", "sweet"]
        )
        fallback_spots = food_spots
        if not is_quick_food:
            meal_types = {"osteria", "ristorante", "restaurant", "trattoria"}
            fallback_spots = [
                spot
                for spot in food_spots
                if _normalise_text(spot.food_type) in meal_types
            ] or food_spots
        scored = [(0, spot.rating or 0, spot.name.lower(), spot) for spot in fallback_spots]

    scored.sort(key=lambda item: (-item[0], -item[1], item[2]))
    return [_recommended_place(spot, city) for _, __, ___, spot in scored[:limit]]


def _foods_with_recommended_places(city: str, foods: list[Food], food_spots: list[Attraction]) -> list[dict]:
    city_foods_by_name = {
        _normalise_text(item.get("name")): item
        for item in FOODS_BY_CITY.get(city, [])
        if item.get("name")
    }
    city_foods_by_name.update({
        _normalise_text(item.get("name_en")): item
        for item in FOODS_BY_CITY.get(city, [])
        if item.get("name_en")
    })

    enriched_foods: list[dict] = []
    for food in foods:
        food_data = food.to_dict()
        city_food = city_foods_by_name.get(_normalise_text(food.name))
        if city_food:
            food_data["name_en"] = food_data.get("name_en") or city_food.get("name_en")
            food_data["description_en"] = food_data.get("description_en") or city_food.get("description_en")
            if not food_data.get("ingredients_en"):
                food_data["ingredients_en"] = city_food.get("ingredients_en") or []
        food_data["places"] = (
            _curated_places_for_food(city, food, food_spots)
            or _recommended_places_for_food(food, food_spots, city)
        )
        enriched_foods.append(food_data)
    return enriched_foods



class ItineraryRequest(BaseModel):
    city: str = Field(default="roma", description="Città destinazione")
    num_days: int = Field(..., ge=1, le=7, description="Numero giorni (1-7)")
    max_walk_km: float = Field(default=5, ge=2, le=8, description="Km massimi a piedi per giorno")
    level: int | list[int] = Field(
        ...,
        description="Livello esperienza: 1 (iconico), 2 (misto), 3 (nascosto), o lista per mix",
    )

    @field_validator("level")
    @classmethod
    def validate_level(cls, v):
        valid = {1, 2, 3}
        if isinstance(v, int):
            if v not in valid:
                raise ValueError("level deve essere 1, 2 o 3")
        elif isinstance(v, list):
            if not v or not all(x in valid for x in v):
                raise ValueError("Ogni livello deve essere 1, 2 o 3")
        return v

    @field_validator("city")
    @classmethod
    def normalise_city(cls, v: str) -> str:
        return v.lower().strip()


@router.get("/city-info")
def city_info(city: str = "roma", db: Session = Depends(get_db)):
    """Return max sensible days per level for a city."""
    city = city.lower().strip()
    base = (
        db.query(Attraction)
        .filter(Attraction.city == city, Attraction.is_food_spot == False)  # noqa: E712
    )
    count_total = base.count()
    count_l1 = base.filter(Attraction.category_level == 1).count()
    max_days_iconico = 5 if count_l1 > 0 else 1
    max_days_esploratore = 7 if count_total > 0 else 1
    return {
        "city": city,
        "attraction_count": count_total,
        "max_days_iconico": max_days_iconico,
        "max_days_esploratore": max_days_esploratore,
    }


@router.post("/generate")
@limiter.limit("30/minute;300/hour")
def generate(request: Request, body: ItineraryRequest, db: Session = Depends(get_db)):
    city = body.city

    # Fetch attractions and food spots separately
    attractions = (
        db.query(Attraction)
        .filter(Attraction.city == city, Attraction.is_food_spot == False)  # noqa: E712
        .order_by(Attraction.id)
        .all()
    )
    food_spots = (
        db.query(Attraction)
        .filter(Attraction.city == city, Attraction.is_food_spot == True)  # noqa: E712
        .order_by(Attraction.id)
        .all()
    )

    if not attractions:
        raise HTTPException(status_code=404, detail=f"Nessuna attrazione trovata per '{city}'.")

    try:
        days = build_itinerary(
            attractions=[a.to_dict() for a in attractions],
            food_spots=[f.to_dict() for f in food_spots],
            num_days=body.num_days,
            level=body.level,
            max_walk_km=body.max_walk_km,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore costruzione itinerario: {e}")

    if not days:
        raise HTTPException(
            status_code=400,
            detail="Nessuna attrazione trovata per il livello selezionato.",
        )

    # Traditional dishes (deterministic: sorted by id, first 6)
    foods = db.query(Food).filter(Food.city == city).order_by(Food.id).all()
    food_recommendations = _foods_with_recommended_places(city, foods, food_spots)

    return {
        "success": True,
        "data": {
            "city": city,
            "num_days": body.num_days,
            "level": body.level,
            "max_walk_km": body.max_walk_km,
            "days": days,
            "food_recommendations": food_recommendations,
            "culture_facts": CULTURE_FACTS.get(city, []),
        },
    }
