import { useQuery } from "@tanstack/react-query";
import { fetchFoodSpots } from "@/lib/cityFetchers";
import type { BuilderAttraction } from "./useAttractions";

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
