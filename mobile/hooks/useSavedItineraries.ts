import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Itinerary } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const LOCAL_KEY = "wayra_saved_itineraries";
const MAX_SAVED = 30;

export interface SavedItinerary {
  id: string;
  savedAt: string;
  itinerary: Itinerary;
}

// ── Helpers locale ─────────────────────────────────────────────────────────────

async function localLoad(): Promise<SavedItinerary[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as SavedItinerary[]) : [];
  } catch {
    return [];
  }
}

async function localPersist(list: SavedItinerary[]) {
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(list));
}

// ── Helpers Supabase ────────────────────────────────────────────────────────────

async function remoteLoad(userId: string): Promise<SavedItinerary[]> {
  const { data, error } = await supabase
    .from("saved_itineraries")
    .select("id, saved_at, itinerary")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false })
    .limit(MAX_SAVED);

  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    savedAt: row.saved_at,
    itinerary: row.itinerary as Itinerary,
  }));
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

async function remoteRemove(id: string) {
  await supabase.from("saved_itineraries").delete().eq("id", id);
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

  // Ricarica ogni volta che cambia l'utente (login / logout)
  useEffect(() => {
    setLoading(true);
    const load = user ? remoteLoad(user.id) : localLoad();
    load.then((list) => {
      setSaved(list);
      setLoading(false);
    });
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
      const updated = [entry, ...saved].slice(0, MAX_SAVED);
      setSaved(updated);
      if (user) {
        await remoteSave(user.id, entry);
      } else {
        await localPersist(updated);
      }
      return id;
    },
    [saved, user],
  );

  /** Elimina un itinerario per id. */
  const remove = useCallback(
    async (id: string) => {
      const updated = saved.filter((s) => s.id !== id);
      setSaved(updated);
      if (user) {
        await remoteRemove(id);
      } else {
        await localPersist(updated);
      }
    },
    [saved, user],
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
