"""Check the external links bundled with Urveya city packages.

The audit is intentionally separate from the deterministic content audit. It
uses a persistent cache, follows redirects and treats anti-bot responses as
reachable instead of reporting false broken-link warnings.
"""

from __future__ import annotations

import argparse
import json
import socket
import ssl
import sys
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse, urlunparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
CITY_DIR = ROOT / "mobile" / "assets" / "cities"
DEFAULT_REPORT_DIR = ROOT / "backend" / "reports" / "link_validation"
DEFAULT_CACHE = DEFAULT_REPORT_DIR / "external_link_cache.json"
URL_KEYS = {
    "ticket_url": "ticket",
    "maps_link": "maps",
    "booking_url": "booking",
    "ios_url": "app",
    "android_url": "app",
    "ios_url_es": "app",
    "android_url_es": "app",
}
REACHABLE_BLOCKS = {401, 403, 405, 406, 409, 423, 429, 451}
BROKEN_STATUSES = {404, 410}
STABLE_CACHE_STATUSES = {"ok", "redirected", "protected", "broken", "suspicious_redirect"}


@dataclass(frozen=True)
class Reference:
    city: str
    kind: str
    label: str
    path: str


@dataclass(frozen=True)
class LinkResult:
    url: str
    checked_url: str
    status: str
    http_status: int | None
    final_url: str | None
    message: str | None
    checked_at: str


def network_url(url: str) -> str:
    """Convert native App Store links to their HTTP equivalent for checking."""
    parsed = urlparse(url)
    if parsed.scheme == "itms-apps":
        return urlunparse(parsed._replace(scheme="https"))
    return url


def label_for(record: dict[str, Any], fallback: str) -> str:
    return str(record.get("name") or record.get("title") or fallback)


def collect_links(package: dict[str, Any], city: str) -> dict[str, list[Reference]]:
    links: dict[str, list[Reference]] = defaultdict(list)

    def walk(value: Any, path: str, parent_label: str) -> None:
        if isinstance(value, dict):
            current_label = label_for(value, parent_label)
            for key, child in value.items():
                child_path = f"{path}.{key}" if path else key
                kind = URL_KEYS.get(key)
                if kind and isinstance(child, str) and child.strip():
                    links[child.strip()].append(Reference(city, kind, current_label, child_path))
                else:
                    walk(child, child_path, current_label)
        elif isinstance(value, list):
            for index, child in enumerate(value):
                walk(child, f"{path}[{index}]", parent_label)

    walk(package, "", city)
    return links


def merge_links(target: dict[str, list[Reference]], source: dict[str, list[Reference]]) -> None:
    for url, references in source.items():
        target[url].extend(references)


def request_once(url: str, method: str, timeout: float) -> tuple[int, str]:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; UrveyaLinkAudit/2.0; +https://wayra-api.onrender.com/)",
        "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.8",
    }
    if method == "GET":
        headers["Range"] = "bytes=0-2047"
    request = Request(url, headers=headers, method=method)
    with urlopen(request, timeout=timeout) as response:
        return int(response.status), response.geturl()


def classify_http(url: str, checked_url: str, status: int, final_url: str, checked_at: str) -> LinkResult:
    if status in BROKEN_STATUSES:
        state, message = "broken", f"HTTP {status}"
    elif status in REACHABLE_BLOCKS:
        state, message = "protected", f"HTTP {status}: servizio raggiungibile ma protetto"
    elif 200 <= status < 400:
        original = urlparse(checked_url)
        final = urlparse(final_url)
        redirected_to_home = original.path not in {"", "/"} and final.path in {"", "/"} and original.netloc == final.netloc
        if redirected_to_home:
            state, message = "suspicious_redirect", "Il collegamento specifico reindirizza alla home"
        elif checked_url.rstrip("/") != final_url.rstrip("/"):
            state, message = "redirected", None
        else:
            state, message = "ok", None
    elif 500 <= status:
        state, message = "unstable", f"HTTP {status}"
    else:
        state, message = "broken", f"HTTP {status}"
    return LinkResult(url, checked_url, state, status, final_url, message, checked_at)


def check_url(url: str, timeout: float) -> LinkResult:
    checked_url = network_url(url)
    checked_at = datetime.now(timezone.utc).isoformat()
    for method in ("HEAD", "GET"):
        try:
            status, final_url = request_once(checked_url, method, timeout)
            return classify_http(url, checked_url, status, final_url, checked_at)
        except HTTPError as error:
            if method == "HEAD" and error.code in {400, 403, 405, 406, 501}:
                continue
            return classify_http(url, checked_url, error.code, error.geturl() or checked_url, checked_at)
        except (TimeoutError, socket.timeout):
            if method == "HEAD":
                continue
            return LinkResult(url, checked_url, "timeout", None, None, "Timeout", checked_at)
        except ssl.SSLError as error:
            return LinkResult(url, checked_url, "tls_error", None, None, str(error), checked_at)
        except URLError as error:
            if method == "HEAD":
                continue
            reason = str(getattr(error, "reason", error))
            return LinkResult(url, checked_url, "unreachable", None, None, reason, checked_at)
        except OSError as error:
            return LinkResult(url, checked_url, "unreachable", None, None, str(error), checked_at)
    return LinkResult(url, checked_url, "unreachable", None, None, "Nessuna risposta", checked_at)


def load_cache(path: Path, max_age: timedelta) -> dict[str, LinkResult]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    now = datetime.now(timezone.utc)
    result: dict[str, LinkResult] = {}
    for url, entry in payload.get("results", {}).items():
        try:
            checked_at = datetime.fromisoformat(entry["checked_at"])
            if entry.get("status") in STABLE_CACHE_STATUSES and now - checked_at <= max_age:
                result[url] = LinkResult(**entry)
        except (KeyError, TypeError, ValueError):
            continue
    return result


def save_cache(path: Path, results: dict[str, LinkResult]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "version": 1,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "results": {
            url: asdict(result)
            for url, result in sorted(results.items())
            if result.status in STABLE_CACHE_STATUSES
        },
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_reports(
    report_dir: Path,
    links: dict[str, list[Reference]],
    results: dict[str, LinkResult],
    cached_count: int,
) -> tuple[Path, Path]:
    report_dir.mkdir(parents=True, exist_ok=True)
    counts = Counter(result.status for result in results.values())
    generated_at = datetime.now(timezone.utc).isoformat()
    rows = []
    for url, result in sorted(results.items(), key=lambda item: (item[1].status, item[0])):
        rows.append({
            **asdict(result),
            "references": [asdict(reference) for reference in links.get(url, [])],
        })
    payload = {
        "generatedAt": generated_at,
        "uniqueLinks": len(links),
        "references": sum(len(items) for items in links.values()),
        "cachedResults": cached_count,
        "summary": dict(sorted(counts.items())),
        "results": rows,
    }
    json_path = report_dir / "external_links_latest.json"
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Urveya external-link validation",
        "",
        f"Generated: {generated_at}",
        f"Unique links: {len(links)} | References: {payload['references']} | From cache: {cached_count}",
        "",
        "## Summary",
        "",
        "| Status | Count |",
        "|---|---:|",
    ]
    for status, count in sorted(counts.items()):
        lines.append(f"| {status} | {count} |")
    actionable = {"broken", "suspicious_redirect", "tls_error", "unreachable", "timeout", "unstable"}
    for status in sorted(actionable):
        affected = [(url, result) for url, result in results.items() if result.status == status]
        if not affected:
            continue
        lines.extend(("", f"## {status}", ""))
        for url, result in affected:
            references = links.get(url, [])
            locations = ", ".join(f"{ref.city}/{ref.kind}/{ref.label}" for ref in references[:4])
            detail = f" - {result.message}" if result.message else ""
            lines.append(f"- {url}{detail} ({locations})")
    markdown_path = report_dir / "external_links_latest.md"
    markdown_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return json_path, markdown_path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--city", action="append", dest="cities", help="Limit the audit to one city; repeat as needed")
    parser.add_argument("--kind", action="append", choices=sorted(set(URL_KEYS.values())), help="Limit link kinds")
    parser.add_argument("--timeout", type=float, default=8.0)
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--cache-ttl-hours", type=float, default=168.0)
    parser.add_argument("--refresh", action="store_true", help="Ignore cached results")
    parser.add_argument("--max-links", type=int, help="Check only the first N links (for smoke tests)")
    parser.add_argument("--report-dir", type=Path, default=DEFAULT_REPORT_DIR)
    parser.add_argument("--cache", type=Path, default=DEFAULT_CACHE)
    parser.add_argument("--fail-on", choices=("none", "broken", "actionable"), default="broken")
    args = parser.parse_args()

    requested = {value.casefold() for value in (args.cities or [])}
    selected_kinds = set(args.kind or URL_KEYS.values())
    links: dict[str, list[Reference]] = defaultdict(list)
    found_cities: set[str] = set()
    for path in sorted(CITY_DIR.glob("*.json")):
        if requested and path.stem.casefold() not in requested:
            continue
        package = json.loads(path.read_text(encoding="utf-8"))
        city = str(package.get("city") or path.stem).casefold()
        found_cities.add(city)
        merge_links(links, collect_links(package, city))
    missing = requested - found_cities
    if missing:
        print(f"Unknown cities: {', '.join(sorted(missing))}", file=sys.stderr)
        return 2
    links = {url: refs for url, refs in links.items() if any(ref.kind in selected_kinds for ref in refs)}
    if args.max_links is not None:
        links = dict(list(sorted(links.items()))[: max(0, args.max_links)])

    cache = {} if args.refresh else load_cache(args.cache, timedelta(hours=args.cache_ttl_hours))
    results = {url: cache[url] for url in links if url in cache}
    pending = [url for url in links if url not in results]
    with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 16))) as executor:
        futures = {executor.submit(check_url, url, args.timeout): url for url in pending}
        for index, future in enumerate(as_completed(futures), start=1):
            url = futures[future]
            try:
                results[url] = future.result()
            except Exception as error:  # Keep one unexpected server response from aborting the audit.
                results[url] = LinkResult(url, network_url(url), "unreachable", None, None, str(error), datetime.now(timezone.utc).isoformat())
            if index % 100 == 0 or index == len(pending):
                print(f"Checked {index}/{len(pending)} new links...", file=sys.stderr)

    merged_cache = {**cache, **results}
    save_cache(args.cache, merged_cache)
    json_path, markdown_path = write_reports(args.report_dir, links, results, len(results) - len(pending))
    counts = Counter(result.status for result in results.values())
    print(f"Urveya external-link audit: {len(links)} unique links, {sum(len(items) for items in links.values())} references")
    print(" | ".join(f"{status}: {count}" for status, count in sorted(counts.items())))
    print(f"JSON: {json_path}")
    print(f"Report: {markdown_path}")

    broken = counts["broken"] + counts["suspicious_redirect"]
    actionable = broken + counts["tls_error"] + counts["unreachable"] + counts["timeout"] + counts["unstable"]
    if args.fail_on == "broken" and broken:
        return 1
    if args.fail_on == "actionable" and actionable:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
