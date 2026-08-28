import type { BuilderAttraction } from "../hooks/useAttractions";
import type { Itinerary, Stop } from "../types";
import {
  addAttractionToDay,
  buildMapsLink,
  moveAttractionToDay,
  optimizeItineraryDay,
  removeAttractionFromDay,
  reorderDayStops,
} from "../utils/itineraryEditor";

const attraction = (
  id: number,
  name: string,
  latitude: number,
  longitude: number,
  extra: Partial<BuilderAttraction> = {},
): BuilderAttraction => ({
  id,
  name,
  category_level: 1,
  latitude,
  longitude,
  estimated_visit_time: 90,
  ...extra,
});

const stop = (
  id: number,
  name: string,
  latitude: number,
  longitude: number,
  extra: Partial<Stop> = {},
): Stop => ({
  type: "attraction",
  id,
  name,
  latitude,
  longitude,
  estimated_visit_time: 90,
  ...extra,
});

const A1 = attraction(1, "Colosseo", 41.8902, 12.4922, { name_fr: "Colisee" });
const A2 = attraction(2, "Pantheon", 41.8986, 12.4769, { name_fr: "Pantheon" });
const A3 = attraction(3, "Piazza Navona", 41.8992, 12.4731, { name_fr: "Place Navone" });

function baseItinerary(): Itinerary {
  return {
    city: "roma",
    num_days: 2,
    level: 1,
    max_walk_km: 5,
    days: [
      { day: 1, stops: [stop(1, "Colosseo", 41.8902, 12.4922)], maps_link: "", restaurants: [] },
      { day: 2, stops: [stop(3, "Piazza Navona", 41.8992, 12.4731)], maps_link: "", restaurants: [] },
    ],
    food_recommendations: [],
    culture_facts: [],
  };
}

describe("itineraryEditor", () => {
  it("aggiunge una tappa al giorno e aggiorna il link Maps", () => {
    const itinerary = baseItinerary();
    const result = addAttractionToDay(itinerary, 0, A2, "fr");

    expect(result).not.toBe(itinerary);
    expect(result.days[0].stops.map((item) => item.id).sort()).toEqual([1, 2]);
    expect(result.days[0].maps_link).toContain("travelmode=walking");
    expect(decodeURIComponent(result.days[0].maps_link)).toContain("Pantheon Rome");
    expect(result.days[1]).toBe(itinerary.days[1]);
  });

  it("non duplica una tappa gia assegnata a un altro giorno", () => {
    const itinerary = baseItinerary();
    const result = addAttractionToDay(itinerary, 0, A3, "it");

    expect(result).toBe(itinerary);
    expect(result.days.flatMap((day) => day.stops).filter((item) => item.id === 3)).toHaveLength(1);
  });

  it("sposta una tappa tra giorni senza duplicarla", () => {
    const itinerary = baseItinerary();
    const result = moveAttractionToDay(itinerary, 1, 1, 1, [A1, A2, A3], "it");

    expect(result.days[0].stops.some((item) => item.id === 1)).toBe(false);
    expect(result.days[1].stops.map((item) => item.id).sort()).toEqual([1, 3]);
    expect(result.days.flatMap((day) => day.stops).filter((item) => item.id === 1)).toHaveLength(1);
  });

  it("ignora lo spostamento verso lo stesso giorno", () => {
    const itinerary = baseItinerary();
    const result = moveAttractionToDay(itinerary, 0, 1, 1, [A1], "it");

    expect(result).toBe(itinerary);
  });

  it("rimuove solo la tappa richiesta", () => {
    const itinerary = addAttractionToDay(baseItinerary(), 0, A2, "it");
    const result = removeAttractionFromDay(itinerary, 0, 1, "it");

    expect(result.days[0].stops.map((item) => item.id)).toEqual([2]);
    expect(result.days[0].maps_link).toBe("");
  });

  it("un riordino parziale non perde e non duplica tappe", () => {
    let itinerary = addAttractionToDay(baseItinerary(), 0, A2, "it");
    const [first, second] = itinerary.days[0].stops;

    itinerary = reorderDayStops(itinerary, 0, [second, second], "it");

    expect(itinerary.days[0].stops.map((item) => item.id)).toEqual([second.id, first.id]);
    expect(new Set(itinerary.days[0].stops.map((item) => item.id)).size).toBe(2);
  });

  it("ottimizza le attrazioni senza spostare il pasto tra i segmenti", () => {
    const meal = stop(90, "Pranzo", 41.895, 12.48, { type: "meal", meal_type: "lunch" });
    const itinerary = baseItinerary();
    itinerary.days[0] = {
      ...itinerary.days[0],
      stops: [
        stop(1, "A", 41.89, 12.49),
        stop(2, "B", 41.9, 12.47),
        meal,
        stop(3, "C", 41.91, 12.46),
        stop(4, "D", 41.905, 12.465),
      ],
    };

    const result = optimizeItineraryDay(itinerary, 0, "it");
    const optimized = result.days[0].stops;
    const mealIndex = optimized.findIndex((item) => item.id === 90 && item.type === "meal");

    expect(mealIndex).toBe(2);
    expect(new Set(optimized.slice(0, mealIndex).map((item) => item.id))).toEqual(new Set([1, 2]));
    expect(new Set(optimized.slice(mealIndex + 1).map((item) => item.id))).toEqual(new Set([3, 4]));
  });

  it("limita il percorso Maps a dieci waypoint mantenendo primo e ultimo", () => {
    const stops = Array.from({ length: 14 }, (_, index) => (
      stop(index + 1, `Tappa ${index + 1}`, 41.8 + index * 0.01, 12.4 + index * 0.01)
    ));
    const link = buildMapsLink(stops, "roma", "it");
    const path = link.split("/dir/")[1].split("?travelmode")[0].split("/");

    expect(path).toHaveLength(10);
    expect(decodeURIComponent(path[0])).toContain("Tappa 1 Roma");
    expect(decodeURIComponent(path.at(-1)!)).toContain("Tappa 14 Roma");
  });
});
