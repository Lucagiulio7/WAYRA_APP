/**
 * Controlli statici sull'integrità del codice modificato.
 * Non eseguono logica a runtime — leggono i file sorgente come stringhe
 * e verificano pattern critici con regex/includes.
 */

import * as fs from "fs";
import * as path from "path";

const root = path.resolve(__dirname, "..");

function src(relPath: string) {
  return fs.readFileSync(path.join(root, relPath), "utf-8");
}

// ─── _layout.tsx ─────────────────────────────────────────────────────────────

describe("_layout.tsx", () => {
  const file = src("app/_layout.tsx");

  it("importa PersistQueryClientProvider", () => {
    expect(file).toContain("PersistQueryClientProvider");
  });

  it("importa queryClient e asyncStoragePersister", () => {
    expect(file).toContain("queryClient");
    expect(file).toContain("asyncStoragePersister");
  });

  it("importa ErrorBoundary", () => {
    expect(file).toContain('ErrorBoundary');
  });

  it("ErrorBoundary avvolge il provider tree", () => {
    // ErrorBoundary deve comparire prima di PersistQueryClientProvider nel JSX
    const ebIdx = file.indexOf("<ErrorBoundary");
    const pqIdx = file.indexOf("<PersistQueryClientProvider");
    expect(ebIdx).toBeGreaterThanOrEqual(0);
    expect(pqIdx).toBeGreaterThan(ebIdx);
  });

  it("PersistQueryClientProvider avvolge ThemeProvider", () => {
    const pqIdx = file.indexOf("<PersistQueryClientProvider");
    const tpIdx = file.indexOf("<ThemeProvider");
    expect(tpIdx).toBeGreaterThan(pqIdx);
  });
});

// ─── lib/queryClient.ts ───────────────────────────────────────────────────────

describe("lib/queryClient.ts", () => {
  const file = src("lib/queryClient.ts");

  it("esporta queryClient", () => {
    expect(file).toContain("export const queryClient");
  });

  it("esporta asyncStoragePersister", () => {
    expect(file).toContain("export const asyncStoragePersister");
  });

  it("usa staleTime", () => {
    expect(file).toContain("staleTime");
  });

  it("usa gcTime (persistenza offline 24h)", () => {
    expect(file).toContain("gcTime");
    // 24 ore in ms = 86400000
    expect(file).toContain("60 * 60 * 24");
  });

  it("usa createAsyncStoragePersister", () => {
    expect(file).toContain("createAsyncStoragePersister");
  });
});

// ─── hooks — queryKey correctness ────────────────────────────────────────────

describe("hooks — queryKey", () => {
  it("useAttractions usa queryKey ['attractions', city]", () => {
    expect(src("hooks/useAttractions.ts")).toContain('"attractions"');
  });

  it("useFoodSpots usa queryKey ['foodSpots', city]", () => {
    expect(src("hooks/useFoodSpots.ts")).toContain('"foodSpots"');
  });

  it("useCityInfo usa queryKey ['cityInfo', city]", () => {
    expect(src("hooks/useCityInfo.ts")).toContain('"cityInfo"');
  });

  it("useCityExtras usa queryKey ['cityExtras', city]", () => {
    expect(src("hooks/useCityExtras.ts")).toContain('"cityExtras"');
  });

  it("useNeighborhoods usa queryKey ['neighborhoods', city]", () => {
    expect(src("hooks/useNeighborhoods.ts")).toContain('"neighborhoods"');
  });

  it("useItinerary usa useMutation (non useQuery)", () => {
    const file = src("hooks/useItinerary.ts");
    expect(file).toContain("useMutation");
    expect(file).not.toContain("useQuery");
  });
});

describe("guide obbligatorie al primo accesso", () => {
  const guidedFiles: Array<[string, string]> = [
    ["app/index.tsx", "home-v1"],
    ["app/itinerary.tsx", "itinerary-v1"],
    ["app/packing.tsx", "packing-v1"],
    ["app/saved.tsx", "saved-v1"],
    ["components/SettingsModal.tsx", "settings-v1"],
    ["components/DayMap.tsx", "day-map-v1"],
    ["components/DayMap.tsx", "food-map-v1"],
    ["components/DayMap.web.tsx", "day-map-v1"],
    ["components/DayMap.web.tsx", "food-map-v1"],
    ["components/NeighborhoodMap.tsx", "neighborhood-map-v1"],
  ];

  it.each(guidedFiles)("%s collega la guida %s", (fileName, guideId) => {
    const file = src(fileName);
    expect(file).toContain("useFirstVisitGuide");
    expect(file).toContain(`"${guideId}"`);
    expect(file).toContain("guided={firstVisitGuide.guided}");
  });
});

// ─── hooks — enabled flag ─────────────────────────────────────────────────────

describe("hooks — enabled: !!city", () => {
  const hookFiles = [
    "hooks/useAttractions.ts",
    "hooks/useFoodSpots.ts",
    "hooks/useCityInfo.ts",
    "hooks/useCityExtras.ts",
    "hooks/useNeighborhoods.ts",
  ];

  hookFiles.forEach((f) => {
    it(`${path.basename(f)} ha enabled: !!city`, () => {
      expect(src(f)).toContain("enabled: !!city");
    });
  });
});

// ─── hooks — no useState/useEffect rimasti ────────────────────────────────────

describe("hooks — nessuno stato locale superfluo", () => {
  const hookFiles = [
    "hooks/useAttractions.ts",
    "hooks/useFoodSpots.ts",
    "hooks/useCityInfo.ts",
    "hooks/useCityExtras.ts",
    "hooks/useNeighborhoods.ts",
    "hooks/useItinerary.ts",
  ];

  hookFiles.forEach((f) => {
    it(`${path.basename(f)} non usa più useState`, () => {
      // Accettiamo import type ma non chiamate a useState(
      const file = src(f);
      expect(file).not.toMatch(/\buseState\s*\(/);
    });

    it(`${path.basename(f)} non usa useEffect`, () => {
      const file = src(f);
      expect(file).not.toMatch(/\buseEffect\s*\(/);
    });
  });
});

// ─── create-itinerary.tsx ─────────────────────────────────────────────────────

describe("create-itinerary.tsx", () => {
  const file = src("app/create-itinerary.tsx");

  it("importa FlashList", () => {
    expect(file).toContain("@shopify/flash-list");
  });

  it("usa FlashList (almeno 2 occorrenze: attrazioni + cibo)", () => {
    const matches = (file.match(/<FlashList/g) ?? []).length;
    expect(matches).toBeGreaterThanOrEqual(2);
  });

  it("non ha più setDays() residui", () => {
    expect(file).not.toMatch(/setDays\s*\(/);
  });

  it("importa useBuilderStore", () => {
    expect(file).toContain("useBuilderStore");
  });

  it("tutti i makeStyles usano useMemo", () => {
    // Nessuna occorrenza di makeStyles( senza useMemo( prima
    const raw = file.match(/makeStyles\(colors\)/g) ?? [];
    const memoized = file.match(/useMemo\(\(\)\s*=>\s*makeStyles\(colors\)/g) ?? [];
    expect(raw.length).toBe(memoized.length);
  });

  it("usa initBuilder in un useEffect", () => {
    expect(file).toContain("initBuilder");
    expect(file).toContain("useEffect");
  });
});

describe("release feature flags", () => {
  const features = src("constants/features.ts");
  const home = src("app/index.tsx");
  const builder = src("app/create-itinerary.tsx");

  it("keeps the manual builder disabled for the first public release", () => {
    expect(features).toMatch(/manualBuilder:\s*false/);
    expect(home).toContain("FEATURES.manualBuilder &&");
  });

  it("redirects direct manual-builder links to the home screen", () => {
    expect(builder).toContain("DisabledManualBuilderRedirect");
    expect(builder).toContain('router.replace("/")');
  });
});

describe("contextual help", () => {
  const home = src("app/index.tsx");
  const builder = src("app/create-itinerary.tsx");
  const itinerary = src("app/itinerary.tsx");

  it("does not render the legacy automatic onboarding", () => {
    expect(home).not.toContain("<OnboardingModal");
    expect(builder).not.toContain("<GuideModal");
    expect(itinerary).not.toContain("<ItineraryGuideModal");
    expect(home).not.toContain("function OnboardingModal");
    expect(builder).not.toContain("function GuideModal");
    expect(itinerary).not.toContain("function ItineraryGuideModal");
  });

  it("keeps contextual help available on the main planning screens", () => {
    [home, builder, itinerary].forEach((file) => {
      expect(file).toContain("useContextHelpController");
      expect(file).toContain("<ContextHelpUI");
    });
  });

  it("covers settings and actionable itinerary content", () => {
    expect(src("components/SettingsModal.tsx")).toContain("<ContextHelpUI");
    expect(src("components/ActivitiesTab.tsx")).toContain("helpActive");
    expect(src("components/PracticalInfoTab.tsx")).toContain("onHelpRequest");
  });

  it("does not keep first-launch guide storage keys", () => {
    expect(home).not.toContain("ONBOARDING_KEY");
    expect(builder).not.toContain("MANUAL_GUIDE_KEY");
    expect(itinerary).not.toContain("ITINERARY_GUIDE_KEY");
  });
});

// ─── components/ErrorBoundary.tsx ─────────────────────────────────────────────

describe("ErrorBoundary", () => {
  const file = src("components/ErrorBoundary.tsx");

  it("estende Component", () => {
    expect(file).toContain("extends Component");
  });

  it("implementa getDerivedStateFromError", () => {
    expect(file).toContain("getDerivedStateFromError");
  });

  it("implementa componentDidCatch", () => {
    expect(file).toContain("componentDidCatch");
  });

  it("ha un pulsante reset", () => {
    expect(file).toContain("reset");
  });

  it("mostra errore solo in __DEV__", () => {
    expect(file).toContain("__DEV__");
  });
});

// ─── store/builderStore.ts ────────────────────────────────────────────────────

describe("builderStore.ts", () => {
  const file = src("store/builderStore.ts");

  it("usa import type per BuilderAttraction", () => {
    expect(file).toContain("import type");
  });

  it("esporta useBuilderStore", () => {
    expect(file).toContain("export const useBuilderStore");
  });

  it("ha tutte le azioni richieste", () => {
    const actions = [
      "init", "setExpandedDay", "dropAttraction", "removeAttraction",
      "deleteSlot", "addSlot", "setNote", "optimizeDay",
      "addFilledSlot", "mapAddFood", "mapReorderSlots",
    ];
    actions.forEach((a) => expect(file).toContain(a));
  });

  it("non ha dipendenze React (nessun useState/useEffect)", () => {
    expect(file).not.toMatch(/\buseState\b/);
    expect(file).not.toMatch(/\buseEffect\b/);
    expect(file).not.toContain('from "react"');
  });
});

// ─── auth.tsx — useMemo per makeStyles ───────────────────────────────────────

describe("auth.tsx", () => {
  const file = src("app/auth.tsx");

  it("usa useMemo per makeStyles", () => {
    expect(file).toContain("useMemo(() => makeStyles(colors)");
  });

  it("importa useMemo", () => {
    expect(file).toMatch(/useMemo/);
  });
});

// ─── TypeScript — nessun tipo Attraction rotto ────────────────────────────────

describe("types/index.ts", () => {
  const file = src("types/index.ts");

  it("Attraction ha name_en", () => {
    expect(file).toContain("name_en");
  });

  it("Attraction ha description_en", () => {
    expect(file).toContain("description_en");
  });
});

describe("mappe e precaricamento metro", () => {
  it("le mappe giornaliere consentono lo zoom fino alla vista regionale", () => {
    ["components/DayMap.tsx", "components/DayMap.web.tsx"].forEach((fileName) => {
      const file = src(fileName);
      expect(file).toContain("minZoom:3");
      expect(file).not.toContain("minZoom:12");
    });
  });

  it("la generazione precarica la rete senza bloccare indefinitamente l'itinerario", () => {
    const file = src("app/index.tsx");
    expect(file).toContain("supportsTransit(requestedCity)");
    expect(file).toContain("getTransitNetwork(requestedCity)");
    expect(file).toContain("Promise.race");
    expect(file).toContain("TRANSIT_PRELOAD_WAIT_MS");
    expect(file).toContain("Prepariamo e salviamo la rete di trasporto");
  });
});
