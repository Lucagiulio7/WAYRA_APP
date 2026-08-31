import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "urveya_trip_accommodations_v1";

export type TripAccommodation = {
  city: string;
  startDate?: string;
  name?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  updatedAt: string;
};

type AccommodationCollection = Record<string, TripAccommodation>;

function normalizeCity(city: string): string {
  return city.trim().toLocaleLowerCase();
}

export function accommodationKey(city: string, startDate?: string): string {
  return `${normalizeCity(city)}:${startDate?.trim() || "undated"}`;
}

function validCoordinates(latitude: unknown, longitude: unknown): boolean {
  return typeof latitude === "number"
    && Number.isFinite(latitude)
    && latitude >= -90
    && latitude <= 90
    && typeof longitude === "number"
    && Number.isFinite(longitude)
    && longitude >= -180
    && longitude <= 180;
}

function decode(raw: string | null): AccommodationCollection {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => {
      if (!value || typeof value !== "object") return false;
      const candidate = value as Partial<TripAccommodation>;
      return typeof candidate.city === "string"
        && typeof candidate.address === "string"
        && candidate.address.trim().length > 0
        && (candidate.latitude === undefined && candidate.longitude === undefined
          || validCoordinates(candidate.latitude, candidate.longitude));
    })) as AccommodationCollection;
  } catch {
    return {};
  }
}

async function readCollection(): Promise<AccommodationCollection> {
  return decode(await AsyncStorage.getItem(STORAGE_KEY).catch(() => null));
}

export async function loadTripAccommodation(city: string, startDate?: string): Promise<TripAccommodation | null> {
  const collection = await readCollection();
  return collection[accommodationKey(city, startDate)] ?? null;
}

export async function saveTripAccommodation(accommodation: TripAccommodation): Promise<void> {
  const collection = await readCollection();
  collection[accommodationKey(accommodation.city, accommodation.startDate)] = {
    ...accommodation,
    city: normalizeCity(accommodation.city),
    address: accommodation.address.trim(),
    name: accommodation.name?.trim() || undefined,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}

export async function removeTripAccommodation(city: string, startDate?: string): Promise<void> {
  const collection = await readCollection();
  delete collection[accommodationKey(city, startDate)];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}
