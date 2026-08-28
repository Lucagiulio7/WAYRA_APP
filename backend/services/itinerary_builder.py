"""
Deterministic itinerary builder — no AI, no external APIs.

Pipeline:
  filter_attractions
  → split_days   (block-aware: group by block_id → merge blocks into days by time budget)
  → order_day    (2-opt refinement within each day)
  → generate_maps_link
"""
import math
import re
import unicodedata
from urllib.parse import quote
from collections import defaultdict
from itertools import combinations
from typing import Optional

from services.must_see import annotate_must_see_many

MAX_DAILY_MINUTES     = 420   # 7 hours max of attraction time per day
MIN_DAILY_MINUTES     = 300   # 5 hours min of attraction time per day
MAX_DAILY_ATTRACTIONS = 10    # hard safety cap (meals excluded)
MIN_DAILY_ATTRACTIONS = 4     # fallback soft floor
MAX_MUSEUMS_PER_DAY   = 2     # no more than 2 museums per day
MAX_DAILY_WALK_KM     = 4.0   # max walking route distance per day
BACKUP_MAX_KM         = 5.0   # max distance to pull a backup attraction into the afternoon slot
CLUSTER_RADIUS_KM     = 1.5   # proximity radius for the isolation check
MIN_CLUSTER_NEIGHBORS = 2     # minimum other attractions within CLUSTER_RADIUS_KM to be included


EFFORT_PROFILES = {
    "relaxed": {
        "mode": "relaxed",
        "min_minutes": 240,
        "target_minutes": 300,
        "max_minutes": 330,
        "min_attractions": 4,
        "max_attractions": 5,
        "stop_after_min_extra": 1,
    },
    "balanced": {
        "mode": "balanced",
        "min_minutes": 300,
        "target_minutes": 360,
        "max_minutes": 390,
        "min_attractions": 5,
        "max_attractions": 6,
        "stop_after_min_extra": 1,
    },
    "intense": {
        "mode": "intense",
        "min_minutes": 360,
        "target_minutes": 390,
        "max_minutes": MAX_DAILY_MINUTES,
        "min_attractions": 6,
        "max_attractions": 8,
        "stop_after_min_extra": 2,
    },
}


def _effort_profile(max_walk_km: float) -> dict:
    """Return the canonical effort profile selected by the walking limit."""
    if max_walk_km <= 3:
        return dict(EFFORT_PROFILES["relaxed"])
    if max_walk_km <= 5:
        return dict(EFFORT_PROFILES["balanced"])
    return dict(EFFORT_PROFILES["intense"])

def _day_limits(max_walk_km: float) -> tuple[int, int]:
    """Return min/max attraction count for the selected walking mode."""
    profile = _effort_profile(max_walk_km)
    return profile["min_attractions"], profile["max_attractions"]


def _min_daily_minutes(max_walk_km: float) -> int:
    return _effort_profile(max_walk_km)["min_minutes"]


def _target_daily_minutes(max_walk_km: float) -> int:
    return _effort_profile(max_walk_km)["target_minutes"]


def _max_daily_minutes(max_walk_km: float) -> int:
    return _effort_profile(max_walk_km)["max_minutes"]


def _is_must_see(attraction: dict) -> bool:
    return bool(attraction.get("must_see"))


def _must_see_rank(attraction: dict) -> int:
    rank = attraction.get("must_see_rank")
    return rank if isinstance(rank, int) else 999


def _name_key(attraction: dict) -> str:
    text = attraction.get("name") or attraction.get("name_en") or ""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


# ── Geo utilities ─────────────────────────────────────────────────────────────

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def walking_distance_factor(straight_km: float) -> float:
    if straight_km > 2:
        return 1.1
    if straight_km > 1:
        return 1.15
    if straight_km > 0.5:
        return 1.3
    if straight_km > 0.3:
        return 1.4
    return 1.5


def walking_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    straight_km = haversine_km(lat1, lon1, lat2, lon2)
    return straight_km * walking_distance_factor(straight_km)


def _route_distance(route: list[dict]) -> float:
    return sum(
        walking_km(
            route[i]["latitude"], route[i]["longitude"],
            route[i + 1]["latitude"], route[i + 1]["longitude"],
        )
        for i in range(len(route) - 1)
    )


def _two_opt(route: list[dict]) -> list[dict]:
    """
    Return the shortest open walking path for a day's stops.

    The old 2-opt pass preserved too much of the input order, so a day could
    still bounce between nearby areas. Day sizes are small, so an exact
    Held-Karp dynamic program gives a stable shortest path without fixing
    start/end points.
    """
    n = len(route)
    if n <= 2:
        return list(route)
    if n > 11:
        return _nearest_open_route(route)

    dist = [
        [
            haversine_km(a["latitude"], a["longitude"], b["latitude"], b["longitude"])
            for b in route
        ]
        for a in route
    ]
    size = 1 << n
    dp = [[float("inf")] * n for _ in range(size)]
    parent = [[-1] * n for _ in range(size)]

    for i in range(n):
        dp[1 << i][i] = 0.0

    for mask in range(size):
        for last in range(n):
            current = dp[mask][last]
            if current == float("inf"):
                continue
            for nxt in range(n):
                if mask & (1 << nxt):
                    continue
                nxt_mask = mask | (1 << nxt)
                candidate = current + dist[last][nxt]
                if candidate < dp[nxt_mask][nxt]:
                    dp[nxt_mask][nxt] = candidate
                    parent[nxt_mask][nxt] = last

    full = size - 1
    last = min(range(n), key=lambda i: dp[full][i])
    order: list[int] = []
    mask = full
    while last != -1:
        order.append(last)
        prev = parent[mask][last]
        mask ^= 1 << last
        last = prev
    order.reverse()
    return [route[i] for i in order]


def _nearest_open_route(route: list[dict]) -> list[dict]:
    """Fallback for unexpectedly large days."""
    best: list[dict] = []
    best_dist = float("inf")
    for start in route:
        remaining = [a for a in route if a is not start]
        ordered = [start]
        while remaining:
            cur = ordered[-1]
            nxt = min(
                remaining,
                key=lambda a: haversine_km(cur["latitude"], cur["longitude"], a["latitude"], a["longitude"]),
            )
            ordered.append(nxt)
            remaining.remove(nxt)
        distance = _route_distance(ordered)
        if distance < best_dist:
            best = ordered
            best_dist = distance
    return best


def _optimized_distance(attractions: list[dict]) -> float:
    return _route_distance(_two_opt(list(attractions)))


def _preferred_walking_leg_km(max_walk_km: float) -> float:
    if max_walk_km <= 3:
        return 1.75
    if max_walk_km <= 5:
        return 2.25
    return 2.75


def _route_mobility(day: list[dict], max_walk_km: float) -> tuple[float, int]:
    """Return actual walking distance and internal transfer count."""
    ordered = _two_opt(list(day))
    threshold = _preferred_walking_leg_km(max_walk_km)
    walking_distance = 0.0
    transfers = 0
    for first, second in zip(ordered, ordered[1:]):
        distance = walking_km(
            first["latitude"], first["longitude"],
            second["latitude"], second["longitude"],
        )
        if distance > threshold:
            transfers += 1
        else:
            walking_distance += distance
    return walking_distance, transfers


def _route_fits_mobility(day: list[dict], max_walk_km: float) -> bool:
    walking_distance, transfers = _route_mobility(day, max_walk_km)
    return walking_distance <= max_walk_km and transfers <= 1


def _can_add_to_day(day: list[dict], candidate: dict, max_walk_km: float = MAX_DAILY_WALK_KM) -> bool:
    profile = _effort_profile(max_walk_km)
    if any(a["id"] == candidate["id"] for a in day):
        return False
    nxt = [*day, candidate]
    if len(nxt) > profile["max_attractions"]:
        return False
    if _day_minutes(nxt) > profile["max_minutes"]:
        return False
    if _museum_count(nxt) > MAX_MUSEUMS_PER_DAY:
        return False
    return _route_fits_mobility(nxt, max_walk_km)

def _pick_removal_index(day: list[dict]) -> int:
    current_distance = _optimized_distance(day)
    current_minutes = _day_minutes(day)
    best_index = 0
    best_score = float("-inf")

    for i, attraction in enumerate(day):
        candidate = [a for idx, a in enumerate(day) if idx != i]
        distance_gain = current_distance - _optimized_distance(candidate)
        minutes_gain = current_minutes - _day_minutes(candidate)
        museum_penalty = (
            1000
            if _museum_count(day) > MAX_MUSEUMS_PER_DAY
            and "muse" in (attraction.get("attraction_type") or "").lower()
            else 0
        )
        score = museum_penalty + distance_gain * 100 + minutes_gain / 10
        if _is_must_see(attraction):
            score -= 5000 + max(0, 120 - _must_see_rank(attraction) * 10)
        if score > best_score:
            best_score = score
            best_index = i

    return best_index


def _order_from(reference: dict, attractions: list[dict]) -> list[dict]:
    """Nearest-neighbour starting from an external reference point."""
    if not attractions:
        return []
    remaining = list(attractions)
    ordered: list[dict] = []
    cur_lat = reference["latitude"]
    cur_lon = reference["longitude"]
    while remaining:
        nearest = min(
            remaining,
            key=lambda a: haversine_km(cur_lat, cur_lon, a["latitude"], a["longitude"]),
        )
        ordered.append(nearest)
        remaining.remove(nearest)
        cur_lat, cur_lon = nearest["latitude"], nearest["longitude"]
    return ordered


# ── Step 1: filter ────────────────────────────────────────────────────────────

def filter_attractions(attractions: list[dict], level: int | list[int]) -> list[dict]:
    """
    Return attractions matching the requested level(s) that are NOT isolated.

    An attraction is isolated if it has fewer than MIN_CLUSTER_NEIGHBORS other
    non-food attractions within CLUSTER_RADIUS_KM — regardless of level.
    """
    levels = level if isinstance(level, list) else [level]

    all_non_food = [a for a in attractions if not a.get("is_food_spot")]

    def _neighbors(a: dict) -> int:
        return sum(
            1 for b in all_non_food
            if b["id"] != a["id"]
            and haversine_km(
                a["latitude"], a["longitude"],
                b["latitude"], b["longitude"],
            ) <= CLUSTER_RADIUS_KM
        )

    return [
        a for a in attractions
        if not a.get("is_food_spot")
        and a["category_level"] in levels
        and _neighbors(a) >= MIN_CLUSTER_NEIGHBORS
    ]


# ── Step 2: split into days (block-aware, time/count only) ───────────────────

def _day_minutes(day: list[dict]) -> int:
    return sum(a.get("estimated_visit_time") or 0 for a in day)


def _museum_count(attractions: list[dict]) -> int:
    return sum(1 for a in attractions if "muse" in (a.get("attraction_type") or "").lower())


def split_days(attractions: list[dict], num_days: int, max_walk_km: float = MAX_DAILY_WALK_KM) -> list[list[dict]]:
    """
    Block-aware day builder — splits by time/count only.
    Museum balancing is handled separately by _rebalance_museums.
    Mirrors the TypeScript splitDays logic exactly.
    """
    if not attractions:
        return []
    min_attractions, max_attractions = _day_limits(max_walk_km)

    by_block: dict[int, list[dict]] = defaultdict(list)
    for a in attractions:
        block = a.get("block_id") or 0
        by_block[block].append(a)

    ordered_blocks = sorted(by_block.keys())
    num_blocks = len(ordered_blocks)
    days: list[list[dict]] = []
    current_day: list[dict] = []

    for i, block_id in enumerate(ordered_blocks):
        block_attrs  = by_block[block_id]
        slots_left   = num_days - len(days)
        blocks_after = num_blocks - i - 1

        new_count   = len(current_day) + len(block_attrs)
        new_minutes = _day_minutes(current_day) + _day_minutes(block_attrs)
        hit_max     = new_count > max_attractions or new_minutes > MAX_DAILY_MINUTES
        met_min     = (_day_minutes(current_day) >= MIN_DAILY_MINUTES
                       and len(current_day) >= min_attractions)

        if current_day and (hit_max or met_min) and slots_left > 1 and blocks_after > 0:
            days.append(list(current_day))
            current_day = []

        current_day.extend(block_attrs)

    if current_day and len(days) < num_days:
        days.append(current_day)

    return [d for d in days if d]


# ── Step 2b: cap days by time / count hard limits ────────────────────────────

def _cap_days_by_limits(days: list[list[dict]], max_walk_km: float = MAX_DAILY_WALK_KM) -> tuple[list[list[dict]], list[dict]]:
    """
    Trim each day so that it never exceeds MAX_DAILY_ATTRACTIONS or
    MAX_DAILY_MINUTES. Excess attractions are dropped here; they will be
    picked up by the backup pool in build_itinerary (they are not in
    assigned_ids so the general backup sweep collects them).
    """
    result = []
    overflow: list[dict] = []
    min_attractions, max_attractions = _day_limits(max_walk_km)
    min_minutes = _min_daily_minutes(max_walk_km)
    max_minutes = _max_daily_minutes(max_walk_km)
    for day in days:
        kept = list(day)
        while True:
            over_time = _day_minutes(kept) > max_minutes
            over_museums = _museum_count(kept) > MAX_MUSEUMS_PER_DAY
            over_distance = not _route_fits_mobility(kept, max_walk_km)
            over_soft_count = len(kept) > max_attractions and len(kept) > min_attractions
            if not (over_time or over_museums or over_distance or over_soft_count):
                break
            if len(kept) <= 1:
                break
            removal_index = _pick_removal_index(kept)
            candidate_day = [a for idx, a in enumerate(kept) if idx != removal_index]
            if over_time and not (over_museums or over_distance) and len(candidate_day) < min_attractions:
                break
            if over_time and not (over_museums or over_distance) and _day_minutes(candidate_day) < min_minutes:
                break
            if (
                over_soft_count
                and not (over_time or over_museums or over_distance)
                and _day_minutes(candidate_day) < min_minutes
            ):
                break
            removed = kept.pop(removal_index)
            overflow.append(removed)
        result.append(_two_opt(kept))
    return result, overflow


# ── Step 2c: rebalance museums (max 1 per day) ────────────────────────────────

def _ensure_day_count(days: list[list[dict]], num_days: int) -> list[list[dict]]:
    result = [list(day) for day in days if day]
    while len(result) < num_days:
        split_idx = max(
            range(len(result)),
            key=lambda i: (len(result[i]), _day_minutes(result[i])),
            default=-1,
        )
        if split_idx < 0 or len(result[split_idx]) <= 1:
            break
        day = result[split_idx]
        cut = max(1, len(day) // 2)
        result[split_idx] = day[:cut]
        result.insert(split_idx + 1, day[cut:])
    return result[:num_days]


def _rebalance_museums(days: list[list[dict]], max_walk_km: float = MAX_DAILY_WALK_KM) -> tuple[list[list[dict]], list[dict]]:
    """
    Mirrors TypeScript rebalanceMuseums.
    Removes museums exceeding MAX_MUSEUMS_PER_DAY from each day,
    tries to place them in days with room, returns any unplaceable ones as freed.
    """
    result = [list(day) for day in days]
    overflow: list[dict] = []
    min_attractions, max_attractions = _day_limits(max_walk_km)
    min_minutes = _min_daily_minutes(max_walk_km)
    max_minutes = _max_daily_minutes(max_walk_km)

    # Pass 1: collect excess museums
    for day in result:
        count = 0
        keep: list[dict] = []
        for a in day:
            if "muse" in (a.get("attraction_type") or "").lower():
                if count < MAX_MUSEUMS_PER_DAY:
                    keep.append(a)
                    count += 1
                elif _is_must_see(a):
                    replace_index = next(
                        (
                            i for i, kept in enumerate(keep)
                            if "muse" in (kept.get("attraction_type") or "").lower()
                            and not _is_must_see(kept)
                        ),
                        None,
                    )
                    if replace_index is not None:
                        overflow.append(keep[replace_index])
                        keep[replace_index] = a
                    else:
                        overflow.append(a)
                else:
                    overflow.append(a)
            else:
                keep.append(a)
        day[:] = keep

    # Pass 2: place overflow into days with a free museum slot
    freed: list[dict] = []
    for museum in overflow:
        placed = False
        for day in result:
            if (
                _museum_count(day) < MAX_MUSEUMS_PER_DAY
                and (
                    len(day) < max_attractions
                    or len(day) < min_attractions
                    or _day_minutes(day) < min_minutes
                )
                and _day_minutes(day) + (museum.get("estimated_visit_time") or 60) <= max_minutes
            ):
                day.append(museum)
                placed = True
                break
        if not placed:
            freed.append(museum)

    return result, freed


# ── Step 2c: fill thin days (< MIN_DAILY_ATTRACTIONS) from backup pool ────────

def _fill_thin_days(
    days: list[list[dict]],
    backup: list[dict],
    max_walk_km: float = MAX_DAILY_WALK_KM,
) -> tuple[list[list[dict]], list[dict]]:
    """
    Per ogni giorno sotto la soglia minima, pesca dal backup pool (ordinato
    per prossimità al centroide del giorno) finché il giorno raggiunge il
    target di tempo/conteggio o il pool si esaurisce.

    Strategia ROUND-ROBIN: invece di riempire un giorno completamente prima
    di passare al successivo, fa più "giri" — in ogni giro aggiunge UNA tappa
    per ogni giorno sotto soglia. Questo evita che i primi giorni si
    "mangino" tutto il backup vicino al centro, lasciando i giorni
    periferici con poche tappe.

    Returns (updated_days, remaining_backup).
    """
    result = [list(day) for day in days]
    used_ids: set[int] = set()
    min_attractions, max_attractions = _day_limits(max_walk_km)
    min_minutes = _min_daily_minutes(max_walk_km)
    target_minutes = _target_daily_minutes(max_walk_km)
    profile = _effort_profile(max_walk_km)

    def _needs_more(d: list[dict]) -> bool:
        if not d:
            return False  # giorno vuoto: skip (centroide non calcolabile)
        return len(d) < min_attractions or _day_minutes(d) < min_minutes

    # PASS A — round robin: aggiungi 1 tappa per giorno magro a ogni giro,
    # finché tutti i giorni raggiungono almeno `min_attractions`.
    max_rounds = min_attractions + 4  # safety cap
    for _ in range(max_rounds):
        any_added = False
        for day in result:
            if not day:
                continue
            if len(day) >= min_attractions:
                continue
            c_lat = sum(a["latitude"] for a in day) / len(day)
            c_lon = sum(a["longitude"] for a in day) / len(day)
            available = sorted(
                [a for a in backup if a["id"] not in used_ids and not a.get("is_food_spot")],
                key=lambda a: (
                    0 if _is_must_see(a) else 1,
                    _must_see_rank(a),
                    haversine_km(c_lat, c_lon, a["latitude"], a["longitude"]),
                ),
            )
            for candidate in available:
                if _can_add_to_day(day, candidate, max_walk_km):
                    day.append(candidate)
                    used_ids.add(candidate["id"])
                    any_added = True
                    break
        if not any_added:
            break

    # PASS B — i giorni che hanno il count minimo ma sono ancora corti di minuti
    # possono pescare attrazioni aggiuntive (più gradualmente di prima per non
    # sbilanciare). Limite: massimo 2 tappe extra oltre min_attractions.
    for day in result:
        if not day or _day_minutes(day) >= target_minutes:
            continue
        c_lat = sum(a["latitude"] for a in day) / len(day)
        c_lon = sum(a["longitude"] for a in day) / len(day)
        available = sorted(
            [a for a in backup if a["id"] not in used_ids and not a.get("is_food_spot")],
            key=lambda a: (
                0 if _is_must_see(a) else 1,
                _must_see_rank(a),
                haversine_km(c_lat, c_lon, a["latitude"], a["longitude"]),
            ),
        )
        for candidate in available:
            if _day_minutes(day) >= target_minutes:
                break
            if len(day) >= MAX_DAILY_ATTRACTIONS:
                break
            if len(day) >= max_attractions and _day_minutes(day) >= min_minutes:
                break
            if not _can_add_to_day(day, candidate, max_walk_km):
                continue
            day.append(candidate)
            used_ids.add(candidate["id"])

    remaining = [a for a in backup if a["id"] not in used_ids]
    return result, remaining


# ── Step 3: 2-opt refinement within each day ─────────────────────────────────
def _day_satisfies_hard_limits(day: list[dict], max_walk_km: float) -> bool:
    min_attractions, _max_attractions = _day_limits(max_walk_km)
    min_minutes = _min_daily_minutes(max_walk_km)
    max_minutes = _max_daily_minutes(max_walk_km)
    return (
        len(day) >= min_attractions
        and _day_minutes(day) >= min_minutes
        and _day_minutes(day) <= max_minutes
        and _museum_count(day) <= MAX_MUSEUMS_PER_DAY
        and _route_fits_mobility(day, max_walk_km)
    )


def _repair_underfilled_days_by_moving(
    days: list[list[dict]],
    max_walk_km: float = MAX_DAILY_WALK_KM,
) -> list[list[dict]]:
    """Move compatible stops from healthy days into underfilled days."""
    result = [list(day) for day in days]

    for target_index, target_day in enumerate(result):
        if not target_day:
            continue
        while (
            len(target_day) < _day_limits(max_walk_km)[0]
            or _day_minutes(target_day) < _min_daily_minutes(max_walk_km)
        ):
            options: list[tuple[float, int, int, dict]] = []
            for donor_index, donor_day in enumerate(result):
                if donor_index == target_index:
                    continue
                for attraction_index, attraction in enumerate(donor_day):
                    if not _can_add_to_day(target_day, attraction, max_walk_km):
                        continue
                    donor_after = [
                        item for index, item in enumerate(donor_day)
                        if index != attraction_index
                    ]
                    if not _day_satisfies_hard_limits(donor_after, max_walk_km):
                        continue
                    target_after = [*target_day, attraction]
                    score = (
                        (0 if not _is_must_see(attraction) else 1) * 10000
                        - (attraction.get("estimated_visit_time") or 0) * 10
                        + _optimized_distance(target_after) * 100
                    )
                    options.append((score, donor_index, attraction_index, attraction))

            if not options:
                break

            _score, donor_index, attraction_index, attraction = min(options, key=lambda item: item[0])
            result[donor_index].pop(attraction_index)
            target_day.append(attraction)

    return [_two_opt(day) for day in result]


def order_day(attractions: list[dict]) -> list[dict]:
    """2-opt pass to minimise walking distance within the day's attractions."""
    if len(attractions) <= 1:
        return list(attractions)
    return _two_opt(list(attractions))


def _max_route_leg(day: list[dict]) -> float:
    ordered = _two_opt(list(day))
    if len(ordered) < 2:
        return 0.0
    return max(
        walking_km(
            ordered[index]["latitude"], ordered[index]["longitude"],
            ordered[index + 1]["latitude"], ordered[index + 1]["longitude"],
        )
        for index in range(len(ordered) - 1)
    )


def _geographic_day_score(day: list[dict], max_walk_km: float) -> float:
    """Prefer compact days and strongly discourage a single transfer-like walk."""
    preferred_leg = {"relaxed": 1.25, "balanced": 1.75, "intense": 2.25}[
        _effort_profile(max_walk_km)["mode"]
    ]
    longest_leg = _max_route_leg(day)
    return _optimized_distance(day) + max(0.0, longest_leg - preferred_leg) ** 2 * 4.0


def _fast_geographic_day_score(day: list[dict], max_walk_km: float) -> float:
    """Cheap approximation used to shortlist swaps before exact routing."""
    ordered = _nearest_open_route(list(day)) if len(day) > 2 else list(day)
    route_distance = _route_distance(ordered)
    longest_leg = max(
        (
            walking_km(
                ordered[index]["latitude"], ordered[index]["longitude"],
                ordered[index + 1]["latitude"], ordered[index + 1]["longitude"],
            )
            for index in range(len(ordered) - 1)
        ),
        default=0.0,
    )
    preferred_leg = {"relaxed": 1.25, "balanced": 1.75, "intense": 2.25}[
        _effort_profile(max_walk_km)["mode"]
    ]
    return route_distance + max(0.0, longest_leg - preferred_leg) ** 2 * 4.0


def _rebalance_day_geography(
    days: list[list[dict]],
    max_walk_km: float,
    requested_level: int | list[int],
) -> list[list[dict]]:
    """Swap selected stops across days when that creates more compact routes.

    The selected attraction set is preserved. A swap is accepted only when
    both resulting days still satisfy all hard constraints and do not lose a
    previously satisfied duration or explorer-discovery floor.
    """
    result = [list(day) for day in days]
    explorer = any(level >= 2 for level in _level_values(requested_level))
    min_minutes = _min_daily_minutes(max_walk_km)

    def discovery_ok(before: list[dict], after: list[dict]) -> bool:
        if not explorer:
            return True
        before_has = any((item.get("category_level") or 1) in {2, 3} for item in before)
        after_has = any((item.get("category_level") or 1) in {2, 3} for item in after)
        return not before_has or after_has

    for _ in range(6):
        best: tuple[float, int, int, int, int, list[dict], list[dict]] | None = None
        shortlist: list[tuple[float, int, int, int, int, list[dict], list[dict]]] = []
        fast_scores = [_fast_geographic_day_score(day, max_walk_km) for day in result]
        for left_index, right_index in combinations(range(len(result)), 2):
            left = result[left_index]
            right = result[right_index]
            fast_baseline = fast_scores[left_index] + fast_scores[right_index]
            for left_stop_index, left_stop in enumerate(left):
                for right_stop_index, right_stop in enumerate(right):
                    left_after = [
                        right_stop if index == left_stop_index else item
                        for index, item in enumerate(left)
                    ]
                    right_after = [
                        left_stop if index == right_stop_index else item
                        for index, item in enumerate(right)
                    ]
                    if _day_minutes(left) >= min_minutes and _day_minutes(left_after) < min_minutes:
                        continue
                    if _day_minutes(right) >= min_minutes and _day_minutes(right_after) < min_minutes:
                        continue
                    if not discovery_ok(left, left_after) or not discovery_ok(right, right_after):
                        continue

                    fast_improvement = fast_baseline - (
                        _fast_geographic_day_score(left_after, max_walk_km)
                        + _fast_geographic_day_score(right_after, max_walk_km)
                    )
                    if fast_improvement <= 0.02:
                        continue
                    shortlist.append((
                        fast_improvement,
                        left_index,
                        right_index,
                        left_stop_index,
                        right_stop_index,
                        left_after,
                        right_after,
                    ))

        exact_scores = [_geographic_day_score(day, max_walk_km) for day in result]
        for option in sorted(shortlist, key=lambda item: item[0], reverse=True)[:24]:
            _, left_index, right_index, left_stop_index, right_stop_index, left_after, right_after = option
            if not _fits_hard_constraints(left_after, max_walk_km):
                continue
            if not _fits_hard_constraints(right_after, max_walk_km):
                continue
            improvement = (
                exact_scores[left_index]
                + exact_scores[right_index]
                - _geographic_day_score(left_after, max_walk_km)
                - _geographic_day_score(right_after, max_walk_km)
            )
            if improvement <= 0.05:
                continue
            exact_option = (
                improvement,
                left_index,
                right_index,
                left_stop_index,
                right_stop_index,
                left_after,
                right_after,
            )
            if best is None or exact_option[0] > best[0]:
                best = exact_option
        if best is None:
            break
        _, left_index, right_index, _, _, left_after, right_after = best
        result[left_index] = left_after
        result[right_index] = right_after

    return [order_day(day) for day in result]


def _rebalance_day_workload(
    days: list[list[dict]],
    max_walk_km: float,
    requested_level: int | list[int],
) -> list[list[dict]]:
    """Even out long itineraries without changing their selected attractions."""
    result = [list(day) for day in days]
    if len(result) < 2:
        return result

    profile = _effort_profile(max_walk_km)
    total_stops = sum(len(day) for day in result)
    total_minutes = sum(_day_minutes(day) for day in result)
    minimum_stops = profile["min_attractions"]
    achievable_minutes = (total_minutes // len(result) // 10) * 10
    minimum_minutes = min(profile["min_minutes"], achievable_minutes)
    target_minutes = total_minutes / len(result)
    explorer = any(level >= 2 for level in _level_values(requested_level))

    def discovery_ok(before: list[dict], after: list[dict]) -> bool:
        if not explorer:
            return True
        before_has = any((item.get("category_level") or 1) in {2, 3} for item in before)
        after_has = any((item.get("category_level") or 1) in {2, 3} for item in after)
        return not before_has or after_has

    def workload_score(candidate_days: list[list[dict]]) -> float:
        minutes = [_day_minutes(day) for day in candidate_days]
        counts = [len(day) for day in candidate_days]
        count_deficit = sum(max(0, minimum_stops - count) ** 2 for count in counts)
        minute_deficit = sum(max(0, minimum_minutes - value) ** 2 for value in minutes)
        uneven_time = max(0, max(minutes) - min(minutes) - 60) ** 2
        target_gap = sum(abs(value - target_minutes) for value in minutes)
        return count_deficit * 100000 + minute_deficit * 100 + uneven_time * 20 + target_gap

    if (
        max(len(day) for day in result) - min(len(day) for day in result) <= 2
        and max(_day_minutes(day) for day in result) - min(_day_minutes(day) for day in result) <= 60
    ):
        return [order_day(day) for day in result]

    for _ in range(18):
        baseline = workload_score(result)
        best: tuple[float, list[list[dict]]] | None = None

        # Moves repair count imbalances such as an 8-stop day next to a
        # geographically valid 4- or 5-stop day.
        for donor_index, donor in enumerate(result):
            for recipient_index, recipient in enumerate(result):
                if donor_index == recipient_index or len(donor) <= 1:
                    continue
                for stop_index, stop in enumerate(donor):
                    donor_after = [item for index, item in enumerate(donor) if index != stop_index]
                    recipient_after = [*recipient, stop]
                    projected_score = workload_score([
                        donor_after if index == donor_index
                        else recipient_after if index == recipient_index
                        else day
                        for index, day in enumerate(result)
                    ])
                    if projected_score >= baseline - 0.01:
                        continue
                    if not discovery_ok(donor, donor_after):
                        continue
                    if not _fits_hard_constraints(donor_after, max_walk_km):
                        continue
                    if not _fits_hard_constraints(recipient_after, max_walk_km):
                        continue
                    projected = [list(day) for day in result]
                    projected[donor_index] = donor_after
                    projected[recipient_index] = recipient_after
                    if best is None or projected_score < best[0]:
                        best = (projected_score, projected)

        # Swaps keep counts stable while exchanging a long and a short visit.
        for left_index, right_index in combinations(range(len(result)), 2):
            left = result[left_index]
            right = result[right_index]
            for left_stop_index, left_stop in enumerate(left):
                for right_stop_index, right_stop in enumerate(right):
                    if (left_stop.get("estimated_visit_time") or 0) == (right_stop.get("estimated_visit_time") or 0):
                        continue
                    left_after = [
                        right_stop if index == left_stop_index else item
                        for index, item in enumerate(left)
                    ]
                    right_after = [
                        left_stop if index == right_stop_index else item
                        for index, item in enumerate(right)
                    ]
                    projected_score = workload_score([
                        left_after if index == left_index
                        else right_after if index == right_index
                        else day
                        for index, day in enumerate(result)
                    ])
                    if projected_score >= baseline - 0.01:
                        continue
                    if not discovery_ok(left, left_after) or not discovery_ok(right, right_after):
                        continue
                    if not _fits_hard_constraints(left_after, max_walk_km):
                        continue
                    if not _fits_hard_constraints(right_after, max_walk_km):
                        continue
                    projected = [list(day) for day in result]
                    projected[left_index] = left_after
                    projected[right_index] = right_after
                    if best is None or projected_score < best[0]:
                        best = (projected_score, projected)

        if best is None:
            break
        result = best[1]

    return [order_day(day) for day in result]


# ── Step 4: insert meal stops ─────────────────────────────────────────────────

def _find_nearest_food(
    reference: dict,
    food_spots: list[dict],
    meal_type: str,
    used_ids: set[int],
) -> Optional[dict]:
    candidates = [
        f for f in food_spots
        if f["id"] not in used_ids and f.get("meal_type") in (meal_type, "both")
    ]
    if not candidates:
        candidates = [f for f in food_spots if f["id"] not in used_ids]
    if not candidates:
        return None
    return min(
        candidates,
        key=lambda f: haversine_km(
            reference["latitude"], reference["longitude"],
            f["latitude"], f["longitude"],
        ),
    )


def _free_time(ref: dict, minutes: int = 60) -> dict:
    return {
        "id": -1,
        "type": "free_time",
        "name": "Tempo libero",
        "description": "Esplora la zona a piedi, siediti in un bar locale o entra in una chiesa aperta.",
        "latitude": ref["latitude"],
        "longitude": ref["longitude"],
        "estimated_visit_time": minutes,
        "tags": ["relax"],
        "category_level": 0,
        "zone": ref.get("zone"),
        "is_food_spot": False,
        "city": ref.get("city", "roma"),
        "food_type": None,
        "meal_type": None,
        "rating": None,
    }


def _meal_slot(ref: dict, meal_type: str) -> dict:
    is_lunch = meal_type == "lunch"
    return {
        "id": -201 if is_lunch else -202,
        "type": "meal",
        "name": "Pranzo da scegliere" if is_lunch else "Cena da scegliere",
        "description": (
            "Tocca lo slot per scegliere sulla mappa un posto dove pranzare vicino alle tappe della mattina."
            if is_lunch
            else "Tocca lo slot per scegliere sulla mappa un posto dove cenare vicino alle tappe della giornata."
        ),
        "latitude": ref["latitude"],
        "longitude": ref["longitude"],
        "estimated_visit_time": 75 if is_lunch else 90,
        "tags": ["cibo"],
        "category_level": 0,
        "zone": ref.get("zone"),
        "is_food_spot": True,
        "city": ref.get("city", "roma"),
        "food_type": None,
        "meal_type": meal_type,
        "rating": None,
        "empty_meal_slot": True,
        "meal": meal_type,
    }


def _split_day_around_lunch(day: list[dict]) -> tuple[list[dict], list[dict]]:
    """Split attractions so morning/afternoon visit time stays balanced."""
    if len(day) <= 1:
        return list(day), []

    morning: list[dict] = []
    afternoon: list[dict] = []
    morning_minutes = 0
    afternoon_minutes = 0

    for attraction in sorted(day, key=lambda a: a.get("estimated_visit_time") or 0, reverse=True):
        minutes = attraction.get("estimated_visit_time") or 0
        if morning_minutes <= afternoon_minutes:
            morning.append(attraction)
            morning_minutes += minutes
        else:
            afternoon.append(attraction)
            afternoon_minutes += minutes

    return _two_opt(morning), _two_opt(afternoon)


def insert_meal_stops(
    day: list[dict],
    food_spots: list[dict],
    used_food_ids: set[int],
    backup_attractions: list[dict],
    used_backup_ids: set[int],
    max_walk_km: float = MAX_DAILY_WALK_KM,
) -> list[dict]:
    """
    [morning attractions] → PRANZO → [afternoon attractions] → CENA

    Afternoon filling:
      1. Attractions already in this day's second half
      2. Nearest unused backup within BACKUP_MAX_KM
      3. "Tempo libero" placeholder
    """
    if not day:
        return []

    morning, afternoon = _split_day_around_lunch(day)

    result: list[dict] = []

    for attr in morning:
        result.append({**attr, "type": "attraction"})

    lunch_ref = morning[-1] if morning else day[0]
    result.append(_meal_slot(lunch_ref, "lunch"))
    position_ref = lunch_ref

    if afternoon:
        for attr in afternoon:
            result.append({**attr, "type": "attraction"})
    else:
        available = [
            a for a in backup_attractions
            if a["id"] not in used_backup_ids and not a.get("is_food_spot")
        ]
        if available:
            nearest = min(
                available,
                key=lambda a: haversine_km(
                    position_ref["latitude"], position_ref["longitude"],
                    a["latitude"], a["longitude"],
                ),
            )
            dist = haversine_km(
                position_ref["latitude"], position_ref["longitude"],
                nearest["latitude"], nearest["longitude"],
            )
            if dist <= max_walk_km and _can_add_to_day(day, nearest, max_walk_km):
                result.append({**nearest, "type": "attraction"})
                used_backup_ids.add(nearest["id"])
            else:
                result.append(_free_time(position_ref))
        else:
            result.append(_free_time(position_ref))

    last_real = next(
        (s for s in reversed(result) if s["type"] == "attraction" and s["id"] != -1),
        None,
    )
    if last_real:
        activity_minutes = sum(
            s.get("estimated_visit_time") or 0
            for s in result
            if s.get("type") in ("attraction", "free_time")
        )
        if activity_minutes < MIN_DAILY_MINUTES:
            result.append(_free_time(last_real, MIN_DAILY_MINUTES - activity_minutes))

        result.append(_meal_slot(last_real, "dinner"))

    return result


# ── Step 5: Google Maps link ──────────────────────────────────────────────────

def generate_maps_link(stops: list[dict]) -> str:
    waypoints: list[str] = []
    prev = None
    for s in stops:
        if s.get("type") == "free_time" or s.get("empty_meal_slot"):
            continue
        name = s.get("name")
        if not name:
            continue
        city = s.get("city")
        label = f"{name}, {city}" if city else name
        if label != prev:
            waypoints.append(quote(label))
            prev = label
    if not waypoints:
        return ""
    return "https://www.google.com/maps/dir/" + "/".join(waypoints) + "?travelmode=walking"


# ── Main entry point ──────────────────────────────────────────────────────────

def _level_values(level: int | list[int]) -> list[int]:
    return level if isinstance(level, list) else [level]


def _quality_score(attraction: dict, requested_level: int | list[int]) -> float:
    """Higher is better: requested-level fit first, then intrinsic category."""
    levels = _level_values(requested_level)
    level = attraction.get("category_level") or 3
    minutes = attraction.get("estimated_visit_time") or 60
    type_name = (attraction.get("attraction_type") or "").lower()

    if 1 in levels and len(levels) == 1:
        level_score = {1: 120, 2: 55, 3: 25}.get(level, 0)
    elif any(l >= 2 for l in levels):
        level_score = {2: 115, 3: 95, 1: 70}.get(level, 0)
    else:
        level_score = 80

    type_bonus = 0
    if "muse" in type_name:
        type_bonus += 10
    if any(word in type_name for word in ("piazza", "monumento", "chiesa", "basilica", "castello", "palazzo")):
        type_bonus += 6
    must_see_bonus = 0
    if _is_must_see(attraction):
        must_see_bonus = 300 - min(_must_see_rank(attraction), 30) * 6
    return level_score + type_bonus + must_see_bonus + min(minutes, 120) / 20


def _center(attractions: list[dict]) -> dict:
    return {
        "latitude": sum(a["latitude"] for a in attractions) / max(1, len(attractions)),
        "longitude": sum(a["longitude"] for a in attractions) / max(1, len(attractions)),
    }


def _transfer_mode_between(first: dict, second: dict) -> str:
    text = " ".join(
        str(value or "")
        for item in (first, second)
        for value in (
            item.get("name"),
            item.get("name_en"),
            item.get("attraction_type"),
            " ".join(item.get("tags") or []),
        )
    ).lower()
    return "ferry" if any(
        word in text
        for word in ("suomenlinna", "ferry", "traghetto", "island", "isola", "île", "isla")
    ) else "public_transport"


def _day_mobility(day: list[dict], max_walk_km: float) -> dict:
    threshold = _preferred_walking_leg_km(max_walk_km)
    transfer_legs: list[dict] = []
    walking_distance = 0.0
    for first, second in zip(day, day[1:]):
        distance = walking_km(
            first["latitude"], first["longitude"],
            second["latitude"], second["longitude"],
        )
        if distance > threshold:
            transfer_legs.append({
                "from_stop_id": first.get("id"),
                "to_stop_id": second.get("id"),
                "distance_km": round(distance, 2),
                "mode": _transfer_mode_between(first, second),
            })
        else:
            walking_distance += distance
    return {
        "walking_distance_km": round(walking_distance, 2),
        "internal_transfer_required": bool(transfer_legs),
        "transfer_legs": transfer_legs,
    }


def _day_profile(day: list[dict], catalog: list[dict], max_walk_km: float) -> dict:
    """Classify compact out-of-centre days without confusing transfer and walking."""
    must_sees = sorted(
        [item for item in catalog if _is_must_see(item)],
        key=lambda item: (_must_see_rank(item), item.get("id") or 0),
    )
    anchor = must_sees[0] if must_sees else _center(catalog)
    center = _center(day)
    transfer_km = haversine_km(
        anchor["latitude"], anchor["longitude"],
        center["latitude"], center["longitude"],
    )
    type_text = " ".join(
        str(item.get("attraction_type") or "").lower()
        for item in day
    )
    island_transfer = (
        transfer_km >= 1.5
        and any(word in type_text for word in ("isola", "island", "île", "isla", "traghetto", "ferry"))
    )
    is_excursion = transfer_km >= 9.0 or island_transfer
    return {
        "day_type": "excursion" if is_excursion else "urban",
        "transfer_required": transfer_km >= 3.0 or island_transfer,
        "transfer_distance_km": round(transfer_km, 1),
        "transfer_mode": "ferry" if island_transfer else "public_transport",
        **_day_mobility(day, max_walk_km),
    }


def _group_key(attraction: dict) -> str:
    if attraction.get("zone"):
        return f"zone:{attraction['zone']}"
    if attraction.get("block_id") is not None:
        return f"block:{attraction['block_id']}"
    return f"geo:{round(attraction['latitude'], 2)}:{round(attraction['longitude'], 2)}"


def _split_proximity_clusters(items: list[dict], radius_km: float = 2.5) -> list[list[dict]]:
    """Split broad catalog zones into walkable geographic clusters."""
    clusters: list[list[dict]] = []
    for item in items:
        nearest_index = None
        nearest_distance = float("inf")
        for index, cluster in enumerate(clusters):
            center = _center(cluster)
            distance = haversine_km(
                center["latitude"], center["longitude"],
                item["latitude"], item["longitude"],
            )
            if distance <= radius_km and distance < nearest_distance:
                nearest_index = index
                nearest_distance = distance
        if nearest_index is None:
            clusters.append([item])
        else:
            clusters[nearest_index].append(item)
    return clusters


def _geo_groups(attractions: list[dict], requested_level: int | list[int]) -> list[dict]:
    by_key: dict[str, list[dict]] = defaultdict(list)
    for attraction in attractions:
        by_key[_group_key(attraction)].append(attraction)

    groups = []
    for key, items in by_key.items():
        ordered = sorted(items, key=lambda a: _quality_score(a, requested_level), reverse=True)
        for cluster_index, cluster in enumerate(_split_proximity_clusters(ordered)):
            items_sorted = sorted(cluster, key=lambda a: _quality_score(a, requested_level), reverse=True)
            center = _center(items_sorted)
            groups.append({
                "key": f"{key}:cluster:{cluster_index}",
                "items": items_sorted,
                "center": center,
                "score": (
                    _quality_score(items_sorted[0], requested_level) * 2
                    + sum(_quality_score(a, requested_level) for a in items_sorted[1:3])
                ),
            })
    return sorted(groups, key=lambda g: g["score"], reverse=True)


def _select_seed_groups(groups: list[dict], num_days: int, max_walk_km: float) -> list[dict]:
    """Pick strong but geographically separated zone anchors."""
    selected: list[dict] = []
    min_separation = max(0.75, min(2.2, max_walk_km * 0.35))

    for group in groups:
        if len(selected) >= num_days:
            break
        if not selected:
            selected.append(group)
            continue
        nearest_selected = min(
            haversine_km(
                group["center"]["latitude"], group["center"]["longitude"],
                s["center"]["latitude"], s["center"]["longitude"],
            )
            for s in selected
        )
        if nearest_selected >= min_separation:
            selected.append(group)

    for group in groups:
        if len(selected) >= num_days:
            break
        if group not in selected:
            selected.append(group)
    return selected[:num_days]


def _candidate_rank(
    day: list[dict],
    candidate: dict,
    seed_center: dict,
    requested_level: int | list[int],
) -> float:
    if day:
        center = _center(day)
        centroid_km = haversine_km(center["latitude"], center["longitude"], candidate["latitude"], candidate["longitude"])
        nearest_km = min(
            haversine_km(candidate["latitude"], candidate["longitude"], a["latitude"], a["longitude"])
            for a in day
        )
    else:
        centroid_km = haversine_km(seed_center["latitude"], seed_center["longitude"], candidate["latitude"], candidate["longitude"])
        nearest_km = centroid_km
    must_see_pull = 2.0 if _is_must_see(candidate) else 0
    return nearest_km * 4.5 + centroid_km * 1.7 - _quality_score(candidate, requested_level) / 16 - must_see_pull


def _candidate_pool(attractions: list[dict], requested_level: int | list[int]) -> list[dict]:
    levels = _level_values(requested_level)
    primary = filter_attractions(attractions, levels) or [
        a for a in attractions
        if not a.get("is_food_spot") and a.get("category_level") in levels
    ]
    must_sees = sorted(
        [
            a for a in attractions
            if not a.get("is_food_spot") and _is_must_see(a)
        ],
        key=lambda a: (_must_see_rank(a), -_quality_score(a, requested_level)),
    )
    pool = []
    seen_ids: set[int] = set()
    seen_names: set[str] = set()
    for attraction in [*must_sees, *primary]:
        name_key = _name_key(attraction)
        if attraction["id"] in seen_ids or name_key in seen_names:
            continue
        pool.append(attraction)
        seen_ids.add(attraction["id"])
        seen_names.add(name_key)

    fallback_order = [2, 3] if levels == [1] else [1, 2, 3]
    for fallback_level in fallback_order:
        for attraction in attractions:
            if (
                not attraction.get("is_food_spot")
                and attraction.get("category_level") == fallback_level
                and attraction["id"] not in seen_ids
                and _name_key(attraction) not in seen_names
            ):
                pool.append(attraction)
                seen_ids.add(attraction["id"])
                seen_names.add(_name_key(attraction))
    return pool


def _place_must_see_anchors(
    days: list[list[dict]],
    pool: list[dict],
    used_ids: set[int],
    max_walk_km: float,
    requested_level: int | list[int],
) -> None:
    must_sees = [
        a for a in sorted(
            pool,
            key=lambda item: (_must_see_rank(item), -_quality_score(item, requested_level)),
        )
        if _is_must_see(a) and a["id"] not in used_ids
    ]

    def can_add_group(day: list[dict], group: list[dict]) -> bool:
        test_day = list(day)
        for candidate in group:
            if candidate["id"] in used_ids:
                continue
            if not _can_add_to_day(test_day, candidate, max_walk_km):
                return False
            test_day.append(candidate)
        return True

    must_see_groups = sorted(
        [group["items"] for group in _geo_groups(must_sees, requested_level)],
        key=lambda group: min(_must_see_rank(item) for item in group),
    )

    # First pass: keep must-see landmarks from the same area together when
    # the route still respects time, museum and walking constraints.
    for group in must_see_groups:
        group = [item for item in group if item["id"] not in used_ids]
        if not group:
            continue
        best_index = None
        best_score = float("inf")
        for index, day in enumerate(days):
            if not can_add_group(day, group):
                continue
            projected = [*day, *group]
            score = (
                len(day) * 1000
                + _optimized_distance(projected) * 100
                + _day_minutes(projected) / 10
            )
            if score < best_score:
                best_score = score
                best_index = index
        if best_index is not None:
            days[best_index].extend(group)
            used_ids.update(item["id"] for item in group)

    # Second pass: add remaining must-sees when they fit a coherent route.
    for candidate in must_sees:
        if candidate["id"] in used_ids:
            continue
        best_index = None
        best_score = float("inf")
        for index, day in enumerate(days):
            if not _can_add_to_day(day, candidate, max_walk_km):
                continue
            center = _center(day) if day else {"latitude": candidate["latitude"], "longitude": candidate["longitude"]}
            score = _candidate_rank(day, candidate, center, requested_level)
            if score < best_score:
                best_score = score
                best_index = index
        if best_index is not None:
            days[best_index].append(candidate)
            used_ids.add(candidate["id"])


def _repair_minimum_stop_count(
    days: list[list[dict]],
    attractions: list[dict],
    max_walk_km: float,
    requested_level: int | list[int],
) -> list[list[dict]]:
    result = [list(day) for day in days]
    min_attractions, _max_attractions = _day_limits(max_walk_km)

    for day in result:
        while day and len(day) < min_attractions:
            used_ids = {item["id"] for current_day in result for item in current_day}
            center = _center(day)
            available = sorted(
                [
                    item for item in attractions
                    if not item.get("is_food_spot") and item["id"] not in used_ids
                ],
                key=lambda item: _candidate_rank(day, item, center, requested_level),
            )[:24]

            direct = next((item for item in available if _fits_hard_constraints([*day, item], max_walk_km)), None)
            if direct is not None:
                day.append(direct)
                continue

            replacements: list[tuple[float, int, dict, dict]] = []
            for remove_index, current in enumerate(day):
                if _is_must_see(current):
                    continue
                base = [item for index, item in enumerate(day) if index != remove_index]
                for first_index, first in enumerate(available):
                    for second in available[first_index + 1:]:
                        projected = [*base, first, second]
                        if not _fits_hard_constraints(projected, max_walk_km):
                            continue
                        score = (
                            _optimized_distance(projected) * 100
                            + max(0, _quality_score(current, requested_level) - _quality_score(first, requested_level)) * 5
                            + max(0, _quality_score(current, requested_level) - _quality_score(second, requested_level)) * 5
                            + (5000 if _is_must_see(current) else 0)
                        )
                        replacements.append((score, remove_index, first, second))
            if not replacements:
                break
            _score, remove_index, first, second = min(replacements, key=lambda item: item[0])
            day.pop(remove_index)
            day.extend((first, second))

    return result


def _fits_hard_constraints(day: list[dict], max_walk_km: float) -> bool:
    profile = _effort_profile(max_walk_km)
    return (
        len(day) <= profile["max_attractions"]
        and _day_minutes(day) <= profile["max_minutes"]
        and _museum_count(day) <= MAX_MUSEUMS_PER_DAY
        and _route_fits_mobility(day, max_walk_km)
    )

def _ensure_explorer_discovery(
    days: list[list[dict]],
    attractions: list[dict],
    max_walk_km: float,
    requested_level: int | list[int],
) -> list[list[dict]]:
    levels = _level_values(requested_level)
    if len(levels) == 1 or not any(level >= 2 for level in levels):
        return [list(day) for day in days]

    result = [list(day) for day in days]
    used_ids = {item["id"] for day in result for item in day}
    candidates = [
        item for item in attractions
        if not item.get("is_food_spot")
        and (item.get("category_level") or 1) in {2, 3}
        and item["id"] not in used_ids
    ]

    # Explorer should expose at least one genuine hidden discovery whenever
    # the catalog offers a compatible level-3 stop. Level-2 attractions alone
    # otherwise made long Explorer itineraries indistinguishable from Iconic.
    hidden_target = min(2, len(result))
    for _ in range(hidden_target):
        selected_hidden = sum(
            (item.get("category_level") or 1) == 3 and not _is_must_see(item)
            for day in result
            for item in day
        )
        if selected_hidden >= hidden_target:
            break
        hidden_candidates = [
            item for item in candidates
            if (item.get("category_level") or 1) == 3
            and not _is_must_see(item)
            and item["id"] not in used_ids
        ]
        hidden_options: list[tuple[float, int, int | None, dict, list[dict]]] = []
        min_minutes = _min_daily_minutes(max_walk_km)
        for day_index, day in enumerate(result):
            center = _center(day)
            ordered_hidden = sorted(
                hidden_candidates,
                key=lambda item: _candidate_rank(day, item, center, requested_level),
            )[:16]
            for candidate in ordered_hidden:
                added = [*day, candidate]
                if _fits_hard_constraints(added, max_walk_km):
                    hidden_options.append((
                        _candidate_rank(day, candidate, center, requested_level) * 100
                        + _optimized_distance(added),
                        day_index,
                        None,
                        candidate,
                        added,
                    ))
                for remove_index, current in enumerate(day):
                    if _is_must_see(current):
                        continue
                    projected = [
                        candidate if index == remove_index else item
                        for index, item in enumerate(day)
                    ]
                    if _day_minutes(day) >= min_minutes and _day_minutes(projected) < min_minutes:
                        continue
                    if not _fits_hard_constraints(projected, max_walk_km):
                        continue
                    score = (
                        10000
                        + _candidate_rank(day, candidate, center, requested_level) * 100
                        + max(0, _quality_score(current, requested_level) - _quality_score(candidate, requested_level)) * 10
                        + _optimized_distance(projected)
                    )
                    hidden_options.append((score, day_index, remove_index, candidate, projected))
        if not hidden_options:
            break
        _score, day_index, remove_index, candidate, projected = min(
            hidden_options,
            key=lambda item: item[0],
        )
        if remove_index is not None:
            used_ids.discard(result[day_index][remove_index]["id"])
        result[day_index] = projected
        used_ids.add(candidate["id"])
        candidates = [item for item in candidates if item["id"] != candidate["id"]]

    for day in result:
        if not day or any((item.get("category_level") or 1) in {2, 3} for item in day):
            continue
        center = _center(day)
        available = sorted(
            [item for item in candidates if item["id"] not in used_ids],
            key=lambda item: _candidate_rank(day, item, center, requested_level),
        )

        added = next((item for item in available if _can_add_to_day(day, item, max_walk_km)), None)
        if added is not None:
            day.append(added)
            used_ids.add(added["id"])
            continue

        swaps: list[tuple[float, int, dict]] = []
        for remove_index, current in enumerate(day):
            if _is_must_see(current):
                continue
            base = [item for index, item in enumerate(day) if index != remove_index]
            for candidate in available:
                projected = [*base, candidate]
                if not _fits_hard_constraints(projected, max_walk_km):
                    continue
                score = (
                    _optimized_distance(projected) * 100
                    + max(0, _quality_score(current, requested_level) - _quality_score(candidate, requested_level)) * 10
                    + (5000 if _is_must_see(current) else 0)
                )
                swaps.append((score, remove_index, candidate))
        if swaps:
            _score, remove_index, candidate = min(swaps, key=lambda item: item[0])
            used_ids.discard(day[remove_index]["id"])
            day[remove_index] = candidate
            used_ids.add(candidate["id"])
            continue

        added = next(
            (item for item in available if _fits_hard_constraints([*day, item], max_walk_km)),
            None,
        )
        if added is not None:
            day.append(added)
            used_ids.add(added["id"])

    return result


def _ensure_top_must_see(
    days: list[list[dict]],
    attractions: list[dict],
    max_walk_km: float,
    requested_level: int | list[int],
) -> list[list[dict]]:
    """Keep the highest-priority landmark whenever a hard-valid placement exists."""
    result = [list(day) for day in days]
    must_sees = sorted(
        [item for item in attractions if not item.get("is_food_spot") and _is_must_see(item)],
        key=lambda item: (_must_see_rank(item), -_quality_score(item, requested_level)),
    )
    if not must_sees:
        return result

    required = must_sees[0]
    if any(required["id"] == item["id"] for day in result for item in day):
        return result

    options: list[tuple[tuple, int, list[dict]]] = []
    for day_index, day in enumerate(result):
        direct = [*day, required]
        if _fits_hard_constraints(direct, max_walk_km):
            options.append(((0, _optimized_distance(direct)), day_index, direct))

        removable = [index for index, item in enumerate(day) if not _is_must_see(item)]
        for remove_count in range(1, min(3, len(removable)) + 1):
            for removed_indices in combinations(removable, remove_count):
                removed_set = set(removed_indices)
                removed = [item for index, item in enumerate(day) if index in removed_set]
                projected = [
                    *[item for index, item in enumerate(day) if index not in removed_set],
                    required,
                ]
                if not _fits_hard_constraints(projected, max_walk_km):
                    continue
                score = (
                    remove_count,
                    sum(_quality_score(item, requested_level) for item in removed),
                    _optimized_distance(projected),
                )
                options.append((score, day_index, projected))

    if options:
        _score, day_index, replacement = min(options, key=lambda item: item[0])
        result[day_index] = order_day(replacement)
    return result


def _build_zone_days(    attractions: list[dict],
    num_days: int,
    requested_level: int | list[int],
    max_walk_km: float,
) -> list[list[dict]]:
    pool = _candidate_pool(attractions, requested_level)
    if not pool:
        return []

    min_attractions, max_attractions = _day_limits(max_walk_km)
    min_minutes = _min_daily_minutes(max_walk_km)
    target_minutes = _target_daily_minutes(max_walk_km)
    profile = _effort_profile(max_walk_km)
    groups = _geo_groups(pool, requested_level)
    seed_groups = _select_seed_groups(groups, num_days, max_walk_km)
    if not seed_groups:
        return []

    days: list[list[dict]] = [[] for _ in range(num_days)]
    seed_centers: list[dict] = []
    used_ids: set[int] = set()

    _place_must_see_anchors(days, pool, used_ids, max_walk_km, requested_level)

    for index in range(num_days):
        group = seed_groups[index % len(seed_groups)]
        seed_centers.append(group["center"])
        if days[index]:
            continue
        for candidate in group["items"]:
            if candidate["id"] in used_ids:
                continue
            if _can_add_to_day(days[index], candidate, max_walk_km):
                days[index].append(candidate)
                used_ids.add(candidate["id"])
                break

    def available_for(day: list[dict], center: dict) -> list[dict]:
        return sorted(
            [a for a in pool if a["id"] not in used_ids],
            key=lambda a: _candidate_rank(day, a, center, requested_level),
        )

    max_rounds = max_attractions + 3
    for _ in range(max_rounds):
        changed = False
        for index, day in enumerate(days):
            if not day:
                continue
            if len(day) >= min_attractions and _day_minutes(day) >= min_minutes:
                continue
            for candidate in available_for(day, seed_centers[index]):
                if _can_add_to_day(day, candidate, max_walk_km):
                    day.append(candidate)
                    used_ids.add(candidate["id"])
                    changed = True
                    break
        if not changed:
            break

    # Distribute optional stops one per day and always start from the lightest
    # day. Filling one day completely before moving to the next used to exhaust
    # compact-city catalogs and leave the final days visibly underfilled.
    for _ in range(max_rounds):
        changed = False
        day_order = sorted(
            range(len(days)),
            key=lambda index: (_day_minutes(days[index]), len(days[index]), index),
        )
        for index in day_order:
            day = days[index]
            if not day or _day_minutes(day) >= target_minutes:
                continue
            if len(day) >= MAX_DAILY_ATTRACTIONS:
                continue
            if len(day) >= max_attractions and _day_minutes(day) >= min_minutes:
                continue
            for candidate in available_for(day, seed_centers[index]):
                if _can_add_to_day(day, candidate, max_walk_km):
                    day.append(candidate)
                    used_ids.add(candidate["id"])
                    changed = True
                    break
        if not changed:
            break

    return [order_day(day) for day in days if day]


def _repair_underfilled_days_with_groups(
    days: list[list[dict]],
    attractions: list[dict],
    max_walk_km: float,
    requested_level: int | list[int],
) -> list[list[dict]]:
    """Replace a thin day with an unused coherent district when possible."""
    result = [list(day) for day in days]
    min_attractions, _max_attractions = _day_limits(max_walk_km)
    groups = _geo_groups(_candidate_pool(attractions, requested_level), requested_level)

    for index in sorted(
        range(len(result)),
        key=lambda day_index: (_day_minutes(result[day_index]), len(result[day_index])),
    ):
        current = result[index]
        if (
            not current
            or (len(current) >= min_attractions and _day_minutes(current) >= _min_daily_minutes(max_walk_km))
        ):
            continue

        used_elsewhere = {
            item["id"]
            for day_index, day in enumerate(result)
            if day_index != index
            for item in day
        }
        protected_ids = {item["id"] for item in current if _is_must_see(item)}
        candidates: list[tuple[tuple, list[dict]]] = []

        for group in groups:
            available = [item for item in group["items"] if item["id"] not in used_elsewhere]
            if len(available) < min_attractions or _day_minutes(available) < _min_daily_minutes(max_walk_km):
                continue
            if not protected_ids.issubset({item["id"] for item in available}):
                continue
            if not _fits_hard_constraints(available, max_walk_km):
                continue
            overlap = len({item["id"] for item in current} & {item["id"] for item in available})
            score = (
                -overlap,
                -sum(_quality_score(item, requested_level) for item in available),
                _optimized_distance(available),
            )
            candidates.append((score, available))

        if candidates:
            _score, replacement = min(candidates, key=lambda item: item[0])
            result[index] = order_day(replacement)

    return result


def build_itinerary(
    attractions: list[dict],
    food_spots: list[dict],
    num_days: int,
    level: int | list[int],
    max_walk_km: float = MAX_DAILY_WALK_KM,
) -> list[dict]:
    attractions = annotate_must_see_many(attractions)
    days_ordered = _build_zone_days(attractions, num_days, level, max_walk_km)
    if not days_ordered:
        return []

    days_limited, overflow = _cap_days_by_limits(days_ordered, max_walk_km)
    days_museum_capped, freed = _rebalance_museums(days_limited, max_walk_km)
    days_capped, post_museum_overflow = _cap_days_by_limits(days_museum_capped, max_walk_km)

    assigned_ids = {a["id"] for day in days_capped for a in day}
    backup: list[dict] = []
    seen_ids: set[int] = set()

    def _add_to_backup_zone(items: list[dict]) -> None:
        for item in items:
            aid = item.get("id")
            if aid is None or aid in seen_ids or aid in assigned_ids:
                continue
            seen_ids.add(aid)
            backup.append(item)

    _add_to_backup_zone(overflow)
    _add_to_backup_zone(freed)
    _add_to_backup_zone(post_museum_overflow)
    _add_to_backup_zone(_candidate_pool(attractions, level))
    if level == 1:
        _add_to_backup_zone(filter_attractions(attractions, 2) or [
            a for a in attractions
            if not a.get("is_food_spot") and a.get("category_level") == 2
        ])
        _add_to_backup_zone(filter_attractions(attractions, 3) or [
            a for a in attractions
            if not a.get("is_food_spot") and a.get("category_level") == 3
        ])

    days_filled, _backup = _fill_thin_days(days_capped, backup, max_walk_km)
    days_final, _final_overflow = _cap_days_by_limits(days_filled, max_walk_km)
    days_repaired = _repair_underfilled_days_by_moving(days_final, max_walk_km)
    days_repaired = _repair_underfilled_days_with_groups(
        days_repaired, attractions, max_walk_km, level
    )
    days_final, _repair_overflow = _cap_days_by_limits(days_repaired, max_walk_km)
    days_final = _ensure_top_must_see(days_final, attractions, max_walk_km, level)
    days_final = _repair_minimum_stop_count(days_final, attractions, max_walk_km, level)
    days_final = _ensure_explorer_discovery(days_final, attractions, max_walk_km, level)
    days_final = _ensure_top_must_see(days_final, attractions, max_walk_km, level)
    days_final = _rebalance_day_geography(days_final, max_walk_km, level)
    days_final = _rebalance_day_workload(days_final, max_walk_km, level)
    days_final = _repair_minimum_stop_count(days_final, attractions, max_walk_km, level)
    days_final = _ensure_top_must_see(days_final, attractions, max_walk_km, level)
    days_final = _ensure_explorer_discovery(days_final, attractions, max_walk_km, level)
    days_final = _ensure_top_must_see(days_final, attractions, max_walk_km, level)
    days_ordered = [order_day(day) for day in days_final]

    days_with_stops = [
        [{**attraction, "type": "attraction"} for attraction in day]
        for day in days_ordered
    ]

    return [
        {
            "day": i,
            "stops": stops,
            "maps_link": generate_maps_link(stops),
            **_day_profile(days_ordered[i - 1], attractions, max_walk_km),
        }
        for i, stops in enumerate(days_with_stops, start=1)
    ]
