/**
 * Test per useCityDownload e lib/cityFetchers.
 */

// Mocks

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useState: jest.requireActual("react").useState,
  useEffect: jest.requireActual("react").useEffect,
  useCallback: (fn: any) => fn,
}));

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

// Local catalog fetchers

describe("cityFetchers - local-first catalog", () => {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  afterEach(() => jest.clearAllMocks());

  it("serves bundled attractions without a network request", async () => {
    const { fetchAttractions } = require("../lib/cityFetchers");
    const result = await fetchAttractions("roma");
    expect(result.length).toBeGreaterThan(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("serves bundled food spots without a network request", async () => {
    const { fetchFoodSpots } = require("../lib/cityFetchers");
    const result = await fetchFoodSpots("venezia");
    expect(result.length).toBeGreaterThan(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("serves bundled practical information", async () => {
    const { fetchCityInfo } = require("../lib/cityFetchers");
    const result = await fetchCityInfo("roma");
    expect(result).toMatchObject({ city: "roma" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("reports a missing local package for an unbundled city", async () => {
    const { fetchCityInfo } = require("../lib/cityFetchers");
    await expect(fetchCityInfo("inesistente")).rejects.toThrow(
      "Catalogo locale non disponibile",
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("serves bundled food and culture content", async () => {
    const { fetchCityExtras } = require("../lib/cityFetchers");
    const result = await fetchCityExtras("napoli");
    expect(result.foods.length).toBe(8);
    expect(result.cultureFacts.length).toBeGreaterThan(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("serves bundled neighborhoods where the repository owns the data", async () => {
    const { fetchNeighborhoods } = require("../lib/cityFetchers");
    const result = await fetchNeighborhoods("roma");
    expect(result.length).toBeGreaterThan(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("never falls back to the backend for a future unbundled city", async () => {
    const { fetchAttractions } = require("../lib/cityFetchers");
    await expect(fetchAttractions("new york")).rejects.toThrow(
      "Catalogo locale non disponibile",
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("index.tsx - bundled catalog integration", () => {
  const fs = require("fs");
  const path = require("path");
  const file = fs.readFileSync(path.join(__dirname, "../app/index.tsx"), "utf-8");

  it("exposes offline download controls beside city rows", () => {
    expect(file).toContain("useCityDownload");
    expect(file).toContain("downloadCity");
    expect(file).toContain("cloud-download-outline");
    expect(file).toContain("cityDownloadBtn");
  });
});
