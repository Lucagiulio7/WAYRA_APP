"""
Geographic clustering and daily itinerary scheduling.

Strategy:
  1. Score each attraction's distance from a daily "zone center"
  2. Build days by greedily picking the closest unvisited attraction
  3. Respect daily time budget (MAX_DAILY_MINUTES)
  4. Return ordered lists ready for itinerary building
"""
import math
from typing import Optional


MAX_DAILY_MINUTES = 480  # 8 hours of activity (max)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometres."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _centroid(attractions: list[dict]) -> tuple[float, float]:
    if not attractions:
        return 0.0, 0.0
    lat = sum(a["latitude"] for a in attractions) / len(attractions)
    lon = sum(a["longitude"] for a in attractions) / len(attractions)
    return lat, lon


def _nearest_neighbor_sort(attractions: list[dict], start: Optional[dict] = None) -> list[dict]:
    """Order attractions within a day by proximity (nearest-neighbour heuristic)."""
    remaining = list(attractions)
    if not remaining:
        return []

    if start:
        current_lat, current_lon = start["latitude"], start["longitude"]
    else:
        current_lat, current_lon = remaining[0]["latitude"], remaining[0]["longitude"]

    ordered = []
    while remaining:
        nearest = min(
            remaining,
            key=lambda a: haversine_km(current_lat, current_lon, a["latitude"], a["longitude"]),
        )
        ordered.append(nearest)
        remaining.remove(nearest)
        current_lat, current_lon = nearest["latitude"], nearest["longitude"]

    return ordered


def cluster_into_days(
    attractions: list[dict],
    num_days: int,
) -> list[list[dict]]:
    """
    Distribute attractions across `num_days` using a geographic zone approach.

    Returns a list of `num_days` lists, each containing ordered attractions.
    """
    if not attractions:
        return [[] for _ in range(num_days)]

    # Compute overall bounding box and divide into North/South strips
    all_lats = [a["latitude"] for a in attractions]
    lat_min, lat_max = min(all_lats), max(all_lats)
    lat_step = (lat_max - lat_min + 0.001) / num_days

    # Sort attractions into latitude bands (N→S ordering feels natural for walking)
    sorted_by_lat = sorted(attractions, key=lambda a: -a["latitude"])  # North first

    days: list[list[dict]] = [[] for _ in range(num_days)]
    day_minutes: list[int] = [0] * num_days

    for attraction in sorted_by_lat:
        # Primary: assign to day by latitude band
        band = min(
            int((lat_max - attraction["latitude"]) / lat_step),
            num_days - 1,
        )

        # If that day is full, find the day with the most available time that is geographically closest
        if day_minutes[band] + attraction["estimated_visit_time"] > MAX_DAILY_MINUTES:
            best_day = band
            best_score = float("inf")
            for d in range(num_days):
                remaining = MAX_DAILY_MINUTES - day_minutes[d]
                if remaining >= attraction["estimated_visit_time"]:
                    if days[d]:
                        c_lat, c_lon = _centroid(days[d])
                        dist = haversine_km(attraction["latitude"], attraction["longitude"], c_lat, c_lon)
                    else:
                        dist = 0.0
                    if dist < best_score:
                        best_score = dist
                        best_day = d
            band = best_day

        days[band].append(attraction)
        day_minutes[band] += attraction["estimated_visit_time"]

    # Sort within each day by nearest-neighbour
    return [_nearest_neighbor_sort(day) for day in days]
