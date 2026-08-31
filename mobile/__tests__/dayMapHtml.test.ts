jest.mock("react-native", () => ({
  ActivityIndicator: () => null,
  Animated: { Value: class {}, sequence: jest.fn(), timing: jest.fn(), View: () => null },
  Linking: { openURL: jest.fn() },
  Modal: () => null,
  Platform: { OS: "web" },
  ScrollView: () => null,
  StyleSheet: { create: (styles: unknown) => styles },
  Text: () => null,
  TouchableOpacity: () => null,
  View: () => null,
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-webview", () => ({ WebView: () => null }));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock("@/components/DraggableStopList", () => ({ DraggableStopList: () => null }));
jest.mock("@/components/ui", () => ({ AnimatedPressable: () => null }));
jest.mock("@/components/ContextHelp", () => ({ ContextHelpUI: () => null, contextHelpOutline: () => ({}), useContextHelpController: () => ({ active: false, guard: (_help: unknown, action: unknown) => action, toggle: jest.fn() }) }));
jest.mock("@/contexts/ThemeContext", () => ({ useTheme: () => ({ colors: {}, isDark: true }) }));
jest.mock("@/hooks/useTransitNetwork", () => ({ useTransitNetwork: () => ({ network: null, loading: false, supported: true }) }));

import { buildHtml } from "@/components/DayMap";
import { buildHtml as buildWebHtml } from "@/components/DayMap.web";
import { buildHtml as buildNeighborhoodHtml } from "@/components/NeighborhoodMap";

const transitNetwork = {
  city: "lisbona",
  label: "Transportes de Lisboa",
  mode: "mixed" as const,
  badge: "T",
  fetchedAt: Date.now(),
  lines: [{ id: "15E", name: "Electrico 15E", color: "#E6B800", textColor: "#111111", paths: [[[38.707, -9.145], [38.697, -9.205]]] as [number, number][][] }],
  stations: [
    { id: "cais", name: "Cais do Sodre", latitude: 38.707, longitude: -9.145, lineIds: ["15E"], linePositions: [{ lineId: "15E", latitude: 38.707, longitude: -9.145 }] },
    { id: "belem", name: "Belem", latitude: 38.697, longitude: -9.205, lineIds: ["15E"], linePositions: [{ lineId: "15E", latitude: 38.697, longitude: -9.205 }] },
  ],
};

describe("DayMap embedded document", () => {
  it.each([
    ["Expo Go", buildHtml],
    ["web", buildWebHtml],
  ])("genera JavaScript valido su %s anche con la rete di trasporto", (_platform, createHtml) => {
    const html = createHtml(
      { day: 1, stops: [], restaurants: [], maps_link: "" } as any,
      "lisbona",
      [],
      [],
      null,
      new Map(),
      "it",
      "#e8c06a",
      true,
      transitNetwork,
    );
    const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    expect(script).toBeTruthy();
    expect(() => new Function(script!)).not.toThrow();
    expect(script).toContain("return aRelevant&&bRelevant");
    expect(html).toContain("overflow-wrap:anywhere");
  });

  it("genera JavaScript valido per la mappa alloggi ritagliata", () => {
    const html = buildNeighborhoodHtml([], [], "lisbona", "it", true, transitNetwork);
    const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    expect(script).toBeTruthy();
    expect(() => new Function(script!)).not.toThrow();
    expect(script).toContain("return ar&&br");
    expect(script!.indexOf("const LANDMARKS=")).toBeLessThan(script!.indexOf("function lodgingTransitFocus"));
    expect(html).toContain("overflow-wrap:anywhere");
  });

  it.each([
    ["Expo Go", buildHtml],
    ["web", buildWebHtml],
  ])("mostra l'alloggio come livello filtrabile nella mappa itinerario su %s", (_platform, createHtml) => {
    const accommodation = {
      city: "lisbona",
      name: "Casa Alfama",
      address: "Rua da Saudade 1",
      latitude: 38.711,
      longitude: -9.13,
      updatedAt: "2026-08-31T10:00:00.000Z",
    };
    const html = createHtml(
      { day: 1, stops: [], restaurants: [], maps_link: "" } as any,
      "lisbona",
      [],
      [],
      null,
      new Map(),
      "it",
      "#e8c06a",
      true,
      null,
      accommodation,
    );

    expect(html).toContain('"Casa Alfama"');
    expect(html).toContain("var accommodationLayer = null");
    expect(html).toContain("level:5");
    expect(() => new Function(html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? "")).not.toThrow();
  });

  it("mostra e permette di nascondere l'alloggio nella mappa delle zone", () => {
    const html = buildNeighborhoodHtml(
      [],
      [],
      "lisbona",
      "it",
      true,
      null,
      "lodging-test",
      {
        city: "lisbona",
        address: "Rua da Saudade 1",
        latitude: 38.711,
        longitude: -9.13,
        updatedAt: "2026-08-31T10:00:00.000Z",
      },
    );

    expect(html).toContain("const ACCOMMODATION=");
    expect(html).toContain("accommodation-toggle");
    expect(html).toContain("Rua da Saudade 1");
    expect(() => new Function(html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? "")).not.toThrow();
  });

  it.each([
    ["Expo Go", buildHtml],
    ["web", buildWebHtml],
  ])("permette di salvare e rimuovere ristoranti anche dalla mappa itinerario su %s", (_platform, createHtml) => {
    const html = createHtml(
      {
        day: 1,
        stops: [],
        restaurants: [{ id: 22, name: "Scelto", latitude: 38.71, longitude: -9.14, meal_type: "meal" }],
        maps_link: "",
      } as any,
      "lisbona",
      [],
      [{ id: 11, name: "Da scegliere", latitude: 38.72, longitude: -9.15 }] as any,
      null,
      new Map(),
      "it",
      "#e8c06a",
      true,
      null,
    );

    expect(html).toContain("const FOOD_MODE    = false");
    expect(html).toContain("selectFoodButton(f.id)+");
    expect(html).toContain("removeFoodButton(f.id)+");
    expect(html).not.toContain("FOOD_MODE ? selectFoodButton(f.id)");
    expect(html).not.toContain("FOOD_MODE ? removeFoodButton(f.id)");
  });
});
