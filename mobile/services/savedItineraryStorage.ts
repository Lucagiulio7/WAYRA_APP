import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Itinerary } from "@/types";
import { normalizeItineraryStructure } from "@/utils/itineraryStructure";
import { withStorageLock } from "@/services/resilientStorage";

const PRIMARY_KEY = "wayra_saved_itineraries_v2";
const BACKUP_KEY = "wayra_saved_itineraries_backup_v2";
const LEGACY_KEY = "wayra_saved_itineraries";
export const MAX_SAVED_ITINERARIES = 30;

export interface SavedItinerary {
  id: string;
  savedAt: string;
  itinerary: Itinerary;
}

interface SavedEnvelope {
  version: 2;
  updatedAt: string;
  entries: SavedItinerary[];
}

export function normalizeSavedItinerary(value: unknown): SavedItinerary | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<SavedItinerary>;
  if (typeof candidate.id !== "string" || !candidate.id.trim()) return null;
  if (typeof candidate.savedAt !== "string" || !Number.isFinite(Date.parse(candidate.savedAt))) return null;
  const itinerary = normalizeItineraryStructure(candidate.itinerary).itinerary;
  return itinerary ? { id: candidate.id, savedAt: candidate.savedAt, itinerary } : null;
}

function normalizeList(value: unknown): SavedItinerary[] | null {
  if (!Array.isArray(value)) return null;
  const entries = value.flatMap((entry) => {
    const normalized = normalizeSavedItinerary(entry);
    return normalized ? [normalized] : [];
  });
  return entries
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .slice(0, MAX_SAVED_ITINERARIES);
}

function decode(raw: string): SavedItinerary[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return normalizeList(parsed);
    if (!parsed || typeof parsed !== "object") return null;
    const envelope = parsed as Partial<SavedEnvelope>;
    return envelope.version === 2 ? normalizeList(envelope.entries) : null;
  } catch {
    return null;
  }
}

function encode(entries: SavedItinerary[]): string {
  const envelope: SavedEnvelope = { version: 2, updatedAt: new Date().toISOString(), entries };
  return JSON.stringify(envelope);
}

async function readUnlocked(): Promise<SavedItinerary[]> {
  for (const key of [PRIMARY_KEY, BACKUP_KEY, LEGACY_KEY]) {
    const raw = await AsyncStorage.getItem(key).catch(() => null);
    if (!raw) continue;
    const entries = decode(raw);
    if (entries !== null) return entries;
  }
  return [];
}

export function loadSavedItineraries(): Promise<SavedItinerary[]> {
  return withStorageLock(PRIMARY_KEY, async () => {
    const primaryRaw = await AsyncStorage.getItem(PRIMARY_KEY).catch(() => null);
    const primary = primaryRaw ? decode(primaryRaw) : null;
    if (primary !== null) return primary;

    const backupRaw = await AsyncStorage.getItem(BACKUP_KEY).catch(() => null);
    const backup = backupRaw ? decode(backupRaw) : null;
    if (backup !== null) {
      await AsyncStorage.setItem(PRIMARY_KEY, encode(backup));
      return backup;
    }

    const legacyRaw = await AsyncStorage.getItem(LEGACY_KEY).catch(() => null);
    const legacy = legacyRaw ? decode(legacyRaw) : null;
    if (legacy !== null) {
      await AsyncStorage.setItem(PRIMARY_KEY, encode(legacy));
      await AsyncStorage.removeItem(LEGACY_KEY).catch(() => undefined);
      return legacy;
    }
    return [];
  });
}

export function mutateSavedItineraries(
  mutation: (current: SavedItinerary[]) => SavedItinerary[],
): Promise<SavedItinerary[]> {
  return withStorageLock(PRIMARY_KEY, async () => {
    const current = await readUnlocked();
    const normalized = normalizeList(mutation(current)) ?? current;
    const previous = await AsyncStorage.getItem(PRIMARY_KEY).catch(() => null);
    if (previous && decode(previous) !== null) await AsyncStorage.setItem(BACKUP_KEY, previous);
    await AsyncStorage.setItem(PRIMARY_KEY, encode(normalized));
    await AsyncStorage.removeItem(LEGACY_KEY).catch(() => undefined);
    return normalized;
  });
}

export function mergeSavedItineraries(
  local: SavedItinerary[],
  remote: SavedItinerary[],
): SavedItinerary[] {
  const byId = new Map<string, SavedItinerary>();
  for (const entry of [...remote, ...local]) {
    const normalized = normalizeSavedItinerary(entry);
    if (!normalized) continue;
    const current = byId.get(normalized.id);
    if (!current || normalized.savedAt > current.savedAt) byId.set(normalized.id, normalized);
  }
  return [...byId.values()]
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .slice(0, MAX_SAVED_ITINERARIES);
}
