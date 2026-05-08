from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database.db import get_db
from database.models import Attraction, Food

router = APIRouter(prefix="/api", tags=["data"])


@router.get("/attractions")
def list_attractions(
    city: str = Query(default="roma"),
    level: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    q = db.query(Attraction).filter(Attraction.city == city.lower())
    if level is not None:
        q = q.filter(Attraction.category_level == level)
    return {"data": [a.to_dict() for a in q.all()]}


@router.get("/foods")
def list_foods(city: str = Query(default="roma"), db: Session = Depends(get_db)):
    foods = db.query(Food).filter(Food.city == city.lower()).all()
    return {"data": [f.to_dict() for f in foods]}


@router.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
