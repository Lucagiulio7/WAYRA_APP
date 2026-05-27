import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useItinerary } from "@/hooks/useItinerary";
import { useCityInfo } from "@/hooks/useCityInfo";
import { useCityDownload } from "@/hooks/useCityDownload";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ExperienceLevel } from "@/types";
import CountryFlag from "react-native-country-flag";
import { WorldMapModal } from "@/components/WorldMap";
import { SkeletonBox, ItinerarySkeleton } from "@/components/Skeleton";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const DAYS_GAP = 7;
const WALK_MODES = [
  { id: "relaxed", km: 3, labelIt: "Rilassato", labelEn: "Relaxed", icon: "leaf-outline" },
  { id: "balanced", km: 5, labelIt: "Bilanciato", labelEn: "Balanced", icon: "walk-outline" },
  { id: "intense", km: 7, labelIt: "Intenso", labelEn: "Intense", icon: "flash-outline" },
] as const;
const ONBOARDING_KEY = "wayra_generate_guide_v1";
type GuideStep = { icon: string; title: string; body: string; target: string };
type GuideRect = { x: number; y: number; width: number; height: number };

// ── Dati città ────────────────────────────────────────────────────────────────

const COUNTRIES = [
  { id: "at", label: "Austria",         labelEn: "Austria",        cities: [{ id: "vienna",             label: "Vienna",           emoji: "🎵" }] },
  { id: "be", label: "Belgio",          labelEn: "Belgium",        cities: [{ id: "bruges",             label: "Bruges",           emoji: "🚤" }] },
  { id: "dk", label: "Danimarca",       labelEn: "Denmark",        cities: [{ id: "copenaghen",         label: "Copenaghen",       labelEn: "Copenhagen", emoji: "🚲" }] },
  { id: "fr", label: "Francia",         labelEn: "France",         cities: [
    { id: "parigi",    label: "Parigi",    labelEn: "Paris",     emoji: "🗼" },
    { id: "marsiglia", label: "Marsiglia", labelEn: "Marseille", emoji: "⚓" },
  ]},
  { id: "de", label: "Germania",        labelEn: "Germany",        cities: [
    { id: "berlino",           label: "Berlino",           labelEn: "Berlin",   emoji: "🐻" },
    { id: "monaco_di_baviera", label: "Monaco di Baviera", labelEn: "Munich",   emoji: "🍺" },
    { id: "francoforte",       label: "Francoforte",       labelEn: "Frankfurt",emoji: "🏦" },
  ]},
  { id: "gr", label: "Grecia",          labelEn: "Greece",         cities: [
    { id: "atene",  label: "Atene",  labelEn: "Athens",    emoji: "🏛" },
    { id: "candia", label: "Candia", labelEn: "Heraklion", emoji: "🏺" },
  ]},
  { id: "ie", label: "Irlanda",         labelEn: "Ireland",        cities: [{ id: "dublino",            label: "Dublino",          labelEn: "Dublin", emoji: "🍀" }] },
  { id: "it", label: "Italia",          labelEn: "Italy",          cities: [
    { id: "roma",    label: "Roma",    labelEn: "Rome",    emoji: "🏛️" },
    { id: "milano",  label: "Milano",  labelEn: "Milan",   emoji: "💎" },
    { id: "venezia", label: "Venezia", labelEn: "Venice",  emoji: "🚣" },
    { id: "napoli",  label: "Napoli",  labelEn: "Naples",  emoji: "🍕" },
    { id: "firenze", label: "Firenze", labelEn: "Florence",emoji: "🌸" },
  ]},
  { id: "ma", label: "Marocco",         labelEn: "Morocco",        cities: [{ id: "marrakech",          label: "Marrakech",        emoji: "🌴" }] },
  { id: "nl", label: "Paesi Bassi",     labelEn: "Netherlands",    cities: [{ id: "amsterdam",          label: "Amsterdam",        emoji: "🚲" }] },
  { id: "no", label: "Norvegia",         labelEn: "Norway",         cities: [
    { id: "oslo",   label: "Oslo",   labelEn: "Oslo",   emoji: "🏔️" },
    { id: "bergen", label: "Bergen", labelEn: "Bergen", emoji: "🎣" },
  ]},
  { id: "pl", label: "Polonia",         labelEn: "Poland",         cities: [
    { id: "cracovia", label: "Cracovia", labelEn: "Krakow", emoji: "🦅" },
    { id: "varsavia", label: "Varsavia", labelEn: "Warsaw", emoji: "⚔️" },
  ]},
  { id: "pt", label: "Portogallo",      labelEn: "Portugal",       cities: [
    { id: "lisbona", label: "Lisbona", labelEn: "Lisbon", emoji: "🚋" },
    { id: "porto",   label: "Porto",   labelEn: "Porto",  emoji: "🍷" },
  ]},
  { id: "gb", label: "Regno Unito",     labelEn: "United Kingdom", cities: [
    { id: "londra",    label: "Londra",    labelEn: "London",    emoji: "🎡" },
    { id: "edimburgo", label: "Edimburgo", labelEn: "Edinburgh", emoji: "🏰" },
  ]},
  { id: "cz", label: "Repubblica Ceca", labelEn: "Czech Republic", cities: [{ id: "praga",              label: "Praga",            labelEn: "Prague",   emoji: "🏰" }] },
  { id: "ro", label: "Romania",         labelEn: "Romania",        cities: [{ id: "bucarest",           label: "Bucarest",         labelEn: "Bucharest",emoji: "🌹" }] },
  { id: "sk", label: "Slovacchia",      labelEn: "Slovakia",       cities: [{ id: "bratislava",         label: "Bratislava",       emoji: "🏯" }] },
  { id: "es", label: "Spagna",          labelEn: "Spain",          cities: [
    { id: "barcellona", label: "Barcellona", labelEn: "Barcelona", emoji: "🌊" },
    { id: "madrid",     label: "Madrid",     labelEn: "Madrid",    emoji: "🎨" },
    { id: "siviglia",   label: "Siviglia",   labelEn: "Seville",   emoji: "💃" },
    { id: "valencia",   label: "Valencia",   labelEn: "Valencia",  emoji: "🍊" },
  ]},
  { id: "se", label: "Svezia",          labelEn: "Sweden",         cities: [{ id: "stoccolma",          label: "Stoccolma",        labelEn: "Stockholm",emoji: "🌊" }] },
  { id: "tr", label: "Turchia",         labelEn: "Turkey",         cities: [
    { id: "istanbul", label: "Istanbul", emoji: "🕌" },
    { id: "antalya",  label: "Antalya",  emoji: "🏖️" },
    { id: "muğla",    label: "Muğla",    emoji: "🛥️" },
  ]},
  { id: "hu", label: "Ungheria",        labelEn: "Hungary",        cities: [{ id: "budapest",           label: "Budapest",         emoji: "♨️" }] },
];

const CITIES = COUNTRIES.flatMap((c) => c.cities);

const POPULAR_IDS = ["roma", "parigi", "barcellona", "londra", "amsterdam", "istanbul", "praga", "lisbona"];
const POPULAR_CITIES = POPULAR_IDS.map((id) => CITIES.find((c) => c.id === id)!).filter(Boolean);

// ── Onboarding slides ─────────────────────────────────────────────────────────

const ONBOARDING_SLIDES_IT = [
  {
    icon: "🧭",
    target: "header",
    title: "Barra superiore",
    body: "In alto trovi i comandi rapidi: il segnalibro apre gli itinerari salvati, il nome WAYRA cambia tema, il libro riapre questa guida e la bandiera cambia lingua.",
  },
  {
    icon: "📍",
    target: "destination",
    title: "Destinazione",
    body: "La prima sezione sceglie la città. Puoi aprire la lista testuale con la ricerca oppure usare la mappa. Senza destinazione non puoi generare o creare un itinerario.",
  },
  {
    icon: "📅",
    target: "days",
    title: "Numero di giorni",
    body: "La sezione dei giorni mostra solo le durate consentite per la città e l'esperienza selezionata. Se cambi esperienza, il numero massimo può cambiare automaticamente.",
  },
  {
    icon: "✨",
    target: "experience",
    title: "Tipo esperienza",
    body: "Iconico crea un viaggio essenziale con le tappe più rappresentative. Esploratore usa un database più ampio e può arrivare a itinerari più lunghi e ricchi.",
  },
  {
    icon: "🚶",
    target: "walk",
    title: "Camminata max",
    body: "Qui scegli una modalità di camminata: Rilassato limita a 3 km al giorno, Bilanciato a 5 km, Intenso a 7 km. Più km danno all'AI più libertà di raggiungere attrazioni migliori ma più distanti.",
  },
  {
    icon: "🍽️",
    target: "actions",
    title: "Pulsanti finali",
    body: "Genera costruisce automaticamente giornate, tappe, ristoranti e link Maps. Crea itinerario apre invece la modalità manuale, dove scegli tu ogni tappa.",
  },
  {
    icon: "🚦",
    target: "none",
    title: "Durante la generazione",
    body: "Quando parte il calcolo, il pannello centrale ti mostra lo stato. L'app prova a rispettare limiti di tempo, musei e distanza, poi apre direttamente il riepilogo dell'itinerario.",
  },
];

const ONBOARDING_SLIDES_EN = [
  {
    icon: "🧭",
    target: "header",
    title: "Top bar",
    body: "At the top you find quick controls: the bookmark opens saved itineraries, WAYRA changes theme, the book reopens this guide and the flag changes language.",
  },
  {
    icon: "📍",
    target: "destination",
    title: "Destination",
    body: "The first section chooses the city. You can open the searchable list or use the map. Without a destination you cannot generate or manually create an itinerary.",
  },
  {
    icon: "📅",
    target: "days",
    title: "Number of days",
    body: "The days section only shows durations allowed for the selected city and experience. If you change experience, the maximum number can update automatically.",
  },
  {
    icon: "✨",
    target: "experience",
    title: "Experience type",
    body: "Iconic creates an essential trip with the most representative stops. Explorer uses a wider database and can produce longer, richer itineraries.",
  },
  {
    icon: "🚶",
    target: "walk",
    title: "Max walking",
    body: "Here you choose a walking mode: Relaxed limits the day to 3 km, Balanced to 5 km and Intense to 7 km. More km gives the AI more freedom to include better attractions that are farther away.",
  },
  {
    icon: "🍽️",
    target: "actions",
    title: "Final buttons",
    body: "Generate automatically builds days, stops, restaurants and Maps links. Build itinerary opens manual mode, where you choose each stop yourself.",
  },
  {
    icon: "🚦",
    target: "none",
    title: "While generating",
    body: "When calculation starts, the central panel shows progress. The app tries to respect time, museum and distance limits, then opens the itinerary summary directly.",
  },
];

// ── Messaggi generazione ──────────────────────────────────────────────────────

const GENERATING_MESSAGES_IT = [
  "Ricerca attrazioni in corso…",
  "Ottimizziamo il percorso…",
  "Selezioniamo i ristoranti…",
  "Aggiunta curiosità locali…",
  "Quasi pronto…",
];

const GENERATING_MESSAGES_EN = [
  "Searching for attractions…",
  "Optimizing the route…",
  "Selecting restaurants…",
  "Adding local insights…",
  "Almost ready…",
];

// ── Screen principale ─────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { generate, cancel, loading, error } = useItinerary();
  const { lang, t, toggle } = useLanguage();
  const { user } = useAuth();
  const { colors, toggleTheme } = useTheme();

  const [city, setCity]           = useState<string>("");
  const [numDays, setNumDays]     = useState<number>(3);
  const [level, setLevel]         = useState<ExperienceLevel>(1);
  const [maxWalkKm, setMaxWalkKm] = useState<number>(5);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showWorldMap, setShowWorldMap]     = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [genMsgIndex, setGenMsgIndex]       = useState(0);
  const [genSeconds, setGenSeconds]         = useState(0);
  const guideTargets = useRef<Map<string, View>>(new Map());

  const genMessages = lang === "en" ? GENERATING_MESSAGES_EN : GENERATING_MESSAGES_IT;

  // ── Controlla se mostrare onboarding ───────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (!val) setShowOnboarding(true);
    });
  }, []);

  const dismissOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "done");
    setShowOnboarding(false);
  };

  const setGuideTarget = (key: string, ref: View | null) => {
    if (ref) guideTargets.current.set(key, ref);
    else guideTargets.current.delete(key);
  };

  // ── Cicla i messaggi durante la generazione ─────────────────────────────────
  useEffect(() => {
    if (!loading) { setGenMsgIndex(0); return; }
    setGenMsgIndex(0);
    const id = setInterval(() => {
      setGenMsgIndex((i) => Math.min(i + 1, genMessages.length - 1));
    }, 3000);
    return () => clearInterval(id);
  }, [loading]);

  // ── Contatore secondi durante la generazione ────────────────────────────────
  useEffect(() => {
    if (!loading) { setGenSeconds(0); return; }
    setGenSeconds(0);
    const id = setInterval(() => setGenSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [loading]);

  const LEVELS: { id: ExperienceLevel; label: string; subtitle: string; color: string }[] = [
    { id: 1,     label: t.iconicLabel,   subtitle: t.iconicSubtitle,   color: "#e8c06a" },
    { id: "mix", label: t.explorerLabel, subtitle: t.explorerSubtitle, color: "#6ee7b7" },
  ];

  const { max_days_iconico, max_days_esploratore, loading: cityInfoLoading } = useCityInfo(city);
  // useCityInfo già applica fallback (5 per iconico, 7 per esploratore) anche senza città
  const maxDays = level === 1 ? max_days_iconico : max_days_esploratore;
  const availableDays = Array.from({ length: maxDays }, (_, i) => i + 1);

  const daysPerRow = availableDays.length <= 5
    ? availableDays.length
    : Math.max(1, Math.ceil(availableDays.length / 2));
  const daysRow1 = availableDays.slice(0, daysPerRow);
  const daysRow2 = availableDays.slice(daysPerRow);

  useEffect(() => {
    if (numDays > maxDays) setNumDays(maxDays);
  }, [maxDays]);

  const selectedCity = CITIES.find((c) => c.id === city) ?? null;

  function alertNoCitySelected() {
    Alert.alert(
      lang === "it" ? "Nessuna città selezionata" : "No city selected",
      lang === "it"
        ? "Seleziona una destinazione prima di continuare."
        : "Please select a destination before continuing.",
      [{ text: "OK" }],
    );
  }

  async function handleGenerate() {
    if (!city) { alertNoCitySelected(); return; }
    const result = await generate({ city, num_days: numDays, level });
    if (result) {
      await AsyncStorage.setItem("wayra_pending_itinerary", JSON.stringify(result));
      router.push({ pathname: "/itinerary" });
    }
  }

  function handleCreate() {
    if (!city) { alertNoCitySelected(); return; }
    const cityObj = CITIES.find((c) => c.id === city);
    router.push({
      pathname: "/create-itinerary",
      params: {
        city,
        numDays: String(numDays),
        cityLabel: cityObj ? `${cityObj.emoji} ${cityObj.label}` : city,
      },
    });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* ── Header ── */}
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
            onPress={toggle}
            activeOpacity={0.7}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={styles.flagEmoji}>{lang === "it" ? "🇮🇹" : "🇬🇧"}</Text>
          </TouchableOpacity>
        </View>

        {/* WAYRA centrato in assoluto — box-none: la View non cattura tocchi
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
        {/* ── Selezione città ── */}
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
                <Text style={[styles.cityPickerLabel, { color: colors.text }]}>
                  {selectedCity.emoji}{"  "}{lang === "en" && (selectedCity as any).labelEn ? (selectedCity as any).labelEn : selectedCity.label}
                </Text>
              ) : (
                <Text style={[styles.cityPickerLabel, { color: colors.textSub }]}>
                  {lang === "it" ? "Seleziona una città…" : "Select a city…"}
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

        {/* ── Giorni ── */}
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

        {/* ── Tipo esperienza ── */}
        <View ref={(ref) => setGuideTarget("experience", ref)}>
        <Section title={t.experienceType} colors={colors}>
          <View style={styles.levelRow}>
            {LEVELS.map((l) => (
              <LevelOption key={String(l.id)} {...l} selected={level === l.id} onPress={() => setLevel(l.id)} colors={colors} />
            ))}

          </View>
        </Section>
        </View>

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

        {/* ── Errore ── */}
        {!!error && (
          <View style={[styles.errorBox, { backgroundColor: colors.danger + "22", borderColor: colors.danger + "44" }]}>
            <Ionicons name="warning-outline" size={16} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

        {/* ── CTA ── */}
        <View ref={(ref) => setGuideTarget("actions", ref)}>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: colors.accentGold }, (loading || cityInfoLoading) && styles.ctaDisabled]}
            onPress={handleGenerate}
            disabled={loading || cityInfoLoading}
            activeOpacity={0.85}
          >
            <View style={styles.ctaInner}>
              <Ionicons name="sparkles-outline" size={20} color={colors.bg} />
              <Text style={[styles.ctaText, { color: colors.bg }]}>{t.generate}</Text>
            </View>
          </TouchableOpacity>

          <Text style={[styles.orDivider, { color: colors.textMuted }]}>
            {lang === "it" ? "o" : "or"}
          </Text>

          <TouchableOpacity
            style={[styles.ctaCreate, { borderColor: colors.accentGreen + "40", backgroundColor: colors.accentGreen + "10" }, (loading || cityInfoLoading) && styles.ctaDisabled]}
            onPress={handleCreate}
            disabled={loading || cityInfoLoading}
            activeOpacity={0.85}
          >
            <View style={styles.ctaInner}>
              <Ionicons name="construct-outline" size={20} color={colors.accentGreen} />
              <Text style={[styles.ctaCreateText, { color: colors.accentGreen }]}>
                {lang === "it" ? "Crea itinerario" : "Build itinerary"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Modal selezione città (lista) ── */}
      <CityPickerModal
        visible={showCityPicker}
        selectedId={city}
        lang={lang}
        colors={colors}
        onSelect={(id) => { setCity(id); setShowCityPicker(false); }}
        onClose={() => setShowCityPicker(false)}
      />

      {/* ── Modal mappa del mondo ── */}
      <WorldMapModal
        visible={showWorldMap}
        lang={lang}
        onSelect={(id) => { setCity(id); setShowWorldMap(false); }}
        onClose={() => setShowWorldMap(false)}
      />

      {/* ── Overlay generazione AI ── */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.genOverlay}>
          <View style={[styles.genCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.genEmoji}>✨</Text>
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
              {genSeconds}s{genSeconds >= 20 ? (lang === "it" ? " · quasi…" : " · almost…") : ""}
            </Text>
            <TouchableOpacity onPress={cancel} style={[styles.genCancel, { borderColor: colors.border }]} activeOpacity={0.7}>
              <Text style={[styles.genCancelText, { color: colors.textMuted }]}>
                {lang === "it" ? "Annulla" : "Cancel"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Onboarding ── */}
      {showOnboarding && (
        <OnboardingModal lang={lang} targetRefs={guideTargets.current} onDone={dismissOnboarding} />
      )}
    </SafeAreaView>
  );
}

// ── CityPickerModal ───────────────────────────────────────────────────────────

function CityPickerModal({
  visible, selectedId, lang, colors, onSelect, onClose,
}: {
  visible: boolean;
  selectedId: string;
  lang: string;
  colors: any;
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
      // Auto-espande il paese della città selezionata
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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.pickerSafe, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.pickerTitle, { color: colors.text }]}>
            {lang === "it" ? "Scegli la città" : "Choose a city"}
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
            placeholder={lang === "it" ? "Cerca una città…" : "Search a city…"}
            placeholderTextColor={colors.textSub}
            selectionColor={colors.accentGold}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {/* Città popolari (solo senza ricerca) */}
          {!isSearching && (
            <View style={styles.popularSection}>
              <Text style={[styles.popularTitle, { color: colors.textMuted }]}>
                {lang === "it" ? "🔥 Più cercate" : "🔥 Most popular"}
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
                      <Text style={styles.popularChipEmoji}>{c.emoji}</Text>
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
              {lang === "it" ? "Nessuna città trovata" : "No city found"}
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
                      <CountryFlag isoCode={co.id.toUpperCase()} size={18} />
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
                        <Text style={styles.cityRowEmoji}>{c.emoji}</Text>
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

// ── OnboardingModal ───────────────────────────────────────────────────────────

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

  // Posizione card: sotto l'elemento se c'è spazio, altrimenti sopra
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
  // Clamp: mai sopra il bordo superiore (16px) né sotto il bordo inferiore (SAFE_BOTTOM)
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

        {/* ── Overlay con cutout reale ── */}
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
          // Nessun target trovato → overlay pieno
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: OV }]} />
        )}

        {/* ── Freccia verso l'elemento ── */}
        {rect && (
          <View
            pointerEvents="none"
            style={[
              styles.tourArrow,
              {
                left: Math.max(22, Math.min(SCREEN_WIDTH - 22, rect.x + rect.width / 2 - 7)),
                // freccia tra highlight e card: sopra la card se card è sotto, sotto la card se è sopra
                top: fitsBelow ? tooltipTop - 13 : tooltipTop + cardHeight - 8,
                transform: [{ rotate: fitsBelow ? "180deg" : "0deg" }],
                borderBottomColor: colors.accentGold,
              },
            ]}
          />
        )}

        {/* ── Card tooltip ── */}
        <View
          style={[styles.tourCard, { top: tooltipTop, left: tooltipLeft, width: tooltipWidth, backgroundColor: colors.card, borderColor: colors.border }]}
          onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
        >
          <Text style={[styles.tourEyebrow, { color: colors.accentGold }]}>{slide + 1} / {slides.length}</Text>
          <Text style={styles.onboardingIcon}>{current.icon}</Text>
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

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={[styles.section, { borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.accentGold }]}>{title}</Text>
      {children}
    </View>
  );
}

function Option({ label, selected, onPress, color, colors }: {
  label: string; selected: boolean; onPress: () => void; color: string; colors: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.option, { backgroundColor: colors.card, borderColor: colors.border }, selected && { borderColor: color, backgroundColor: color + "22" }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.optionText, { color: colors.textSub }, selected && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function LevelOption({ id, label, subtitle, color, selected, onPress, colors }: {
  id: ExperienceLevel; label: string; subtitle: string;
  color: string; selected: boolean; onPress: () => void; colors: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.levelOption, { backgroundColor: colors.card, borderColor: colors.border }, selected && { borderColor: color, backgroundColor: color + "18" }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.levelLabel, { color: colors.textSub }, selected && { color }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
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
  return (
    <View style={styles.walkCard}>
      <View style={styles.walkTopRow}>
        <View>
          <Text style={[styles.walkValue, { color: colors.accentGold }]}>
            {value} km / {lang === "it" ? "giorno" : "day"}
          </Text>
          <Text style={[styles.walkMood, { color: colors.textMuted }]}>
            {lang === "it" ? "Modalità camminata" : "Walking mode"}
          </Text>
        </View>
        <Ionicons name="walk-outline" size={24} color={colors.accentGold} />
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

// ── Styles ────────────────────────────────────────────────────────────────────

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
  mapBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  // Days
  daysGrid: { gap: 6 },
  daysRow: { flexDirection: "row", gap: DAYS_GAP },
  option: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  optionText: { fontWeight: "700", fontSize: 14 },
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

  // ── City Picker Modal ──────────────────────────────────────────────────────
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

  // ── Generating overlay ─────────────────────────────────────────────────────
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

  // ── Onboarding ─────────────────────────────────────────────────────────────
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
