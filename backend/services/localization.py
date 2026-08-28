"""Generic localization contract for API payloads."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

BASE_LANGUAGE = "it"
FALLBACK_LANGUAGE = "en"
DEFAULT_LANGUAGES = (BASE_LANGUAGE, FALLBACK_LANGUAGE, "fr", "es")
TRANSLATABLE_FIELDS = {
    "name",
    "description",
    "title",
    "body",
    "ingredients",
    "currency",
    "language",
    "english_note",
    "water",
    "tipping",
    "quick_tips",
    "timezone",
    "voltage",
    "label",
    "recommended_dishes",
}


def _legacy_value(item: dict[str, Any], field: str, language: str) -> Any:
    key = field if language == BASE_LANGUAGE else f"{field}_{language}"
    value = item.get(key)
    if value is None or value == "" or value == []:
        return None
    return value


def with_translations(
    item: dict[str, Any],
    languages: tuple[str, ...] = DEFAULT_LANGUAGES,
) -> dict[str, Any]:
    """Return an item with a generic translations map plus legacy fields."""
    result = deepcopy(item)
    existing = result.get("translations")
    translations: dict[str, dict[str, Any]] = (
        deepcopy(existing) if isinstance(existing, dict) else {}
    )

    for language in languages:
        localized = translations.setdefault(language, {})
        for field in TRANSLATABLE_FIELDS:
            value = _legacy_value(result, field, language)
            if value is not None:
                localized.setdefault(field, value)
        if not localized:
            translations.pop(language, None)

    if translations:
        result["translations"] = translations
    return result


def normalize_payload(value: Any) -> Any:
    """Recursively add translations maps to every translatable API object."""
    if isinstance(value, list):
        return [normalize_payload(item) for item in value]
    if not isinstance(value, dict):
        return value

    normalized = {
        key: normalize_payload(item) if key != "translations" else deepcopy(item)
        for key, item in value.items()
    }
    return with_translations(normalized)
