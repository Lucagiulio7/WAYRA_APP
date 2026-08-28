import { useState, useEffect, useCallback } from "react";
import { Itinerary } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  loadSavedItineraries,
  MAX_SAVED_ITINERARIES,
  mergeSavedItineraries,
  mutateSavedItineraries,
  normalizeSavedItinerary,
  type SavedItinerary,
} from "@/services/savedItineraryStorage";

export type { SavedItinerary } from "@/services/savedItineraryStorage";

// ── Helpers Supabase ────────────────────────────────────────────────────────────

async function remoteLoad(userId: string): Promise<SavedItinerary[]> {
  const { data, error } = await supabase
    .from("saved_itineraries")
    .select("id, saved_at, itinerary")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false })
    .limit(MAX_SAVED_ITINERARIES);

  if (error || !data) return [];
  return data.flatMap((row: any) => {
    const entry = normalizeSavedItinerary({
      id: row.id,
      savedAt: row.saved_at,
      itinerary: row.itinerary,
    });
    return entry ? [entry] : [];
  });
}

async function remoteSave(userId: string, entry: SavedItinerary) {
  await supabase.from("saved_itineraries").upsert({
    id: entry.id,
    user_id: userId,
    city: entry.itinerary.city,
    num_days: entry.itinerary.num_days,
    itinerary: entry.itinerary,
    saved_at: entry.savedAt,
  });
}

async function remoteRemove(userId: string, id: string) {
  await supabase.from("saved_itineraries").delete().eq("user_id", userId).eq("id", id);
}

// ── Fingerprint itinerario ─────────────────────────────────────────────────────
// Stringa stabile che identifica univocamente un itinerario:
// città + numero giorni + sequenza degli id attrazione per ogni giorno.
// Molto più veloce e robusto del JSON.stringify sull'intero oggetto.
function itineraryFingerprint(it: Itinerary): string {
  const stopIds = it.days
    .map((d) =>
      d.stops
        .filter((s) => s.type === "attraction" && s.id > 0)
        .map((s) => s.id)
        .join("-"),
    )
    .join("|");
  return `${it.city}::${it.num_days}::${stopIds}`;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useSavedItineraries() {
  const { user } = useAuth();
  const [saved, setSaved] = useState<SavedItinerary[]>([]);
  const [loading, setLoading] = useState(true);

  // La copia locale e sempre primaria; l'account aggiunge solo la sincronizzazione.
  useEffect(() => {
    let active = true;
    setLoading(true);
    void loadSavedItineraries().then(async (local) => {
      if (!active) return;
      setSaved(local);
      setLoading(false);

      if (!user) return;
      const remote = await remoteLoad(user.id);
      if (!active) return;
      const merged = await mutateSavedItineraries((current) => mergeSavedItineraries(current, remote));
      if (active) setSaved(merged);
    });
    return () => { active = false; };
  }, [user?.id]);

  /** Salva un nuovo itinerario. */
  const save = useCallback(
    async (itinerary: Itinerary): Promise<string> => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const entry: SavedItinerary = {
        id,
        savedAt: new Date().toISOString(),
        itinerary,
      };
      const updated = await mutateSavedItineraries((current) => [entry, ...current]);
      setSaved(updated);
      if (user) void remoteSave(user.id, entry);
      return id;
    },
    [user],
  );

  /** Elimina un itinerario per id. */
  const remove = useCallback(
    async (id: string) => {
      const updated = await mutateSavedItineraries((current) => current.filter((s) => s.id !== id));
      setSaved(updated);
      if (user) void remoteRemove(user.id, id);
    },
    [user],
  );

  /** Restituisce l'id se già salvato, altrimenti null. */
  const findSavedId = useCallback(
    (itinerary: Itinerary): string | null => {
      const fp = itineraryFingerprint(itinerary);
      return saved.find((s) => itineraryFingerprint(s.itinerary) === fp)?.id ?? null;
    },
    [saved],
  );

  return { saved, loading, save, remove, findSavedId };
}
