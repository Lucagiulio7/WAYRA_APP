import { useState } from "react";
import { FUNCTIONS_URL, SUPABASE_ANON_KEY } from "@/constants/supabase";
import { Itinerary, ExperienceLevel } from "@/types";

interface GenerateParams {
  city: string;
  num_days: number;
  level: ExperienceLevel;
  max_walk_km?: number;
}

interface UseItineraryReturn {
  itinerary: Itinerary | null;
  loading: boolean;
  error: string | null;
  generate: (params: GenerateParams) => Promise<void>;
  reset: () => void;
}

export function useItinerary(): UseItineraryReturn {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async ({ city, num_days, level, max_walk_km }: GenerateParams) => {
    setLoading(true);
    setError(null);
    setItinerary(null);

    const apiLevel = level === "mix" ? [1, 2, 3] : level;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const resp = await fetch(`${FUNCTIONS_URL}/generate-itinerary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ city, num_days, level: apiLevel, max_walk_km }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const json = await resp.json();

      if (!resp.ok) {
        throw new Error(json.error ?? "Errore sconosciuto dal server");
      }

      setItinerary(json.data);
    } catch (e: any) {
      const msg = e?.name === "AbortError"
        ? "Timeout: la funzione non risponde. Riprova tra qualche secondo."
        : (e.message ?? "Impossibile raggiungere il server.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setItinerary(null);
    setError(null);
  };

  return { itinerary, loading, error, generate, reset };
}
