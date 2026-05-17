import { useQuery } from "@tanstack/react-query";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/constants/supabase";
import { BuilderAttraction } from "./useAttractions";

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

async function fetchFoodSpots(city: string): Promise<BuilderAttraction[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/attractions` +
    `?city=eq.${encodeURIComponent(city)}` +
    `&is_food_spot=eq.true` +
    `&select=id,name,name_en,description,description_en,` +
    `category_level,latitude,longitude,estimated_visit_time,` +
    `tags,attraction_type,ticket_url` +
    `&order=attraction_type.asc,name.asc`;

  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export function useFoodSpots(city: string) {
  const { data, isLoading, error } = useQuery<BuilderAttraction[], Error>({
    queryKey: ["foodSpots", city],
    queryFn: () => fetchFoodSpots(city),
    enabled: !!city,
  });

  return {
    foodSpots: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
  };
}
