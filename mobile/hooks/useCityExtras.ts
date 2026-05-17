import { useQuery } from "@tanstack/react-query";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/constants/supabase";
import { Food, CultureFact } from "@/types";

interface CityExtras {
  foods: Food[];
  cultureFacts: CultureFact[];
}

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

async function fetchCityExtras(city: string): Promise<CityExtras> {
  const foodsUrl =
    `${SUPABASE_URL}/rest/v1/foods` +
    `?city=eq.${encodeURIComponent(city)}` +
    `&select=id,name,name_en,description,description_en,ingredients,ingredients_en,city,places`;

  const factsUrl =
    `${SUPABASE_URL}/rest/v1/culture_facts` +
    `?city=eq.${encodeURIComponent(city)}` +
    `&select=icon,title,title_en,body,body_en` +
    `&order=sort_order.asc`;

  const safeFetch = (url: string) =>
    fetch(url, { headers: HEADERS }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });

  const [foodsData, factsData] = await Promise.all([
    safeFetch(foodsUrl),
    safeFetch(factsUrl),
  ]);

  return {
    foods: Array.isArray(foodsData) ? foodsData : [],
    cultureFacts: Array.isArray(factsData) ? factsData : [],
  };
}

export function useCityExtras(city: string) {
  const { data, isLoading } = useQuery<CityExtras, Error>({
    queryKey: ["cityExtras", city],
    queryFn: () => fetchCityExtras(city),
    enabled: !!city,
    staleTime: 1000 * 60 * 60, // 1 ora – dati statici
  });

  return {
    foods: data?.foods ?? [],
    cultureFacts: data?.cultureFacts ?? [],
    loading: isLoading,
  };
}
