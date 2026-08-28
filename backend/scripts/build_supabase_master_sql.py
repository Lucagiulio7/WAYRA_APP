"""
Rebuild the consolidated Supabase master SQL file from the category files.

Usage:
    cd backend
    python scripts/build_supabase_master_sql.py
"""

from __future__ import annotations

from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
CONSOLIDATED_DIR = ROOT_DIR / "supabase" / "consolidated"
OUTPUT_PATH = CONSOLIDATED_DIR / "000_master_load.sql"

ORDERED_FILES = [
    "001_schema_core.sql",
    "102a_seed_attractions_and_food_spots.sql",
    "102b_seed_foods.sql",
    "102c_seed_culture_facts.sql",
    "101_seed_practical_and_neighborhoods.sql",
    "201_data_normalization_and_links.sql",
    "301_french_content_updates.sql",
]


def repair_mojibake_if_needed(text: str) -> str:
    markers = ("Ã", "â€™", "â€œ", "â€", "ðŸ", "Ã°", "Ã¢", "Ãƒ")
    if not any(marker in text for marker in markers):
        return text
    repaired = text.encode("latin1", errors="ignore").decode("utf-8", errors="ignore")
    if sum(repaired.count(marker) for marker in markers) < sum(text.count(marker) for marker in markers):
        return repaired
    return text


def build_master_sql() -> str:
    parts: list[str] = [
        "-- ============================================================",
        "-- WAYRA - MASTER LOAD",
        "-- Consolidated bootstrap / sync file for Supabase",
        "-- Generated from category files in execution order",
        "-- ============================================================",
        "",
    ]

    for file_name in ORDERED_FILES:
        file_path = CONSOLIDATED_DIR / file_name
        if not file_path.exists():
            raise FileNotFoundError(f"Missing consolidated file: {file_path}")

        parts.extend(
            [
                "-- ====================================================================",
                f"-- SOURCE: supabase/consolidated/{file_name}",
                "-- ====================================================================",
                "",
                repair_mojibake_if_needed(file_path.read_text(encoding="utf-8")),
                "",
                "",
            ]
        )

    return repair_mojibake_if_needed("\n".join(parts))


def main() -> None:
    OUTPUT_PATH.write_text(build_master_sql(), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
