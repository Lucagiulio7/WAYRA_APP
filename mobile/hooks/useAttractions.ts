import { useQuery } from "@tanstack/react-query";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/constants/supabase";

export interface BuilderAttraction {
  id: number;
  name: string;
  name_en?: string | null;
  description?: string | null;
  description_en?: string | null;
  category_level: number;
  latitude: number;
  longitude: number;
  estimated_visit_time?: number | null;
  tags?: string[] | null;
  attraction_type?: string | null;
  ticket_url?: string | null;
  block_id?: number | null;
  zone?: string | null;
}

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

async function fetchAttractions(city: string): Promise<BuilderAttraction[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/attractions` +
    `?city=eq.${encodeURIComponent(city)}` +
    `&is_food_spot=eq.false` +
    `&select=id,name,name_en,description,description_en,` +
    `category_level,latitude,longitude,estimated_visit_time,` +
    `tags,attraction_type,ticket_url,block_id,zone` +
    `&order=category_level.asc,name.asc`;

  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export function useAttractions(city: string) {
  const { data, isLoading, error } = useQuery<BuilderAttraction[], Error>({
    queryKey: ["attractions", city],
    queryFn: () => fetchAttractions(city),
    enabled: !!city,
    // staleTime e gcTime ereditati dai defaultOptions del queryClient
  });

  return {
    attractions: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
  };
}
