"""
Rebuild the human-curated Supabase SQL bundles from their canonical sources.

This fixes mojibake/corrupted text by always reading UTF-8 sources directly and
writing clean UTF-8 outputs for both:
  - supabase/consolidated/
  - supabase/sql_editor_ready/
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import TypeVar


ROOT_DIR = Path(__file__).resolve().parents[2]
SUPABASE_DIR = ROOT_DIR / "supabase"
CONSOLIDATED_DIR = SUPABASE_DIR / "consolidated"
SQL_EDITOR_DIR = SUPABASE_DIR / "sql_editor_ready"
SEED_PATH = SUPABASE_DIR / "seed.sql"


SECTION_HEADERS = {
    "neighborhoods": "-- NEIGHBORHOODS",
    "food_places": "-- FOOD PLACES",
    "city_info": "-- CITY INFO",
}

T = TypeVar("T")


def repair_mojibake_if_needed(text: str) -> str:
    markers = ("Ã", "â€™", "â€œ", "â€", "ðŸ", "Ã°", "Ã¢", "Ãƒ")
    if not any(marker in text for marker in markers):
        return text
    repaired = text.encode("latin1", errors="ignore").decode("utf-8", errors="ignore")
    if sum(repaired.count(marker) for marker in markers) < sum(text.count(marker) for marker in markers):
        return repaired
    return text


def extract_seed_section(text: str, start_header: str, end_header: str | None) -> str:
    start = text.index(start_header)
    end = text.index(end_header, start) if end_header else len(text)
    return text[start:end].strip()


def build_101_seed_practical_and_neighborhoods() -> str:
    seed_text = SEED_PATH.read_text(encoding="utf-8")
    neighborhoods = extract_seed_section(
        seed_text,
        SECTION_HEADERS["neighborhoods"],
        SECTION_HEADERS["food_places"],
    )
    city_info = extract_seed_section(
        seed_text,
        SECTION_HEADERS["city_info"],
        None,
    )
    parts = [
        "-- ====================================================================",
        "-- SOURCE: supabase/seed.sql",
        "-- ====================================================================",
        "",
        neighborhoods,
        "",
        city_info,
        "",
    ]
    return "\n".join(parts)


def build_301_french_content_updates() -> str:
    migrations = [
        SUPABASE_DIR / "migrations" / "014_populate_french_practical_neighborhoods.sql",
        SUPABASE_DIR / "migrations" / "015_populate_french_culture_core.sql",
        SUPABASE_DIR / "migrations" / "098_populate_french_iconic_attractions_all.sql",
        SUPABASE_DIR / "migrations" / "099_populate_french_secondary_attractions_all.sql",
    ]
    parts: list[str] = []
    for path in migrations:
        if not path.exists():
            raise FileNotFoundError(f"Missing migration source: {path}")
        parts.extend(
            [
                "-- ====================================================================",
                f"-- SOURCE: supabase\\migrations\\{path.name}",
                "-- ====================================================================",
                "",
                path.read_text(encoding="utf-8").strip(),
                "",
                "",
            ]
        )
    return "\n".join(parts).strip() + "\n"


def write_bundle(file_name: str, content: str) -> None:
    for target_dir in (CONSOLIDATED_DIR, SQL_EDITOR_DIR):
        target_dir.mkdir(parents=True, exist_ok=True)
        (target_dir / file_name).write_text(repair_mojibake_if_needed(content), encoding="utf-8")


def repair_existing_bundle(file_name: str) -> None:
    for target_dir in (CONSOLIDATED_DIR, SQL_EDITOR_DIR):
        target = target_dir / file_name
        if not target.exists():
            continue
        clean = repair_mojibake_if_needed(target.read_text(encoding="utf-8"))
        target.write_text(clean, encoding="utf-8")


def split_sql_tuples(values_blob: str) -> list[str]:
    rows: list[str] = []
    in_string = False
    depth = 0
    row_start: int | None = None
    i = 0
    while i < len(values_blob):
        char = values_blob[i]
        next_char = values_blob[i + 1] if i + 1 < len(values_blob) else ""
        if char == "'":
            if in_string and next_char == "'":
                i += 2
                continue
            in_string = not in_string
        elif not in_string:
            if char == "(":
                if depth == 0:
                    row_start = i
                depth += 1
            elif char == ")":
                depth -= 1
                if depth == 0 and row_start is not None:
                    rows.append(values_blob[row_start : i + 1].strip())
                    row_start = None
        i += 1
    return rows


def group_rows_by_city(rows: list[str]) -> list[tuple[str, list[str]]]:
    grouped: list[tuple[str, list[str]]] = []
    order: list[str] = []
    bucket: dict[str, list[str]] = {}
    for row in rows:
        match = re.match(r"\(\s*'([^']+)'", row)
        if not match:
            continue
        city = match.group(1)
        if city not in bucket:
            order.append(city)
            bucket[city] = []
        bucket[city].append(row)
    for city in order:
        grouped.append((city, bucket[city]))
    return grouped


def chunk_groups(items: list[T], chunk_size: int) -> list[list[T]]:
    return [items[index : index + chunk_size] for index in range(0, len(items), chunk_size)]


def build_101_split_chunks() -> list[tuple[str, str]]:
    seed_text = repair_mojibake_if_needed(SEED_PATH.read_text(encoding="utf-8"))
    city_info_section = extract_seed_section(seed_text, SECTION_HEADERS["city_info"], None)

    insert_marker = "INSERT INTO neighborhoods (city, name, name_en, description, description_en, vibe_tags, booking_url, sort_order) VALUES"
    insert_start = seed_text.index(insert_marker)
    insert_end = seed_text.index(";\n", insert_start) + 1
    neighborhoods_insert = seed_text[insert_start:insert_end].strip()
    values_blob = neighborhoods_insert[len(insert_marker) :].strip()
    if values_blob.endswith(";"):
        values_blob = values_blob[:-1]

    neighborhood_rows = split_sql_tuples(values_blob)
    neighborhood_groups = group_rows_by_city(neighborhood_rows)

    outputs: list[tuple[str, str]] = []
    for index, city_chunk in enumerate(chunk_groups(neighborhood_groups, 6), start=1):
        cities = [city for city, _rows in city_chunk]
        rows = [row for _city, grouped_rows in city_chunk for row in grouped_rows]
        content = "\n".join(
            [
                "-- ====================================================================",
                f"-- SOURCE: supabase/seed.sql - neighborhoods chunk {index}",
                "-- ====================================================================",
                "",
                "-- NEIGHBORHOODS",
                f"DELETE FROM neighborhoods WHERE city IN ({', '.join(repr(city) for city in cities)});",
                "",
                insert_marker,
                ",\n".join(rows) + ";",
                "",
            ]
        )
        outputs.append((f"101a{index}_seed_neighborhoods.sql", content))

    city_info_statements = [
        match.group(0).strip()
        for match in re.finditer(
            r"INSERT INTO city_info\b.*?\n\);",
            city_info_section,
            flags=re.DOTALL,
        )
    ]
    city_info_groups: list[tuple[str, str]] = []
    for statement in city_info_statements:
        match = re.search(r"\(\s*\n?\s*'([^']+)'", statement)
        if not match:
            continue
        city_info_groups.append((match.group(1), statement))

    for index, city_chunk in enumerate(chunk_groups(city_info_groups, 8), start=1):
        cities = [city for city, _statement in city_chunk]
        statements = [statement for _city, statement in city_chunk]
        content = "\n".join(
            [
                "-- ====================================================================",
                f"-- SOURCE: supabase/seed.sql - city_info chunk {index}",
                "-- ====================================================================",
                "",
                "-- CITY INFO",
                f"DELETE FROM city_info WHERE city IN ({', '.join(repr(city) for city in cities)});",
                "",
                "\n\n".join(statements),
                "",
            ]
        )
        outputs.append((f"101b{index}_seed_city_info.sql", content))
    return outputs


def split_city_blocks(text: str, marker_regex: str) -> list[str]:
    matches = list(re.finditer(marker_regex, text, flags=re.MULTILINE))
    if not matches:
        return [text.strip() + "\n"]
    blocks: list[str] = []
    for index, match in enumerate(matches):
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        blocks.append(text[start:end].strip() + "\n")
    return blocks


def build_301_split_chunks() -> list[tuple[str, str]]:
    migration_files = [
        "014_populate_french_practical_neighborhoods.sql",
        "015_populate_french_culture_core.sql",
        "098_populate_french_iconic_attractions_all.sql",
        "099_populate_french_secondary_attractions_all.sql",
    ]
    outputs: list[tuple[str, str]] = []
    seq = 1
    for migration_name in migration_files:
        path = SUPABASE_DIR / "migrations" / migration_name
        if not path.exists():
            continue
        raw_text = repair_mojibake_if_needed(path.read_text(encoding="utf-8")).strip()
        if migration_name in {
            "098_populate_french_iconic_attractions_all.sql",
            "099_populate_french_secondary_attractions_all.sql",
        }:
            blocks = split_city_blocks(raw_text, r"^-- [A-ZÀ-ÿa-z0-9_ -]+$")
            for block_index, block in enumerate(chunk_groups(blocks, 8), start=1):
                content = "\n".join(
                    [
                        "-- ====================================================================",
                        f"-- SOURCE: supabase/migrations/{migration_name} - part {block_index}",
                        "-- ====================================================================",
                        "",
                        "\n".join(block).strip(),
                        "",
                    ]
                )
                outputs.append((f"301_{seq:02d}_{migration_name.replace('.sql', '')}_part{block_index}.sql", content))
                seq += 1
            continue
        content = "\n".join(
            [
                "-- ====================================================================",
                f"-- SOURCE: supabase/migrations/{migration_name}",
                "-- ====================================================================",
                "",
                raw_text,
                "",
            ]
        )
        outputs.append((f"301_{seq:02d}_{migration_name}", content))
        seq += 1
    return outputs


def write_sql_editor_chunks(chunks: list[tuple[str, str]]) -> None:
    for file_name, content in chunks:
        (SQL_EDITOR_DIR / file_name).write_text(repair_mojibake_if_needed(content), encoding="utf-8")


def clear_generated_sql_editor_chunks() -> None:
    for pattern in ("101a*_seed_neighborhoods.sql", "101b*_seed_city_info.sql", "301_*.sql"):
        for path in SQL_EDITOR_DIR.glob(pattern):
            path.unlink()


def write_sql_editor_readme() -> None:
    readme = """## Supabase SQL Editor - usa solo questa cartella

Questa cartella contiene i file gia pronti per il SQL Editor di Supabase, divisi in blocchi piccoli.

### Ordine esatto da eseguire

1. `001_schema_core.sql`
2. `102a_01_seed_attractions_and_food_spots.sql`
3. `102a_02_seed_attractions_and_food_spots.sql`
4. `102a_03_seed_attractions_and_food_spots.sql`
5. `102a_04_seed_attractions_and_food_spots.sql`
6. `102a_05_seed_attractions_and_food_spots.sql`
7. `102a_06_seed_attractions_and_food_spots.sql`
8. `102b_seed_foods.sql`
9. `102c_seed_culture_facts.sql`
10. `101a1_seed_neighborhoods.sql`
11. `101a2_seed_neighborhoods.sql`
12. `101a3_seed_neighborhoods.sql`
13. `101a4_seed_neighborhoods.sql`
14. `101b1_seed_city_info.sql`
15. `101b2_seed_city_info.sql`
16. `101b3_seed_city_info.sql`
17. `201_data_normalization_and_links.sql`
18. Tutti i file `301_*.sql`, in ordine alfabetico

### Nota pratica

I file monolitici `101_seed_practical_and_neighborhoods.sql` e `301_french_content_updates.sql` restano come riferimento, ma per Supabase web usa i file spezzati qui sopra.
"""
    (SQL_EDITOR_DIR / "README_START_HERE.md").write_text(readme + "\n", encoding="utf-8")


def main() -> None:
    repair_existing_bundle("001_schema_core.sql")
    write_bundle(
        "101_seed_practical_and_neighborhoods.sql",
        build_101_seed_practical_and_neighborhoods(),
    )
    write_bundle(
        "301_french_content_updates.sql",
        build_301_french_content_updates(),
    )
    clear_generated_sql_editor_chunks()
    write_sql_editor_chunks(build_101_split_chunks())
    write_sql_editor_chunks(build_301_split_chunks())
    write_sql_editor_readme()
    print("Rebuilt SQL bundles and SQL Editor split chunks")


if __name__ == "__main__":
    main()
