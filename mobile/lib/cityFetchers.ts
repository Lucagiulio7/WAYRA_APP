/**
 * City content access through the Wayra backend.
 * Supabase is reserved for authentication and user-owned data.
 */

import { API_BASE_URL } from "@/constants/api";
import type { BuilderAttraction } from "@/hooks/useAttractions";
import type { CityInfo, Food, CultureFact, Neighborhood } from "@/types";

interface BackendEnvelope<T> {
  data: T;
}

async function backendFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) throw new Error(`Backend HTTP ${response.status}`);
  const payload = (await response.json()) as BackendEnvelope<T>;
  return payload.data;
}

export async function fetchAttractions(city: string): Promise<BuilderAttraction[]> {
  const encodedCity = encodeURIComponent(city);
  return backendFetch<BuilderAttraction[]>(`/api/attractions?city=${encodedCity}`);
}

export async function fetchFoodSpots(city: string): Promise<BuilderAttraction[]> {
  const encodedCity = encodeURIComponent(city);
  return backendFetch<BuilderAttraction[]>(`/api/food-spots?city=${encodedCity}`);
}

export async function fetchCityInfo(city: string): Promise<CityInfo | null> {
  const encodedCity = encodeURIComponent(city);
  return backendFetch<CityInfo | null>(`/api/city-info?city=${encodedCity}`);
}

export interface CityExtrasData {
  foods: Food[];
  cultureFacts: CultureFact[];
}

export async function fetchCityExtras(city: string): Promise<CityExtrasData> {
  const encodedCity = encodeURIComponent(city);
  const [foods, cultureFacts] = await Promise.all([
    backendFetch<Food[]>(`/api/foods?city=${encodedCity}`),
    backendFetch<CultureFact[]>(`/api/culture-facts?city=${encodedCity}`),
  ]);
  return { foods, cultureFacts };
}

export async function fetchNeighborhoods(city: string): Promise<Neighborhood[]> {
  const encodedCity = encodeURIComponent(city);
  const data = await backendFetch<Neighborhood[]>(
    `/api/neighborhoods?city=${encodedCity}`,
  );

  const seen = new Set<string>();
  return data.filter((item) => {
    const key = `${item.name}`.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
