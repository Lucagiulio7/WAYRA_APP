import type { Itinerary, Stop } from "@/types";
import { normalizeItineraryStructure } from "@/utils/itineraryStructure";

function stop(id: number, latitude = 41.9): Stop {
  return {
    type: "attraction",
    id,
    name: ` Tappa ${id} `,
    latitude,
    longitude: 12.49 + id * 0.001,
    estimated_visit_time: 60,
  };
}

function itinerary(days: Itinerary["days"]): Itinerary {
  return {
    city: " Roma ",
    num_days: 99,
    level: 1,
    days,
    food_recommendations: [],
    culture_facts: [],
  };
}

describe("normalizeItineraryStructure", () => {
  it("normalizza metadati senza cambiare l'ordine delle tappe", () => {
    const result = normalizeItineraryStructure(itinerary([
      { day: 4, stops: [stop(3), stop(1), stop(2)], restaurants: [], maps_link: "rotto" },
    ]));

    expect(result.itinerary?.city).toBe("roma");
    expect(result.itinerary?.num_days).toBe(1);
    expect(result.itinerary?.days[0].day).toBe(1);
    expect(result.itinerary?.days[0].stops.map((item) => item.id)).toEqual([3, 1, 2]);
    expect(result.itinerary?.days[0].stops[0].name).toBe("Tappa 3");
    expect(result.itinerary?.days[0].maps_link).toContain("google.com/maps/dir");
    expect(result.issues).toEqual(expect.arrayContaining(["day_number", "day_count"]));
  });

  it("rimuove duplicati globali e tappe con coordinate non valide", () => {
    const result = normalizeItineraryStructure(itinerary([
      { day: 1, stops: [stop(1), stop(2, 200)], restaurants: [], maps_link: "" },
      { day: 2, stops: [stop(1), stop(3)], restaurants: [], maps_link: "" },
    ]));

    expect(result.itinerary?.days[0].stops.map((item) => item.id)).toEqual([1]);
    expect(result.itinerary?.days[1].stops.map((item) => item.id)).toEqual([3]);
    expect(result.issues).toEqual(expect.arrayContaining(["invalid_stop", "duplicate_stop"]));
  });

  it("rifiuta un itinerario con una giornata priva di tappe valide", () => {
    const result = normalizeItineraryStructure(itinerary([
      { day: 1, stops: [stop(1, Number.NaN)], restaurants: [], maps_link: "" },
    ]));

    expect(result.itinerary).toBeNull();
    expect(result.issues).toEqual(expect.arrayContaining(["invalid_stop", "empty_day"]));
  });
});
