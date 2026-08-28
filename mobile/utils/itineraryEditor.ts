import type { BuilderAttraction } from "@/hooks/useAttractions";
import type { Itinerary, Stop } from "@/types";
import { cityLabel } from "@/utils/cityLabels";
import { localizedName } from "@/utils/localization";

const MAPS_MAX_WAYPOINTS = 10;

type GeoPoint = { latitude: number; longitude: number };

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(deltaPhi / 2) ** 2
    + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function walkingDistanceFactor(straightKm: number): number {
  if (straightKm > 2) return 1.1;
  if (straightKm > 1) return 1.15;
  if (straightKm > 0.5) return 1.3;
  if (straightKm > 0.3) return 1.4;
  return 1.5;
}

export function walkingKm(a: GeoPoint, b: GeoPoint): number {
  const straightKm = haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
  return straightKm * walkingDistanceFactor(straightKm);
}

function shortestOpenPath(stops: Stop[]): Stop[] {
  const count = stops.length;
  const stateCount = 1 << count;
  const distances = stops.map((a) => stops.map((b) => (
    haversineKm(a.latitude, a.longitude, b.latitude, b.longitude)
  )));
  const costs = Array.from({ length: stateCount }, () => Array(count).fill(Number.POSITIVE_INFINITY));
  const parents = Array.from({ length: stateCount }, () => Array(count).fill(-1));

  for (let index = 0; index < count; index++) costs[1 << index][index] = 0;

  for (let mask = 0; mask < stateCount; mask++) {
    for (let last = 0; last < count; last++) {
      const current = costs[mask][last];
      if (!Number.isFinite(current)) continue;
      for (let next = 0; next < count; next++) {
        if (mask & (1 << next)) continue;
        const nextMask = mask | (1 << next);
        const candidate = current + distances[last][next];
        if (candidate < costs[nextMask][next]) {
          costs[nextMask][next] = candidate;
          parents[nextMask][next] = last;
        }
      }
    }
  }

  const fullMask = stateCount - 1;
  let last = 0;
  for (let index = 1; index < count; index++) {
    if (costs[fullMask][index] < costs[fullMask][last]) last = index;
  }

  const order: number[] = [];
  let mask = fullMask;
  while (last !== -1) {
    order.push(last);
    const previous = parents[mask][last];
    mask ^= 1 << last;
    last = previous;
  }
  order.reverse();
  return order.map((index) => stops[index]);
}

function nearestOpenPath(stops: Stop[]): Stop[] {
  const routeLength = (route: Stop[]) => route.slice(0, -1).reduce(
    (sum, stop, index) => sum + haversineKm(
      stop.latitude,
      stop.longitude,
      route[index + 1].latitude,
      route[index + 1].longitude,
    ),
    0,
  );
  let best: Stop[] = [];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const start of stops) {
    const remaining = stops.filter((stop) => stop !== start);
    const route = [start];
    while (remaining.length > 0) {
      const current = route[route.length - 1];
      let nearestIndex = 0;
      for (let index = 1; index < remaining.length; index++) {
        const candidateDistance = haversineKm(
          current.latitude,
          current.longitude,
          remaining[index].latitude,
          remaining[index].longitude,
        );
        const nearestDistance = haversineKm(
          current.latitude,
          current.longitude,
          remaining[nearestIndex].latitude,
          remaining[nearestIndex].longitude,
        );
        if (candidateDistance < nearestDistance) nearestIndex = index;
      }
      route.push(remaining.splice(nearestIndex, 1)[0]);
    }
    const distance = routeLength(route);
    if (distance < bestDistance) {
      best = route;
      bestDistance = distance;
    }
  }

  return best;
}

export function twoOptStops(stops: Stop[]): Stop[] {
  const count = stops.length;
  if (count <= 2) return [...stops];
  if (count <= 11) return shortestOpenPath(stops);

  const routeLength = (route: Stop[]) => route.slice(0, -1).reduce(
    (sum, stop, index) => sum + haversineKm(
      stop.latitude,
      stop.longitude,
      route[index + 1].latitude,
      route[index + 1].longitude,
    ),
    0,
  );
  let best = nearestOpenPath(stops);
  let bestDistance = routeLength(best);
  let improved = true;

  while (improved) {
    improved = false;
    for (let start = 0; start < best.length - 1; start++) {
      for (let end = start + 1; end < best.length; end++) {
        const candidate = [
          ...best.slice(0, start),
          ...best.slice(start, end + 1).reverse(),
          ...best.slice(end + 1),
        ];
        const candidateDistance = routeLength(candidate);
        if (candidateDistance < bestDistance - 1e-9) {
          best = candidate;
          bestDistance = candidateDistance;
          improved = true;
        }
      }
    }
  }
  return best;
}

export function optimizeAttractionsBetweenFoodStops(stops: Stop[]): Stop[] {
  const result: Stop[] = [];
  let segment: Stop[] = [];
  const flush = () => {
    if (segment.length === 0) return;
    result.push(...twoOptStops(segment));
    segment = [];
  };

  for (const stop of stops) {
    if (stop.type === "attraction") segment.push(stop);
    else {
      flush();
      result.push(stop);
    }
  }
  flush();
  return result;
}

function stopMinutes(stop: Stop): number {
  return stop.estimated_visit_time ?? 60;
}

function isMealAnchor(stop: Stop, mealType: "lunch" | "dinner"): boolean {
  return stop.meal_type === mealType || (stop as Stop & { meal?: string }).meal === mealType;
}

function segmentRouteKm(stops: Stop[]): number {
  return stops.slice(0, -1).reduce(
    (sum, stop, index) => sum + walkingKm(stop, stops[index + 1]),
    0,
  );
}

export function insertAttractionInLightestSegment(stops: Stop[], attraction: Stop): Stop[] {
  const segments: Stop[][] = [[]];
  const anchors: Stop[] = [];

  for (const stop of stops) {
    if (stop.type === "attraction") segments[segments.length - 1].push(stop);
    else {
      anchors.push(stop);
      segments.push([]);
    }
  }

  let targetSegment = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  const lunchAnchorIndex = anchors.findIndex((stop) => isMealAnchor(stop, "lunch"));
  const dinnerAnchorIndex = anchors.findIndex((stop) => isMealAnchor(stop, "dinner"));
  const lastAllowedSegment = dinnerAnchorIndex >= 0 ? dinnerAnchorIndex : segments.length - 1;
  const totalMinutes = (segment: Stop[]) => segment.reduce((sum, stop) => sum + stopMinutes(stop), 0);

  segments.forEach((segment, index) => {
    if (index > lastAllowedSegment) return;
    const candidateSegment = twoOptStops([...segment, attraction]);
    const candidateSegments = segments.map((current, currentIndex) => (
      currentIndex === index ? candidateSegment : current
    ));
    const morningMinutes = candidateSegments
      .slice(0, lunchAnchorIndex >= 0 ? lunchAnchorIndex + 1 : candidateSegments.length)
      .reduce((sum, current) => sum + totalMinutes(current), 0);
    const afternoonMinutes = lunchAnchorIndex >= 0
      ? candidateSegments
        .slice(lunchAnchorIndex + 1, lastAllowedSegment + 1)
        .reduce((sum, current) => sum + totalMinutes(current), 0)
      : 0;
    const balancePenalty = lunchAnchorIndex >= 0
      ? Math.abs(morningMinutes - afternoonMinutes) / 60
      : totalMinutes(candidateSegment) / 60;
    const distancePenalty = Math.max(0, segmentRouteKm(candidateSegment) - segmentRouteKm(segment));
    const score = balancePenalty + distancePenalty * 3;

    if (score < bestScore) {
      bestScore = score;
      targetSegment = index;
    }
  });

  segments[targetSegment] = twoOptStops([...segments[targetSegment], attraction]);
  const result: Stop[] = [];
  segments.forEach((segment, index) => {
    result.push(...segment);
    if (anchors[index]) result.push(anchors[index]);
  });
  return result;
}

export function builderToStop(attraction: BuilderAttraction, city: string): Stop {
  return {
    type: "attraction",
    id: attraction.id,
    name: attraction.name,
    name_en: attraction.name_en,
    name_fr: attraction.name_fr,
    description: attraction.description ?? undefined,
    description_en: attraction.description_en ?? undefined,
    description_fr: attraction.description_fr ?? undefined,
    latitude: attraction.latitude,
    longitude: attraction.longitude,
    category_level: attraction.category_level,
    estimated_visit_time: attraction.estimated_visit_time ?? 60,
    tags: attraction.tags ?? [],
    city,
    is_food_spot: false,
    attraction_type: attraction.attraction_type,
    ticket_url: attraction.ticket_url,
    must_see: attraction.must_see,
    must_see_rank: attraction.must_see_rank,
    translations: attraction.translations,
  };
}

function mapsWaypoint(stop: Stop, city: string, language: string): string {
  return encodeURIComponent(
    `${localizedName(stop, language)} ${cityLabel(city, language)}`.trim(),
  );
}

export function buildMapsLink(stops: Stop[], city: string, language: string): string {
  const attractions = stops.filter((stop) => stop.type === "attraction");
  if (attractions.length < 2) return "";

  let routeStops = attractions;
  if (attractions.length > MAPS_MAX_WAYPOINTS) {
    const first = attractions[0];
    const last = attractions[attractions.length - 1];
    const middle = attractions.slice(1, -1);
    const availableSlots = MAPS_MAX_WAYPOINTS - 2;
    const sampled: Stop[] = [];
    for (let index = 0; index < availableSlots; index++) {
      const middleIndex = Math.floor((index + 1) * middle.length / (availableSlots + 1));
      sampled.push(middle[middleIndex]);
    }
    routeStops = [first, ...sampled, last];
  }

  return `https://www.google.com/maps/dir/${routeStops
    .map((stop) => mapsWaypoint(stop, city, language))
    .join("/")}?travelmode=walking`;
}

function updateDayStops(
  itinerary: Itinerary,
  dayIndex: number,
  stops: Stop[],
  language: string,
): Itinerary {
  return {
    ...itinerary,
    days: itinerary.days.map((day, index) => index === dayIndex
      ? { ...day, stops, maps_link: buildMapsLink(stops, itinerary.city, language) }
      : day),
  };
}

export function addAttractionToDay(
  itinerary: Itinerary,
  dayIndex: number,
  attraction: BuilderAttraction,
  language: string,
): Itinerary {
  const day = itinerary.days[dayIndex];
  if (!day) return itinerary;
  const alreadyAssigned = itinerary.days.some((currentDay) => currentDay.stops.some(
    (stop) => stop.type === "attraction" && stop.id === attraction.id,
  ));
  if (alreadyAssigned) return itinerary;

  const stop = builderToStop(attraction, itinerary.city);
  return updateDayStops(
    itinerary,
    dayIndex,
    insertAttractionInLightestSegment(day.stops, stop),
    language,
  );
}

export function moveAttractionToDay(
  itinerary: Itinerary,
  targetDayIndex: number,
  attractionId: number,
  sourceDayNumber: number,
  attractions: BuilderAttraction[],
  language: string,
): Itinerary {
  const targetDay = itinerary.days[targetDayIndex];
  const sourceDayIndex = itinerary.days.findIndex((day) => day.day === sourceDayNumber);
  if (!targetDay || sourceDayIndex < 0 || sourceDayIndex === targetDayIndex) return itinerary;
  if (targetDay.stops.some((stop) => stop.type === "attraction" && stop.id === attractionId)) {
    return itinerary;
  }

  const sourceDay = itinerary.days[sourceDayIndex];
  const existingStop = sourceDay.stops.find(
    (stop) => stop.type === "attraction" && stop.id === attractionId,
  );
  const attraction = attractions.find((candidate) => candidate.id === attractionId);
  const stop = existingStop ?? (attraction ? builderToStop(attraction, itinerary.city) : null);
  if (!stop) return itinerary;

  const sourceStops = optimizeAttractionsBetweenFoodStops(sourceDay.stops.filter(
    (candidate) => !(candidate.type === "attraction" && candidate.id === attractionId),
  ));
  const targetStops = insertAttractionInLightestSegment(targetDay.stops, stop);

  return {
    ...itinerary,
    days: itinerary.days.map((day, index) => {
      if (index === sourceDayIndex) {
        return { ...day, stops: sourceStops, maps_link: buildMapsLink(sourceStops, itinerary.city, language) };
      }
      if (index === targetDayIndex) {
        return { ...day, stops: targetStops, maps_link: buildMapsLink(targetStops, itinerary.city, language) };
      }
      return day;
    }),
  };
}

export function removeAttractionFromDay(
  itinerary: Itinerary,
  dayIndex: number,
  attractionId: number,
  language: string,
): Itinerary {
  const day = itinerary.days[dayIndex];
  if (!day) return itinerary;
  const exists = day.stops.some(
    (stop) => stop.type === "attraction" && stop.id === attractionId,
  );
  if (!exists) return itinerary;
  const stops = optimizeAttractionsBetweenFoodStops(day.stops.filter(
    (stop) => !(stop.type === "attraction" && stop.id === attractionId),
  ));
  return updateDayStops(itinerary, dayIndex, stops, language);
}

function stopKey(stop: Stop): string {
  return `${stop.type}:${stop.id}`;
}

export function reorderDayStops(
  itinerary: Itinerary,
  dayIndex: number,
  requestedStops: Stop[],
  language: string,
): Itinerary {
  const day = itinerary.days[dayIndex];
  if (!day) return itinerary;
  const existingByKey = new Map(day.stops.map((stop) => [stopKey(stop), stop]));
  const seen = new Set<string>();
  const ordered = requestedStops.flatMap((stop) => {
    const key = stopKey(stop);
    const existing = existingByKey.get(key);
    if (!existing || seen.has(key)) return [];
    seen.add(key);
    return [existing];
  });
  const unmentioned = day.stops.filter((stop) => !seen.has(stopKey(stop)));
  return updateDayStops(itinerary, dayIndex, [...ordered, ...unmentioned], language);
}

export function optimizeItineraryDay(
  itinerary: Itinerary,
  dayIndex: number,
  language: string,
): Itinerary {
  const day = itinerary.days[dayIndex];
  if (!day) return itinerary;
  return updateDayStops(
    itinerary,
    dayIndex,
    optimizeAttractionsBetweenFoodStops(day.stops),
    language,
  );
}
