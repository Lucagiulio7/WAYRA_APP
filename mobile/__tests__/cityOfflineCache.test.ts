const storage = new Map<string, string>();
const getItem = jest.fn(async (key: string) => storage.get(key) ?? null);
const setItem = jest.fn(async (key: string, value: string) => { storage.set(key, value); });
const removeItem = jest.fn(async (key: string) => { storage.delete(key); });

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem,
  setItem,
  removeItem,
}));

const prefetchQuery = jest.fn().mockResolvedValue(undefined);
const removeQueries = jest.fn();
jest.mock("@/lib/queryClient", () => ({
  queryClient: { prefetchQuery, removeQueries },
}));

const getTransitNetwork = jest.fn().mockResolvedValue({ lines: [], stations: [] });
const removeCachedTransitNetwork = jest.fn().mockResolvedValue(undefined);
jest.mock("@/data/transitNetworks", () => ({
  getTransitNetwork,
  removeCachedTransitNetwork,
  supportsTransit: (city: string) => city === "roma",
}));

jest.mock("@/lib/cityFetchers", () => ({
  fetchAttractions: jest.fn(),
  fetchFoodSpots: jest.fn(),
  fetchCityInfo: jest.fn(),
  fetchCityExtras: jest.fn(),
  fetchNeighborhoods: jest.fn(),
}));

jest.mock("@/data/localCatalogManifest", () => ({
  loadBundledCity: (city: string) => city === "roma" ? {
    version: 7,
    city: "roma",
    attractions: [{ id: 1 }],
    cityInfo: { city: "roma" },
  } : null,
}));

import {
  cacheCityForOffline,
  listCachedCities,
  removeCityOfflineCache,
} from "@/services/cityOfflineCache";

describe("cityOfflineCache", () => {
  beforeEach(() => {
    storage.clear();
    jest.clearAllMocks();
    getTransitNetwork.mockResolvedValue({ lines: [], stations: [] });
  });

  it("registra versione del pacchetto e disponibilita dei trasporti", async () => {
    const record = await cacheCityForOffline(" Roma ");
    expect(record).toMatchObject({ city: "roma", packageVersion: 7, transit: "cached" });
    expect(prefetchQuery).toHaveBeenCalledTimes(5);
    expect(JSON.parse(storage.get("wayra_offline_city_cache_v2") ?? "{}").roma).toMatchObject({
      packageVersion: 7,
      transit: "cached",
    });
  });

  it("migra il vecchio elenco e scarta le citta non incluse", async () => {
    storage.set("wayra_downloaded_cities_v1", JSON.stringify(["roma", "inesistente"]));
    const cities = await listCachedCities();
    expect([...cities]).toEqual(["roma"]);
    expect(storage.has("wayra_downloaded_cities_v1")).toBe(false);
  });

  it("rimuove insieme indice, query e trasporti", async () => {
    await cacheCityForOffline("roma");
    await removeCityOfflineCache("roma");
    expect(removeQueries).toHaveBeenCalledTimes(5);
    expect(removeCachedTransitNetwork).toHaveBeenCalledWith("roma");
    expect(JSON.parse(storage.get("wayra_offline_city_cache_v2") ?? "{}")).toEqual({});
  });
});
