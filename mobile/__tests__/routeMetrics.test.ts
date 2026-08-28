import {
  analyzeRouteMobility,
  isMuseumType,
  routeWalkingKm,
  walkingDistanceFactor,
  walkingKm,
} from "../utils/routeMetrics";

describe("routeMetrics", () => {
  it("riconosce anche le tipologie museo composte", () => {
    expect(isMuseumType("Museo")).toBe(true);
    expect(isMuseumType("museo storico")).toBe(true);
    expect(isMuseumType("Museo all'aperto")).toBe(true);
    expect(isMuseumType("Monumento")).toBe(false);
  });

  it("applica il margine incrementale corretto", () => {
    expect(walkingDistanceFactor(0.2)).toBe(1.5);
    expect(walkingDistanceFactor(0.4)).toBe(1.4);
    expect(walkingDistanceFactor(0.8)).toBe(1.3);
    expect(walkingDistanceFactor(1.5)).toBe(1.15);
    expect(walkingDistanceFactor(2.5)).toBe(1.1);
  });

  it("usa lo stesso modello per singole tratte e percorso totale", () => {
    const a = { latitude: 41.9, longitude: 12.48 };
    const b = { latitude: 41.91, longitude: 12.49 };
    const c = { latitude: 41.92, longitude: 12.5 };
    expect(routeWalkingKm([a, b, c])).toBeCloseTo(walkingKm(a, b) + walkingKm(b, c), 8);
  });

  it("separa i trasferimenti lunghi dai chilometri a piedi", () => {
    const centre = { id: 1, name: "Centro", latitude: 50.8467, longitude: 4.3525 };
    const nearby = { id: 2, name: "Museo", latitude: 50.8503, longitude: 4.3517 };
    const atomium = { id: 3, name: "Atomium", latitude: 50.8949, longitude: 4.3415 };
    const plan = analyzeRouteMobility([centre, nearby, atomium], 7);

    expect(plan.transfers).toHaveLength(1);
    expect(plan.transfers[0].from.id).toBe(2);
    expect(plan.transfers[0].to.id).toBe(3);
    expect(plan.walkingKm).toBeCloseTo(walkingKm(centre, nearby), 6);
    expect(plan.walkingGroups.map((group) => group.map((stop) => stop.id))).toEqual([[1, 2], [3]]);
  });

  it("riconosce Suomenlinna come trasferimento in traghetto", () => {
    const harbour = { id: 1, name: "Market Square", latitude: 60.1675, longitude: 24.9540 };
    const island = { id: 2, name: "Suomenlinna Fortress", latitude: 60.1450, longitude: 24.9881 };
    const plan = analyzeRouteMobility([harbour, island], 5);

    expect(plan.transfers[0]?.mode).toBe("ferry");
  });
});
