import { getLocalCityPackage, getLocalItineraryPlan } from "@/services/localCatalog";
import type { ExperienceLevel, Itinerary, Stop } from "@/types";
import { buildMapsLink } from "@/utils/itineraryEditor";
import { repairBundledItinerary } from "@/utils/itineraryQuality";

export interface BundledGenerateParams {
  city: string;
  num_days: number;
  level: ExperienceLevel;
  max_walk_km?: number;
  language?: string;
  start_date?: string;
}

function dateForDay(startDate: string | undefined, dayIndex: number): string | undefined {
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return undefined;
  const date = new Date(`${startDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setUTCDate(date.getUTCDate() + dayIndex);
  return date.toISOString().slice(0, 10);
}

export function buildBundledItinerary(params: BundledGenerateParams): Itinerary | null {
  const cityPackage = getLocalCityPackage(params.city);
  if (!cityPackage) return null;

  const plan = getLocalItineraryPlan(
    cityPackage,
    params.level,
    params.num_days,
    params.max_walk_km ?? 5,
  );
  if (!plan) return null;

  const attractionsById = new Map(
    cityPackage.attractions.map((attraction) => [attraction.id, attraction]),
  );
  const days = plan.days.map((plannedDay, dayIndex) => {
    const stops = plannedDay.stopIds
      .map((id) => attractionsById.get(id))
      .filter((attraction): attraction is NonNullable<typeof attraction> => Boolean(attraction))
      .map((attraction) => ({
        ...attraction,
        type: "attraction" as const,
        estimated_visit_time: attraction.estimated_visit_time ?? undefined,
      })) as Stop[];

    return {
      day: plannedDay.day,
      date: dateForDay(params.start_date, dayIndex),
      day_type: plannedDay.dayType ?? "urban",
      transfer_required: plannedDay.transferRequired ?? false,
      transfer_distance_km: plannedDay.transferDistanceKm ?? 0,
      transfer_mode: plannedDay.transferMode ?? "public_transport",
      walking_distance_km: plannedDay.walkingDistanceKm,
      internal_transfer_required: plannedDay.internalTransferRequired ?? false,
      transfer_legs: plannedDay.transferLegs ?? [],
      stops,
      restaurants: [],
      maps_link: buildMapsLink(stops, cityPackage.city, params.language ?? "it"),
    };
  });

  const itinerary: Itinerary = {
    city: cityPackage.city,
    start_date: params.start_date,
    num_days: params.num_days,
    level: params.level === "mix" ? [1, 2, 3] : 1,
    max_walk_km: params.max_walk_km ?? 5,
    creation_mode: "generated",
    days,
    food_recommendations: cityPackage.foods,
    culture_facts: cityPackage.cultureFacts,
  };

  return repairBundledItinerary(
    itinerary,
    cityPackage.attractions,
    params.language ?? "it",
  );
}
