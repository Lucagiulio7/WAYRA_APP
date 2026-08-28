/**
 * builderStore.ts â€” Zustand store per il Builder itinerario
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
import { routeWalkingKm } from "@/utils/routeMetrics";

// â”€â”€â”€ Tipi (mirror di quelli in create-itinerary.tsx) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Helpers interni â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

function syncSlotCounter(days: DayPlan[]) {
  for (const slot of days.flatMap((day) => day.slots)) {
    const match = /^slot_(\d+)$/.exec(slot.id);
    if (match) _counter = Math.max(_counter, Number(match[1]));
  }
}

// â”€â”€â”€ Ottimizzazione percorso (copiata dal componente) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type GeoRef = { latitude: number; longitude: number };



function routeCost(stops: GeoRef[]): number {
  return routeWalkingKm(stops);
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
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, j + 1).reverse(),
          ...best.slice(j + 1),
        ];
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
  const filledAttractions = slots.filter((s) => s.attraction !== null && s.kind === "attraction");
  const filledMeals = slots.filter((s) => s.attraction !== null && s.kind === "meal");
  const empty = slots.filter((s) => s.attraction === null);
  return [...optimizeSegment(filledAttractions, null, null), ...filledMeals, ...empty];
}

// â”€â”€â”€ Store â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MAX_DAYS = 15;

interface BuilderState {
  days: DayPlan[];
  expandedDay: number;

  // Inizializza / resetta il builder per una nuova sessione
  init: (numDays: number) => void;
  restore: (days: DayPlan[], expandedDay: number) => void;

  // Giorni
  setExpandedDay: (day: number) => void;
  addDay: () => void;

  // Slot
  dropAttraction: (dayIdx: number, slotId: string, attraction: BuilderAttraction) => void;
  removeAttraction: (dayIdx: number, slotId: string) => void;
  deleteSlot: (dayIdx: number, slotId: string) => void;
  addSlot: (dayIdx: number, kind?: SlotKind) => void;
  setNote: (dayIdx: number, slotId: string, note: string) => void;

  // Ottimizzazione
  optimizeDay: (dayIdx: number) => void;

  // Aggiunge uno slot giÃ  pieno (usato da commitNewSlot nel drag)
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

  restore: (days, expandedDay) => {
    syncSlotCounter(days);
    set({ days, expandedDay: Math.min(Math.max(1, expandedDay), days.length) });
  },

  setExpandedDay: (day) =>
    set({ expandedDay: day }),

  addDay: () =>
    set((s) => {
      if (s.days.length >= MAX_DAYS) return s;
      const nextDay = s.days.length + 1;
      return {
        days: [...s.days, { day: nextDay, slots: [makeSlot(), makeSlot()] }],
        expandedDay: nextDay,
      };
    }),

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
        const filledSlots = d.slots.filter((sl) => sl.attraction !== null);
        const filledById = new Map(filledSlots.map((sl) => [sl.id, sl]));
        const seen = new Set<string>();
        const reordered = newSlotIds.flatMap((id) => {
          const slot = filledById.get(id);
          if (!slot || seen.has(id)) return [];
          seen.add(id);
          return [slot];
        });
        const unmentioned = filledSlots.filter((slot) => !seen.has(slot.id));
        const emptySlots = d.slots.filter((sl) => sl.attraction === null);
        return { ...d, slots: [...reordered, ...unmentioned, ...emptySlots] };
      }),
    })),
}));
