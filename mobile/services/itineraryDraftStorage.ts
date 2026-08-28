import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Itinerary } from "@/types";
import { normalizeItineraryStructure } from "@/utils/itineraryStructure";
import { readWithBackup, removeResilientValue, writeWithBackup } from "@/services/resilientStorage";

const PRIMARY_KEY = "wayra_draft_itinerary_v2";
const BACKUP_KEY = "wayra_draft_itinerary_backup_v2";
const LEGACY_KEY = "wayra_draft_itinerary";

interface DraftEnvelope {
  version: 2;
  updatedAt: string;
  itinerary: Itinerary;
}

function decode(raw: string, language = "it"): Itinerary | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    const source = parsed && typeof parsed === "object" && (parsed as Partial<DraftEnvelope>).version === 2
      ? (parsed as Partial<DraftEnvelope>).itinerary
      : parsed;
    return normalizeItineraryStructure(source, language).itinerary;
  } catch {
    return null;
  }
}

export async function loadItineraryDraft(language = "it"): Promise<Itinerary | null> {
  const decoder = (raw: string) => decode(raw, language);
  const current = await readWithBackup(PRIMARY_KEY, BACKUP_KEY, decoder);
  if (current) return current;
  const legacy = await AsyncStorage.getItem(LEGACY_KEY).catch(() => null);
  return legacy ? decoder(legacy) : null;
}

export function saveItineraryDraft(itinerary: Itinerary, language = "it"): Promise<void> {
  const normalized = normalizeItineraryStructure(itinerary, language).itinerary;
  if (!normalized) return Promise.resolve();
  const envelope: DraftEnvelope = {
    version: 2,
    updatedAt: new Date().toISOString(),
    itinerary: normalized,
  };
  return writeWithBackup(PRIMARY_KEY, BACKUP_KEY, JSON.stringify(envelope), (raw) => decode(raw, language));
}

export async function removeItineraryDraft(): Promise<void> {
  await removeResilientValue(PRIMARY_KEY, BACKUP_KEY);
  await AsyncStorage.removeItem(LEGACY_KEY).catch(() => undefined);
}
