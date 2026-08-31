import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { withStorageLock } from "@/services/resilientStorage";

export type { SavedItinerary } from "@/services/savedItineraryStorage";

// ── Helpers Supabase ────────────────────────────────────────────────────────────

async function remoteLoad(userId: string): Promise<SavedItinerary[]> {
  const { data, error } = await supabase
    .from("saved_itineraries")
    .select("id, saved_at, itinerary")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false })
    .limit(MAX_SAVED_ITINERARIES);

  if (error) throw error;
  if (!data) return [];
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
  const { error } = await supabase.from("saved_itineraries").upsert({
    id: entry.id,
    user_id: userId,
    city: entry.itinerary.city,
    num_days: entry.itinerary.num_days,
    itinerary: entry.itinerary,
    saved_at: entry.savedAt,
  });
  if (error) throw error;
}

async function remoteRemove(userId: string, id: string) {
  const { error } = await supabase.from("saved_itineraries").delete().eq("user_id", userId).eq("id", id);
  if (error) throw error;
}

interface PendingSync {
  saves: SavedItinerary[];
  deletes: string[];
}

const EMPTY_PENDING: PendingSync = { saves: [], deletes: [] };

function pendingKey(userId: string): string {
  return `urveya_saved_itinerary_sync_v1:${userId}`;
}

async function readPending(userId: string): Promise<PendingSync> {
  try {
    const raw = await AsyncStorage.getItem(pendingKey(userId));
    if (!raw) return EMPTY_PENDING;
    const parsed = JSON.parse(raw) as Partial<PendingSync>;
    const saves = Array.isArray(parsed.saves)
      ? parsed.saves.flatMap((entry) => {
          const normalized = normalizeSavedItinerary(entry);
          return normalized ? [normalized] : [];
        })
      : [];
    const deletes = Array.isArray(parsed.deletes)
      ? [...new Set(parsed.deletes.filter((id): id is string => typeof id === "string" && Boolean(id)))]
      : [];
    return { saves, deletes };
  } catch {
    return EMPTY_PENDING;
  }
}

function writePending(userId: string, pending: PendingSync): Promise<void> {
  const key = pendingKey(userId);
  if (!pending.saves.length && !pending.deletes.length) return AsyncStorage.removeItem(key);
  return AsyncStorage.setItem(key, JSON.stringify(pending));
}

function mutatePending(userId: string, mutation: (current: PendingSync) => PendingSync): Promise<PendingSync> {
  return withStorageLock(pendingKey(userId), async () => {
    const next = mutation(await readPending(userId));
    await writePending(userId, next);
    return next;
  });
}

function enqueueSave(userId: string, entry: SavedItinerary): Promise<PendingSync> {
  return mutatePending(userId, (current) => ({
    saves: [entry, ...current.saves.filter((item) => item.id !== entry.id)],
    deletes: current.deletes.filter((id) => id !== entry.id),
  }));
}

function enqueueDelete(userId: string, id: string): Promise<PendingSync> {
  return mutatePending(userId, (current) => ({
    saves: current.saves.filter((item) => item.id !== id),
    deletes: current.deletes.includes(id) ? current.deletes : [...current.deletes, id],
  }));
}

function completeSave(userId: string, id: string): Promise<PendingSync> {
  return mutatePending(userId, (current) => ({ ...current, saves: current.saves.filter((item) => item.id !== id) }));
}

function completeDelete(userId: string, id: string): Promise<PendingSync> {
  return mutatePending(userId, (current) => ({ ...current, deletes: current.deletes.filter((item) => item !== id) }));
}

async function flushPending(userId: string): Promise<PendingSync> {
  return withStorageLock(pendingKey(userId), async () => {
    const pending = await readPending(userId);
    const remainingDeletes: string[] = [];
    const remainingSaves: SavedItinerary[] = [];

    for (const id of pending.deletes) {
      try { await remoteRemove(userId, id); }
      catch { remainingDeletes.push(id); }
    }
    for (const entry of pending.saves) {
      if (pending.deletes.includes(entry.id)) continue;
      try { await remoteSave(userId, entry); }
      catch { remainingSaves.push(entry); }
    }

    const remaining = { saves: remainingSaves, deletes: remainingDeletes };
    await writePending(userId, remaining);
    return remaining;
  });
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
  const [syncError, setSyncError] = useState<string | null>(null);

  // La copia locale e sempre primaria; l'account aggiunge solo la sincronizzazione.
  useEffect(() => {
    let active = true;
    setLoading(true);
    void (async () => {
      try {
        const local = await loadSavedItineraries();
        if (!active) return;
        setSaved(local);
        setLoading(false);

        if (!user) {
          setSyncError(null);
          return;
        }
        const pending = await flushPending(user.id);
        const pendingDeleteIds = new Set(pending.deletes);
        const remote = (await remoteLoad(user.id)).filter((entry) => !pendingDeleteIds.has(entry.id));
        if (!active) return;

        const remoteById = new Map(remote.map((entry) => [entry.id, entry]));
        const pendingSaveIds = new Set(pending.saves.map((entry) => entry.id));
        let uploadFailed = false;
        for (const entry of local) {
          const remoteEntry = remoteById.get(entry.id);
          if (pendingSaveIds.has(entry.id) || (remoteEntry && remoteEntry.savedAt >= entry.savedAt)) continue;
          try { await remoteSave(user.id, entry); }
          catch {
            uploadFailed = true;
            await enqueueSave(user.id, entry);
          }
        }

        const merged = await mutateSavedItineraries((current) => mergeSavedItineraries(current, remote));
        if (active) {
          setSaved(merged);
          setSyncError(uploadFailed || pending.saves.length || pending.deletes.length ? "pending" : null);
        }
      } catch {
        if (active) {
          setSyncError(user ? "unavailable" : null);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
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
      if (user) {
        await enqueueSave(user.id, entry);
        try {
          await remoteSave(user.id, entry);
          await completeSave(user.id, entry.id);
          setSyncError(null);
        } catch {
          setSyncError("pending");
        }
      }
      return id;
    },
    [user],
  );

  /** Elimina un itinerario per id. */
  const remove = useCallback(
    async (id: string) => {
      const updated = await mutateSavedItineraries((current) => current.filter((s) => s.id !== id));
      setSaved(updated);
      if (user) {
        await enqueueDelete(user.id, id);
        try {
          await remoteRemove(user.id, id);
          await completeDelete(user.id, id);
          setSyncError(null);
        } catch {
          setSyncError("pending");
        }
      }
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

  return { saved, loading, syncError, save, remove, findSavedId };
}
