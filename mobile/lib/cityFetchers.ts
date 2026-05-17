/**
 * cityFetchers.ts
 * Funzioni fetch pure per i dati di una città.
 * Usate sia dagli hook TanStack Query sia da useCityDownload (prefetch offline).
 * Non importano React — sono chiamabili in qualsiasi contesto.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/constants/supabase";
import type { BuilderAttraction } from "@/hooks/useAttractions";
import type { CityInfo, Food, CultureFact, Neighborhood } from "@/types";

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

async function safeFetch<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ─── Attrazioni ───────────────────────────────────────────────────────────────

export async function fetchAttractions(city: string): Promise<BuilderAttraction[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/attractions` +
    `?city=eq.${encodeURIComponent(city)}` +
    `&is_food_spot=eq.false` +
    `&select=id,name,name_en,description,description_en,` +
    `category_level,latitude,longitude,estimated_visit_time,` +
    `tags,attraction_type,ticket_url,block_id,zone` +
    `&order=category_level.asc,name.asc`;
  return safeFetch<BuilderAttraction[]>(url);
}

// ─── Ristoranti / Food ────────────────────────────────────────────────────────

export async function fetchFoodSpots(city: string): Promise<BuilderAttraction[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/attractions` +
    `?city=eq.${encodeURIComponent(city)}` +
    `&is_food_spot=eq.true` +
    `&select=id,name,name_en,description,description_en,` +
    `category_level,latitude,longitude,estimated_visit_time,` +
    `tags,attraction_type,ticket_url` +
    `&order=attraction_type.asc,name.asc`;
  return safeFetch<BuilderAttraction[]>(url);
}

// ─── City info ────────────────────────────────────────────────────────────────

export async function fetchCityInfo(city: string): Promise<CityInfo | null> {
  const url =
    `${SUPABASE_URL}/rest/v1/city_info` +
    `?city=eq.${encodeURIComponent(city)}` +
    `&select=city,currency,currency_en,language,language_en,english_level,english_note,english_note_en,` +
    `timezone,emergency_numbers,voltage,water,water_en,tipping,tipping_en,transport_apps,useful_apps,` +
    `quick_tips,quick_tips_en,max_days_iconico,max_days_esploratore` +
    `&limit=1`;
  const data = await safeFetch<CityInfo[]>(url);
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

// ─── City extras (foods + culture facts) ─────────────────────────────────────

export interface CityExtrasData {
  foods: Food[];
  cultureFacts: CultureFact[];
}

export async function fetchCityExtras(city: string): Promise<CityExtrasData> {
  const foodsUrl =
    `${SUPABASE_URL}/rest/v1/foods` +
    `?city=eq.${encodeURIComponent(city)}` +
    `&select=id,name,name_en,description,description_en,ingredients,ingredients_en,city,places`;

  const factsUrl =
    `${SUPABASE_URL}/rest/v1/culture_facts` +
    `?city=eq.${encodeURIComponent(city)}` +
    `&select=icon,title,title_en,body,body_en` +
    `&order=sort_order.asc`;

  const [foodsData, factsData] = await Promise.all([
    safeFetch<Food[]>(foodsUrl),
    safeFetch<CultureFact[]>(factsUrl),
  ]);

  return {
    foods: Array.isArray(foodsData) ? foodsData : [],
    cultureFacts: Array.isArray(factsData) ? factsData : [],
  };
}

// ─── Quartieri ────────────────────────────────────────────────────────────────

export async function fetchNeighborhoods(city: string): Promise<Neighborhood[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/neighborhoods` +
    `?city=eq.${encodeURIComponent(city)}` +
    `&select=id,name,name_en,description,description_en,vibe_tags,booking_url` +
    `&order=sort_order.asc`;
  const data = await safeFetch<Neighborhood[]>(url);
  return Array.isArray(data) ? data : [];
}
