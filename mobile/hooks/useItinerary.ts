import { useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import type { Itinerary } from "@/types";
import { buildBundledItinerary, type BundledGenerateParams } from "@/services/bundledItinerary";
import { normalizeItineraryStructure } from "@/utils/itineraryStructure";

type GenerateParams = BundledGenerateParams;
// ── Cache sessione ────────────────────────────────────────────────────────────
// Vive a livello di modulo: sopravvive ai re-render ma non al riavvio dell'app.
// Evita una seconda chiamata API per la stessa combinazione città+giorni+livello.

const generationCache = new Map<string, Itinerary>();

function transientGenerationError(error: unknown): boolean {
  if (!(error instanceof Error) || error.name === "AbortError") return false;
  return /network|fetch|timeout|temporar|502|503|504/i.test(error.message);
}

function cacheKey(p: GenerateParams): string {
  return `${p.city}|${p.num_days}|${p.level}|${p.max_walk_km ?? 5}|${p.language ?? "it"}|${p.start_date ?? ""}`;
}

interface UseItineraryReturn {
  itinerary: Itinerary | null;
  loading: boolean;
  error: string | null;
  generate: (params: GenerateParams) => Promise<Itinerary | null>;
  cancel: () => void;
  reset: () => void;
}

async function generateItinerary(params: GenerateParams): Promise<Itinerary> {
  const key = cacheKey(params);
  const cached = generationCache.get(key);
  if (cached) return cached;

  const bundled = buildBundledItinerary(params);
  if (!bundled) {
    throw new Error(
      `Piano locale non disponibile per "${params.city}". Rigenera i pacchetti locali prima della build.`,
    );
  }

  const validation = normalizeItineraryStructure(bundled, params.language ?? "it");
  if (!validation.itinerary) {
    throw new Error(`Piano locale non valido per "${params.city}".`);
  }

  generationCache.set(key, validation.itinerary);
  return validation.itinerary;
}

export function useItinerary(): UseItineraryReturn {
  const mutation = useMutation<Itinerary, Error, GenerateParams>({
    mutationFn: generateItinerary,
    retry: (failureCount, error) => failureCount < 1 && transientGenerationError(error),
  });

  // Ref che punta sempre all'ultima versione di mutateAsync — evita dipendenza instabile
  const mutateAsyncRef = useRef(mutation.mutateAsync);
  mutateAsyncRef.current = mutation.mutateAsync;
  const requestVersionRef = useRef(0);
  const inFlightRef = useRef<{ key: string; promise: Promise<Itinerary | null> } | null>(null);

  const generate = useCallback(
    async (params: GenerateParams): Promise<Itinerary | null> => {
      const key = cacheKey(params);
      if (inFlightRef.current?.key === key) return inFlightRef.current.promise;
      const requestVersion = ++requestVersionRef.current;
      let promise!: Promise<Itinerary | null>;
      promise = (async () => {
        try {
          const result = await mutateAsyncRef.current(params);
          if (requestVersion !== requestVersionRef.current) return null;
          return result;
        } catch (error: any) {
          return null;
        } finally {
          if (inFlightRef.current?.promise === promise) inFlightRef.current = null;
        }
      })();
      inFlightRef.current = { key, promise };
      return promise;
    },
    [],
  );

  const cancel = useCallback(() => {
    requestVersionRef.current += 1;
    inFlightRef.current = null;
  }, []);

  const reset = useCallback(() => {
    requestVersionRef.current += 1;
    inFlightRef.current = null;
    mutation.reset();
  }, [mutation.reset]);

  const errorMessage = mutation.error?.message ?? null;

  return {
    itinerary: mutation.data ?? null,
    loading: mutation.isPending,
    error: errorMessage,
    generate,
    cancel,
    reset,
  };
}
