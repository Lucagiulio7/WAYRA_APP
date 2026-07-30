import json

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from database.cities import ALL_CITIES
from database.db import get_db
from database.models import Attraction, Food
from routers.itinerary import _foods_with_recommended_places
from services.must_see import annotate_must_see_many
from services.static_content import (
    STATIC_CITY_INFO,
    STATIC_NEIGHBORHOODS,
    localize_attractions,
    localize_culture,
    localize_foods,
)

router = APIRouter(prefix="/api", tags=["data"])

CITY_MODULES = {city.CITY_ID: city for city in ALL_CITIES}


def _json_value(value):
    if not isinstance(value, str):
        return value
    stripped = value.strip()
    if not stripped or stripped[0] not in "[{":
        return value
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        return value


def _serialise_mapping(row) -> dict:
    return {key: _json_value(value) for key, value in row._mapping.items()}


@router.get("/attractions")
def list_attractions(
    city: str = Query(default="roma"),
    level: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    q = db.query(Attraction).filter(Attraction.city == city.lower(), Attraction.is_food_spot == False)  # noqa: E712
    if level is not None:
        q = q.filter(Attraction.category_level == level)
    items = localize_attractions(city, [attraction.to_dict() for attraction in q.all()])
    return {"data": annotate_must_see_many(items)}


@router.get("/food-spots")
def list_food_spots(city: str = Query(default="roma"), db: Session = Depends(get_db)):
    spots = (
        db.query(Attraction)
        .filter(Attraction.city == city.lower(), Attraction.is_food_spot == True)  # noqa: E712
        .order_by(Attraction.attraction_type.asc(), Attraction.name.asc())
        .all()
    )
    return {"data": localize_attractions(city, [spot.to_dict() for spot in spots])}


@router.get("/foods")
def list_foods(city: str = Query(default="roma"), db: Session = Depends(get_db)):
    city_id = city.lower()
    foods = db.query(Food).filter(Food.city == city_id).all()
    food_spots = (
        db.query(Attraction)
        .filter(Attraction.city == city_id, Attraction.is_food_spot == True)  # noqa: E712
        .all()
    )
    items = _foods_with_recommended_places(city_id, foods, food_spots)
    return {"data": localize_foods(city_id, items)}


@router.get("/culture-facts")
def list_culture_facts(city: str = Query(default="roma")):
    city_module = CITY_MODULES.get(city.lower())
    facts = getattr(city_module, "CULTURE_FACTS", []) if city_module else []
    return {"data": localize_culture(city, facts)}


@router.get("/city-info")
def get_city_info(city: str = Query(default="roma"), db: Session = Depends(get_db)):
    city_id = city.lower()
    static_info = STATIC_CITY_INFO.get(city_id)
    if static_info:
        return {"data": static_info}
    try:
        row = db.execute(
            text("SELECT * FROM city_info WHERE city = :city LIMIT 1"),
            {"city": city_id},
        ).first()
    except SQLAlchemyError:
        return {"data": None}
    return {"data": _serialise_mapping(row) if row else None}


@router.get("/neighborhoods")
def list_neighborhoods(city: str = Query(default="roma"), db: Session = Depends(get_db)):
    city_id = city.lower()
    static_neighborhoods = STATIC_NEIGHBORHOODS.get(city_id)
    if static_neighborhoods:
        return {"data": static_neighborhoods}
    try:
        rows = db.execute(
            text(
                "SELECT * FROM neighborhoods "
                "WHERE city = :city ORDER BY sort_order ASC, id ASC"
            ),
            {"city": city_id},
        ).all()
    except SQLAlchemyError:
        return {"data": []}
    return {"data": [_serialise_mapping(row) for row in rows]}


@router.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
