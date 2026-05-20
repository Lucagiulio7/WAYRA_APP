/**
 * Test unitari per le funzioni pure di DraggableStopList.
 *
 * Copertura:
 *  - touchToSlot  : calcolo slot d'inserimento in base alla posizione Y del tocco
 *  - reorderStops : riordino array via splice (fromIdx → toSlot)
 *  - sKey         : generazione chiave stabile per una Stop
 */

import { touchToSlot, reorderStops, sKey, DEFAULT_H, ITEM_GAP } from "../utils/draggableUtils";
import { Stop } from "../types";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Crea una Stop minimale per i test */
function makeStop(id: number, type: Stop["type"] = "attraction"): Stop {
  return {
    id,
    type,
    name: `Stop ${id}`,
    address: "",
    latitude: 0,
    longitude: 0,
    maps_url: "",
  } as Stop;
}

/** Costruisce heights e idxKeys per una lista di 4 stop con altezze uniformi */
function buildContext(stops: Stop[], itemH: number = DEFAULT_H) {
  const idxKeys = stops.map(sKey);
  const heights = new Map<string, number>();
  idxKeys.forEach((k) => heights.set(k, itemH));
  return { idxKeys, heights };
}

// ── sKey ──────────────────────────────────────────────────────────────────────

describe("sKey", () => {
  it("usa type+id per stop con id > 0", () => {
    expect(sKey(makeStop(42, "attraction"), 0)).toBe("attraction-42");
  });

  it("usa type+ft+idx per stop con id === -1", () => {
    const s = makeStop(-1, "food");
    expect(sKey(s, 3)).toBe("food-ft-3");
  });
});

// ── touchToSlot ───────────────────────────────────────────────────────────────

describe("touchToSlot", () => {
  const CELL = DEFAULT_H + ITEM_GAP; // 108 px per cella

  const stops = [makeStop(1), makeStop(2), makeStop(3), makeStop(4)];
  const { heights, idxKeys } = buildContext(stops);

  // Dragging item 0. Lista ridotta: [1, 2, 3] (item 0 rimosso)
  it("slot 0 quando il tocco è nella prima metà della cella 1", () => {
    // Prima metà di cella 1: touchY < CELL/2 = 54
    const slot = touchToSlot(10, 0, stops, heights, idxKeys);
    expect(slot).toBe(0);
  });

  it("slot 1 quando il tocco supera la metà della cella 1", () => {
    // Appena oltre CELL/2 = 54
    const slot = touchToSlot(CELL / 2 + 1, 0, stops, heights, idxKeys);
    expect(slot).toBe(1);
  });

  it("slot 2 quando il tocco supera la metà della cella 2", () => {
    // CELL + CELL/2 + 1
    const slot = touchToSlot(CELL + CELL / 2 + 1, 0, stops, heights, idxKeys);
    expect(slot).toBe(2);
  });

  it("slot massimo (3) quando il tocco è oltre tutte le celle", () => {
    const slot = touchToSlot(9999, 0, stops, heights, idxKeys);
    expect(slot).toBe(3);
  });

  // Dragging item 2. Lista ridotta: [0, 1, 3] (item 2 rimosso)
  it("slot 0 quando il tocco è nella prima metà (drag=2)", () => {
    const slot = touchToSlot(10, 2, stops, heights, idxKeys);
    expect(slot).toBe(0);
  });

  it("slot 3 (fine lista) quando il tocco è oltre tutto (drag=2)", () => {
    const slot = touchToSlot(9999, 2, stops, heights, idxKeys);
    expect(slot).toBe(3);
  });

  it("usa DEFAULT_H come fallback se la chiave non è nelle heights", () => {
    const emptyHeights = new Map<string, number>();
    // Con altezze di default, CELL = DEFAULT_H + ITEM_GAP = 108
    const slot = touchToSlot(CELL / 2 + 1, 0, stops, emptyHeights, idxKeys);
    expect(slot).toBe(1);
  });
});

// ── reorderStops ─────────────────────────────────────────────────────────────

describe("reorderStops", () => {
  const stops = [makeStop(1), makeStop(2), makeStop(3), makeStop(4)];

  it("non muta l'array originale", () => {
    const orig = [...stops];
    reorderStops(stops, 0, 3);
    expect(stops.map((s) => s.id)).toEqual(orig.map((s) => s.id));
  });

  it("sposta il primo elemento in ultima posizione", () => {
    const result = reorderStops(stops, 0, 3);
    expect(result.map((s) => s.id)).toEqual([2, 3, 4, 1]);
  });

  it("sposta l'ultimo elemento in prima posizione", () => {
    const result = reorderStops(stops, 3, 0);
    expect(result.map((s) => s.id)).toEqual([4, 1, 2, 3]);
  });

  it("sposta un elemento di una posizione in su", () => {
    const result = reorderStops(stops, 2, 1);
    expect(result.map((s) => s.id)).toEqual([1, 3, 2, 4]);
  });

  it("sposta un elemento di una posizione in giù", () => {
    const result = reorderStops(stops, 1, 2);
    expect(result.map((s) => s.id)).toEqual([1, 3, 2, 4]);
  });

  it("no-op quando fromIdx === toSlot", () => {
    const result = reorderStops(stops, 2, 2);
    expect(result.map((s) => s.id)).toEqual([1, 2, 3, 4]);
  });

  it("gestisce lista con un singolo elemento", () => {
    const single = [makeStop(7)];
    const result = reorderStops(single, 0, 0);
    expect(result.map((s) => s.id)).toEqual([7]);
  });

  it("gestisce lista con due elementi (swap)", () => {
    const two = [makeStop(1), makeStop(2)];
    const result = reorderStops(two, 0, 1);
    expect(result.map((s) => s.id)).toEqual([2, 1]);
  });
});
