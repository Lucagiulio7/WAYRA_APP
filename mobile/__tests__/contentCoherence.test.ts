import { exactLocalizedField } from "@/utils/localization";
import { neighborhoodProsCons, neighborhoodVibe } from "@/utils/neighborhoods";
import { cityActivities, localizedActivitySubject } from "@/data/cityActivities";
import { BUNDLED_CITY_IDS, loadBundledCity } from "@/data/localCatalogManifest";

const cityPackages = BUNDLED_CITY_IDS.map(loadBundledCity).filter(Boolean) as any[];

describe("user-facing content coherence", () => {
  test("every neighborhood tag has a localized presentation", () => {
    for (const cityPackage of cityPackages) {
      for (const neighborhood of cityPackage.neighborhoods ?? []) {
        for (const tag of neighborhood.vibe_tags ?? []) {
          for (const lang of ["it", "en", "fr", "es"]) {
            const vibe = neighborhoodVibe(tag, lang);
            expect(vibe.label.trim()).not.toBe("");
            expect(vibe.symbol).not.toBe("•");
          }
        }
      }
    }
  });

  test("every neighborhood receives exactly two pros and two cons", () => {
    for (const cityPackage of cityPackages) {
      for (const neighborhood of cityPackage.neighborhoods ?? []) {
        for (const lang of ["it", "en", "fr", "es"]) {
          const result = neighborhoodProsCons(neighborhood.vibe_tags, lang);
          expect(result.pros).toHaveLength(2);
          expect(result.cons).toHaveLength(2);
          expect(new Set(result.pros).size).toBe(2);
          expect(new Set(result.cons).size).toBe(2);
        }
      }
    }
  });

  test("activity search subjects are localized", () => {
    const paris = cityActivities("parigi");
    expect(localizedActivitySubject(paris[0], "en", "parigi")).toContain("Museum");
    expect(localizedActivitySubject(paris[0], "fr", "parigi")).toContain("musée");
    expect(localizedActivitySubject(paris[0], "es", "parigi")).toContain("Museo");
    expect(localizedActivitySubject(paris[2], "en", "parigi")).toContain("sunset");
  });

  test("every curated activity has all three translated search subjects", () => {
    for (const cityPackage of cityPackages) {
      const activities = cityActivities(cityPackage.city);
      expect(activities).toHaveLength(4);
      for (const lang of ["en", "fr", "es"]) {
        const subjects = activities.map((activity) => localizedActivitySubject(activity, lang, cityPackage.city));
        expect(subjects).toHaveLength(4);
        expect(subjects.every((subject) => subject.trim().length > 2)).toBe(true);
      }
    }
  });

  test("exact localization never leaks another language", () => {
    const item = { description: "Italiano", description_en: "English" };
    expect(exactLocalizedField(item, "description", "fr", "Générique")).toBe("Générique");
    expect(exactLocalizedField(item, "description", "en", "Generic")).toBe("English");
  });
});
