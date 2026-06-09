import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Animated,
  Easing,
  Linking,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useItinerary } from "@/hooks/useItinerary";
import { useCityInfo } from "@/hooks/useCityInfo";
import { useCityDownload } from "@/hooks/useCityDownload";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ExperienceLevel } from "@/types";
import CountryFlag from "react-native-country-flag";
import { WorldMapModal } from "@/components/WorldMap";
import { SkeletonBox, ItinerarySkeleton } from "@/components/Skeleton";
import { PressableCard, FadeInUp, staggerDelay, PulseGlow } from "@/components/ui";
import { shadowLevel } from "@/utils/shadow";
import { getAnalyticsConsent, setAnalyticsConsent, track } from "@/services/AnalyticsService";
import { LANGUAGE_OPTIONS, languageOption } from "@/i18n";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const DAYS_GAP = 7;
const WALK_MODES = [
  {
    id: "relaxed",
    km: 3,
    labelIt: "Rilassato",
    labelEn: "Relaxed",
    descIt: "Compatto, meno tappe extra",
    descEn: "Compact, fewer extra stops",
    icon: "leaf-outline",
  },
  {
    id: "balanced",
    km: 5,
    labelIt: "Bilanciato",
    labelEn: "Balanced",
    descIt: "Pieno ma gestibile",
    descEn: "Full but manageable",
    icon: "walk-outline",
  },
  {
    id: "intense",
    km: 7,
    labelIt: "Intenso",
    labelEn: "Intense",
    descIt: "Piu tappe e piu margine",
    descEn: "More stops and more range",
    icon: "flash-outline",
  },
] as const;
const ICONIC_MAX_DAYS = 5;
const EXPLORER_MAX_DAYS = 7;
const ONBOARDING_KEY = "wayra_generate_guide_v1";
const RECENT_CITIES_KEY = "wayra_recent_cities_v1";
type GuideStep = { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; target: string };
type GuideRect = { x: number; y: number; width: number; height: number };

// â”€â”€ Dati cittÃ  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const COUNTRIES = [
  { id: "at", label: "Austria", labelEn: "Austria", cities: [{ id: "vienna", label: "Vienna", emoji: "??" }] },
  { id: "be", label: "Belgio", labelEn: "Belgium", cities: [{ id: "bruges", label: "Bruges", emoji: "??" }] },
  { id: "dk", label: "Danimarca", labelEn: "Denmark", cities: [{ id: "copenaghen", label: "Copenaghen", labelEn: "Copenhagen", emoji: "??" }] },
  { id: "fr", label: "Francia", labelEn: "France", cities: [{ id: "parigi", label: "Parigi", labelEn: "Paris", emoji: "??" }, { id: "marsiglia", label: "Marsiglia", labelEn: "Marseille", emoji: "?" }] },
  { id: "de", label: "Germania", labelEn: "Germany", cities: [{ id: "berlino", label: "Berlino", labelEn: "Berlin", emoji: "??" }, { id: "monaco_di_baviera", label: "Monaco di Baviera", labelEn: "Munich", emoji: "??" }, { id: "francoforte", label: "Francoforte", labelEn: "Frankfurt", emoji: "??" }] },
  { id: "gr", label: "Grecia", labelEn: "Greece", cities: [{ id: "atene", label: "Atene", labelEn: "Athens", emoji: "??" }, { id: "candia", label: "Candia", labelEn: "Heraklion", emoji: "??" }] },
  { id: "ie", label: "Irlanda", labelEn: "Ireland", cities: [{ id: "dublino", label: "Dublino", labelEn: "Dublin", emoji: "??" }] },
  { id: "it", label: "Italia", labelEn: "Italy", cities: [{ id: "roma", label: "Roma", labelEn: "Rome", emoji: "???" }, { id: "milano", label: "Milano", labelEn: "Milan", emoji: "??" }, { id: "venezia", label: "Venezia", labelEn: "Venice", emoji: "??" }, { id: "napoli", label: "Napoli", labelEn: "Naples", emoji: "??" }, { id: "firenze", label: "Firenze", labelEn: "Florence", emoji: "??" }] },
  { id: "ma", label: "Marocco", labelEn: "Morocco", cities: [{ id: "marrakech", label: "Marrakech", emoji: "??" }] },
  { id: "nl", label: "Paesi Bassi", labelEn: "Netherlands", cities: [{ id: "amsterdam", label: "Amsterdam", emoji: "??" }] },
  { id: "no", label: "Norvegia", labelEn: "Norway", cities: [{ id: "oslo", label: "Oslo", labelEn: "Oslo", emoji: "???" }, { id: "bergen", label: "Bergen", labelEn: "Bergen", emoji: "??" }] },
  { id: "pl", label: "Polonia", labelEn: "Poland", cities: [{ id: "cracovia", label: "Cracovia", labelEn: "Krakow", emoji: "??" }, { id: "varsavia", label: "Varsavia", labelEn: "Warsaw", emoji: "??" }] },
  { id: "pt", label: "Portogallo", labelEn: "Portugal", cities: [{ id: "lisbona", label: "Lisbona", labelEn: "Lisbon", emoji: "??" }, { id: "porto", label: "Porto", labelEn: "Porto", emoji: "??" }] },
  { id: "gb", label: "Regno Unito", labelEn: "United Kingdom", cities: [{ id: "londra", label: "Londra", labelEn: "London", emoji: "??" }, { id: "edimburgo", label: "Edimburgo", labelEn: "Edinburgh", emoji: "??" }] },
  { id: "cz", label: "Repubblica Ceca", labelEn: "Czech Republic", cities: [{ id: "praga", label: "Praga", labelEn: "Prague", emoji: "??" }] },
  { id: "ro", label: "Romania", labelEn: "Romania", cities: [{ id: "bucarest", label: "Bucarest", labelEn: "Bucharest", emoji: "??" }] },
  { id: "sk", label: "Slovacchia", labelEn: "Slovakia", cities: [{ id: "bratislava", label: "Bratislava", emoji: "??" }] },
  { id: "es", label: "Spagna", labelEn: "Spain", cities: [{ id: "barcellona", label: "Barcellona", labelEn: "Barcelona", emoji: "??" }, { id: "madrid", label: "Madrid", labelEn: "Madrid", emoji: "??" }, { id: "siviglia", label: "Siviglia", labelEn: "Seville", emoji: "??" }, { id: "valencia", label: "Valencia", labelEn: "Valencia", emoji: "??" }] },
  { id: "se", label: "Svezia", labelEn: "Sweden", cities: [{ id: "stoccolma", label: "Stoccolma", labelEn: "Stockholm", emoji: "??" }] },
  { id: "tr", label: "Turchia", labelEn: "Turkey", cities: [{ id: "istanbul", label: "Istanbul", emoji: "??" }, { id: "antalya", label: "Antalya", emoji: "???" }, { id: "mu\u011fla", label: "Mu\u011fla", emoji: "???" }] },
  { id: "hu", label: "Ungheria", labelEn: "Hungary", cities: [{ id: "budapest", label: "Budapest", emoji: "??" }] }
];

const CITIES = COUNTRIES.flatMap((c) => c.cities);
type CityItem = (typeof CITIES)[number];

const emoji = (...points: number[]) => String.fromCodePoint(...points);
const CITY_EMOJI_MAP: Record<string, string> = {
  vienna: emoji(0x1F3B5),
  bruges: emoji(0x1F6A4),
  copenaghen: emoji(0x1F6B2),
  parigi: emoji(0x1F5FC),
  marsiglia: emoji(0x2693),
  berlino: emoji(0x1F43B),
  monaco_di_baviera: emoji(0x1F37A),
  francoforte: emoji(0x1F3E6),
  atene: emoji(0x1F3DB),
  candia: emoji(0x1F3FA),
  dublino: emoji(0x1F340),
  roma: emoji(0x1F3DB, 0xFE0F),
  milano: emoji(0x1F48E),
  venezia: emoji(0x1F6A3),
  napoli: emoji(0x1F355),
  firenze: emoji(0x1F338),
  marrakech: emoji(0x1F334),
  amsterdam: emoji(0x1F6B2),
  oslo: emoji(0x1F3D4, 0xFE0F),
  bergen: emoji(0x1F3A3),
  cracovia: emoji(0x1F985),
  varsavia: emoji(0x2694, 0xFE0F),
  lisbona: emoji(0x1F68B),
  porto: emoji(0x1F377),
  londra: emoji(0x1F3A1),
  edimburgo: emoji(0x1F3F0),
  praga: emoji(0x1F3F0),
  bucarest: emoji(0x1F339),
  bratislava: emoji(0x1F3EF),
  barcellona: emoji(0x1F30A),
  madrid: emoji(0x1F3A8),
  siviglia: emoji(0x1F483),
  valencia: emoji(0x1F34A),
  stoccolma: emoji(0x1F30A),
  istanbul: emoji(0x1F54C),
  antalya: emoji(0x1F3D6, 0xFE0F),
  "mu?la": emoji(0x1F6E5, 0xFE0F),
  "mu??la": emoji(0x1F6E5, 0xFE0F),
  budapest: emoji(0x267E, 0xFE0F),
};

const POPULAR_IDS = ["roma", "parigi", "barcellona", "londra", "amsterdam", "istanbul", "praga", "lisbona"];
const POPULAR_CITIES = POPULAR_IDS.map((id) => CITIES.find((c) => c.id === id)!).filter(Boolean);

// â”€â”€ Onboarding slides â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ONBOARDING_SLIDES_IT: GuideStep[] = [
  {
    icon: "compass-outline",
    target: "header",
    title: "Barra superiore",
    body: "In alto trovi i comandi rapidi: il segnalibro apre gli itinerari salvati, il nome WAYRA cambia tema, il libro riapre questa guida e la bandiera cambia lingua.",
  },
  {
    icon: "location-outline",
    target: "destination",
    title: "Destinazione",
    body: "La prima sezione sceglie la città. Puoi aprire la lista testuale con la ricerca oppure usare la mappa. Senza destinazione non puoi generare o creare un itinerario.",
  },
  {
    icon: "calendar-outline",
    target: "days",
    title: "Numero di giorni",
    body: "La sezione dei giorni mostra solo le durate consentite per la città e l'esperienza selezionata. Se cambi esperienza, il numero massimo può cambiare automaticamente.",
  },
  {
    icon: "sparkles-outline",
    target: "experience",
    title: "Tipo esperienza",
    body: "Iconico crea un viaggio essenziale con le tappe piu rappresentative. Esploratore usa un database piu ampio e puo arrivare a itinerari piu lunghi e ricchi.",
  },
  {
    icon: "walk-outline",
    target: "walk",
    title: "Camminata max",
    body: "Qui scegli il ritmo del viaggio: Rilassato resta piu compatto, Bilanciato riempie meglio la giornata, Intenso aggiunge piu tappe quando restano entro tempo e distanza.",
  },
  {
    icon: "restaurant-outline",
    target: "actions",
    title: "Pulsanti finali",
    body: "Genera costruisce automaticamente giornate, tappe e link Maps. Crea itinerario apre invece la modalità manuale, dove scegli tu ogni tappa.",
  },
  {
    icon: "hourglass-outline",
    target: "none",
    title: "Durante la generazione",
    body: "Quando parte il calcolo, il pannello centrale ti mostra lo stato. L'app prova a rispettare limiti di tempo, musei e distanza, poi apre direttamente il riepilogo dell'itinerario.",
  },
];

const ONBOARDING_SLIDES_EN: GuideStep[] = [
  {
    icon: "compass-outline",
    target: "header",
    title: "Top bar",
    body: "At the top you find quick controls: the bookmark opens saved itineraries, WAYRA changes theme, the book reopens this guide and the flag changes language.",
  },
  {
    icon: "location-outline",
    target: "destination",
    title: "Destination",
    body: "The first section chooses the city. You can open the searchable list or use the map. Without a destination you cannot generate or manually create an itinerary.",
  },
  {
    icon: "calendar-outline",
    target: "days",
    title: "Number of days",
    body: "The days section only shows durations allowed for the selected city and experience. If you change experience, the maximum number can update automatically.",
  },
  {
    icon: "sparkles-outline",
    target: "experience",
    title: "Experience type",
    body: "Iconic creates an essential trip with the most representative stops. Explorer uses a wider database and can produce longer, richer itineraries.",
  },
  {
    icon: "walk-outline",
    target: "walk",
    title: "Max walking",
    body: "Here you choose the trip rhythm: Relaxed stays more compact, Balanced fills the day more evenly, Intense adds more stops when they fit time and distance.",
  },
  {
    icon: "restaurant-outline",
    target: "actions",
    title: "Final buttons",
    body: "Generate automatically builds days, stops and Maps links. Create itinerary opens the manual mode, where you choose every stop yourself.",
  },
  {
    icon: "hourglass-outline",
    target: "none",
    title: "While generating",
    body: "When calculation starts, the central panel shows the status. The app tries to respect time, museum and distance limits, then opens the itinerary summary directly.",
  },
];

// â”€â”€ Messaggi generazione â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const GENERATING_MESSAGES_IT = [
  "Ricerca attrazioni in corso...",
  "Ottimizziamo il percorso...",
  "Selezioniamo i ristoranti...",
  "Aggiunta curiosit\u00e0 locali...",
  "Quasi pronto...",
];

const GENERATING_MESSAGES_EN = [
  "Searching for attractions...",
  "Optimizing the route...",
  "Selecting restaurants...",
  "Adding local insights...",
  "Almost ready...",
];

const GENERATING_MESSAGES_FR = [
  "Recherche des attractions...",
  "Optimisation du parcours...",
  "Sélection des restaurants...",
  "Ajout de conseils locaux...",
  "Presque prêt...",
];

// â”€â”€ Screen principale â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function HomeScreen() {
  const router = useRouter();
  const { generate, cancel, loading, error } = useItinerary();
  const { lang, t, toggle, setLang } = useLanguage();
  const { user } = useAuth();
  const { colors, toggleTheme } = useTheme();
  const { isOnline } = useNetworkStatus();

  const [city, setCity]           = useState<string>("");
  const [numDays, setNumDays]     = useState<number>(3);
  const [level, setLevel]         = useState<ExperienceLevel>(1);
  const [maxWalkKm, setMaxWalkKm] = useState<number>(5);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showWorldMap, setShowWorldMap]     = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings]     = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [genMsgIndex, setGenMsgIndex]       = useState(0);
  const [genSeconds, setGenSeconds]         = useState(0);
  const [recentCityIds, setRecentCityIds]   = useState<string[]>([]);
  const guideTargets = useRef<Map<string, View>>(new Map());

  const genMessages = lang === "en" ? GENERATING_MESSAGES_EN : lang === "fr" ? GENERATING_MESSAGES_FR : GENERATING_MESSAGES_IT;
  const currentLanguage = languageOption(lang);

  // â”€â”€ Controlla se mostrare onboarding â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (!val) setShowOnboarding(true);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_CITIES_KEY)
      .then((value) => {
        if (!value) return;
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) return;
        setRecentCityIds(parsed.filter((id) => typeof id === "string" && CITIES.some((c) => c.id === id)).slice(0, 3));
      })
      .catch((e) => { if (__DEV__) console.warn("[Home] recent cities read failed:", e); });
  }, []);

  useEffect(() => {
    getAnalyticsConsent()
      .then(setAnalyticsEnabled)
      .catch((e) => { if (__DEV__) console.warn("[Home] analytics consent read failed:", e); });
  }, []);

  const dismissOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "done");
    setShowOnboarding(false);
    track("onboarding_completed", { screen: "generate_itinerary" });
  };

  const openSettingsPanel = useCallback(() => {
    setShowSettings(true);
    track("settings_opened", { screen: "home" });
  }, []);

  const handleAnalyticsConsentChange = useCallback(async (enabled: boolean) => {
    setAnalyticsEnabled(enabled);
    await setAnalyticsConsent(enabled);
    if (enabled) track("analytics_consent_updated", { enabled: true });
  }, []);

  const setGuideTarget = useCallback((key: string, ref: View | null) => {
    if (ref) guideTargets.current.set(key, ref);
    else guideTargets.current.delete(key);
  }, []);

  // â”€â”€ Cicla i messaggi durante la generazione â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!loading) { setGenMsgIndex(0); return; }
    setGenMsgIndex(0);
    const id = setInterval(() => {
      setGenMsgIndex((i) => Math.min(i + 1, genMessages.length - 1));
    }, 3000);
    return () => clearInterval(id);
  }, [loading]);

  // â”€â”€ Contatore secondi durante la generazione â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!loading) { setGenSeconds(0); return; }
    setGenSeconds(0);
    const id = setInterval(() => setGenSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [loading]);

  const LEVELS: { id: ExperienceLevel; label: string; subtitle: string; color: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 1,     label: t.iconicLabel,   subtitle: t.iconicSubtitle,   color: "#e8c06a", icon: "star-outline" },
    { id: "mix", label: t.explorerLabel, subtitle: t.explorerSubtitle, color: "#6ee7b7", icon: "compass-outline" },
  ];

  const { loading: cityInfoLoading } = useCityInfo(city);
  // useCityInfo giÃ  applica fallback (5 per iconico, 7 per esploratore) anche senza cittÃ 
  const maxDays = level === 1 ? ICONIC_MAX_DAYS : EXPLORER_MAX_DAYS;
  const availableDays = Array.from({ length: maxDays }, (_, i) => i + 1);

  const daysPerRow = availableDays.length <= 5
    ? availableDays.length
    : Math.max(1, Math.ceil(availableDays.length / 2));
  const daysRow1 = availableDays.slice(0, daysPerRow);
  const daysRow2 = availableDays.slice(daysPerRow);

  useEffect(() => {
    if (numDays > maxDays) setNumDays(maxDays);
  }, [maxDays]);

  // Quando l'utente cambia cittÃ  in modalitÃ  esploratore, porta i giorni
  // selezionati al massimo disponibile per la nuova cittÃ  â€” ma solo dopo
  // che useCityInfo ha caricato i dati reali (evita stale read).
  const prevCityRef = useRef(city);
  useEffect(() => {
    if (prevCityRef.current !== city) {
      prevCityRef.current = city;
      if (level === "mix" && !cityInfoLoading) {
        setNumDays(EXPLORER_MAX_DAYS);
      }
    }
  }, [city, cityInfoLoading, level]);

  const selectedCity = CITIES.find((c) => c.id === city) ?? null;

  const rememberCity = useCallback((id: string) => {
    if (!CITIES.some((c) => c.id === id)) return;
    setRecentCityIds((prev) => {
      const next = [id, ...prev.filter((item) => item !== id)].slice(0, 3);
      AsyncStorage.setItem(RECENT_CITIES_KEY, JSON.stringify(next))
        .catch((e) => { if (__DEV__) console.warn("[Home] recent cities write failed:", e); });
      return next;
    });
  }, []);

  const selectCity = useCallback((id: string) => {
    setCity(id);
    rememberCity(id);
    track("destination_viewed", { city: id });
  }, [rememberCity]);

  function alertNoCitySelected() {
    Alert.alert(
      lang === "it" ? "Nessuna citt\u00e0 selezionata" : "No city selected",
      lang === "it"
        ? "Seleziona una destinazione prima di continuare."
        : "Please select a destination before continuing.",
      [{ text: "OK" }],
    );
  }

  function handleLevelSelect(nextLevel: ExperienceLevel) {
    if (nextLevel === level) return;
    // Quando si passa a iconico e i giorni selezionati superano il massimo, riduci subito.
    // Quando si passa a esploratore, la selezione corrente rimane valida (esploratore ha piÃ¹ giorni);
    // l'utente puÃ² scegliere piÃ¹ giorni autonomamente dalla griglia aggiornata.
    if (nextLevel === "mix") {
      setLevel(nextLevel);
      setNumDays(EXPLORER_MAX_DAYS);
      return;
    }
    if (nextLevel === 1 && numDays > ICONIC_MAX_DAYS) {
      setNumDays(ICONIC_MAX_DAYS);
    }
    setLevel(nextLevel);
  }

  async function handleGenerate() {
    if (!city) { alertNoCitySelected(); return; }
    if (!isOnline) {
      Alert.alert(
        lang === "it" ? "Sei offline" : "You're offline",
        lang === "it"
          ? "Per generare l'itinerario serve una connessione internet. Controlla WiFi o dati mobili e riprova."
          : "An internet connection is required to generate the itinerary. Check WiFi or mobile data and try again.",
        [{ text: "OK" }],
      );
      return;
    }
    const result = await generate({ city, num_days: numDays, level, max_walk_km: maxWalkKm });
    if (!result) return;
    await AsyncStorage.setItem("wayra_pending_itinerary", JSON.stringify(result));
    router.push({ pathname: "/itinerary" });
  }

  function handleCreate() {
    if (!city) { alertNoCitySelected(); return; }
    const cityObj = CITIES.find((c) => c.id === city);
    track("manual_builder_opened", { city, num_days: 1 });
    router.push({
      pathname: "/create-itinerary",
      params: {
        city,
        numDays: "1",
        cityLabel: cityObj ? `${CITY_EMOJI_MAP[cityObj.id] ?? emoji(0x1F4CD)} ${cityObj.label}` : city,
      },
    });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* â”€â”€ Header â”€â”€ */}
      <View ref={(ref) => setGuideTarget("header", ref)} style={styles.header}>
        {/* Sinistra */}
        <TouchableOpacity
          onPress={() => router.push("/saved")}
          activeOpacity={0.7}
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name={user ? "bookmark" : "bookmark-outline"} size={20} color={user ? colors.accentGold : colors.textSub} />
        </TouchableOpacity>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Destra */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowOnboarding(true)}
            activeOpacity={0.7}
            style={[styles.iconBtn, { backgroundColor: colors.accentGold + "14", borderColor: colors.accentGold + "70" }]}
            accessibilityLabel={lang === "en" ? "Open guide" : "Apri guida"}
          >
            <Ionicons name="help-circle-outline" size={23} color={colors.accentGold} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openSettingsPanel}
            activeOpacity={0.7}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            accessibilityLabel={lang === "en" ? "Settings" : "Impostazioni"}
          >
            <Ionicons name="settings-outline" size={19} color={colors.textSub} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggle}
            activeOpacity={0.7}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <CountryFlag isoCode={currentLanguage.flagIso} size={18} />
          </TouchableOpacity>
        </View>

        {/* WAYRA centrato in assoluto â€” box-none: la View non cattura tocchi
            ma TouchableOpacity interno (cambio tema) rimane tappabile */}
        <View style={styles.headerCenter} pointerEvents="box-none">
          <TouchableOpacity onPress={toggleTheme} activeOpacity={0.7}>
            <Text style={[styles.appName, { color: colors.accentGold }]}>WAYRA</Text>
          </TouchableOpacity>
          <Text style={[styles.appSlogan, { color: colors.textMuted }]}>LET THE CITY FIND YOU</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* â”€â”€ Selezione cittÃ  â”€â”€ */}
        <FadeInUp delay={staggerDelay(0)}>
        <View ref={(ref) => setGuideTarget("destination", ref)}>
        <Section title={t.destination} colors={colors}>
          <View style={styles.cityPickerRow}>
            {/* Bottone lista */}
            <TouchableOpacity
              style={[styles.cityPickerBtn, { backgroundColor: colors.inputBg, borderColor: selectedCity ? colors.accentGold : colors.border }]}
              onPress={() => setShowCityPicker(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="search-outline" size={16} color={colors.textMuted} />
              {selectedCity ? (
                <View style={styles.cityPickerSelected}>
                  <CityIcon cityId={selectedCity.id} colors={colors} selected size="sm" />
                  <Text style={[styles.cityPickerLabel, { color: colors.text }]}>
                    {lang === "en" && (selectedCity as any).labelEn ? (selectedCity as any).labelEn : selectedCity.label}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.cityPickerLabel, { color: colors.textSub }]}>
                  {lang === "it" ? "Seleziona una citt\u00e0..." : "Select a city..."}
                </Text>
              )}
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} style={{ marginLeft: "auto" }} />
            </TouchableOpacity>

            {/* Bottone mappa */}
            <TouchableOpacity
              style={[styles.mapBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              onPress={() => setShowWorldMap(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="earth-outline" size={22} color={colors.accentGold} />
            </TouchableOpacity>
          </View>
        </Section>
        </View>
        </FadeInUp>

        {/* â”€â”€ Giorni â”€â”€ */}
        <FadeInUp delay={staggerDelay(1)}>
        <View ref={(ref) => setGuideTarget("days", ref)}>
        <Section title={t.numDays} colors={colors}>
          {cityInfoLoading ? (
            <View style={styles.daysLoading}>
              <View style={{ flexDirection: "row", gap: 7, marginBottom: 7 }}>
                {[...Array(4)].map((_, i) => <SkeletonBox key={i} width={56} height={38} borderRadius={10} />)}
              </View>
              <View style={{ flexDirection: "row", gap: 7 }}>
                {[...Array(4)].map((_, i) => <SkeletonBox key={i} width={56} height={38} borderRadius={10} />)}
              </View>
            </View>
          ) : (
            <View style={styles.daysGrid}>
              <View style={styles.daysRow}>
                {daysRow1.map((d) => (
                  <Option key={d} label={lang === "en" ? `${d}d` : `${d}g`} selected={numDays === d} onPress={() => setNumDays(d)} color={colors.accentBlue} colors={colors} />
                ))}
              </View>
              {daysRow2.length > 0 && (
                <View style={styles.daysRow}>
                  {daysRow2.map((d) => (
                    <Option key={d} label={lang === "en" ? `${d}d` : `${d}g`} selected={numDays === d} onPress={() => setNumDays(d)} color={colors.accentBlue} colors={colors} />
                  ))}
                </View>
              )}
            </View>
          )}
        </Section>
        </View>
        </FadeInUp>

        {/* â”€â”€ Tipo esperienza â”€â”€ */}
        <FadeInUp delay={staggerDelay(2)}>
        <View ref={(ref) => setGuideTarget("experience", ref)}>
        <Section title={t.experienceType} colors={colors}>
          <View style={styles.levelRow}>
            {LEVELS.map((l) => (
              <LevelOption key={String(l.id)} {...l} selected={level === l.id} onPress={() => handleLevelSelect(l.id)} colors={colors} />
            ))}

          </View>
        </Section>
        </View>
        </FadeInUp>

        <FadeInUp delay={staggerDelay(3)}>
        <View ref={(ref) => setGuideTarget("walk", ref)}>
          <Section title={lang === "it" ? "Camminata max" : "Max walking"} colors={colors}>
            <WalkModeSelector
              value={maxWalkKm}
              onChange={setMaxWalkKm}
              lang={lang}
              colors={colors}
            />
          </Section>
        </View>
        </FadeInUp>

        {/* â”€â”€ Banner offline â”€â”€ */}
        {!isOnline && (
          <View style={[styles.errorBox, { backgroundColor: colors.textMuted + "22", borderColor: colors.textMuted + "44" }]}>
            <Ionicons name="cloud-offline-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.errorText, { color: colors.textSub }]}>
              {lang === "it" ? "Sei offline. La generazione richiede una connessione internet." : "You're offline. Generating requires an internet connection."}
            </Text>
          </View>
        )}

        {/* â”€â”€ Errore â”€â”€ */}
        {!!error && (
          <View style={[styles.errorBox, { backgroundColor: colors.danger + "22", borderColor: colors.danger + "44" }]}>
            <Ionicons name="warning-outline" size={16} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

        {/* â”€â”€ CTA â”€â”€ */}
        <FadeInUp delay={staggerDelay(4)}>
        <View ref={(ref) => setGuideTarget("actions", ref)}>
          {/* Wrapper relativo per posizionare PulseGlow dietro al bottone */}
          <View style={styles.ctaWrap}>
            <PulseGlow
              active={!!city && !loading && !cityInfoLoading && isOnline}
              color={colors.accentGold}
              borderRadius={14}
            />
            <PressableCard
              style={[
                styles.cta,
                { backgroundColor: colors.accentGold },
                shadowLevel(3),
                (loading || cityInfoLoading || !isOnline) && styles.ctaDisabled,
              ]}
              onPress={handleGenerate}
              disabled={loading || cityInfoLoading || !isOnline}
              haptic="medium"
              pressScale={0.97}
            >
              <View style={styles.ctaInner}>
                <Ionicons name="sparkles-outline" size={20} color={colors.bg} />
                <Text style={[styles.ctaText, { color: colors.bg }]}>{t.generate}</Text>
              </View>
            </PressableCard>
          </View>

          <Text style={[styles.orDivider, { color: colors.textMuted }]}>
            {lang === "it" ? "o" : "or"}
          </Text>

          <PressableCard
            style={[
              styles.ctaCreate,
              { borderColor: colors.accentGreen + "40", backgroundColor: colors.accentGreen + "10" },
              shadowLevel(2),
              (loading || cityInfoLoading) && styles.ctaDisabled,
            ]}
            onPress={handleCreate}
            disabled={loading || cityInfoLoading}
            haptic="light"
            pressScale={0.97}
          >
            <View style={styles.ctaInner}>
              <Ionicons name="construct-outline" size={20} color={colors.accentGreen} />
              <Text style={[styles.ctaCreateText, { color: colors.accentGreen }]}>
                {lang === "it" ? "Crea itinerario" : "Build itinerary"}
              </Text>
            </View>
          </PressableCard>
        </View>
        </FadeInUp>
      </ScrollView>

      {/* â”€â”€ Modal selezione cittÃ  (lista) â”€â”€ */}
      <CityPickerModal
        visible={showCityPicker}
        selectedId={city}
        lang={lang}
        colors={colors}
        recentCityIds={recentCityIds}
        onSelect={(id) => {
          selectCity(id);
          setShowCityPicker(false);
        }}
        onClose={() => setShowCityPicker(false)}
      />

      {/* â”€â”€ Modal mappa del mondo â”€â”€ */}
      <WorldMapModal
        visible={showWorldMap}
        lang={lang}
        onSelect={(id) => {
          selectCity(id);
          setShowWorldMap(false);
        }}
        onClose={() => setShowWorldMap(false)}
      />

      {/* â”€â”€ Overlay generazione AI â”€â”€ */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.genOverlay}>
          <View style={[styles.genCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.genEmoji}>{emoji(0x2728)}</Text>
            <ActivityIndicator color={colors.accentGold} size="large" style={{ marginVertical: 16 }} />
            <Text style={[styles.genCity, { color: colors.accentGold }]}>
              {selectedCity ? (lang === "en" && (selectedCity as any).labelEn ? (selectedCity as any).labelEn : selectedCity.label) : ""}
            </Text>
            <Text style={[styles.genMessage, { color: colors.textMuted }]}>{genMessages[genMsgIndex]}</Text>
            <View style={styles.genDots}>
              {genMessages.map((_, i) => (
                <View
                  key={i}
                  style={[styles.genDot, { backgroundColor: colors.border }, i === genMsgIndex && { backgroundColor: colors.accentGold, width: 18 }]}
                />
              ))}
            </View>

            {/* Anteprima skeleton itinerario */}
            <ItinerarySkeleton days={numDays >= 2 ? 2 : 1} />

            {/* Contatore secondi */}
            <Text style={[styles.genTimer, { color: genSeconds >= 20 ? colors.danger : colors.textMuted }]}>
              {genSeconds}s{genSeconds >= 20 ? (lang === "it" ? " \u00b7 quasi..." : " \u00b7 almost...") : ""}
            </Text>
            <TouchableOpacity onPress={cancel} style={[styles.genCancel, { borderColor: colors.border }]} activeOpacity={0.7}>
              <Text style={[styles.genCancelText, { color: colors.textMuted }]}>
                {lang === "it" ? "Annulla" : "Cancel"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* â”€â”€ Onboarding â”€â”€ */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <TouchableOpacity
          style={styles.privacyBackdrop}
          activeOpacity={1}
          onPress={() => setShowSettings(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.privacySheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.privacyHeader}>
              <View style={[styles.privacyIconBox, { backgroundColor: colors.accentBlue + "18", borderColor: colors.accentBlue + "55" }]}>
                <Ionicons name="shield-checkmark-outline" size={22} color={colors.accentBlue} />
              </View>
              <View style={styles.privacyTitleWrap}>
                <Text style={[styles.privacyTitle, { color: colors.text }]}>
                  {lang === "en" ? "Settings" : lang === "fr" ? "Paramètres" : "Impostazioni"}
                </Text>
                <Text style={[styles.privacySubtitle, { color: colors.textMuted }]}>
                  {lang === "en"
                    ? "Language, theme and privacy controls."
                    : lang === "fr"
                      ? "Langue, thème et contrôles de confidentialité."
                      : "Lingua, tema e controlli privacy."}
                </Text>
              </View>
            </View>

            <View style={styles.settingsGrid}>
              <View style={[styles.settingsLanguageCard, { backgroundColor: colors.card2, borderColor: colors.border2 }]}>
                <View style={styles.settingsLanguageHeader}>
                  <Ionicons name="language-outline" size={18} color={colors.accentGold} />
                  <View style={styles.settingsActionText}>
                    <Text style={[styles.settingsActionTitle, { color: colors.text }]}>
                      {lang === "en" ? "Language" : lang === "fr" ? "Langue" : "Lingua"}
                    </Text>
                    <Text style={[styles.settingsActionSub, { color: colors.textMuted }]}>
                      {currentLanguage.label}
                    </Text>
                  </View>
                </View>
                <View style={styles.languageChoiceRow}>
                  {LANGUAGE_OPTIONS.map((option) => {
                    const active = option.code === lang;
                    return (
                      <TouchableOpacity
                        key={option.code}
                        onPress={() => setLang(option.code)}
                        activeOpacity={0.82}
                        style={[
                          styles.languageChoice,
                          { backgroundColor: colors.inputBg, borderColor: colors.border },
                          active && { backgroundColor: colors.accentGold + "1f", borderColor: colors.accentGold },
                        ]}
                      >
                        <CountryFlag isoCode={option.flagIso} size={13} />
                        <Text style={[styles.languageChoiceText, { color: active ? colors.accentGold : colors.textSub }]}>
                          {option.shortLabel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.settingsAction, { backgroundColor: colors.card2, borderColor: colors.border2 }]}
                onPress={toggleTheme}
                activeOpacity={0.82}
              >
                <Ionicons name="contrast-outline" size={18} color={colors.accentPurple} />
                <View style={styles.settingsActionText}>
                  <Text style={[styles.settingsActionTitle, { color: colors.text }]}>
                    {lang === "en" ? "Theme" : lang === "fr" ? "Thème" : "Tema"}
                  </Text>
                  <Text style={[styles.settingsActionSub, { color: colors.textMuted }]}>
                    {lang === "en" ? "Switch app look" : lang === "fr" ? "Changer l'apparence" : "Cambia aspetto"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.privacyConsentRow, { backgroundColor: colors.card2, borderColor: colors.border2 }]}>
              <View style={styles.privacyConsentText}>
                <Text style={[styles.privacyConsentTitle, { color: colors.text }]}>
                  {lang === "en" ? "Anonymous analytics" : lang === "fr" ? "Analytics anonymes" : "Analytics anonimi"}
                </Text>
                <Text style={[styles.privacyConsentBody, { color: colors.textSub }]}>
                  {lang === "en"
                    ? "Helps us understand searches, generated trips, maps, PDF exports and saved itineraries. We do not store your exact position or personal notes."
                    : lang === "fr"
                      ? "Nous aide à comprendre les recherches, itinéraires générés, cartes, PDF et sauvegardes. Nous ne stockons pas votre position exacte ni vos notes personnelles."
                    : "Ci aiuta a capire ricerche, itinerari generati, mappe, PDF e salvataggi. Non salviamo posizione precisa o note personali."}
                </Text>
              </View>
              <Switch
                value={analyticsEnabled}
                onValueChange={handleAnalyticsConsentChange}
                trackColor={{ false: colors.border, true: colors.accentBlue + "88" }}
                thumbColor={analyticsEnabled ? colors.accentBlue : colors.textMuted}
              />
            </View>

            <View style={styles.privacyLinksRow}>
              <TouchableOpacity onPress={() => Linking.openURL("https://wayra.app/privacy")} activeOpacity={0.75}>
                <Text style={[styles.privacyLink, { color: colors.accentBlue }]}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={[styles.privacyDot, { color: colors.textMuted }]}>-</Text>
              <TouchableOpacity onPress={() => Linking.openURL("https://wayra.app/terms")} activeOpacity={0.75}>
                <Text style={[styles.privacyLink, { color: colors.accentBlue }]}>
                  {lang === "en" ? "Terms" : lang === "fr" ? "Conditions" : "Termini"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.privacyDoneBtn, { backgroundColor: colors.accentBlue }]}
              onPress={() => setShowSettings(false)}
              activeOpacity={0.85}
            >
              <Text style={[styles.privacyDoneText, { color: colors.bg }]}>
                {lang === "en" ? "Done" : lang === "fr" ? "Terminé" : "Fatto"}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {showOnboarding && (
        <OnboardingModal lang={lang} targetRefs={guideTargets.current} onDone={dismissOnboarding} />
      )}
    </SafeAreaView>
  );
}

// â”€â”€ CityPickerModal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CityPickerModal({
  visible, selectedId, lang, colors, recentCityIds, onSelect, onClose,
}: {
  visible: boolean;
  selectedId: string;
  lang: string;
  colors: any;
  recentCityIds: string[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const searchRef = useRef<TextInput>(null);
  const { isDownloaded, getStatus, downloadCity, confirmDelete } = useCityDownload();

  useEffect(() => {
    if (visible) {
      setSearch("");
      // Auto-espande il paese della cittÃ  selezionata
      if (selectedId) {
        const country = COUNTRIES.find((co) => co.cities.some((ci) => ci.id === selectedId));
        setExpandedCountry(country?.id ?? null);
      } else {
        setExpandedCountry(null);
      }
      // Non forzare il focus automatico: la tastiera si apre solo
    // se l'utente tocca esplicitamente la casella di testo.
    }
  }, [visible]);

  const filteredCountries = search.trim()
    ? COUNTRIES.map((co) => ({
        ...co,
        cities: co.cities.filter((c) =>
          c.label.toLowerCase().includes(search.toLowerCase()) ||
          ((c as any).labelEn ?? "").toLowerCase().includes(search.toLowerCase()),
        ),
      })).filter((co) => co.cities.length > 0)
    : COUNTRIES;

  const isSearching = search.trim().length > 0;
  const recentCities = recentCityIds
    .map((id) => CITIES.find((c) => c.id === id))
    .filter(Boolean) as CityItem[];
  const trackSearch = useCallback(() => {
    const query = search.trim();
    if (!query) return;
    const resultsCount = filteredCountries.reduce((sum, country) => sum + country.cities.length, 0);
    track("search_performed", { query, results_count: resultsCount });
  }, [filteredCountries, search]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.pickerSafe, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.pickerTitle, { color: colors.text }]}>
            {lang === "it" ? "Scegli la citt\u00e0" : "Choose a city"}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.pickerClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={[styles.pickerSearch, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            ref={searchRef}
            style={[styles.pickerSearchInput, { color: colors.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder={lang === "it" ? "Cerca una citt\u00e0..." : "Search a city..."}
            placeholderTextColor={colors.textSub}
            selectionColor={colors.accentGold}
            returnKeyType="search"
            onSubmitEditing={trackSearch}
            clearButtonMode="while-editing"
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {!isSearching && recentCities.length > 0 && (
            <View style={styles.popularSection}>
              <Text style={[styles.popularTitle, { color: colors.textMuted }]}>
                {lang === "it" ? "Ultime cercate" : "Recent searches"}
              </Text>
              <View style={styles.popularGrid}>
                {recentCities.map((c) => {
                  const isSelected = c.id === selectedId;
                  const label = lang === "en" && (c as any).labelEn ? (c as any).labelEn : c.label;
                  const dlDone = getStatus(c.id) === "done";
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.popularChip,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        isSelected && { borderColor: colors.accentGold, backgroundColor: colors.accentGold + "18" },
                        dlDone && !isSelected && { borderColor: colors.accentGreen + "60" },
                      ]}
                      onPress={() => onSelect(c.id)}
                      activeOpacity={0.8}
                    >
                      <CityIcon cityId={c.id} colors={colors} selected={isSelected} size="sm" />
                      <Text style={[styles.popularChipLabel, { color: isSelected ? colors.accentGold : colors.textSub }]}>
                        {label}
                      </Text>
                      {dlDone && (
                        <Ionicons
                          name="cloud-done-outline"
                          size={12}
                          color={colors.accentGreen}
                          style={{ position: "absolute", top: 5, right: 6 }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
          {/* CittÃ  popolari (solo senza ricerca) */}
          {!isSearching && (
            <View style={styles.popularSection}>
              <Text style={[styles.popularTitle, { color: colors.textMuted }]}>
                {lang === "it" ? "Pi\u00f9 cercate" : "Most popular"}
              </Text>
              <View style={styles.popularGrid}>
                {POPULAR_CITIES.map((c) => {
                  const isSelected = c.id === selectedId;
                  const label = lang === "en" && (c as any).labelEn ? (c as any).labelEn : c.label;
                  const dlDone = getStatus(c.id) === "done";
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.popularChip,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        isSelected && { borderColor: colors.accentGold, backgroundColor: colors.accentGold + "18" },
                        dlDone && !isSelected && { borderColor: colors.accentGreen + "60" },
                      ]}
                      onPress={() => onSelect(c.id)}
                      activeOpacity={0.8}
                    >
                      <CityIcon cityId={c.id} colors={colors} selected={isSelected} size="sm" />
                      <Text style={[styles.popularChipLabel, { color: isSelected ? colors.accentGold : colors.textSub }]}>
                        {label}
                      </Text>
                      {dlDone && (
                        <Ionicons
                          name="cloud-done-outline"
                          size={12}
                          color={colors.accentGreen}
                          style={{ position: "absolute", top: 5, right: 6 }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Divisore */}
          {!isSearching && (
            <Text style={[styles.allCitiesLabel, { color: colors.textMuted }]}>
              {lang === "it" ? "Tutte le destinazioni" : "All destinations"}
            </Text>
          )}

          {/* Lista per paese */}
          {filteredCountries.length === 0 ? (
            <Text style={[styles.pickerEmpty, { color: colors.textMuted }]}>
              {lang === "it" ? "Nessuna citt\u00e0 trovata" : "No city found"}
            </Text>
          ) : (
            filteredCountries.map((co) => {
              const isOpen = isSearching || expandedCountry === co.id;
              const countryLabel = lang === "it" ? co.label : co.labelEn;
              return (
                <View key={co.id} style={[styles.countryBlock, { borderColor: colors.border2 }]}>
                  {!isSearching && (
                    <TouchableOpacity
                      style={[styles.countryRow, { backgroundColor: isOpen ? colors.card2 : colors.bg }]}
                      onPress={() => setExpandedCountry(isOpen ? null : co.id)}
                      activeOpacity={0.8}
                    >
                      <CountryFlag isoCode={co.id} size={18} />
                      <Text style={[styles.countryName, { color: colors.textSub }]}>{countryLabel}</Text>
                      <Ionicons
                        name={isOpen ? "chevron-up" : "chevron-down"}
                        size={14}
                        color={colors.textMuted}
                        style={{ marginLeft: "auto" }}
                      />
                    </TouchableOpacity>
                  )}
                  {isOpen && co.cities.map((c) => {
                    const isSelected = c.id === selectedId;
                    const label = lang === "en" && (c as any).labelEn ? (c as any).labelEn : c.label;
                    const dlStatus = getStatus(c.id);
                    const dlDone = dlStatus === "done";
                    const dlBusy = dlStatus === "downloading";
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.cityRow,
                          { borderTopColor: colors.border2, backgroundColor: isSelected ? colors.accentGold + "12" : colors.card2 },
                          !isSearching && { paddingLeft: 42 },
                        ]}
                        onPress={() => onSelect(c.id)}
                        activeOpacity={0.8}
                      >
                        <CityIcon cityId={c.id} colors={colors} selected={isSelected} />
                        <Text style={[styles.cityRowLabel, { color: isSelected ? colors.accentGold : colors.textSub }]}>
                          {label}
                        </Text>
                        {isSearching && (
                          <Text style={[styles.cityRowCountry, { color: colors.textMuted }]}>
                            {lang === "it" ? co.label : co.labelEn}
                          </Text>
                        )}

                        {/* Checkmark selezione */}
                        {isSelected && !dlDone && (
                          <Ionicons name="checkmark-circle" size={18} color={colors.accentGold} style={{ marginLeft: "auto" }} />
                        )}

                        {/* Icona download */}
                        <TouchableOpacity
                          style={[
                            styles.cityDownloadBtn,
                            { marginLeft: isSelected && !dlDone ? 8 : "auto" },
                            dlDone && { backgroundColor: colors.accentGreen + "18" },
                          ]}
                          onPress={() => dlDone
                            ? confirmDelete(c.id, label, lang)
                            : downloadCity(c.id)
                          }
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          activeOpacity={0.7}
                          disabled={dlBusy}
                        >
                          {dlBusy ? (
                            <ActivityIndicator size={14} color={colors.accentGold} />
                          ) : dlDone ? (
                            <Ionicons name="cloud-done-outline" size={17} color={colors.accentGreen} />
                          ) : (
                            <Ionicons name="cloud-download-outline" size={17} color={colors.textMuted} />
                          )}
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// â”€â”€ OnboardingModal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function OnboardingModal({ lang, targetRefs, onDone }: { lang: string; targetRefs: Map<string, View>; onDone: () => void }) {
  const [slide, setSlide] = useState(0);
  const [rect, setRect] = useState<GuideRect | null>(null);
  const [cardHeight, setCardHeight] = useState(270); // stima iniziale, aggiornata da onLayout
  const { colors } = useTheme();

  const slides: GuideStep[] = lang === "en" ? ONBOARDING_SLIDES_EN : ONBOARDING_SLIDES_IT;
  const isLast = slide === slides.length - 1;
  const current = slides[slide];
  const tooltipWidth = Math.min(300, SCREEN_WIDTH - 32);
  const PAD = 6; // padding intorno all'elemento evidenziato

  // Coordinate cutout (elemento evidenziato con padding)
  const cutoutTop    = rect ? Math.max(0,            rect.y - PAD)               : 0;
  const cutoutBottom = rect ? Math.min(SCREEN_HEIGHT, rect.y + rect.height + PAD) : 0;
  const cutoutLeft   = rect ? Math.max(0,            rect.x - PAD)               : 0;
  const cutoutRight  = rect ? Math.min(SCREEN_WIDTH,  rect.x + rect.width + PAD)  : SCREEN_WIDTH;

  // Posizione card: sotto l'elemento se c'Ã¨ spazio, altrimenti sopra
  // SAFE_BOTTOM: 48px tengono conto della safe area + home indicator + respiro visivo
  const SAFE_BOTTOM = 48;
  const fitsBelow = rect
    ? rect.y + rect.height + cardHeight + SAFE_BOTTOM <= SCREEN_HEIGHT
    : false;
  const rawTooltipTop = rect
    ? (fitsBelow
        ? rect.y + rect.height + PAD + 16
        : rect.y - cardHeight - PAD - 16)
    : (SCREEN_HEIGHT - cardHeight) / 2;
  // Clamp: mai sopra il bordo superiore (16px) nÃ© sotto il bordo inferiore (SAFE_BOTTOM)
  const tooltipTop = Math.max(16, Math.min(SCREEN_HEIGHT - cardHeight - SAFE_BOTTOM, rawTooltipTop));
  const tooltipLeft = Math.max(16, Math.min(
    SCREEN_WIDTH - tooltipWidth - 16,
    rect ? rect.x + rect.width / 2 - tooltipWidth / 2 : (SCREEN_WIDTH - tooltipWidth) / 2,
  ));

  useEffect(() => {
    setCardHeight((prev) => Math.max(prev, 400)); // stima conservativa: non scendere sotto 400 per evitare overflow
    const target = targetRefs.get(current.target);
    if (!target) { setRect(null); return; }
    const id = setTimeout(() => {
      target.measureInWindow((x, y, width, height) => {
        setRect({ x, y, width, height });
      });
    }, 80);
    return () => clearTimeout(id);
  }, [current.target, targetRefs]);

  const OV = "#000000d0";

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.tourOverlay}>

        {/* â”€â”€ Overlay con cutout reale â”€â”€ */}
        {rect ? (
          // 4 pannelli scuri che circondano l'elemento, lasciandolo visibile
          <>
            <View pointerEvents="none" style={[styles.cutoutPanel, { top: 0, left: 0, right: 0, height: cutoutTop, backgroundColor: OV }]} />
            <View pointerEvents="none" style={[styles.cutoutPanel, { top: cutoutTop, left: 0, width: cutoutLeft, height: cutoutBottom - cutoutTop, backgroundColor: OV }]} />
            <View pointerEvents="none" style={[styles.cutoutPanel, { top: cutoutTop, left: cutoutRight, right: 0, height: cutoutBottom - cutoutTop, backgroundColor: OV }]} />
            <View pointerEvents="none" style={[styles.cutoutPanel, { top: cutoutBottom, left: 0, right: 0, bottom: 0, backgroundColor: OV }]} />
            {/* Bordo dorato attorno all'elemento */}
            <View pointerEvents="none" style={[styles.tourHighlight, { top: cutoutTop, left: cutoutLeft, width: cutoutRight - cutoutLeft, height: cutoutBottom - cutoutTop, borderColor: colors.accentGold, backgroundColor: colors.accentGold + "14", shadowColor: colors.accentGold }]} />
          </>
        ) : (
          // Nessun target trovato â†’ overlay pieno
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: OV }]} />
        )}

        {/* â”€â”€ Freccia verso l'elemento â”€â”€ */}
        {rect && (
          <View
            pointerEvents="none"
            style={[
              styles.tourArrow,
              {
                left: Math.max(22, Math.min(SCREEN_WIDTH - 22, rect.x + rect.width / 2 - 7)),
                // freccia tra highlight e card: sopra la card se card Ã¨ sotto, sotto la card se Ã¨ sopra
                top: fitsBelow ? tooltipTop - 13 : tooltipTop + cardHeight - 8,
                transform: [{ rotate: fitsBelow ? "180deg" : "0deg" }],
                borderBottomColor: colors.accentGold,
              },
            ]}
          />
        )}

        {/* â”€â”€ Card tooltip â”€â”€ */}
        <View
          style={[styles.tourCard, { top: tooltipTop, left: tooltipLeft, width: tooltipWidth, backgroundColor: colors.card, borderColor: colors.border }]}
          onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
        >
          <Text style={[styles.tourEyebrow, { color: colors.accentGold }]}>{slide + 1} / {slides.length}</Text>
          <View style={[styles.onboardingIconBox, { backgroundColor: colors.accentGold + "18", borderColor: colors.accentGold + "44" }]}>
            <Ionicons name={current.icon} size={28} color={colors.accentGold} />
          </View>
          <Text style={[styles.onboardingTitle, { color: colors.text }]}>{current.title}</Text>
          <Text style={[styles.onboardingBody, { color: colors.textSub }]}>{current.body}</Text>
          <View style={styles.onboardingDots}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.onboardingDot, { backgroundColor: colors.border }, i === slide && { backgroundColor: colors.accentGold, width: 22 }]} />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.onboardingCta, { backgroundColor: colors.accentGold }]}
            onPress={() => isLast ? onDone() : setSlide((s) => s + 1)}
            activeOpacity={0.85}
          >
            <Text style={[styles.onboardingCtaText, { color: colors.bg }]}>
              {isLast
                ? (lang === "it" ? "Inizia il viaggio" : "Start exploring")
                : (lang === "it" ? "Avanti" : "Next")}
            </Text>
          </TouchableOpacity>
          {!isLast && (
            <TouchableOpacity onPress={onDone} style={styles.onboardingSkip} activeOpacity={0.7}>
              <Text style={[styles.onboardingSkipText, { color: colors.textMuted }]}>{lang === "it" ? "Salta" : "Skip"}</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </Modal>
  );
}

// â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={[styles.section, { borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.accentGold }]}>{title}</Text>
      {children}
    </View>
  );
}

function WalkerPose({ color, pose }: { color: string; pose: 0 | 1 | 2 }) {
  const poses = [
    {
      frontArm: "14,10 10.5,13.5 8.5,17.5",
      backArm: "14,10 17,12.8 19,15.8",
      frontLeg: "14.5,16 11,20 9,25",
      backLeg: "14.5,16 16.8,20 20,23.8",
    },
    {
      frontArm: "14,10 11.8,13.5 11.5,17.5",
      backArm: "14,10 16.2,13.5 17,17.3",
      frontLeg: "14.5,16 13,20 11.8,25",
      backLeg: "14.5,16 15.8,19.8 16.7,25",
    },
    {
      frontArm: "14,10 17.5,13.5 19.5,17.5",
      backArm: "14,10 11,12.8 9,15.8",
      frontLeg: "14.5,16 18,20 20,25",
      backLeg: "14.5,16 12.2,20 9,23.8",
    },
  ] as const;
  const p = poses[pose];

  return (
    <Svg width={30} height={30} viewBox="0 0 28 28">
      <Polyline points={p.backArm} fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
      <Polyline points={p.backLeg} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
      <Line x1={14} y1={8.3} x2={14.5} y2={16} stroke={color} strokeWidth={2.6} strokeLinecap="round" />
      <Polyline points={p.frontArm} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points={p.frontLeg} fill="none" stroke={color} strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={14} cy={5} r={3.2} fill={color} />
    </Svg>
  );
}

function CityIcon({
  cityId,
  colors,
  selected = false,
  size = "md",
}: {
  cityId: string;
  colors: any;
  selected?: boolean;
  size?: "sm" | "md";
}) {
  const cityEmoji = CITY_EMOJI_MAP[cityId] ?? emoji(0x1F4CD);
  const isSmall = size === "sm";

  return (
    <View
      style={[
        isSmall ? styles.cityIconBoxSm : styles.cityIconBox,
        {
          backgroundColor: selected ? colors.accentGold + "18" : colors.card,
          borderColor: selected ? colors.accentGold + "55" : colors.border2,
        },
      ]}
    >
      <Text style={isSmall ? styles.cityEmojiSm : styles.cityEmoji}>{cityEmoji}</Text>
    </View>
  );
}

function Option({ label, selected, onPress, color, colors }: {
  label: string; selected: boolean; onPress: () => void; color: string; colors: any;
}) {
  return (
    <PressableCard
      style={[
        styles.option,
        { backgroundColor: colors.card, borderColor: colors.border },
        selected && { borderColor: color, backgroundColor: color + "22" },
        selected && shadowLevel(1),
      ]}
      onPress={onPress}
      haptic="selection"
      pressScale={0.92}
    >
      <Text style={[styles.optionText, { color: colors.textSub }, selected && { color }]}>{label}</Text>
    </PressableCard>
  );
}

function LevelOption({ id, label, subtitle, color, icon, selected, onPress, colors }: {
  id: ExperienceLevel; label: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap;
  color: string; selected: boolean; onPress: () => void; colors: any;
}) {
  return (
    <PressableCard
      style={[
        styles.levelOption,
        { backgroundColor: colors.card, borderColor: colors.border },
        selected && { borderColor: color, backgroundColor: color + "18" },
        selected && shadowLevel(2),
      ]}
      onPress={onPress}
      haptic="light"
      pressScale={0.97}
    >
      <View style={styles.levelContentRow}>
        <View style={[
          styles.levelIconBox,
          { borderColor: selected ? color + "88" : colors.border2, backgroundColor: selected ? color + "18" : colors.inputBg },
        ]}>
          <Ionicons name={icon} size={17} color={selected ? color : colors.textMuted} />
        </View>
        <Text style={[styles.levelLabel, { color: colors.textSub }, selected && { color }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </PressableCard>
  );
}

function WalkModeSelector({
  value, onChange, lang, colors,
}: {
  value: number;
  onChange: (value: number) => void;
  lang: string;
  colors: any;
}) {
  const activeMode = WALK_MODES.find((mode) => mode.km === value) ?? WALK_MODES[1];
  const motion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    motion.setValue(0);
    const duration = activeMode.id === "relaxed" ? 2600 : activeMode.id === "balanced" ? 1800 : 1150;
    const animation = Animated.loop(
      Animated.timing(motion, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [activeMode.id, motion]);

  const iconMotionStyle = {
    opacity: motion.interpolate({
      inputRange: [0, 0.12, 0.86, 1],
      outputRange: [0, 1, 1, 0],
    }),
    transform: [
      { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [-10, 12] }) },
      {
        translateY: activeMode.id === "relaxed"
          ? motion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, -1, 1] })
          : motion.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, -2, 1, -2, 1] }),
      },
      { scale: activeMode.id === "intense" ? 1.08 : 1 },
    ],
  };
  const poseOneOpacity = motion.interpolate({ inputRange: [0, 0.18, 0.36, 0.82, 1], outputRange: [1, 1, 0, 0, 1] });
  const poseTwoOpacity = motion.interpolate({ inputRange: [0, 0.18, 0.36, 0.52, 0.7, 1], outputRange: [0, 0, 1, 1, 0, 0] });
  const poseThreeOpacity = motion.interpolate({ inputRange: [0, 0.5, 0.7, 0.86, 1], outputRange: [0, 0, 1, 1, 0] });
  return (
    <View style={styles.walkCard}>
      <View style={styles.walkTopRow}>
        <View>
          <Text style={[styles.walkValue, { color: colors.accentGold }]}>
            {value} km / {lang === "it" ? "giorno" : "day"}
          </Text>
        </View>
        <View style={styles.walkMotionStage}>
          <View style={[styles.walkRoad, { backgroundColor: colors.border }]} />
          <View style={styles.walkRoadDashes}>
            <View style={[styles.walkRoadDash, { backgroundColor: colors.accentGold + "80" }]} />
            <View style={[styles.walkRoadDash, { backgroundColor: colors.accentGold + "80" }]} />
            <View style={[styles.walkRoadDash, { backgroundColor: colors.accentGold + "80" }]} />
          </View>
          <Animated.View style={[styles.walkIconWrap, iconMotionStyle]}>
            <Animated.View style={[styles.walkerPose, { opacity: poseOneOpacity }]}>
              <WalkerPose color={colors.accentGold} pose={0} />
            </Animated.View>
            <Animated.View style={[styles.walkerPose, { opacity: poseTwoOpacity }]}>
              <WalkerPose color={colors.accentGold} pose={1} />
            </Animated.View>
            <Animated.View style={[styles.walkerPose, { opacity: poseThreeOpacity }]}>
              <WalkerPose color={colors.accentGold} pose={2} />
            </Animated.View>
          </Animated.View>
        </View>
      </View>
      <View style={styles.walkModeRow}>
        {WALK_MODES.map((mode) => {
          const active = value === mode.km;
          const label = lang === "it" ? mode.labelIt : mode.labelEn;
          return (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.walkModeBtn,
                { borderColor: colors.border, backgroundColor: colors.inputBg },
                active && { borderColor: colors.accentGold, backgroundColor: colors.accentGold + "1f" },
              ]}
              onPress={() => onChange(mode.km)}
              activeOpacity={0.8}
            >
              <Ionicons name={mode.icon as any} size={15} color={active ? colors.accentGold : colors.textMuted} />
              <Text style={[styles.walkModeLabel, { color: active ? colors.accentGold : colors.textSub }]} numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerCenter: {
    position: "absolute",
    left: 0, right: 0, top: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  appName: {
    fontSize: 32,
    fontFamily: "BebasNeue_400Regular",
    letterSpacing: 5,
  },
  appSlogan: {
    fontSize: 8,
    fontFamily: "BebasNeue_400Regular",
    letterSpacing: 1.6,
    marginTop: -4,
  },
  flagEmoji: { fontSize: 18 },

  scroll: { paddingHorizontal: 14, paddingBottom: 20, paddingTop: 4, flexGrow: 1, justifyContent: "space-between" },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  // City picker
  cityPickerRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  cityPickerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  cityPickerLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  cityPickerSelected: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  cityIconBox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cityIconBoxSm: {
    width: 24,
    height: 24,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cityEmoji: {
    fontSize: 17,
    lineHeight: 22,
  },
  cityEmojiSm: {
    fontSize: 15,
    lineHeight: 20,
  },
  mapBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  // Days
  daysGrid: { gap: 6, height: 92 },
  daysRow: { flex: 1, minHeight: 40, flexDirection: "row", gap: DAYS_GAP },
  option: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { fontWeight: "700", fontSize: 14, lineHeight: 18 },
  daysLoading: { gap: 6 },

  // Level
  levelRow: {
    flexDirection: "row",
    gap: 8,
  },
  levelOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  levelContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minWidth: 0,
  },
  levelIconBox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  levelDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  levelTextWrap: { flex: 1, gap: 3 },
  levelLabel: { fontWeight: "800", fontSize: 17 },
  levelSub: { fontSize: 11, lineHeight: 15 },

  // Walking
  walkCard: { gap: 10 },
  walkTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  walkMotionStage: {
    width: 54,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  walkRoad: {
    position: "absolute",
    left: 5,
    right: 5,
    bottom: 2,
    height: 8,
    borderRadius: 8,
    opacity: 0.65,
    transform: [{ scaleX: 0.92 }],
  },
  walkRoadDashes: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walkRoadDash: {
    width: 5,
    height: 1.5,
    borderRadius: 2,
  },
  walkIconWrap: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  walkerPose: {
    position: "absolute",
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  walkModeRow: {
    flexDirection: "row",
    gap: 7,
  },
  walkModeBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  walkModeLabel: {
    fontSize: 11,
    fontWeight: "800",
  },
  walkValue: { fontSize: 16, fontWeight: "800" },
  walkMood: { fontSize: 11, fontWeight: "700", marginTop: 1 },
  walkTrack: {
    height: 24,
    justifyContent: "center",
    position: "relative",
  },
  walkHint: { fontSize: 11, lineHeight: 15 },

  // Error
  errorBox: {
    flexDirection: "row",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },

  // CTA
  ctaWrap: { position: "relative" },
  cta: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  ctaCreate: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 0,
    borderWidth: 1.5,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  ctaText: { fontSize: 16, fontWeight: "800" },
  ctaCreateText: { fontSize: 16, fontWeight: "800" },
  orDivider: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "800",
    marginVertical: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // â”€â”€ City Picker Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  pickerSafe: { flex: 1 },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  pickerTitle: { fontSize: 18, fontWeight: "700" },
  pickerClose: { padding: 4 },
  pickerSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerSearchInput: { flex: 1, fontSize: 15, paddingVertical: 2 },
  pickerEmpty: { textAlign: "center", padding: 32, fontSize: 14 },

  popularSection: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  popularTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 },
  popularGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  popularChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  popularChipEmoji: { fontSize: 16 },
  popularChipLabel: { fontSize: 13, fontWeight: "600" },

  allCitiesLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  countryBlock: { borderTopWidth: 1 },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  countryName: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderTopWidth: 1,
  },
  cityRowEmoji: { fontSize: 20 },
  cityRowLabel: { fontSize: 15, fontWeight: "600" },
  cityRowCountry: { fontSize: 12, marginLeft: 4 },
  cityDownloadBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
  },

  // â”€â”€ Generating overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  genOverlay: {
    flex: 1,
    backgroundColor: "#000000cc",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  genCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 36,
    alignItems: "center",
    width: "100%",
    gap: 4,
  },
  genEmoji: { fontSize: 44 },
  genCity: {
    fontSize: 22,
    fontFamily: "BebasNeue_400Regular",
    letterSpacing: 3,
    marginTop: 4,
  },
  genMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 6,
    minHeight: 40,
  },
  genDots: { flexDirection: "row", gap: 6, marginTop: 16 },
  genDot: { width: 6, height: 6, borderRadius: 3 },
  genTimer: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
    letterSpacing: 0.5,
  },
  genCancel: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
  },
  genCancelText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // â”€â”€ Onboarding â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  privacyBackdrop: {
    flex: 1,
    backgroundColor: "#000000b8",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  privacySheet: {
    width: "100%",
    maxWidth: 430,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  privacyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  privacyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  privacyTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  privacyTitle: {
    fontSize: 19,
    fontWeight: "900",
  },
  privacySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  privacyConsentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  settingsGrid: {
    gap: 10,
  },
  settingsAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  settingsLanguageCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  settingsLanguageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  languageChoiceRow: {
    flexDirection: "row",
    gap: 8,
  },
  languageChoice: {
    flex: 1,
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  languageChoiceText: {
    fontSize: 12,
    fontWeight: "900",
  },
  settingsActionText: {
    flex: 1,
    minWidth: 0,
  },
  settingsActionTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  settingsActionSub: {
    fontSize: 12,
    marginTop: 2,
  },
  privacyConsentText: {
    flex: 1,
    minWidth: 0,
  },
  privacyConsentTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 5,
  },
  privacyConsentBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  privacyLinksRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  privacyLink: {
    fontSize: 13,
    fontWeight: "800",
  },
  privacyDot: {
    fontSize: 13,
    fontWeight: "700",
  },
  privacyDoneBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  privacyDoneText: {
    fontSize: 15,
    fontWeight: "900",
  },
  tourOverlay: {
    flex: 1,
    // backgroundColor assente: gestiamo l'overlay con 4 pannelli cutout
  },
  cutoutPanel: {
    position: "absolute",
  },
  tourHighlight: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 16,
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
  },
  tourCard: {
    position: "absolute",
    width: 300,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    alignItems: "center",
    gap: 8,
  },
  tourEyebrow: { fontSize: 11, fontWeight: "800" },
  onboardingIcon: { fontSize: 38, marginBottom: 2 },
  onboardingIconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  onboardingTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 23,
  },
  onboardingBody: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 2,
  },
  onboardingDots: { flexDirection: "row", gap: 5, marginVertical: 5 },
  onboardingDot: { width: 7, height: 7, borderRadius: 4 },
  onboardingCta: {
    marginTop: 5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    minWidth: 170,
    alignItems: "center",
  },
  onboardingCtaText: { fontSize: 16, fontWeight: "800" },
  onboardingSkip: { paddingVertical: 8 },
  onboardingSkipText: { fontSize: 13 },
});
