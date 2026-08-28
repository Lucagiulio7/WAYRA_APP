"""Automatic discovery and validation for city content modules."""

from __future__ import annotations

import importlib
import pkgutil
from types import ModuleType

REQUIRED_COLLECTIONS = ("ATTRACTIONS", "FOOD_SPOTS", "FOODS_BY_CITY", "CULTURE_FACTS")


def _validate_city(module: ModuleType) -> None:
    city_id = getattr(module, "CITY_ID", None)
    if not isinstance(city_id, str) or not city_id.strip():
        raise ValueError(f"{module.__name__}: CITY_ID must be a non-empty string")
    for collection_name in REQUIRED_COLLECTIONS:
        collection = getattr(module, collection_name, None)
        if not isinstance(collection, list):
            raise ValueError(f"{module.__name__}: {collection_name} must be a list")
        if not collection:
            raise ValueError(f"{module.__name__}: {collection_name} cannot be empty")


def _discover_cities() -> list[ModuleType]:
    discovered: list[ModuleType] = []
    city_ids: set[str] = set()
    prefix = f"{__name__}."

    for module_info in sorted(pkgutil.iter_modules(__path__), key=lambda item: item.name):
        if module_info.name.startswith("_"):
            continue
        module = importlib.import_module(f"{prefix}{module_info.name}")
        _validate_city(module)
        city_id = module.CITY_ID.strip().lower()
        if city_id in city_ids:
            raise ValueError(f"Duplicate CITY_ID: {city_id}")
        city_ids.add(city_id)
        discovered.append(module)

    if not discovered:
        raise RuntimeError("No city modules found")
    return discovered


ALL_CITIES = _discover_cities()
CITY_BY_ID = {city.CITY_ID.lower(): city for city in ALL_CITIES}