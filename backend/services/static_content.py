"""Versioned city content and language-neutral localization overlays."""

from __future__ import annotations

import json
import re
import unicodedata
from copy import deepcopy
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

from services.localization import with_translations
from services.practical_localization import practical_fallbacks

DATABASE_DIR = Path(__file__).resolve().parents[1] / "database"
STATIC_CONTENT_PATH = DATABASE_DIR / "static_city_content.json"
REMOTE_CITY_CONTENT_PATH = DATABASE_DIR / "remote_city_content_snapshot.json"
LOCAL_NEIGHBORHOOD_SUPPLEMENT_PATH = DATABASE_DIR / "local_neighborhood_supplement.json"
TRANSLATIONS_DIR = DATABASE_DIR / "translations"


def _load_json(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        return payload if isinstance(payload, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


STATIC_CONTENT = _load_json(STATIC_CONTENT_PATH)
REMOTE_CITY_CONTENT = _load_json(REMOTE_CITY_CONTENT_PATH)
LOCAL_NEIGHBORHOOD_SUPPLEMENT = _load_json(LOCAL_NEIGHBORHOOD_SUPPLEMENT_PATH)
STATIC_CITY_INFO = {
    **STATIC_CONTENT.get("city_info", {}),
    **REMOTE_CITY_CONTENT.get("city_info", {}),
}
STATIC_NEIGHBORHOODS = {
    **STATIC_CONTENT.get("neighborhoods", {}),
    **REMOTE_CITY_CONTENT.get("neighborhoods", {}),
    **LOCAL_NEIGHBORHOOD_SUPPLEMENT.get("neighborhoods", {}),
}


def _deep_merge(base: dict[str, Any], overlay: dict[str, Any]) -> dict[str, Any]:
    result = deepcopy(base)
    for key, value in overlay.items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = deepcopy(value)
    return result

def _load_language_overlays() -> dict[str, dict[str, Any]]:
    overlays: dict[str, dict[str, Any]] = {
        "fr": {
            "attractions": STATIC_CONTENT.get("attraction_translations", {}),
            "foods": STATIC_CONTENT.get("food_translations", {}),
            "culture_facts": STATIC_CONTENT.get("culture_translations", {}),
        }
    }
    if TRANSLATIONS_DIR.exists():
        for path in sorted(TRANSLATIONS_DIR.glob("*.json")):
            language = path.stem.lower()
            overlays[language] = _deep_merge(overlays.get(language, {}), _load_json(path))
    return overlays


LANGUAGE_OVERLAYS = _load_language_overlays()
CONTENT_LANGUAGES = tuple(sorted({"it", "en", *LANGUAGE_OVERLAYS}))


def _canonical_translation(record: dict[str, Any], language: str) -> dict[str, Any]:
    suffix = f"_{language}"
    canonical: dict[str, Any] = {}
    for key, value in record.items():
        if value is None:
            continue
        canonical[key.removesuffix(suffix) if key.endswith(suffix) else key] = value
    return canonical


def _apply_translation(item: dict[str, Any], language: str, record: dict[str, Any] | None) -> dict[str, Any]:
    if not record:
        return item
    result = deepcopy(item)
    canonical = _canonical_translation(record, language)
    translations = deepcopy(result.get("translations", {}))
    translations.setdefault(language, {}).update(canonical)
    result["translations"] = translations
    for field, value in canonical.items():
        result[f"{field}_{language}"] = value
    return result


def _identity_translation(
    language: str,
    section: str,
    city: str,
    item: dict[str, Any],
) -> dict[str, Any] | None:
    city_translations = (
        LANGUAGE_OVERLAYS.get(language, {}).get(section, {}).get(city.lower(), {})
    )
    translation = city_translations.get(str(item.get("name") or ""))
    if not translation and item.get("name_en"):
        translation = city_translations.get(f"en:{item['name_en']}")
    return translation


def localize_attraction(city: str, item: dict[str, Any]) -> dict[str, Any]:
    result = item
    for language in LANGUAGE_OVERLAYS:
        result = _apply_translation(
            result,
            language,
            _identity_translation(language, "attractions", city, result),
        )
    return with_translations(result)


def localize_attractions(city: str, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [localize_attraction(city, item) for item in items]


def _normalized_food_name(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    value = "".join(character for character in value if not unicodedata.combining(character))
    words = re.sub(r"[^a-z0-9]+", " ", value.replace("?", "")).split()
    return " ".join(word for word in words if word not in {"di", "de"})


def _closest_translation(name: str, translations: dict[str, dict]) -> dict[str, Any] | None:
    normalized = _normalized_food_name(name)
    if not normalized:
        return None
    candidates = [
        (SequenceMatcher(None, normalized, _normalized_food_name(key)).ratio(), value)
        for key, value in translations.items()
        if not key.startswith("en:")
    ]
    if not candidates:
        return None
    score, translation = max(candidates, key=lambda item: item[0])
    return translation if score >= 0.72 else None


def localize_foods(city: str, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    localized: list[dict[str, Any]] = []
    for item in items:
        result = item
        for language, overlay in LANGUAGE_OVERLAYS.items():
            city_translations = overlay.get("foods", {}).get(city.lower(), {})
            translation = city_translations.get(str(item.get("name") or ""))
            if not translation and item.get("name_en"):
                translation = city_translations.get(f"en:{item['name_en']}")
            if not translation:
                translation = _closest_translation(str(item.get("name") or ""), city_translations)
            result = _apply_translation(result, language, translation)
        places = result.get("places")
        if isinstance(places, list):
            result["places"] = [
                localize_attraction(city, place) if isinstance(place, dict) else place
                for place in places
            ]
        localized.append(with_translations(result))
    return localized


def localize_culture(city: str, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    localized: list[dict[str, Any]] = []
    for index, item in enumerate(items):
        result = item
        for language, overlay in LANGUAGE_OVERLAYS.items():
            city_translations = overlay.get("culture_facts", {}).get(city.lower(), {})
            translation = city_translations.get(f"sort:{index}")
            if not translation:
                translation = city_translations.get(f"title:{item.get('title', '')}")
            result = _apply_translation(result, language, translation)
        localized.append(with_translations(result))
    return localized


def localize_city_info(city: str, item: dict[str, Any] | None) -> dict[str, Any] | None:
    if not item:
        return item
    result = item
    nested_fields = ("emergency_numbers", "transport_apps", "useful_apps")
    for language in ("en", *LANGUAGE_OVERLAYS):
        overlay = LANGUAGE_OVERLAYS.get(language, {})
        translation = overlay.get("city_info", {}).get(city.lower()) or {}
        scalar_translation = {
            key: value for key, value in translation.items() if key not in nested_fields
        }
        result = _apply_translation(result, language, scalar_translation)
        for field in nested_fields:
            records = translation.get(field, {})
            if not isinstance(records, dict):
                continue
            localized_items = []
            for index, nested_item in enumerate(result.get(field, [])):
                if not isinstance(nested_item, dict):
                    localized_items.append(nested_item)
                    continue
                record = records.get(f"sort:{index}") or records.get(str(nested_item.get("name") or nested_item.get("label") or ""))
                localized_items.append(_apply_translation(nested_item, language, record))
            result[field] = localized_items
        scalar_fallback, nested_fallbacks = practical_fallbacks(city, result, language)
        result = _apply_translation(result, language, scalar_fallback)
        for field in nested_fields:
            result[field] = [
                _apply_translation(nested_item, language, nested_fallbacks[field][index])
                if isinstance(nested_item, dict) else nested_item
                for index, nested_item in enumerate(result.get(field, []))
            ]
    return with_translations(result)


def localize_neighborhoods(city: str, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    localized: list[dict[str, Any]] = []
    for item in items:
        result = item
        for language, overlay in LANGUAGE_OVERLAYS.items():
            city_translations = overlay.get("neighborhoods", {}).get(city.lower(), {})
            translation = city_translations.get(str(item.get("name") or ""))
            result = _apply_translation(result, language, translation)
        localized.append(with_translations(result))
    return localized
