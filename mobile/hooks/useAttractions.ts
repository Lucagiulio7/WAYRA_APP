import { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/constants/supabase";

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
}

export function useAttractions(city: string) {
  const [attractions, setAttractions] = useState<BuilderAttraction[]>([]);
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
      `&is_food_spot=eq.false` +
      `&select=id,name,name_en,description,description_en,` +
      `category_level,latitude,longitude,estimated_visit_time,` +
      `tags,attraction_type,ticket_url,block_id,zone` +
      `&order=category_level.asc,name.asc`;

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
        if (!cancelled) setAttractions(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Errore caricamento attrazioni");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [city]);

  return { attractions, loading, error };
}
