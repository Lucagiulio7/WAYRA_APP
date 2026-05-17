import { useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
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
  cancel: () => void;
  reset: () => void;
}

async function generateItinerary(
  params: GenerateParams,
  signal: AbortSignal,
): Promise<Itinerary> {
  const apiLevel = params.level === "mix" ? [1, 2, 3] : params.level;

  const resp = await fetch(`${FUNCTIONS_URL}/generate-itinerary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      city: params.city,
      num_days: params.num_days,
      level: apiLevel,
      max_walk_km: params.max_walk_km,
    }),
    signal,
  });

  const json = await resp.json();
  if (!resp.ok) throw new Error(json.error ?? "Errore sconosciuto dal server");
  return json.data as Itinerary;
}

export function useItinerary(): UseItineraryReturn {
  const controllerRef = useRef<AbortController | null>(null);

  const mutation = useMutation<Itinerary, Error, GenerateParams>({
    mutationFn: (params) => {
      const controller = new AbortController();
      controllerRef.current = controller;

      // timeout di 20 s
      const timeout = setTimeout(() => controller.abort(), 20_000);
      return generateItinerary(params, controller.signal).finally(() => {
        clearTimeout(timeout);
        controllerRef.current = null;
      });
    },
  });

  const generate = useCallback(
    async (params: GenerateParams) => {
      try {
        await mutation.mutateAsync(params);
      } catch {
        // l'errore è già in mutation.error, non serve rilanciare
      }
    },
    [mutation.mutateAsync],
  );

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    mutation.reset();
  }, [mutation.reset]);

  const errorMessage = mutation.error
    ? mutation.error.name === "AbortError"
      ? "Timeout: la funzione non risponde. Riprova tra qualche secondo."
      : (mutation.error.message ?? "Impossibile raggiungere il server.")
    : null;

  return {
    itinerary: mutation.data ?? null,
    loading: mutation.isPending,
    error: errorMessage,
    generate,
    cancel,
    reset,
  };
}
