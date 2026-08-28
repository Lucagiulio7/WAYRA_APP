/**
 * Local city catalog access.
 *
 * Maps, external links and optional account sync may use the network, but the
 * travel catalog is always bundled with the app.
 */

import type { BuilderAttraction } from "@/hooks/useAttractions";
import type { CityInfo, Food, CultureFact, Neighborhood } from "@/types";
import { getLocalCityPackage } from "@/services/localCatalog";

function requiredCityPackage(city: string) {
  const cityPackage = getLocalCityPackage(city);
  if (!cityPackage) {
    throw new Error(
      `Catalogo locale non disponibile per "${city}". Rigenera i pacchetti città prima della build.`,
    );
  }
  return cityPackage;
}

export async function fetchAttractions(city: string): Promise<BuilderAttraction[]> {
  return requiredCityPackage(city).attractions;
}

export async function fetchFoodSpots(city: string): Promise<BuilderAttraction[]> {
  return requiredCityPackage(city).foodSpots;
}

export async function fetchCityInfo(city: string): Promise<CityInfo | null> {
  const cityPackage = requiredCityPackage(city);
  if (!cityPackage.cityInfo) {
    throw new Error(`Info utili locali mancanti per "${city}".`);
  }
  return {
    ...cityPackage.cityInfo,
    max_days_iconico: cityPackage.maxDaysIconic,
    max_days_esploratore: cityPackage.maxDaysExplorer,
  };
}

export interface CityExtrasData {
  foods: Food[];
  cultureFacts: CultureFact[];
}

export async function fetchCityExtras(city: string): Promise<CityExtrasData> {
  const cityPackage = requiredCityPackage(city);
  return {
    foods: cityPackage.foods,
    cultureFacts: cityPackage.cultureFacts,
  };
}

export async function fetchNeighborhoods(city: string): Promise<Neighborhood[]> {
  const neighborhoods = requiredCityPackage(city).neighborhoods;
  const seen = new Set<string>();
  return neighborhoods.filter((item) => {
    const key = item.name.trim().toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}