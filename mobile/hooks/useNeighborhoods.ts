import { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/constants/supabase";
import { Neighborhood } from "@/types";

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

export function useNeighborhoods(city: string) {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city) return;
    let cancelled = false;
    setLoading(true);

    const url =
      `${SUPABASE_URL}/rest/v1/neighborhoods` +
      `?city=eq.${encodeURIComponent(city)}` +
      `&select=id,name,name_en,description,description_en,vibe_tags,booking_url` +
      `&order=sort_order.asc`;

    fetch(url, { headers: HEADERS })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setNeighborhoods(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [city]);

  return { neighborhoods, loading };
}
