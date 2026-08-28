"""Validate city modules and localization coverage before publishing content."""

from __future__ import annotations

import argparse
import math
import sys
from collections import Counter
from pathlib import Path
from typing import Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from database.cities import ALL_CITIES  # noqa: E402
from services.localization import TRANSLATABLE_FIELDS  # noqa: E402
from services.static_content import (  # noqa: E402
    CONTENT_LANGUAGES,
    STATIC_CITY_INFO,
    STATIC_NEIGHBORHOODS,
    localize_attractions,
    localize_city_info,
    localize_culture,
    localize_foods,
    localize_neighborhoods,
)

COLLECTIONS = {
    "attractions": ("ATTRACTIONS", localize_attractions, ("name", "description")),
    # Restaurant names are proper nouns; only their descriptive copy requires localization.
    "food_spots": ("FOOD_SPOTS", localize_attractions, ("description",)),
    "foods": ("FOODS_BY_CITY", localize_foods, ("name", "description", "ingredients")),
    "culture": ("CULTURE_FACTS", localize_culture, ("title", "body")),
}

CITY_INFO_FIELDS = (
    "currency",
    "language",
    "english_note",
    "timezone",
    "voltage",
    "water",
    "tipping",
    "quick_tips",
)


def has_value(value: Any) -> bool:
    return value not in (None, "", [])


def validate_coordinates(item: dict[str, Any]) -> bool:
    if "latitude" not in item and "longitude" not in item:
        return True
    try:
        latitude = float(item["latitude"])
        longitude = float(item["longitude"])
    except (KeyError, TypeError, ValueError):
        return False
    return math.isfinite(latitude) and math.isfinite(longitude) and -90 <= latitude <= 90 and -180 <= longitude <= 180


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--language", action="append", dest="languages", help="Language code to audit; repeat as needed")
    parser.add_argument("--city", action="append", dest="cities", help="City id to audit; repeat as needed")
    parser.add_argument("--strict-translations", action="store_true", help="Treat missing translations as errors")
    args = parser.parse_args()

    languages = tuple(args.languages or (language for language in CONTENT_LANGUAGES if language != "it"))
    errors: list[str] = []
    content_warnings: list[str] = []
    translation_gaps: list[str] = []
    requested_cities = {city.lower() for city in (args.cities or [])}
    cities = [city for city in ALL_CITIES if not requested_cities or city.CITY_ID.lower() in requested_cities]

    for city in cities:
        city_id = city.CITY_ID.lower()
        for section, (attribute, localizer, required_fields) in COLLECTIONS.items():
            raw_items = getattr(city, attribute)
            localized_items = localizer(city_id, raw_items)
            identities = [str(item.get("name") or item.get("title") or "").strip().casefold() for item in raw_items]
            duplicates = [name for name, count in Counter(identities).items() if name and count > 1]
            if duplicates:
                content_warnings.append(f"{city_id}/{section}: duplicate identities: {', '.join(duplicates[:3])}")

            for index, (raw, localized) in enumerate(zip(raw_items, localized_items)):
                identity = raw.get("name") or raw.get("title") or f"#{index}"
                declared_city = raw.get("city")
                if declared_city and str(declared_city).lower() != city_id:
                    errors.append(f"{city_id}/{section}/{identity}: city is {declared_city!r}")
                if not validate_coordinates(raw):
                    errors.append(f"{city_id}/{section}/{identity}: invalid coordinates")
                for field in required_fields:
                    if field not in TRANSLATABLE_FIELDS:
                        errors.append(f"validator configuration: unsupported field {field}")
                        continue
                    if not has_value(raw.get(field)):
                        errors.append(f"{city_id}/{section}/{identity}: missing Italian {field}")
                    for language in languages:
                        value = localized.get("translations", {}).get(language, {}).get(field)
                        if not has_value(value):
                            translation_gaps.append(f"{city_id}/{section}/{identity}: missing {language}.{field}")

        raw_info = STATIC_CITY_INFO.get(city_id)
        localized_info = localize_city_info(city_id, raw_info)
        if raw_info and localized_info:
            for field in CITY_INFO_FIELDS:
                if not has_value(raw_info.get(field)):
                    errors.append(f"{city_id}/city_info: missing Italian {field}")
                for language in languages:
                    value = localized_info.get("translations", {}).get(language, {}).get(field)
                    if not has_value(value):
                        translation_gaps.append(f"{city_id}/city_info: missing {language}.{field}")

            for field, required_field in (
                ("emergency_numbers", "label"),
                ("transport_apps", "description"),
                ("useful_apps", "description"),
            ):
                raw_records = raw_info.get(field, [])
                localized_records = localized_info.get(field, [])
                for index, (raw_record, localized_record) in enumerate(zip(raw_records, localized_records)):
                    identity = raw_record.get("name") or raw_record.get("label") or f"#{index}"
                    for language in languages:
                        value = localized_record.get("translations", {}).get(language, {}).get(required_field)
                        if not has_value(value):
                            translation_gaps.append(
                                f"{city_id}/city_info/{field}/{identity}: "
                                f"missing {language}.{required_field}"
                            )

        raw_neighborhoods = STATIC_NEIGHBORHOODS.get(city_id, [])
        localized_neighborhoods = localize_neighborhoods(city_id, raw_neighborhoods)
        for index, (raw, localized) in enumerate(zip(raw_neighborhoods, localized_neighborhoods)):
            identity = raw.get("name") or f"#{index}"
            for field in ("name", "description"):
                if not has_value(raw.get(field)):
                    errors.append(f"{city_id}/neighborhoods/{identity}: missing Italian {field}")
                for language in languages:
                    value = localized.get("translations", {}).get(language, {}).get(field)
                    if not has_value(value):
                        translation_gaps.append(
                            f"{city_id}/neighborhoods/{identity}: missing {language}.{field}"
                        )

    print(f"Validated {len(cities)} cities; languages: {', '.join(languages) or 'none'}")
    print(
        f"Structural errors: {len(errors)}; content warnings: {len(content_warnings)}; "
        f"translation gaps: {len(translation_gaps)}"
    )
    for message in errors:
        print(f"ERROR {message}")
    for message in content_warnings:
        print(f"WARN  {message}")
    for message in translation_gaps[:100]:
        print(f"GAP   {message}")
    if len(translation_gaps) > 100:
        print(f"GAP   ... {len(translation_gaps) - 100} more translation gaps")

    return 1 if errors or (args.strict_translations and translation_gaps) else 0


if __name__ == "__main__":
    raise SystemExit(main())
