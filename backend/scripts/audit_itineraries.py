"""Audit every itinerary combination exposed by the app.

The audit uses the versioned city catalog and the production itinerary builder.
It writes a machine-readable JSON report and a compact Markdown summary.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from time import perf_counter
from typing import Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from database.cities import CITY_BY_ID  # noqa: E402
from services.city_catalog import city_items  # noqa: E402
from services.itinerary_builder import (  # noqa: E402
    MAX_DAILY_MINUTES,
    MAX_MUSEUMS_PER_DAY,
    _day_mobility,
    _day_minutes,
    _effort_profile,
    _fits_hard_constraints,
    _max_route_leg,
    _museum_count,
    _optimized_distance,
    _route_distance,
    build_itinerary,
)
from services.must_see import annotate_must_see_many  # noqa: E402
from services.static_content import localize_attractions  # noqa: E402

PROFILES = {
    "relaxed": 3.0,
    "balanced": 5.0,
    "intense": 7.0,
}
MODES: dict[str, int | list[int]] = {
    "iconic": 1,
    "explorer": [1, 2, 3],
}
MAX_DAYS = {"iconic": 5, "explorer": 7}
SEVERITY_ORDER = {"P0": 0, "P1": 1, "P2": 2}
MINIMUM_MINUTES_TOLERANCE = 10


@dataclass
class Issue:
    severity: str
    code: str
    city: str
    mode: str
    profile: str | None
    days: int | None
    day: int | None
    message: str


@dataclass
class Scenario:
    city: str
    mode: str
    profile: str
    requested_days: int
    generated_days: int
    elapsed_ms: int
    total_stops: int
    total_minutes: int
    total_distance_km: float
    level_counts: dict[str, int]
    must_see_total: int
    must_see_included: int
    day_metrics: list[dict[str, Any]]
    signature: list[int]
    issues: list[Issue]


def add_issue(
    issues: list[Issue],
    severity: str,
    code: str,
    city: str,
    mode: str,
    profile: str | None,
    days: int | None,
    message: str,
    day: int | None = None,
) -> None:
    issues.append(Issue(severity, code, city, mode, profile, days, day, message))


def audit_scenario(
    city: str,
    mode: str,
    level: int | list[int],
    profile_name: str,
    max_walk_km: float,
    requested_days: int,
    attractions: list[dict[str, Any]],
    food_spots: list[dict[str, Any]],
    must_see_ids: set[int],
    top_must_see_id: int | None,
) -> Scenario:
    issues: list[Issue] = []
    started = perf_counter()
    try:
        generated = build_itinerary(
            attractions=attractions,
            food_spots=food_spots,
            num_days=requested_days,
            level=level,
            max_walk_km=max_walk_km,
        )
    except Exception as exc:  # the report must continue across cities
        elapsed_ms = round((perf_counter() - started) * 1000)
        add_issue(issues, "P0", "generation_exception", city, mode, profile_name, requested_days, repr(exc))
        return Scenario(city, mode, profile_name, requested_days, 0, elapsed_ms, 0, 0, 0.0, {}, len(must_see_ids), 0, [], [], issues)

    elapsed_ms = round((perf_counter() - started) * 1000)
    if len(generated) != requested_days:
        add_issue(
            issues,
            "P0",
            "wrong_day_count",
            city,
            mode,
            profile_name,
            requested_days,
            f"Requested {requested_days} days but generated {len(generated)}.",
        )

    profile = _effort_profile(max_walk_km)
    all_stops: list[dict[str, Any]] = []
    day_metrics: list[dict[str, Any]] = []
    for index, generated_day in enumerate(generated, start=1):
        stops = [stop for stop in generated_day.get("stops", []) if stop.get("type") == "attraction"]
        all_stops.extend(stops)
        minutes = _day_minutes(stops)
        museums = _museum_count(stops)
        route_km = _route_distance(stops)
        optimized_km = _optimized_distance(stops)
        mobility = _day_mobility(stops, max_walk_km)
        walking_km = float(
            generated_day.get("walking_distance_km", mobility["walking_distance_km"])
        )
        max_leg_km = _max_route_leg(stops)
        metric = {
            "day": index,
            "stops": len(stops),
            "minutes": minutes,
            "hours": round(minutes / 60, 2),
            "museums": museums,
            "route_km": round(route_km, 2),
            "optimized_km": round(optimized_km, 2),
            "walking_km": round(walking_km, 2),
            "max_leg_km": round(max_leg_km, 2),
            "names": [stop.get("name") for stop in stops],
            "day_type": generated_day.get("day_type", "urban"),
            "transfer_required": bool(generated_day.get("transfer_required")),
            "transfer_distance_km": generated_day.get("transfer_distance_km", 0),
        }
        day_metrics.append(metric)

        if not stops:
            add_issue(issues, "P0", "empty_day", city, mode, profile_name, requested_days, "Generated day has no attractions.", index)
            continue
        minimum_stops = profile["min_attractions"]
        if generated_day.get("day_type") == "excursion":
            minimum_stops = max(4, minimum_stops - 1)
        if (
            len(stops) < minimum_stops
            and minutes < profile["min_minutes"] - MINIMUM_MINUTES_TOLERANCE
        ):
            add_issue(issues, "P2", "too_few_stops", city, mode, profile_name, requested_days, f"{len(stops)} stops; expected at least {minimum_stops} for this day type.", index)
        if minutes < profile["min_minutes"] - MINIMUM_MINUTES_TOLERANCE:
            add_issue(issues, "P2", "too_few_minutes", city, mode, profile_name, requested_days, f"{minutes} minutes; expected at least {profile['min_minutes']}.", index)
        if minutes > MAX_DAILY_MINUTES:
            add_issue(issues, "P1", "hard_time_limit", city, mode, profile_name, requested_days, f"{minutes} minutes exceeds the 420-minute hard limit.", index)
        elif minutes > profile["max_minutes"]:
            add_issue(issues, "P2", "profile_time_limit", city, mode, profile_name, requested_days, f"{minutes} minutes exceeds the {profile_name} target ceiling of {profile['max_minutes']}.", index)
        if museums > MAX_MUSEUMS_PER_DAY:
            add_issue(issues, "P1", "museum_limit", city, mode, profile_name, requested_days, f"{museums} museums exceeds the limit of {MAX_MUSEUMS_PER_DAY}.", index)
        if walking_km > max_walk_km + 0.01:
            add_issue(issues, "P1", "walking_limit", city, mode, profile_name, requested_days, f"{walking_km:.2f} walking km exceeds the selected {max_walk_km:.0f} km limit.", index)
        if route_km > optimized_km * 1.15 and route_km - optimized_km > 0.3:
            add_issue(issues, "P2", "route_order", city, mode, profile_name, requested_days, f"Returned order is {route_km:.2f} km versus {optimized_km:.2f} km optimized.", index)
        preferred_leg = {"relaxed": 1.25, "balanced": 1.75, "intense": 2.25}[profile_name]
        transfer_legs = generated_day.get("transfer_legs") or []
        if max_leg_km > preferred_leg + 0.5 and not transfer_legs:
            add_issue(issues, "P2", "long_walking_leg", city, mode, profile_name, requested_days, f"Longest walking leg is {max_leg_km:.2f} km; review whether the day mixes distant areas.", index)

    ids = [int(stop["id"]) for stop in all_stops if stop.get("id") is not None]
    duplicate_ids = [item_id for item_id, count in Counter(ids).items() if count > 1]
    if duplicate_ids:
        add_issue(issues, "P1", "duplicate_stops", city, mode, profile_name, requested_days, f"Duplicate attraction ids across days: {duplicate_ids[:5]}.")

    if len(day_metrics) > 1:
        minutes_values = [metric["minutes"] for metric in day_metrics]
        stop_values = [metric["stops"] for metric in day_metrics]
        if max(minutes_values) - min(minutes_values) > 90:
            add_issue(issues, "P2", "uneven_time", city, mode, profile_name, requested_days, f"Daily activity range is {min(minutes_values)}-{max(minutes_values)} minutes.")
        if max(stop_values) - min(stop_values) > 2 and max(minutes_values) - min(minutes_values) > 60:
            add_issue(issues, "P2", "uneven_stops", city, mode, profile_name, requested_days, f"Daily stop range is {min(stop_values)}-{max(stop_values)}.")

    included_ids = set(ids)
    if top_must_see_id is not None and top_must_see_id not in included_ids:
        add_issue(issues, "P1", "top_must_see_missing", city, mode, profile_name, requested_days, "The city's highest-priority must-see attraction is missing.")
    must_see_included = len(must_see_ids & included_ids)

    if mode == "explorer" and all_stops and not any((stop.get("category_level") or 1) in {2, 3} for stop in all_stops):
        discovery_candidates = [
            item for item in attractions
            if (item.get("category_level") or 1) in {2, 3}
            and item.get("id") not in included_ids
        ]
        compatible_discovery = any(
            _fits_hard_constraints([*day_stops, candidate], max_walk_km)
            or any(
                not current.get("must_see")
                and _fits_hard_constraints(
                    [item for item in day_stops if item.get("id") != current.get("id")]
                    + [candidate],
                    max_walk_km,
                )
                for current in day_stops
            )
            for generated_day in generated
            for day_stops in [[
                stop for stop in generated_day.get("stops", [])
                if stop.get("type") == "attraction"
            ]]
            for candidate in discovery_candidates
        )
        if compatible_discovery:
            add_issue(issues, "P1", "explorer_has_no_discovery", city, mode, profile_name, requested_days, "Explorer contains only level-1 attractions despite having a compatible discovery.")

    levels = Counter(str(stop.get("category_level") or "unknown") for stop in all_stops)
    return Scenario(
        city=city,
        mode=mode,
        profile=profile_name,
        requested_days=requested_days,
        generated_days=len(generated),
        elapsed_ms=elapsed_ms,
        total_stops=len(all_stops),
        total_minutes=sum(metric["minutes"] for metric in day_metrics),
        total_distance_km=round(sum(metric["route_km"] for metric in day_metrics), 2),
        level_counts=dict(levels),
        must_see_total=len(must_see_ids),
        must_see_included=must_see_included,
        day_metrics=day_metrics,
        signature=sorted(ids),
        issues=issues,
    )


def comparison_issues(city: str, scenarios: list[Scenario]) -> list[Issue]:
    issues: list[Issue] = []
    by_key = {(item.mode, item.profile, item.requested_days): item for item in scenarios}
    for mode in MODES:
        for days in range(1, MAX_DAYS[mode] + 1):
            relaxed = by_key.get((mode, "relaxed", days))
            balanced = by_key.get((mode, "balanced", days))
            intense = by_key.get((mode, "intense", days))
            if not (relaxed and balanced and intense):
                continue
            if relaxed.signature == balanced.signature == intense.signature:
                add_issue(issues, "P2", "profiles_identical", city, mode, None, days, "Relaxed, balanced and intense select exactly the same attractions.")
            if intense.total_stops < relaxed.total_stops or intense.total_minutes < relaxed.total_minutes:
                add_issue(issues, "P2", "effort_not_monotonic", city, mode, None, days, f"Intense ({intense.total_stops} stops, {intense.total_minutes} min) is lighter than relaxed ({relaxed.total_stops} stops, {relaxed.total_minutes} min).")

    for profile in PROFILES:
        for days in range(1, MAX_DAYS["iconic"] + 1):
            iconic = by_key.get(("iconic", profile, days))
            explorer = by_key.get(("explorer", profile, days))
            if not iconic or not explorer or days <= 1:
                continue
            iconic_day_groups = sorted(
                tuple(sorted(metric["names"])) for metric in iconic.day_metrics
            )
            explorer_day_groups = sorted(
                tuple(sorted(metric["names"])) for metric in explorer.day_metrics
            )
            if (
                iconic.signature == explorer.signature
                and iconic_day_groups == explorer_day_groups
                and iconic.must_see_included < iconic.total_stops
            ):
                add_issue(issues, "P2", "modes_identical", city, "comparison", profile, days, "Iconic and explorer select exactly the same attractions.")
    return issues


def markdown_report(report: dict[str, Any]) -> str:
    summary = report["summary"]
    lines = [
        "# Wayra itinerary audit",
        "",
        f"Generated: {report['generated_at']}",
        f"Cities: {summary['cities']} | Scenarios: {summary['scenarios']} | Runtime: {summary['runtime_seconds']} s",
        f"Issues: P0 {summary['severity_counts'].get('P0', 0)}, P1 {summary['severity_counts'].get('P1', 0)}, P2 {summary['severity_counts'].get('P2', 0)}",
        "",
        "## City overview",
        "",
        "| City | P0 | P1 | P2 | Most frequent issue |",
        "|---|---:|---:|---:|---|",
    ]
    for city in report["cities"]:
        counts = city["severity_counts"]
        lines.append(f"| {city['city']} | {counts.get('P0', 0)} | {counts.get('P1', 0)} | {counts.get('P2', 0)} | {city['top_issue'] or '-'} |")

    lines.extend(["", "## Priority findings", ""])
    priority = [issue for issue in report["issues"] if issue["severity"] in {"P0", "P1"}]
    if not priority:
        lines.append("No P0 or P1 findings.")
    for issue in priority[:250]:
        context = f"{issue['city']} / {issue['mode']}"
        if issue.get("profile"):
            context += f" / {issue['profile']}"
        if issue.get("days"):
            context += f" / {issue['days']} days"
        if issue.get("day"):
            context += f" / day {issue['day']}"
        lines.append(f"- **{issue['severity']} {issue['code']}** - {context}: {issue['message']}")
    if len(priority) > 250:
        lines.append(f"- ... {len(priority) - 250} additional P0/P1 findings are available in the JSON report.")

    lines.extend(["", "## Quality patterns", ""])
    code_counts = Counter(issue["code"] for issue in report["issues"] if issue["severity"] == "P2")
    if not code_counts:
        lines.append("No P2 findings.")
    for code, count in code_counts.most_common():
        lines.append(f"- `{code}`: {count}")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--city", action="append", dest="cities", help="Audit one city; repeat as needed")
    parser.add_argument("--output-dir", default=str(BACKEND_DIR / "reports"), help="Report destination")
    parser.add_argument("--fail-on", choices=("none", "P0", "P1", "P2"), default="none")
    args = parser.parse_args()

    requested_cities = [city.lower().strip() for city in (args.cities or sorted(CITY_BY_ID))]
    unknown = [city for city in requested_cities if city not in CITY_BY_ID]
    if unknown:
        parser.error(f"Unknown cities: {', '.join(unknown)}")

    started = perf_counter()
    scenarios: list[Scenario] = []
    comparisons: list[Issue] = []
    for city_index, city in enumerate(requested_cities, start=1):
        attractions = localize_attractions(city, city_items(city, "ATTRACTIONS"))
        food_spots = localize_attractions(city, city_items(city, "FOOD_SPOTS"))
        annotated = annotate_must_see_many(attractions)
        must_see = sorted(
            [item for item in annotated if item.get("must_see")],
            key=lambda item: (item.get("must_see_rank") or 999, item.get("id") or 0),
        )
        must_see_ids = {int(item["id"]) for item in must_see if item.get("id") is not None}
        top_must_see_id = int(must_see[0]["id"]) if must_see and must_see[0].get("id") is not None else None
        city_scenarios: list[Scenario] = []
        for mode, level in MODES.items():
            for profile_name, max_walk_km in PROFILES.items():
                for days in range(1, MAX_DAYS[mode] + 1):
                    scenario = audit_scenario(city, mode, level, profile_name, max_walk_km, days, attractions, food_spots, must_see_ids, top_must_see_id)
                    scenarios.append(scenario)
                    city_scenarios.append(scenario)
        comparisons.extend(comparison_issues(city, city_scenarios))
        print(f"[{city_index:02d}/{len(requested_cities):02d}] {city}: {len(city_scenarios)} scenarios")

    all_issues = [issue for scenario in scenarios for issue in scenario.issues] + comparisons
    all_issues.sort(key=lambda issue: (SEVERITY_ORDER[issue.severity], issue.city, issue.code, issue.days or 0, issue.day or 0))
    severity_counts = Counter(issue.severity for issue in all_issues)
    issue_counts_by_city: dict[str, Counter[str]] = defaultdict(Counter)
    code_counts_by_city: dict[str, Counter[str]] = defaultdict(Counter)
    for issue in all_issues:
        issue_counts_by_city[issue.city][issue.severity] += 1
        code_counts_by_city[issue.city][issue.code] += 1

    runtime_seconds = round(perf_counter() - started, 2)
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "configuration": {"profiles": PROFILES, "modes": MODES, "max_days": MAX_DAYS},
        "summary": {
            "cities": len(requested_cities),
            "scenarios": len(scenarios),
            "runtime_seconds": runtime_seconds,
            "severity_counts": dict(severity_counts),
            "issue_code_counts": dict(Counter(issue.code for issue in all_issues)),
        },
        "cities": [
            {
                "city": city,
                "severity_counts": dict(issue_counts_by_city[city]),
                "top_issue": code_counts_by_city[city].most_common(1)[0][0] if code_counts_by_city[city] else None,
            }
            for city in requested_cities
        ],
        "issues": [asdict(issue) for issue in all_issues],
        "scenarios": [
            {
                **{key: value for key, value in asdict(scenario).items() if key != "issues"},
                "issues": [asdict(issue) for issue in scenario.issues],
            }
            for scenario in scenarios
        ],
    }

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / "itinerary_audit_latest.json"
    markdown_path = output_dir / "itinerary_audit_latest.md"
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    markdown_path.write_text(markdown_report(report), encoding="utf-8")
    print(f"Wrote {json_path}")
    print(f"Wrote {markdown_path}")
    print(f"Issues: P0={severity_counts.get('P0', 0)} P1={severity_counts.get('P1', 0)} P2={severity_counts.get('P2', 0)}")

    if args.fail_on == "none":
        return 0
    threshold = SEVERITY_ORDER[args.fail_on]
    return 1 if any(SEVERITY_ORDER[issue.severity] <= threshold for issue in all_issues) else 0


if __name__ == "__main__":
    raise SystemExit(main())
