"""Build the versioned static snapshot for practical info and neighborhoods."""

from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SQL_DIR = ROOT / "supabase" / "sql_editor_ready"
OUTPUT = ROOT / "backend" / "database" / "static_city_content.json"

BASE_FILES = [
    *(f"101a{i}_seed_neighborhoods.sql" for i in range(1, 5)),
    *(f"101b{i}_seed_city_info.sql" for i in range(1, 4)),
]
UPDATE_FILES = [
    "301_01_014_populate_french_practical_neighborhoods.sql",
    "302_01_neighborhoods_fr_bruges.sql",
    "302_02_neighborhoods_city_info_fr_15cities.sql",
    "302_05_city_info_fr_bruges.sql",
    "302_06_city_info_fr_budapest_istanbul.sql",
    "302_06b_city_info_istanbul_insert.sql",
    *(f"303_0{i}_city_info_new_cities_part{i}.sql" for i in range(1, 5)),
]
ATTRACTION_TRANSLATION_FILES = [
    *(f"301_{i:02d}_098_populate_french_iconic_attractions_all_part{i - 2}.sql" for i in range(3, 17)),
    *(f"301_{i:02d}_099_populate_french_secondary_attractions_all_part{i - 16}.sql" for i in range(17, 23)),
    *(path.name for path in sorted(SQL_DIR.glob("304_*.sql"))),
]
CONTENT_BASE_FILES = [
    *(f"102a_{i:02d}_seed_attractions_and_food_spots.sql" for i in range(1, 12)),
    *(f"102b_{i:02d}_seed_foods.sql" for i in range(1, 12)),
]
FOOD_TRANSLATION_FILES = [*(f"302_04_foods_fr_part{i}.sql" for i in range(1, 5))]
CULTURE_TRANSLATION_FILES = [
    "301_02_015_populate_french_culture_core.sql",
    "302_03_culture_facts_fr_part1.sql",
    "302_03_culture_facts_fr_part2.sql",
]
SOURCE_FILES = BASE_FILES + UPDATE_FILES + CONTENT_BASE_FILES + ATTRACTION_TRANSLATION_FILES + FOOD_TRANSLATION_FILES + CULTURE_TRANSLATION_FILES


def without_comments(sql: str) -> str:
    return "\n".join(
        line for line in sql.splitlines() if not line.lstrip().startswith("--")
    )


def split_top_level(value: str, delimiter: str = ",") -> list[str]:
    parts: list[str] = []
    start = 0
    index = 0
    parens = 0
    brackets = 0
    quote = False
    dollar_tag: str | None = None

    while index < len(value):
        if dollar_tag:
            if value.startswith(dollar_tag, index):
                index += len(dollar_tag)
                dollar_tag = None
            else:
                index += 1
            continue

        char = value[index]
        if quote:
            if char == "'" and index + 1 < len(value) and value[index + 1] == "'":
                index += 2
                continue
            if char == "'" and index > 0 and value[index - 1] == "\\":
                index += 1
                continue
            if char == "'":
                previous = value[index - 1] if index > 0 else ""
                following = value[index + 1] if index + 1 < len(value) else ""
                if not (previous.isalpha() and following.isalpha()):
                    quote = False
            index += 1
            continue

        if char == "'":
            quote = True
            index += 1
            continue
        if char == "$":
            match = re.match(r"\$[A-Za-z0-9_]*\$", value[index:])
            if match:
                dollar_tag = match.group(0)
                index += len(dollar_tag)
                continue
        if char == "(":
            parens += 1
        elif char == ")":
            parens -= 1
        elif char == "[":
            brackets += 1
        elif char == "]":
            brackets -= 1
        elif char == delimiter and parens == 0 and brackets == 0:
            parts.append(value[start:index].strip())
            start = index + 1
        index += 1

    tail = value[start:].strip()
    if tail:
        parts.append(tail)
    return parts


def statements(sql: str) -> list[str]:
    return split_top_level(without_comments(sql), ";")


def maybe_json(value: str) -> Any:
    stripped = value.strip()
    if stripped.startswith(("[", "{")):
        try:
            return json.loads(stripped)
        except json.JSONDecodeError:
            pass
    return value


def parse_value(expression: str) -> Any:
    value = expression.strip()
    value = re.sub(r"::(?:jsonb|json|text\[\])\s*$", "", value, flags=re.I).strip()
    if not value or value.upper() == "NULL":
        return None
    if value.upper() == "TRUE":
        return True
    if value.upper() == "FALSE":
        return False
    if value.upper().startswith("ARRAY[") and value.endswith("]"):
        inner = value[value.find("[") + 1:-1]
        return [parse_value(item) for item in split_top_level(inner)]
    dollar = re.fullmatch(r"(\$[A-Za-z0-9_]*\$)(.*)\1", value, flags=re.S)
    if dollar:
        return maybe_json(dollar.group(2))
    if value.startswith("'") and value.endswith("'"):
        return maybe_json(value[1:-1].replace("''", "'"))
    if re.fullmatch(r"-?\d+", value):
        return int(value)
    if re.fullmatch(r"-?(?:\d+\.\d*|\d*\.\d+)", value):
        return float(value)
    return value


def parse_rows(values: str) -> list[list[Any]]:
    clean_values = re.split(r"\bON\s+CONFLICT\b", values, maxsplit=1, flags=re.I)[0]
    rows: list[list[Any]] = []
    for row in split_top_level(clean_values):
        stripped = row.strip().rstrip(",").strip()
        if not stripped.startswith("(") or not stripped.endswith(")"):
            continue
        rows.append([parse_value(item) for item in split_top_level(stripped[1:-1])])
    return rows


def where_value(where: str, column: str) -> Any:
    match = re.search(
        rf"\b{re.escape(column)}\s*=\s*((?:\$[A-Za-z0-9_]*\$).*?(?:\$[A-Za-z0-9_]*\$)|'(?:''|[^'])*'|-?\d+)",
        where,
        flags=re.I | re.S,
    )
    return parse_value(match.group(1)) if match else None


def process_translation_update(statement: str, translations: dict[str, dict]) -> bool:
    match = re.match(
        r"UPDATE\s+(?:public\.)?(attractions|foods|culture_facts)\s+SET\s+(.*?)\s+WHERE\s+(.*)$",
        statement.strip(),
        flags=re.I | re.S,
    )
    if not match:
        return False
    table = match.group(1).lower()
    assignments: dict[str, Any] = {}
    for assignment in split_top_level(match.group(2)):
        if "=" not in assignment:
            continue
        column, expression = assignment.split("=", 1)
        column = column.strip()
        if column.endswith("_fr"):
            assignments[column] = parse_value(expression)
    if not assignments:
        return True
    city = str(where_value(match.group(3), "city") or "").strip("'").lower()
    if table == "culture_facts":
        sort_order = where_value(match.group(3), "sort_order")
        title = where_value(match.group(3), "title")
        identity = f"sort:{sort_order}" if sort_order is not None else f"title:{title or ''}"
    else:
        name = where_value(match.group(3), "name")
        name_en = where_value(match.group(3), "name_en")
        identity = str(name or f"en:{name_en or ''}")
    if city and identity and not identity.endswith(":"):
        translations.setdefault(table, {}).setdefault(city, {}).setdefault(identity, {}).update(assignments)
    return True

def process_insert(statement: str, city_info: dict[str, dict], neighborhoods: dict[tuple[str, str], dict]) -> bool:
    match = re.match(
        r"INSERT\s+INTO\s+(?:public\.)?(city_info|neighborhoods)\s*\((.*?)\)\s*VALUES\s*(.*)$",
        statement.strip(),
        flags=re.I | re.S,
    )
    if not match:
        return False
    table = match.group(1).lower()
    columns = [column.strip() for column in split_top_level(match.group(2))]
    for values in parse_rows(match.group(3)):
        if len(values) != len(columns):
            raise ValueError(f"{table}: expected {len(columns)} values, found {len(values)}")
        record = dict(zip(columns, values))
        city = str(record.get("city") or "").lower()
        if table == "city_info":
            city_info[city] = {**city_info.get(city, {}), **record}
        else:
            name = str(record.get("name") or "")
            neighborhoods[(city, name)] = {**neighborhoods.get((city, name), {}), **record}
    return True


def process_update(statement: str, city_info: dict[str, dict], neighborhoods: dict[tuple[str, str], dict]) -> bool:
    match = re.match(
        r"UPDATE\s+(?:public\.)?(city_info|neighborhoods)\s+SET\s+(.*?)\s+WHERE\s+(.*)$",
        statement.strip(),
        flags=re.I | re.S,
    )
    if not match:
        return False
    table = match.group(1).lower()
    assignments: dict[str, Any] = {}
    for assignment in split_top_level(match.group(2)):
        if "=" not in assignment:
            continue
        column, expression = assignment.split("=", 1)
        assignments[column.strip()] = parse_value(expression)
    city = str(where_value(match.group(3), "city") or "").lower()
    if table == "city_info":
        city_info.setdefault(city, {"city": city}).update(assignments)
    else:
        name = str(where_value(match.group(3), "name") or "")
        key = (city, name)
        if key in neighborhoods:
            neighborhoods[key].update(assignments)
    return True


def collect_content_aliases() -> dict[str, dict[str, dict[str, str]]]:
    aliases: dict[str, dict[str, dict[str, str]]] = {"attractions": {}, "foods": {}}
    for file_name in CONTENT_BASE_FILES:
        path = SQL_DIR / file_name
        for statement in statements(path.read_text(encoding="utf-8")):
            match = re.match(
                r"INSERT\s+INTO\s+(?:public\.)?(attractions|foods)\s*\((.*?)\)\s*VALUES\s*(.*)$",
                statement.strip(),
                flags=re.I | re.S,
            )
            if not match:
                continue
            table = match.group(1).lower()
            columns = [column.strip() for column in split_top_level(match.group(2))]
            for values in parse_rows(match.group(3)):
                if len(values) != len(columns):
                    continue
                record = dict(zip(columns, values))
                city = str(record.get("city") or "").lower()
                name = str(record.get("name") or "")
                name_en = str(record.get("name_en") or "")
                if city and name and name_en:
                    aliases[table].setdefault(city, {})[name] = name_en
    return aliases


def add_english_aliases(translations: dict[str, dict], aliases: dict[str, dict[str, dict[str, str]]]) -> None:
    for table in ("attractions", "foods"):
        table_translations = translations.get(table, {})
        for city, names in aliases[table].items():
            city_translations = table_translations.get(city, {})
            for name, name_en in names.items():
                translation = city_translations.get(name)
                if translation:
                    city_translations.setdefault(f"en:{name_en}", translation)


def build_snapshot() -> dict[str, Any]:
    city_info: dict[str, dict] = {}
    neighborhoods: dict[tuple[str, str], dict] = {}
    translations: dict[str, dict] = {}
    for file_name in SOURCE_FILES:
        path = SQL_DIR / file_name
        if not path.exists():
            raise FileNotFoundError(path)
        for statement in statements(path.read_text(encoding="utf-8")):
            if process_translation_update(statement, translations):
                continue
            if process_insert(statement, city_info, neighborhoods):
                continue
            process_update(statement, city_info, neighborhoods)

    translations.setdefault("attractions", {}).setdefault("barcellona", {})[
        "Pont del Bisbe"
    ] = {
        "name_fr": "Pont de l'?v?que",
        "description_fr": (
            "Pont n?ogothique du XXe si?cle reliant deux b?timents historiques, "
            "devenu l'un des points de vue les plus photographi?s du quartier."
        ),
    }
    add_english_aliases(translations, collect_content_aliases())

    by_city: dict[str, list[dict]] = defaultdict(list)
    for record in neighborhoods.values():
        by_city[str(record["city"]).lower()].append(record)
    for city, records in by_city.items():
        records.sort(key=lambda item: (item.get("sort_order", 0), item.get("name", "")))
        for index, record in enumerate(records, start=1):
            record["id"] = index
            record.pop("booking_url", None)
            record.setdefault("geojson", None)

    for city, record in city_info.items():
        record.setdefault("max_days_iconico", 5)
        record.setdefault("max_days_esploratore", 7)

    return {
        "version": 1,
        "sources": SOURCE_FILES,
        "city_info": dict(sorted(city_info.items())),
        "neighborhoods": {city: by_city[city] for city in sorted(by_city)},
        "attraction_translations": translations.get("attractions", {}),
        "food_translations": translations.get("foods", {}),
        "culture_translations": translations.get("culture_facts", {}),
    }


def main() -> None:
    snapshot = build_snapshot()
    OUTPUT.write_text(
        json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    city_info = snapshot["city_info"]
    neighborhoods = snapshot["neighborhoods"]
    total_neighborhoods = sum(len(items) for items in neighborhoods.values())
    info_fr = sum(bool(item.get("english_note_fr")) for item in city_info.values())
    neighborhoods_fr = sum(
        bool(item.get("description_fr"))
        for items in neighborhoods.values()
        for item in items
    )
    attraction_fr = sum(len(items) for items in snapshot["attraction_translations"].values())
    food_fr = sum(len(items) for items in snapshot["food_translations"].values())
    culture_fr = sum(len(items) for items in snapshot["culture_translations"].values())
    print(
        f"city_info={len(city_info)} (fr={info_fr}), "
        f"neighborhoods={total_neighborhoods} (fr={neighborhoods_fr}), "
        f"cities_with_neighborhoods={len(neighborhoods)}, "
        f"attraction_fr={attraction_fr}, food_fr={food_fr}, culture_fr={culture_fr}"
    )
    print(OUTPUT)


if __name__ == "__main__":
    main()
