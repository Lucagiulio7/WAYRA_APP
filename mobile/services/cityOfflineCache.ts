import AsyncStorage from "@react-native-async-storage/async-storage";
import { queryClient } from "@/lib/queryClient";
import {
  fetchAttractions,
  fetchFoodSpots,
  fetchCityInfo,
  fetchCityExtras,
  fetchNeighborhoods,
} from "@/lib/cityFetchers";
import {
  getTransitNetwork,
  removeCachedTransitNetwork,
  supportsTransit,
} from "@/data/transitNetworks";
import { loadBundledCity } from "@/data/localCatalogManifest";

const CACHE_INDEX_KEY = "wayra_offline_city_cache_v2";
const LEGACY_CACHE_INDEX_KEY = "wayra_offline_city_cache_v1";
const LEGACY_DOWNLOADS_KEY = "wayra_downloaded_cities_v1";

export type TransitCacheStatus = "cached" | "unsupported" | "unavailable";

export interface OfflineCityRecord {
  city: string;
  packageVersion: number;
  cachedAt: string;
  transit: TransitCacheStatus;
}

type OfflineCityIndex = Record<string, OfflineCityRecord>;

function normalizeCity(city: string): string {
  return city.trim().toLowerCase();
}

function validPackage(city: string) {
  const cityPackage = loadBundledCity(city);
  if (
    !cityPackage ||
    cityPackage.city !== city ||
    !cityPackage.attractions.length ||
    !cityPackage.cityInfo
  ) {
    throw new Error(`Pacchetto locale non valido: ${city}`);
  }
  return cityPackage;
}

function isCurrentRecord(record: OfflineCityRecord): boolean {
  try {
    const cityPackage = validPackage(record.city);
    return record.packageVersion === cityPackage.version;
  } catch {
    return false;
  }
}

async function readIndex(): Promise<OfflineCityIndex> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as OfflineCityIndex;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeIndex(index: OfflineCityIndex): Promise<void> {
  await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
}

export async function listCachedCities(): Promise<ReadonlySet<string>> {
  const current = await readIndex();
  const valid = Object.fromEntries(
    Object.entries(current).filter(([, record]) => isCurrentRecord(record)),
  ) as OfflineCityIndex;

  // Migra una sola volta i due registri usati dalle versioni precedenti.
  if (!Object.keys(valid).length) {
    const [legacyIndexRaw, legacyDownloadsRaw] = await Promise.all([
      AsyncStorage.getItem(LEGACY_CACHE_INDEX_KEY).catch(() => null),
      AsyncStorage.getItem(LEGACY_DOWNLOADS_KEY).catch(() => null),
    ]);
    const legacyCities = new Set<string>();
    try {
      Object.keys(legacyIndexRaw ? JSON.parse(legacyIndexRaw) : {}).forEach((city) => legacyCities.add(city));
    } catch {}
    try {
      (legacyDownloadsRaw ? JSON.parse(legacyDownloadsRaw) : []).forEach((city: string) => legacyCities.add(city));
    } catch {}

    for (const rawCity of legacyCities) {
      const city = normalizeCity(rawCity);
      try {
        const cityPackage = validPackage(city);
        valid[city] = {
          city,
          packageVersion: cityPackage.version,
          cachedAt: new Date(0).toISOString(),
          transit: supportsTransit(city) ? "unavailable" : "unsupported",
        };
      } catch {}
    }
  }

  await writeIndex(valid);
  await Promise.all([
    AsyncStorage.removeItem(LEGACY_CACHE_INDEX_KEY),
    AsyncStorage.removeItem(LEGACY_DOWNLOADS_KEY),
  ]).catch(() => undefined);
  return new Set(Object.keys(valid));
}

/**
 * Persiste nella cache Query tutti i dati gia' disponibili per la citta'.
 * Le sorgenti sono locali, quindi questa operazione non aggiunge chiamate
 * remote: prepara semplicemente i dati per il riavvio e l'uso offline.
 */
export async function cacheCityForOffline(city: string): Promise<OfflineCityRecord> {
  const cityKey = normalizeCity(city);
  const cityPackage = validPackage(cityKey);

  await Promise.all([
    queryClient.prefetchQuery({ queryKey: ["attractions", cityKey], queryFn: () => fetchAttractions(cityKey), staleTime: Infinity }),
    queryClient.prefetchQuery({ queryKey: ["foodSpots", cityKey], queryFn: () => fetchFoodSpots(cityKey), staleTime: Infinity }),
    queryClient.prefetchQuery({ queryKey: ["cityInfo", cityKey], queryFn: () => fetchCityInfo(cityKey), staleTime: Infinity }),
    queryClient.prefetchQuery({ queryKey: ["cityExtras", cityKey], queryFn: () => fetchCityExtras(cityKey), staleTime: Infinity }),
    queryClient.prefetchQuery({ queryKey: ["neighborhoods", cityKey], queryFn: () => fetchNeighborhoods(cityKey), staleTime: Infinity }),
  ]);

  const transit = supportsTransit(cityKey)
    ? await getTransitNetwork(cityKey).then((network) => network ? "cached" as const : "unavailable" as const)
    : "unsupported" as const;
  const record: OfflineCityRecord = {
    city: cityKey,
    packageVersion: cityPackage.version,
    cachedAt: new Date().toISOString(),
    transit,
  };
  const current = await readIndex();
  current[cityKey] = record;
  await writeIndex(current);
  return record;
}

export async function removeCityOfflineCache(city: string): Promise<void> {
  const cityKey = normalizeCity(city);
  for (const queryName of ["attractions", "foodSpots", "cityInfo", "cityExtras", "neighborhoods"]) {
    queryClient.removeQueries({ queryKey: [queryName, cityKey] });
  }
  await removeCachedTransitNetwork(cityKey);
  const current = await readIndex();
  delete current[cityKey];
  await writeIndex(current);
}
