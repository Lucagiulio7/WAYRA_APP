import type { Itinerary, ItineraryDay, Restaurant, Stop } from "@/types";
import { buildMapsLink } from "@/utils/itineraryEditor";

export type ItineraryStructureIssue =
  | "invalid_itinerary"
  | "empty_day"
  | "duplicate_stop"
  | "invalid_stop"
  | "invalid_restaurant"
  | "day_number"
  | "day_count";

export interface ItineraryStructureResult {
  itinerary: Itinerary | null;
  issues: ItineraryStructureIssue[];
  adjusted: boolean;
}

function validCoordinate(latitude: unknown, longitude: unknown): boolean {
  return typeof latitude === "number"
    && Number.isFinite(latitude)
    && latitude >= -90
    && latitude <= 90
    && typeof longitude === "number"
    && Number.isFinite(longitude)
    && longitude >= -180
    && longitude <= 180;
}

function validStop(value: unknown): value is Stop {
  if (!value || typeof value !== "object") return false;
  const stop = value as Partial<Stop>;
  return typeof stop.id === "number"
    && Number.isFinite(stop.id)
    && typeof stop.name === "string"
    && Boolean(stop.name.trim())
    && validCoordinate(stop.latitude, stop.longitude)
    && ["attraction", "food", "meal", "free_time"].includes(stop.type ?? "");
}

function validRestaurant(value: unknown): value is Restaurant {
  if (!value || typeof value !== "object") return false;
  const restaurant = value as Partial<Restaurant>;
  return typeof restaurant.id === "number"
    && Number.isFinite(restaurant.id)
    && typeof restaurant.name === "string"
    && Boolean(restaurant.name.trim())
    && validCoordinate(restaurant.latitude, restaurant.longitude);
}

function addIssue(issues: ItineraryStructureIssue[], issue: ItineraryStructureIssue) {
  if (!issues.includes(issue)) issues.push(issue);
}

/**
 * Ripara soltanto la struttura serializzata. Non aggiunge tappe, non riordina
 * l'itinerario e non applica nuovamente i vincoli qualitativi del generatore.
 */
export function normalizeItineraryStructure(
  value: unknown,
  language = "it",
): ItineraryStructureResult {
  const issues: ItineraryStructureIssue[] = [];
  if (!value || typeof value !== "object") {
    return { itinerary: null, issues: ["invalid_itinerary"], adjusted: false };
  }

  const source = value as Partial<Itinerary>;
  const city = typeof source.city === "string" ? source.city.trim().toLowerCase() : "";
  if (!city || !Array.isArray(source.days) || !source.days.length) {
    return { itinerary: null, issues: ["invalid_itinerary"], adjusted: false };
  }

  const seenAttractions = new Set<number>();
  const days: ItineraryDay[] = source.days.map((rawDay, index) => {
    const day = rawDay && typeof rawDay === "object" ? rawDay as Partial<ItineraryDay> : {};
    if (day.day !== index + 1) addIssue(issues, "day_number");

    const stops: Stop[] = [];
    for (const candidate of Array.isArray(day.stops) ? day.stops : []) {
      if (!validStop(candidate)) {
        addIssue(issues, "invalid_stop");
        continue;
      }
      const stop = { ...candidate, name: candidate.name.trim() };
      if (stop.type === "attraction") {
        if (seenAttractions.has(stop.id)) {
          addIssue(issues, "duplicate_stop");
          continue;
        }
        seenAttractions.add(stop.id);
      }
      stops.push(stop);
    }
    if (!stops.length) addIssue(issues, "empty_day");

    const restaurantIds = new Set<number>();
    const restaurants: Restaurant[] = [];
    for (const candidate of Array.isArray(day.restaurants) ? day.restaurants : []) {
      if (!validRestaurant(candidate) || restaurantIds.has(candidate.id)) {
        addIssue(issues, "invalid_restaurant");
        continue;
      }
      restaurantIds.add(candidate.id);
      restaurants.push({
        ...candidate,
        name: candidate.name.trim(),
        maps_link: typeof candidate.maps_link === "string" ? candidate.maps_link : "",
      });
    }

    return {
      ...day,
      day: index + 1,
      stops,
      restaurants,
      maps_link: buildMapsLink(stops, city, language),
    } as ItineraryDay;
  });

  if (source.num_days !== days.length) addIssue(issues, "day_count");
  if (issues.includes("empty_day")) {
    return { itinerary: null, issues, adjusted: issues.length > 0 };
  }

  const itinerary: Itinerary = {
    ...source,
    city,
    num_days: days.length,
    level: typeof source.level === "number" || Array.isArray(source.level) ? source.level : 1,
    max_walk_km: typeof source.max_walk_km === "number" && source.max_walk_km > 0
      ? source.max_walk_km
      : 5,
    days,
    food_recommendations: Array.isArray(source.food_recommendations) ? source.food_recommendations : [],
    culture_facts: Array.isArray(source.culture_facts) ? source.culture_facts : [],
  };
  return { itinerary, issues, adjusted: issues.length > 0 };
}
