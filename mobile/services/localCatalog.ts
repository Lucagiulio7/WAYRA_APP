import { loadBundledCity } from "@/data/localCatalogManifest";
import type { ExperienceLevel } from "@/types";
import type { LocalCityPackage, LocalItineraryPlan } from "@/types/localCatalog";

const loadedPackages = new Map<string, LocalCityPackage>();

export function getLocalCityPackage(city: string): LocalCityPackage | null {
  const cityId = city.toLowerCase().trim();
  const cached = loadedPackages.get(cityId);
  if (cached) return cached;

  const cityPackage = loadBundledCity(cityId);
  if (cityPackage) loadedPackages.set(cityId, cityPackage);
  return cityPackage;
}

export function localWalkMode(maxWalkKm = 5): 3 | 5 | 7 {
  if (maxWalkKm <= 3) return 3;
  if (maxWalkKm <= 5) return 5;
  return 7;
}

export function getLocalItineraryPlan(
  cityPackage: LocalCityPackage,
  level: ExperienceLevel,
  numDays: number,
  maxWalkKm = 5,
): LocalItineraryPlan | null {
  const experience = level === "mix" ? "mix" : "1";
  const key = `${experience}|${numDays}|${localWalkMode(maxWalkKm)}`;
  return cityPackage.plans[key] ?? null;
}
