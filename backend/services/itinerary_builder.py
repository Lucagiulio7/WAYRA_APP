"""
Deterministic itinerary builder — no AI, no external APIs.

Pipeline:
  filter_attractions
  → split_days   (block-aware: group by block_id → merge blocks into days by time budget)
  → order_day    (2-opt refinement within each day)
  → insert_meal_stops
  → generate_maps_link
"""
import math
from urllib.parse import quote
from collections import defaultdict
from typing import Optional

MAX_DAILY_MINUTES     = 420   # 7 hours max of attraction time per day
MIN_DAILY_MINUTES     = 240   # 4 hours min of attraction time per day
MAX_DAILY_ATTRACTIONS = 8     # hard cap on stops per day (meals excluded)
MIN_DAILY_ATTRACTIONS = 4     # soft floor on stops per day
MAX_MUSEUMS_PER_DAY   = 1     # no more than 1 museum per day
MAX_DAILY_WALK_KM     = 4.0   # max walking route distance per day
BACKUP_MAX_KM         = 5.0   # max distance to pull a backup attraction into the afternoon slot
CLUSTER_RADIUS_KM     = 1.5   # proximity radius for the isolation check
MIN_CLUSTER_NEIGHBORS = 2     # minimum other attractions within CLUSTER_RADIUS_KM to be included


# ── Geo utilities ─────────────────────────────────────────────────────────────

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _route_distance(route: list[dict]) -> float:
    return sum(
        haversine_km(
            route[i]["latitude"], route[i]["longitude"],
            route[i + 1]["latitude"], route[i + 1]["longitude"],
        )
        for i in range(len(route) - 1)
    )


def _two_opt(route: list[dict]) -> list[dict]:
    if len(route) < 4:
        return route
    best = list(route)
    best_dist = _route_distance(best)
    improved = True
    while improved:
        improved = False
        for i in range(1, len(best) - 1):
            for j in range(i + 1, len(best)):
                candidate = best[:i] + best[i:j + 1][::-1] + best[j + 1:]
                dist = _route_distance(candidate)
                if dist < best_dist - 1e-9:
                    best = candidate
                    best_dist = dist
                    improved = True
    return best


def _optimized_distance(attractions: list[dict]) -> float:
    return _route_distance(_two_opt(list(attractions)))


def _can_add_to_day(day: list[dict], candidate: dict) -> bool:
    if any(a["id"] == candidate["id"] for a in day):
        return False
    nxt = [*day, candidate]
    if len(nxt) > MAX_DAILY_ATTRACTIONS:
        return False
    if _day_minutes(nxt) > MAX_DAILY_MINUTES:
        return False
    if _museum_count(nxt) > MAX_MUSEUMS_PER_DAY:
        return False
    return _optimized_distance(nxt) <= MAX_DAILY_WALK_KM


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
            and (attraction.get("attraction_type") or "").lower() == "museo"
            else 0
        )
        score = museum_penalty + distance_gain * 100 + minutes_gain / 10
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
    return sum(1 for a in attractions if (a.get("attraction_type") or "").lower() == "museo")


def split_days(attractions: list[dict], num_days: int) -> list[list[dict]]:
    """
    Block-aware day builder — splits by time/count only.
    Museum balancing is handled separately by _rebalance_museums.
    Mirrors the TypeScript splitDays logic exactly.
    """
    if not attractions:
        return []

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
        hit_max     = new_count > MAX_DAILY_ATTRACTIONS or new_minutes > MAX_DAILY_MINUTES
        met_min     = (_day_minutes(current_day) >= MIN_DAILY_MINUTES
                       and len(current_day) >= MIN_DAILY_ATTRACTIONS)

        if current_day and (hit_max or met_min) and slots_left > 1 and blocks_after > 0:
            days.append(list(current_day))
            current_day = []

        current_day.extend(block_attrs)

    if current_day and len(days) < num_days:
        days.append(current_day[:MAX_DAILY_ATTRACTIONS])

    return [d for d in days if d]


# ── Step 2b: cap days by time / count hard limits ────────────────────────────

def _cap_days_by_limits(days: list[list[dict]]) -> tuple[list[list[dict]], list[dict]]:
    """
    Trim each day so that it never exceeds MAX_DAILY_ATTRACTIONS or
    MAX_DAILY_MINUTES. Excess attractions are dropped here; they will be
    picked up by the backup pool in build_itinerary (they are not in
    assigned_ids so the general backup sweep collects them).
    """
    result = []
    overflow: list[dict] = []
    for day in days:
        kept = list(day)
        while (
            len(kept) > MAX_DAILY_ATTRACTIONS
            or _day_minutes(kept) > MAX_DAILY_MINUTES
            or _museum_count(kept) > MAX_MUSEUMS_PER_DAY
            or _optimized_distance(kept) > MAX_DAILY_WALK_KM
        ):
            if len(kept) <= 1:
                break
            removed = kept.pop(_pick_removal_index(kept))
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


def _rebalance_museums(days: list[list[dict]]) -> tuple[list[list[dict]], list[dict]]:
    """
    Mirrors TypeScript rebalanceMuseums.
    Removes museums exceeding MAX_MUSEUMS_PER_DAY from each day,
    tries to place them in days with room, returns any unplaceable ones as freed.
    """
    result = [list(day) for day in days]
    overflow: list[dict] = []

    # Pass 1: collect excess museums
    for day in result:
        count = 0
        keep: list[dict] = []
        for a in day:
            if (a.get("attraction_type") or "").lower() == "museo":
                if count < MAX_MUSEUMS_PER_DAY:
                    keep.append(a)
                    count += 1
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
                and len(day) < MAX_DAILY_ATTRACTIONS
                and _day_minutes(day) + (museum.get("estimated_visit_time") or 60) <= MAX_DAILY_MINUTES
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
) -> tuple[list[list[dict]], list[dict]]:
    """
    For each day below the minimum target, pull from
    the backup pool (sorted by proximity to the day's centroid) until the day
    reaches the minimum time/count target or the pool is exhausted.

    Returns (updated_days, remaining_backup).
    """
    result = [list(day) for day in days]
    used_ids: set[int] = set()

    for day in result:
        if not day or (
            len(day) >= MIN_DAILY_ATTRACTIONS
            and _day_minutes(day) >= MIN_DAILY_MINUTES
        ):
            continue

        c_lat = sum(a["latitude"] for a in day) / len(day)
        c_lon = sum(a["longitude"] for a in day) / len(day)

        available = sorted(
            [a for a in backup if a["id"] not in used_ids and not a.get("is_food_spot")],
            key=lambda a: haversine_km(c_lat, c_lon, a["latitude"], a["longitude"]),
        )

        for candidate in available:
            if (
                len(day) >= MIN_DAILY_ATTRACTIONS
                and _day_minutes(day) >= MIN_DAILY_MINUTES
            ) or len(day) >= MAX_DAILY_ATTRACTIONS:
                break
            if not _can_add_to_day(day, candidate):
                continue
            day.append(candidate)
            used_ids.add(candidate["id"])

    remaining = [a for a in backup if a["id"] not in used_ids]
    return result, remaining


# ── Step 3: 2-opt refinement within each day ─────────────────────────────────

def order_day(attractions: list[dict]) -> list[dict]:
    """2-opt pass to minimise walking distance within the day's attractions."""
    if len(attractions) <= 1:
        return list(attractions)
    return _two_opt(list(attractions))


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


def insert_meal_stops(
    day: list[dict],
    food_spots: list[dict],
    used_food_ids: set[int],
    backup_attractions: list[dict],
    used_backup_ids: set[int],
) -> list[dict]:
    """
    [morning attractions] → PRANZO → [afternoon attractions] → CENA

    Afternoon filling:
      1. Attractions already in this day's second half
      2. Nearest unused backup within BACKUP_MAX_KM
      3. "Tempo libero" placeholder
    """
    n = len(day)
    morning_count = max(1, (n + 1) // 2)
    morning = day[:morning_count]
    afternoon = day[morning_count:]

    result: list[dict] = []

    for attr in morning:
        result.append({**attr, "type": "attraction"})

    lunch_ref = morning[-1]
    lunch_spot = _find_nearest_food(lunch_ref, food_spots, "lunch", used_food_ids)
    if lunch_spot:
        result.append({**lunch_spot, "type": "meal", "meal": "lunch"})
        used_food_ids.add(lunch_spot["id"])

    position_ref = lunch_spot if lunch_spot else lunch_ref

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
            if dist <= BACKUP_MAX_KM and _can_add_to_day(day, nearest):
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

        dinner_spot = _find_nearest_food(last_real, food_spots, "dinner", used_food_ids)
        if dinner_spot:
            result.append({**dinner_spot, "type": "meal", "meal": "dinner"})
            used_food_ids.add(dinner_spot["id"])

    return result


# ── Step 5: Google Maps link ──────────────────────────────────────────────────

def generate_maps_link(stops: list[dict]) -> str:
    waypoints: list[str] = []
    prev = None
    for s in stops:
        if s.get("type") == "free_time":
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

def build_itinerary(
    attractions: list[dict],
    food_spots: list[dict],
    num_days: int,
    level: int | list[int],
) -> list[dict]:
    filtered = filter_attractions(attractions, level)
    if not filtered:
        # Fallback: ignora il controllo di isolamento (città piccole o blocchi sparsi)
        levels = level if isinstance(level, list) else [level]
        filtered = [
            a for a in attractions
            if not a.get("is_food_spot") and a["category_level"] in levels
        ]
    if not filtered:
        return []

    days_raw = _ensure_day_count(split_days(filtered, num_days), num_days)
    days_limited, overflow = _cap_days_by_limits(days_raw)
    days_museum_capped, freed = _rebalance_museums(days_limited)
    days_capped, post_museum_overflow = _cap_days_by_limits(days_museum_capped)

    # assigned_ids does NOT include time-overflow or freed museums → backup sweeps them
    assigned_ids = {a["id"] for day in days_capped for a in day}
    backup = [
        *overflow,
        *freed,  # musei liberati dal rebalancing tornano nel pool
        *post_museum_overflow,
        *[a for a in attractions if not a.get("is_food_spot") and a["id"] not in assigned_ids],
    ]

    # Fill any day that ended up with too few attractions
    days_filled, backup = _fill_thin_days(days_capped, backup)
    days_ordered = [order_day(day) for day in days_filled]

    used_food_ids: set[int] = set()
    used_backup_ids: set[int] = set()
    days_with_meals = [
        insert_meal_stops(day, food_spots, used_food_ids, backup, used_backup_ids)
        for day in days_ordered
    ]

    return [
        {"day": i, "stops": stops, "maps_link": generate_maps_link(stops)}
        for i, stops in enumerate(days_with_meals, start=1)
    ]
