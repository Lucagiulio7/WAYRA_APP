"""Audit the city content that is actually bundled with the Wayra app.

The command is intentionally read-only. It validates local city packages and
the client registries, then writes a JSON report and a human-readable Markdown
summary. Network checks are opt-in so the default audit is deterministic.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT / "backend"
MOBILE_DIR = ROOT / "mobile"
CITY_DIR = MOBILE_DIR / "assets" / "cities"
DEFAULT_REPORT_DIR = BACKEND_DIR / "reports" / "content_validation"
LANGUAGES = ("it", "en", "fr", "es")

COUNT_RULES = {
    # minimum, editorial target. Extra curated records are allowed.
    "attractions": (48, 48),
    "foodSpots": (64, 64),
    "foods": (8, 8),
    "cultureFacts": (10, 12),
    "neighborhoods": (4, 6),
    "plans": (36, 36),
}

SECTION_FIELDS = {
    "attractions": ("name", "description"),
    "foodSpots": ("description",),
    "foods": ("name", "description", "ingredients"),
    "cultureFacts": ("title", "body"),
    "neighborhoods": ("name", "description"),
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


@dataclass(frozen=True)
class Finding:
    severity: str
    city: str
    section: str
    code: str
    message: str


class Audit:
    def __init__(self) -> None:
        self.findings: list[Finding] = []

    def add(self, severity: str, city: str, section: str, code: str, message: str) -> None:
        self.findings.append(Finding(severity, city, section, code, message))

    def error(self, city: str, section: str, code: str, message: str) -> None:
        self.add("error", city, section, code, message)

    def warning(self, city: str, section: str, code: str, message: str) -> None:
        self.add("warning", city, section, code, message)

    def info(self, city: str, section: str, code: str, message: str) -> None:
        self.add("info", city, section, code, message)


def has_value(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, dict)):
        return bool(value)
    return True


def normalize(value: Any) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", " ", text.casefold()).strip()


def walk_values(value: Any, path: str = "") -> Iterable[tuple[str, Any]]:
    if isinstance(value, dict):
        for key, child in value.items():
            yield from walk_values(child, f"{path}.{key}" if path else str(key))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from walk_values(child, f"{path}[{index}]")
    else:
        yield path, value


def corrupted_text(value: str) -> bool:
    cleaned = re.sub(r"(?:https?|itms-apps)://\S+", "", value)
    # Do not flag legitimate French letters such as "Âge".
    return "\ufffd" in cleaned or bool(
        re.search(r"(?:Ã(?:©|¨|ª|®|´|§|±|¼|¶|Ÿ)|Â(?:\s|\u00a0)|â(?:€|€™|€œ|€\x9d))", cleaned)
    )


def valid_coordinates(item: dict[str, Any]) -> bool:
    try:
        latitude = float(item["latitude"])
        longitude = float(item["longitude"])
    except (KeyError, TypeError, ValueError):
        return False
    return (
        math.isfinite(latitude)
        and math.isfinite(longitude)
        and -90 <= latitude <= 90
        and -180 <= longitude <= 180
    )


def haversine_km(first: dict[str, Any], second: dict[str, Any]) -> float:
    lat1, lon1 = math.radians(float(first["latitude"])), math.radians(float(first["longitude"]))
    lat2, lon2 = math.radians(float(second["latitude"])), math.radians(float(second["longitude"]))
    delta_lat, delta_lon = lat2 - lat1, lon2 - lon1
    value = math.sin(delta_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lon / 2) ** 2
    return 6371.0 * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


def walking_factor(distance: float) -> float:
    if distance > 2:
        return 1.10
    if distance > 1:
        return 1.15
    if distance > 0.5:
        return 1.30
    if distance > 0.3:
        return 1.40
    return 1.50


def route_km(stops: list[dict[str, Any]]) -> float:
    return sum(
        (distance := haversine_km(first, second)) * walking_factor(distance)
        for first, second in zip(stops, stops[1:])
    )


def translation(item: dict[str, Any], language: str, field: str) -> Any:
    translations = item.get("translations") or {}
    localized = translations.get(language) or {}
    if has_value(localized.get(field)):
        return localized[field]
    suffix = "" if language == "it" else f"_{language}"
    return item.get(f"{field}{suffix}")


def identity(item: dict[str, Any], index: int) -> str:
    return str(item.get("name") or item.get("title") or item.get("id") or f"#{index}")


def check_translations(
    audit: Audit,
    city: str,
    section: str,
    items: list[dict[str, Any]],
    fields: tuple[str, ...],
) -> None:
    for index, item in enumerate(items):
        label = identity(item, index)
        for language in LANGUAGES:
            for field in fields:
                if not has_value(translation(item, language, field)):
                    audit.warning(city, section, "missing_translation", f"{label}: manca {language}.{field}")


def check_collection(audit: Audit, city: str, section: str, items: Any) -> None:
    if not isinstance(items, list):
        audit.error(city, section, "invalid_collection", "La sezione non è una lista")
        return
    minimum, target = COUNT_RULES[section]
    if len(items) < minimum:
        audit.error(city, section, "insufficient_count", f"Minimo {minimum} elementi, trovati {len(items)}")
    elif len(items) < target:
        audit.info(city, section, "below_editorial_target", f"Target {target} elementi, presenti {len(items)}")

    names = [normalize(identity(item, index)) for index, item in enumerate(items)]
    for name, count in Counter(names).items():
        if name and count > 1:
            audit.warning(city, section, "duplicate_name", f"Nome duplicato ({count} volte): {name}")

    ids = [item.get("id") for item in items if item.get("id") is not None]
    for item_id, count in Counter(ids).items():
        if count > 1:
            audit.error(city, section, "duplicate_id", f"ID duplicato: {item_id}")

    check_translations(audit, city, section, items, SECTION_FIELDS[section])


def check_geo_collection(audit: Audit, city: str, section: str, items: list[dict[str, Any]]) -> None:
    valid = [item for item in items if valid_coordinates(item)]
    for index, item in enumerate(items):
        if not valid_coordinates(item):
            audit.error(city, section, "invalid_coordinates", f"{identity(item, index)}: coordinate mancanti o non valide")

    coordinates: dict[tuple[float, float], list[str]] = defaultdict(list)
    for index, item in enumerate(valid):
        key = (round(float(item["latitude"]), 6), round(float(item["longitude"]), 6))
        coordinates[key].append(identity(item, index))
    for labels in coordinates.values():
        if len(labels) > 1:
            audit.warning(city, section, "duplicate_coordinates", f"Coordinate identiche: {', '.join(labels[:4])}")

    if len(valid) >= 4:
        latitudes = sorted(float(item["latitude"]) for item in valid)
        longitudes = sorted(float(item["longitude"]) for item in valid)
        center = {"latitude": latitudes[len(latitudes) // 2], "longitude": longitudes[len(longitudes) // 2]}
        distant = [(haversine_km(center, item), item) for item in valid]
        for distance, item in sorted(distant, reverse=True, key=lambda entry: entry[0])[:3]:
            if distance > 150:
                audit.warning(city, section, "extreme_outlier", f"{item.get('name')}: {distance:.0f} km dal centro del catalogo")


def valid_http_url(value: Any, *, app_link: bool = False) -> bool:
    if not isinstance(value, str):
        return False
    parsed = urlparse(value)
    allowed_schemes = {"http", "https", "itms-apps"} if app_link else {"http", "https"}
    return parsed.scheme in allowed_schemes and bool(parsed.netloc)


def check_links(audit: Audit, city: str, package: dict[str, Any], live_urls: set[str]) -> None:
    for index, attraction in enumerate(package.get("attractions") or []):
        url = attraction.get("ticket_url")
        if url and not valid_http_url(url):
            audit.error(city, "attractions", "invalid_ticket_url", f"{identity(attraction, index)}: URL biglietti non valido")
        if valid_http_url(url):
            live_urls.add(url)

    for food_index, food in enumerate(package.get("foods") or []):
        places = food.get("places") or []
        if not places:
            audit.warning(city, "foods", "missing_places", f"{identity(food, food_index)}: nessun locale consigliato")
        for place_index, place in enumerate(places):
            label = identity(place, place_index)
            maps_link = place.get("maps_link")
            if not valid_http_url(maps_link):
                audit.warning(city, "foods", "invalid_maps_url", f"{label}: link Maps mancante o non valido")
                continue
            parsed = urlparse(maps_link)
            query = " ".join(parse_qs(parsed.query).get("query", []))
            if re.search(r"-?\d{1,3}\.\d+\s*[,+]\s*-?\d{1,3}\.\d+", query):
                audit.warning(city, "foods", "coordinate_maps_url", f"{label}: il link Maps usa coordinate invece di nome e città")
            if normalize(city) not in normalize(query):
                audit.warning(city, "foods", "city_missing_from_maps", f"{label}: la ricerca Maps non contiene l'id città")
            live_urls.add(maps_link)

    info = package.get("cityInfo") or {}
    for group in ("transport_apps", "useful_apps"):
        for app in info.get(group) or []:
            for platform in ("ios_url", "android_url"):
                url = app.get(platform)
                if not valid_http_url(url, app_link=True):
                    audit.warning(city, "cityInfo", "invalid_app_url", f"{app.get('name')}: {platform} non valido")
                else:
                    live_urls.add(url)


def check_city_info(audit: Audit, city: str, info: Any) -> None:
    if not isinstance(info, dict) or not info:
        audit.error(city, "cityInfo", "missing_section", "Informazioni utili assenti")
        return
    for language in LANGUAGES:
        for field in CITY_INFO_FIELDS:
            if not has_value(translation(info, language, field)):
                audit.warning(city, "cityInfo", "missing_translation", f"Manca {language}.{field}")
    for group, field in (("emergency_numbers", "label"), ("transport_apps", "description"), ("useful_apps", "description")):
        records = info.get(group) or []
        if not records:
            audit.warning(city, "cityInfo", "empty_group", f"La sezione {group} è vuota")
        for index, item in enumerate(records):
            for language in LANGUAGES:
                if not has_value(translation(item, language, field)):
                    audit.warning(city, "cityInfo", "missing_translation", f"{group}/{identity(item, index)}: manca {language}.{field}")


def check_plans(audit: Audit, city: str, package: dict[str, Any]) -> None:
    plans = package.get("plans") or {}
    if len(plans) != COUNT_RULES["plans"][0]:
        audit.error(city, "plans", "unexpected_count", f"Attesi 36 piani, trovati {len(plans)}")
    attraction_by_id = {item.get("id"): item for item in package.get("attractions") or []}
    quality_counts: Counter[str] = Counter()

    for key, plan in plans.items():
        try:
            mode, days_value, walk_value = key.split("|")
            if mode not in {"1", "mix"}:
                raise ValueError
            num_days, max_walk = int(days_value), int(walk_value)
        except (TypeError, ValueError):
            audit.error(city, "plans", "invalid_key", f"Chiave piano non valida: {key}")
            continue
        days = plan.get("days") or []
        if len(days) != num_days:
            audit.error(city, "plans", "day_count", f"{key}: attesi {num_days} giorni, trovati {len(days)}")
        seen: set[Any] = set()
        for day_index, day in enumerate(days, start=1):
            stop_ids = day.get("stopIds") or []
            stops = [attraction_by_id.get(stop_id) for stop_id in stop_ids]
            missing = [stop_id for stop_id, stop in zip(stop_ids, stops) if stop is None]
            if missing:
                audit.error(city, "plans", "unknown_stop", f"{key}/giorno {day_index}: ID inesistenti {missing[:4]}")
            duplicates = [stop_id for stop_id in stop_ids if stop_id in seen]
            if duplicates:
                audit.error(city, "plans", "reused_stop", f"{key}/giorno {day_index}: tappe ripetute {duplicates[:4]}")
            seen.update(stop_ids)
            valid_stops = [stop for stop in stops if stop]
            minutes = sum(int(stop.get("estimated_visit_time") or 60) for stop in valid_stops)
            museums = sum("muse" in str(stop.get("attraction_type") or "").casefold() for stop in valid_stops)
            distance = route_km(valid_stops) if len(valid_stops) > 1 else 0.0
            profile_min = {3: (4, 240), 5: (5, 300), 7: (6, 360)}.get(max_walk, (4, 240))
            profile_max = {3: (5, 330), 5: (6, 390), 7: (8, 420)}.get(max_walk, (10, 420))
            is_excursion = day.get("dayType") == "excursion"
            minimum_stops = max(2, profile_min[0] - 2) if is_excursion else profile_min[0]
            minimum_minutes = max(120, profile_min[1] - 120) if is_excursion else profile_min[1]
            if len(valid_stops) < minimum_stops:
                quality_counts[f"poche_tappe_{max_walk}"] += 1
            if minutes < minimum_minutes - 10:
                quality_counts[f"poche_ore_{max_walk}"] += 1
            if len(valid_stops) > profile_max[0] or minutes > profile_max[1]:
                quality_counts[f"giorno_eccessivo_{max_walk}"] += 1
            if museums > 2:
                quality_counts["troppi_musei"] += 1
            if distance > max_walk + 0.05 and not day.get("transferRequired"):
                quality_counts[f"distanza_{max_walk}"] += 1
            if day.get("dayType") not in {"urban", "excursion"}:
                audit.error(city, "plans", "invalid_day_type", f"{key}/giorno {day_index}: dayType non valido")
            if day.get("dayType") == "excursion" and not day.get("transferRequired"):
                quality_counts["escursione_senza_trasferimento"] += 1

    for code, count in sorted(quality_counts.items()):
        audit.info(city, "plans", code, f"{count} giornate da riesaminare nella matrice completa")


def extract_registry_ids(path: Path, marker: str, item_pattern: str) -> set[str]:
    source = path.read_text(encoding="utf-8")
    section = source[source.index(marker):]
    return set(re.findall(item_pattern, section, flags=re.MULTILINE))


def check_client_registries(audit: Audit, cities: set[str]) -> None:
    registry_ids = extract_registry_ids(
        MOBILE_DIR / "data" / "cityRegistry.ts",
        "export const CITY_REGISTRY",
        r'^\s*\{\s*id:\s*"([^"]+)"',
    )
    manifest_ids = extract_registry_ids(
        MOBILE_DIR / "data" / "localCatalogManifest.ts",
        "const CITY_PACKAGES",
        r'^\s*"?([^"\s:]+)"?\s*:\s*\(\)',
    )
    activity_ids = extract_registry_ids(
        MOBILE_DIR / "data" / "cityActivities.ts",
        "export const CITY_ACTIVITY_CATALOG",
        r'^\s*(?:"([^"]+)"|([^\s:]+))\s*:\s*\[',
    )
    # The activity pattern has two capture groups.
    source = (MOBILE_DIR / "data" / "cityActivities.ts").read_text(encoding="utf-8")
    activity_section = source[source.index("export const CITY_ACTIVITY_CATALOG"):]
    activity_ids = {first or second for first, second in re.findall(r'^\s*(?:"([^"]+)"|([^\s:]+))\s*:\s*\[', activity_section, re.MULTILINE)}
    polygon_ids = set(re.findall(r'\bcity:\s*"([^"]+)"', (MOBILE_DIR / "data" / "neighborhoodPolygons.ts").read_text(encoding="utf-8")))
    transit_ids = set(re.findall(r'^\s*(?:"([^"]+)"|([\w\u0080-\uffff]+))\s*:\s*\{\s*bbox:', (MOBILE_DIR / "data" / "transitNetworks.ts").read_text(encoding="utf-8"), re.MULTILINE))
    transit_ids = {first or second for first, second in transit_ids}

    for label, registered, required in (
        ("registro città", registry_ids, True),
        ("manifest pacchetti", manifest_ids, True),
        ("attività", activity_ids, True),
        ("poligoni alloggi", polygon_ids, True),
        ("trasporti", transit_ids, False),
    ):
        for city in sorted(cities - registered):
            method = audit.warning if required else audit.info
            method(city, "client", "missing_registry", f"Città assente da {label}")
        for city in sorted(registered - cities):
            audit.warning(city, "client", "orphan_registry", f"Voce in {label} senza pacchetto città")


def check_live_links(audit: Audit, urls: set[str], timeout: float) -> None:
    for index, url in enumerate(sorted(urls), start=1):
        request = Request(url, headers={"User-Agent": "WayraContentAudit/1.0"}, method="HEAD")
        try:
            with urlopen(request, timeout=timeout) as response:
                if response.status >= 400:
                    audit.warning("global", "links", "http_error", f"HTTP {response.status}: {url}")
        except HTTPError as error:
            if error.code not in {401, 403, 405, 429}:
                audit.warning("global", "links", "http_error", f"HTTP {error.code}: {url}")
        except (URLError, TimeoutError, OSError) as error:
            audit.warning("global", "links", "unreachable", f"Non raggiungibile: {url} ({error})")
        if index % 100 == 0:
            print(f"Checked {index}/{len(urls)} links...", file=sys.stderr)


def write_reports(audit: Audit, cities: list[str], report_dir: Path) -> tuple[Path, Path]:
    report_dir.mkdir(parents=True, exist_ok=True)
    counts = Counter(finding.severity for finding in audit.findings)
    timestamp = datetime.now(timezone.utc).isoformat()
    payload = {
        "generatedAt": timestamp,
        "cityCount": len(cities),
        "cities": cities,
        "summary": {severity: counts[severity] for severity in ("error", "warning", "info")},
        "findings": [asdict(finding) for finding in audit.findings],
    }
    json_path = report_dir / "content_validation_latest.json"
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Wayra content validation",
        "",
        f"Generated: {timestamp}",
        f"Cities: {len(cities)}",
        f"Errors: {counts['error']} | Warnings: {counts['warning']} | Quality notes: {counts['info']}",
        "",
    ]
    grouped: dict[str, list[Finding]] = defaultdict(list)
    for finding in audit.findings:
        grouped[finding.city].append(finding)
    lines.extend(("## City overview", "", "| City | Errors | Warnings | Quality notes |", "|---|---:|---:|---:|"))
    for city in cities:
        city_counts = Counter(finding.severity for finding in grouped.get(city, []))
        lines.append(f"| {city} | {city_counts['error']} | {city_counts['warning']} | {city_counts['info']} |")
    lines.append("")
    if not audit.findings:
        lines.append("No findings.")
    for city in cities + (["global"] if "global" in grouped else []):
        findings = grouped.get(city)
        if not findings:
            continue
        lines.extend((f"## {city}", ""))
        for finding in sorted(findings, key=lambda item: ({"error": 0, "warning": 1, "info": 2}[item.severity], item.section, item.code)):
            lines.append(f"- **{finding.severity.upper()}** `{finding.section}/{finding.code}`: {finding.message}")
        lines.append("")
    markdown_path = report_dir / "content_validation_latest.md"
    markdown_path.write_text("\n".join(lines), encoding="utf-8")
    return json_path, markdown_path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--city", action="append", dest="cities", help="Audit only this city id; repeat as needed")
    parser.add_argument("--check-links", action="store_true", help="Also perform live HTTP checks (slow and network-dependent)")
    parser.add_argument("--link-timeout", type=float, default=5.0)
    parser.add_argument("--report-dir", type=Path, default=DEFAULT_REPORT_DIR)
    parser.add_argument("--fail-on", choices=("none", "error", "warning"), default="error")
    args = parser.parse_args()

    package_paths = sorted(CITY_DIR.glob("*.json"))
    requested = {city.casefold() for city in (args.cities or [])}
    if requested:
        package_paths = [path for path in package_paths if path.stem.casefold() in requested]
        missing = requested - {path.stem.casefold() for path in package_paths}
        if missing:
            print(f"Unknown cities: {', '.join(sorted(missing))}", file=sys.stderr)
            return 2

    audit = Audit()
    cities: list[str] = []
    live_urls: set[str] = set()
    global_ids: dict[Any, list[str]] = defaultdict(list)
    for path in package_paths:
        try:
            package = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            audit.error(path.stem, "package", "invalid_json", str(error))
            continue
        city = str(package.get("city") or path.stem).casefold()
        cities.append(city)
        if city != path.stem.casefold():
            audit.error(city, "package", "filename_mismatch", f"Il file si chiama {path.name}")
        if package.get("version") != 2:
            audit.error(city, "package", "version", f"Versione pacchetto attesa 2, trovata {package.get('version')}")

        for section in SECTION_FIELDS:
            items = package.get(section) or []
            check_collection(audit, city, section, items)
            if section in {"attractions", "foodSpots"}:
                check_geo_collection(audit, city, section, items)
            for item in items:
                if item.get("id") is not None:
                    global_ids[item["id"]].append(f"{city}/{section}/{item.get('name') or item.get('title')}")
        check_city_info(audit, city, package.get("cityInfo"))
        check_links(audit, city, package, live_urls)
        check_plans(audit, city, package)

        for value_path, value in walk_values(package):
            if isinstance(value, str) and corrupted_text(value):
                audit.error(city, "text", "mojibake", f"Caratteri corrotti in {value_path}: {value[:80]}")

    for item_id, locations in global_ids.items():
        if len(locations) > 1:
            audit.error("global", "ids", "global_duplicate_id", f"ID {item_id}: {', '.join(locations[:4])}")

    if not requested:
        check_client_registries(audit, set(cities))
    if args.check_links:
        check_live_links(audit, live_urls, args.link_timeout)

    json_path, markdown_path = write_reports(audit, cities, args.report_dir)
    counts = Counter(finding.severity for finding in audit.findings)
    print(f"Wayra content audit: {len(cities)} cities")
    print(f"Errors: {counts['error']} | Warnings: {counts['warning']} | Quality notes: {counts['info']}")
    print(f"JSON: {json_path}")
    print(f"Report: {markdown_path}")
    if args.fail_on == "warning" and (counts["error"] or counts["warning"]):
        return 1
    if args.fail_on == "error" and counts["error"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
