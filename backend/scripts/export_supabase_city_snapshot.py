"""Export public city information to a versioned local runtime snapshot.

This is a build-time operation. The Expo app never reads these catalog tables
from Supabase at runtime.
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from collections import defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
MOBILE_CONSTANTS = ROOT / "mobile" / "constants" / "supabase.ts"
OUTPUT = ROOT / "backend" / "database" / "remote_city_content_snapshot.json"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def _public_config() -> tuple[str, str]:
    source = MOBILE_CONSTANTS.read_text(encoding="utf-8")
    fallback_url = re.search(r'FALLBACK_SUPABASE_URL\s*=\s*"([^"]+)"', source)
    fallback_key = re.search(r'FALLBACK_SUPABASE_ANON_KEY\s*=\s*"([^"]+)"', source)
    url = os.getenv("SUPABASE_URL") or (fallback_url.group(1) if fallback_url else "")
    key = os.getenv("SUPABASE_ANON_KEY") or (fallback_key.group(1) if fallback_key else "")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL or SUPABASE_ANON_KEY is missing")
    return url.rstrip("/"), key


def _fetch_table(base_url: str, key: str, table: str) -> list[dict[str, Any]]:
    request = urllib.request.Request(
        f"{base_url}/rest/v1/{table}?select=*",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Accept": "application/json",
            "Range": "0-999",
        },
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        payload = json.load(response)
    if not isinstance(payload, list):
        raise RuntimeError(f"Unexpected response for {table}")
    return [row for row in payload if isinstance(row, dict)]


def _group_city_info(rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for row in rows:
        city = str(row.get("city") or "").strip().lower()
        if city:
            result[city] = row
    return dict(sorted(result.items()))


def _group_neighborhoods(rows: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grouped: defaultdict[str, dict[str, dict[str, Any]]] = defaultdict(dict)
    for row in rows:
        city = str(row.get("city") or "").strip().lower()
        name_key = str(row.get("name") or "").strip().casefold()
        sort_order = row.get("sort_order")
        identity = f"sort:{sort_order}" if sort_order is not None else f"name:{name_key}"
        if city and name_key:
            current = grouped[city].get(identity)
            if current is None or int(row.get("id") or 0) > int(current.get("id") or 0):
                grouped[city][identity] = row
    result: dict[str, list[dict[str, Any]]] = {}
    for city, by_name in grouped.items():
        city_rows = list(by_name.values())
        city_rows.sort(key=lambda row: (row.get("sort_order", 0), row.get("id", 0)))
        result[city] = city_rows
    return dict(sorted(result.items()))


def main() -> None:
    base_url, key = _public_config()
    try:
        city_info = _fetch_table(base_url, key, "city_info")
        neighborhoods = _fetch_table(base_url, key, "neighborhoods")
    except (urllib.error.URLError, TimeoutError) as error:
        raise SystemExit(
            "Supabase is unreachable. Run this command from a terminal with internet access.\n"
            f"Details: {error}"
        ) from error

    payload = {
        "city_info": _group_city_info(city_info),
        "neighborhoods": _group_neighborhoods(neighborhoods),
    }
    OUTPUT.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Saved {len(payload['city_info'])} city-info records and "
        f"{sum(len(rows) for rows in payload['neighborhoods'].values())} neighborhoods "
        f"to {OUTPUT}"
    )


if __name__ == "__main__":
    main()