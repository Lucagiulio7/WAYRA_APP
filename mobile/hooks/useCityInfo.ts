import { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/constants/supabase";
import { CityInfo } from "@/types";

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

export function useCityInfo(city: string) {
  const [cityInfo, setCityInfo] = useState<CityInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city) return;
    let cancelled = false;
    setLoading(true);

    const url =
      `${SUPABASE_URL}/rest/v1/city_info` +
      `?city=eq.${encodeURIComponent(city)}` +
      `&select=city,currency,currency_en,language,language_en,english_level,english_note,english_note_en,` +
      `timezone,emergency_numbers,voltage,water,water_en,tipping,tipping_en,transport_apps,useful_apps,` +
      `quick_tips,quick_tips_en,max_days_iconico,max_days_esploratore` +
      `&limit=1`;

    fetch(url, { headers: HEADERS })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setCityInfo(Array.isArray(data) && data.length > 0 ? data[0] : null);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [city]);

  // Product rule for the supported catalog: Iconico is capped to essentials,
  // while Esploratore can use the full attraction pool.
  const max_days_iconico = 5;
  const max_days_esploratore = 7;

  return { cityInfo, max_days_iconico, max_days_esploratore, loading };
}
