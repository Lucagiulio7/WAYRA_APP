"""
Generate a canonical Supabase SQL seed for attractions, food spots,
traditional foods and culture facts directly from backend city modules.

Usage:
    cd backend
    python scripts/export_supabase_core_seed.py
"""

from __future__ import annotations

import json
import os
import re
import sys
import unicodedata
from pathlib import Path
from urllib.parse import quote_plus

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.cities import ALL_CITIES  # noqa: E402


ROOT_DIR = Path(__file__).resolve().parents[2]
OUTPUT_PATH = ROOT_DIR / "supabase" / "consolidated" / "102_seed_core_content.sql"


def sql_text(value: object | None) -> str:
    if value is None:
        return "NULL"
    text = str(value).replace("'", "''")
    return f"'{text}'"


def sql_json(value: object) -> str:
    text = json.dumps(value, ensure_ascii=False).replace("'", "''")
    return f"'{text}'::jsonb"


def sql_bool(value: bool) -> str:
    return "true" if value else "false"


def normalise_text(value: object) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def restaurant_maps_link(name: str, city: str) -> str:
    city_query = city.replace("_", " ").strip()
    query = quote_plus(" ".join(part for part in [name.strip(), city_query] if part))
    return f"https://www.google.com/maps/search/?api=1&query={query}"


def normalise_curated_place(place: dict | str) -> dict:
    if isinstance(place, str):
        return {"name": place.strip()}
    if isinstance(place, dict):
        return place
    return {}


def canonical_food_places(food: dict, food_spots: list[dict], city: str) -> list[dict]:
    spot_by_name = {normalise_text(spot.get("name")): spot for spot in food_spots if spot.get("name")}
    places: list[dict] = []
    for raw_place in food.get("places") or []:
        place = normalise_curated_place(raw_place)
        name = str(place.get("name") or "").strip()
        if not name:
            continue
        matched = spot_by_name.get(normalise_text(name))
        if matched:
            places.append(
                {
                    "name": matched.get("name"),
                    "name_en": matched.get("name_en"),
                    "name_fr": matched.get("name_fr"),
                    "maps_link": restaurant_maps_link(matched.get("name", name), city),
                    "rating": matched.get("rating"),
                    "food_type": matched.get("food_type"),
                    "curated": True,
                }
            )
            continue
        places.append(
            {
                "name": name,
                "name_en": place.get("name_en"),
                "name_fr": place.get("name_fr"),
                "maps_link": restaurant_maps_link(name, city),
                "rating": place.get("rating"),
                "food_type": place.get("food_type"),
                "curated": True,
            }
        )
    return places


def build_sql() -> str:
    cities = [city.CITY_ID for city in ALL_CITIES]

    attraction_rows: list[str] = []
    food_rows: list[str] = []
    culture_rows: list[str] = []

    for city in ALL_CITIES:
        city_id = city.CITY_ID
        food_spots = [dict(item) for item in getattr(city, "FOOD_SPOTS", [])]

        for item in getattr(city, "ATTRACTIONS", []):
            if not isinstance(item, dict) or "name" not in item:
                continue
            attraction_rows.append(
                "("
                + ", ".join(
                    [
                        sql_text(item.get("name")),
                        sql_text(item.get("name_en")),
                        sql_text(item.get("name_fr")),
                        sql_text(item.get("description")),
                        sql_text(item.get("description_en")),
                        sql_text(item.get("description_fr")),
                        str(int(item.get("category_level", 1))),
                        "NULL" if item.get("block_id") is None else str(int(item.get("block_id"))),
                        sql_text(item.get("zone")),
                        str(float(item.get("latitude"))),
                        str(float(item.get("longitude"))),
                        str(int(item.get("estimated_visit_time", 60))),
                        sql_json(item.get("tags", [])),
                        sql_text(city_id),
                        sql_bool(False),
                        "NULL",
                        "NULL",
                        "NULL",
                        sql_text(item.get("attraction_type")),
                        sql_text(item.get("ticket_url")),
                    ]
                )
                + ")"
            )

        for item in food_spots:
            attraction_rows.append(
                "("
                + ", ".join(
                    [
                        sql_text(item.get("name")),
                        sql_text(item.get("name_en")),
                        sql_text(item.get("name_fr")),
                        sql_text(item.get("description")),
                        sql_text(item.get("description_en")),
                        sql_text(item.get("description_fr")),
                        str(int(item.get("category_level", 1))),
                        "NULL" if item.get("block_id") is None else str(int(item.get("block_id"))),
                        sql_text(item.get("zone")),
                        str(float(item.get("latitude"))),
                        str(float(item.get("longitude"))),
                        str(int(item.get("estimated_visit_time", 30))),
                        sql_json(item.get("tags", [])),
                        sql_text(city_id),
                        sql_bool(True),
                        sql_text(item.get("food_type")),
                        sql_text(item.get("meal_type")),
                        "NULL" if item.get("rating") is None else str(float(item.get("rating"))),
                        "NULL",
                        "NULL",
                    ]
                )
                + ")"
            )

        for item in getattr(city, "FOODS_BY_CITY", []):
            places = canonical_food_places(item, food_spots, city_id)
            food_rows.append(
                "("
                + ", ".join(
                    [
                        sql_text(item.get("name")),
                        sql_text(item.get("name_en")),
                        sql_text(item.get("name_fr")),
                        sql_text(item.get("description")),
                        sql_text(item.get("description_en")),
                        sql_text(item.get("description_fr")),
                        sql_json(item.get("ingredients", [])),
                        sql_json(item.get("ingredients_en", [])),
                        sql_json(item.get("ingredients_fr", [])),
                        sql_text(city_id),
                        sql_json(places),
                    ]
                )
                + ")"
            )

        for index, item in enumerate(getattr(city, "CULTURE_FACTS", [])):
            culture_rows.append(
                "("
                + ", ".join(
                    [
                        sql_text(city_id),
                        sql_text(item.get("icon", "")),
                        sql_text(item.get("title", "")),
                        sql_text(item.get("title_en")),
                        sql_text(item.get("title_fr")),
                        sql_text(item.get("body", "")),
                        sql_text(item.get("body_en")),
                        sql_text(item.get("body_fr")),
                        str(index),
                    ]
                )
                + ")"
            )

    city_list_sql = ", ".join(sql_text(city) for city in cities)

    parts: list[str] = [
        "-- ============================================================",
        "-- WAYRA - Canonical core content seed",
        "-- Generated from backend/database/cities/*.py",
        "-- Do not edit manually: regenerate via backend/scripts/export_supabase_core_seed.py",
        "-- ============================================================",
        "",
        "ALTER TABLE public.foods",
        "  ADD COLUMN IF NOT EXISTS places JSONB DEFAULT '[]'::jsonb;",
        "",
        "ALTER TABLE public.neighborhoods",
        "  ADD COLUMN IF NOT EXISTS geojson JSONB;",
        "",
        f"DELETE FROM public.culture_facts WHERE city IN ({city_list_sql});",
        f"DELETE FROM public.foods WHERE city IN ({city_list_sql});",
        f"DELETE FROM public.attractions WHERE city IN ({city_list_sql});",
        "",
        "-- Attractions and food spots",
        "INSERT INTO public.attractions",
        "  (name, name_en, name_fr, description, description_en, description_fr,",
        "   category_level, block_id, zone, latitude, longitude, estimated_visit_time,",
        "   tags, city, is_food_spot, food_type, meal_type, rating, attraction_type, ticket_url)",
        "VALUES",
        ",\n".join(attraction_rows) + ";",
        "",
        "-- Traditional foods",
        "INSERT INTO public.foods",
        "  (name, name_en, name_fr, description, description_en, description_fr,",
        "   ingredients, ingredients_en, ingredients_fr, city, places)",
        "VALUES",
        ",\n".join(food_rows) + ";",
        "",
        "-- Culture facts",
        "INSERT INTO public.culture_facts",
        "  (city, icon, title, title_en, title_fr, body, body_en, body_fr, sort_order)",
        "VALUES",
        ",\n".join(culture_rows) + ";",
        "",
    ]

    return "\n".join(parts)


def main() -> None:
    sql = build_sql()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(sql, encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
