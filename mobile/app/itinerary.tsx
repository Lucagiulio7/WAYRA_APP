import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Linking,
  ActivityIndicator,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
} from "react-native";
import { useFonts, BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import CountryFlag from "react-native-country-flag";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";
import { CityInfo, CultureFact, Food, Itinerary, Neighborhood, Restaurant, Stop } from "@/types";
import { useAttractions, BuilderAttraction } from "@/hooks/useAttractions";
import { useFoodSpots } from "@/hooks/useFoodSpots";
import { useNeighborhoods } from "@/hooks/useNeighborhoods";
import { useCityInfo } from "@/hooks/useCityInfo";
import { DayCard } from "@/components/DayCard";
import { FadeInUp, staggerDelay, PressableCard } from "@/components/ui";
import { DayMap } from "@/components/DayMap";
import { NeighborhoodMap } from "@/components/NeighborhoodMap";
import { FoodCard } from "@/components/FoodCard";
import { PracticalInfoTab } from "@/components/PracticalInfoTab";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSavedItineraries } from "@/hooks/useSavedItineraries";
import { useTheme } from "@/contexts/ThemeContext";
import { cityLabel } from "@/utils/cityLabels";
import AsyncStorage from "@react-native-async-storage/async-storage";

// LayoutAnimation ÃƒÂ¨ disabilitato di default su Android Ã¢â‚¬â€ abilitiamolo per la tab bar
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Tab = "itinerary" | "neighborhoods" | "food" | "culture" | "practical";
type GuideStep = { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; target: string };
type GuideRect = { x: number; y: number; width: number; height: number };
type MealType = "meal";
type MapMode = "itinerary" | "food";
type FoodOrigin = { latitude: number; longitude: number; name?: string };
type FoodSelection = { dayIndex: number; mealType: MealType; origin?: FoodOrigin };

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const ITINERARY_GUIDE_KEY = "wayra_itinerary_guide_v1";
const DAY_ACCENTS = ["#e8c06a", "#7eb8f7", "#a78bfa", "#6ee7b7", "#f97316"];

const ITINERARY_GUIDE_IT: GuideStep[] = [
  {
    icon: "compass-outline",
    target: "header",
    title: "Barra superiore",
    body: "Qui trovi citta, durata e tipo di viaggio. La freccia torna indietro, il segnalibro salva l'itinerario, il punto interrogativo riapre questa guida e la bandiera cambia lingua.",
  },
  {
    icon: "list-outline",
    target: "tabs",
    title: "Sezioni",
    body: "Le tab dividono l'itinerario: giornate, quartieri, cibo, cultura e informazioni pratiche. Toccale per cambiare contenuto senza uscire dalla schermata.",
  },
  {
    icon: "map-outline",
    target: "content",
    title: "Giornate",
    body: "Nella tab Itinerario trovi le schede giorno. Apri un giorno per vedere le tappe, i comandi di modifica, il percorso e i link a Google Maps.",
  },
  {
    icon: "business-outline",
    target: "content",
    title: "Quartieri",
    body: "La sezione Quartieri aiuta a scegliere dove dormire o dove passare piu tempo, con atmosfera, distanze e link utili.",
  },
  {
    icon: "restaurant-outline",
    target: "content",
    title: "Cibo e cultura",
    body: "Cibo raccoglie i consigli gastronomici. Cultura mostra curiosita e note locali per capire meglio la citta durante il viaggio.",
  },
  {
    icon: "information-circle-outline",
    target: "content",
    title: "Info pratiche",
    body: "Info pratiche contiene dati utili come trasporti, sicurezza, app consigliate e link esterni quando disponibili.",
  },
];

const ITINERARY_GUIDE_EN: GuideStep[] = [
  {
    icon: "compass-outline",
    target: "header",
    title: "Top bar",
    body: "Here you find city, duration and travel type. The arrow goes back, the bookmark saves the itinerary, the question mark reopens this guide and the flag changes language.",
  },
  {
    icon: "list-outline",
    target: "tabs",
    title: "Sections",
    body: "Tabs split the itinerary into days, neighborhoods, food, culture and practical info. Tap them to switch content without leaving the screen.",
  },
  {
    icon: "map-outline",
    target: "content",
    title: "Days",
    body: "In the Itinerary tab you find day cards. Open a day to see stops, edit controls, the route and Google Maps links.",
  },
  {
    icon: "business-outline",
    target: "content",
    title: "Neighborhoods",
    body: "Neighborhoods helps you choose where to stay or spend more time, with vibes, distances and useful links.",
  },
  {
    icon: "restaurant-outline",
    target: "content",
    title: "Food and culture",
    body: "Food collects dining recommendations. Culture shows local notes and facts to understand the city better while travelling.",
  },
  {
    icon: "information-circle-outline",
    target: "content",
    title: "Practical info",
    body: "Practical info contains useful data such as transport, safety, recommended apps and external links when available.",
  },
];

// Ã¢â€â‚¬Ã¢â€â‚¬ Mappa vibe_tag Ã¢â€ â€™ emoji + colore Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const VIBE_MAP: Record<string, { emoji: string; color: string; labelIt: string; labelEn: string }> = {
  "centro":          { emoji: "??", color: "#e8c06a", labelIt: "Centrale",          labelEn: "Central" },
  "centrale":        { emoji: "??", color: "#e8c06a", labelIt: "Centrale",          labelEn: "Central" },
  "attrazioni":      { emoji: "???", color: "#9333ea", labelIt: "Vicino attrazioni", labelEn: "Near sights" },
  "vita notturna":   { emoji: "??", color: "#7c3aed", labelIt: "Vita notturna",    labelEn: "Nightlife" },
  "metro":           { emoji: "??", color: "#2563eb", labelIt: "Metro vicina",      labelEn: "Near metro" },
  "trasporti":       { emoji: "??", color: "#2563eb", labelIt: "Ben collegato",     labelEn: "Well connected" },
  "stazione":        { emoji: "??", color: "#2563eb", labelIt: "Stazione",          labelEn: "Station" },
  "tranquillo":      { emoji: "??", color: "#059669", labelIt: "Tranquillo",        labelEn: "Quiet" },
  "budget":          { emoji: "??", color: "#d97706", labelIt: "Budget",            labelEn: "Budget" },
  "lusso":           { emoji: "??", color: "#e8c06a", labelIt: "Lusso",             labelEn: "Luxury" },
  "culturale":       { emoji: "???", color: "#9333ea", labelIt: "Culturale",         labelEn: "Cultural" },
  "mare":            { emoji: "??", color: "#0891b2", labelIt: "Mare",              labelEn: "Sea" },
  "spiaggia":        { emoji: "???", color: "#0891b2", labelIt: "Spiaggia",          labelEn: "Beach" },
  "mercati":         { emoji: "??", color: "#ca8a04", labelIt: "Mercati",           labelEn: "Markets" },
  "famiglie":        { emoji: "????????", color: "#16a34a", labelIt: "Famiglie",          labelEn: "Families" },
  "panoramica":      { emoji: "??", color: "#ea580c", labelIt: "Panoramica",        labelEn: "Scenic" },
  "vista panoramica":{ emoji: "??", color: "#ea580c", labelIt: "Vista panoramica",  labelEn: "Great views" },
  "gastronomia":     { emoji: "???", color: "#dc2626", labelIt: "Gastronomia",       labelEn: "Food scene" },
  "shopping":        { emoji: "???", color: "#db2777", labelIt: "Shopping",          labelEn: "Shopping" },
  "locali":          { emoji: "??", color: "#b45309", labelIt: "Atmosfera locale",  labelEn: "Local vibe" },
  "universita":      { emoji: "??", color: "#4f46e5", labelIt: "Università",        labelEn: "University" },
  "universit?":      { emoji: "??", color: "#4f46e5", labelIt: "Università",        labelEn: "University" },
  "arte":            { emoji: "??", color: "#7c3aed", labelIt: "Arte",              labelEn: "Arts" },
  "sicuro":          { emoji: "???", color: "#16a34a", labelIt: "Sicuro",            labelEn: "Safe" },
  "romantico":       { emoji: "?", color: "#db2777", labelIt: "Romantico",         labelEn: "Romantic" },
  "turistico":       { emoji: "??", color: "#e8c06a", labelIt: "Turistico",         labelEn: "Touristy" },
  "autentico":       { emoji: "??", color: "#b45309", labelIt: "Autentico",         labelEn: "Authentic" },
  "collina":         { emoji: "??", color: "#059669", labelIt: "Collina",           labelEn: "Hill" },
  "porto":           { emoji: "?", color: "#0891b2", labelIt: "Porto",             labelEn: "Harbor" },
};

function normalizeVibeTag(tag: string): string {
  return tag.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function vibeIconName(tag: string): keyof typeof Ionicons.glyphMap {
  const key = normalizeVibeTag(tag);
  if (["centro", "centrale", "attrazioni", "turistico"].includes(key)) return "location-outline";
  if (["vita notturna", "locali"].includes(key)) return "moon-outline";
  if (["metro", "trasporti", "stazione"].includes(key)) return "train-outline";
  if (["tranquillo", "famiglie", "sicuro"].includes(key)) return "shield-checkmark-outline";
  if (["budget"].includes(key)) return "wallet-outline";
  if (["lusso"].includes(key)) return "diamond-outline";
  if (["culturale", "arte"].includes(key)) return "color-palette-outline";
  if (["mare", "spiaggia", "porto"].includes(key)) return "water-outline";
  if (["mercati", "gastronomia"].includes(key)) return "restaurant-outline";
  if (["shopping"].includes(key)) return "bag-outline";
  if (["universita"].includes(key)) return "school-outline";
  if (["panoramica", "vista panoramica", "collina"].includes(key)) return "trail-sign-outline";
  if (["romantico"].includes(key)) return "heart-outline";
  if (["autentico"].includes(key)) return "sparkles-outline";
  return "pricetag-outline";
}

function neighborhoodProsCons(tags: string[] | undefined, lang: string): { pros: string[]; cons: string[] } {
  const set = new Set((tags ?? []).map(normalizeVibeTag));
  const pros: string[] = [];
  const cons: string[] = [];
  const add = (list: string[], value: string) => {
    if (!list.includes(value) && list.length < 2) list.push(value);
  };
  const hasAny = (values: string[]) => values.some((value) => set.has(value));

  const copy = {
    connected: lang === "en" ? "Good transport connections" : "Ben collegata con i trasporti",
    sights: lang === "en" ? "Close to major sights" : "Vicina alle attrazioni principali",
    sea: lang === "en" ? "Convenient for sea or waterfront" : "Comoda per mare o lungomare",
    evening: lang === "en" ? "Strong evening scene" : "Ottima vita serale",
    quiet: lang === "en" ? "Good for quiet stays" : "Adatta a soggiorni tranquilli",
    food: lang === "en" ? "Good local food scene" : "Buona scena gastronomica locale",
    value: lang === "en" ? "Usually more accessible prices" : "Prezzi spesso più accessibili",
    services: lang === "en" ? "High-end services and hotels" : "Servizi e hotel di fascia alta",
    crowds: lang === "en" ? "Can be busier and pricier" : "Può essere più affollata e costosa",
    noisy: lang === "en" ? "Can be noisy at night" : "Può essere rumorosa la sera",
    farCenter: lang === "en" ? "May be farther from the historic center" : "Può essere distante dal centro storico",
    calm: lang === "en" ? "Less nightlife nearby" : "Meno vita notturna nelle vicinanze",
    simple: lang === "en" ? "Services can be simpler" : "Servizi talvolta più semplici",
    hilly: lang === "en" ? "Getting around may be less immediate" : "Spostamenti meno immediati",
    variable: lang === "en" ? "Hotel availability varies by season" : "Disponibilità hotel variabile in stagione",
  };

  if (hasAny(["metro", "trasporti", "stazione"])) add(pros, copy.connected);
  if (hasAny(["centro", "centrale", "attrazioni", "culturale", "arte", "turistico"])) add(pros, copy.sights);
  if (hasAny(["mare", "spiaggia", "porto"])) add(pros, copy.sea);
  if (hasAny(["vita notturna", "locali", "universita"])) add(pros, copy.evening);
  if (hasAny(["tranquillo", "famiglie", "sicuro", "romantico"])) add(pros, copy.quiet);
  if (hasAny(["gastronomia", "mercati"])) add(pros, copy.food);
  if (hasAny(["budget"])) add(pros, copy.value);
  if (hasAny(["lusso"])) add(pros, copy.services);

  if (hasAny(["centro", "centrale", "attrazioni", "turistico", "lusso", "shopping"])) add(cons, copy.crowds);
  if (hasAny(["vita notturna", "locali", "universita"])) add(cons, copy.noisy);
  if (hasAny(["mare", "spiaggia", "porto"])) add(cons, copy.farCenter);
  if (hasAny(["tranquillo", "famiglie", "sicuro"])) add(cons, copy.calm);
  if (hasAny(["budget"])) add(cons, copy.simple);
  if (hasAny(["collina", "panoramica", "vista panoramica"])) add(cons, copy.hilly);
  if (hasAny(["mare", "spiaggia", "porto", "lusso", "turistico"])) add(cons, copy.variable);

  return { pros, cons };
}

const OPTIONS_COUNT = 3;   // quante opzioni mostrare
const STOPS_PER_DAY = 4;   // attrazioni per giorno
const MIN_MINUTES_PER_DAY = 300;
const MAX_MINUTES_PER_DAY = 420;
const MAX_MUSEUMS_PER_DAY = 1;

// Ã¢â€â‚¬Ã¢â€â‚¬ Geo helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const f1 = (lat1 * Math.PI) / 180, f2 = (lat2 * Math.PI) / 180;
  const df = ((lat2 - lat1) * Math.PI) / 180, dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function walkingKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
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

function routeWalkingKm(stops: Stop[]): number {
  const route = stops.filter((s) => s.type === "attraction");
  return route.slice(0, -1).reduce((sum, stop, index) => sum + walkingKm(stop, route[index + 1]), 0);
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function htmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function displayStopName(stop: Stop, lang: string): string {
  return lang === "en" && stop.name_en ? stop.name_en : stop.name;
}

function displayFoodName(food: Food, lang: string): string {
  return lang === "en" && food.name_en ? food.name_en : food.name;
}

function displayFoodDescription(food: Food, lang: string): string {
  return lang === "en" && food.description_en ? food.description_en : food.description;
}

function displayRestaurantName(restaurant: { name: string; name_en?: string | null }, lang: string): string {
  return lang === "en" && restaurant.name_en ? restaurant.name_en : restaurant.name;
}

function normalizeFoodPlaceName(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function displayNeighborhoodName(neighborhood: Neighborhood, lang: string): string {
  return lang === "en" && neighborhood.name_en ? neighborhood.name_en : neighborhood.name;
}

function displayNeighborhoodDescription(neighborhood: Neighborhood, lang: string): string {
  return lang === "en" && neighborhood.description_en ? neighborhood.description_en : neighborhood.description;
}

function mapsSearchUrl(stop: Stop, _city: string): string {
  // Use coordinates Ã¢â‚¬â€ always unambiguous regardless of city-name language
  return `https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`;
}

function levelSet(level: Itinerary["level"]): number[] {
  return Array.isArray(level) ? level : [level];
}

function isExplorerLevel(level: Itinerary["level"]): boolean {
  return levelSet(level).some((l) => l >= 2);
}

function matchesItineraryLevel(attraction: BuilderAttraction, level: Itinerary["level"]): boolean {
  return levelSet(level).includes(attraction.category_level);
}

function museumCount(stops: Stop[]): number {
  return stops.filter((s) => s.attraction_type?.toLowerCase() === "museo").length;
}

function dayMinutes(stops: Stop[]): number {
  return stops.reduce((sum, stop) => sum + (stop.estimated_visit_time ?? 60), 0);
}

function canUseDayStops(stops: Stop[], maxWalkKm: number): boolean {
  if (dayMinutes(stops) > MAX_MINUTES_PER_DAY) return false;
  if (museumCount(stops) > MAX_MUSEUMS_PER_DAY) return false;
  return routeWalkingKm(twoOptStops(stops)) <= maxWalkKm;
}

function buildItineraryPdfHtml({
  itinerary,
  neighborhoods,
  cityInfo,
  lang,
}: {
  itinerary: Itinerary;
  neighborhoods: Neighborhood[];
  cityInfo: CityInfo | null;
  lang: string;
}): string {
  const isEn = lang === "en";
  const levelLabel = Array.isArray(itinerary.level)
    ? (isEn ? "Explorer mix" : "Mix esploratore")
    : itinerary.level === 1
      ? (isEn ? "Iconic" : "Iconico")
      : (isEn ? "Explorer" : "Esploratore");
  const foodItems = itinerary.food_recommendations ?? [];
  const cultureItems = itinerary.culture_facts ?? [];
  const essentials = cityInfo
    ? [
        [isEn ? "Currency" : "Moneta", isEn && cityInfo.currency_en ? cityInfo.currency_en : cityInfo.currency],
        [isEn ? "Language" : "Lingua", isEn && cityInfo.language_en ? cityInfo.language_en : cityInfo.language],
        [
          isEn ? "English" : "Inglese",
          `${cityInfo.english_level}${(isEn && cityInfo.english_note_en ? cityInfo.english_note_en : cityInfo.english_note) ? ` - ${isEn && cityInfo.english_note_en ? cityInfo.english_note_en : cityInfo.english_note}` : ""}`,
        ],
        [isEn ? "Timezone" : "Fuso orario", cityInfo.timezone],
        [isEn ? "Voltage" : "Voltaggio", cityInfo.voltage],
        [isEn ? "Water" : "Acqua", isEn && cityInfo.water_en ? cityInfo.water_en : cityInfo.water],
        [isEn ? "Tipping" : "Mance", isEn && cityInfo.tipping_en ? cityInfo.tipping_en : cityInfo.tipping],
      ].filter(([, value]) => Boolean(value))
    : [];

  const daysHtml = itinerary.days.map((day) => {
    const stops = day.stops.filter((stop) => stop.type === "attraction");
    const restaurants = day.restaurants ?? [];
    const km = formatDistance(routeWalkingKm(stops));
    const minutes = Math.round(dayMinutes(stops) / 60 * 10) / 10;
    const routeLink = day.maps_link || (stops.length >= 2
      ? "https://www.google.com/maps/dir/" + stops.map((s) => mapsWaypoint(s, itinerary.city)).join("/") + "?travelmode=walking"
      : "");
    return `
      <section class="day">
        <div class="day-head">
          <h2>${isEn ? "Day" : "Giorno"} ${day.day}</h2>
          <span>${htmlEscape(km)} Ã‚Â· ${minutes}h</span>
        </div>
        ${routeLink ? `<a class="route-link" href="${htmlEscape(routeLink)}">${isEn ? "Open walking route" : "Apri percorso a piedi"}</a>` : ""}
        ${stops.map((stop, index) => `
          <div class="stop">
            <div class="num">${index + 1}</div>
            <div>
              <h3>${htmlEscape(displayStopName(stop, lang))}</h3>
              <p>${htmlEscape(lang === "en" && stop.description_en ? stop.description_en : stop.description)}</p>
              <small>${htmlEscape(stop.attraction_type ?? "")}${stop.estimated_visit_time ? ` Ã‚Â· ${stop.estimated_visit_time} min` : ""}</small>
              <a href="${htmlEscape(mapsSearchUrl(stop, itinerary.city))}">Maps</a>
              ${stop.ticket_url ? `<a href="${htmlEscape(stop.ticket_url)}">${isEn ? "Tickets" : "Biglietti"}</a>` : ""}
            </div>
          </div>
        `).join("")}
        ${restaurants.length ? `
          <div class="restaurant">
            <strong>${isEn ? "Food nearby" : "Cibo consigliato"}</strong>
            ${restaurants.map((r) => `
              <p>
                ${htmlEscape(displayRestaurantName(r, lang))}
                ${r.food_type ? ` Ã‚Â· ${htmlEscape(r.food_type)}` : ""}
                ${r.rating != null ? ` Ã‚Â· ${r.rating.toFixed(1)}/5` : ""}
                ${r.description ? `<br/>${htmlEscape(isEn && r.description_en ? r.description_en : r.description)}` : ""}
                ${r.maps_link ? `<br/><a href="${htmlEscape(r.maps_link)}">Maps</a>` : ""}
              </p>
            `).join("")}
          </div>
        ` : ""}
      </section>
    `;
  }).join("");

  const neighborhoodsHtml = neighborhoods.map((n) => {
    const { pros, cons } = neighborhoodProsCons(n.vibe_tags, lang);
    return `
      <article class="info-card">
        <h3>${htmlEscape(displayNeighborhoodName(n, lang))}</h3>
        <p>${htmlEscape(displayNeighborhoodDescription(n, lang))}</p>
        <div class="twocol">
          <div><strong>${isEn ? "Pros" : "Pro"}</strong>${pros.map((p) => `<span>+ ${htmlEscape(p)}</span>`).join("")}</div>
          <div><strong>${isEn ? "Cons" : "Contro"}</strong>${cons.map((c) => `<span>- ${htmlEscape(c)}</span>`).join("")}</div>
        </div>
      </article>
    `;
  }).join("");

  const foodHtml = foodItems.map((food) => `
    <article class="info-card">
      <h3>${htmlEscape(displayFoodName(food, lang))}</h3>
      <p>${htmlEscape(displayFoodDescription(food, lang))}</p>
      ${(lang === "en" && food.ingredients_en?.length ? food.ingredients_en : food.ingredients ?? [])
        .map((ingredient) => `<em>${htmlEscape(ingredient)}</em>`).join("")}
      ${(food.places ?? []).map((place) => `<p class="tip">${htmlEscape(place.name)}${place.maps_link ? ` Ã‚Â· <a href="${htmlEscape(place.maps_link)}">Maps</a>` : ""}</p>`).join("")}
    </article>
  `).join("");

  const cultureHtml = cultureItems.map((fact) => `
    <article class="info-card">
      <h3>${htmlEscape(fact.icon)} ${htmlEscape(isEn && fact.title_en ? fact.title_en : fact.title)}</h3>
      <p>${htmlEscape(isEn && fact.body_en ? fact.body_en : fact.body)}</p>
    </article>
  `).join("");

  const practicalHtml = cityInfo ? `
    <section class="pdf-section pdf-section-new-page">
      <h2 class="pdf-section-title">${isEn ? "Practical Info" : "Info utili"}</h2>
      <div class="grid">${essentials.map(([label, value]) => `<div class="pill"><strong>${htmlEscape(label)}</strong><span>${htmlEscape(value)}</span></div>`).join("")}</div>
      ${(cityInfo.quick_tips ?? []).length ? `<h3>${isEn ? "Quick tips" : "Consigli rapidi"}</h3>${((isEn && cityInfo.quick_tips_en?.length) ? cityInfo.quick_tips_en : cityInfo.quick_tips ?? []).map((tip) => `<p class="tip">${htmlEscape(tip)}</p>`).join("")}` : ""}
      ${cityInfo.emergency_numbers?.length ? `<h3>${isEn ? "Emergency numbers" : "Numeri di emergenza"}</h3>${cityInfo.emergency_numbers.map((item) => `<p class="tip"><strong>${htmlEscape(isEn && item.label_en ? item.label_en : item.label)}</strong> Ã‚Â· ${htmlEscape(item.number)}</p>`).join("")}` : ""}
      ${cityInfo.transport_apps?.length ? `<h3>${isEn ? "Transport apps" : "App trasporti"}</h3>${cityInfo.transport_apps.map((app) => `<p class="tip">${htmlEscape(app.name)}${app.description ? ` Ã‚Â· ${htmlEscape(isEn && app.description_en ? app.description_en : app.description)}` : ""}</p>`).join("")}` : ""}
      ${cityInfo.useful_apps?.length ? `<h3>${isEn ? "Useful apps" : "App utili"}</h3>${cityInfo.useful_apps.map((app) => `<p class="tip">${htmlEscape(app.name)}${app.description ? ` Ã‚Â· ${htmlEscape(isEn && app.description_en ? app.description_en : app.description)}` : ""}</p>`).join("")}` : ""}
    </section>
  ` : "";

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          @page { margin: 28px; }
          html { background: #0f0f1e; }
          body { margin: 0; background: #0f0f1e; color: #f0f0f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .pdf-page { max-width: 760px; min-height: 1040px; margin: 0 auto; background: #0f0f1e; padding: 18px; box-sizing: border-box; border: 1px solid #342d45; border-radius: 18px; box-shadow: 0 18px 45px rgba(0,0,0,0.28); }
          .cover { border: 1px solid #4a3f56; border-radius: 16px; padding: 18px; margin-bottom: 18px; background: #161625; }
          .brand { color: #e8c06a; letter-spacing: 3px; font-weight: 900; font-size: 28px; }
          .meta { color: #b8b8cf; margin-top: 6px; }
          .day { background: #161625; border: 1px solid #3a3349; border-radius: 16px; padding: 16px; margin-bottom: 14px; break-inside: avoid-page; page-break-inside: avoid; }
          .day-head { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid #2a2a42; margin-bottom: 12px; padding-bottom: 8px; }
          h1, h2, h3 { margin: 0; }
          h1, h2, h3 { break-after: avoid-page; page-break-after: avoid; }
          h2 { color: #e8c06a; font-size: 18px; margin-top: 14px; }
          h3 { color: #dcdcf0; font-size: 15px; margin-bottom: 4px; }
          p { color: #b8b8cf; line-height: 1.45; margin: 0 0 8px; }
          a { color: #7eb8f7; font-weight: 800; text-decoration: none; margin-right: 10px; }
          small { color: #8b8ba8; }
          .stop { display: flex; gap: 10px; margin: 10px 0; break-inside: avoid-page; page-break-inside: avoid; }
          .route-link { display: inline-block; margin: 4px 0 10px; padding: 7px 10px; border-radius: 10px; background: #7eb8f714; border: 1px solid #7eb8f740; }
          .num { width: 24px; height: 24px; border-radius: 12px; background: #e8c06a; color: #0f0f1e; font-weight: 800; display: flex; align-items: center; justify-content: center; flex: 0 0 24px; }
          .restaurant, .info-card { background: #1e1e30; border: 1px solid #38324a; border-radius: 14px; padding: 12px; margin-top: 10px; break-inside: avoid-page; page-break-inside: avoid; }
          .pdf-section { break-before: auto; break-inside: auto; margin-bottom: 18px; }
          .pdf-section-new-page { break-before: page; page-break-before: always; }
          .pdf-section-title { break-after: avoid-page; page-break-after: avoid; }
          .page-break { break-before: page; page-break-before: always; height: 0; }
          .section-title { color: #e8c06a; font-size: 24px; margin-bottom: 12px; }
          .twocol { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; break-inside: avoid-page; page-break-inside: avoid; }
          .twocol strong, .restaurant strong { color: #e8c06a; display: block; margin-bottom: 6px; }
          .twocol span { display: block; color: #dcdcf0; font-size: 12px; margin-bottom: 4px; }
          em { display: inline-block; color: #0f0f1e; background: #e8c06a; border-radius: 999px; padding: 4px 8px; font-style: normal; font-size: 11px; margin: 2px 4px 2px 0; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; break-inside: avoid-page; page-break-inside: avoid; }
          .pill { border: 1px solid #38324a; border-radius: 12px; padding: 10px; background: #161625; break-inside: avoid-page; page-break-inside: avoid; }
          .pill strong { color: #e8c06a; display: block; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; }
          .pill span, .tip { color: #dcdcf0; font-size: 13px; }
          .tip { break-inside: avoid-page; page-break-inside: avoid; }
          @media print {
            .pdf-page { max-width: none; min-height: auto; padding: 0; border: 0; border-radius: 0; box-shadow: none; }
            .cover, .day, .restaurant, .info-card, .pill, .stop, .tip { break-inside: avoid-page; page-break-inside: avoid; }
            h1, h2, h3, .section-title, .pdf-section-title { break-after: avoid-page; page-break-after: avoid; }
          }
        </style>
      </head>
      <body>
        <main class="pdf-page">
        <div class="cover">
          <div class="brand">WAYRA</div>
          <h1>${htmlEscape(cityLabel(itinerary.city, lang).toUpperCase())}</h1>
          <div class="meta">${itinerary.num_days} ${isEn ? "days" : "giorni"} - ${htmlEscape(levelLabel)} - ${itinerary.max_walk_km ?? 5} km/${isEn ? "day" : "giorno"}</div>
        </div>
        ${daysHtml}
        <div class="page-break"></div>
        <h1 class="section-title">${isEn ? "Travel Notes" : "Informazioni viaggio"}</h1>
        <section class="pdf-section"><h2 class="pdf-section-title">${isEn ? "Where to stay" : "Alloggi"}</h2>${neighborhoodsHtml || `<p>${isEn ? "No lodging data available." : "Nessun dato sugli alloggi disponibile."}</p>`}</section>
        <section class="pdf-section pdf-section-new-page"><h2 class="pdf-section-title">${isEn ? "Cuisine" : "Cucina"}</h2>${foodHtml}</section>
        <section class="pdf-section pdf-section-new-page"><h2 class="pdf-section-title">${isEn ? "Culture" : "Cultura"}</h2>${cultureHtml}</section>
        ${practicalHtml}
        </main>
      </body>
    </html>
  `;
}

function attractionAreaKey(attraction: BuilderAttraction): string {
  if (attraction.zone) return `zone:${attraction.zone}`;
  if (attraction.block_id != null) return `block:${attraction.block_id}`;
  return `geo:${attraction.latitude.toFixed(2)}:${attraction.longitude.toFixed(2)}`;
}

function uniqueAttractions(attractions: BuilderAttraction[]): BuilderAttraction[] {
  const seen = new Set<number>();
  const result: BuilderAttraction[] = [];
  for (const attraction of attractions) {
    if (seen.has(attraction.id)) continue;
    seen.add(attraction.id);
    result.push(attraction);
  }
  return result;
}

function attractionCentroid(attractions: BuilderAttraction[]): { latitude: number; longitude: number } {
  return {
    latitude: attractions.reduce((sum, a) => sum + a.latitude, 0) / Math.max(1, attractions.length),
    longitude: attractions.reduce((sum, a) => sum + a.longitude, 0) / Math.max(1, attractions.length),
  };
}

function buildAreaDayOption({
  seedGroup,
  allCandidates,
  city,
  maxWalkKm,
  targetStops,
  explorer,
}: {
  seedGroup: BuilderAttraction[];
  allCandidates: BuilderAttraction[];
  city: string;
  maxWalkKm: number;
  targetStops: number;
  explorer: boolean;
}): Stop[] | null {
  const seed = attractionCentroid(seedGroup);
  const orderedGroup = [...seedGroup].sort((a, b) => {
    if (explorer) {
      const aExplorer = a.category_level >= 2 ? 1 : 0;
      const bExplorer = b.category_level >= 2 ? 1 : 0;
      if (aExplorer !== bExplorer) return bExplorer - aExplorer;
    }
    return walkingKm(seed, a) - walkingKm(seed, b);
  });
  const orderedNearby = [...allCandidates].sort((a, b) => walkingKm(seed, a) - walkingKm(seed, b));
  const pool = uniqueAttractions([...orderedGroup, ...orderedNearby]);
  let selected: Stop[] = [];

  for (const attraction of pool) {
    if (selected.length >= targetStops && dayMinutes(selected) >= MIN_MINUTES_PER_DAY) break;
    const candidate = builderToStop(attraction, city);
    const next = twoOptStops([...selected, candidate]);
    if (!canUseDayStops(next, maxWalkKm)) continue;
    selected = next;
  }

  const minimumStops = Math.min(targetStops, STOPS_PER_DAY);
  if (selected.length < minimumStops) return null;
  if (dayMinutes(selected) < MIN_MINUTES_PER_DAY) return null;
  return twoOptStops(selected);
}

function twoOptStops(stops: Stop[]): Stop[] {
  const n = stops.length;
  if (n <= 2) return [...stops];
  if (n <= 11) return shortestOpenPath(stops);
  const d = (a: Stop, b: Stop) => haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
  const len = (r: Stop[]) => r.slice(0, -1).reduce((s, _, i) => s + d(r[i], r[i + 1]), 0);
  let best = nearestOpenPath(stops), bestDist = len(best), improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const c = [...best.slice(0, i), ...best.slice(i, j + 1).reverse(), ...best.slice(j + 1)];
        const cd = len(c);
        if (cd < bestDist - 1e-9) { best = c; bestDist = cd; improved = true; }
      }
    }
  }
  return best;
}

function shortestOpenPath(stops: Stop[]): Stop[] {
  const n = stops.length;
  const size = 1 << n;
  const dist = stops.map((a) => stops.map((b) => haversineKm(a.latitude, a.longitude, b.latitude, b.longitude)));
  const dp = Array.from({ length: size }, () => Array(n).fill(Number.POSITIVE_INFINITY));
  const parent = Array.from({ length: size }, () => Array(n).fill(-1));

  for (let i = 0; i < n; i++) dp[1 << i][i] = 0;

  for (let mask = 0; mask < size; mask++) {
    for (let last = 0; last < n; last++) {
      const current = dp[mask][last];
      if (!Number.isFinite(current)) continue;
      for (let next = 0; next < n; next++) {
        if (mask & (1 << next)) continue;
        const nextMask = mask | (1 << next);
        const candidate = current + dist[last][next];
        if (candidate < dp[nextMask][next]) {
          dp[nextMask][next] = candidate;
          parent[nextMask][next] = last;
        }
      }
    }
  }

  const full = size - 1;
  let last = 0;
  for (let i = 1; i < n; i++) {
    if (dp[full][i] < dp[full][last]) last = i;
  }

  const order: number[] = [];
  let mask = full;
  while (last !== -1) {
    order.push(last);
    const prev = parent[mask][last];
    mask ^= 1 << last;
    last = prev;
  }
  order.reverse();
  return order.map((index) => stops[index]);
}

function nearestOpenPath(stops: Stop[]): Stop[] {
  const d = (a: Stop, b: Stop) => haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
  let best: Stop[] = [];
  let bestDist = Number.POSITIVE_INFINITY;
  const len = (route: Stop[]) => route.slice(0, -1).reduce((sum, stop, index) => sum + d(stop, route[index + 1]), 0);

  for (const start of stops) {
    const remaining = stops.filter((stop) => stop !== start);
    const route = [start];
    while (remaining.length > 0) {
      const current = route[route.length - 1];
      let nearestIndex = 0;
      for (let i = 1; i < remaining.length; i++) {
        if (d(current, remaining[i]) < d(current, remaining[nearestIndex])) nearestIndex = i;
      }
      route.push(remaining.splice(nearestIndex, 1)[0]);
    }
    const routeDist = len(route);
    if (routeDist < bestDist) {
      best = route;
      bestDist = routeDist;
    }
  }

  return best;
}

function isFoodStop(stop: Stop): boolean {
  return stop.type === "food" || stop.type === "meal";
}

function optimizeAttractionsBetweenFoodStops(stops: Stop[]): Stop[] {
  const result: Stop[] = [];
  let segment: Stop[] = [];

  const flush = () => {
    if (segment.length > 0) {
      result.push(...twoOptStops(segment));
      segment = [];
    }
  };

  for (const stop of stops) {
    if (stop.type === "attraction") {
      segment.push(stop);
    } else {
      flush();
      result.push(stop);
    }
  }
  flush();
  return result;
}

function stopMinutes(stop: Stop): number {
  return stop.estimated_visit_time ?? 60;
}

function isMealAnchor(stop: Stop, mealType: "lunch" | "dinner"): boolean {
  return stop.meal_type === mealType || (stop as any).meal === mealType;
}

function segmentRouteKm(stops: Stop[]): number {
  return stops.slice(0, -1).reduce((sum, stop, index) => sum + walkingKm(stop, stops[index + 1]), 0);
}

function insertAttractionInLightestSegment(stops: Stop[], attraction: Stop): Stop[] {
  const segments: Stop[][] = [[]];
  const anchors: Stop[] = [];

  for (const stop of stops) {
    if (stop.type === "attraction") {
      segments[segments.length - 1].push(stop);
    } else {
      anchors.push(stop);
      segments.push([]);
    }
  }

  let targetSegment = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  const lunchAnchorIndex = anchors.findIndex((stop) => isMealAnchor(stop, "lunch"));
  const dinnerAnchorIndex = anchors.findIndex((stop) => isMealAnchor(stop, "dinner"));
  const lastAllowedSegment = dinnerAnchorIndex >= 0 ? dinnerAnchorIndex : segments.length - 1;

  const segmentMinutes = (segment: Stop[]) =>
    segment.reduce((sum, stop) => sum + stopMinutes(stop), 0);

  segments.forEach((segment, index) => {
    if (index > lastAllowedSegment) return;

    const candidateSegment = twoOptStops([...segment, attraction]);
    const candidateSegments = segments.map((current, currentIndex) =>
      currentIndex === index ? candidateSegment : current,
    );
    const morningMinutes = candidateSegments
      .slice(0, lunchAnchorIndex >= 0 ? lunchAnchorIndex + 1 : candidateSegments.length)
      .reduce((sum, current) => sum + segmentMinutes(current), 0);
    const afternoonMinutes = lunchAnchorIndex >= 0
      ? candidateSegments
          .slice(lunchAnchorIndex + 1, lastAllowedSegment + 1)
          .reduce((sum, current) => sum + segmentMinutes(current), 0)
      : 0;
    const balancePenalty = lunchAnchorIndex >= 0
      ? Math.abs(morningMinutes - afternoonMinutes) / 60
      : segmentMinutes(candidateSegment) / 60;
    const distancePenalty = Math.max(0, segmentRouteKm(candidateSegment) - segmentRouteKm(segment));
    const score = balancePenalty + distancePenalty * 3;

    if (score < bestScore) {
      bestScore = score;
      targetSegment = index;
    }
  });

  segments[targetSegment] = twoOptStops([...segments[targetSegment], attraction]);

  const result: Stop[] = [];
  segments.forEach((segment, index) => {
    result.push(...segment);
    if (anchors[index]) result.push(anchors[index]);
  });
  return result;
}

function routeLinkStops(stops: Stop[]): Stop[] {
  return stops.filter((s) => s.type === "attraction");
}

// Google Maps "dir/" URL supporta in modo affidabile fino a 10 waypoint
// (origine + destinazione + 8 intermedi). Oltre, l'app tronca o rifiuta.
const MAPS_MAX_WAYPOINTS = 10;

function buildMapsLink(stops: Stop[], city: string): string {
  const allRouteStops = routeLinkStops(stops);
  if (allRouteStops.length < 2) return "";
  // Se eccede il limite, prendi origine, ultimo (destinazione) e campiona
  // uniformemente i waypoint intermedi per coprire l'intera giornata.
  let routeStops = allRouteStops;
  if (allRouteStops.length > MAPS_MAX_WAYPOINTS) {
    const first = allRouteStops[0];
    const last = allRouteStops[allRouteStops.length - 1];
    const middle = allRouteStops.slice(1, -1);
    const slots = MAPS_MAX_WAYPOINTS - 2;
    const sampled: Stop[] = [];
    for (let i = 0; i < slots; i++) {
      const idx = Math.floor((i + 1) * middle.length / (slots + 1));
      sampled.push(middle[idx]);
    }
    routeStops = [first, ...sampled, last];
  }
  return "https://www.google.com/maps/dir/" +
    routeStops.map((s) => mapsWaypoint(s, city)).join("/") +
    "?travelmode=walking";
}

function builderToStop(a: BuilderAttraction, city: string): Stop {
  return {
    type: "attraction",
    id: a.id,
    name: a.name,
    name_en: a.name_en,
    description: a.description ?? undefined,
    description_en: a.description_en ?? undefined,
    latitude: a.latitude,
    longitude: a.longitude,
    category_level: a.category_level,
    estimated_visit_time: a.estimated_visit_time ?? 60,
    tags: a.tags ?? [],
    city,
    is_food_spot: false,
    attraction_type: a.attraction_type,
    ticket_url: a.ticket_url,
    must_see: a.must_see,
    must_see_rank: a.must_see_rank,
  };
}

function foodSpotToStop(a: BuilderAttraction, city: string, previous?: Stop): Stop {
  return {
    // Preserva il tipo originale dello slot pasto sostituito ("food" o "meal")
    type: previous?.type === "food" || previous?.type === "meal" ? previous.type : "meal",
    id: a.id,
    name: a.name,
    name_en: a.name_en,
    description: a.description ?? undefined,
    description_en: a.description_en ?? undefined,
    latitude: a.latitude,
    longitude: a.longitude,
    category_level: a.category_level,
    estimated_visit_time: a.estimated_visit_time ?? previous?.estimated_visit_time ?? 60,
    tags: a.tags ?? [],
    city,
    is_food_spot: true,
    attraction_type: a.attraction_type,
    food_type: a.food_type,
    meal_type: a.meal_type ?? previous?.meal_type,
    rating: a.rating,
    notes: previous?.notes,
  };
}

function foodSpotToRestaurant(a: BuilderAttraction, mealType: MealType): Restaurant {
  return {
    id: a.id,
    name: a.name,
    name_en: a.name_en,
    description: a.description ?? undefined,
    description_en: a.description_en ?? undefined,
    food_type: a.food_type ?? a.attraction_type ?? undefined,
    meal_type: mealType,
    rating: a.rating ?? undefined,
    latitude: a.latitude,
    longitude: a.longitude,
    maps_link: `https://www.google.com/maps/search/?api=1&query=${a.latitude},${a.longitude}`,
  };
}

function mapsWaypoint(stop: Stop, _city: string): string {
  // Use coordinates Ã¢â‚¬â€ unambiguous and language-independent
  return encodeURIComponent(`${stop.latitude},${stop.longitude}`);
}

const ATTRACTION_EMOJI: Record<string, string> = {
  museo: "Ã°Å¸Ââ€ºÃ¯Â¸Â", chiesa: "Ã¢â€ºÂª", parco: "Ã°Å¸Å’Â¿", piazza: "Ã°Å¸ÂÅ¸Ã¯Â¸Â",
  archeologia: "Ã¢Å¡Â±Ã¯Â¸Â", monumento: "Ã°Å¸â€”Â¿", quartiere: "Ã°Å¸ÂËœÃ¯Â¸Â",
  panorama: "Ã°Å¸Å’â€¦", mercato: "Ã°Å¸â€ºâ€™", palazzo: "Ã°Å¸ÂÂ°",
  castello: "Ã°Å¸ÂÂ°", fortezza: "Ã°Å¸ÂÂ°", torre: "Ã°Å¸â€”Â¼",
  giardino: "Ã°Å¸Å’Â¸", lago: "Ã°Å¸ÂÅ¾Ã¯Â¸Â", spiaggia: "Ã°Å¸Ââ€“Ã¯Â¸Â",
  ponte: "Ã°Å¸Å’â€°", fontana: "Ã¢â€ºÂ²", statua: "Ã°Å¸â€”Â¿",
  teatro: "Ã°Å¸Å½Â­", galleria: "Ã°Å¸â€“Â¼Ã¯Â¸Â", biblioteca: "Ã°Å¸â€œÅ¡",
  tempio: "Ã°Å¸â€ºâ€¢", moschea: "Ã°Å¸â€¢Å’", sinagoga: "Ã°Å¸â€¢Â",
  anfiteatro: "Ã°Å¸ÂÅ¸Ã¯Â¸Â", arco: "Ã°Å¸Ââ€ºÃ¯Â¸Â", basilica: "Ã¢â€ºÂª",
  abbazia: "Ã¢â€ºÂª", cattedrale: "Ã¢â€ºÂª", duomo: "Ã¢â€ºÂª",
  lungomare: "Ã°Å¸Å’Å ", porto: "Ã¢Å¡â€œ", acquario: "Ã°Å¸ÂÂ ",
  funicolare: "Ã°Å¸Å¡Â¡", funivia: "Ã°Å¸Å¡Â ", belvedere: "Ã°Å¸â€Â­",
  percorso: "Ã°Å¸Â¥Â¾", area: "Ã°Å¸â€”ÂºÃ¯Â¸Â", borgo: "Ã°Å¸ÂÂ¡",
  strada: "Ã°Å¸â€ºÂ¤Ã¯Â¸Â", viale: "Ã°Å¸â€ºÂ¤Ã¯Â¸Â", canale: "Ã°Å¸Å’Å ",
  passeggiata: "Ã°Å¸Å¡Â¶", spazio: "Ã°Å¸Ââ„¢Ã¯Â¸Â", molo: "Ã¢Å¡â€œ",
  edificio: "Ã°Å¸ÂÂ¢", villa: "Ã°Å¸ÂÂ¡",
  centro: "Ã°Å¸ÂÂ¢",
};
function stopEmoji(s: Stop): string {
  const key = (s.attraction_type ?? "").toLowerCase();
  if (ATTRACTION_EMOJI[key]) return ATTRACTION_EMOJI[key];
  // Fallback substring per tipi composti (es. "parco storico" Ã¢â€ â€™ Ã°Å¸Å’Â¿)
  const match = Object.keys(ATTRACTION_EMOJI).find((k) => k.length >= 4 && key.includes(k));
  return match ? ATTRACTION_EMOJI[match] : "Ã°Å¸â€œÂ";
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Tipi per il modal opzioni Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

// Ã¢â€â‚¬Ã¢â€â‚¬ Screen Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export default function ItineraryScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { lang, t, toggle } = useLanguage();
  const { colors } = useTheme();
  const [tab, setTabRaw] = useState<Tab>("itinerary");

  // Wrapper con animazione spring sulla tab bar:
  // - Il tab attivo cresce (flex 2) e mostra la label, gli inattivi si comprimono
  // - LayoutAnimation interpola le dimensioni dei figli durante setTab
  const setTab = useCallback((next: Tab) => {
    setTabRaw((current) => {
      if (next === current) return current;
      LayoutAnimation.configureNext({
        duration: 280,
        create:  { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
        update:  { type: LayoutAnimation.Types.spring, springDamping: 0.78 },
        delete:  { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      });
      return next;
    });
  }, []);
  const [openDay, setOpenDay] = useState<number | null>(1);
  const [showGuide, setShowGuide] = useState(false);
  const { save, remove, findSavedId } = useSavedItineraries();
  const guideTargets = useRef<Map<string, View>>(new Map());
  useFonts({ BebasNeue_400Regular });

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [itineraryLoading, setItineraryLoading] = useState(true);

  // Legge l'itinerario da AsyncStorage (passato da index/create/saved senza URL params)
  useEffect(() => {
    AsyncStorage.getItem("wayra_pending_itinerary")
      .then(async (val) => {
        if (val) {
          // Itinerario appena generato: ha la precedenza su tutto
          try { setItinerary(JSON.parse(val) as Itinerary); } catch (e) {
            if (__DEV__) console.warn("[itinerary] JSON parse failed:", e);
          }
          await AsyncStorage.removeItem("wayra_pending_itinerary");
        } else {
          // Prova il draft autosalvato (app chiusa/backgroundata con itinerario aperto)
          const draft = await AsyncStorage.getItem("wayra_draft_itinerary").catch(() => null);
          if (draft) {
            try { setItinerary(JSON.parse(draft) as Itinerary); } catch (e) {
              if (__DEV__) console.warn("[itinerary] draft parse failed:", e);
            }
          } else {
            // Fallback: vecchio metodo con URL params (backward compat)
            const rawData = params.data;
            const dataStr = Array.isArray(rawData) ? rawData[0] : rawData;
            if (dataStr) {
              try { setItinerary(JSON.parse(dataStr as string) as Itinerary); } catch (e) {
                if (__DEV__) console.warn("[itinerary] JSON parse (params) failed:", e);
              }
            }
          }
        }
      })
      .catch((e) => {
        if (__DEV__) console.warn("[itinerary] AsyncStorage read failed:", e);
      })
      .finally(() => {
        setItineraryLoading(false);
      });
  }, []);

  // Auto-salva il draft ogni volta che l'itinerario cambia (500 ms debounce)
  useEffect(() => {
    if (!itinerary) return;
    const timer = setTimeout(() => {
      AsyncStorage.setItem("wayra_draft_itinerary", JSON.stringify(itinerary)).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [itinerary]);

  const { attractions } = useAttractions(itinerary?.city ?? "");
  const { foodSpots } = useFoodSpots(itinerary?.city ?? "");
  const { neighborhoods, loading: neighborhoodsLoading } = useNeighborhoods(itinerary?.city ?? "");
  const { cityInfo, loading: cityInfoLoading } = useCityInfo(itinerary?.city ?? "");
  const enrichedFoodSpots = useMemo<BuilderAttraction[]>(() => {
    if (!itinerary) return foodSpots;

    const dishesByPlace = new Map<string, { names: Set<string>; namesEn: Set<string>; curated: boolean }>();
    for (const food of itinerary.food_recommendations ?? []) {
      for (const place of food.places ?? []) {
        const key = normalizeFoodPlaceName(place.name);
        if (!key) continue;
        const current = dishesByPlace.get(key) ?? {
          names: new Set<string>(),
          namesEn: new Set<string>(),
          curated: false,
        };
        current.names.add(food.name);
        if (food.name_en) current.namesEn.add(food.name_en);
        current.curated = current.curated || Boolean(place.curated);
        dishesByPlace.set(key, current);
      }
    }

    return foodSpots.map((spot) => {
      const match = dishesByPlace.get(normalizeFoodPlaceName(spot.name));
      if (!match) return spot;
      return {
        ...spot,
        recommended_dishes: Array.from(match.names),
        recommended_dishes_en: Array.from(match.namesEn),
        has_curated_dish_match: true,
      };
    });
  }, [foodSpots, itinerary]);
  const destinationGeo = useMemo(() => {
    const coords = [...attractions, ...enrichedFoodSpots]
      .filter((item) =>
        Number.isFinite(item.latitude) &&
        Number.isFinite(item.longitude),
      )
      .map((item) => ({ latitude: item.latitude, longitude: item.longitude }));

    if (coords.length === 0) return null;

    const center = coords.reduce(
      (acc, point) => ({
        latitude: acc.latitude + point.latitude,
        longitude: acc.longitude + point.longitude,
      }),
      { latitude: 0, longitude: 0 },
    );
    center.latitude /= coords.length;
    center.longitude /= coords.length;

    const radiusKm = coords.reduce(
      (max, point) => Math.max(max, haversineKm(center.latitude, center.longitude, point.latitude, point.longitude)),
      0,
    );

    return { center, radiusKm };
  }, [attractions, enrichedFoodSpots]);

  const isOriginInDestination = useCallback((origin: FoodOrigin) => {
    if (!destinationGeo) return true;
    const distanceFromCity = haversineKm(
      origin.latitude,
      origin.longitude,
      destinationGeo.center.latitude,
      destinationGeo.center.longitude,
    );
    const allowedRadiusKm = Math.max(20, Math.min(50, destinationGeo.radiusKm + 12));
    return distanceFromCity <= allowedRadiusKm;
  }, [destinationGeo]);

  // Mappa attractionId Ã¢â€ â€™ dayNumber, usata dalla DayMap per classificare i layer
  const assignedMap = useMemo(() => {
    const map = new Map<number, number>();
    itinerary?.days.forEach((d) => {
      d.stops.forEach((s) => {
        if (s.type === "attraction" && s.id > 0) map.set(s.id, d.day);
      });
    });
    return map;
  }, [itinerary]);
  const [openFoodId, setOpenFoodId] = useState<number | null>(null);
  const [saveChoiceVisible, setSaveChoiceVisible] = useState(false);
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [neighborhoodMapVisible, setNeighborhoodMapVisible] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>("itinerary");
  const [mapDayNumber, setMapDayNumber] = useState(1);
  const [foodSelection, setFoodSelection] = useState<FoodSelection | null>(null);
  const [mapInfoVisible, setMapInfoVisible] = useState(false);
  const [dayCardDragging, setDayCardDragging] = useState(false);

  const savedId = itinerary ? findSavedId(itinerary) : null;

  useEffect(() => {
    AsyncStorage.getItem(ITINERARY_GUIDE_KEY).then((val) => {
      if (!val) setShowGuide(true);
    });
  }, []);

  const setGuideTarget = useCallback((key: string, ref: View | null) => {
    if (ref) guideTargets.current.set(key, ref);
    else guideTargets.current.delete(key);
  }, []);

  const dismissGuide = useCallback(async () => {
    await AsyncStorage.setItem(ITINERARY_GUIDE_KEY, "done");
    setShowGuide(false);
  }, []);

  const handleFindFood = useCallback(async (dayIndex: number) => {
    if (!itinerary) return;
    const day = itinerary.days[dayIndex];
    if (!day) return;

    let origin: FoodOrigin | null = null;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.geolocation) {
        origin = await new Promise<FoodOrigin>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              name: lang === "en" ? "Your position" : "La tua posizione",
            }),
            reject,
            { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 },
          );
        });
      } else {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status === "granted") {
          const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          origin = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            name: lang === "en" ? "Your position" : "La tua posizione",
          };
        }
      }
    } catch {
      origin = null;
    }

    if (origin && !isOriginInDestination(origin)) {
      Alert.alert(
        lang === "en" ? "Destination restaurants" : "Ristoranti della destinazione",
        lang === "en"
          ? "Your current position seems outside the trip city, so I will show restaurants in the destination without displaying your location."
          : "La tua posizione sembra fuori dalla citta del viaggio, quindi ti mostro i ristoranti della destinazione senza mostrare la tua posizione.",
      );
      origin = null;
    }

    setFoodSelection({ dayIndex, mealType: "meal", ...(origin ? { origin } : {}) });
    setMapMode("food");
    setMapDayNumber(day.day);
    setMapVisible(true);
  }, [itinerary, isOriginInDestination, lang]);

  const handleSelectFoodFromMap = useCallback((foodSpotId: number) => {
    if (!itinerary || !foodSelection) return;
    const spot = enrichedFoodSpots.find((f) => f.id === foodSpotId);
    if (!spot) return;

    const { dayIndex, mealType } = foodSelection;
    const selectedRestaurant = foodSpotToRestaurant(spot, mealType);
    setItinerary((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((d, i) => {
          if (i !== dayIndex) return d;
          const currentRestaurants = d.restaurants ?? [];
          const alreadySelected = currentRestaurants.some((r) => r.id === foodSpotId);
          return {
            ...d,
            restaurants: alreadySelected
              ? currentRestaurants.filter((r) => r.id !== foodSpotId)
              : [...currentRestaurants, selectedRestaurant],
            maps_link: buildMapsLink(d.stops, prev.city),
          };
        }),
      };
    });
  }, [itinerary, foodSelection, enrichedFoodSpots]);

  const handleRemoveRestaurant = useCallback((dayIndex: number, restaurantId: number) => {
    setItinerary((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((d, i) =>
          i !== dayIndex
            ? d
            : { ...d, restaurants: (d.restaurants ?? []).filter((r) => r.id !== restaurantId) },
        ),
      };
    });
  }, []);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Aggiungi attrazione non assegnata al giorno Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  const handleAddAttraction = useCallback((dayIndex: number, attractionId: number) => {
    const attraction = attractions.find((a) => a.id === attractionId);
    if (!attraction) return;

    setItinerary((prev) => {
      if (!prev) return prev;
      const day = prev.days[dayIndex];
      if (!day) return prev;
      if (day.stops.some((s) => s.id === attractionId)) return prev; // giÃƒÂ  presente
      const newStop = builderToStop(attraction, prev.city);
      const nextStops = insertAttractionInLightestSegment(day.stops, newStop);
      return {
        ...prev,
        days: prev.days.map((d, i) =>
          i !== dayIndex
            ? d
            : { ...d, stops: nextStops, maps_link: buildMapsLink(nextStops, prev.city) },
        ),
      };
    });
  }, [attractions]);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Sposta attrazione da un altro giorno a questo Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  const handleMoveAttraction = useCallback((dayIndex: number, attractionId: number, fromDayNumber: number) => {
    setItinerary((prev) => {
      if (!prev) return prev;
      const targetDay = prev.days[dayIndex];
      const sourceDayIndex = prev.days.findIndex((d) => d.day === fromDayNumber);
      if (!targetDay || sourceDayIndex === -1) return prev;
      const sourceDay = prev.days[sourceDayIndex];

      // Trova lo stop nella giornata sorgente (sia Stop che BuilderAttraction)
      const sourceStop = sourceDay.stops.find((s) => s.id === attractionId && s.type === "attraction");
      const attractionData = attractions.find((a) => a.id === attractionId);
      const stop: Stop | null = sourceStop ?? (attractionData ? builderToStop(attractionData, prev.city) : null);
      if (!stop) return prev;

      const newTargetStops = insertAttractionInLightestSegment(targetDay.stops, stop);
      const newSourceStops = optimizeAttractionsBetweenFoodStops(
        sourceDay.stops.filter((s) => !(s.type === "attraction" && s.id === attractionId)),
      );

      return {
        ...prev,
        days: prev.days.map((d, i) => {
          if (i === sourceDayIndex) return {
            ...d,
            stops: newSourceStops,
            maps_link: buildMapsLink(newSourceStops, prev.city),
          };
          if (i === dayIndex) return {
            ...d,
            stops: newTargetStops,
            maps_link: buildMapsLink(newTargetStops, prev.city),
          };
          return d;
        }),
      };
    });
  }, [attractions]);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Rimuovi tappa dal giorno (dalla mappa) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  const handleRemoveAttraction = useCallback((dayIndex: number, attractionId: number) => {
    setItinerary((prev) => {
      if (!prev) return prev;
      const day = prev.days[dayIndex];
      if (!day) return prev;
      const remainingStops = optimizeAttractionsBetweenFoodStops(
        day.stops.filter((s) => !(s.type === "attraction" && s.id === attractionId)),
      );
      return {
        ...prev,
        days: prev.days.map((d, i) =>
          i !== dayIndex
            ? d
            : { ...d, stops: remainingStops, maps_link: buildMapsLink(remainingStops, prev.city) },
        ),
      };
    });
  }, []);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Aggiorna nota di una tappa Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  const handleNoteChange = useCallback((dayIndex: number, stopIndex: number, note: string) => {
    setItinerary((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((d, i) =>
          i !== dayIndex ? d : {
            ...d,
            stops: d.stops.map((s, si) =>
              si !== stopIndex ? s : { ...s, notes: note },
            ),
          },
        ),
      };
    });
  }, []);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Riordina tappe di un giorno Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  const handleReorderStops = useCallback((dayIndex: number, newStops: Stop[]) => {
    setItinerary((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((d, i) =>
          i !== dayIndex ? d : { ...d, stops: newStops, maps_link: buildMapsLink(newStops, prev.city) },
        ),
      };
    });
  }, []);

  const handleOptimizeDayOrder = useCallback((dayIndex: number) => {
    setItinerary((prev) => {
      if (!prev) return prev;
      const day = prev.days[dayIndex];
      if (!day) return prev;
      const optimizedStops = optimizeAttractionsBetweenFoodStops(day.stops);
      return {
        ...prev,
        days: prev.days.map((d, i) =>
          i !== dayIndex
            ? d
            : { ...d, stops: optimizedStops, maps_link: buildMapsLink(optimizedStops, prev.city) },
        ),
      };
    });
  }, []);


  const handleExportPdf = async () => {
    if (!itinerary) return;

    setSaveChoiceVisible(false);
    const html = buildItineraryPdfHtml({ itinerary, neighborhoods, cityInfo, lang });
    setPdfPreviewHtml(html);
  };

  const handlePrintPdfPreview = async () => {
    if (!pdfPreviewHtml) return;

    if (Platform.OS !== "web") {
      try {
        const { uri } = await Print.printToFileAsync({ html: pdfPreviewHtml, base64: false });
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
          dialogTitle: lang === "en" ? "Wayra - Itinerary PDF" : "Wayra - Itinerario PDF",
        });
      } catch (e: any) {
        Alert.alert("Errore PDF", e?.message ?? e?.code ?? JSON.stringify(e));
      }
      return;
    }

    const frame = document.getElementById("wayra-pdf-preview") as HTMLIFrameElement | null;
    if (frame?.contentWindow) {
      frame.contentWindow.focus();
      frame.contentWindow.print();
      return;
    }

    const win = window.open("", "_blank");
    if (!win) {
      Alert.alert(
        lang === "en" ? "Popup blocked" : "Popup bloccato",
        lang === "en"
          ? "The preview is visible here. Use your browser print command to save it as PDF."
          : "La preview ÃƒÂ¨ visibile qui. Usa il comando di stampa del browser per salvarla in PDF.",
      );
      return;
    }
    win.document.write(pdfPreviewHtml);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const handleAppSave = async () => {
    if (!itinerary) return;
    if (savedId) await remove(savedId);
    else await save(itinerary);
    setSaveChoiceVisible(false);
  };

  const handleSavePress = () => {
    if (!itinerary) return;
    setSaveChoiceVisible(true);
  };

  if (itineraryLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accentGold} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!itinerary) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.textSub }]}>{t.itineraryUnavailable}</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card2 }]}>
            <Text style={[styles.backBtnText, { color: colors.accentGold }]}>{t.goBack}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const LEVEL_LABEL: Record<string, string> = {
    "1": t.levelIconic, "2": t.levelCurated, "3": t.levelHidden,
  };
  const levelLabel = Array.isArray(itinerary.level)
    ? t.fullMix
    : LEVEL_LABEL[String(itinerary.level)] ?? String(itinerary.level);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* Top bar */}
      <View ref={(ref) => setGuideTarget("header", ref)} style={[styles.topBar, { borderBottomColor: colors.border2, backgroundColor: colors.bg }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card2 }]}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topInfo}>
          <View style={styles.topTitleRow}>
            <Text style={[styles.topBrand, { color: colors.accentGold }]}>WAYRA</Text>
            <Text style={[styles.topDivider, { color: colors.textMuted }]}>-</Text>
            <Text style={[styles.topCity, { color: colors.text }]}>{cityLabel(itinerary.city, lang).toUpperCase()}</Text>
          </View>
          <Text style={[styles.topMeta, { color: colors.textMuted }]}>
            {itinerary.num_days} {itinerary.num_days === 1 ? t.day : t.days} - {levelLabel}
          </Text>
        </View>
        <TouchableOpacity onPress={handleSavePress} activeOpacity={0.7} style={[styles.saveBtn, { backgroundColor: colors.card2 }]}>
          <Ionicons
            name={savedId ? "bookmark" : "bookmark-outline"}
            size={20}
            color={savedId ? colors.accentGold : colors.textMuted}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowGuide(true)}
          activeOpacity={0.7}
          style={[styles.flagBtn, styles.guideBtn, { backgroundColor: colors.accentGold + "14", borderColor: colors.accentGold + "70" }]}
          accessibilityLabel={lang === "en" ? "Open guide" : "Apri guida"}
        >
          <Ionicons name="help-circle-outline" size={23} color={colors.accentGold} />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggle} activeOpacity={0.7} style={[styles.flagBtn, { backgroundColor: colors.card2 }]}>
          <CountryFlag isoCode={lang === "it" ? "it" : "gb"} size={14} />
        </TouchableOpacity>
      </View>

      {/* Tab switcher */}
      <View ref={(ref) => setGuideTarget("tabs", ref)} style={[styles.tabs, { backgroundColor: colors.card2 }]}>
        <TabButton label={t.tabItinerary}     icon="map-outline"               active={tab === "itinerary"}   onPress={() => setTab("itinerary")} />
        <TabButton label={t.tabNeighborhoods} icon="bed-outline"              active={tab === "neighborhoods"} onPress={() => setTab("neighborhoods")} />
        <TabButton label={t.tabFood}          icon="restaurant-outline"       active={tab === "food"}        onPress={() => setTab("food")} />
        <TabButton label={t.tabCulture}       icon="book-outline"             active={tab === "culture"}     onPress={() => setTab("culture")} />
        <TabButton label={t.tabPractical}     icon="information-circle-outline" active={tab === "practical"}  onPress={() => setTab("practical")} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!dayCardDragging}
      >
        <View ref={(ref) => setGuideTarget("content", ref)}>
        {tab === "itinerary" && (
          <>
            {(attractions.length > 0 || foodSpots.length > 0) && (
              <View style={styles.globalToolsRow}>
                <View style={styles.globalToolsStack}>
                  {attractions.length > 0 && (
                    <TouchableOpacity
                      style={[styles.globalMapBtn, { backgroundColor: colors.accentGold + "14", borderColor: colors.accentGold + "44" }]}
                      onPress={() => {
                        setMapMode("itinerary");
                        setFoodSelection(null);
                        setMapDayNumber(itinerary.days[0]?.day ?? 1);
                        setMapVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="map-outline" size={16} color={colors.accentGold} />
                      <Text style={[styles.globalMapBtnText, { color: colors.accentGold }]}>
                        {lang === "en" ? "Open Map" : "Apri Mappa"}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {foodSpots.length > 0 && (
                    <TouchableOpacity
                      style={[styles.globalFoodBtn, { backgroundColor: colors.accentGreen + "12", borderColor: colors.accentGreen + "55" }]}
                      onPress={() => {
                        const activeDayIndex = Math.max(0, itinerary.days.findIndex((d) => d.day === (openDay ?? itinerary.days[0]?.day)));
                        handleFindFood(activeDayIndex);
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="restaurant-outline" size={17} color={colors.accentGreen} />
                      <Text style={[styles.globalFoodBtnText, { color: colors.accentGreen }]}>
                        {lang === "en" ? "Where should I eat?" : "Dove mangio?"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.mapInfoBtn, { backgroundColor: colors.accentBlue + "14", borderColor: colors.accentBlue + "55" }]}
                  onPress={() => setMapInfoVisible(true)}
                  activeOpacity={0.8}
                  accessibilityLabel={lang === "en" ? "Map and food info" : "Info mappa e cibo"}
                >
                  <Ionicons name="information-circle-outline" size={22} color={colors.accentBlue} />
                </TouchableOpacity>
              </View>
            )}
            {itinerary.days.map((day, i) => (
              <FadeInUp key={day.day} delay={staggerDelay(i, 70, 350)}>
                <DayCard
                  day={day}
                  open={openDay === day.day}
                  onToggleOpen={() => setOpenDay((current) => current === day.day ? null : day.day)}
                  onOptimizeDay={() => handleOptimizeDayOrder(i)}
                  onReorder={(newStops) => handleReorderStops(i, newStops)}
                  onNoteChange={(stopIndex, note) => handleNoteChange(i, stopIndex, note)}
                  onDragStateChange={setDayCardDragging}
                  onRemoveRestaurant={(restaurantId) => handleRemoveRestaurant(i, restaurantId)}
                />
              </FadeInUp>
            ))}
          </>
        )}

        {tab === "neighborhoods" && (
          <>
            <Text style={[styles.sectionIntro, { color: colors.textMuted }]}>
              {t.neighborhoodsIntro(itinerary.city)}
            </Text>
            {neighborhoodsLoading ? (
              <ActivityIndicator color={colors.accentGold} style={{ marginTop: 32 }} />
            ) : neighborhoods.length === 0 ? (
              <View style={styles.emptyNeighborhoods}>
                <Text style={styles.emptyNeighborhoodsEmoji}>Ã°Å¸ÂËœÃ¯Â¸Â</Text>
                <Text style={[styles.emptyNeighborhoodsText, { color: colors.textMuted }]}>{t.noNeighborhoodsData}</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setNeighborhoodMapVisible(true)}
                  activeOpacity={0.82}
                  style={[styles.neighborhoodMapBtn, { backgroundColor: colors.card2, borderColor: colors.accentGold + "66" }]}
                >
                  <Ionicons name="map-outline" size={18} color={colors.accentGold} />
                  <Text style={[styles.neighborhoodMapBtnText, { color: colors.text }]}>
                    {lang === "en" ? "Open lodging map" : "Apri mappa alloggi"}
                  </Text>
                </TouchableOpacity>
                {neighborhoods.map((n) => (
                  <NeighborhoodCard key={n.id} neighborhood={n} lang={lang} city={itinerary.city} />
                ))}
              </>
            )}
          </>
        )}

        {tab === "food" && (
          <>
            <Text style={[styles.sectionIntro, { color: colors.textMuted }]}>{t.foodIntro(itinerary.city)}</Text>
            {itinerary.food_recommendations.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                expanded={openFoodId === food.id}
                onToggle={() => setOpenFoodId((current) => current === food.id ? null : food.id)}
              />
            ))}
          </>
        )}

        {tab === "culture" && (
          <>
            <Text style={[styles.sectionIntro, { color: colors.textMuted }]}>{t.cultureIntro(itinerary.city)}</Text>
            {(itinerary.culture_facts ?? []).map((fact, i) => (
              <CultureCard key={i} fact={fact} />
            ))}
          </>
        )}

        {tab === "practical" && (
          <>
            <Text style={[styles.sectionIntro, { color: colors.textMuted }]}>{t.practicalIntro(itinerary.city)}</Text>
            {cityInfoLoading ? (
              <ActivityIndicator color={colors.accentGold} style={{ marginTop: 40 }} />
            ) : cityInfo ? (
              <PracticalInfoTab info={cityInfo} />
            ) : (
              <Text style={[styles.sectionIntro, { color: colors.textMuted, textAlign: "center", marginTop: 40 }]}>
                {t.noPracticalData}
              </Text>
            )}
          </>
        )}
        </View>
      </ScrollView>

      {/* Modal scelta salvataggio */}
      <Modal
        visible={saveChoiceVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSaveChoiceVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSaveChoiceVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.saveSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {lang === "en" ? "Save itinerary" : "Salva itinerario"}
            </Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              {lang === "en" ? "Choose how you want to keep this trip." : "Scegli come vuoi conservare questo viaggio."}
            </Text>

            <TouchableOpacity style={[styles.saveOptionBtn, { borderColor: colors.border2, backgroundColor: colors.card2 }]} onPress={handleAppSave} activeOpacity={0.85}>
              <Ionicons name={savedId ? "bookmark" : "bookmark-outline"} size={20} color={colors.accentGold} />
              <View style={styles.saveOptionTextWrap}>
                <Text style={[styles.saveOptionTitle, { color: colors.text }]}>
                  {savedId
                    ? (lang === "en" ? "Remove from app" : "Rimuovi dall'app")
                    : (lang === "en" ? "Save in app" : "Salva nell'app")}
                </Text>
                <Text style={[styles.saveOptionSub, { color: colors.textMuted }]}>
                  {lang === "en" ? "Keep it in your saved itineraries." : "Lo trovi nella lista degli itinerari salvati."}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.saveOptionBtn, { borderColor: colors.accentGold + "66", backgroundColor: colors.accentGold + "18" }]} onPress={handleExportPdf} activeOpacity={0.85}>
              <Ionicons name="document-text-outline" size={20} color={colors.accentGold} />
              <View style={styles.saveOptionTextWrap}>
                <Text style={[styles.saveOptionTitle, { color: colors.text }]}>
                  {lang === "en" ? "Export PDF" : "Esporta PDF"}
                </Text>
                <Text style={[styles.saveOptionSub, { color: colors.textMuted }]}>
                  {lang === "en" ? "Itinerary, lodging, cuisine, culture and practical info." : "Itinerario, alloggi, cucina, cultura e info utili."}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setSaveChoiceVisible(false)} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>{lang === "en" ? "Cancel" : "Annulla"}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Info mappa e ristoranti */}
      <Modal
        visible={mapInfoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMapInfoVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setMapInfoVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.mapInfoSheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.modalHandle, { backgroundColor: colors.border2 }]} />
            <View style={styles.mapInfoHeader}>
              <View style={styles.mapInfoTitleWrap}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {lang === "en" ? "Map tools" : "Strumenti mappa"}
                </Text>
                <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                  {lang === "en"
                    ? "Use these two actions for different moments of the trip."
                    : "Usa questi due comandi per momenti diversi del viaggio."}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.mapInfoCloseBtn, { backgroundColor: colors.card2, borderColor: colors.border2 }]}
                onPress={() => setMapInfoVisible(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.mapInfoCards}>
              <View style={[styles.mapInfoCard, { backgroundColor: colors.accentGold + "12", borderColor: colors.accentGold + "44" }]}>
                <View style={styles.mapInfoCardHeader}>
                  <View style={[styles.mapInfoIconBox, { backgroundColor: colors.accentGold + "22" }]}>
                    <Ionicons name="map-outline" size={19} color={colors.accentGold} />
                  </View>
                  <View style={styles.mapInfoCardTitleWrap}>
                    <Text style={[styles.mapInfoCardKicker, { color: colors.accentGold }]}>
                      {lang === "en" ? "Daily itinerary" : "Itinerario giornaliero"}
                    </Text>
                    <Text style={[styles.mapInfoCardTitle, { color: colors.text }]}>
                      {lang === "en" ? "Open Map" : "Apri Mappa"}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.mapInfoCardBody, { color: colors.textSub }]}>
                  {lang === "en"
                    ? "Shows the route for the selected day. From here you can inspect stops, add nearby attractions, move places from another day, remove places, measure walking distance and reorder the route."
                    : "Mostra il percorso del giorno selezionato. Da qui puoi controllare le tappe, aggiungere attrazioni vicine, spostare luoghi da altri giorni, rimuovere tappe, vedere la distanza a piedi e riordinare il percorso."}
                </Text>
              </View>

              <View style={[styles.mapInfoDivider, { backgroundColor: colors.border2 }]} />

              <View style={[styles.mapInfoCard, { backgroundColor: colors.accentGreen + "12", borderColor: colors.accentGreen + "44" }]}>
                <View style={styles.mapInfoCardHeader}>
                  <View style={[styles.mapInfoIconBox, { backgroundColor: colors.accentGreen + "22" }]}>
                    <Ionicons name="restaurant-outline" size={19} color={colors.accentGreen} />
                  </View>
                  <View style={styles.mapInfoCardTitleWrap}>
                    <Text style={[styles.mapInfoCardKicker, { color: colors.accentGreen }]}>
                      {lang === "en" ? "Restaurants" : "Ristoranti"}
                    </Text>
                    <Text style={[styles.mapInfoCardTitle, { color: colors.text }]}>
                      {lang === "en" ? "Where should I eat?" : "Dove mangio?"}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.mapInfoCardBody, { color: colors.textSub }]}>
                  {lang === "en"
                    ? "Opens the restaurant map. If you are in the destination city it can use your current position to suggest nearby places; if you are elsewhere it keeps your position hidden and shows destination restaurants only."
                    : "Apre la mappa dei ristoranti. Se sei nella cittÃ  del viaggio puÃ² usare la tua posizione per suggerire posti vicini; se sei altrove non mostra la tua posizione e visualizza solo i ristoranti della destinazione."}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.mapInfoDoneBtn, { backgroundColor: colors.accentBlue, borderColor: colors.accentBlue }]}
              onPress={() => setMapInfoVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={[styles.mapInfoDoneText, { color: colors.bg }]}>
                {lang === "en" ? "Got it" : "Ho capito"}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Preview PDF web */}
      {(Platform.OS === "web" || Platform.OS === "ios" || Platform.OS === "android") && (
        <Modal
          visible={pdfPreviewHtml !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setPdfPreviewHtml(null)}
        >
          <SafeAreaView style={[styles.pdfPreviewBackdrop, { backgroundColor: colors.bg }]}>
            <View style={[styles.pdfPreviewSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.pdfPreviewHeader}>
                <View style={styles.pdfPreviewTitleWrap}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {lang === "en" ? "Document preview" : "Anteprima documento"}
                  </Text>
                  <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                    {lang === "en" ? "Check the paged document before saving or sharing it." : "Controlla il documento impaginato prima di salvarlo o condividerlo."}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPdfPreviewHtml(null)} style={[styles.saveBtn, { backgroundColor: colors.card2 }]}>
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={[styles.pdfDocumentViewport, { backgroundColor: colors.card2, borderColor: colors.border }]}>
                <View style={[styles.pdfDocumentPaper, { borderColor: colors.border2, backgroundColor: colors.bg }]}>
                  {Platform.OS === "web"
                    ? React.createElement("iframe", {
                        id: "wayra-pdf-preview",
                        srcDoc: pdfPreviewHtml ?? "",
                        style: {
                          flex: 1,
                          width: "100%",
                          height: "100%",
                          border: 0,
                          backgroundColor: colors.bg,
                        },
                      })
                    : (
                      <WebView
                        originWhitelist={["*"]}
                        source={{ html: pdfPreviewHtml ?? "" }}
                        style={styles.pdfNativePreview}
                      />
                    )}
                </View>
              </View>
              <TouchableOpacity style={[styles.pdfPrintBtn, { backgroundColor: colors.accentGold }]} onPress={handlePrintPdfPreview} activeOpacity={0.85}>
                <Ionicons name={Platform.OS === "web" ? "print-outline" : "share-outline"} size={18} color={colors.bg} />
                <Text style={[styles.pdfPrintText, { color: colors.bg }]}>
                  {Platform.OS === "web"
                    ? (lang === "en" ? "Print / Save PDF" : "Stampa / Salva PDF")
                    : (lang === "en" ? "Share / Save PDF" : "Condividi / Salva PDF")}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      )}


      {/* Mappa globale con selettore giorno */}
      {mapVisible && (() => {
        const mapDayIndex = itinerary.days.findIndex((d) => d.day === mapDayNumber);
        const safeIndex = mapDayIndex >= 0 ? mapDayIndex : 0;
        const mapDay = itinerary.days[safeIndex];
        return mapDay ? (
          <DayMap
            visible={mapVisible}
            onClose={() => { setMapVisible(false); setMapMode("itinerary"); setFoodSelection(null); }}
            day={mapDay}
            allAttractions={attractions}
            allFoodSpots={enrichedFoodSpots}
            foodSelection={mapMode === "food" && foodSelection
              ? { mealType: foodSelection.mealType, origin: foodSelection.origin }
              : null}
            assignedMap={assignedMap}
            lang={lang}
            accent={DAY_ACCENTS[(mapDay.day - 1) % DAY_ACCENTS.length]}
            onAddAttraction={(id) => handleAddAttraction(safeIndex, id)}
            onMoveAttraction={(id, fromDay) => handleMoveAttraction(safeIndex, id, fromDay)}
            onRemoveAttraction={(id) => handleRemoveAttraction(safeIndex, id)}
            onReorderStops={(newStops) => handleReorderStops(safeIndex, newStops)}
            onSelectFood={handleSelectFoodFromMap}
            onRemoveFood={(id) => handleRemoveRestaurant(safeIndex, id)}
            allDays={itinerary.days}
            onDayChange={(dayNumber) => {
              setMapDayNumber(dayNumber);
              if (mapMode === "food") {
                const nextDayIndex = itinerary.days.findIndex((d) => d.day === dayNumber);
                if (nextDayIndex >= 0) {
                  setFoodSelection((current) => current ? { ...current, dayIndex: nextDayIndex } : current);
                }
              }
            }}
          />
        ) : null;
      })()}

      {neighborhoodMapVisible && (
        <NeighborhoodMap
          visible={neighborhoodMapVisible}
          onClose={() => setNeighborhoodMapVisible(false)}
          neighborhoods={neighborhoods}
          city={itinerary.city}
          cityLabel={cityLabel(itinerary.city, lang)}
          attractions={attractions}
          foodSpots={enrichedFoodSpots}
          lang={lang}
        />
      )}

      {showGuide && (
        <ItineraryGuideModal
          lang={lang}
          slides={lang === "en" ? ITINERARY_GUIDE_EN : ITINERARY_GUIDE_IT}
          targetRefs={guideTargets.current}
          onDone={dismissGuide}
        />
      )}

    </SafeAreaView>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Sub-components Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function ItineraryGuideModal({
  lang, slides, targetRefs, onDone,
}: {
  lang: string;
  slides: GuideStep[];
  targetRefs: Map<string, View>;
  onDone: () => void;
}) {
  const [slide, setSlide] = useState(0);
  const [rect, setRect] = useState<GuideRect | null>(null);
  const { colors } = useTheme();
  const current = slides[slide];
  const isLast = slide === slides.length - 1;
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
                height: Math.min(SCREEN_HEIGHT - rect.y - 12, rect.height + 12),
                borderColor: colors.accentGold,
                backgroundColor: colors.accentGold + "14",
                shadowColor: colors.accentGold,
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
                borderBottomColor: colors.accentGold,
              },
            ]}
          />
        )}
        <View style={[styles.tourCard, { top: tooltipTop, left: tooltipLeft, width: tooltipWidth, backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.tourEyebrow, { color: colors.accentGold }]}>{slide + 1} / {slides.length}</Text>
          <View style={[styles.tourIconBox, { backgroundColor: colors.accentGold + "18", borderColor: colors.accentGold + "44" }]}>
            <Ionicons name={current.icon} size={28} color={colors.accentGold} />
          </View>
          <Text style={[styles.tourTitle, { color: colors.text }]}>{current.title}</Text>
          <Text style={[styles.tourBody, { color: colors.textSub }]}>{current.body}</Text>
          <View style={styles.tourDots}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.tourDot, { backgroundColor: colors.border }, i === slide && { backgroundColor: colors.accentGold, width: 22 }]} />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.tourCta, { backgroundColor: colors.accentGold }]}
            onPress={() => isLast ? onDone() : setSlide((s) => s + 1)}
            activeOpacity={0.85}
          >
            <Text style={[styles.tourCtaText, { color: colors.bg }]}>
              {isLast
                ? (lang === "en" ? "Got it" : "Ho capito")
                : (lang === "en" ? "Next" : "Avanti")}
            </Text>
          </TouchableOpacity>
          {!isLast && (
            <TouchableOpacity onPress={onDone} style={styles.tourSkip} activeOpacity={0.7}>
              <Text style={[styles.tourSkipText, { color: colors.textMuted }]}>{lang === "en" ? "Skip" : "Salta"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

function TabButton({ label, icon, active, onPress }: {
  label: string; icon: keyof typeof Ionicons.glyphMap; active: boolean; onPress: () => void;
}) {
  const { colors } = useTheme();
  // Label appare solo quando active, con fade-in delayed dopo l'espansione del tab
  const labelOpacity = useRef(new Animated.Value(active ? 1 : 0)).current;
  const iconScale = useRef(new Animated.Value(active ? 1 : 1.08)).current;

  useEffect(() => {
    labelOpacity.stopAnimation();
    iconScale.stopAnimation();
    if (!active) {
      labelOpacity.setValue(0);
    }

    Animated.parallel([
      Animated.timing(labelOpacity, {
        toValue: active ? 1 : 0,
        duration: active ? 90 : 0,
        delay: 0,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: active ? 1 : 1.08,
        useNativeDriver: true,
        speed: 24,
        bounciness: 5,
      }),
    ]).start();
  }, [active, labelOpacity, iconScale]);

  const iconColor = active ? colors.bg : colors.textMuted;

  return (
    <PressableCard
      style={[
        styles.tabBtn,
        active ? [styles.tabBtnActive, { backgroundColor: colors.accentGold }] : styles.tabBtnInactive,
      ]}
      onPress={onPress}
      haptic="selection"
      pressScale={0.94}
    >
      {/* Icona Ã¢â‚¬â€ centrata orizzontalmente, larghezza esplicita per stabilitÃƒÂ  */}
      <Animated.View style={[styles.tabIconWrap, { transform: [{ scale: iconScale }] }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </Animated.View>
      {/* Label solo se active */}
      {active && (
        <Animated.Text
          style={[styles.tabLabel, { color: colors.bg, opacity: labelOpacity }]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
      )}
    </PressableCard>
  );
}

function NeighborhoodCard({ neighborhood: n, lang }: { neighborhood: Neighborhood; lang: string; city: string }) {
  const { colors } = useTheme();
  const name = (lang === "en" && n.name_en) ? n.name_en : n.name;
  const desc = (lang === "en" && n.description_en) ? n.description_en : n.description;
  const { pros, cons } = neighborhoodProsCons(n.vibe_tags, lang);

  return (
    <View style={[styles.neighborhoodCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Nome quartiere */}
      <Text style={[styles.neighborhoodName, { color: colors.accentGold }]}>{name}</Text>

      {/* Descrizione */}
      <Text style={[styles.neighborhoodDesc, { color: colors.textMuted }]}>{desc}</Text>

      {/* Chip vibe */}
      {n.vibe_tags && n.vibe_tags.length > 0 && (
        <View style={styles.vibeRow}>
          {n.vibe_tags.map((tag) => {
            const vibe = VIBE_MAP[normalizeVibeTag(tag)] ?? { emoji: "??", color: "#888", labelIt: tag, labelEn: tag };
            const label = lang === "en" ? vibe.labelEn : vibe.labelIt;
            return (
              <View
                key={tag}
                style={[styles.vibeChip, { borderColor: vibe.color + "55", backgroundColor: vibe.color + "18" }]}
              >
                <Ionicons name={vibeIconName(tag)} size={13} color={vibe.color} />
                <Text style={[styles.vibeLabel, { color: vibe.color }]}>{label}</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.proConRow}>
        <View style={[styles.proConBox, { borderColor: colors.border2, backgroundColor: colors.card2 }]}>
          <View style={styles.proConTitleRow}>
            <Ionicons name="add-circle-outline" size={14} color={colors.accentGreen} />
            <Text style={[styles.proConTitle, { color: colors.accentGreen }]}>{lang === "en" ? "Pros" : "Pro"}</Text>
          </View>
          {pros.map((item) => (
            <Text key={item} style={[styles.proConText, { color: colors.textSub }]} numberOfLines={2}>{item}</Text>
          ))}
        </View>
        <View style={[styles.proConBox, { borderColor: colors.border2, backgroundColor: colors.card2 }]}>
          <View style={styles.proConTitleRow}>
            <Ionicons name="remove-circle-outline" size={14} color={colors.danger} />
            <Text style={[styles.proConTitle, { color: colors.danger }]}>{lang === "en" ? "Cons" : "Contro"}</Text>
          </View>
          {cons.map((item) => (
            <Text key={item} style={[styles.proConText, { color: colors.textSub }]} numberOfLines={2}>{item}</Text>
          ))}
        </View>
      </View>

    </View>
  );
}

function CultureCard({ fact }: { fact: CultureFact }) {
  const { lang } = useLanguage();
  const { colors } = useTheme();
  const displayTitle = (lang === "en" && fact.title_en) ? fact.title_en : fact.title;
  const displayBody  = (lang === "en" && fact.body_en)  ? fact.body_en  : fact.body;

  return (
    <View style={[styles.cultureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={styles.cultureIcon}>{fact.icon}</Text>
      <View style={styles.cultureContent}>
        <Text style={[styles.cultureTitle, { color: colors.accentPurple }]}>{displayTitle}</Text>
        <Text style={[styles.cultureBody, { color: colors.textMuted }]}>{displayBody}</Text>
      </View>
    </View>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Styles Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const styles = StyleSheet.create({
  safe:   { flex: 1 },

  globalMapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  globalToolsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 9,
    marginBottom: 14,
  },
  globalToolsStack: {
    flex: 1,
    gap: 8,
  },
  globalMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    minHeight: 46,
  },
  globalMapBtnText: {
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  mapInfoBtn: {
    width: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  globalFoodBtn: {
    width: "100%",
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  globalFoodBtnText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  errorText: { fontSize: 15 },

  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  backBtnText: { fontWeight: "600" },
  topInfo: { flex: 1 },
  topTitleRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  topBrand: { fontSize: 20, fontFamily: "BebasNeue_400Regular", letterSpacing: 2 },
  topDivider: { fontSize: 14 },
  topCity:  { fontSize: 20, fontFamily: "BebasNeue_400Regular", letterSpacing: 2 },
  topMeta:  { fontSize: 12, marginTop: 2 },
  saveBtn:  { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  flagBtn:  { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  guideBtn: { borderWidth: 1 },
  flagEmoji: { fontSize: 20 },

  tabs: {
    flexDirection: "row", marginHorizontal: 16, marginVertical: 12,
    borderRadius: 14, padding: 4, gap: 2,
    alignItems: "stretch",
  },
  // Layout verticale (icona sopra, testo sotto) Ã¢â‚¬â€ centrato sul cross axis
  tabBtn: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  // Tab attivo: occupa piÃƒÂ¹ spazio e mostra il testo
  tabBtnActive: { flex: 2, paddingHorizontal: 10 },
  // Tab inattivi: stretti, solo icona
  tabBtnInactive: { flex: 1 },
  // Wrapper icona con larghezza fissa + alignSelf center:
  // - width fissa Ã¢â€ â€™ la transform: scale non disallinea l'icona
  // - alignSelf: center Ã¢â€ â€™ si centra orizzontalmente nel parent (necessario perchÃƒÂ©
  //   l'inner Animated.View di PressableCard usa alignItems: stretch di default,
  //   altrimenti l'icona resterebbe ancorata a sinistra del testo)
  tabIconWrap: {
    width: 24,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 3,
  },
  tabLabel: { fontSize: 12, fontWeight: "800", textAlign: "center", letterSpacing: 0.2, alignSelf: "center" },

  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionIntro: { fontSize: 13, fontStyle: "italic", marginBottom: 16, lineHeight: 20 },

  // Ã¢â€â‚¬Ã¢â€â‚¬ Neighborhoods Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  neighborhoodMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  neighborhoodMapBtnText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  neighborhoodCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    gap: 10,
  },
  neighborhoodName: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  neighborhoodDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  vibeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  vibeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  vibeEmoji: { fontSize: 13 },
  vibeLabel: { fontSize: 11, fontWeight: "700" },
  proConRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  proConBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  proConTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  proConTitle: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  proConText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
  },
  emptyNeighborhoods: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyNeighborhoodsEmoji: { fontSize: 40 },
  emptyNeighborhoodsText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  cultureCard: {
    flexDirection: "row", gap: 14,
    borderRadius: 14, borderWidth: 1,
    padding: 16, marginBottom: 12, alignItems: "flex-start",
  },
  cultureIcon: { fontSize: 28, lineHeight: 34 },
  cultureContent: { flex: 1 },
  cultureTitle: { fontSize: 15, fontWeight: "700", marginBottom: 6, lineHeight: 20 },
  cultureBody:  { fontSize: 13, lineHeight: 20 },

  tourOverlay: {
    flex: 1,
    backgroundColor: "#000000cc",
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
  tourIcon: { fontSize: 38, marginBottom: 2 },
  tourIconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  tourTitle: { fontSize: 18, fontWeight: "800", textAlign: "center", lineHeight: 23 },
  tourBody: { fontSize: 13, textAlign: "center", lineHeight: 19, marginTop: 2, marginBottom: 6 },
  tourDots: { flexDirection: "row", gap: 5, marginVertical: 5 },
  tourDot: { width: 7, height: 7, borderRadius: 4 },
  tourCta: {
    marginTop: 5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    minWidth: 170,
    alignItems: "center",
  },
  tourCtaText: { fontSize: 15, fontWeight: "800" },
  tourSkip: { paddingVertical: 8 },
  tourSkipText: { fontSize: 13 },

  // Ã¢â€â‚¬Ã¢â€â‚¬ Modal Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 12,
    gap: 10,
  },
  saveSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 12,
    gap: 10,
  },
  mapInfoSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 12,
    gap: 14,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: "center", marginBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalSub:   { fontSize: 13, marginBottom: 4 },
  mapInfoHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  mapInfoTitleWrap: {
    flex: 1,
  },
  mapInfoCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mapInfoCards: {
    gap: 12,
  },
  mapInfoCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  mapInfoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  mapInfoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  mapInfoCardTitleWrap: {
    flex: 1,
    gap: 2,
  },
  mapInfoCardKicker: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  mapInfoCardTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  mapInfoCardBody: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  mapInfoDivider: {
    height: 1,
    marginHorizontal: 8,
    opacity: 0.8,
  },
  mapInfoDoneBtn: {
    borderWidth: 1,
    borderRadius: 15,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  mapInfoDoneText: {
    fontSize: 14,
    fontWeight: "900",
  },
  saveOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
  },
  saveOptionTextWrap: { flex: 1, gap: 3 },
  saveOptionTitle: { fontSize: 14, fontWeight: "800" },
  saveOptionSub: { fontSize: 12, lineHeight: 16 },
  pdfPreviewBackdrop: {
    flex: 1,
  },
  pdfPreviewSheet: {
    flex: 1,
    borderRadius: 0,
    borderWidth: 0,
    padding: 14,
    paddingTop: 10,
    gap: 12,
  },
  pdfPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  pdfPreviewTitleWrap: {
    flex: 1,
  },
  pdfDocumentViewport: {
    flex: 1,
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    padding: 8,
    overflow: "hidden",
  },
  pdfDocumentPaper: {
    flex: 1,
    width: "100%",
    maxWidth: 760,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  pdfPrintBtn: {
    minHeight: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  pdfPrintText: {
    fontWeight: "900",
    fontSize: 15,
  },
  pdfNativePreview: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },

  optionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  optionHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 4,
  },
  optionLabel: { fontWeight: "700", fontSize: 13 },
  optionMeta:  { fontSize: 11 },
  optionStop: {
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  optionStopNum: {
    width: 18, height: 18, borderRadius: 9,
    fontSize: 10, fontWeight: "700",
    textAlign: "center", lineHeight: 18,
  },
  optionStopEmoji: { fontSize: 13 },
  optionStopName: { fontSize: 13, fontWeight: "500", flex: 1 },
  cancelBtn: {
    marginTop: 4,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtnText: { fontWeight: "600", fontSize: 14 },
});
