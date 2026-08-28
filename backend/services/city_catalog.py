"""Versioned city catalog with deterministic API records."""

from __future__ import annotations

import hashlib
from copy import deepcopy
from typing import Any

from database.cities import CITY_BY_ID


MIN_PLANNED_ATTRACTION_MINUTES = 50


class CatalogRecord:
    """Small model-compatible wrapper used by existing itinerary helpers."""

    def __init__(self, data: dict[str, Any]):
        self._data = deepcopy(data)
        for key, value in self._data.items():
            setattr(self, key, value)

    def __getattr__(self, name: str) -> Any:
        return None

    def to_dict(self) -> dict[str, Any]:
        return deepcopy(self._data)


def _stable_id(city: str, collection: str, index: int, name: str) -> int:
    source = f"{city}:{collection}:{index}:{name}".encode("utf-8")
    return int.from_bytes(hashlib.sha256(source).digest()[:4], "big") & 0x7FFFFFFF


def city_items(city: str, collection: str) -> list[dict[str, Any]]:
    city_id = city.lower().strip()
    module = CITY_BY_ID.get(city_id)
    if not module:
        return []

    source = getattr(module, collection, [])
    is_food_spot = collection == "FOOD_SPOTS"
    items: list[dict[str, Any]] = []
    for index, raw in enumerate(source):
        item = deepcopy(raw)
        item.setdefault("id", _stable_id(city_id, collection, index, str(item.get("name") or "")))
        item.setdefault("city", city_id)
        if collection in {"ATTRACTIONS", "FOOD_SPOTS"}:
            item.setdefault("is_food_spot", is_food_spot)
        if collection == "ATTRACTIONS":
            raw_minutes = item.get("estimated_visit_time") or 0
            item["estimated_visit_time"] = max(MIN_PLANNED_ATTRACTION_MINUTES, raw_minutes)
        items.append(item)
    return items


def city_records(city: str, collection: str) -> list[CatalogRecord]:
    return [CatalogRecord(item) for item in city_items(city, collection)]
