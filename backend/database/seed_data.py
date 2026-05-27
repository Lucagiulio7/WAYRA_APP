"""
Seed multi-città.

Per aggiungere una nuova città:
  1. Crea database/cities/<nome_città>.py con CITY_ID, ATTRACTIONS, FOOD_SPOTS, FOODS_BY_CITY, CULTURE_FACTS
  2. Aggiungila in database/cities/__init__.py
  3. Esegui: py database/seed_data.py

Struttura di ogni blocco (per città):
  • 2 iconiche   (category_level = 1)
  • 1 ricercata  (category_level = 2)
  • 1 nascosta   (category_level = 3)

Regola geografica:
  Tutte le attrazioni di uno stesso blocco distano ≤ 1.5 km l'una dall'altra.
"""
import json
import sys
import os
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import text
from database.db import engine, SessionLocal
from database.models import Base, Attraction, Food
from database.cities import ALL_CITIES

# ─────────────────────────────────────────────────────────────────────────────
# Aggregazioni (usate anche da altri moduli che importano seed_data)
# ─────────────────────────────────────────────────────────────────────────────

ATTRACTIONS = [a for city in ALL_CITIES for a in city.ATTRACTIONS]
FOOD_SPOTS  = [f for city in ALL_CITIES for f in city.FOOD_SPOTS]
FOODS_BY_CITY = {city.CITY_ID: city.FOODS_BY_CITY for city in ALL_CITIES}


# ─────────────────────────────────────────────────────────────────────────────
# MIGRAZIONE DB
# ─────────────────────────────────────────────────────────────────────────────

def migrate_db():
    with engine.connect() as conn:
        # Migrazione tabella attractions
        result = conn.execute(text("PRAGMA table_info(attractions)"))
        existing_attr = {row[1] for row in result}
        for col_name, col_def in [
            ("is_food_spot",    "BOOLEAN DEFAULT 0 NOT NULL"),
            ("food_type",       "TEXT"),
            ("meal_type",       "TEXT"),
            ("rating",          "REAL"),
            ("zone",            "TEXT"),
            ("block_id",        "INTEGER"),
            ("attraction_type", "TEXT"),
            ("name_en",         "TEXT"),
            ("description_en",  "TEXT"),
            ("ticket_url",      "TEXT"),
        ]:
            if col_name not in existing_attr:
                conn.execute(text(f"ALTER TABLE attractions ADD COLUMN {col_name} {col_def}"))
                print(f"  [attractions] Colonna aggiunta: {col_name}")

        # Migrazione tabella foods
        result = conn.execute(text("PRAGMA table_info(foods)"))
        existing_food = {row[1] for row in result}
        for col_name, col_def in [
            ("name_en",        "TEXT"),
            ("description_en", "TEXT"),
            ("ingredients_en", "TEXT DEFAULT '[]'"),
        ]:
            if col_name not in existing_food:
                conn.execute(text(f"ALTER TABLE foods ADD COLUMN {col_name} {col_def}"))
                print(f"  [foods] Colonna aggiunta: {col_name}")

        conn.commit()


# ─────────────────────────────────────────────────────────────────────────────
# SEED
# ─────────────────────────────────────────────────────────────────────────────

def seed():
    Base.metadata.create_all(bind=engine)
    migrate_db()

    db = SessionLocal()

    by_city_attr: dict[str, list] = defaultdict(list)
    by_city_food: dict[str, list] = defaultdict(list)
    for a in ATTRACTIONS:
        by_city_attr[a["city"]].append(a)
    for f in FOOD_SPOTS:
        by_city_food[f["city"]].append(f)

    seeded_cities = set(by_city_attr) | set(by_city_food)

    for city in seeded_cities:
        expected_names = (
            {a["name"] for a in by_city_attr[city]}
            | {f["name"] for f in by_city_food[city]}
        )

        for row in db.query(Attraction).filter(Attraction.city == city).all():
            if row.name not in expected_names:
                db.delete(row)
                print(f"  [{city}] Rimossa attrazione obsoleta: {row.name}")

        existing = {
            row.name: row
            for row in db.query(Attraction).filter(Attraction.city == city).all()
        }
        added = 0

        for data in by_city_attr[city]:
            if data["name"] in existing:
                row = existing[data["name"]]
                row.category_level    = data["category_level"]
                row.block_id          = data["block_id"]
                row.zone              = data["zone"]
                row.attraction_type   = data.get("attraction_type")
                row.name_en           = data.get("name_en")
                row.description_en    = data.get("description_en")
                row.ticket_url        = data.get("ticket_url")
            else:
                db.add(Attraction(
                    name=data["name"],
                    name_en=data.get("name_en"),
                    description=data["description"],
                    description_en=data.get("description_en"),
                    category_level=data["category_level"],
                    block_id=data["block_id"],
                    zone=data["zone"],
                    latitude=data["latitude"],
                    longitude=data["longitude"],
                    estimated_visit_time=data["estimated_visit_time"],
                    tags=json.dumps(data["tags"], ensure_ascii=False),
                    attraction_type=data.get("attraction_type"),
                    ticket_url=data.get("ticket_url"),
                    city=city,
                    is_food_spot=False,
                ))
                added += 1

        for data in by_city_food[city]:
            if data["name"] in existing:
                row = existing[data["name"]]
                row.category_level = data["category_level"]
                row.zone = data.get("zone")
            else:
                db.add(Attraction(
                    name=data["name"],
                    description=data["description"],
                    category_level=data["category_level"],
                    zone=data.get("zone"),
                    latitude=data["latitude"],
                    longitude=data["longitude"],
                    estimated_visit_time=data["estimated_visit_time"],
                    tags=json.dumps(data.get("tags", []), ensure_ascii=False),
                    city=city,
                    is_food_spot=True,
                    food_type=data["food_type"],
                    meal_type=data["meal_type"],
                    rating=data["rating"],
                ))
                added += 1

        if added:
            print(f"  [{city}] Seed: {added} record aggiunti.")

        if db.query(Food).filter(Food.city == city).count() == 0:
            for data in FOODS_BY_CITY.get(city, []):
                db.add(Food(
                    name=data["name"],
                    name_en=data.get("name_en"),
                    description=data["description"],
                    description_en=data.get("description_en"),
                    ingredients=json.dumps(data.get("ingredients", []), ensure_ascii=False),
                    ingredients_en=json.dumps(data.get("ingredients_en", []), ensure_ascii=False),
                    city=city,
                ))
            n = len(FOODS_BY_CITY.get(city, []))
            if n:
                print(f"  [{city}] Seed: {n} piatti tipici aggiunti.")

    db.commit()
    db.close()


if __name__ == "__main__":
    seed()
    print("Seed completato.")
