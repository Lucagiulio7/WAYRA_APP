import type { BuilderAttraction } from "../hooks/useAttractions";
import type { Itinerary, Stop } from "../types";
import { repairBundledItinerary, validateItineraryQuality } from "../utils/itineraryQuality";
import { activityMinutes, getEffortProfile, museumCount, walkingRouteKm } from "../utils/itineraryRules";

function attraction(id: number, extra: Partial<BuilderAttraction> = {}): BuilderAttraction {
  return {
    id,
    name: `Tappa ${id}`,
    category_level: 1,
    latitude: 41.9 + id * 0.0001,
    longitude: 12.49 + id * 0.0001,
    estimated_visit_time: 60,
    attraction_type: "Monumento",
    tags: [],
    ...extra,
  };
}

function stop(item: BuilderAttraction): Stop {
  return {
    type: "attraction",
    id: item.id,
    name: item.name,
    description: item.description ?? undefined,
    latitude: item.latitude,
    longitude: item.longitude,
    category_level: item.category_level,
    estimated_visit_time: item.estimated_visit_time ?? undefined,
    tags: item.tags ?? undefined,
    attraction_type: item.attraction_type ?? undefined,
    must_see: item.must_see,
    must_see_rank: item.must_see_rank,
  };
}

function itinerary(stops: Stop[], maxWalkKm = 5): Itinerary {
  return {
    city: "roma",
    num_days: 1,
    level: 1,
    max_walk_km: maxWalkKm,
    creation_mode: "generated",
    days: [{ day: 1, stops, maps_link: "", restaurants: [] }],
    food_recommendations: [],
    culture_facts: [],
  };
}

describe("itineraryQuality", () => {
  it("rimuove duplicati e corregge i limiti rigidi della giornata", () => {
    const catalog = Array.from({ length: 7 }, (_, index) => attraction(index + 1, {
      attraction_type: index < 3 ? "Museo" : "Monumento",
    }));
    const source = itinerary([...catalog.slice(0, 6).map(stop), stop(catalog[0])], 3);

    const result = repairBundledItinerary(source, catalog, "it");
    const dayStops = result.days[0].stops;
    const ids = dayStops.map((item) => item.id);
    const profile = getEffortProfile(3);

    expect(new Set(ids).size).toBe(ids.length);
    expect(dayStops.length).toBeLessThanOrEqual(profile.maxAttractions);
    expect(activityMinutes(dayStops)).toBeLessThanOrEqual(profile.maxMinutes);
    expect(museumCount(dayStops)).toBeLessThanOrEqual(2);
    expect(walkingRouteKm(dayStops)).toBeLessThanOrEqual(3);
    expect(result.quality?.adjusted).toBe(true);
  });

  it("completa una giornata sotto soglia usando attrazioni libere e vicine", () => {
    const catalog = Array.from({ length: 8 }, (_, index) => attraction(index + 1));
    const source = itinerary(catalog.slice(0, 2).map(stop), 5);

    const result = repairBundledItinerary(source, catalog, "it");
    const profile = getEffortProfile(5);

    expect(result.days[0].stops.length).toBeGreaterThanOrEqual(profile.minAttractions);
    expect(activityMinutes(result.days[0].stops)).toBeGreaterThanOrEqual(profile.minMinutes);
    expect(result.quality?.status).not.toBe("limited");
  });

  it("inserisce un imperdibile compatibile sostituendo una tappa meno prioritaria", () => {
    const ordinary = Array.from({ length: 5 }, (_, index) => attraction(index + 1));
    const mustSee = attraction(99, { name: "Imperdibile", must_see: true, must_see_rank: 1 });
    const source = itinerary(ordinary.map(stop), 3);

    const result = repairBundledItinerary(source, [...ordinary, mustSee], "it");

    expect(result.days[0].stops.some((item) => item.id === mustSee.id)).toBe(true);
    expect(validateItineraryQuality(result, [...ordinary, mustSee]).issues)
      .not.toEqual(expect.arrayContaining([expect.objectContaining({ code: "must_see_missing" })]));
  });

  it("non riempie artificialmente un'escursione già completa per durata", () => {
    const catalog = Array.from({ length: 5 }, (_, index) => attraction(index + 1, {
      estimated_visit_time: 75,
    }));
    const source = itinerary(catalog.slice(0, 4).map(stop), 5);
    source.days[0].day_type = "excursion";
    source.days[0].transfer_required = true;

    const result = repairBundledItinerary(source, catalog, "it");

    expect(result.days[0].stops).toHaveLength(4);
    expect(result.quality?.issues).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "too_few_stops" }),
      expect.objectContaining({ code: "too_few_minutes" }),
    ]));
  });

  it("riequilibra le tappe tra giornate senza violare i limiti rigidi", () => {
    const catalog = Array.from({ length: 8 }, (_, index) => attraction(index + 1, {
      estimated_visit_time: 60,
      latitude: 41.9 + (index % 5) * 0.0001,
      longitude: 12.49 + (index % 5) * 0.0001,
    }));
    const source: Itinerary = {
      ...itinerary([], 3),
      num_days: 2,
      days: [
        { day: 1, stops: catalog.slice(0, 5).map(stop), maps_link: "", restaurants: [] },
        { day: 2, stops: catalog.slice(5, 8).map(stop), maps_link: "", restaurants: [] },
      ],
    };

    const result = repairBundledItinerary(source, catalog, "it");

    expect(result.days.map((day) => day.stops.length)).toEqual([4, 4]);
    expect(result.quality?.issues).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "too_few_stops" }),
      expect.objectContaining({ code: "walking_limit" }),
    ]));
  });
});
