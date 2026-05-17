import { useQuery } from "@tanstack/react-query";
import { fetchNeighborhoods } from "@/lib/cityFetchers";
import type { Neighborhood } from "@/types";

export function useNeighborhoods(city: string) {
  const { data, isLoading } = useQuery<Neighborhood[], Error>({
    queryKey: ["neighborhoods", city],
    queryFn: () => fetchNeighborhoods(city),
    enabled: !!city,
    staleTime: 1000 * 60 * 60,
  });

  return {
    neighborhoods: data ?? [],
    loading: isLoading,
  };
}
