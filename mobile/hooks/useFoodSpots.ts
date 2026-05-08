import { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/constants/supabase";
import { BuilderAttraction } from "./useAttractions";

export function useFoodSpots(city: string) {
  const [foodSpots, setFoodSpots] = useState<BuilderAttraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url =
      `${SUPABASE_URL}/rest/v1/attractions` +
      `?city=eq.${encodeURIComponent(city)}` +
      `&is_food_spot=eq.true` +
      `&select=id,name,name_en,description,description_en,` +
      `category_level,latitude,longitude,estimated_visit_time,` +
      `tags,attraction_type,ticket_url` +
      `&order=attraction_type.asc,name.asc`;

    fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: BuilderAttraction[]) => {
        if (!cancelled) setFoodSpots(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Errore caricamento ristoranti");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [city]);

  return { foodSpots, loading, error };
}
