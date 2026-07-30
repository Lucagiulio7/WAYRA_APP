"""Versioned city content and localization overlays bundled with the backend."""

from __future__ import annotations

import json
import re
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

STATIC_CONTENT_PATH = (
    Path(__file__).resolve().parents[1] / "database" / "static_city_content.json"
)


def _load_static_content() -> dict[str, Any]:
    try:
        return json.loads(STATIC_CONTENT_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


STATIC_CONTENT = _load_static_content()
STATIC_CITY_INFO = STATIC_CONTENT.get("city_info", {})
STATIC_NEIGHBORHOODS = STATIC_CONTENT.get("neighborhoods", {})
ATTRACTION_TRANSLATIONS = STATIC_CONTENT.get("attraction_translations", {})
FOOD_TRANSLATIONS = STATIC_CONTENT.get("food_translations", {})
CULTURE_TRANSLATIONS = STATIC_CONTENT.get("culture_translations", {})


def localize_attraction(city: str, item: dict[str, Any]) -> dict[str, Any]:
    city_translations = ATTRACTION_TRANSLATIONS.get(city.lower(), {})
    translation = city_translations.get(str(item.get("name") or ""))
    if not translation and item.get("name_en"):
        translation = city_translations.get(f"en:{item['name_en']}")
    if not translation:
        return item
    return {**item, **translation}


def localize_attractions(city: str, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [localize_attraction(city, item) for item in items]


def _normalized_food_name(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    value = "".join(character for character in value if not unicodedata.combining(character))
    words = re.sub(r"[^a-z0-9]+", " ", value.replace("?", "")).split()
    return " ".join(word for word in words if word not in {"di", "de"})


def _closest_food_translation(name: str, translations: dict[str, dict]) -> dict[str, Any] | None:
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
    city_translations = FOOD_TRANSLATIONS.get(city.lower(), {})
    localized: list[dict[str, Any]] = []
    for item in items:
        translation = city_translations.get(str(item.get("name") or ""))
        if not translation and item.get("name_en"):
            translation = city_translations.get(f"en:{item['name_en']}")
        if not translation:
            translation = _closest_food_translation(str(item.get("name") or ""), city_translations)
        result = {**item, **(translation or {})}
        places = result.get("places")
        if isinstance(places, list):
            result["places"] = [
                localize_attraction(city, place) if isinstance(place, dict) else place
                for place in places
            ]
        localized.append(result)
    return localized


def localize_culture(city: str, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    city_translations = CULTURE_TRANSLATIONS.get(city.lower(), {})
    localized: list[dict[str, Any]] = []
    for index, item in enumerate(items):
        translation = city_translations.get(f"sort:{index}")
        if not translation:
            translation = city_translations.get(f"title:{item.get('title', '')}", {})
        localized.append({**item, **translation})
    return localized