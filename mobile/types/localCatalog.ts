import type { BuilderAttraction } from "@/hooks/useAttractions";
import type { CityInfo, CultureFact, Food, Neighborhood } from "@/types";

export interface LocalPlanDay {
  day: number;
  stopIds: number[];
  dayType?: "urban" | "excursion";
  transferRequired?: boolean;
  transferDistanceKm?: number;
  transferMode?: "public_transport" | "ferry";
  walkingDistanceKm?: number;
  internalTransferRequired?: boolean;
  transferLegs?: Array<{
    from_stop_id?: number;
    to_stop_id?: number;
    distance_km: number;
    mode: "public_transport" | "ferry";
  }>;
}

export interface LocalItineraryPlan {
  days: LocalPlanDay[];
}

export interface LocalCityPackage {
  version: number;
  city: string;
  maxDaysIconic: number;
  maxDaysExplorer: number;
  attractions: BuilderAttraction[];
  foodSpots: BuilderAttraction[];
  cityInfo: CityInfo | null;
  foods: Food[];
  cultureFacts: CultureFact[];
  neighborhoods: Neighborhood[];
  plans: Record<string, LocalItineraryPlan>;
}
