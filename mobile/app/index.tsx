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
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useItinerary } from "@/hooks/useItinerary";
import { useCityInfo } from "@/hooks/useCityInfo";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ExperienceLevel } from "@/types";
import CountryFlag from "react-native-country-flag";
import { WorldMapModal } from "@/components/WorldMap";
import { SkeletonBox, ItinerarySkeleton } from "@/components/Skeleton";
import { AccountDeletionButton } from "@/components/AccountDeletionButton";
import { PressableCard, FadeInUp, staggerDelay, PulseGlow } from "@/components/ui";
import { shadowLevel } from "@/utils/shadow";
import { cityLabel } from "@/utils/cityLabels";
import { CITIES, CITY_EMOJI_MAP, COUNTRIES, registeredCountryLabel } from "@/data/cityRegistry";
import { getAnalyticsConsent, setAnalyticsConsent, track } from "@/services/AnalyticsService";
import { cacheCityForOffline } from "@/services/cityOfflineCache";
import { useCityDownload, type DownloadStatus } from "@/hooks/useCityDownload";
import { LANGUAGE_OPTIONS, languageOption, localText } from "@/i18n";
import { measureGuideTarget } from "@/utils/guideMeasurement";
import {
  ContextHelpUI,
  contextHelpOutline,
  useContextHelpController,
} from "@/components/ContextHelp";
import { homeContextHelp } from "@/data/homeContextHelp";
import { getTransitNetwork, supportsTransit } from "@/data/transitNetworks";
import {
  clearGenerationRequest,
  createGenerationRequest,
  loadGenerationRequest,
  saveGenerationRequest,
  type GenerationRequest,
} from "@/services/generationRequestStorage";
import { withStorageLock } from "@/services/resilientStorage";
import { openExternalLink } from "@/utils/externalLinks";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const DAYS_GAP = 7;
const WALK_MODES = [
  {
    id: "relaxed",
    km: 3,
    labelIt: "Rilassato",
    labelEn: "Relaxed",
    labelFr: "Détendu",
    labelEs: "Relajado",
    descIt: "Compatto, meno tappe extra",
    descEn: "Compact, fewer extra stops",
    icon: "leaf-outline",
    color: "#6ee7b7",
  },
  {
    id: "balanced",
    km: 5,
    labelIt: "Bilanciato",
    labelEn: "Balanced",
    labelFr: "Équilibré",
    labelEs: "Equilibrado",
    descIt: "Pieno ma gestibile",
    descEn: "Full but manageable",
    icon: "walk-outline",
    color: "#7eb8f7",
  },
  {
    id: "intense",
    km: 7,
    labelIt: "Intenso",
    labelEn: "Intense",
    labelFr: "Intense",
    labelEs: "Intenso",
    descIt: "Più tappe e più margine",
    descEn: "More stops and more range",
    icon: "flash-outline",
    color: "#f97316",
  },
] as const;
const ICONIC_MAX_DAYS = 5;
const EXPLORER_MAX_DAYS = 7;
const ONBOARDING_KEY = "wayra_generate_guide_v2";
const RECENT_CITIES_KEY = "wayra_recent_cities_v1";
const TRANSIT_PRELOAD_WAIT_MS = 4000;
type GuideStep = { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; target: string };
type GuideRect = { x: number; y: number; width: number; height: number };

// Ã¢â€â‚¬Ã¢â€â‚¬ Dati cittÃƒÂ  Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const POPULAR_IDS = ["roma", "parigi", "barcellona", "londra", "amsterdam", "istanbul", "praga", "lisbona"];
const POPULAR_CITIES = POPULAR_IDS.map((id) => CITIES.find((city) => city.id === id)!).filter(Boolean);
type CityItem = (typeof CITIES)[number];
const emoji = (...points: number[]) => String.fromCodePoint(...points);

function homeCityLabel(city: CityItem, lang: string): string {
  return cityLabel(city.id, lang);
}

function homeCountryLabel(country: (typeof COUNTRIES)[number], lang: string): string {
  return registeredCountryLabel(country.id, lang) ?? country.labelEn ?? country.label;
}
const ONBOARDING_SLIDES_IT: GuideStep[] = [
  { icon: "bookmark-outline", target: "saved", title: "Itinerari salvati", body: "Il segnalibro apre i viaggi che hai salvato. Da qui puoi riaprire un itinerario anche dopo aver chiuso l'app." },
  { icon: "contrast-outline", target: "brand", title: "Tema dell'app", body: "Tocca WAYRA per passare dal tema scuro al tema chiaro e viceversa." },
  { icon: "help-circle-outline", target: "guide", title: "Guida", body: "Il punto interrogativo riapre questa spiegazione in qualsiasi momento." },
  { icon: "settings-outline", target: "settings", title: "Impostazioni", body: "L'ingranaggio apre lingua, tema, privacy, account e gestione dei dati offline." },
  { icon: "location-outline", target: "destination", title: "Destinazione", body: "Scegli la citt\u00e0 dalla lista con ricerca oppure dalla mappa. La destinazione \u00e8 necessaria sia per generare sia per creare manualmente un itinerario." },
  { icon: "calendar-outline", target: "days", title: "Numero di giorni", body: "Seleziona la durata del viaggio. Iconico arriva fino a 5 giorni; Esploratore pu\u00f2 mostrare anche 6 e 7 giorni quando disponibili." },
  { icon: "sparkles-outline", target: "experience", title: "Tipo di esperienza", body: "Iconico privilegia le attrazioni imperdibili. Esploratore include anche luoghi ricercati e nascosti per costruire giornate pi\u00f9 ricche." },
  { icon: "walk-outline", target: "walk", title: "Ritmo e camminata", body: "Rilassato limita il percorso a 3 km, Bilanciato a 5 km e Intenso a 7 km al giorno. Il ritmo modifica anche quante tappe vengono inserite." },
  { icon: "git-compare-outline", target: "actions", title: "Genera o crea", body: "Genera itinerario organizza automaticamente giorni, tappe e distanze. Crea itinerario apre l'editor manuale, dove trascini personalmente attrazioni e pasti negli slot." },
  { icon: "hourglass-outline", target: "none", title: "Durante la generazione", body: "Il pannello di caricamento mostra lo stato del calcolo. Wayra controlla durata, musei, distanza e distribuzione delle tappe prima di aprire il riepilogo." },
];

const ONBOARDING_SLIDES_EN: GuideStep[] = [
  { icon: "bookmark-outline", target: "saved", title: "Saved itineraries", body: "The bookmark opens trips you saved, so you can resume them after closing the app." },
  { icon: "contrast-outline", target: "brand", title: "App theme", body: "Tap WAYRA to switch between dark and light themes." },
  { icon: "help-circle-outline", target: "guide", title: "Guide", body: "The question mark reopens this walkthrough at any time." },
  { icon: "settings-outline", target: "settings", title: "Settings", body: "The gear opens language, theme, privacy, account and offline data controls." },
  { icon: "location-outline", target: "destination", title: "Destination", body: "Choose a city from the searchable list or the map. A destination is required for both automatic and manual planning." },
  { icon: "calendar-outline", target: "days", title: "Number of days", body: "Choose the trip length. Iconic supports up to 5 days; Explorer can also offer 6 and 7 days when available." },
  { icon: "sparkles-outline", target: "experience", title: "Experience type", body: "Iconic prioritizes unmissable sights. Explorer also includes curated and hidden places for richer days." },
  { icon: "walk-outline", target: "walk", title: "Pace and walking", body: "Relaxed limits walking to 3 km, Balanced to 5 km and Intense to 7 km per day. Pace also changes how many stops are added." },
  { icon: "git-compare-outline", target: "actions", title: "Generate or create", body: "Generate itinerary organizes days, stops and distances automatically. Create itinerary opens the manual drag-and-drop editor." },
  { icon: "hourglass-outline", target: "none", title: "While generating", body: "The loading panel reports progress while Wayra checks duration, museums, distance and the distribution of stops." },
];

const ONBOARDING_SLIDES_FR: GuideStep[] = [
  { icon: "bookmark-outline", target: "saved", title: "Itin\u00e9raires enregistr\u00e9s", body: "Le signet ouvre les voyages enregistr\u00e9s pour les reprendre apr\u00e8s avoir ferm\u00e9 l'app." },
  { icon: "contrast-outline", target: "brand", title: "Th\u00e8me de l'app", body: "Touchez WAYRA pour passer du th\u00e8me sombre au th\u00e8me clair." },
  { icon: "help-circle-outline", target: "guide", title: "Guide", body: "Le point d'interrogation rouvre cette visite guid\u00e9e \u00e0 tout moment." },
  { icon: "settings-outline", target: "settings", title: "Param\u00e8tres", body: "L'engrenage ouvre la langue, le th\u00e8me, la confidentialit\u00e9, le compte et les donn\u00e9es hors ligne." },
  { icon: "location-outline", target: "destination", title: "Destination", body: "Choisissez la ville dans la liste avec recherche ou sur la carte. Elle est n\u00e9cessaire pour les deux modes de cr\u00e9ation." },
  { icon: "calendar-outline", target: "days", title: "Nombre de jours", body: "Choisissez la dur\u00e9e. Iconique va jusqu'\u00e0 5 jours; Explorateur peut aussi proposer 6 et 7 jours." },
  { icon: "sparkles-outline", target: "experience", title: "Type d'exp\u00e9rience", body: "Iconique privil\u00e9gie les incontournables. Explorateur ajoute aussi des lieux recherch\u00e9s et cach\u00e9s." },
  { icon: "walk-outline", target: "walk", title: "Rythme et marche", body: "D\u00e9tendu limite la marche \u00e0 3 km, \u00c9quilibr\u00e9 \u00e0 5 km et Intense \u00e0 7 km par jour." },
  { icon: "git-compare-outline", target: "actions", title: "G\u00e9n\u00e9rer ou cr\u00e9er", body: "G\u00e9n\u00e9rer organise automatiquement les journ\u00e9es. Cr\u00e9er ouvre l'\u00e9diteur manuel par glisser-d\u00e9poser." },
  { icon: "hourglass-outline", target: "none", title: "Pendant la g\u00e9n\u00e9ration", body: "Le panneau indique la progression pendant que Wayra contr\u00f4le dur\u00e9e, mus\u00e9es, distance et r\u00e9partition des \u00e9tapes." },
];

// Ã¢â€â‚¬Ã¢â€â‚¬ Messaggi generazione Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const ONBOARDING_SLIDES_ES: GuideStep[] = [
  { icon: "bookmark-outline", target: "saved", title: "Itinerarios guardados", body: "El marcador abre los viajes guardados para retomarlos despu\u00e9s de cerrar la app." },
  { icon: "contrast-outline", target: "brand", title: "Tema de la app", body: "Toca WAYRA para cambiar entre el tema oscuro y el claro." },
  { icon: "help-circle-outline", target: "guide", title: "Gu\u00eda", body: "El signo de interrogaci\u00f3n vuelve a abrir esta explicaci\u00f3n en cualquier momento." },
  { icon: "settings-outline", target: "settings", title: "Configuraci\u00f3n", body: "El engranaje abre idioma, tema, privacidad, cuenta y datos sin conexi\u00f3n." },
  { icon: "location-outline", target: "destination", title: "Destino", body: "Elige la ciudad en la lista con buscador o en el mapa. Es necesaria para la planificaci\u00f3n autom\u00e1tica y manual." },
  { icon: "calendar-outline", target: "days", title: "N\u00famero de d\u00edas", body: "Elige la duraci\u00f3n. Ic\u00f3nico llega hasta 5 d\u00edas; Explorador tambi\u00e9n puede ofrecer 6 y 7 d\u00edas." },
  { icon: "sparkles-outline", target: "experience", title: "Tipo de experiencia", body: "Ic\u00f3nico prioriza los imprescindibles. Explorador a\u00f1ade lugares seleccionados y ocultos." },
  { icon: "walk-outline", target: "walk", title: "Ritmo y caminata", body: "Relajado limita la caminata a 3 km, Equilibrado a 5 km e Intenso a 7 km por d\u00eda." },
  { icon: "git-compare-outline", target: "actions", title: "Generar o crear", body: "Generar organiza autom\u00e1ticamente d\u00edas y paradas. Crear abre el editor manual de arrastrar y soltar." },
  { icon: "hourglass-outline", target: "none", title: "Durante la generaci\u00f3n", body: "El panel muestra el progreso mientras Wayra comprueba duraci\u00f3n, museos, distancia y distribuci\u00f3n de las paradas." },
];

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
  "Selection des restaurants...",
  "Ajout de conseils locaux...",
  "Presque pret...",
];

// Ã¢â€â‚¬Ã¢â€â‚¬ Screen principale Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const GENERATING_MESSAGES_ES = ["Buscando atracciones...", "Optimizando la ruta...", "Seleccionando restaurantes...", "Anadiendo recomendaciones locales...", "Casi listo..."];

export default function HomeScreen() {
  const router = useRouter();
  const { generate, cancel, loading, error } = useItinerary();
  const { lang, t, setLang } = useLanguage();
  const { user } = useAuth();
  const { colors, toggleTheme } = useTheme();
  const { isOnline } = useNetworkStatus();
  const { getStatus: getCityDownloadStatus, downloadCity } = useCityDownload();
  const tx = useCallback((values: Record<string, string>) => localText(lang, values), [lang]);

  const [city, setCity]           = useState<string>("");
  const [numDays, setNumDays]     = useState<number>(3);
  const [level, setLevel]         = useState<ExperienceLevel>(1);
  const [maxWalkKm, setMaxWalkKm] = useState<number>(5);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showWorldMap, setShowWorldMap]     = useState(false);
  const [showSettings, setShowSettings]     = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [genMsgIndex, setGenMsgIndex]       = useState(0);
  const [genSeconds, setGenSeconds]         = useState(0);
  const [preparingTrip, setPreparingTrip]   = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [transitPreload, setTransitPreload] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");
  const [recentCityIds, setRecentCityIds]   = useState<string[]>([]);
  const guideTargets = useRef<Map<string, View>>(new Map());
  const guideRootRef = useRef<View>(null);
  const contextHelp = useContextHelpController();
  const activeGenerationRef = useRef<string | null>(null);
  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;

  const genMessages = ({ it: GENERATING_MESSAGES_IT, en: GENERATING_MESSAGES_EN, fr: GENERATING_MESSAGES_FR, es: GENERATING_MESSAGES_ES } as Record<string, string[]>)[lang] ?? GENERATING_MESSAGES_EN;
  const currentLanguage = languageOption(lang);
  const cityPlaceholder = tx({ it: "Seleziona una città...", en: "Select a city...", fr: "Sélectionnez une ville...", es: "Selecciona una ciudad..." });
  const maxWalkTitle = tx({ it: "Camminata max", en: "Max walking", fr: "Marche max", es: "Caminata maxima" });
  const noCityTitle = tx({ it: "Nessuna città selezionata", en: "No city selected", fr: "Aucune ville sélectionnée", es: "Ninguna ciudad seleccionada" });
  const noCityBody = tx({ it: "Seleziona una destinazione prima di continuare.", en: "Select a destination before continuing.", fr: "Sélectionnez une destination avant de continuer.", es: "Selecciona un destino antes de continuar." });
  const homeHelp = homeContextHelp(lang);
  const generationVisible = loading || preparingTrip;
  const displayedGenerationError = generationError || error;

  // Ã¢â€â‚¬Ã¢â€â‚¬ Controlla se mostrare onboarding Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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

  // Ã¢â€â‚¬Ã¢â€â‚¬ Cicla i messaggi durante la generazione Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  useEffect(() => {
    if (!generationVisible) { setGenMsgIndex(0); return; }
    setGenMsgIndex(0);
    const id = setInterval(() => {
      setGenMsgIndex((i) => Math.min(i + 1, genMessages.length - 1));
    }, 3000);
    return () => clearInterval(id);
  }, [generationVisible, genMessages.length]);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Contatore secondi durante la generazione Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  useEffect(() => {
    if (!generationVisible) { setGenSeconds(0); return; }
    setGenSeconds(0);
    const id = setInterval(() => setGenSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [generationVisible]);

  const LEVELS: { id: ExperienceLevel; label: string; subtitle: string; color: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 1,     label: t.iconicLabel,   subtitle: t.iconicSubtitle,   color: "#e8c06a", icon: "star-outline" },
    { id: "mix", label: t.explorerLabel, subtitle: t.explorerSubtitle, color: "#6ee7b7", icon: "compass-outline" },
  ];

  const { loading: cityInfoLoading } = useCityInfo(city);
  // useCityInfo giÃƒÂ  applica fallback (5 per iconico, 7 per esploratore) anche senza cittÃƒÂ 
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

  // Quando l'utente cambia cittÃƒÂ  in modalitÃƒÂ  esploratore, porta i giorni
  // selezionati al massimo disponibile per la nuova cittÃƒÂ  Ã¢â‚¬â€ ma solo dopo
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
    Alert.alert(noCityTitle, noCityBody, [{ text: "OK" }]);
  }

  function handleLevelSelect(nextLevel: ExperienceLevel) {
    if (nextLevel === level) return;
    // Quando si passa a iconico e i giorni selezionati superano il massimo, riduci subito.
    // Quando si passa a esploratore, la selezione corrente rimane valida (esploratore ha piÃƒÂ¹ giorni);
    // l'utente puÃƒÂ² scegliere piÃƒÂ¹ giorni autonomamente dalla griglia aggiornata.
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

  const runGeneration = useCallback(async (request: GenerationRequest) => {
    if (activeGenerationRef.current) return;
    activeGenerationRef.current = request.id;
    const requestId = request.id;
    const requestedCity = request.params.city;
    const shouldPreloadTransit = isOnlineRef.current && supportsTransit(requestedCity);
    setGenerationError(null);
    setPreparingTrip(true);
    setTransitPreload(shouldPreloadTransit ? "loading" : "idle");
    try {
      await saveGenerationRequest(request);
      const transitPromise = shouldPreloadTransit
        ? getTransitNetwork(requestedCity).then((network) => {
            if (activeGenerationRef.current === requestId) {
              setTransitPreload(network ? "ready" : "unavailable");
            }
            return network;
          })
        : Promise.resolve(null);

      const result = await generate(request.params);
      if (activeGenerationRef.current !== requestId) return;
      if (!result) {
        await clearGenerationRequest();
        setGenerationError(tx({
          it: "Non siamo riusciti a preparare questo itinerario. Riprova.",
          en: "We could not prepare this itinerary. Please try again.",
          fr: "Nous n'avons pas pu préparer cet itinéraire. Réessayez.",
          es: "No hemos podido preparar este itinerario. Inténtalo de nuevo.",
        }));
        return;
      }

      const transferred = await withStorageLock("wayra_pending_itinerary", async () => {
        if (activeGenerationRef.current !== requestId) return false;
        await AsyncStorage.setItem("wayra_pending_itinerary", JSON.stringify(result));
        return true;
      });
      if (!transferred || activeGenerationRef.current !== requestId) return;
      void cacheCityForOffline(requestedCity).catch(() => {});

      if (shouldPreloadTransit) {
        await Promise.race([
          transitPromise,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), TRANSIT_PRELOAD_WAIT_MS)),
        ]);
      }
      if (activeGenerationRef.current !== requestId) return;
      await clearGenerationRequest();
      router.push({ pathname: "/itinerary" });
    } catch (cause) {
      if (activeGenerationRef.current !== requestId) return;
      if (__DEV__) console.warn("[Home] generation flow failed:", cause);
      setGenerationError(tx({
        it: "Il viaggio non è stato salvato. Riprova: le tue impostazioni sono ancora qui.",
        en: "The trip was not saved. Try again: your settings are still here.",
        fr: "Le voyage n'a pas été enregistré. Réessayez : vos réglages sont toujours là.",
        es: "El viaje no se ha guardado. Inténtalo de nuevo: tus ajustes siguen aquí.",
      }));
    } finally {
      if (activeGenerationRef.current === requestId) {
        activeGenerationRef.current = null;
        setPreparingTrip(false);
        setTransitPreload("idle");
      }
    }
  }, [generate, router, tx]);

  async function handleGenerate() {
    if (!city) { alertNoCitySelected(); return; }
    if (activeGenerationRef.current) return;
    const request = createGenerationRequest({
      city,
      num_days: numDays,
      level,
      max_walk_km: maxWalkKm,
      language: lang,
    });
    await runGeneration(request);
  }

  const handleCancelGeneration = useCallback(() => {
    activeGenerationRef.current = null;
    cancel();
    setPreparingTrip(false);
    setTransitPreload("idle");
    void clearGenerationRequest().catch(() => {});
    void withStorageLock("wayra_pending_itinerary", () => AsyncStorage.removeItem("wayra_pending_itinerary")).catch(() => {});
  }, [cancel]);

  useEffect(() => {
    let active = true;
    void loadGenerationRequest().then((request) => {
      if (!active || !request || activeGenerationRef.current) return;
      setCity(request.params.city);
      setNumDays(request.params.num_days);
      setLevel(request.params.level);
      setMaxWalkKm(request.params.max_walk_km ?? 5);
      void runGeneration(request);
    });
    return () => {
      active = false;
      activeGenerationRef.current = null;
      cancel();
    };
  }, [cancel, runGeneration]);

  function handleCreate() {
    if (!city) { alertNoCitySelected(); return; }
    const cityObj = CITIES.find((c) => c.id === city);
    track("manual_builder_opened", { city, num_days: numDays });
    router.push({
      pathname: "/create-itinerary",
      params: {
        city,
        numDays: String(numDays),
        cityLabel: cityObj ? `${CITY_EMOJI_MAP[cityObj.id] ?? emoji(0x1F4CD)} ${cityObj.label}` : city,
      },
    });
  }

  return (
    <SafeAreaView ref={guideRootRef} style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Header Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <View collapsable={false} ref={(ref) => setGuideTarget("header", ref)} style={styles.header}>
        {/* Sinistra */}
        <TouchableOpacity
          ref={(ref) => setGuideTarget("saved", ref)}
          onPress={contextHelp.guard(homeHelp.saved, () => router.push("/saved"))}
          activeOpacity={0.7}
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }, contextHelpOutline(contextHelp.active, colors.accentGold)]}
          accessibilityRole="button"
          accessibilityLabel={tx({it:"Itinerari salvati",en:"Saved itineraries",fr:"Itinéraires enregistrés",es:"Itinerarios guardados"})}
          hitSlop={6}
        >
          <Ionicons name={user ? "bookmark" : "bookmark-outline"} size={20} color={user ? colors.accentGold : colors.textSub} />
        </TouchableOpacity>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Destra */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            ref={(ref) => setGuideTarget("guide", ref)}
            onPress={contextHelp.toggle}
            activeOpacity={0.7}
            style={[styles.iconBtn, { backgroundColor: colors.accentGold + "14", borderColor: colors.accentGold + "70" }, contextHelp.active && { backgroundColor: colors.accentGold, borderColor: colors.accentGold }]}
            accessibilityLabel={tx({it:"Apri guida",en:"Open guide",fr:"Ouvrir le guide",es:"Abrir la guía"})}
            accessibilityRole="button"
            accessibilityState={{ expanded: contextHelp.active }}
            hitSlop={6}
          >
            <Ionicons name={contextHelp.active ? "close" : "help-circle-outline"} size={23} color={contextHelp.active ? colors.bg : colors.accentGold} />
          </TouchableOpacity>
          <TouchableOpacity
            ref={(ref) => setGuideTarget("settings", ref)}
            onPress={contextHelp.guard(homeHelp.settings, openSettingsPanel)}
            activeOpacity={0.7}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }, contextHelpOutline(contextHelp.active, colors.accentGold)]}
            accessibilityLabel={tx({it:"Impostazioni",en:"Settings",fr:"Paramètres",es:"Configuración"})}
            accessibilityRole="button"
            hitSlop={6}
          >
            <Ionicons name="settings-outline" size={19} color={colors.textSub} />
          </TouchableOpacity>
        </View>

        {/* WAYRA centrato in assoluto Ã¢â‚¬â€ box-none: la View non cattura tocchi
            ma TouchableOpacity interno (cambio tema) rimane tappabile */}
        <View style={styles.headerCenter} pointerEvents="box-none">
          <TouchableOpacity
            ref={(ref) => setGuideTarget("brand", ref)}
            onPress={contextHelp.guard(homeHelp.brand, toggleTheme)}
            activeOpacity={0.7}
            style={contextHelpOutline(contextHelp.active, colors.accentGold)}
            accessibilityRole="button"
            accessibilityLabel={tx({it:"Cambia tema",en:"Change theme",fr:"Changer de thème",es:"Cambiar tema"})}
          >
            <Text style={[styles.appName, { color: colors.accentGold }]}>WAYRA</Text>
          </TouchableOpacity>
          <Text style={[styles.appSlogan, { color: colors.textMuted }]}>{tx({it:"LASCIA CHE LA CITT\u00c0 TI TROVI",en:"LET THE CITY FIND YOU",fr:"LAISSEZ LA VILLE VOUS TROUVER",es:"DEJA QUE LA CIUDAD TE ENCUENTRE"})}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Selezione cittÃƒÂ  Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <FadeInUp delay={staggerDelay(0)}>
        <View collapsable={false} ref={(ref) => setGuideTarget("destination", ref)}>
        <View style={styles.destinationLayout}>
        <View style={styles.destinationPanel}>
        <Section title={t.destination} colors={colors}>
          <View style={styles.cityPickerRow}>
            {/* Bottone lista */}
            <TouchableOpacity
              style={[styles.cityPickerBtn, { backgroundColor: colors.inputBg, borderColor: selectedCity ? colors.accentGold : colors.border }, contextHelpOutline(contextHelp.active, colors.accentGold)]}
              onPress={contextHelp.guard(homeHelp.cityList, () => setShowCityPicker(true))}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={selectedCity ? homeCityLabel(selectedCity, lang) : cityPlaceholder}
              accessibilityHint={tx({it:"Apre l'elenco delle città",en:"Opens the city list",fr:"Ouvre la liste des villes",es:"Abre la lista de ciudades"})}
            >
              <Ionicons name="search-outline" size={16} color={colors.textMuted} />
              {selectedCity ? (
                <View style={styles.cityPickerSelected}>
                  <CityIcon cityId={selectedCity.id} colors={colors} selected size="sm" />
                  <Text style={[styles.cityPickerLabel, { color: colors.text }]}>
                    {homeCityLabel(selectedCity, lang)}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.cityPickerLabel, { color: colors.textSub }]}>
                  {cityPlaceholder}
                </Text>
              )}
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} style={{ marginLeft: "auto" }} />
            </TouchableOpacity>

            {/* Bottone mappa */}
            <TouchableOpacity
              style={[styles.mapBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }, contextHelpOutline(contextHelp.active, colors.accentGold)]}
              onPress={contextHelp.guard(homeHelp.cityMap, () => setShowWorldMap(true))}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={tx({it:"Scegli dalla mappa",en:"Choose from map",fr:"Choisir sur la carte",es:"Elegir en el mapa"})}
              hitSlop={6}
            >
              <Ionicons name="earth-outline" size={22} color={colors.accentGold} />
            </TouchableOpacity>
          </View>
        </Section>
        </View>

        {/* Valigia smart: fuori dalla sezione Destinazione */}
        <PressableCard
          style={[styles.packingCta, { backgroundColor: colors.card, borderColor: colors.accentPurple + "70" }, contextHelpOutline(contextHelp.active, colors.accentGold)]}
          onPress={contextHelp.guard(homeHelp.packing, () => router.push({
              pathname: "/packing",
              params: {
                days: String(numDays),
              },
          }))}
          haptic="light"
          pressScale={0.94}
          accessibilityLabel={tx({ it: "Apri Valigia smart", en: "Open Smart packing", fr: "Ouvrir la valise intelligente", es: "Abrir Maleta inteligente" })}
          accessibilityHint={tx({ it: "Crea e gestisci la lista delle cose da portare", en: "Create and manage your packing checklist", fr: "Créez et gérez votre liste de voyage", es: "Crea y gestiona tu lista de equipaje" })}
        >
          <MaterialCommunityIcons name="bag-suitcase-outline" size={34} color={colors.accentPurple} />
        </PressableCard>
        </View>
        </View>
        </FadeInUp>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Giorni Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <FadeInUp delay={staggerDelay(1)}>
        <View collapsable={false} ref={(ref) => setGuideTarget("days", ref)}>
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
                  <Option key={d} label={`${d}`} selected={numDays === d} onPress={contextHelp.guard(homeHelp.days, () => setNumDays(d))} color={colors.accentBlue} colors={colors} helpActive={contextHelp.active} />
                ))}
              </View>
              {daysRow2.length > 0 && (
                <View style={styles.daysRow}>
                  {daysRow2.map((d) => (
                    <Option key={d} label={`${d}`} selected={numDays === d} onPress={contextHelp.guard(homeHelp.days, () => setNumDays(d))} color={colors.accentBlue} colors={colors} helpActive={contextHelp.active} />
                  ))}
                </View>
              )}
            </View>
          )}
        </Section>
        </View>
        </FadeInUp>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Tipo esperienza Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <FadeInUp delay={staggerDelay(2)}>
        <View collapsable={false} ref={(ref) => setGuideTarget("experience", ref)}>
        <Section title={t.experienceType} colors={colors}>
          <View style={styles.levelRow}>
            {LEVELS.map((l) => (
              <LevelOption
                key={String(l.id)}
                {...l}
                selected={level === l.id}
                onPress={contextHelp.guard(l.id === 1 ? homeHelp.iconic : homeHelp.explorer, () => handleLevelSelect(l.id))}
                colors={colors}
                helpActive={contextHelp.active}
              />
            ))}

          </View>
        </Section>
        </View>
        </FadeInUp>

        <FadeInUp delay={staggerDelay(3)}>
        <View collapsable={false} ref={(ref) => setGuideTarget("walk", ref)}>
          <Section title={maxWalkTitle} colors={colors}>
            <WalkModeSelector
              value={maxWalkKm}
              onChange={(nextValue) => {
                const help = nextValue === 3 ? homeHelp.relaxed : nextValue === 7 ? homeHelp.intense : homeHelp.balanced;
                if (contextHelp.active) contextHelp.explain(help);
                else setMaxWalkKm(nextValue);
              }}
              lang={lang}
              colors={colors}
              helpActive={contextHelp.active}
            />
          </Section>
        </View>
        </FadeInUp>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Banner offline Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {!isOnline && (
          <View style={[styles.errorBox, { backgroundColor: colors.textMuted + "22", borderColor: colors.textMuted + "44" }]}>
            <Ionicons name="cloud-offline-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.errorText, { color: colors.textSub }]}>
              {tx({it:"Sei offline. Itinerari e contenuti restano disponibili; mappe live e sincronizzazione richiedono internet.",en:"You are offline. Itineraries and content remain available; live maps and sync require internet.",fr:"Vous etes hors ligne. Les itineraires restent disponibles; les cartes en direct et la synchronisation demandent internet.",es:"Estas sin conexion. Los itinerarios siguen disponibles; los mapas en directo y la sincronizacion necesitan internet."})}
            </Text>
          </View>
        )}

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Errore Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {!!displayedGenerationError && (
          <View style={[styles.errorBox, { backgroundColor: colors.danger + "22", borderColor: colors.danger + "44" }]}>
            <Ionicons name="warning-outline" size={16} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{displayedGenerationError}</Text>
          </View>
        )}

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ CTA Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <FadeInUp delay={staggerDelay(4)}>
        <View collapsable={false} ref={(ref) => setGuideTarget("actions", ref)}>
          {/* Wrapper relativo per posizionare PulseGlow dietro al bottone */}
          <View style={styles.ctaWrap}>
            <PulseGlow
              active={!!city && !generationVisible && !cityInfoLoading}
              color={colors.accentGold}
              borderRadius={14}
            />
            <PressableCard
              style={[
                styles.cta,
                { backgroundColor: colors.accentGold },
                shadowLevel(3),
                contextHelpOutline(contextHelp.active, colors.accentGold),
                (generationVisible || cityInfoLoading) && styles.ctaDisabled,
              ]}
              onPress={contextHelp.guard(homeHelp.generate, handleGenerate)}
              disabled={generationVisible || cityInfoLoading}
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
            {tx({it:"o",en:"or",fr:"ou",es:"o"})}
          </Text>

          <PressableCard
            style={[
                styles.ctaCreate,
                { borderColor: colors.accentGreen + "40", backgroundColor: colors.accentGreen + "10" },
                shadowLevel(2),
                contextHelpOutline(contextHelp.active, colors.accentGold),
                (generationVisible || cityInfoLoading) && styles.ctaDisabled,
              ]}
            onPress={contextHelp.guard(homeHelp.create, handleCreate)}
            disabled={generationVisible || cityInfoLoading}
            haptic="light"
            pressScale={0.97}
          >
            <View style={styles.ctaInner}>
              <Ionicons name="construct-outline" size={20} color={colors.accentGreen} />
              <Text style={[styles.ctaCreateText, { color: colors.accentGreen }]}>
                {tx({it:"Crea itinerario",en:"Build itinerary",fr:"Creer l itinerario",es:"Crear itinerario"})}
              </Text>
            </View>
          </PressableCard>
        </View>
        </FadeInUp>

      </ScrollView>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Modal selezione cittÃƒÂ  (lista) Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <CityPickerModal
        visible={showCityPicker}
        selectedId={city}
        lang={lang}
        colors={colors}
        recentCityIds={recentCityIds}
        getDownloadStatus={getCityDownloadStatus}
        onDownload={downloadCity}
        onSelect={(id) => {
          selectCity(id);
          setShowCityPicker(false);
        }}
        onClose={() => setShowCityPicker(false)}
      />

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Modal mappa del mondo Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <WorldMapModal
        visible={showWorldMap}
        lang={lang}
        onSelect={(id) => {
          selectCity(id);
          setShowWorldMap(false);
        }}
        onClose={() => setShowWorldMap(false)}
      />

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Overlay generazione AI Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <Modal visible={generationVisible} transparent animationType="fade">
        <View style={styles.genOverlay}>
          <View style={[styles.genCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.genEmoji}>{emoji(0x2728)}</Text>
            <ActivityIndicator color={colors.accentGold} size="large" style={{ marginVertical: 16 }} />
            <Text style={[styles.genCity, { color: colors.accentGold }]}>
              {selectedCity ? homeCityLabel(selectedCity, lang) : ""}
            </Text>
            <Text style={[styles.genMessage, { color: colors.textMuted }]}>{genMessages[genMsgIndex]}</Text>
            {transitPreload !== "idle" && (
              <View style={[styles.transitPreloadRow, { backgroundColor: colors.card2, borderColor: colors.border2 }]}>
                {transitPreload === "loading" ? (
                  <ActivityIndicator color="#0891b2" size="small" />
                ) : (
                  <Ionicons
                    name={transitPreload === "ready" ? "checkmark-circle" : "cloud-offline-outline"}
                    size={17}
                    color={transitPreload === "ready" ? "#22c55e" : colors.textMuted}
                  />
                )}
                <Text style={[styles.transitPreloadText, { color: colors.textSub }]}>
                  {transitPreload === "loading"
                    ? tx({
                        it: "Prepariamo e salviamo la rete di trasporto...",
                        en: "Preparing and saving the transport network...",
                        fr: "Pr\u00e9paration et enregistrement du r\u00e9seau de transport...",
                        es: "Preparando y guardando la red de transporte...",
                      })
                    : transitPreload === "ready"
                      ? tx({ it: "Rete di trasporto pronta", en: "Transport network ready", fr: "R\u00e9seau de transport pr\u00eat", es: "Red de transporte lista" })
                      : tx({ it: "La rete verr\u00e0 caricata al prossimo accesso", en: "The network will load on the next access", fr: "Le r\u00e9seau sera charg\u00e9 au prochain acc\u00e8s", es: "La red se cargar\u00e1 en el pr\u00f3ximo acceso" })}
                </Text>
              </View>
            )}
            <View style={styles.genDots}>
              {genMessages.map((_, i) => (
                <View
                  key={i}
                  style={[styles.genDot, { backgroundColor: colors.border }, i === genMsgIndex && { backgroundColor: colors.accentGold, width: 18 }]}
                />
              ))}
            </View>

            {/* Anteprima skeleton itinerario */}
            <ItinerarySkeleton days={transitPreload === "loading" ? 1 : (numDays >= 2 ? 2 : 1)} />

            {/* Contatore secondi */}
            <Text style={[styles.genTimer, { color: genSeconds >= 20 ? colors.danger : colors.textMuted }]}>
              {genSeconds}s{genSeconds >= 20 ? (tx({it:" \u00b7 quasi...",en:" \u00b7 almost...",fr:" \u00b7 presque...",es:" \u00b7 casi..."})) : ""}
            </Text>
            <TouchableOpacity onPress={handleCancelGeneration} style={[styles.genCancel, { borderColor: colors.border }]} activeOpacity={0.7}>
              <Text style={[styles.genCancelText, { color: colors.textMuted }]}>
                {tx({it:"Annulla",en:"Cancel",fr:"Annuler",es:"Cancelar"})}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Onboarding Ã¢â€â‚¬Ã¢â€â‚¬ */}
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
                  {tx({it:"Impostazioni",en:"Settings",fr:"Param\u00e8tres",es:"Configuraci\u00f3n"})}
                </Text>
                <Text style={[styles.privacySubtitle, { color: colors.textMuted }]}>
                  {lang === "en"
                    ? "Language, theme and privacy controls."
                    : lang === "fr"
                      ? "Langue, th\u00e8me et contr\u00f4les de confidentialit\u00e9."
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
                      {tx({it:"Lingua",en:"Language",fr:"Langue",es:"Idioma"})}
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
                    {tx({it:"Tema",en:"Theme",fr:"Theme",es:"Tema"})}
                  </Text>
                  <Text style={[styles.settingsActionSub, { color: colors.textMuted }]}>
                    {tx({it:"Cambia aspetto",en:"Switch app look",fr:"Changer l apparence",es:"Cambiar apariencia"})}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.privacyConsentRow, { backgroundColor: colors.card2, borderColor: colors.border2 }]}>
              <View style={styles.privacyConsentText}>
                <Text style={[styles.privacyConsentTitle, { color: colors.text }]}>
                  {tx({it:"Analytics anonimi",en:"Anonymous analytics",fr:"Analytics anonymes",es:"Analiticas anonimas"})}
                </Text>
                <Text style={[styles.privacyConsentBody, { color: colors.textSub }]}>
                  {lang === "en"
                    ? "Helps us understand searches, generated trips, maps, PDF exports and saved itineraries. We do not store your exact position or personal notes."
                    : lang === "fr"
                      ? "Nous aide a comprendre les recherches, itineraires generes, cartes, PDF et sauvegardes. Nous ne stockons pas votre position exacte ni vos notes personnelles."
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
              <TouchableOpacity onPress={() => openExternalLink("https://wayra.app/privacy", lang)} activeOpacity={0.75}>
                <Text style={[styles.privacyLink, { color: colors.accentBlue }]}>
                  {tx({it:"Privacy Policy",en:"Privacy Policy",fr:"Politique de confidentialite",es:"Politica de privacidad"})}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.privacyDot, { color: colors.textMuted }]}>-</Text>
              <TouchableOpacity onPress={() => openExternalLink("https://wayra.app/terms", lang)} activeOpacity={0.75}>
                <Text style={[styles.privacyLink, { color: colors.accentBlue }]}>
                  {tx({it:"Termini",en:"Terms",fr:"Conditions",es:"Terminos"})}
                </Text>
              </TouchableOpacity>
            </View>

            <AccountDeletionButton onDeleted={() => setShowSettings(false)} />

            <TouchableOpacity
              style={[styles.privacyDoneBtn, { backgroundColor: colors.accentBlue }]}
              onPress={() => setShowSettings(false)}
              activeOpacity={0.85}
            >
              <Text style={[styles.privacyDoneText, { color: colors.bg }]}>
                {localText(lang, { it: "Fatto", en: "Done", fr: "Terminé", es: "Listo" })}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ContextHelpUI controller={contextHelp} lang={lang} />
    </SafeAreaView>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ CityPickerModal Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function CityPickerModal({
  visible, selectedId, lang, colors, recentCityIds, getDownloadStatus, onDownload, onSelect, onClose,
}: {
  visible: boolean;
  selectedId: string;
  lang: string;
  colors: any;
  recentCityIds: string[];
  getDownloadStatus: (city: string) => DownloadStatus;
  onDownload: (city: string) => void;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const searchRef = useRef<TextInput>(null);
  const tx = (values: Record<string, string>) => localText(lang, values);

  useEffect(() => {
    if (visible) {
      setSearch("");
      // Auto-espande il paese della cittÃƒÂ  selezionata
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
          homeCityLabel(c, "it").toLowerCase().includes(search.toLowerCase()) ||
          homeCityLabel(c, "en").toLowerCase().includes(search.toLowerCase()) ||
          homeCityLabel(c, "fr").toLowerCase().includes(search.toLowerCase()),
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
            {tx({it:"Scegli la città",en:"Choose a city",fr:"Choisir une ville",es:"Elegir una ciudad"})}
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
            placeholder={tx({it:"Cerca una città...",en:"Search a city...",fr:"Rechercher une ville...",es:"Buscar una ciudad..."})}
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
              {tx({it:"Ultime cercate",en:"Recent searches",fr:"Dernieres recherches",es:"Busquedas recientes"})}
              </Text>
              <View style={styles.popularGrid}>
                {recentCities.map((c) => {
                  const isSelected = c.id === selectedId;
                  const label = homeCityLabel(c, lang);
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.popularChip,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        isSelected && { borderColor: colors.accentGold, backgroundColor: colors.accentGold + "18" },
                      ]}
                      onPress={() => onSelect(c.id)}
                      activeOpacity={0.8}
                    >
                      <CityIcon cityId={c.id} colors={colors} selected={isSelected} size="sm" />
                      <Text style={[styles.popularChipLabel, { color: isSelected ? colors.accentGold : colors.textSub }]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
          {/* CittÃƒÂ  popolari (solo senza ricerca) */}
          {!isSearching && (
            <View style={styles.popularSection}>
              <Text style={[styles.popularTitle, { color: colors.textMuted }]}>
              {tx({it:"Più cercate",en:"Most popular",fr:"Les plus recherchées",es:"Más buscadas"})}
              </Text>
              <View style={styles.popularGrid}>
                {POPULAR_CITIES.map((c) => {
                  const isSelected = c.id === selectedId;
                  const label = homeCityLabel(c, lang);
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.popularChip,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        isSelected && { borderColor: colors.accentGold, backgroundColor: colors.accentGold + "18" },
                      ]}
                      onPress={() => onSelect(c.id)}
                      activeOpacity={0.8}
                    >
                      <CityIcon cityId={c.id} colors={colors} selected={isSelected} size="sm" />
                      <Text style={[styles.popularChipLabel, { color: isSelected ? colors.accentGold : colors.textSub }]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Divisore */}
          {!isSearching && (
            <Text style={[styles.allCitiesLabel, { color: colors.textMuted }]}>
              {tx({it:"Tutte le destinazioni",en:"All destinations",fr:"Toutes les destinations",es:"Todos los destinos"})}
            </Text>
          )}

          {/* Lista per paese */}
          {filteredCountries.length === 0 ? (
            <Text style={[styles.pickerEmpty, { color: colors.textMuted }]}>
              {tx({it:"Nessuna città trovata",en:"No city found",fr:"Aucune ville trouvée",es:"No se encontró ninguna ciudad"})}
            </Text>
          ) : (
            filteredCountries.map((co) => {
              const isOpen = isSearching || expandedCountry === co.id;
              const countryLabel = homeCountryLabel(co, lang);
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
                    const label = homeCityLabel(c, lang);
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
                            {homeCountryLabel(co, lang)}
                          </Text>
                        )}

                        <TouchableOpacity
                          onPress={() => onDownload(c.id)}
                          style={[styles.cityDownloadBtn, { borderColor: colors.border }]}
                          accessibilityRole="button"
                          accessibilityLabel={tx({ it: `Scarica dati offline di ${label}`, en: `Download ${label} for offline use`, fr: `Télécharger ${label} pour une utilisation hors ligne`, es: `Descargar ${label} para usar sin conexión` })}
                        >
                          {getDownloadStatus(c.id) === "downloading" ? (
                            <ActivityIndicator size="small" color={colors.accentBlue} />
                          ) : (
                            <Ionicons
                              name={getDownloadStatus(c.id) === "done" ? "checkmark-circle" : getDownloadStatus(c.id) === "error" ? "refresh-outline" : "cloud-download-outline"}
                              size={18}
                              color={getDownloadStatus(c.id) === "done" ? colors.accentGreen : getDownloadStatus(c.id) === "error" ? colors.danger : colors.accentBlue}
                            />
                          )}
                        </TouchableOpacity>

                        {/* Checkmark selezione */}
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={18} color={colors.accentGold} style={{ marginLeft: "auto" }} />
                        )}
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

// Ã¢â€â‚¬Ã¢â€â‚¬ OnboardingModal Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function OnboardingModal({ lang, targetRefs, rootRef, onDone }: { lang: string; targetRefs: Map<string, View>; rootRef: React.RefObject<View | null>; onDone: () => void }) {
  const [slide, setSlide] = useState(0);
  const [rect, setRect] = useState<GuideRect | null>(null);
  const [cardHeight, setCardHeight] = useState(270); // stima iniziale, aggiornata da onLayout
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const slides: GuideStep[] = (({ it: ONBOARDING_SLIDES_IT, en: ONBOARDING_SLIDES_EN, fr: ONBOARDING_SLIDES_FR, es: ONBOARDING_SLIDES_ES } as Record<string, GuideStep[]>)[lang] ?? ONBOARDING_SLIDES_EN).filter((step) => step.target !== "none");
  const isLast = slide === slides.length - 1;
  const current = slides[slide];
  const tooltipWidth = Math.min(300, SCREEN_WIDTH - 32);
  const PAD = 6; // padding intorno all'elemento evidenziato

  // Coordinate cutout (elemento evidenziato con padding)
  const cutoutTop    = rect ? Math.max(0,            rect.y - PAD)               : 0;
  const cutoutBottom = rect ? Math.min(SCREEN_HEIGHT, rect.y + rect.height + PAD) : 0;
  const cutoutLeft   = rect ? Math.max(0,            rect.x - PAD)               : 0;
  const cutoutRight  = rect ? Math.min(SCREEN_WIDTH,  rect.x + rect.width + PAD)  : SCREEN_WIDTH;

  // Posizione card: sotto l'elemento se c'ÃƒÂ¨ spazio, altrimenti sopra
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
  // Clamp: mai sopra il bordo superiore (16px) nÃƒÂ© sotto il bordo inferiore (SAFE_BOTTOM)
  const tooltipTop = Math.max(16, Math.min(SCREEN_HEIGHT - cardHeight - SAFE_BOTTOM, rawTooltipTop));
  const tooltipLeft = Math.max(16, Math.min(
    SCREEN_WIDTH - tooltipWidth - 16,
    rect ? rect.x + rect.width / 2 - tooltipWidth / 2 : (SCREEN_WIDTH - tooltipWidth) / 2,
  ));

  useEffect(() => {
    setRect(null);
    setCardHeight((prev) => Math.max(prev, 400));
    const target = targetRefs.get(current.target);
    if (!target) return;
    const id = setTimeout(() => {
      measureGuideTarget(target, rootRef.current, insets.top, setRect);
    }, 120);
    return () => clearTimeout(id);
  }, [current.target, insets.top, rootRef, targetRefs]);

  const OV = "#000000d0";

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent navigationBarTranslucent>
      <View style={styles.tourOverlay}>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Overlay con cutout reale Ã¢â€â‚¬Ã¢â€â‚¬ */}
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
          // Nessun target trovato Ã¢â€ â€™ overlay pieno
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: OV }]} />
        )}

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Freccia verso l'elemento Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {rect && (
          <View
            pointerEvents="none"
            style={[
              styles.tourArrow,
              {
                left: Math.max(22, Math.min(SCREEN_WIDTH - 22, rect.x + rect.width / 2 - 7)),
                // freccia tra highlight e card: sopra la card se card ÃƒÂ¨ sotto, sotto la card se ÃƒÂ¨ sopra
                top: fitsBelow ? tooltipTop - 13 : tooltipTop + cardHeight - 8,
                transform: [{ rotate: fitsBelow ? "180deg" : "0deg" }],
                borderBottomColor: colors.accentGold,
              },
            ]}
          />
        )}

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ Card tooltip Ã¢â€â‚¬Ã¢â€â‚¬ */}
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
                ? (lang === "es" ? "Empezar el viaje" : lang === "fr" ? "Commencer le voyage" : lang === "it" ? "Inizia il viaggio" : "Start exploring")
                : (lang === "es" ? "Siguiente" : lang === "fr" ? "Suivant" : lang === "it" ? "Avanti" : "Next")}
            </Text>
          </TouchableOpacity>
          {!isLast && (
            <TouchableOpacity onPress={onDone} style={styles.onboardingSkip} activeOpacity={0.7}>
              <Text style={[styles.onboardingSkipText, { color: colors.textMuted }]}>{lang === "es" ? "Saltar" : lang === "fr" ? "Passer" : lang === "it" ? "Salta" : "Skip"}</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </Modal>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Sub-components Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={[styles.section, { borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.accentGold }]}>{title}</Text>
      {children}
    </View>
  );
}

function WalkerPose({ color, pose }: { color: string; pose: 0 | 1 | 2 | 3 | 4 }) {
  const poses = [
    {
      frontArm: "16,10.5 12.5,14.5 10.5,19",
      backArm: "16,10.5 19,14 21.5,17.5",
      frontLeg: "15.7,17.8 12.2,23 10,30",
      backLeg: "15.7,17.8 19,22.8 22.5,27.5",
    },
    {
      frontArm: "16,10.5 13.2,14.4 12.5,18.8",
      backArm: "16,10.5 18.3,14.2 20,18.5",
      frontLeg: "15.7,17.8 13.2,23 12,29.8",
      backLeg: "15.7,17.8 18,22.5 20,29",
    },
    {
      frontArm: "16,10.5 14,14.5 13.8,19",
      backArm: "16,10.5 18,14.5 18.2,19",
      frontLeg: "15.7,17.8 14.4,23.2 13.8,30",
      backLeg: "15.7,17.8 17.2,23.2 18,30",
    },
    {
      frontArm: "16,10.5 18.8,14.4 19.5,18.8",
      backArm: "16,10.5 13.7,14.2 12,18.5",
      frontLeg: "15.7,17.8 18.2,23 19.5,29.8",
      backLeg: "15.7,17.8 13.4,22.5 11.5,29",
    },
    {
      frontArm: "16,10.5 19.5,14.5 21.5,19",
      backArm: "16,10.5 13,14 10.5,17.5",
      frontLeg: "15.7,17.8 19.2,23 22,30",
      backLeg: "15.7,17.8 12.5,22.8 9,27.5",
    },
  ] as const;
  const p = poses[pose];

  return (
    <Svg width={36} height={38} viewBox="0 0 32 34">
      <Polyline points={p.backArm} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.58} />
      <Polyline points={p.backLeg} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.58} />
      <Line x1={16} y1={8.2} x2={15.7} y2={17.8} stroke={color} strokeWidth={2.8} strokeLinecap="round" />
      <Polyline points={p.frontArm} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points={p.frontLeg} fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={16} cy={4.6} r={3.4} fill={color} />
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

function Option({ label, selected, onPress, color, colors, helpActive = false }: {
  label: string; selected: boolean; onPress: () => void; color: string; colors: any; helpActive?: boolean;
}) {
  return (
    <PressableCard
      style={[
        styles.option,
        { backgroundColor: colors.card, borderColor: colors.border },
        selected && { borderColor: color, backgroundColor: color + "22" },
        selected && shadowLevel(1),
        contextHelpOutline(helpActive, colors.accentGold),
      ]}
      onPress={onPress}
      haptic="selection"
      pressScale={0.92}
    >
      <Text style={[styles.optionText, { color: colors.textSub }, selected && { color }]}>{label}</Text>
    </PressableCard>
  );
}

function AnimatedExperienceIcon({
  id,
  icon,
  color,
  selected,
}: {
  id: ExperienceLevel;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  selected: boolean;
}) {
  const activation = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(activation, {
      toValue: selected ? 1 : 0,
      speed: 18,
      bounciness: selected ? 10 : 0,
      useNativeDriver: true,
    }).start();
  }, [activation, selected]);

  const scale = activation.interpolate({
    inputRange: [0, 0.65, 1],
    outputRange: [1, 1.2, 1],
  });
  const rotate = id === "mix"
    ? activation.interpolate({ inputRange: [0, 1], outputRange: ["-55deg", "0deg"] })
    : "0deg";
  const activeIcon = selected && id === 1 ? "star" : icon;

  return (
    <Animated.View style={{ transform: [{ rotate }, { scale }] }}>
      <Ionicons name={activeIcon} size={18} color={color} />
    </Animated.View>
  );
}

function LevelOption({ id, label, subtitle, color, icon, selected, onPress, colors, helpActive = false }: {
  id: ExperienceLevel; label: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap;
  color: string; selected: boolean; onPress: () => void; colors: any; helpActive?: boolean;
}) {
  return (
    <PressableCard
      style={[
        styles.levelOption,
        { backgroundColor: colors.card, borderColor: colors.border },
        selected && { borderColor: color, backgroundColor: color + "18" },
        selected && shadowLevel(2),
        contextHelpOutline(helpActive, colors.accentGold),
      ]}
      onPress={onPress}
      haptic="light"
      pressScale={0.97}
    >
      <View style={styles.levelContentRow}>
        <View style={[
          styles.levelIconBox,
          { borderColor: selected ? color + "88" : color + "44", backgroundColor: selected ? color + "18" : color + "10" },
        ]}>
          <AnimatedExperienceIcon id={id} icon={icon} color={color} selected={selected} />
        </View>
        <Text style={[styles.levelLabel, { color: colors.textSub }, selected && { color }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </PressableCard>
  );
}

function WalkModeSelector({
  value, onChange, lang, colors, helpActive = false,
}: {
  value: number;
  onChange: (value: number) => void;
  lang: string;
  colors: any;
  helpActive?: boolean;
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
      { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] }) },
      {
        translateY: activeMode.id === "relaxed"
          ? motion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, -1, 1] })
          : motion.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, -2, 1, -2, 1] }),
      },
      { scale: activeMode.id === "intense" ? 1.08 : 1 },
    ],
  };
  const poseOneOpacity = motion.interpolate({ inputRange: [0, 0.1, 0.2, 0.8, 0.9, 1], outputRange: [1, 0.5, 0, 0, 0.5, 1] });
  const poseTwoOpacity = motion.interpolate({ inputRange: [0, 0.2, 0.4, 1], outputRange: [0, 1, 0, 0] });
  const poseThreeOpacity = motion.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 1], outputRange: [0, 0, 1, 0, 0] });
  const poseFourOpacity = motion.interpolate({ inputRange: [0, 0.4, 0.6, 0.8, 1], outputRange: [0, 0, 1, 0, 0] });
  const poseFiveOpacity = motion.interpolate({ inputRange: [0, 0.6, 0.8, 1], outputRange: [0, 0, 1, 0] });
  return (
    <View style={styles.walkCard}>
      <View style={styles.walkTopRow}>
        <View>
          <Text style={[styles.walkValue, { color: colors.accentGold }]}>
            {value} km / {lang === "es" ? "día" : lang === "fr" ? "jour" : lang === "it" ? "giorno" : "day"}
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
            <Animated.View style={[styles.walkerPose, { opacity: poseFourOpacity }]}>
              <WalkerPose color={colors.accentGold} pose={3} />
            </Animated.View>
            <Animated.View style={[styles.walkerPose, { opacity: poseFiveOpacity }]}>
              <WalkerPose color={colors.accentGold} pose={4} />
            </Animated.View>
          </Animated.View>
        </View>
      </View>
      <View style={styles.walkModeRow}>
        {WALK_MODES.map((mode) => {
          const active = value === mode.km;
          const label = lang === "fr" ? mode.labelFr : lang === "es" ? mode.labelEs : lang === "it" ? mode.labelIt : mode.labelEn;
          return (
            <PressableCard
              key={mode.id}
              style={[
                styles.walkModeBtn,
                { borderColor: active ? colors.accentGold : mode.color + "44", backgroundColor: active ? colors.accentGold + "1f" : mode.color + "10" },
                contextHelpOutline(helpActive, colors.accentGold),
              ]}
              onPress={() => onChange(mode.km)}
              haptic="selection"
              pressScale={0.94}
            >
              <Ionicons
                name={(active ? mode.icon.replace("-outline", "") : mode.icon) as keyof typeof Ionicons.glyphMap}
                size={16}
                color={active ? colors.accentGold : mode.color}
              />
              <Text style={[styles.walkModeLabel, { color: active ? colors.accentGold : mode.color }]} numberOfLines={1}>
                {label}
              </Text>
            </PressableCard>
          );
        })}
      </View>
    </View>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Styles Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

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
  destinationLayout: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },
  destinationPanel: { flex: 1, minWidth: 0 },
  cityPickerRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  cityPickerBtn: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 0,
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
    width: 48,
    height: 48,
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
  optionText: { fontWeight: "800", fontSize: 17, lineHeight: 20 },
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
    width: 82,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  walkRoad: {
    position: "absolute",
    left: 3,
    right: 3,
    bottom: 2,
    height: 9,
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
    width: 38,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  walkerPose: {
    position: "absolute",
    width: 38,
    height: 40,
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
  packingCta: {
    width: 58,
    alignSelf: "stretch",
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  orDivider: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "800",
    marginVertical: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Ã¢â€â‚¬Ã¢â€â‚¬ City Picker Modal Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
    width: 34,
    height: 34,
    marginLeft: "auto",
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Ã¢â€â‚¬Ã¢â€â‚¬ Generating overlay Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
  transitPreloadRow: {
    width: "100%",
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  transitPreloadText: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
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

  // Ã¢â€â‚¬Ã¢â€â‚¬ Onboarding Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
