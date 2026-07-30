/**
 * Test per useCityDownload e lib/cityFetchers.
 */

// ── Mock ──────────────────────────────────────────────────────────────────────

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useState: jest.requireActual("react").useState,
  useEffect: jest.requireActual("react").useEffect,
  useCallback: (fn: any) => fn,
}));

jest.mock("@/constants/api", () => ({
  API_BASE_URL: "https://fake-api.example",
}), { virtual: true });

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}), { virtual: true });

jest.mock("react-native", () => ({
  Alert: { alert: jest.fn() },
}), { virtual: true });

const mockPrefetchQuery = jest.fn().mockResolvedValue(undefined);
const mockRemoveQueries = jest.fn();
jest.mock("@/lib/queryClient", () => ({
  queryClient: {
    prefetchQuery: mockPrefetchQuery,
    removeQueries: mockRemoveQueries,
  },
}), { virtual: true });

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

// ─── lib/cityFetchers — verifica URL costruiti ────────────────────────────────

describe("cityFetchers — URL correctness", () => {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    mockFetch.mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => {
        if (url.includes("/api/city-info")) return { data: { city: "roma" } };
        if (url.includes("fake-api.example")) return { data: [{}] };
        return [];
      },
    }));
  });

  afterEach(() => jest.clearAllMocks());

  it("fetchAttractions include city e is_food_spot=false nell'URL", async () => {
    const { fetchAttractions } = require("../lib/cityFetchers");
    await fetchAttractions("roma");
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("/api/attractions?city=roma");
  });

  it("fetchFoodSpots include is_food_spot=true", async () => {
    const { fetchFoodSpots } = require("../lib/cityFetchers");
    await fetchFoodSpots("venezia");
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("/api/food-spots?city=venezia");
  });

  it("fetchCityInfo punta a city_info con limit=1", async () => {
    const { fetchCityInfo } = require("../lib/cityFetchers");
    const result = await fetchCityInfo("roma");
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("/api/city-info?city=roma");
    expect(result).toMatchObject({ city: "roma" });
  });

  it("fetchCityInfo restituisce null quando il backend non ha dati", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    });
    const { fetchCityInfo } = require("../lib/cityFetchers");
    const result = await fetchCityInfo("inesistente");
    expect(result).toBeNull();
  });

  it("fetchCityExtras fa 2 fetch parallele (foods + culture_facts)", async () => {
    const { fetchCityExtras } = require("../lib/cityFetchers");
    await fetchCityExtras("napoli");
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const urls: string[] = mockFetch.mock.calls.map((c: any) => c[0]);
    expect(urls.some((u) => u.includes("foods"))).toBe(true);
    expect(urls.some((u) => u.includes("culture-facts"))).toBe(true);
  });

  it("fetchNeighborhoods punta a neighborhoods con order sort_order", async () => {
    const { fetchNeighborhoods } = require("../lib/cityFetchers");
    await fetchNeighborhoods("firenze");
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("/api/neighborhoods?city=firenze");
  });

  it("lancia errore se HTTP non ok", async () => {
    const { fetchAttractions } = require("../lib/cityFetchers");
    mockFetch.mockResolvedValue({ ok: false, status: 503, json: async () => null });
    await expect(fetchAttractions("roma")).rejects.toThrow("Backend HTTP 503");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("fetchAttractions codifica correttamente città con spazio", async () => {
    const { fetchAttractions } = require("../lib/cityFetchers");
    await fetchAttractions("new york");
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("new%20york");
  });
});

// ─── useCityDownload ──────────────────────────────────────────────────────────

describe("useCityDownload — downloadCity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    mockPrefetchQuery.mockResolvedValue(undefined);
    // Reset module per avere stato fresco
    jest.resetModules();
  });

  it("chiama prefetchQuery per tutte e 5 le query key", async () => {
    // Reimporta dopo resetModules
    jest.mock("react", () => ({
      useState: (init: any) => [typeof init === "function" ? init() : init, jest.fn()],
      useEffect: jest.fn(),
      useCallback: (fn: any) => fn,
    }));
    jest.mock("@/constants/supabase", () => ({
      SUPABASE_URL: "https://fake.supabase.co",
      SUPABASE_ANON_KEY: "fakekey",
    }), { virtual: true });
    jest.mock("@react-native-async-storage/async-storage", () => ({
      getItem: jest.fn().mockResolvedValue(null),
      setItem: jest.fn().mockResolvedValue(undefined),
    }), { virtual: true });
    jest.mock("react-native", () => ({ Alert: { alert: jest.fn() } }), { virtual: true });
    jest.mock("@/lib/queryClient", () => ({
      queryClient: { prefetchQuery: mockPrefetchQuery, removeQueries: mockRemoveQueries },
    }), { virtual: true });
    jest.mock("@/lib/cityFetchers", () => ({
      fetchAttractions: jest.fn().mockResolvedValue([]),
      fetchFoodSpots: jest.fn().mockResolvedValue([]),
      fetchCityInfo: jest.fn().mockResolvedValue(null),
      fetchCityExtras: jest.fn().mockResolvedValue({ foods: [], cultureFacts: [] }),
      fetchNeighborhoods: jest.fn().mockResolvedValue([]),
    }), { virtual: true });

    const { useCityDownload } = require("../hooks/useCityDownload");
    const hook = useCityDownload();
    await hook.downloadCity("roma");

    expect(mockPrefetchQuery).toHaveBeenCalledTimes(5);
    const keys = mockPrefetchQuery.mock.calls.map((c: any) => c[0].queryKey[0]);
    expect(keys).toContain("attractions");
    expect(keys).toContain("foodSpots");
    expect(keys).toContain("cityInfo");
    expect(keys).toContain("cityExtras");
    expect(keys).toContain("neighborhoods");
  });

  it("deleteCity chiama removeQueries per tutte e 5 le query key", async () => {
    jest.mock("react", () => ({
      useState: (init: any) => [typeof init === "function" ? init() : init, jest.fn()],
      useEffect: jest.fn(),
      useCallback: (fn: any) => fn,
    }));
    jest.mock("@/constants/supabase", () => ({
      SUPABASE_URL: "https://fake.supabase.co", SUPABASE_ANON_KEY: "fakekey",
    }), { virtual: true });
    jest.mock("@react-native-async-storage/async-storage", () => ({
      getItem: jest.fn().mockResolvedValue(JSON.stringify(["roma"])),
      setItem: jest.fn().mockResolvedValue(undefined),
    }), { virtual: true });
    jest.mock("react-native", () => ({ Alert: { alert: jest.fn() } }), { virtual: true });
    jest.mock("@/lib/queryClient", () => ({
      queryClient: { prefetchQuery: mockPrefetchQuery, removeQueries: mockRemoveQueries },
    }), { virtual: true });
    jest.mock("@/lib/cityFetchers", () => ({
      fetchAttractions: jest.fn(), fetchFoodSpots: jest.fn(),
      fetchCityInfo: jest.fn(), fetchCityExtras: jest.fn(), fetchNeighborhoods: jest.fn(),
    }), { virtual: true });

    const { useCityDownload } = require("../hooks/useCityDownload");
    const hook = useCityDownload();
    await hook.deleteCity("roma");

    expect(mockRemoveQueries).toHaveBeenCalledTimes(5);
    const keys = mockRemoveQueries.mock.calls.map((c: any) => c[0].queryKey[0]);
    expect(keys).toContain("attractions");
    expect(keys).toContain("foodSpots");
    expect(keys).toContain("cityInfo");
    expect(keys).toContain("cityExtras");
    expect(keys).toContain("neighborhoods");
  });

  it("confirmDelete mostra Alert con le opzioni corrette", async () => {
    jest.mock("react", () => ({
      useState: (init: any) => [typeof init === "function" ? init() : init, jest.fn()],
      useEffect: jest.fn(),
      useCallback: (fn: any) => fn,
    }));
    jest.mock("@/constants/supabase", () => ({
      SUPABASE_URL: "https://fake.supabase.co", SUPABASE_ANON_KEY: "fakekey",
    }), { virtual: true });
    jest.mock("@react-native-async-storage/async-storage", () => ({
      getItem: jest.fn().mockResolvedValue(null),
      setItem: jest.fn().mockResolvedValue(undefined),
    }), { virtual: true });
    const mockAlert = jest.fn();
    jest.mock("react-native", () => ({ Alert: { alert: mockAlert } }), { virtual: true });
    jest.mock("@/lib/queryClient", () => ({
      queryClient: { prefetchQuery: mockPrefetchQuery, removeQueries: mockRemoveQueries },
    }), { virtual: true });
    jest.mock("@/lib/cityFetchers", () => ({
      fetchAttractions: jest.fn(), fetchFoodSpots: jest.fn(),
      fetchCityInfo: jest.fn(), fetchCityExtras: jest.fn(), fetchNeighborhoods: jest.fn(),
    }), { virtual: true });

    const { useCityDownload } = require("../hooks/useCityDownload");
    const hook = useCityDownload();
    hook.confirmDelete("roma", "Roma", "it");

    expect(mockAlert).toHaveBeenCalledWith(
      expect.stringContaining("offline"),
      expect.stringContaining("Roma"),
      expect.arrayContaining([
        expect.objectContaining({ style: "cancel" }),
        expect.objectContaining({ style: "destructive" }),
      ]),
    );
  });
});

// ─── Integrità statica index.tsx ──────────────────────────────────────────────

describe("index.tsx — download integration", () => {
  const fs = require("fs");
  const path = require("path");
  const file = fs.readFileSync(path.join(__dirname, "../app/index.tsx"), "utf-8");

  it("importa useCityDownload", () => {
    expect(file).toContain("useCityDownload");
  });

  it("usa downloadCity nel JSX", () => {
    expect(file).toContain("downloadCity");
  });

  it("usa confirmDelete nel JSX", () => {
    expect(file).toContain("confirmDelete");
  });

  it("mostra cloud-download-outline per città non scaricata", () => {
    expect(file).toContain("cloud-download-outline");
  });

  it("mostra cloud-done-outline per città scaricata", () => {
    expect(file).toContain("cloud-done-outline");
  });

  it("mostra ActivityIndicator durante il download", () => {
    expect(file).toContain("dlBusy");
  });

  it("ha lo stile cityDownloadBtn", () => {
    expect(file).toContain("cityDownloadBtn");
  });
});
