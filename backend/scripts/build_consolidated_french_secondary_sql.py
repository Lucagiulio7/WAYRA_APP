"""Build one consolidated SQL file for French secondary attraction translations."""

from __future__ import annotations

from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
MIGRATIONS_DIR = ROOT_DIR / "supabase" / "migrations"
OUTPUT = MIGRATIONS_DIR / "099_populate_french_secondary_attractions_all.sql"


def main() -> None:
    parts = [
        "-- Consolidated French translations for category_level 2/3 attractions.",
        "-- Generated from 024+ secondary French migration fragments.",
        "",
    ]
    source_paths = [
        path
        for path in sorted(MIGRATIONS_DIR.glob("*_populate_french_secondary_attractions_*.sql"))
        if path.name != OUTPUT.name
    ]
    if not source_paths:
        raise SystemExit(f"No source fragments found; leaving {OUTPUT} unchanged.")

    for path in source_paths:
        parts.append(f"-- Source: {path.name}")
        parts.append(path.read_text(encoding="utf-8").strip())
        parts.append("")
    OUTPUT.write_text("\n".join(parts).strip() + "\n", encoding="utf-8")
    print(OUTPUT)


if __name__ == "__main__":
    main()
