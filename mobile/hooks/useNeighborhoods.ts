import { useQuery } from "@tanstack/react-query";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/constants/supabase";
import { Neighborhood } from "@/types";

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

async function fetchNeighborhoods(city: string): Promise<Neighborhood[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/neighborhoods` +
    `?city=eq.${encodeURIComponent(city)}` +
    `&select=id,name,name_en,description,description_en,vibe_tags,booking_url` +
    `&order=sort_order.asc`;

  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

export function useNeighborhoods(city: string) {
  const { data, isLoading } = useQuery<Neighborhood[], Error>({
    queryKey: ["neighborhoods", city],
    queryFn: () => fetchNeighborhoods(city),
    enabled: !!city,
    staleTime: 1000 * 60 * 60, // 1 ora
  });

  return {
    neighborhoods: data ?? [],
    loading: isLoading,
  };
}
