import { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/constants/supabase";
import { Food, CultureFact } from "@/types";

interface CityExtras {
  foods: Food[];
  cultureFacts: CultureFact[];
  loading: boolean;
}

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

export function useCityExtras(city: string): CityExtras {
  const [foods, setFoods] = useState<Food[]>([]);
  const [cultureFacts, setCultureFacts] = useState<CultureFact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city) return;
    let cancelled = false;
    setLoading(true);

    const foodsUrl =
      `${SUPABASE_URL}/rest/v1/foods` +
      `?city=eq.${encodeURIComponent(city)}` +
      `&select=id,name,name_en,description,description_en,ingredients,ingredients_en,city,places`;

    const factsUrl =
      `${SUPABASE_URL}/rest/v1/culture_facts` +
      `?city=eq.${encodeURIComponent(city)}` +
      `&select=icon,title,title_en,body,body_en` +
      `&order=sort_order.asc`;

    Promise.all([
      fetch(foodsUrl, { headers: HEADERS }).then((r) => r.json()),
      fetch(factsUrl, { headers: HEADERS }).then((r) => r.json()),
    ])
      .then(([foodsData, factsData]) => {
        if (!cancelled) {
          setFoods(Array.isArray(foodsData) ? foodsData : []);
          setCultureFacts(Array.isArray(factsData) ? factsData : []);
        }
      })
      .catch(() => {
        // Fallback silenzioso: le sezioni rimarranno vuote
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [city]);

  return { foods, cultureFacts, loading };
}
