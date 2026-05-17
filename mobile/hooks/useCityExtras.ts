import { useQuery } from "@tanstack/react-query";
import { fetchCityExtras } from "@/lib/cityFetchers";
import type { CityExtrasData } from "@/lib/cityFetchers";

export function useCityExtras(city: string) {
  const { data, isLoading } = useQuery<CityExtrasData, Error>({
    queryKey: ["cityExtras", city],
    queryFn: () => fetchCityExtras(city),
    enabled: !!city,
    staleTime: 1000 * 60 * 60,
  });

  return {
    foods: data?.foods ?? [],
    cultureFacts: data?.cultureFacts ?? [],
    loading: isLoading,
  };
}
