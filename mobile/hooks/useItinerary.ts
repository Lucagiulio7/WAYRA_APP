import { useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { API_BASE_URL } from "@/constants/api";
import { Itinerary, ExperienceLevel } from "@/types";

interface GenerateParams {
  city: string;
  num_days: number;
  level: ExperienceLevel;
}

// ── Cache sessione ────────────────────────────────────────────────────────────
// Vive a livello di modulo: sopravvive ai re-render ma non al riavvio dell'app.
// Evita una seconda chiamata API per la stessa combinazione città+giorni+livello.

const generationCache = new Map<string, Itinerary>();

function cacheKey(p: GenerateParams): string {
  return `${p.city}|${p.num_days}|${p.level}`;
}

interface UseItineraryReturn {
  itinerary: Itinerary | null;
  loading: boolean;
  error: string | null;
  generate: (params: GenerateParams) => Promise<Itinerary | null>;
  cancel: () => void;
  reset: () => void;
}

async function generateItinerary(
  params: GenerateParams,
  signal: AbortSignal,
): Promise<Itinerary> {
  // ── Cache hit ──
  const key = cacheKey(params);
  const cached = generationCache.get(key);
  if (cached) {
    console.log("[gen] cache hit →", key);
    return cached;
  }

  const apiLevel = params.level === "mix" ? [1, 2, 3] : params.level;
  console.log("[gen] fetch →", `${API_BASE_URL}/api/itinerary/generate`, { city: params.city, num_days: params.num_days, level: apiLevel });

  let resp: Response;
  try {
    resp = await fetch(`${API_BASE_URL}/api/itinerary/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: params.city,
        num_days: params.num_days,
        level: apiLevel,
      }),
      signal,
    });
    console.log("[gen] HTTP", resp.status);
  } catch (err: any) {
    // Network-level error (server unreachable, no connection, etc.)
    console.log("[gen] fetch error → name:", err?.name, "| message:", err?.message);
    // Re-throw AbortError così il mutationFn può distinguere timeout vs abort di rete
    if (err?.name === "AbortError") throw err;
    throw new Error(
      `Impossibile contattare il server (${API_BASE_URL}). Assicurati di essere connesso alla stessa rete del backend.`,
    );
  }

  let json: any;
  try {
    json = await resp.json();
  } catch {
    throw new Error(`Il server ha risposto con dati non validi (HTTP ${resp.status}).`);
  }

  // FastAPI restituisce errori con { detail: "..." }, successi con { data: ... }
  if (!resp.ok) {
    const detail = json.detail ?? json.error ?? `Errore del server (HTTP ${resp.status}).`;
    console.log("[gen] backend error →", detail);
    throw new Error(detail);
  }
  if (!json.data) throw new Error("Il server non ha restituito dati. Verifica che il backend sia aggiornato.");

  console.log("[gen] success → giorni:", (json.data as Itinerary).days?.length);

  // ── Salva in cache ──
  generationCache.set(key, json.data as Itinerary);

  return json.data as Itinerary;
}

export function useItinerary(): UseItineraryReturn {
  const controllerRef = useRef<AbortController | null>(null);

  const mutation = useMutation<Itinerary, Error, GenerateParams>({
    mutationFn: (params) => {
      const controller = new AbortController();
      controllerRef.current = controller;

      // Traccia se l'abort è stato causato dal NOSTRO timer (timeout reale)
      // vs un abort immediato della rete (es. connection refused su Android)
      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, 30_000);

      return generateItinerary(params, controller.signal)
        .catch((err) => {
          if (err?.name === "AbortError") {
            if (timedOut) {
              // Timeout reale: il server non ha risposto entro 30 s
              throw new Error("__TIMEOUT__");
            } else {
              // Abort immediato: connessione rifiutata o server non raggiungibile
              throw new Error(
                `Impossibile raggiungere il server (${API_BASE_URL}).\n` +
                `Assicurati che il backend sia avviato e che il dispositivo\n` +
                `sia sulla stessa rete WiFi del PC.`,
              );
            }
          }
          throw err;
        })
        .finally(() => {
          clearTimeout(timeout);
          controllerRef.current = null;
        });
    },
  });

  const generate = useCallback(
    async (params: GenerateParams): Promise<Itinerary | null> => {
      try {
        return await mutation.mutateAsync(params);
      } catch {
        // l'errore è già in mutation.error, non serve rilanciare
        return null;
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
    ? mutation.error.message === "__TIMEOUT__"
      ? "Timeout: il server non ha risposto entro 30 secondi. Riprova tra qualche secondo."
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
