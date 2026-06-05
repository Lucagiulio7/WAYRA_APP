import { useQuery } from "@tanstack/react-query";
import { fetchAttractions } from "@/lib/cityFetchers";

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
  is_food_spot?: boolean | null;
  food_type?: string | null;
  meal_type?: string | null;
  rating?: number | null;
  recommended_dishes?: string[];
  recommended_dishes_en?: string[];
  has_curated_dish_match?: boolean;
  must_see?: boolean;
  must_see_rank?: number | null;
}

export function useAttractions(city: string) {
  const { data, isLoading, error } = useQuery<BuilderAttraction[], Error>({
    queryKey: ["attractions", city],
    queryFn: () => fetchAttractions(city),
    enabled: !!city,
  });

  return {
    attractions: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
  };
}
