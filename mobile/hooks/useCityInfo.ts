import { useQuery } from "@tanstack/react-query";
import { fetchCityInfo } from "@/lib/cityFetchers";
import type { CityInfo } from "@/types";

export function useCityInfo(city: string) {
  const { data: cityInfo, isLoading } = useQuery<CityInfo | null, Error>({
    queryKey: ["cityInfo", city],
    queryFn: () => fetchCityInfo(city),
    enabled: !!city,
    staleTime: 1000 * 60 * 60, // 1 ora
  });

  // Guard: se la colonna è NULL, 0 o 1 (default DB non ancora normalizzato) usa il fallback
  const raw_ico  = cityInfo?.max_days_iconico;
  const raw_exp  = cityInfo?.max_days_esploratore;
  const max_days_iconico     = (raw_ico  != null && raw_ico  > 1) ? raw_ico  : 5;
  const max_days_esploratore = (raw_exp  != null && raw_exp  > 1) ? raw_exp  : 7;

  return { cityInfo: cityInfo ?? null, max_days_iconico, max_days_esploratore, loading: isLoading };
}
