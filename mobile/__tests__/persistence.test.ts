const memory = new Map<string, string>();

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => memory.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => { memory.set(key, value); }),
    removeItem: jest.fn(async (key: string) => { memory.delete(key); }),
  },
}));

import type { Itinerary } from "../types";
import {
  loadSavedItineraries,
  mutateSavedItineraries,
  type SavedItinerary,
} from "../services/savedItineraryStorage";
import {
  loadItineraryDraft,
  saveItineraryDraft,
} from "../services/itineraryDraftStorage";
import {
  loadManualBuilderDraft,
  saveManualBuilderDraft,
} from "../services/manualBuilderDraftStorage";
import {
  clearGenerationRequest,
  createGenerationRequest,
  loadGenerationRequest,
  saveGenerationRequest,
} from "../services/generationRequestStorage";

function itinerary(city = "roma", id = 1): Itinerary {
  return {
    city,
    num_days: 1,
    level: 1,
    max_walk_km: 5,
    days: [{
      day: 1,
      maps_link: "",
      restaurants: [],
      stops: [{
        id,
        type: "attraction",
        name: `Tappa ${id}`,
        description: "Descrizione",
        latitude: 41.9,
        longitude: 12.5,
        estimated_visit_time: 60,
      }],
    }],
    food_recommendations: [],
    culture_facts: [],
  };
}

function saved(id: string, city = "roma"): SavedItinerary {
  return { id, savedAt: new Date(2026, 0, Number(id.replace(/\D/g, "")) || 1).toISOString(), itinerary: itinerary(city) };
}

beforeEach(() => memory.clear());

describe("saved itinerary persistence", () => {
  it("migra automaticamente il vecchio array nel formato versionato", async () => {
    memory.set("wayra_saved_itineraries", JSON.stringify([saved("1")]));

    const loaded = await loadSavedItineraries();

    expect(loaded.map((entry) => entry.id)).toEqual(["1"]);
    expect(JSON.parse(memory.get("wayra_saved_itineraries_v2") ?? "{}").version).toBe(2);
    expect(memory.has("wayra_saved_itineraries")).toBe(false);
  });

  it("recupera il backup quando la copia primaria e corrotta", async () => {
    memory.set("wayra_saved_itineraries_v2", "{broken");
    memory.set("wayra_saved_itineraries_backup_v2", JSON.stringify({
      version: 2,
      updatedAt: new Date().toISOString(),
      entries: [saved("2", "parigi")],
    }));

    const loaded = await loadSavedItineraries();

    expect(loaded[0].itinerary.city).toBe("parigi");
    expect(JSON.parse(memory.get("wayra_saved_itineraries_v2") ?? "{}").entries).toHaveLength(1);
  });

  it("non perde aggiornamenti eseguiti contemporaneamente", async () => {
    await Promise.all([
      mutateSavedItineraries((current) => [saved("1"), ...current]),
      mutateSavedItineraries((current) => [saved("2", "parigi"), ...current]),
    ]);

    const loaded = await loadSavedItineraries();
    expect(new Set(loaded.map((entry) => entry.id))).toEqual(new Set(["1", "2"]));
  });

  it("scarta singole voci non valide senza bloccare l'archivio", async () => {
    memory.set("wayra_saved_itineraries_v2", JSON.stringify({
      version: 2,
      updatedAt: new Date().toISOString(),
      entries: [{ id: "broken" }, saved("3")],
    }));

    expect((await loadSavedItineraries()).map((entry) => entry.id)).toEqual(["3"]);
  });
});

describe("working drafts", () => {
  it("mantiene una copia valida precedente dell'itinerario", async () => {
    await saveItineraryDraft(itinerary("roma", 1));
    await saveItineraryDraft(itinerary("roma", 2));
    memory.set("wayra_draft_itinerary_v2", "not-json");

    const recovered = await loadItineraryDraft();
    expect(recovered?.days[0].stops[0].id).toBe(1);
  });

  it("ripristina la bozza manuale solo per citta e durata corrispondenti", async () => {
    await saveManualBuilderDraft({
      version: 1,
      city: "roma",
      numDays: 1,
      expandedDay: 1,
      updatedAt: new Date().toISOString(),
      days: [{
        day: 1,
        slots: [{
          id: "slot_42",
          kind: "attraction",
          note: "Prenotato",
          attraction: { id: 1, name: "Colosseo", latitude: 41.89, longitude: 12.49 } as any,
        }],
      }],
    });

    expect((await loadManualBuilderDraft("roma", 1))?.days[0].slots[0].note).toBe("Prenotato");
    expect(await loadManualBuilderDraft("parigi", 1)).toBeNull();
    expect(await loadManualBuilderDraft("roma", 3)).toBeNull();
  });
});

describe("generation recovery", () => {
  it("conserva e ripristina le opzioni della richiesta interrotta", async () => {
    const request = createGenerationRequest({ city: "londra", num_days: 7, level: "mix", max_walk_km: 5, language: "fr" });
    await saveGenerationRequest(request);

    expect((await loadGenerationRequest())?.params).toMatchObject({
      city: "londra",
      num_days: 7,
      level: "mix",
      language: "fr",
    });

    await clearGenerationRequest();
    expect(await loadGenerationRequest()).toBeNull();
  });

  it("non riprende richieste rimaste ferme per oltre trenta minuti", async () => {
    const request = createGenerationRequest({ city: "roma", num_days: 3, level: 1 });
    request.createdAt = new Date(Date.now() - 31 * 60 * 1000).toISOString();
    await saveGenerationRequest(request);

    expect(await loadGenerationRequest()).toBeNull();
  });
});
