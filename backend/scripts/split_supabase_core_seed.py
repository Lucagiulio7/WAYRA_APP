"""
Split 102_seed_core_content.sql into SQL Editor friendly chunks.

Usage:
    cd backend
    python scripts/split_supabase_core_seed.py
"""

from __future__ import annotations

from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
CONSOLIDATED_DIR = ROOT_DIR / "supabase" / "consolidated"
SOURCE_PATH = CONSOLIDATED_DIR / "102_seed_core_content.sql"

OUT_ATTRACTIONS = CONSOLIDATED_DIR / "102a_seed_attractions_and_food_spots.sql"
OUT_FOODS = CONSOLIDATED_DIR / "102b_seed_foods.sql"
OUT_CULTURE = CONSOLIDATED_DIR / "102c_seed_culture_facts.sql"


def extract_between(text: str, start_marker: str, end_marker: str | None) -> str:
    start = text.index(start_marker)
    end = text.index(end_marker, start) if end_marker else len(text)
    return text[start:end].strip() + "\n"


def main() -> None:
    text = SOURCE_PATH.read_text(encoding="utf-8")

    prelude_end_marker = "-- Traditional foods"
    prelude = text[: text.index(prelude_end_marker)].strip() + "\n"

    lines = [line for line in prelude.splitlines() if line.strip()]
    delete_culture = next(line for line in lines if line.startswith("DELETE FROM public.culture_facts"))
    delete_foods = next(line for line in lines if line.startswith("DELETE FROM public.foods"))
    delete_attractions = next(line for line in lines if line.startswith("DELETE FROM public.attractions"))
    alter_foods_places = next(line for line in lines if "ALTER TABLE public.foods" in line)
    add_places_line = next(line for line in lines if "ADD COLUMN IF NOT EXISTS places" in line)
    alter_neighborhoods = next(line for line in lines if "ALTER TABLE public.neighborhoods" in line)
    add_geojson_line = next(line for line in lines if "ADD COLUMN IF NOT EXISTS geojson" in line)

    attractions_block = extract_between(
        text,
        "-- Attractions and food spots",
        "-- Traditional foods",
    )
    foods_block = extract_between(
        text,
        "-- Traditional foods",
        "-- Culture facts",
    )
    culture_block = extract_between(
        text,
        "-- Culture facts",
        None,
    )

    OUT_ATTRACTIONS.write_text(
        "\n".join(
            [
                "-- ============================================================",
                "-- WAYRA - Core content seed / chunk A",
                "-- Attractions and food spots",
                "-- Generated from 102_seed_core_content.sql",
                "-- ============================================================",
                "",
                alter_foods_places,
                add_places_line,
                "",
                alter_neighborhoods,
                add_geojson_line,
                "",
                delete_attractions,
                attractions_block,
            ]
        ),
        encoding="utf-8",
    )

    OUT_FOODS.write_text(
        "\n".join(
            [
                "-- ============================================================",
                "-- WAYRA - Core content seed / chunk B",
                "-- Traditional foods",
                "-- Generated from 102_seed_core_content.sql",
                "-- ============================================================",
                "",
                alter_foods_places,
                add_places_line,
                "",
                delete_foods,
                foods_block,
            ]
        ),
        encoding="utf-8",
    )

    OUT_CULTURE.write_text(
        "\n".join(
            [
                "-- ============================================================",
                "-- WAYRA - Core content seed / chunk C",
                "-- Culture facts",
                "-- Generated from 102_seed_core_content.sql",
                "-- ============================================================",
                "",
                delete_culture,
                culture_block,
            ]
        ),
        encoding="utf-8",
    )

    print(f"Wrote {OUT_ATTRACTIONS}")
    print(f"Wrote {OUT_FOODS}")
    print(f"Wrote {OUT_CULTURE}")


if __name__ == "__main__":
    main()
