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

  const max_days_iconico     = cityInfo?.max_days_iconico     ?? 5;
  const max_days_esploratore = cityInfo?.max_days_esploratore ?? 7;

  return { cityInfo: cityInfo ?? null, max_days_iconico, max_days_esploratore, loading: isLoading };
}
