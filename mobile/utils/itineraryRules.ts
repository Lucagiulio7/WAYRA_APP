import type { Stop } from "@/types";
import { isMuseumType, routeWalkingKm } from "@/utils/routeMetrics";

export type EffortMode = "relaxed" | "balanced" | "intense";

export interface EffortProfile {
  mode: EffortMode;
  minMinutes: number;
  targetMinutes: number;
  maxMinutes: number;
  minAttractions: number;
  maxAttractions: number;
  maxWalkKm: 3 | 5 | 7;
}

export const MAX_MUSEUMS_PER_DAY = 2;
export const MAX_ACTIVITY_MINUTES = 420;
export const MANUAL_MAX_WALK_KM = 4;

export const EFFORT_PROFILES: Record<EffortMode, EffortProfile> = {
  relaxed: {
    mode: "relaxed",
    minMinutes: 240,
    targetMinutes: 300,
    maxMinutes: 330,
    minAttractions: 4,
    maxAttractions: 5,
    maxWalkKm: 3,
  },
  balanced: {
    mode: "balanced",
    minMinutes: 300,
    targetMinutes: 360,
    maxMinutes: 390,
    minAttractions: 5,
    maxAttractions: 6,
    maxWalkKm: 5,
  },
  intense: {
    mode: "intense",
    minMinutes: 360,
    targetMinutes: 390,
    maxMinutes: MAX_ACTIVITY_MINUTES,
    minAttractions: 6,
    maxAttractions: 8,
    maxWalkKm: 7,
  },
};

export function getEffortProfile(maxWalkKm = 5): EffortProfile {
  if (maxWalkKm <= 3) return EFFORT_PROFILES.relaxed;
  if (maxWalkKm <= 5) return EFFORT_PROFILES.balanced;
  return EFFORT_PROFILES.intense;
}

export function attractionStops(stops: Stop[]): Stop[] {
  return stops.filter((stop) => stop.type === "attraction");
}

export function activityMinutes(stops: Stop[]): number {
  return attractionStops(stops).reduce(
    (sum, stop) => sum + (stop.estimated_visit_time ?? 60),
    0,
  );
}

export function museumCount(stops: Stop[]): number {
  return attractionStops(stops).filter((stop) => isMuseumType(stop.attraction_type)).length;
}

export function walkingRouteKm(stops: Stop[]): number {
  return routeWalkingKm(attractionStops(stops));
}
