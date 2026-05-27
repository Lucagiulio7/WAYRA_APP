import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  LayoutAnimation,
  Modal,
  PanResponder,
  PanResponderGestureState,
  Platform,
  Dimensions,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAttractions, BuilderAttraction } from "@/hooks/useAttractions";
import { useFoodSpots } from "@/hooks/useFoodSpots";
import { useCityExtras } from "@/hooks/useCityExtras";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { BuilderMap, MapSlot } from "@/components/BuilderMap";
import { useBuilderStore } from "@/store/builderStore";
import { SkeletonList } from "@/components/Skeleton";

// ── Costanti visive ───────────────────────────────────────────────────────────

const ATTRACTION_EMOJI: Record<string, string> = {
  museo: "🏛️", chiesa: "⛪", parco: "🌿", piazza: "🏟️",
  archeologia: "⚱️", monumento: "🗿", quartiere: "🏘️",
  panorama: "🌅", mercato: "🛒", palazzo: "🏰",
};

const ATTRACTION_TYPE_EN: Record<string, string> = {
  museo: "Museum", chiesa: "Church", parco: "Park", piazza: "Square",
  archeologia: "Archaeology", monumento: "Monument", quartiere: "District",
  panorama: "Viewpoint", mercato: "Market", palazzo: "Palace",
  viale: "Avenue", strada: "Street", ponte: "Bridge", teatro: "Theatre",
  fontana: "Fountain", giardino: "Garden", castello: "Castle",
  basilica: "Basilica", attrazione: "Attraction",
  ristorante: "Restaurant", pizzeria: "Pizzeria", bar: "Bar",
  gelateria: "Gelateria", osteria: "Inn", trattoria: "Trattoria",
  friggitoria: "Fried food", "street food": "Street food",
};

const FOOD_EMOJI: Record<string, string> = {
  ristorante: "🍽️", trattoria: "🍝", osteria: "🫕", pizzeria: "🍕",
  gelateria: "🍦", "street food": "🥪", bar: "☕", friggitoria: "🍟",
};

const LEVEL_COLORS: Record<number, string> = {
  1: "#e8c06a", 2: "#7eb8f7", 3: "#a78bfa",
};

const MANUAL_GUIDE_KEY = "wayra_manual_guide_v1";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const MANUAL_GUIDE_SLIDES_IT = [
  {
    icon: "🧭",
    target: "header",
    title: "Barra superiore",
    body: "In alto vedi la città, il numero di giorni e le tappe già inserite. Il libro riapre questa guida, la bandiera cambia lingua e Vedi apre il riepilogo quando hai aggiunto almeno una tappa.",
  },
  {
    icon: "📌",
    target: "tabs",
    title: "Tab di lavoro",
    body: "Attrazioni mostra i luoghi da visitare, Pasti mostra ristoranti e locali, Piano mostra solo il riepilogo dei giorni. I numeri indicano quanti elementi sono ancora disponibili o già inseriti.",
  },
  {
    icon: "🔎",
    target: "search",
    title: "Ricerca e filtro",
    body: "La barra Cerca restringe la lista in tempo reale. Il pulsante con gli slider apre i filtri per categoria, utile quando vuoi vedere solo musei, piazze, monumenti o tipi specifici di cibo.",
  },
  {
    icon: "📅",
    target: "plan",
    title: "Pannello giorni",
    body: "La sezione a sinistra contiene i giorni dell'itinerario. Apri un giorno per vedere gli slot: quelli con il monumento sono per le attrazioni, quelli con il piatto sono per i pasti.",
  },
  {
    icon: "🚦",
    target: "plan",
    title: "Metriche del giorno",
    body: "Sotto ogni giorno trovi tempo totale, distanza a piedi e musei. Verde significa che sei nei limiti consigliati; rosso segnala che stai superando il limite e l'app chiederà conferma.",
  },
  {
    icon: "👆",
    target: "list",
    title: "Lista a destra",
    body: "La lista a destra è il database disponibile. Trascina una scheda nello slot corretto per inserirla; premi una scheda senza trascinarla per aprire descrizione, Maps e biglietti se presenti.",
  },
  {
    icon: "🧹",
    target: "plan",
    title: "Azioni sugli slot",
    body: "Il cestino rosso elimina uno slot o una tappa. I pulsanti in fondo al giorno aggiungono un nuovo slot attrazione o pasto. Il pulsante ottimizza riordina le tappe del giorno.",
  },
  {
    icon: "🗺️",
    target: "view",
    title: "Riepilogo finale",
    body: "Quando il piano ti convince, premi Vedi. Si apre la schermata itinerario con le giornate organizzate e i link Google Maps costruiti usando i nomi delle tappe e la città.",
  },
];

const MANUAL_GUIDE_SLIDES_EN = [
  {
    icon: "🧭",
    target: "header",
    title: "Top bar",
    body: "At the top you see the city, number of days and inserted stops. The book reopens this guide, the flag changes language and View opens the summary once you have added at least one stop.",
  },
  {
    icon: "📌",
    target: "tabs",
    title: "Work tabs",
    body: "Places shows visitable locations, Food shows restaurants and local spots, Plan shows only the day summary. The numbers show how many items are still available or already inserted.",
  },
  {
    icon: "🔎",
    target: "search",
    title: "Search and filter",
    body: "The Search bar narrows the list in real time. The slider button opens category filters, useful when you only want museums, squares, monuments or specific food types.",
  },
  {
    icon: "📅",
    target: "plan",
    title: "Day panel",
    body: "The left section contains the itinerary days. Open a day to see its slots: monument slots are for attractions, plate slots are for meals.",
  },
  {
    icon: "🚦",
    target: "plan",
    title: "Day metrics",
    body: "Under each day you see total time, walking distance and museum count. Green means you are within the suggested limits; red means you are exceeding a limit and the app will ask for confirmation.",
  },
  {
    icon: "👆",
    target: "list",
    title: "Right list",
    body: "The right list is the available database. Drag a card into the correct slot to insert it; tap a card without dragging to open description, Maps and tickets when available.",
  },
  {
    icon: "🧹",
    target: "plan",
    title: "Slot actions",
    body: "The red trash button removes a slot or stop. The buttons at the bottom of a day add a new attraction or meal slot. The optimize button reorders the day stops.",
  },
  {
    icon: "🗺️",
    target: "view",
    title: "Final summary",
    body: "When the plan feels right, tap View. The itinerary screen opens with organized day cards and Google Maps links built from the stop names and the city.",
  },
];

function getEmoji(type?: string | null, isFood = false): string {
  const key = (type ?? "").toLowerCase();
  if (isFood) return FOOD_EMOJI[key] ?? "🍴";
  return ATTRACTION_EMOJI[key] ?? "📍";
}

function translateType(type?: string | null, lang = "it"): string | null {
  if (!type) return null;
  const key = type.toLowerCase();
  if (lang === "en") return ATTRACTION_TYPE_EN[key] ?? (type.charAt(0).toUpperCase() + type.slice(1));
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function priceLabel(level: number): string {
  if (level === 1) return "€";
  if (level === 2) return "€€";
  return "€€€";
}

// ── Geo ───────────────────────────────────────────────────────────────────────

function mapsWaypoint(stop: BuilderAttraction, _city: string): string {
  // Use coordinates — unambiguous and language-independent
  return encodeURIComponent(`${stop.latitude},${stop.longitude}`);
}

function mapsSearchUrl(stop: BuilderAttraction, _city: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`;
}

function isMuseum(stop: BuilderAttraction): boolean {
  return (stop.attraction_type ?? "").toLowerCase() === "museo";
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const f1 = (lat1 * Math.PI) / 180;
  const f2 = (lat2 * Math.PI) / 180;
  const df = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// ── Ottimizzazione percorso ───────────────────────────────────────────────────

type GeoRef = { latitude: number; longitude: number };

function walkingKm(a: GeoRef, b: GeoRef): number {
  const straightKm = haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
  return straightKm * walkingDistanceFactor(straightKm);
}

function walkingDistanceFactor(straightKm: number): number {
  if (straightKm > 2) return 1.1;
  if (straightKm > 1) return 1.15;
  if (straightKm > 0.5) return 1.3;
  if (straightKm > 0.3) return 1.4;
  return 1.5;
}

function routeWalkingKm(stops: GeoRef[]): number {
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    total += walkingKm(stops[i], stops[i + 1]);
  }
  return total;
}

function optimizeSegment(attrSlots: SlotData[], startRef: GeoRef | null, endRef: GeoRef | null): SlotData[] {
  if (attrSlots.length < 2) return attrSlots;
  const segCost = (route: SlotData[]): number => {
    let cost = 0;
    for (let i = 0; i < route.length - 1; i++) {
      cost += walkingKm(route[i].attraction!, route[i + 1].attraction!);
    }
    if (startRef) cost += walkingKm(startRef, route[0].attraction!);
    if (endRef) cost += walkingKm(route[route.length - 1].attraction!, endRef);
    return cost;
  };
  let best = [...attrSlots];
  let bestCost = segCost(best);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const candidate = [...best.slice(0, i), ...best.slice(i, j + 1).reverse(), ...best.slice(j + 1)];
        const c = segCost(candidate);
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

// ── Tipi ─────────────────────────────────────────────────────────────────────

type SlotKind = "attraction" | "meal";
type SlotData = { id: string; kind: SlotKind; attraction: BuilderAttraction | null; note?: string };
type DayPlan = { day: number; slots: SlotData[] };
type ActiveTab = "attractions" | "food" | "piano";
type DayStats = { minutes: number; distanceKm: number; museums: number; attractions: number; filled: number };
type PlacementCheck = { blocked?: string; warning?: string };
type DockDetail = { dayIdx: number; slot: SlotData } | null;
type AttractionDetail = { item: BuilderAttraction; kind: SlotKind } | null;
type SlotTarget = { dayIdx: number; slotId: string; kind: SlotKind; ref: View | null };
type DragState = { item: BuilderAttraction; kind: SlotKind } | null;
type GuideStep = { icon: string; title: string; body: string; target: string };
type GuideRect = { x: number; y: number; width: number; height: number };

let _slotCounter = 0;
function makeSlot(kind: SlotKind = "attraction"): SlotData {
  return { id: `slot_${++_slotCounter}`, kind, attraction: null };
}

const EMPTY_STATS: DayStats = { minutes: 0, distanceKm: 0, museums: 0, attractions: 0, filled: 0 };

function getDayStats(day: DayPlan | undefined): DayStats {
  if (!day) return EMPTY_STATS;
  const filledSlots = day.slots.filter((s) => s.attraction !== null);
  const attractionSlots = filledSlots.filter((s) => s.kind === "attraction");
  const route = filledSlots.map((s) => s.attraction!);
  return {
    minutes: attractionSlots.reduce((sum, s) => sum + (s.attraction?.estimated_visit_time ?? 0), 0),
    distanceKm: routeWalkingKm(route),
    museums: attractionSlots.filter((s) => (s.attraction?.attraction_type ?? "").toLowerCase() === "museo").length,
    attractions: attractionSlots.length,
    filled: filledSlots.length,
  };
}

function dayDistanceWith(day: DayPlan | undefined, slotId: string, attraction: BuilderAttraction): number {
  if (!day) return 0;
  const nextSlots = day.slots.map((s) => s.id === slotId ? { ...s, attraction } : s);
  return getDayStats({ ...day, slots: nextSlots }).distanceKm;
}

// ── Schermata principale ──────────────────────────────────────────────────────

export default function CreateItineraryScreen() {
  const router = useRouter();
  const { city = "roma", numDays: ndStr = "3", cityLabel = "" } =
    useLocalSearchParams<{ city: string; numDays: string; cityLabel: string }>();
  const numDays = Math.max(1, parseInt(ndStr, 10) || 3);
  const { lang, toggle } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { attractions, loading, error } = useAttractions(city);
  const { foodSpots, loading: foodLoading } = useFoodSpots(city);
  const { foods, cultureFacts } = useCityExtras(city);

  // ── Zustand builder store ─────────────────────────────────────────────────
  const {
    days,
    expandedDay,
    setExpandedDay,
    dropAttraction,
    removeAttraction,
    deleteSlot: storeDeleteSlot,
    addSlot: storeAddSlot,
    setNote: storeSetNote,
    optimizeDay: storeOptimizeDay,
    addFilledSlot,
    mapAddFood: storeMapAddFood,
    mapReorderSlots,
    init: initBuilder,
  } = useBuilderStore();

  // Inizializza il builder (o lo resetta) ogni volta che cambia numDays
  useEffect(() => {
    initBuilder(numDays);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numDays]);

  // ── State UI (locale) ─────────────────────────────────────────────────────
  const [selected, setSelected] = useState<BuilderAttraction | null>(null);
  const [selectedKind, setSelectedKind] = useState<SlotKind>("attraction");
  const [activeTab, setActiveTab] = useState<ActiveTab>("attractions");
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [dockDetail, setDockDetail] = useState<DockDetail>(null);
  const [attractionDetail, setAttractionDetail] = useState<AttractionDetail>(null);
  const [search, setSearch] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [dragging, setDragging] = useState<DragState>(null);
  const [mapVisible, setMapVisible] = useState(false);

  const pianoScrollRef = useRef<ScrollView>(null);
  const dayOffsets = useRef<Map<number, number>>(new Map());
  const slotTargets = useRef<Map<string, SlotTarget>>(new Map());
  const draggingRef = useRef<DragState>(null);
  const guideTargets = useRef<Map<string, View>>(new Map());
  const dragPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // ── Derivati ──────────────────────────────────────────────────────────────

  const placedAttractionIds = useMemo(() => {
    const s = new Set<number>();
    days.forEach((d) => d.slots.forEach((sl) => { if (sl.attraction && sl.kind === "attraction") s.add(sl.attraction.id); }));
    return s;
  }, [days]);

  const placedFoodIds = useMemo(() => {
    const s = new Set<number>();
    days.forEach((d) => d.slots.forEach((sl) => { if (sl.attraction && sl.kind === "meal") s.add(sl.attraction.id); }));
    return s;
  }, [days]);

  const lastInExpanded = useMemo(() => {
    const d = days.find((d) => d.day === expandedDay);
    return d?.slots.slice().reverse().find((s) => s.attraction !== null)?.attraction ?? null;
  }, [days, expandedDay]);

  const distanceMap = useMemo(() => {
    const map = new Map<number, number>();
    if (!lastInExpanded) return map;
    [...attractions, ...foodSpots].forEach((a) => {
      map.set(a.id, walkingKm(lastInExpanded, a));
    });
    return map;
  }, [attractions, foodSpots, lastInExpanded]);

  const attractionCategories = useMemo(() =>
    [...new Set(attractions.map((a) => a.attraction_type).filter(Boolean) as string[])].sort(),
  [attractions]);

  const foodCategories = useMemo(() =>
    [...new Set(foodSpots.map((a) => a.attraction_type).filter(Boolean) as string[])].sort(),
  [foodSpots]);

  const available = useMemo(() => {
    let list = attractions.filter((a) => !placedAttractionIds.has(a.id));
    if (search.trim()) list = list.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()) || (a.name_en ?? "").toLowerCase().includes(search.toLowerCase()));
    if (activeCategories.length > 0) list = list.filter((a) => a.attraction_type && activeCategories.includes(a.attraction_type));
    if (distanceMap.size === 0) return list;
    return [...list].sort((a, b) => (distanceMap.get(a.id) ?? 9999) - (distanceMap.get(b.id) ?? 9999));
  }, [attractions, placedAttractionIds, distanceMap, search, activeCategories]);

  const availableFood = useMemo(() => {
    let list = foodSpots.filter((a) => !placedFoodIds.has(a.id));
    if (search.trim()) list = list.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()) || (a.name_en ?? "").toLowerCase().includes(search.toLowerCase()));
    if (activeCategories.length > 0) list = list.filter((a) => a.attraction_type && activeCategories.includes(a.attraction_type));
    if (distanceMap.size === 0) return list;
    return [...list].sort((a, b) => (distanceMap.get(a.id) ?? 9999) - (distanceMap.get(b.id) ?? 9999));
  }, [foodSpots, placedFoodIds, distanceMap, search, activeCategories]);

  const totalPlaced = useMemo(() => {
    let n = 0;
    days.forEach((d) => d.slots.forEach((s) => { if (s.attraction) n++; }));
    return n;
  }, [days]);

  const activeDayIndex = useMemo(() =>
    Math.max(0, days.findIndex((d) => d.day === expandedDay)),
  [days, expandedDay]);

  const activeDay: DayPlan | undefined = days[activeDayIndex] ?? days[0];
  const activeDayStats = useMemo(() => getDayStats(activeDay), [activeDay]);

  // ── Dati per BuilderMap ────────────────────────────────────────────────────

  const currentMapSlots = useMemo((): MapSlot[] =>
    (activeDay?.slots ?? [])
      .filter((s) => s.attraction !== null)
      .map((s) => ({ slotId: s.id, kind: s.kind, attraction: s.attraction! })),
  [activeDay]);

  // Mostra sulla mappa solo attrazioni non piazzate in altri giorni + quelle già nel giorno corrente
  const mapAttractions = useMemo(() => {
    const currentIds = new Set(activeDay?.slots.filter((s) => s.kind === "attraction" && s.attraction).map((s) => s.attraction!.id) ?? []);
    return attractions.filter((a) => !placedAttractionIds.has(a.id) || currentIds.has(a.id));
  }, [attractions, placedAttractionIds, activeDay]);

  const mapFoodSpots = useMemo(() => {
    const currentIds = new Set(activeDay?.slots.filter((s) => s.kind === "meal" && s.attraction).map((s) => s.attraction!.id) ?? []);
    return foodSpots.filter((f) => !placedFoodIds.has(f.id) || currentIds.has(f.id));
  }, [foodSpots, placedFoodIds, activeDay]);

  useEffect(() => {
    AsyncStorage.getItem(MANUAL_GUIDE_KEY)
      .then((val) => { if (!val) setShowGuide(true); })
      .catch((e) => { if (__DEV__) console.warn("[create-itinerary] AsyncStorage read failed:", e); });
  }, []);

  // ── Azioni ────────────────────────────────────────────────────────────────

  const showMessage = useCallback((title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  }, []);

  const confirmAction = useCallback((title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === "web") {
      if (window.confirm(`${title}\n${message}`)) onConfirm();
      return;
    }
    Alert.alert(title, message, [
      { text: lang === "en" ? "Cancel" : "Annulla", style: "cancel" },
      { text: lang === "en" ? "Continue" : "Continua", style: "default", onPress: onConfirm },
    ]);
  }, [lang]);

  const dismissGuide = useCallback(async () => {
    await AsyncStorage.setItem(MANUAL_GUIDE_KEY, "done");
    setShowGuide(false);
  }, []);

  const setGuideTarget = useCallback((key: string, ref: View | null) => {
    if (ref) guideTargets.current.set(key, ref);
    else guideTargets.current.delete(key);
  }, []);

  const validatePlacement = useCallback((day: DayPlan, slot: SlotData, item: BuilderAttraction, kind: SlotKind): PlacementCheck => {
    if (slot.attraction) {
      return { blocked: lang === "en" ? "This slot is already occupied." : "Questo slot e gia occupato." };
    }
    if (slot.kind !== kind) {
      return {
        blocked: kind === "meal"
          ? (lang === "en" ? "Select a meal slot." : "Seleziona uno slot pasto.")
          : (lang === "en" ? "Select an attraction slot." : "Seleziona uno slot attrazione."),
      };
    }
    const warnings: string[] = [];
    const itemIsMuseum = (item.attraction_type ?? "").toLowerCase() === "museo";
    const alreadyHasMuseum = day.slots.some(
      (s) => s.kind === "attraction" && (s.attraction?.attraction_type ?? "").toLowerCase() === "museo",
    );
    if (kind === "attraction" && itemIsMuseum && alreadyHasMuseum) {
      warnings.push(lang === "en"
        ? "This day already has one museum."
        : "Questo giorno ha gia un museo.");
    }

    const distanceKm = dayDistanceWith(day, slot.id, item);
    if (distanceKm > 4) {
      warnings.push(lang === "en"
        ? `This would bring the day to ${distanceKm.toFixed(1)} km on foot.`
        : `Questa scelta porterebbe il giorno a ${distanceKm.toFixed(1)} km a piedi.`);
    }

    if (warnings.length > 0) {
      return {
        warning: `${warnings.join("\n")}\n${lang === "en" ? "Do you want to add it anyway?" : "Vuoi inserirla comunque?"}`,
      };
    }

    return {};
  }, [lang]);

  const commitPlacement = useCallback((dayIdx: number, slotId: string, item: BuilderAttraction) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    dropAttraction(dayIdx, slotId, item);
    setSelected(null);
    setActiveSlotId(null);
  }, [dropAttraction]);

  const placeItemInSlot = useCallback((dayIdx: number, slotId: string, item: BuilderAttraction, kind: SlotKind): boolean => {
    const day = days[dayIdx];
    const slot = day?.slots.find((s) => s.id === slotId);
    if (!day || !slot) return false;

    const validation = validatePlacement(day, slot, item, kind);
    if (validation.blocked) {
      showMessage(
        lang === "en" ? "Cannot add here" : "Non posso inserirla qui",
        validation.blocked,
      );
      return false;
    }
    if (validation.warning) {
      confirmAction(
        lang === "en" ? "Confirm addition" : "Conferma inserimento",
        validation.warning,
        () => commitPlacement(dayIdx, slotId, item),
      );
      return true;
    }

    commitPlacement(dayIdx, slotId, item);
    return true;
  }, [commitPlacement, confirmAction, days, lang, showMessage, validatePlacement]);

  const placeItemFromList = useCallback((item: BuilderAttraction, kind: SlotKind) => {
    const dayIdx = activeDayIndex;
    const day = days[dayIdx];
    if (!day) return;

    const preferred = activeSlotId ? day.slots.find((s) => s.id === activeSlotId) : null;
    const target = preferred?.kind === kind && !preferred.attraction
      ? preferred
      : day.slots.find((s) => s.kind === kind && !s.attraction);

    if (target) {
      placeItemInSlot(dayIdx, target.id, item, kind);
      return;
    }

    const newSlot = makeSlot(kind);
    const validation = validatePlacement(day, newSlot, item, kind);
    if (validation.blocked) {
      showMessage(
        lang === "en" ? "Cannot add here" : "Non posso inserirla qui",
        validation.blocked,
      );
      return;
    }

    const commitNewSlot = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      addFilledSlot(dayIdx, kind, item);
      setSelected(null);
      setActiveSlotId(null);
    };

    if (validation.warning) {
      confirmAction(
        lang === "en" ? "Confirm addition" : "Conferma inserimento",
        validation.warning,
        commitNewSlot,
      );
      return;
    }

    commitNewSlot();
  }, [activeDayIndex, activeSlotId, confirmAction, days, lang, placeItemInSlot, showMessage, validatePlacement]);

  const handleSelectAttraction = useCallback((a: BuilderAttraction, kind: SlotKind) => {
    setAttractionDetail({ item: a, kind });
  }, []);

  const handleAddFromDetail = useCallback(() => {
    if (!attractionDetail) return;
    placeItemFromList(attractionDetail.item, attractionDetail.kind);
    setAttractionDetail(null);
  }, [attractionDetail, placeItemFromList]);

  const handleSwitchTab = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab !== "attractions" && tab !== "food") return;
    setSearch("");
    setActiveCategories([]);
    setShowFilterModal(false);
    if (tab !== activeTab) setSelected(null);
  }, [activeTab]);

  const handleTapSlot = useCallback((dayIdx: number, slot: SlotData) => {
    if (slot.attraction !== null) {
      setDockDetail({ dayIdx, slot });
      return;
    }
    if (!selected) return;
    if (slot.kind !== selectedKind) return;
    placeItemInSlot(dayIdx, slot.id, selected, selectedKind);
  }, [placeItemInSlot, selected, selectedKind]);

  const handleSlotRef = useCallback((dayIdx: number, slot: SlotData, ref: View | null) => {
    if (ref) {
      slotTargets.current.set(slot.id, { dayIdx, slotId: slot.id, kind: slot.kind, ref });
    } else {
      slotTargets.current.delete(slot.id);
    }
  }, []);

  const handleDragStart = useCallback((item: BuilderAttraction, kind: SlotKind, x: number, y: number) => {
    setSelected(item);
    setSelectedKind(kind);
    dragPosition.setValue({ x, y });
    const next = { item, kind };
    draggingRef.current = next;
    setDragging(next);
  }, [dragPosition]);

  const handleCancelSelection = useCallback(() => {
    setSelected(null);
  }, []);

  const openExternalLink = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      showMessage(
        lang === "en" ? "Cannot open link" : "Impossibile aprire il link",
        lang === "en" ? "Try again later." : "Riprova più tardi.",
      );
    }
  }, [lang, showMessage]);

  const handleDragMove = useCallback((x: number, y: number) => {
    dragPosition.setValue({ x, y });
  }, [dragPosition]);

  const handleDragEnd = useCallback((x: number, y: number) => {
    const current = draggingRef.current;
    draggingRef.current = null;
    setDragging(null);
    if (!current) {
      setSelected(null);
      return;
    }

    const targets = [...slotTargets.current.values()].filter((target) => target.kind === current.kind && target.ref);
    if (targets.length === 0) {
      setSelected(null);
      return;
    }

    let pending = targets.length;
    let match: SlotTarget | null = null;
    targets.forEach((target) => {
      target.ref?.measureInWindow((slotX, slotY, width, height) => {
        if (!match && x >= slotX && x <= slotX + width && y >= slotY && y <= slotY + height) {
          match = target;
        }
        pending -= 1;
        if (pending === 0) {
          if (match) {
            placeItemInSlot(match.dayIdx, match.slotId, current.item, current.kind);
          } else {
            setSelected(null);
          }
        }
      });
    });
  }, [placeItemInSlot]);

  const handleRemove = useCallback((dayIdx: number, slotId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    removeAttraction(dayIdx, slotId);
  }, [removeAttraction]);

  const handleDeleteSlot = useCallback((dayIdx: number, slotId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    storeDeleteSlot(dayIdx, slotId);
  }, [storeDeleteSlot]);

  const handleAddSlot = useCallback((dayIdx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    storeAddSlot(dayIdx, "attraction");
  }, [storeAddSlot]);

  const handleAddMealSlot = useCallback((dayIdx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    storeAddSlot(dayIdx, "meal");
  }, [storeAddSlot]);

  const handleDockSlotPress = useCallback((slot: SlotData) => {
    if (slot.attraction) {
      setDockDetail({ dayIdx: activeDayIndex, slot });
      return;
    }
    if (selected && selectedKind === slot.kind) {
      placeItemInSlot(activeDayIndex, slot.id, selected, selectedKind);
      return;
    }
    setActiveSlotId((current) => current === slot.id ? null : slot.id);
  }, [activeDayIndex, placeItemInSlot, selected, selectedKind]);

  const handleDockDayChange = useCallback((direction: -1 | 1) => {
    const current = activeDayIndex >= 0 ? activeDayIndex : 0;
    const next = Math.min(days.length - 1, Math.max(0, current + direction));
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDay(days[next]?.day ?? 1);
    setActiveSlotId(null);
  }, [activeDayIndex, days]);

  const handleRemoveDockDetail = useCallback(() => {
    if (!dockDetail) return;
    handleRemove(dockDetail.dayIdx, dockDetail.slot.id);
    setDockDetail(null);
  }, [dockDetail, handleRemove]);

  const handleSetNote = useCallback((dayIdx: number, slotId: string, note: string) => {
    storeSetNote(dayIdx, slotId, note);
  }, [storeSetNote]);

  const handleToggleDay = useCallback((day: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = expandedDay === day ? 0 : day;
    setExpandedDay(next);
    if (next !== 0) {
      setTimeout(() => {
        const offset = dayOffsets.current.get(next);
        if (offset !== undefined) pianoScrollRef.current?.scrollTo({ y: offset, animated: true });
      }, 120);
    }
  }, [expandedDay, setExpandedDay]);

  const handleOptimizeDay = useCallback((dayIdx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    storeOptimizeDay(dayIdx);
  }, [storeOptimizeDay]);

  // ── Handler BuilderMap ────────────────────────────────────────────────────

  const handleMapAddAttraction = useCallback((a: BuilderAttraction) => {
    placeItemFromList(a, "attraction");
  }, [placeItemFromList]);

  const handleMapAddFood = useCallback((f: BuilderAttraction, afterSlotId: string | null) => {
    storeMapAddFood(activeDayIndex, f, afterSlotId);
  }, [activeDayIndex, storeMapAddFood]);

  const handleMapRemove = useCallback((slotId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    removeAttraction(activeDayIndex, slotId);
  }, [activeDayIndex, removeAttraction]);

  const handleMapReorder = useCallback((newSlotIds: string[]) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    mapReorderSlots(activeDayIndex, newSlotIds);
  }, [activeDayIndex, mapReorderSlots]);

  const handleView = async () => {
    if (totalPlaced === 0) {
      if (Platform.OS === "web") {
        window.alert(lang === "en" ? "Add at least one attraction to view the itinerary." : "Aggiungi almeno un'attrazione per visualizzare l'itinerario.");
      } else {
        Alert.alert(
          lang === "en" ? "No attractions" : "Nessuna attrazione",
          lang === "en" ? "Add at least one attraction to view the itinerary." : "Aggiungi almeno un'attrazione per visualizzare l'itinerario.",
        );
      }
      return;
    }
    const itineraryDays = days
      .map((d) => {
        const stops = d.slots
          .filter((s) => s.attraction !== null)
          .map((s) => ({
            ...s.attraction!,
            type: s.kind === "meal" ? ("food" as const) : ("attraction" as const),
            tags: s.attraction!.tags ?? [],
            is_food_spot: s.kind === "meal",
          }));
        const mapsLink = stops.length >= 2
          ? "https://www.google.com/maps/dir/" + stops.map((s) => mapsWaypoint(s, city)).join("/") + "?travelmode=walking"
          : "";
        return { day: d.day, stops, maps_link: mapsLink, restaurants: [] };
      })

    const itinerary = {
      city, num_days: days.length, level: 1,
      days: itineraryDays, food_recommendations: foods, culture_facts: cultureFacts,
    };
    await AsyncStorage.setItem("wayra_pending_itinerary", JSON.stringify(itinerary));
    router.push({ pathname: "/itinerary" });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  // Guard: mostra loading finché il builder store non ha inizializzato i giorni
  if (days.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]} edges={["top", "bottom"]}>
        <ActivityIndicator color={colors.accentGold} size="large" />
      </SafeAreaView>
    );
  }

  const currentCategories = activeTab === "food" ? foodCategories : attractionCategories;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>

      {/* ── Header ── */}
      <View
        ref={(ref) => setGuideTarget("header", ref)}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.accentGold} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {cityLabel || city.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </Text>
          <Text style={styles.headerSub}>
            {numDays} {numDays === 1 ? (lang === "en" ? "day" : "giorno") : (lang === "en" ? "days" : "giorni")}
            {totalPlaced > 0 ? ` · ${totalPlaced} ${lang === "en" ? "placed" : "inserite"}` : ""}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowGuide(true)}
          activeOpacity={0.7}
          style={[styles.flagBtn, styles.guideBtn]}
          accessibilityLabel={lang === "en" ? "Open guide" : "Apri guida"}
        >
          <Ionicons name="help-circle-outline" size={22} color={colors.accentGold} />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggle} activeOpacity={0.7} style={styles.flagBtn}>
          <Text style={styles.flagEmoji}>{lang === "it" ? "🇮🇹" : "🇬🇧"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          ref={(ref) => setGuideTarget("view", ref)}
          style={[styles.viewBtn, totalPlaced === 0 && styles.viewBtnDisabled]}
          onPress={handleView}
          activeOpacity={0.8}
          disabled={totalPlaced === 0}
        >
          <Ionicons name="eye-outline" size={15} color={totalPlaced > 0 ? colors.bg : colors.textMuted} />
          <Text style={[styles.viewBtnText, totalPlaced === 0 && { color: colors.textMuted }]}>
            {lang === "en" ? "View" : "Vedi"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Tab bar ── */}
      <View ref={(ref) => setGuideTarget("tabs", ref)} style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "attractions" && styles.tabActive]}
          onPress={() => handleSwitchTab("attractions")}
          activeOpacity={0.8}
        >
          <Text style={styles.tabEmoji}>📍</Text>
          <Text style={[styles.tabLabel, activeTab === "attractions" && styles.tabLabelActive]}>
            {lang === "en" ? "Places" : "Attrazioni"}
          </Text>
          {available.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{available.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "food" && styles.tabActiveFood]}
          onPress={() => handleSwitchTab("food")}
          activeOpacity={0.8}
        >
          <Text style={styles.tabEmoji}>🍽️</Text>
          <Text style={[styles.tabLabel, activeTab === "food" && styles.tabLabelActiveFood]}>
            {lang === "en" ? "Food" : "Pasti"}
          </Text>
          {availableFood.length > 0 && (
            <View style={[styles.tabBadge, styles.tabBadgeFood]}>
              <Text style={styles.tabBadgeText}>{availableFood.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "piano" && styles.tabActivePiano]}
          onPress={() => setActiveTab("piano")}
          activeOpacity={0.8}
        >
          <Text style={styles.tabEmoji}>📅</Text>
          <Text style={[styles.tabLabel, activeTab === "piano" && styles.tabLabelActivePiano]}>
            {lang === "en" ? "Plan" : "Piano"}
          </Text>
          {totalPlaced > 0 && (
            <View style={[styles.tabBadge, styles.tabBadgePiano]}>
              <Text style={styles.tabBadgeText}>{totalPlaced}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Contenuto tab ── */}
      <View style={styles.tabContent}>

        {/* ── TAB ATTRAZIONI ── */}
        {(activeTab === "attractions" || activeTab === "food") && (
          <>
            {/* Barra ricerca + filtro */}
            <View ref={(ref) => setGuideTarget("search", ref)} style={styles.searchRow}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={15} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={(v) => { setSearch(v); setActiveCategories([]); }}
                  placeholder={lang === "en" ? "Search..." : "Cerca..."}
                  placeholderTextColor={colors.textMuted}
                  selectionColor={colors.accentGold}
                  returnKeyType="search"
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[styles.filterBtn, activeCategories.length > 0 && styles.filterBtnActive]}
                onPress={() => setShowFilterModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="options-outline" size={16} color={activeCategories.length > 0 ? colors.accentGold : colors.textMuted} />
                {activeCategories.length > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeCategories.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mapToggleBtn}
                onPress={() => setMapVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="map-outline" size={16} color={colors.accentGold} />
              </TouchableOpacity>
            </View>

            {/* Contatore */}
            {activeTab === "attractions" && attractions.length > 0 && (
              <Text style={styles.totalCount}>
                {available.length < attractions.length ? `${available.length} / ${attractions.length}` : `${attractions.length}`}
                {" "}{lang === "en" ? "places available" : "attrazioni disponibili"}
              </Text>
            )}
            {activeTab === "food" && foodSpots.length > 0 && (
              <Text style={styles.totalCount}>
                {availableFood.length < foodSpots.length ? `${availableFood.length} / ${foodSpots.length}` : `${foodSpots.length}`}
                {" "}{lang === "en" ? "spots available" : "posti disponibili"}
              </Text>
            )}

            <View style={styles.builderWorkspace}>
              <View ref={(ref) => setGuideTarget("plan", ref)} style={styles.builderPlanPane}>
                <Text style={styles.builderPaneTitle}>
                  {lang === "en" ? "Daily slots" : "Slot giornalieri"}
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.builderPlanScroll}>
                  {days.map((d, dayIdx) => (
                    <DayRow
                      key={d.day}
                      day={d}
                      dayIdx={dayIdx}
                      expanded={expandedDay === d.day}
                      placementMode={selected !== null}
                      placementKind={selectedKind}
                      lang={lang}
                      showAddControls
                      onToggle={() => handleToggleDay(d.day)}
                      onTapSlot={(slot) => handleTapSlot(dayIdx, slot)}
                      onRemove={(slotId) => handleRemove(dayIdx, slotId)}
                      onDeleteSlot={(slotId) => handleDeleteSlot(dayIdx, slotId)}
                      onAddSlot={() => handleAddSlot(dayIdx)}
                      onAddMealSlot={() => handleAddMealSlot(dayIdx)}
                      onSlotRef={(slot, ref) => handleSlotRef(dayIdx, slot, ref)}
                      onSetNote={(slotId, note) => handleSetNote(dayIdx, slotId, note)}
                      onOptimize={() => handleOptimizeDay(dayIdx)}
                    />
                  ))}
                </ScrollView>
              </View>

              <View ref={(ref) => setGuideTarget("list", ref)} style={styles.builderListPane}>
            {/* Lista */}
            {activeTab === "attractions" ? (
              loading ? (
                <SkeletonList count={6} />
              ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : (
                <FlashList
                  data={available}
                  keyExtractor={(a) => String(a.id)}

                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listScroll}
                  renderItem={({ item: a }) => (
                    <AttractionCard
                      attraction={a}
                      isFood={false}
                      selected={selected?.id === a.id}
                      distance={distanceMap.get(a.id)}
                      lang={lang}
                      onPress={() => handleSelectAttraction(a, "attraction")}
                      onDragStart={(x, y) => handleDragStart(a, "attraction", x, y)}
                      onDragMove={handleDragMove}
                      onDragEnd={handleDragEnd}
                    />
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      {search || activeCategories.length > 0
                        ? (lang === "en" ? "No results" : "Nessun risultato")
                        : (lang === "en" ? "All placed! 🎉" : "Tutte inserite! 🎉")}
                    </Text>
                  }
                />
              )
            ) : (
              foodLoading ? (
                <SkeletonList count={5} />
              ) : (
                <FlashList
                  data={availableFood}
                  keyExtractor={(a) => String(a.id)}

                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listScroll}
                  renderItem={({ item: a }) => (
                    <AttractionCard
                      attraction={a}
                      isFood={true}
                      selected={selected?.id === a.id}
                      distance={distanceMap.get(a.id)}
                      lang={lang}
                      onPress={() => handleSelectAttraction(a, "meal")}
                      onDragStart={(x, y) => handleDragStart(a, "meal", x, y)}
                      onDragMove={handleDragMove}
                      onDragEnd={handleDragEnd}
                    />
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      {search || activeCategories.length > 0
                        ? (lang === "en" ? "No results" : "Nessun risultato")
                        : (lang === "en" ? "All placed! 🎉" : "Tutti inseriti! 🎉")}
                    </Text>
                  }
                />
              )
            )}
              </View>
            </View>
          </>
        )}

        {/* ── TAB PIANO ── */}
        {activeTab === "piano" && (
          <ScrollView
            ref={pianoScrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pianoScroll}
          >
            {days.map((d, dayIdx) => (
              <View
                key={d.day}
                onLayout={(e) => { dayOffsets.current.set(d.day, e.nativeEvent.layout.y); }}
              >
                <DayRow
                  day={d}
                  dayIdx={dayIdx}
                  expanded={expandedDay === d.day}
                  placementMode={selected !== null}
                  placementKind={selectedKind}
                  lang={lang}
                  onToggle={() => handleToggleDay(d.day)}
                  onTapSlot={(slot) => handleTapSlot(dayIdx, slot)}
                  onRemove={(slotId) => handleRemove(dayIdx, slotId)}
                  onDeleteSlot={(slotId) => handleDeleteSlot(dayIdx, slotId)}
                  onSlotRef={(slot, ref) => handleSlotRef(dayIdx, slot, ref)}
                  onSetNote={(slotId, note) => handleSetNote(dayIdx, slotId, note)}
                  onOptimize={() => handleOptimizeDay(dayIdx)}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* ── Modal filtro categorie ── */}
      <Modal visible={showFilterModal} transparent animationType="fade" onRequestClose={() => setShowFilterModal(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowFilterModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.filterModal} onPress={() => {}}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>{lang === "en" ? "Filter by type" : "Filtra per tipo"}</Text>
              <TouchableOpacity onPress={() => setActiveCategories([])} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.filterModalReset}>{lang === "en" ? "Reset" : "Azzera"}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.filterModalList}>
              {currentCategories.map((cat) => {
                const checked = activeCategories.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    style={styles.filterModalItem}
                    onPress={() => setActiveCategories((prev) => checked ? prev.filter((c) => c !== cat) : [...prev, cat])}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked && <Ionicons name="checkmark" size={11} color={colors.bg} />}
                    </View>
                    <Text style={[styles.filterModalItemText, checked && styles.filterModalItemTextChecked]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.filterModalDone} onPress={() => setShowFilterModal(false)} activeOpacity={0.8}>
              <Text style={styles.filterModalDoneText}>
                {lang === "en" ? "Apply" : "Applica"}{activeCategories.length > 0 ? ` (${activeCategories.length})` : ""}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Barra selezione attiva ── */}
      <Modal visible={dockDetail !== null} transparent animationType="fade" onRequestClose={() => setDockDetail(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setDockDetail(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.detailModal} onPress={() => {}}>
            {dockDetail?.slot.attraction && (
              <>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailEmoji}>
                    {getEmoji(dockDetail.slot.attraction.attraction_type, dockDetail.slot.kind === "meal")}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailTitle} numberOfLines={2}>
                      {(lang === "en" && dockDetail.slot.attraction.name_en)
                        ? dockDetail.slot.attraction.name_en
                        : dockDetail.slot.attraction.name}
                    </Text>
                    <Text style={styles.detailMeta}>
                      {dockDetail.slot.kind === "meal"
                        ? (lang === "en" ? "Meal slot" : "Slot pasto")
                        : (dockDetail.slot.attraction.attraction_type ?? (lang === "en" ? "Attraction" : "Attrazione"))}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDockDetail(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.detailDescription}>
                  {(lang === "en" && dockDetail.slot.attraction.description_en)
                    ? dockDetail.slot.attraction.description_en
                    : (dockDetail.slot.attraction.description || "")}
                </Text>
                <View style={styles.detailActionsRow}>
                  <TouchableOpacity
                    style={styles.detailMapBtn}
                    onPress={() => openExternalLink(mapsSearchUrl(dockDetail.slot.attraction!, city))}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="map-outline" size={16} color={colors.bg} />
                    <Text style={styles.detailMapText}>Maps</Text>
                  </TouchableOpacity>
                  {isMuseum(dockDetail.slot.attraction) && !!dockDetail.slot.attraction.ticket_url && (
                    <TouchableOpacity
                      style={styles.detailTicketBtn}
                      onPress={() => openExternalLink(dockDetail.slot.attraction!.ticket_url!)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="ticket-outline" size={16} color={colors.text} />
                      <Text style={styles.detailTicketText}>
                        {lang === "en" ? "Tickets" : "Biglietti"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={attractionDetail !== null} transparent animationType="fade" onRequestClose={() => setAttractionDetail(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setAttractionDetail(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.detailModal} onPress={() => {}}>
            {attractionDetail && (
              <>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailEmoji}>
                    {getEmoji(attractionDetail.item.attraction_type, attractionDetail.kind === "meal")}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailTitle} numberOfLines={3}>
                      {(lang === "en" && attractionDetail.item.name_en)
                        ? attractionDetail.item.name_en
                        : attractionDetail.item.name}
                    </Text>
                    <Text style={[styles.detailMeta, attractionDetail.kind === "meal" && styles.detailMetaMeal]}>
                      {attractionDetail.kind === "meal"
                        ? priceLabel(attractionDetail.item.category_level)
                        : (translateType(attractionDetail.item.attraction_type, lang) ?? (lang === "en" ? "Attraction" : "Attrazione"))}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setAttractionDetail(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.detailDescriptionScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.detailDescription}>
                    {(lang === "en" && attractionDetail.item.description_en)
                      ? attractionDetail.item.description_en
                      : (attractionDetail.item.description || (lang === "en" ? "No description available." : "Descrizione non disponibile."))}
                  </Text>
                </ScrollView>
                <TouchableOpacity
                  style={styles.detailAddBtn}
                  onPress={handleAddFromDetail}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={16} color={colors.bg} />
                  <Text style={styles.detailAddText}>
                    {lang === "en"
                      ? `Add to Day ${days[activeDayIndex]?.day ?? 1}`
                      : `Aggiungi al Giorno ${days[activeDayIndex]?.day ?? 1}`}
                  </Text>
                </TouchableOpacity>
                <View style={styles.detailActionsRow}>
                  <TouchableOpacity
                    style={styles.detailMapBtn}
                    onPress={() => openExternalLink(mapsSearchUrl(attractionDetail.item, city))}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="map-outline" size={16} color={colors.bg} />
                    <Text style={styles.detailMapText}>Maps</Text>
                  </TouchableOpacity>
                  {isMuseum(attractionDetail.item) && !!attractionDetail.item.ticket_url && (
                    <TouchableOpacity
                      style={styles.detailTicketBtn}
                      onPress={() => openExternalLink(attractionDetail.item.ticket_url!)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="ticket-outline" size={16} color={colors.text} />
                      <Text style={styles.detailTicketText}>
                        {lang === "en" ? "Tickets" : "Biglietti"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {dragging && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.dragPreview,
            {
              left: -110,
              top: -28,
              transform: [
                { translateX: dragPosition.x },
                { translateY: dragPosition.y },
              ],
            },
            dragging.kind === "meal" && styles.dragPreviewMeal,
          ]}
        >
          <Text style={styles.dragPreviewEmoji}>{getEmoji(dragging.item.attraction_type, dragging.kind === "meal")}</Text>
          <Text style={styles.dragPreviewName} numberOfLines={1}>
            {(lang === "en" && dragging.item.name_en) ? dragging.item.name_en : dragging.item.name}
          </Text>
        </Animated.View>
      )}

      {showGuide && (
        <GuideModal
          lang={lang}
          slides={lang === "en" ? MANUAL_GUIDE_SLIDES_EN : MANUAL_GUIDE_SLIDES_IT}
          targetRefs={guideTargets.current}
          onDone={dismissGuide}
        />
      )}

      {selected && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionEmoji}>
            {getEmoji(selected.attraction_type, selectedKind === "meal")}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectionName} numberOfLines={1}>
              {(lang === "en" && selected.name_en) ? selected.name_en : selected.name}
            </Text>
            <Text style={styles.selectionHint}>
              {activeTab === "piano"
                ? (lang === "en" ? "Tap an empty slot to place it" : "Tocca uno slot vuoto per inserirla")
                : (lang === "en" ? "Tap a slot on the left to place it" : "Tocca uno slot a sinistra per inserirla")}
            </Text>
          </View>
          <TouchableOpacity onPress={handleCancelSelection} style={styles.cancelBtn} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      <BuilderMap
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        lang={lang}
        dayLabel={lang === "en" ? `Day ${activeDay?.day ?? 1}` : `Giorno ${activeDay?.day ?? 1}`}
        attractions={mapAttractions}
        foodSpots={mapFoodSpots}
        currentSlots={currentMapSlots}
        onAddAttraction={handleMapAddAttraction}
        onAddFood={handleMapAddFood}
        onRemove={handleMapRemove}
        onReorder={handleMapReorder}
      />
    </SafeAreaView>
  );
}

function GuideModal({
  lang, slides, targetRefs, onDone,
}: {
  lang: string;
  slides: GuideStep[];
  targetRefs: Map<string, View>;
  onDone: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [slide, setSlide] = useState(0);
  const [rect, setRect] = useState<GuideRect | null>(null);
  const isLast = slide === slides.length - 1;
  const current = slides[slide];
  const tooltipWidth = Math.min(300, SCREEN_WIDTH - 32);
  const tooltipHeight = 258;
  const tooltipTop = rect
    ? Math.max(16, Math.min(SCREEN_HEIGHT - tooltipHeight - 16,
        rect.y + rect.height + tooltipHeight + 24 > SCREEN_HEIGHT
          ? rect.y - tooltipHeight - 16
          : rect.y + rect.height + 16))
    : Math.max(16, Math.min(SCREEN_HEIGHT - tooltipHeight - 16, SCREEN_HEIGHT * 0.46));
  const tooltipLeft = Math.max(16, Math.min(SCREEN_WIDTH - tooltipWidth - 16, rect ? rect.x + rect.width / 2 - tooltipWidth / 2 : 16));

  useEffect(() => {
    const target = targetRefs.get(current.target);
    if (!target) {
      setRect(null);
      return;
    }
    const id = setTimeout(() => {
      target.measureInWindow((x, y, width, height) => {
        setRect({ x, y, width, height });
      });
    }, 80);
    return () => clearTimeout(id);
  }, [current.target, targetRefs]);

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.tourOverlay}>
        {rect && (
          <View
            pointerEvents="none"
            style={[
              styles.tourHighlight,
              {
                left: Math.max(6, rect.x - 6),
                top: Math.max(6, rect.y - 6),
                width: Math.min(SCREEN_WIDTH - 12, rect.width + 12),
                height: rect.height + 12,
              },
            ]}
          />
        )}
        {rect && (
          <View
            pointerEvents="none"
            style={[
              styles.tourArrow,
              {
                left: Math.max(22, Math.min(SCREEN_WIDTH - 22, rect.x + rect.width / 2 - 7)),
                top: tooltipTop > rect.y ? tooltipTop - 13 : tooltipTop + tooltipHeight - 8,
                transform: [{ rotate: tooltipTop > rect.y ? "180deg" : "0deg" }],
              },
            ]}
          />
        )}
        <View style={[styles.tourCard, { top: tooltipTop, left: tooltipLeft, width: tooltipWidth }]}>
          <Text style={styles.tourEyebrow}>{slide + 1} / {slides.length}</Text>
          <Text style={styles.guideIcon}>{current.icon}</Text>
          <Text style={styles.guideTitle}>{current.title}</Text>
          <Text style={styles.guideBody}>{current.body}</Text>
          <View style={styles.guideDots}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.guideDot, i === slide && styles.guideDotActive]} />
            ))}
          </View>
          <TouchableOpacity
            style={styles.guideCta}
            onPress={() => isLast ? onDone() : setSlide((s) => s + 1)}
            activeOpacity={0.85}
          >
            <Text style={styles.guideCtaText}>
              {isLast
                ? (lang === "en" ? "Start building" : "Inizia a creare")
                : (lang === "en" ? "Next" : "Avanti")}
            </Text>
          </TouchableOpacity>
          {!isLast && (
            <TouchableOpacity onPress={onDone} style={styles.guideSkip} activeOpacity={0.7}>
              <Text style={styles.guideSkipText}>{lang === "en" ? "Skip" : "Salta"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

function DaySlotDock({
  day, dayIndex, dayCount, stats, activeSlotId, mode, lang,
  onPrevDay, onNextDay, onSlotPress, onAddSlot, onSummary,
}: {
  day: DayPlan;
  dayIndex: number;
  dayCount: number;
  stats: DayStats;
  activeSlotId: string | null;
  mode: SlotKind;
  lang: string;
  onPrevDay: () => void;
  onNextDay: () => void;
  onSlotPress: (slot: SlotData) => void;
  onAddSlot: () => void;
  onSummary: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const compatibleSlots = day.slots.filter((s) => s.kind === mode);
  const timeColor = stats.minutes >= 240 && stats.minutes <= 420 ? colors.accentGreen : colors.accentGold;
  const kmColor = stats.distanceKm <= 4 ? colors.accentGreen : colors.danger;
  const museumColor = stats.museums <= 1 ? colors.accentGreen : colors.danger;

  return (
    <View style={styles.dayDock}>
      <View style={styles.dayDockTop}>
        <TouchableOpacity
          onPress={onPrevDay}
          disabled={dayIndex <= 0}
          style={[styles.dayDockArrow, dayIndex <= 0 && styles.dayDockArrowDisabled]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={16} color={dayIndex <= 0 ? colors.textMuted : colors.accentGold} />
        </TouchableOpacity>
        <View style={styles.dayDockTitleWrap}>
          <Text style={styles.dayDockTitle}>
            {lang === "en" ? "Day" : "Giorno"} {day.day}
          </Text>
          <Text style={styles.dayDockSubtitle}>
            {mode === "meal"
              ? (lang === "en" ? "Tap a meal to add it" : "Tocca un pasto per inserirlo")
              : (lang === "en" ? "Tap a place to add it" : "Tocca un'attrazione per inserirla")}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onNextDay}
          disabled={dayIndex >= dayCount - 1}
          style={[styles.dayDockArrow, dayIndex >= dayCount - 1 && styles.dayDockArrowDisabled]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={16} color={dayIndex >= dayCount - 1 ? colors.textMuted : colors.accentGold} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onSummary} style={styles.dayDockSummaryBtn} activeOpacity={0.75}>
          <Ionicons name="list-outline" size={15} color={colors.accentBlue} />
        </TouchableOpacity>
      </View>

      <View style={styles.dayDockMetrics}>
        <Text style={[styles.dayDockMetric, { color: timeColor }]}>{Math.floor(stats.minutes / 60)}h{stats.minutes % 60 ? ` ${stats.minutes % 60}m` : ""}</Text>
        <Text style={[styles.dayDockMetric, { color: kmColor }]}>{stats.distanceKm.toFixed(1)} / 4 km</Text>
        <Text style={[styles.dayDockMetric, { color: museumColor }]}>{stats.museums} / 1 museo</Text>
        <Text style={styles.dayDockMetricMuted}>{stats.filled} slot</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayDockSlots}>
        {compatibleSlots.map((slot, idx) => {
          const filled = slot.attraction !== null;
          const active = activeSlotId === slot.id;
          const label = filled
            ? ((lang === "en" && slot.attraction?.name_en) ? slot.attraction.name_en : slot.attraction?.name)
            : mode === "meal"
              ? (lang === "en" ? "Meal" : "Pasto")
              : (lang === "en" ? "Place" : "Attrazione");
          return (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.dayDockSlot,
                mode === "meal" && styles.dayDockSlotMeal,
                active && styles.dayDockSlotActive,
                filled && styles.dayDockSlotFilled,
              ]}
              onPress={() => onSlotPress(slot)}
              activeOpacity={0.75}
            >
              <Text style={styles.dayDockSlotIndex}>{idx + 1}</Text>
              <Text style={[styles.dayDockSlotText, filled && styles.dayDockSlotTextFilled]} numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={styles.dayDockAddSlot} onPress={onAddSlot} activeOpacity={0.75}>
          <Ionicons name="add" size={15} color={mode === "meal" ? colors.accentGreen : colors.accentBlue} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── AttractionCard (full-width, più spaziosa) ─────────────────────────────────

function AttractionCard({
  attraction, isFood, selected, distance, lang, onPress, onDragStart, onDragMove, onDragEnd,
}: {
  attraction: BuilderAttraction;
  isFood: boolean;
  selected: boolean;
  distance?: number;
  lang: string;
  onPress: () => void;
  onDragStart: (x: number, y: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const dragStarted = useRef(false);
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_event, gesture: PanResponderGestureState) =>
      Math.abs(gesture.dx) > 6 && Math.abs(gesture.dx) >= Math.abs(gesture.dy) * 0.6,
    onMoveShouldSetPanResponderCapture: (_event, gesture: PanResponderGestureState) =>
      Math.abs(gesture.dx) > 6 && Math.abs(gesture.dx) >= Math.abs(gesture.dy) * 0.6,
    onPanResponderGrant: (_event, gesture) => {
      dragStarted.current = true;
      onDragStart(gesture.moveX, gesture.moveY);
    },
    onPanResponderMove: (_event, gesture) => {
      onDragMove(gesture.moveX, gesture.moveY);
    },
    onPanResponderRelease: (_event, gesture) => {
      onDragEnd(gesture.moveX, gesture.moveY);
      setTimeout(() => { dragStarted.current = false; }, 0);
    },
    onPanResponderTerminate: (_event, gesture) => {
      onDragEnd(gesture.moveX, gesture.moveY);
      setTimeout(() => { dragStarted.current = false; }, 0);
    },
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  }), [onDragEnd, onDragMove, onDragStart]);
  const color = isFood ? colors.accentGreen : (LEVEL_COLORS[attraction.category_level] ?? "#ccc");
  const isMuseum = !isFood && (attraction.attraction_type ?? "").toLowerCase() === "museo";
  const name = lang === "en" && attraction.name_en ? attraction.name_en : attraction.name;
  const emoji = getEmoji(attraction.attraction_type, isFood);
  const typeLabel = translateType(attraction.attraction_type, lang);

  return (
    <View
      {...panResponder.panHandlers}
      // @ts-ignore — cursor è proprietà web non tipizzata in RN
      style={Platform.OS === "web" ? { cursor: "grab" } : undefined}
    >
      <TouchableOpacity
        style={[
          styles.attrCard,
          isMuseum && styles.attrCardMuseum,
          selected && (isFood ? styles.attrCardSelectedFood : styles.attrCardSelected),
        ]}
        onPress={() => { if (!dragStarted.current) onPress(); }}
        activeOpacity={0.8}
      >
        {/* Drag handle — visibile solo su web come affordance */}
        {Platform.OS === "web" && (
          <Ionicons
            name="reorder-three-outline"
            size={18}
            color={colors.textMuted}
            style={{ marginRight: 6, opacity: 0.5 }}
          />
        )}
        <View style={styles.attrInfo}>
          <View style={styles.attrTopRow}>
            <Text style={styles.attrEmoji}>{emoji}</Text>
            <Text style={styles.attrName} numberOfLines={2}>{name}</Text>
            {selected && <Ionicons name="checkmark-circle" size={18} color={isFood ? colors.accentGreen : colors.accentGold} />}
          </View>
          <View style={styles.attrMeta}>
            {isFood ? (
              <View style={[styles.typeChip, { borderColor: color + "55", backgroundColor: color + "18" }]}>
                <Text style={[styles.typeChipText, { color }]}>{priceLabel(attraction.category_level)}</Text>
              </View>
            ) : (
              typeLabel && (
                <View style={[styles.typeChip, { borderColor: color + "55", backgroundColor: color + "18" }]}>
                  <Text style={[styles.typeChipText, { color }]}>{typeLabel}</Text>
                </View>
              )
            )}
            {attraction.estimated_visit_time ? (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                <Text style={styles.metaText}>{attraction.estimated_visit_time} min</Text>
              </View>
            ) : null}
            {distance !== undefined && (
              <View style={styles.metaItem}>
                <Ionicons name="navigate-outline" size={11} color={colors.accentGreen} />
                <Text style={[styles.metaText, { color: colors.accentGreen }]}>{fmtDist(distance)}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ── DayRow ────────────────────────────────────────────────────────────────────

function DayRow({
  day, dayIdx, expanded, placementMode, placementKind, lang,
  showAddControls = false,
  onToggle, onTapSlot, onRemove, onDeleteSlot, onAddSlot, onAddMealSlot, onSlotRef, onSetNote, onOptimize,
}: {
  day: DayPlan; dayIdx: number; expanded: boolean;
  placementMode: boolean; placementKind: SlotKind; lang: string;
  showAddControls?: boolean;
  onToggle: () => void; onTapSlot: (slot: SlotData) => void;
  onRemove: (slotId: string) => void; onDeleteSlot: (slotId: string) => void;
  onAddSlot?: () => void; onAddMealSlot?: () => void;
  onSlotRef?: (slot: SlotData, ref: View | null) => void;
  onSetNote: (slotId: string, note: string) => void; onOptimize: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const filledCount = day.slots.filter((s) => s.attraction !== null).length;
  const stats = getDayStats(day);
  const canOptimize = (() => {
    let segCount = 0;
    for (const s of day.slots) {
      if (s.attraction === null) continue;
      if (s.kind === "meal") { segCount = 0; continue; }
      segCount++;
      if (segCount >= 2) return true;
    }
    return false;
  })();
  const totalMins = stats.minutes;
  const hh = Math.floor(totalMins / 60);
  const mm = totalMins % 60;
  const timeLabel = totalMins > 0 ? (hh > 0 ? `${hh}h${mm > 0 ? ` ${mm}min` : ""}` : `${mm}min`) : null;
  const metricTimeLabel = totalMins > 0 ? (hh > 0 ? `${hh}h${mm > 0 ? `${mm}` : ""}` : `${mm}m`) : "0m";
  const timeColor = stats.minutes > 420 ? colors.danger : colors.accentGreen;
  const kmColor = stats.distanceKm > 4 ? colors.danger : colors.accentGreen;
  const museumColor = stats.museums > 1 ? colors.danger : colors.accentGreen;

  return (
    <View style={styles.dayRow}>
      <TouchableOpacity style={styles.dayHeader} onPress={onToggle} activeOpacity={0.8}>
        <View style={[styles.dayBadge, expanded && styles.dayBadgeActive]}>
          <Text style={[styles.dayBadgeText, expanded && styles.dayBadgeTextActive]}>{day.day}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.dayTitle} numberOfLines={1}>{lang === "en" ? "Day" : "Giorno"} {day.day}</Text>
          {timeLabel && <Text style={styles.dayTimeMeta}>⏱ {timeLabel}</Text>}
        </View>
        {filledCount > 0 && (
          <View style={styles.filledBadge}>
            <Text style={styles.filledBadgeText}>{filledCount}</Text>
          </View>
        )}
        {canOptimize && (
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation?.(); onOptimize(); }}
            style={styles.optimizeBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="shuffle-outline" size={15} color={colors.accentBlue} />
            <Text style={styles.optimizeBtnText}>{lang === "en" ? "Opt." : "Ottim."}</Text>
          </TouchableOpacity>
        )}
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.dayBody}>
          <View style={styles.dayMetricsColumn}>
            <View style={styles.dayMetricChip}>
              <Text style={[styles.dayMetricText, { color: timeColor }]} numberOfLines={1}>⏱ {metricTimeLabel} / 7h</Text>
            </View>
            <View style={styles.dayMetricChip}>
              <Text style={[styles.dayMetricText, { color: kmColor }]} numberOfLines={1}>🚶 {stats.distanceKm.toFixed(1)} / 4 km</Text>
            </View>
            <View style={styles.dayMetricChip}>
              <Text style={[styles.dayMetricText, { color: museumColor }]} numberOfLines={1}>🏛 {stats.museums} / 1 museo</Text>
            </View>
          </View>
          {day.slots.map((slot, idx) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              index={idx + 1}
              placementMode={placementMode}
              placementKind={placementKind}
              lang={lang}
              onTap={() => onTapSlot(slot)}
              onRemove={() => onRemove(slot.id)}
              onDelete={() => onDeleteSlot(slot.id)}
              onSlotRef={(ref) => onSlotRef?.(slot, ref)}
              onSetNote={(note) => onSetNote(slot.id, note)}
            />
          ))}
          {showAddControls && onAddSlot && onAddMealSlot && (
            <View style={styles.addSlotRow}>
              <TouchableOpacity style={styles.addSlotBtn} onPress={onAddSlot} activeOpacity={0.7}>
                <Ionicons name="add" size={14} color={colors.accentBlue} />
                <Text style={styles.addSlotText}>🏛️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addMealBtn} onPress={onAddMealSlot} activeOpacity={0.7}>
                <Ionicons name="add" size={14} color={colors.accentGreen} />
                <Text style={styles.addMealText}>🍝</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ── SlotCard ──────────────────────────────────────────────────────────────────

function SlotCard({
  slot, index, placementMode, placementKind, lang,
  onTap, onRemove, onDelete, onSlotRef, onSetNote,
}: {
  slot: SlotData; index: number;
  placementMode: boolean; placementKind: SlotKind; lang: string;
  onTap: () => void; onRemove: () => void; onDelete: () => void;
  onSlotRef?: (ref: View | null) => void;
  onSetNote: (note: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isFilled = slot.attraction !== null;
  const isMeal = slot.kind === "meal";
  const name = isFilled
    ? (lang === "en" && slot.attraction!.name_en ? slot.attraction!.name_en : slot.attraction!.name)
    : null;
  const canReceive = placementMode && placementKind === slot.kind;

  if (isFilled) {
    return (
      <TouchableOpacity
        style={[
          styles.slotFilled,
          isMeal && styles.slotFilledMeal,
          !isMeal && (slot.attraction?.attraction_type ?? "").toLowerCase() === "museo" && styles.slotFilledMuseum,
        ]}
        onPress={onTap}
        activeOpacity={0.82}
      >
        {/* Colonna sinistra: numero sopra, cestino sotto */}
        <View style={styles.slotLeftCol}>
          <View style={[styles.slotIndex, isMeal && styles.slotIndexMeal]}>
            <Text style={[styles.slotIndexText, isMeal && styles.slotIndexTextMeal]}>{index}</Text>
          </View>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7} style={styles.slotDeleteBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
        {/* Nome: 3 righe con ellissi */}
        <View style={{ flex: 1 }}>
          <Text style={styles.slotNameCompact} numberOfLines={3} ellipsizeMode="tail">{name}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      ref={(ref) => {
        onSlotRef?.(ref);
      }}
      style={[
        styles.slotEmpty,
        isMeal && styles.slotEmptyMeal,
        canReceive && (isMeal ? styles.slotEmptyMealActive : styles.slotEmptyActive),
      ]}
      onPress={canReceive ? onTap : undefined}
      activeOpacity={canReceive ? 0.7 : 1}
    >
      <View style={[styles.slotIndex, styles.slotIndexEmpty]}>
        <Text style={styles.slotIndexEmptyText}>{index}</Text>
      </View>
      <Ionicons
        name={isMeal ? "restaurant-outline" : "add-circle-outline"}
        size={16}
        color={canReceive ? (isMeal ? colors.accentGreen : colors.accentBlue) : colors.border2}
      />
      <View style={{ flex: 1 }} />
      <TouchableOpacity
        onPress={onDelete}
        style={{ marginLeft: "auto" }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={14} color={colors.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(colors: any) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },

    // ── Header ──────────────────────────────────────────────────────────────
    header: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 14, paddingVertical: 10,
      gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: {
      width: 36, height: 36, alignItems: "center", justifyContent: "center",
      borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border2, flexShrink: 0,
    },
    headerCenter: { flex: 1 },
    headerTitle: { color: colors.text, fontWeight: "700", fontSize: 16 },
    headerSub: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
    viewBtn: {
      flexDirection: "row", alignItems: "center", gap: 5,
      backgroundColor: colors.accentGold, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 8, flexShrink: 0,
    },
    viewBtnDisabled: { backgroundColor: colors.border },
    viewBtnText: { color: colors.bg, fontWeight: "800", fontSize: 13 },
    flagBtn: {
      width: 34, height: 34, borderRadius: 17, backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border2, alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    guideBtn: {
      borderColor: colors.accentGold + "70",
      backgroundColor: colors.accentGold + "14",
    },
    flagEmoji: { fontSize: 18 },

    // ── Tab bar ─────────────────────────────────────────────────────────────
    tabBar: {
      flexDirection: "row",
      backgroundColor: colors.card2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 6, paddingVertical: 11, paddingHorizontal: 4,
      borderBottomWidth: 2, borderBottomColor: "transparent",
      position: "relative",
    },
    tabActive: { borderBottomColor: colors.accentGold, backgroundColor: colors.accentGold + "08" },
    tabActiveFood: { borderBottomColor: colors.accentGreen, backgroundColor: colors.accentGreen + "08" },
    tabActivePiano: { borderBottomColor: colors.accentBlue, backgroundColor: colors.accentBlue + "08" },
    tabEmoji: { fontSize: 15 },
    tabLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
    tabLabelActive: { color: colors.accentGold },
    tabLabelActiveFood: { color: colors.accentGreen },
    tabLabelActivePiano: { color: colors.accentBlue },
    tabBadge: {
      minWidth: 18, height: 18, borderRadius: 9,
      backgroundColor: colors.accentGold, alignItems: "center", justifyContent: "center",
      paddingHorizontal: 4,
    },
    tabBadgeFood: { backgroundColor: colors.accentGreen },
    tabBadgePiano: { backgroundColor: colors.accentBlue },
    tabBadgeText: { color: colors.bg, fontSize: 10, fontWeight: "800" },

    // ── Tab content ─────────────────────────────────────────────────────────
    tabContent: { flex: 1 },

    // Search
    searchRow: {
      flexDirection: "row", alignItems: "center", gap: 8,
      paddingHorizontal: 16, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    searchBar: {
      flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: colors.card, borderRadius: 10, borderWidth: 1,
      borderColor: colors.border2, paddingHorizontal: 12, paddingVertical: 8,
    },
    searchInput: { flex: 1, color: colors.textSub, fontSize: 14 },
    filterBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border2,
      alignItems: "center", justifyContent: "center",
    },
    filterBtnActive: { borderColor: colors.accentGold + "60", backgroundColor: colors.accentGold + "12" },
    mapToggleBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: colors.accentGold + "14", borderWidth: 1, borderColor: colors.accentGold + "44",
      alignItems: "center", justifyContent: "center",
    },
    filterBadge: {
      position: "absolute", top: -5, right: -5,
      width: 16, height: 16, borderRadius: 8,
      backgroundColor: colors.accentGold, alignItems: "center", justifyContent: "center",
    },
    filterBadgeText: { color: colors.bg, fontSize: 9, fontWeight: "800" },

    totalCount: {
      color: colors.textMuted, fontSize: 11, fontWeight: "600",
      textAlign: "center", paddingVertical: 5, letterSpacing: 0.3,
    },

    builderWorkspace: {
      flex: 1,
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 8,
    },
    builderPlanPane: {
      flex: 1,
      minWidth: 0,
    },
    builderListPane: {
      flex: 1,
      minWidth: 0,
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
      paddingLeft: 8,
    },
    builderPaneTitle: {
      color: colors.accentGold,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 8,
      paddingHorizontal: 2,
    },
    builderPlanScroll: { paddingBottom: 24 },
    listScroll: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 24 },
    pianoScroll: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 100 },

    errorText: { color: colors.danger, fontSize: 13, padding: 16, lineHeight: 19 },
    emptyText: { color: colors.textMuted, fontSize: 13, textAlign: "center", marginTop: 32 },

    // ── Attraction card (full-width) ─────────────────────────────────────────
    attrCard: {
      flexDirection: "row", alignItems: "flex-start",
      backgroundColor: colors.card, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border2,
      padding: 12, marginBottom: 10,
    },
    attrCardSelected: { borderColor: colors.accentGold, backgroundColor: colors.accentGold + "0c" },
    attrCardSelectedFood: { borderColor: colors.accentGreen, backgroundColor: colors.accentGreen + "0c" },
    attrCardMuseum: { borderColor: colors.accentPurple + "66", backgroundColor: colors.accentPurple + "15" },
    attrEmoji: { fontSize: 22, flexShrink: 0, lineHeight: 25 },
    attrInfo: { flex: 1 },
    attrTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
    attrName: { flex: 1, color: colors.text, fontSize: 15, fontWeight: "700", lineHeight: 20, marginBottom: 4, minWidth: 0 },
    attrDesc: { color: colors.textSub, fontSize: 12, lineHeight: 17, marginBottom: 8 },
    attrMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
    typeChip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
    typeChipText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    metaText: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },

    // Bottom day dock
    dayDock: {
      backgroundColor: colors.card2,
      borderTopWidth: 1,
      borderTopColor: colors.border2,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 14,
      gap: 10,
    },
    dayDockTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    dayDockArrow: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border2,
      alignItems: "center",
      justifyContent: "center",
    },
    dayDockArrowDisabled: { opacity: 0.55 },
    dayDockTitleWrap: { flex: 1 },
    dayDockTitle: { color: colors.text, fontSize: 15, fontWeight: "800" },
    dayDockSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    dayDockSummaryBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.accentBlue + "12",
      borderWidth: 1,
      borderColor: colors.accentBlue + "38",
      alignItems: "center",
      justifyContent: "center",
    },
    dayDockMetrics: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      flexWrap: "wrap",
    },
    dayDockMetric: {
      fontSize: 11,
      fontWeight: "800",
      backgroundColor: colors.card,
      borderRadius: 7,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    dayDockMetricMuted: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: "700",
      backgroundColor: colors.card,
      borderRadius: 7,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    dayDockSlots: {
      gap: 8,
      paddingRight: 8,
    },
    dayDockSlot: {
      width: 132,
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border2,
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 8,
    },
    dayDockSlotMeal: {
      borderColor: colors.accentGreen + "40",
      backgroundColor: colors.accentGreen + "10",
    },
    dayDockSlotActive: {
      borderColor: colors.accentGold,
      backgroundColor: colors.accentGold + "16",
    },
    dayDockSlotFilled: {
      borderStyle: "solid",
      opacity: 0.78,
    },
    dayDockSlotIndex: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.border2,
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: "800",
      textAlign: "center",
      lineHeight: 18,
      flexShrink: 0,
    },
    dayDockSlotText: { color: colors.textSub, fontSize: 12, fontWeight: "700", flex: 1 },
    dayDockSlotTextFilled: { color: colors.text },
    dayDockAddSlot: {
      width: 46,
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    // ── Day row ─────────────────────────────────────────────────────────────
    dayRow: {
      backgroundColor: colors.card, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border2, marginBottom: 12, overflow: "hidden",
    },
    dayHeader: {
      flexDirection: "row", alignItems: "center", gap: 8, padding: 12,
    },
    dayBadge: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.border2, alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    dayBadgeActive: { backgroundColor: colors.accentGold + "22", borderWidth: 1.5, borderColor: colors.accentGold },
    dayBadgeText: { color: colors.textMuted, fontSize: 14, fontWeight: "800" },
    dayBadgeTextActive: { color: colors.accentGold },
    dayTitle: { color: colors.textSub, fontSize: 15, fontWeight: "700" },
    dayTimeMeta: { color: colors.accentGreen, fontSize: 11, fontWeight: "700", marginTop: 2 },
    filledBadge: {
      minWidth: 24,
      backgroundColor: colors.accentGreen + "18", borderRadius: 8,
      paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderColor: colors.accentGreen + "30",
      alignItems: "center",
    },
    filledBadgeText: { color: colors.accentGreen, fontSize: 11, fontWeight: "700" },
    optimizeBtn: {
      flexDirection: "row", alignItems: "center", gap: 4,
      padding: 6, borderRadius: 8,
      backgroundColor: colors.accentBlue + "18", borderWidth: 1, borderColor: colors.accentBlue + "40",
    },
    optimizeBtnText: { color: colors.accentBlue, fontSize: 11, fontWeight: "700" },
    dayBody: { paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: colors.border },
    dayMetricsColumn: {
      gap: 5,
      marginTop: 10,
    },
    dayMetricChip: {
      backgroundColor: colors.card2,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    dayMetricText: {
      fontSize: 11,
      fontWeight: "800",
    },

    // ── Slot filled ─────────────────────────────────────────────────────────
    slotFilled: {
      minHeight: 72,
      flexDirection: "row", alignItems: "center", gap: 10,
      backgroundColor: colors.border, borderRadius: 12,
      paddingHorizontal: 12, paddingVertical: 10, marginTop: 10, borderWidth: 1, borderColor: colors.border2,
    },
    slotFilledMeal: { backgroundColor: colors.accentGreen + "12", borderColor: colors.accentGreen + "30" },
    slotFilledMuseum: { backgroundColor: colors.accentPurple + "18", borderColor: colors.accentPurple + "44" },
    slotIndex: {
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: colors.border2, alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    slotIndexMeal: { backgroundColor: colors.accentGreen + "28" },
    slotIndexText: { color: colors.textMuted, fontSize: 11, fontWeight: "800" },
    slotIndexTextMeal: { color: colors.accentGreen },
    slotIndexEmpty: { backgroundColor: colors.border },
    slotIndexEmptyText: { color: colors.textMuted, fontSize: 11, fontWeight: "800" },
    slotEmoji: { fontSize: 20, flexShrink: 0 },
    slotName: { color: colors.text, fontSize: 14, fontWeight: "600", lineHeight: 19, flex: 1 },
    slotNameCompact: { color: colors.text, fontSize: 14, fontWeight: "700", lineHeight: 18, flex: 1 },
    slotMetaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
    slotTime: { color: colors.textMuted, fontSize: 12 },
    slotPrice: { color: colors.accentGreen, fontSize: 12, fontWeight: "800" },
    slotNote: {
      color: colors.textMuted, fontSize: 12, marginTop: 8,
      paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border2, minHeight: 18,
    },
    slotActions: { alignItems: "center", justifyContent: "center", flexShrink: 0 },
    slotLeftCol: {
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 6, flexShrink: 0,
    },
    slotDeleteBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.danger + "18",
      borderWidth: 1,
      borderColor: colors.danger + "40",
    },

    // ── Slot empty ──────────────────────────────────────────────────────────
    slotEmpty: {
      height: 56,
      flexDirection: "row", alignItems: "center", gap: 10,
      borderRadius: 12, borderWidth: 1.5, borderColor: colors.border,
      borderStyle: "dashed", paddingHorizontal: 12, marginTop: 10,
    },
    slotEmptyMeal: { borderColor: colors.accentGreen + "30" },
    slotEmptyActive: { borderColor: colors.accentBlue + "60", backgroundColor: colors.accentBlue + "10" },
    slotEmptyMealActive: { borderColor: colors.accentGreen + "60", backgroundColor: colors.accentGreen + "10" },
    slotEmptyText: { color: colors.border2, fontSize: 13, fontWeight: "600", flex: 1 },
    slotEmptyTextMeal: { color: colors.accentGreen + "40" },
    slotEmptyTextActive: { color: colors.accentBlue },
    slotEmptyTextMealActive: { color: colors.accentGreen },

    // Drag preview
    dragPreview: {
      position: "absolute",
      zIndex: 50,
      width: 220,
      minHeight: 56,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.accentGold,
      shadowColor: "#000",
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    dragPreviewMeal: {
      borderColor: colors.accentGreen,
      backgroundColor: colors.accentGreen + "15",
    },
    dragPreviewEmoji: { fontSize: 22 },
    dragPreviewName: { flex: 1, color: colors.text, fontSize: 13, fontWeight: "800" },

    // ── Add slot ────────────────────────────────────────────────────────────
    addSlotRow: { flexDirection: "row", gap: 10, marginTop: 12 },
    addSlotBtn: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
      paddingVertical: 10, borderRadius: 10,
      backgroundColor: colors.accentBlue + "12", borderWidth: 1, borderColor: colors.accentBlue + "30",
    },
    addSlotText: { color: colors.accentBlue, fontSize: 13, fontWeight: "700" },
    addMealBtn: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
      paddingVertical: 10, borderRadius: 10,
      backgroundColor: colors.accentGreen + "12", borderWidth: 1, borderColor: colors.accentGreen + "30",
    },
    addMealText: { color: colors.accentGreen, fontSize: 13, fontWeight: "700" },

    // ── Selection bar ────────────────────────────────────────────────────────
    selectionBar: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: colors.card2,
      borderTopWidth: 2, borderTopColor: colors.accentGold + "50",
      paddingHorizontal: 16, paddingVertical: 12,
    },
    selectionEmoji: { fontSize: 26, flexShrink: 0 },
    selectionName: { color: colors.accentGold, fontWeight: "700", fontSize: 15 },
    selectionHint: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    goToPianoBtn: {
      flexDirection: "row", alignItems: "center", gap: 4,
      backgroundColor: colors.accentGold, borderRadius: 10,
      paddingHorizontal: 10, paddingVertical: 7, flexShrink: 0,
    },
    goToPianoBtnText: { fontSize: 14 },
    cancelBtn: { flexShrink: 0, padding: 4 },

    // ── Modal filtro ─────────────────────────────────────────────────────────
    modalBackdrop: {
      flex: 1, backgroundColor: "#00000088",
      justifyContent: "center", alignItems: "center", paddingHorizontal: 24,
    },
    filterModal: {
      width: "100%", maxHeight: 440,
      backgroundColor: colors.card, borderRadius: 18,
      borderWidth: 1, borderColor: colors.border2, overflow: "hidden",
    },
    detailModal: {
      width: "100%",
      maxHeight: "82%",
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border2,
      padding: 16,
      gap: 14,
    },
    detailHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    detailEmoji: { fontSize: 28, width: 34, textAlign: "center" },
    detailTitle: { color: colors.text, fontSize: 17, fontWeight: "800", lineHeight: 22 },
    detailMeta: { color: colors.accentGold, fontSize: 12, fontWeight: "700", marginTop: 4 },
    detailMetaMeal: { color: colors.accentGreen },
    detailDescriptionScroll: { maxHeight: 260 },
    detailDescription: { color: colors.textSub, fontSize: 14, lineHeight: 20 },
    detailAddBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      backgroundColor: colors.accentGold,
      borderRadius: 12,
      paddingVertical: 13,
      marginBottom: 10,
    },
    detailAddText: { color: colors.bg, fontSize: 14, fontWeight: "800" },
    detailActionsRow: {
      flexDirection: "row",
      gap: 10,
    },
    detailMapBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      backgroundColor: colors.accentGold,
      borderRadius: 12,
      paddingVertical: 11,
    },
    detailMapText: { color: colors.bg, fontSize: 13, fontWeight: "800" },
    detailTicketBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      backgroundColor: colors.accentPurple + "25",
      borderWidth: 1,
      borderColor: colors.accentPurple + "70",
      borderRadius: 12,
      paddingVertical: 11,
    },
    detailTicketText: { color: colors.text, fontSize: 13, fontWeight: "800" },
    detailDeleteBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.danger,
      borderRadius: 12,
      paddingVertical: 12,
    },
    detailDeleteText: { color: "#fff", fontSize: 14, fontWeight: "800" },
    tourOverlay: {
      flex: 1,
      backgroundColor: "#000000cc",
    },
    tourHighlight: {
      position: "absolute",
      borderWidth: 2,
      borderColor: colors.accentGold,
      borderRadius: 16,
      backgroundColor: colors.accentGold + "14",
      shadowColor: colors.accentGold,
      shadowOpacity: 0.55,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 0 },
    },
    tourArrow: {
      position: "absolute",
      width: 0,
      height: 0,
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderBottomWidth: 12,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderBottomColor: colors.accentGold,
    },
    tourCard: {
      position: "absolute",
      width: 300,
      backgroundColor: colors.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border2,
      padding: 18,
      alignItems: "center",
      gap: 8,
    },
    tourEyebrow: { color: colors.accentGold, fontSize: 11, fontWeight: "800" },
    guideIcon: { fontSize: 38, marginBottom: 2 },
    guideTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "800",
      textAlign: "center",
      lineHeight: 23,
    },
    guideBody: {
      color: colors.textSub,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 19,
      marginTop: 2,
      marginBottom: 6,
    },
    guideDots: { flexDirection: "row", gap: 5, marginVertical: 5 },
    guideDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.border2,
    },
    guideDotActive: { backgroundColor: colors.accentGold, width: 22 },
    guideCta: {
      marginTop: 5,
      backgroundColor: colors.accentGold,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 26,
      minWidth: 170,
      alignItems: "center",
    },
    guideCtaText: { color: colors.bg, fontSize: 15, fontWeight: "800" },
    guideSkip: { paddingVertical: 8 },
    guideSkipText: { color: colors.textMuted, fontSize: 13 },
    filterModalHeader: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 18, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: colors.border2,
    },
    filterModalTitle: { color: colors.textSub, fontSize: 14, fontWeight: "700" },
    filterModalReset: { color: colors.accentBlue, fontSize: 13, fontWeight: "600" },
    filterModalList: { maxHeight: 320 },
    filterModalItem: {
      flexDirection: "row", alignItems: "center", gap: 14,
      paddingHorizontal: 18, paddingVertical: 13,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    checkbox: {
      width: 20, height: 20, borderRadius: 6, borderWidth: 1.5,
      borderColor: colors.border2, backgroundColor: colors.card2,
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    checkboxChecked: { backgroundColor: colors.accentGold, borderColor: colors.accentGold },
    filterModalItemText: { color: colors.textMuted, fontSize: 14 },
    filterModalItemTextChecked: { color: colors.accentGold, fontWeight: "600" },
    filterModalDone: {
      margin: 14, backgroundColor: colors.accentGold,
      borderRadius: 12, paddingVertical: 12, alignItems: "center",
    },
    filterModalDoneText: { color: colors.bg, fontSize: 14, fontWeight: "800" },
  });
}
