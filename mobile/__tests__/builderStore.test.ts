/**
 * Test della logica del BuilderStore (Zustand v5, Node.js puro).
 * Non serve React — Zustand v5 espone .getState()/.setState() come metodi statici.
 */

import { useBuilderStore } from "../store/builderStore";

// Tipo minimo per i test (non importiamo il modulo completo)
type FakeAttraction = {
  id: number; name: string; category_level: number;
  latitude: number; longitude: number;
};

const A1: FakeAttraction = { id: 1, name: "Colosseo",  category_level: 1, latitude: 41.89, longitude: 12.49 };
const A2: FakeAttraction = { id: 2, name: "Pantheon",  category_level: 1, latitude: 41.90, longitude: 12.47 };
const F1: FakeAttraction = { id: 9, name: "Pizzeria",  category_level: 2, latitude: 41.91, longitude: 12.48 };

/** Resetta lo store a uno stato pulito prima di ogni test */
beforeEach(() => {
  // Resetta solo i dati (Zustand v5: setState senza replace merge il partial)
  useBuilderStore.setState({ days: [], expandedDay: 1 });
});

// ─── init ─────────────────────────────────────────────────────────────────────

describe("init", () => {
  it("crea il numero corretto di giorni", () => {
    useBuilderStore.getState().init(3);
    expect(useBuilderStore.getState().days).toHaveLength(3);
    expect(useBuilderStore.getState().days[0].day).toBe(1);
    expect(useBuilderStore.getState().days[2].day).toBe(3);
  });

  it("ogni giorno parte con 2 slot vuoti di tipo attraction", () => {
    useBuilderStore.getState().init(2);
    useBuilderStore.getState().days.forEach((d) => {
      expect(d.slots).toHaveLength(2);
      d.slots.forEach((s) => {
        expect(s.attraction).toBeNull();
        expect(s.kind).toBe("attraction");
      });
    });
  });

  it("reinizializzare sovrascrive giorni precedenti", () => {
    useBuilderStore.getState().init(5);
    useBuilderStore.getState().init(2);
    expect(useBuilderStore.getState().days).toHaveLength(2);
  });

  it("expandedDay torna a 1", () => {
    useBuilderStore.getState().init(3);
    useBuilderStore.getState().setExpandedDay(3);
    useBuilderStore.getState().init(3);
    expect(useBuilderStore.getState().expandedDay).toBe(1);
  });
});

// ─── setExpandedDay ───────────────────────────────────────────────────────────

describe("setExpandedDay", () => {
  it("aggiorna expandedDay", () => {
    useBuilderStore.getState().init(3);
    useBuilderStore.getState().setExpandedDay(2);
    expect(useBuilderStore.getState().expandedDay).toBe(2);
  });
});

describe("restore", () => {
  it("ripristina giorni e continua a generare id slot univoci", () => {
    useBuilderStore.getState().restore([{
      day: 1,
      slots: [{ id: "slot_500", kind: "attraction", attraction: A1 as any }],
    }], 1);
    useBuilderStore.getState().addSlot(0);
    const ids = useBuilderStore.getState().days[0].slots.map((slot) => slot.id);
    expect(ids).toEqual(["slot_500", "slot_501"]);
  });
});

// ─── dropAttraction ───────────────────────────────────────────────────────────

describe("dropAttraction", () => {
  it("piazza un'attrazione nello slot corretto", () => {
    useBuilderStore.getState().init(1);
    const slotId = useBuilderStore.getState().days[0].slots[0].id;
    useBuilderStore.getState().dropAttraction(0, slotId, A1 as any);
    expect(useBuilderStore.getState().days[0].slots[0].attraction?.id).toBe(1);
  });

  it("non tocca gli altri giorni", () => {
    useBuilderStore.getState().init(3);
    const slotId = useBuilderStore.getState().days[0].slots[0].id;
    useBuilderStore.getState().dropAttraction(0, slotId, A1 as any);
    expect(useBuilderStore.getState().days[1].slots[0].attraction).toBeNull();
    expect(useBuilderStore.getState().days[2].slots[0].attraction).toBeNull();
  });

  it("non tocca gli altri slot dello stesso giorno", () => {
    useBuilderStore.getState().init(1);
    const slotId = useBuilderStore.getState().days[0].slots[0].id;
    useBuilderStore.getState().dropAttraction(0, slotId, A1 as any);
    expect(useBuilderStore.getState().days[0].slots[1].attraction).toBeNull();
  });
});

// ─── removeAttraction ─────────────────────────────────────────────────────────

describe("removeAttraction", () => {
  it("svuota lo slot ma lo mantiene nella lista", () => {
    useBuilderStore.getState().init(1);
    const slotId = useBuilderStore.getState().days[0].slots[0].id;
    useBuilderStore.getState().dropAttraction(0, slotId, A1 as any);
    useBuilderStore.getState().removeAttraction(0, slotId);
    const slot = useBuilderStore.getState().days[0].slots[0];
    expect(slot.attraction).toBeNull();
    expect(slot.id).toBe(slotId); // slot esiste ancora
  });

  it("conta gli slot: rimane invariato", () => {
    useBuilderStore.getState().init(1);
    const slotId = useBuilderStore.getState().days[0].slots[0].id;
    useBuilderStore.getState().dropAttraction(0, slotId, A1 as any);
    useBuilderStore.getState().removeAttraction(0, slotId);
    expect(useBuilderStore.getState().days[0].slots).toHaveLength(2);
  });
});

// ─── deleteSlot ───────────────────────────────────────────────────────────────

describe("deleteSlot", () => {
  it("rimuove fisicamente lo slot", () => {
    useBuilderStore.getState().init(1);
    const slotId = useBuilderStore.getState().days[0].slots[0].id;
    useBuilderStore.getState().deleteSlot(0, slotId);
    expect(useBuilderStore.getState().days[0].slots).toHaveLength(1);
    expect(useBuilderStore.getState().days[0].slots.find(s => s.id === slotId)).toBeUndefined();
  });

  it("non tocca gli altri giorni", () => {
    useBuilderStore.getState().init(2);
    const slotId = useBuilderStore.getState().days[0].slots[0].id;
    useBuilderStore.getState().deleteSlot(0, slotId);
    expect(useBuilderStore.getState().days[1].slots).toHaveLength(2);
  });
});

// ─── addSlot ──────────────────────────────────────────────────────────────────

describe("addSlot", () => {
  it("aggiunge uno slot attraction", () => {
    useBuilderStore.getState().init(1);
    useBuilderStore.getState().addSlot(0, "attraction");
    const slots = useBuilderStore.getState().days[0].slots;
    expect(slots).toHaveLength(3);
    expect(slots.at(-1)!.kind).toBe("attraction");
    expect(slots.at(-1)!.attraction).toBeNull();
  });

  it("aggiunge uno slot meal", () => {
    useBuilderStore.getState().init(1);
    useBuilderStore.getState().addSlot(0, "meal");
    expect(useBuilderStore.getState().days[0].slots.at(-1)!.kind).toBe("meal");
  });

  it("tutti gli slot hanno ID univoci anche dopo più addSlot", () => {
    useBuilderStore.getState().init(2);
    useBuilderStore.getState().addSlot(0);
    useBuilderStore.getState().addSlot(0);
    useBuilderStore.getState().addSlot(1);
    const ids = useBuilderStore.getState().days.flatMap(d => d.slots.map(s => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─── setNote ──────────────────────────────────────────────────────────────────

describe("setNote", () => {
  it("imposta la nota su uno slot specifico", () => {
    useBuilderStore.getState().init(1);
    const slotId = useBuilderStore.getState().days[0].slots[0].id;
    useBuilderStore.getState().setNote(0, slotId, "Porta ombrello");
    expect(useBuilderStore.getState().days[0].slots[0].note).toBe("Porta ombrello");
  });

  it("non tocca gli altri slot", () => {
    useBuilderStore.getState().init(1);
    const slotId = useBuilderStore.getState().days[0].slots[0].id;
    useBuilderStore.getState().setNote(0, slotId, "Nota");
    expect(useBuilderStore.getState().days[0].slots[1].note).toBeUndefined();
  });
});

// ─── addFilledSlot ────────────────────────────────────────────────────────────

describe("addFilledSlot", () => {
  it("aggiunge in coda uno slot già riempito", () => {
    useBuilderStore.getState().init(1);
    useBuilderStore.getState().addFilledSlot(0, "attraction", A1 as any);
    const slots = useBuilderStore.getState().days[0].slots;
    expect(slots).toHaveLength(3);
    expect(slots.at(-1)!.attraction?.id).toBe(1);
    expect(slots.at(-1)!.kind).toBe("attraction");
  });

  it("funziona anche per meal", () => {
    useBuilderStore.getState().init(1);
    useBuilderStore.getState().addFilledSlot(0, "meal", F1 as any);
    expect(useBuilderStore.getState().days[0].slots.at(-1)!.kind).toBe("meal");
  });
});

// ─── mapAddFood ───────────────────────────────────────────────────────────────

describe("mapAddFood", () => {
  it("afterSlotId=null → inserisce in testa", () => {
    useBuilderStore.getState().init(1);
    useBuilderStore.getState().mapAddFood(0, F1 as any, null);
    expect(useBuilderStore.getState().days[0].slots[0].attraction?.id).toBe(9);
  });

  it("inserisce subito dopo lo slot specificato", () => {
    useBuilderStore.getState().init(1);
    const s0 = useBuilderStore.getState().days[0].slots[0].id;
    useBuilderStore.getState().dropAttraction(0, s0, A1 as any);
    useBuilderStore.getState().mapAddFood(0, F1 as any, s0);
    const slots = useBuilderStore.getState().days[0].slots;
    const idx = slots.findIndex(s => s.id === s0);
    expect(slots[idx + 1].attraction?.id).toBe(9);
  });

  it("afterSlotId non trovato → aggiunge in coda", () => {
    useBuilderStore.getState().init(1);
    useBuilderStore.getState().mapAddFood(0, F1 as any, "id_inesistente");
    const slots = useBuilderStore.getState().days[0].slots;
    expect(slots.at(-1)!.attraction?.id).toBe(9);
  });
});

// ─── mapReorderSlots ──────────────────────────────────────────────────────────

describe("mapReorderSlots", () => {
  it("inverte l'ordine dei slot filled", () => {
    useBuilderStore.getState().init(1);
    const [s0, s1] = useBuilderStore.getState().days[0].slots;
    useBuilderStore.getState().dropAttraction(0, s0.id, A1 as any);
    useBuilderStore.getState().dropAttraction(0, s1.id, A2 as any);
    useBuilderStore.getState().mapReorderSlots(0, [s1.id, s0.id]);
    const filled = useBuilderStore.getState().days[0].slots.filter(s => s.attraction !== null);
    expect(filled[0].id).toBe(s1.id);
    expect(filled[1].id).toBe(s0.id);
  });

  it("gli slot vuoti finiscono in coda", () => {
    useBuilderStore.getState().init(1);
    useBuilderStore.getState().addSlot(0); // aggiunge slot[2] vuoto
    const [s0, s1] = useBuilderStore.getState().days[0].slots;
    useBuilderStore.getState().dropAttraction(0, s0.id, A1 as any);
    useBuilderStore.getState().dropAttraction(0, s1.id, A2 as any);
    useBuilderStore.getState().mapReorderSlots(0, [s1.id, s0.id]);
    const slots = useBuilderStore.getState().days[0].slots;
    expect(slots.at(-1)!.attraction).toBeNull(); // empty slot in fondo
  });

  it("non perde o duplica tappe con una sequenza drag parziale", () => {
    useBuilderStore.getState().init(1);
    useBuilderStore.getState().addSlot(0);
    const [s0, s1, s2] = useBuilderStore.getState().days[0].slots;
    useBuilderStore.getState().dropAttraction(0, s0.id, A1 as any);
    useBuilderStore.getState().dropAttraction(0, s1.id, A2 as any);
    useBuilderStore.getState().dropAttraction(0, s2.id, F1 as any);

    useBuilderStore.getState().mapReorderSlots(0, [s1.id, s1.id]);

    const filled = useBuilderStore.getState().days[0].slots.filter((slot) => slot.attraction !== null);
    expect(filled.map((slot) => slot.id)).toEqual([s1.id, s0.id, s2.id]);
    expect(new Set(filled.map((slot) => slot.id)).size).toBe(3);
  });

});

// ─── optimizeDay ──────────────────────────────────────────────────────────────

describe("optimizeDay", () => {
  it("non crasha su giorno senza attrazioni", () => {
    useBuilderStore.getState().init(1);
    expect(() => useBuilderStore.getState().optimizeDay(0)).not.toThrow();
  });

  it("non crasha con un solo slot riempito", () => {
    useBuilderStore.getState().init(1);
    const slotId = useBuilderStore.getState().days[0].slots[0].id;
    useBuilderStore.getState().dropAttraction(0, slotId, A1 as any);
    expect(() => useBuilderStore.getState().optimizeDay(0)).not.toThrow();
  });

  it("mantiene lo stesso numero di slot dopo ottimizzazione", () => {
    useBuilderStore.getState().init(1);
    const [s0, s1] = useBuilderStore.getState().days[0].slots;
    useBuilderStore.getState().dropAttraction(0, s0.id, A1 as any);
    useBuilderStore.getState().dropAttraction(0, s1.id, A2 as any);
    useBuilderStore.getState().optimizeDay(0);
    expect(useBuilderStore.getState().days[0].slots).toHaveLength(2);
  });

  it("gli slot riempiti rimangono riempiti dopo ottimizzazione", () => {
    useBuilderStore.getState().init(1);
    const [s0, s1] = useBuilderStore.getState().days[0].slots;
    useBuilderStore.getState().dropAttraction(0, s0.id, A1 as any);
    useBuilderStore.getState().dropAttraction(0, s1.id, A2 as any);
    useBuilderStore.getState().optimizeDay(0);
    const filled = useBuilderStore.getState().days[0].slots.filter(s => s.attraction !== null);
    expect(filled).toHaveLength(2);
  });

  it("il 2-opt ottimizza correttamente una route semplice", () => {
    // Tre attrazioni: Roma → New York → Milano
    // Ordine ottimale: Roma → Milano → New York (o viceversa, il più corto)
    useBuilderStore.getState().init(1);
    useBuilderStore.getState().addSlot(0); // 3 slot totali
    const [s0, s1, s2] = useBuilderStore.getState().days[0].slots;
    const Roma    = { ...A1, id: 1, latitude: 41.9,  longitude: 12.5  }; // Roma
    const NewYork = { ...A1, id: 2, latitude: 40.7,  longitude: -74.0 }; // New York
    const Milano  = { ...A1, id: 3, latitude: 45.5,  longitude: 9.2   }; // Milano
    useBuilderStore.getState().dropAttraction(0, s0.id, Roma as any);
    useBuilderStore.getState().dropAttraction(0, s1.id, NewYork as any);
    useBuilderStore.getState().dropAttraction(0, s2.id, Milano as any);
    useBuilderStore.getState().optimizeDay(0);
    // New York non dovrebbe stare in mezzo tra Roma e Milano
    const filled = useBuilderStore.getState().days[0].slots.filter(s => s.attraction !== null);
    const ids = filled.map(s => s.attraction!.id);
    expect(ids.indexOf(2)).not.toBe(1); // New York non al centro
  });

  it("ottimizza le attrazioni senza usare il pasto come vincolo del percorso", () => {
    useBuilderStore.setState({
      days: [{
        day: 1,
        slots: [
          { id: "a1", kind: "attraction", attraction: A1 as any },
          { id: "a2", kind: "attraction", attraction: A2 as any },
          { id: "meal", kind: "meal", attraction: F1 as any },
          { id: "a3", kind: "attraction", attraction: { ...A1, id: 3 } as any },
          { id: "a4", kind: "attraction", attraction: { ...A2, id: 4 } as any },
        ],
      }],
      expandedDay: 1,
    });

    useBuilderStore.getState().optimizeDay(0);

    const slots = useBuilderStore.getState().days[0].slots;
    const mealIndex = slots.findIndex((slot) => slot.id === "meal");
    expect(mealIndex).toBe(4);
    expect(new Set(slots.slice(0, mealIndex).map((slot) => slot.id))).toEqual(new Set(["a1", "a2", "a3", "a4"]));
    expect(slots[mealIndex].kind).toBe("meal");
  });

});

// ─── Consistenza generale ─────────────────────────────────────────────────────

describe("consistenza", () => {
  it("sequenza completa: init → drop → remove → delete → add", () => {
    const store = useBuilderStore.getState();
    store.init(2);
    const s0 = useBuilderStore.getState().days[0].slots[0].id;
    store.dropAttraction(0, s0, A1 as any);
    expect(useBuilderStore.getState().days[0].slots[0].attraction?.id).toBe(1);
    store.removeAttraction(0, s0);
    expect(useBuilderStore.getState().days[0].slots[0].attraction).toBeNull();
    store.deleteSlot(0, s0);
    expect(useBuilderStore.getState().days[0].slots).toHaveLength(1);
    store.addSlot(0, "meal");
    expect(useBuilderStore.getState().days[0].slots).toHaveLength(2);
    expect(useBuilderStore.getState().days[0].slots.at(-1)!.kind).toBe("meal");
  });

  it("lo stato del giorno 1 non influenza il giorno 2", () => {
    const store = useBuilderStore.getState();
    store.init(2);
    const s0g1 = useBuilderStore.getState().days[0].slots[0].id;
    const s0g2 = useBuilderStore.getState().days[1].slots[0].id;
    store.dropAttraction(0, s0g1, A1 as any);
    store.addSlot(0);
    store.deleteSlot(0, useBuilderStore.getState().days[0].slots[1].id);
    // il giorno 2 rimane intoccato
    expect(useBuilderStore.getState().days[1].slots).toHaveLength(2);
    expect(useBuilderStore.getState().days[1].slots[0].attraction).toBeNull();
  });
});
