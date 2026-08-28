import { BUNDLED_CITY_IDS } from "../data/localCatalogManifest";
import { buildBundledItinerary } from "../services/bundledItinerary";
import { getLocalCityPackage } from "../services/localCatalog";
import { activityMinutes, attractionStops } from "../utils/itineraryRules";

jest.setTimeout(120_000);

const HARD_ISSUES = new Set([
  "empty_day",
  "duplicate_stop",
  "too_many_stops",
  "too_many_minutes",
  "too_many_museums",
  "walking_limit",
]);

describe("bundled itinerary matrix", () => {
  it("genera tutte le combinazioni pubblicate senza violazioni rigide", () => {
    let scenarios = 0;
    let transferDays = 0;
    const softIssues = new Map<string, number>();
    const effortRegressions: string[] = [];

    for (const city of BUNDLED_CITY_IDS) {
      const cityPackage = getLocalCityPackage(city);
      const effortMetrics = new Map<string, { stops: number; minutes: number }>();
      expect(cityPackage).not.toBeNull();
      if (!cityPackage) continue;

      for (const level of [1, "mix"] as const) {
        const maxDays = level === "mix" ? cityPackage.maxDaysExplorer : cityPackage.maxDaysIconic;
        for (const maxWalkKm of [3, 5, 7] as const) {
          for (let numDays = 1; numDays <= maxDays; numDays += 1) {
            const result = buildBundledItinerary({ city, level, max_walk_km: maxWalkKm, num_days: numDays, language: "it" });
            scenarios += 1;

            expect(result).not.toBeNull();
            if (!result) continue;
            expect(result.days).toHaveLength(numDays);
            expect(result.days.every((day) => day.stops.length > 0)).toBe(true);
            expect(result.quality?.issues.filter((issue) => HARD_ISSUES.has(issue.code))).toEqual([]);
            for (const issue of result.quality?.issues ?? []) {
              softIssues.set(issue.code, (softIssues.get(issue.code) ?? 0) + 1);
            }
            effortMetrics.set(`${level}|${numDays}|${maxWalkKm}`, {
              stops: result.days.reduce((sum, day) => sum + attractionStops(day.stops).length, 0),
              minutes: result.days.reduce((sum, day) => sum + activityMinutes(day.stops), 0),
            });
            for (const day of result.days) {
              if (!day.transfer_required) continue;
              transferDays += 1;
              expect(["public_transport", "ferry"]).toContain(day.transfer_mode);
            }

            const scheduledAttractions = result.days.flatMap((day) => attractionStops(day.stops));
            const explorerHasDiscovery = scheduledAttractions.some(
              (stop) => (stop.category_level ?? 1) >= 2,
            );
            const explorerIsMustSeeOnly = scheduledAttractions.length > 0
              && scheduledAttractions.every((stop) => stop.must_see);
            if (level === "mix" && !explorerHasDiscovery && !explorerIsMustSeeOnly) {
              throw new Error(`Explorer senza tappe di scoperta: ${city}, ${numDays} giorni, ${maxWalkKm} km`);
            }

            const topMustSee = cityPackage.attractions
              .filter((item) => item.must_see)
              .sort((a, b) => (a.must_see_rank ?? 999) - (b.must_see_rank ?? 999))[0];
            if (
              topMustSee
              && !result.days.flatMap((day) => day.stops).some((stop) => stop.id === topMustSee.id)
            ) {
              throw new Error(
                `Imperdibile mancante: ${city}, ${String(level)}, ${numDays} giorni, ${maxWalkKm} km, ${topMustSee.name}`,
              );
            }
          }
        }
      }

      for (const level of [1, "mix"] as const) {
        const maxDays = level === "mix" ? cityPackage.maxDaysExplorer : cityPackage.maxDaysIconic;
        for (let numDays = 1; numDays <= maxDays; numDays += 1) {
          const relaxed = effortMetrics.get(`${level}|${numDays}|3`);
          const balanced = effortMetrics.get(`${level}|${numDays}|5`);
          const intense = effortMetrics.get(`${level}|${numDays}|7`);
          if (!relaxed || !balanced || !intense) continue;
          const effort = [relaxed, balanced, intense];
          const estimateTolerance = numDays * 15;
          if (
            effort[1].minutes + estimateTolerance < effort[0].minutes
            || effort[2].minutes + estimateTolerance < effort[1].minutes
          ) {
            effortRegressions.push(`${city}/${level}/${numDays}: ${effort.map((item) => item.minutes).join("-")} minuti`);
          }
        }
      }
    }

    expect(scenarios).toBeGreaterThan(1_000);
    expect(transferDays).toBeGreaterThan(0);
    expect(effortRegressions).toEqual([]);
    expect(softIssues.get("too_few_stops") ?? 0).toBeLessThanOrEqual(Math.ceil(scenarios * 0.06));
    expect(softIssues.get("too_few_minutes") ?? 0).toBeLessThanOrEqual(Math.ceil(scenarios * 0.07));
  });
});
