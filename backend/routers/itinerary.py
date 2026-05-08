from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import true, false
from sqlalchemy.orm import Session

from database.db import get_db
from database.models import Attraction, Food
from database.cities import ALL_CITIES
from services.itinerary_builder import build_itinerary

router = APIRouter(prefix="/api/itinerary", tags=["itinerary"])

CULTURE_FACTS: dict[str, list[dict]] = {city.CITY_ID: city.CULTURE_FACTS for city in ALL_CITIES}



class ItineraryRequest(BaseModel):
    city: str = Field(default="roma", description="Città destinazione")
    num_days: int = Field(..., ge=1, le=7, description="Numero giorni (1-7)")
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
    base = (
        db.query(Attraction)
        .filter(Attraction.city == city, Attraction.is_food_spot == False)  # noqa: E712
    )
    count_total = base.count()
    count_l1 = base.filter(Attraction.category_level == 1).count()
    max_days_iconico = min(7, max(1, count_l1 // 6))
    max_days_esploratore = min(7, max(1, count_total // 6))
    return {
        "city": city,
        "attraction_count": count_total,
        "max_days_iconico": max_days_iconico,
        "max_days_esploratore": max_days_esploratore,
    }


@router.post("/generate")
def generate(request: ItineraryRequest, db: Session = Depends(get_db)):
    city = request.city

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
            num_days=request.num_days,
            level=request.level,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore costruzione itinerario: {e}")

    if not days:
        raise HTTPException(
            status_code=400,
            detail="Nessuna attrazione trovata per il livello selezionato.",
        )

    # Traditional dishes (deterministic: sorted by id, first 6)
    foods = db.query(Food).filter(Food.city == city).order_by(Food.id).limit(6).all()

    return {
        "success": True,
        "data": {
            "city": city,
            "num_days": request.num_days,
            "level": request.level,
            "days": days,
            "food_recommendations": [f.to_dict() for f in foods],
            "culture_facts": CULTURE_FACTS.get(city, []),
        },
    }
