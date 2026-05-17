/**
 * builderStore.ts — Zustand store per il Builder itinerario
 *
 * Contiene solo lo stato *dati* del builder: giorni e slot.
 * Lo stato UI effimero (drag, modali, ricerca) rimane locale nel componente.
 *
 * Uso:
 *   const days = useBuilderStore((s) => s.days);
 *   const { dropAttraction, removeAttraction, optimizeDay } = useBuilderStore();
 */

import { create } from "zustand";
import type { BuilderAttraction } from "@/hooks/useAttractions";

// ─── Tipi (mirror di quelli in create-itinerary.tsx) ─────────────────────────

export type SlotKind = "attraction" | "meal";

export interface SlotData {
  id: string;
  kind: SlotKind;
  attraction: BuilderAttraction | null;
  note?: string;
}

export interface DayPlan {
  day: number;
  slots: SlotData[];
}

// ─── Helpers interni ─────────────────────────────────────────────────────────

let _counter = 0;

function makeSlot(kind: SlotKind = "attraction"): SlotData {
  return { id: `slot_${++_counter}`, kind, attraction: null };
}

function makeDays(numDays: number): DayPlan[] {
  return Array.from({ length: numDays }, (_, i) => ({
    day: i + 1,
    slots: [makeSlot(), makeSlot()],
  }));
}

// ─── Ottimizzazione percorso (copiata dal componente) ────────────────────────

type GeoRef = { latitude: number; longitude: number };

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const f1 = (lat1 * Math.PI) / 180;
  const f2 = (lat2 * Math.PI) / 180;
  const df = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function routeCost(stops: GeoRef[]): number {
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    total += haversineKm(stops[i].latitude, stops[i].longitude, stops[i + 1].latitude, stops[i + 1].longitude);
  }
  return total;
}

function optimizeSegment(slots: SlotData[], from: GeoRef | null, to: GeoRef | null): SlotData[] {
  if (slots.length <= 1) return slots;
  let best = [...slots];
  let bestCost = routeCost([
    ...(from ? [from] : []),
    ...slots.map((s) => s.attraction!),
    ...(to ? [to] : []),
  ]);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const candidate = [...best];
        [candidate[i], candidate[j]] = [candidate[j], candidate[i]];
        const c = routeCost([
          ...(from ? [from] : []),
          ...candidate.map((s) => s.attraction!),
          ...(to ? [to] : []),
        ]);
        if (c < bestCost - 1e-9) { best = candidate; bestCost = c; improved = true; }
      }
    }
  }
  return best;
}

function optimizeSlots(slots: SlotData[]): SlotData[] {
  const filled = slots.filter((s) => s.attraction !== null);
  const empty = slots.filter((s) => s.attraction === null);
  const result: SlotData[] = [];
  let segment: SlotData[] = [];
  let prevMealRef: GeoRef | null = null;
  for (const slot of filled) {
    if (slot.kind === "meal") {
      const endRef: GeoRef = { latitude: slot.attraction!.latitude, longitude: slot.attraction!.longitude };
      result.push(...optimizeSegment(segment, prevMealRef, endRef));
      result.push(slot);
      prevMealRef = endRef;
      segment = [];
    } else {
      segment.push(slot);
    }
  }
  result.push(...optimizeSegment(segment, prevMealRef, null));
  return [...result, ...empty];
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface BuilderState {
  days: DayPlan[];
  expandedDay: number;

  // Inizializza / resetta il builder per una nuova sessione
  init: (numDays: number) => void;

  // Giorni
  setExpandedDay: (day: number) => void;

  // Slot
  dropAttraction: (dayIdx: number, slotId: string, attraction: BuilderAttraction) => void;
  removeAttraction: (dayIdx: number, slotId: string) => void;
  deleteSlot: (dayIdx: number, slotId: string) => void;
  addSlot: (dayIdx: number, kind?: SlotKind) => void;
  setNote: (dayIdx: number, slotId: string, note: string) => void;

  // Ottimizzazione
  optimizeDay: (dayIdx: number) => void;

  // Aggiunge uno slot già pieno (usato da commitNewSlot nel drag)
  addFilledSlot: (dayIdx: number, kind: SlotKind, attraction: BuilderAttraction) => void;

  // Azioni mappa
  mapAddFood: (dayIdx: number, attraction: BuilderAttraction, afterSlotId: string | null) => void;
  mapReorderSlots: (dayIdx: number, newSlotIds: string[]) => void;
}

export const useBuilderStore = create<BuilderState>()((set) => ({
  days: [],
  expandedDay: 1,

  init: (numDays) =>
    set({ days: makeDays(numDays), expandedDay: 1 }),

  setExpandedDay: (day) =>
    set({ expandedDay: day }),

  dropAttraction: (dayIdx, slotId, attraction) =>
    set((s) => {
      const days = s.days.map((d, i) => {
        if (i !== dayIdx) return d;
        return {
          ...d,
          slots: d.slots.map((sl) =>
            sl.id === slotId ? { ...sl, attraction } : sl,
          ),
        };
      });
      return { days };
    }),

  removeAttraction: (dayIdx, slotId) =>
    set((s) => ({
      days: s.days.map((d, i) =>
        i !== dayIdx
          ? d
          : { ...d, slots: d.slots.map((sl) => sl.id === slotId ? { ...sl, attraction: null, note: undefined } : sl) },
      ),
    })),

  deleteSlot: (dayIdx, slotId) =>
    set((s) => ({
      days: s.days.map((d, i) =>
        i !== dayIdx ? d : { ...d, slots: d.slots.filter((sl) => sl.id !== slotId) },
      ),
    })),

  addSlot: (dayIdx, kind = "attraction") =>
    set((s) => ({
      days: s.days.map((d, i) =>
        i !== dayIdx ? d : { ...d, slots: [...d.slots, makeSlot(kind)] },
      ),
    })),

  setNote: (dayIdx, slotId, note) =>
    set((s) => ({
      days: s.days.map((d, i) =>
        i !== dayIdx
          ? d
          : { ...d, slots: d.slots.map((sl) => sl.id === slotId ? { ...sl, note } : sl) },
      ),
    })),

  optimizeDay: (dayIdx) =>
    set((s) => ({
      days: s.days.map((d, i) =>
        i !== dayIdx ? d : { ...d, slots: optimizeSlots(d.slots) },
      ),
    })),

  addFilledSlot: (dayIdx, kind, attraction) =>
    set((s) => ({
      days: s.days.map((d, i) =>
        i !== dayIdx
          ? d
          : { ...d, slots: [...d.slots, { ...makeSlot(kind), attraction }] },
      ),
    })),

  mapAddFood: (dayIdx, attraction, afterSlotId) =>
    set((s) => ({
      days: s.days.map((d, i) => {
        if (i !== dayIdx) return d;
        const newSlot: SlotData = { ...makeSlot("meal"), attraction };
        if (afterSlotId === null) return { ...d, slots: [newSlot, ...d.slots] };
        const afterIdx = d.slots.findIndex((sl) => sl.id === afterSlotId);
        if (afterIdx < 0) return { ...d, slots: [...d.slots, newSlot] };
        const next = [...d.slots];
        next.splice(afterIdx + 1, 0, newSlot);
        return { ...d, slots: next };
      }),
    })),

  mapReorderSlots: (dayIdx, newSlotIds) =>
    set((s) => ({
      days: s.days.map((d, i) => {
        if (i !== dayIdx) return d;
        const slotMap = new Map(d.slots.map((sl) => [sl.id, sl]));
        const emptySlots = d.slots.filter((sl) => sl.attraction === null);
        const reordered = newSlotIds.map((id) => slotMap.get(id)).filter(Boolean) as SlotData[];
        return { ...d, slots: [...reordered, ...emptySlots] };
      }),
    })),
}));
