"""
Generate smaller SQL Editor friendly chunks for attractions and food spots.

Usage:
    cd backend
    python scripts/export_supabase_attractions_chunks.py
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.cities import ALL_CITIES  # noqa: E402


ROOT_DIR = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT_DIR / "supabase" / "sql_editor_ready"

CHUNKS: list[list[str]] = [
    ["amburgo", "amsterdam", "annecy", "antalya"],
    ["atene", "barcellona", "bergen", "berlino"],
    ["bratislava", "bruges", "bucarest", "budapest"],
    ["candia", "colonia", "copenaghen", "cracovia"],
    ["dublino", "edimburgo", "firenze", "francoforte"],
    ["istanbul", "lione", "lisbona", "londra"],
    ["madrid", "marrakech", "marsiglia", "milano"],
    ["monaco_di_baviera", "muğla", "napoli", "oslo"],
    ["parigi", "porto", "praga", "roma"],
    ["salisburgo", "siviglia", "stoccolma", "tallinn"],
    ["valencia", "varsavia", "venezia", "vienna"],
]


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


def build_rows(city_ids: set[str]) -> list[str]:
    rows: list[str] = []
    for city in ALL_CITIES:
        if city.CITY_ID not in city_ids:
            continue

        for item in getattr(city, "ATTRACTIONS", []):
            if not isinstance(item, dict) or "name" not in item:
                continue
            rows.append(
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
                        sql_text(city.CITY_ID),
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

        for item in getattr(city, "FOOD_SPOTS", []):
            rows.append(
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
                        sql_text(city.CITY_ID),
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
    return rows


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for stale in OUT_DIR.glob("102a_*_seed_attractions_and_food_spots.sql"):
        stale.unlink()

    for index, chunk in enumerate(CHUNKS, start=1):
        rows = build_rows(set(chunk))
        city_list_sql = ", ".join(sql_text(city) for city in chunk)
        content = "\n".join(
            [
                "-- ============================================================",
                f"-- WAYRA - Attractions chunk {index:02d}",
                "-- Smaller SQL Editor friendly file",
                "-- ============================================================",
                "",
                f"DELETE FROM public.attractions WHERE city IN ({city_list_sql});",
                "",
                "INSERT INTO public.attractions",
                "  (name, name_en, name_fr, description, description_en, description_fr,",
                "   category_level, block_id, zone, latitude, longitude, estimated_visit_time,",
                "   tags, city, is_food_spot, food_type, meal_type, rating, attraction_type, ticket_url)",
                "VALUES",
                ",\n".join(rows) + ";",
                "",
            ]
        )
        out_path = OUT_DIR / f"102a_{index:02d}_seed_attractions_and_food_spots.sql"
        out_path.write_text(content, encoding="utf-8")
        print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
