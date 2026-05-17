import { useQuery } from "@tanstack/react-query";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/constants/supabase";
import { CityInfo } from "@/types";

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

async function fetchCityInfo(city: string): Promise<CityInfo | null> {
  const url =
    `${SUPABASE_URL}/rest/v1/city_info` +
    `?city=eq.${encodeURIComponent(city)}` +
    `&select=city,currency,currency_en,language,language_en,english_level,english_note,english_note_en,` +
    `timezone,emergency_numbers,voltage,water,water_en,tipping,tipping_en,transport_apps,useful_apps,` +
    `quick_tips,quick_tips_en,max_days_iconico,max_days_esploratore` +
    `&limit=1`;

  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

export function useCityInfo(city: string) {
  const { data: cityInfo, isLoading } = useQuery<CityInfo | null, Error>({
    queryKey: ["cityInfo", city],
    queryFn: () => fetchCityInfo(city),
    enabled: !!city,
    // cityInfo è dati statici: staleTime molto lungo, pratico per offline
    staleTime: 1000 * 60 * 60, // 1 ora
  });

  const max_days_iconico     = cityInfo?.max_days_iconico     ?? 5;
  const max_days_esploratore = cityInfo?.max_days_esploratore ?? 7;

  return { cityInfo: cityInfo ?? null, max_days_iconico, max_days_esploratore, loading: isLoading };
}
