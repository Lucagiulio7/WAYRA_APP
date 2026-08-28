import { BUNDLED_CITY_IDS, loadBundledCity } from "@/data/localCatalogManifest";
import { CITIES } from "@/data/cityRegistry";
import { getLocalItineraryPlan } from "@/services/localCatalog";

describe("bundled local city catalog", () => {
  it("contains every registered city", () => {
    const registered = CITIES.map((city) => city.id).sort();
    expect([...BUNDLED_CITY_IDS].sort()).toEqual(registered);
  });

  it("contains complete data and valid itinerary references", () => {
    for (const city of BUNDLED_CITY_IDS) {
      const cityPackage = loadBundledCity(city);
      expect(cityPackage).not.toBeNull();
      if (!cityPackage) continue;

      expect(cityPackage.attractions.length).toBeGreaterThan(0);
      expect(cityPackage.foods.length).toBe(8);
      expect(cityPackage.cultureFacts.length).toBeGreaterThan(0);
      expect(Object.keys(cityPackage.plans)).toHaveLength(36);

      const attractionIds = new Set(cityPackage.attractions.map((item) => item.id));
      for (const plan of Object.values(cityPackage.plans)) {
        for (const day of plan.days) {
          expect(day.stopIds.length).toBeGreaterThan(0);
          for (const stopId of day.stopIds) {
            expect(attractionIds.has(stopId)).toBe(true);
          }
        }
      }
    }
  });

  it("contains practical info and unique neighborhoods for every city", () => {
    for (const city of BUNDLED_CITY_IDS) {
      const cityPackage = loadBundledCity(city);
      expect(cityPackage?.cityInfo).not.toBeNull();
      expect(cityPackage?.neighborhoods.length).toBeGreaterThan(0);
      const names = cityPackage?.neighborhoods.map((item) => item.name.toLocaleLowerCase()) ?? [];
      expect(new Set(names).size).toBe(names.length);
    }
  });
  it("resolves all selectable experience, duration and walking combinations", () => {
    for (const city of BUNDLED_CITY_IDS) {
      const cityPackage = loadBundledCity(city);
      if (!cityPackage) throw new Error(`Missing city package: ${city}`);

      for (const walkKm of [3, 5, 7]) {
        for (let days = 1; days <= 5; days += 1) {
          expect(getLocalItineraryPlan(cityPackage, 1, days, walkKm)).not.toBeNull();
        }
        for (let days = 1; days <= 7; days += 1) {
          expect(getLocalItineraryPlan(cityPackage, "mix", days, walkKm)).not.toBeNull();
        }
      }
    }
  });
});
