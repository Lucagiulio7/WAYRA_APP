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
  Platform,
} from "react-native";
import { useFonts, BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { WebView } from "react-native-webview";
import { CityInfo, CultureFact, Food, Itinerary, Neighborhood, Stop } from "@/types";
import { useAttractions, BuilderAttraction } from "@/hooks/useAttractions";
import { useNeighborhoods } from "@/hooks/useNeighborhoods";
import { useCityInfo } from "@/hooks/useCityInfo";
import { DayCard } from "@/components/DayCard";
import { DayMap } from "@/components/DayMap";
import { FoodCard } from "@/components/FoodCard";
import { PracticalInfoTab } from "@/components/PracticalInfoTab";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSavedItineraries } from "@/hooks/useSavedItineraries";
import { useTheme } from "@/contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Tab = "itinerary" | "neighborhoods" | "food" | "culture" | "practical";
type GuideStep = { icon: string; title: string; body: string; target: string };
type GuideRect = { x: number; y: number; width: number; height: number };

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const ITINERARY_GUIDE_KEY = "wayra_itinerary_guide_v1";
const DAY_ACCENTS = ["#e8c06a", "#7eb8f7", "#a78bfa", "#6ee7b7", "#f97316"];

const ITINERARY_GUIDE_IT: GuideStep[] = [
  {
    icon: "🧭",
    target: "header",
    title: "Barra superiore",
    body: "Qui trovi città, durata e tipo di viaggio. La freccia torna indietro, il segnalibro salva l'itinerario, il punto interrogativo riapre questa guida e la bandiera cambia lingua.",
  },
  {
    icon: "📌",
    target: "tabs",
    title: "Sezioni",
    body: "Le tab dividono l'itinerario: giornate, quartieri, cibo, cultura e informazioni pratiche. Toccale per cambiare contenuto senza uscire dalla schermata.",
  },
  {
    icon: "🗺️",
    target: "content",
    title: "Giornate",
    body: "Nella tab Itinerario trovi le schede giorno. Apri un giorno per vedere le tappe, i comandi di modifica, il percorso e i link a Google Maps.",
  },
  {
    icon: "🏘️",
    target: "content",
    title: "Quartieri",
    body: "La sezione Quartieri aiuta a scegliere dove dormire o dove passare più tempo, con vibe, distanze e link utili.",
  },
  {
    icon: "🍽️",
    target: "content",
    title: "Cibo e cultura",
    body: "Cibo raccoglie i consigli gastronomici. Cultura mostra curiosità e note locali per capire meglio la città durante il viaggio.",
  },
  {
    icon: "ℹ️",
    target: "content",
    title: "Info pratiche",
    body: "Info pratiche contiene dati utili come trasporti, sicurezza, app consigliate e link esterni quando disponibili.",
  },
];

const ITINERARY_GUIDE_EN: GuideStep[] = [
  {
    icon: "🧭",
    target: "header",
    title: "Top bar",
    body: "Here you find city, duration and travel type. The arrow goes back, the bookmark saves the itinerary, the question mark reopens this guide and the flag changes language.",
  },
  {
    icon: "📌",
    target: "tabs",
    title: "Sections",
    body: "Tabs split the itinerary into days, neighborhoods, food, culture and practical info. Tap them to switch content without leaving the screen.",
  },
  {
    icon: "🗺️",
    target: "content",
    title: "Days",
    body: "In the Itinerary tab you find day cards. Open a day to see stops, edit controls, the route and Google Maps links.",
  },
  {
    icon: "🏘️",
    target: "content",
    title: "Neighborhoods",
    body: "Neighborhoods helps you choose where to stay or spend more time, with vibes, distances and useful links.",
  },
  {
    icon: "🍽️",
    target: "content",
    title: "Food and culture",
    body: "Food collects dining recommendations. Culture shows local notes and facts to understand the city better while travelling.",
  },
  {
    icon: "ℹ️",
    target: "content",
    title: "Practical info",
    body: "Practical info contains useful data such as transport, safety, recommended apps and external links when available.",
  },
];

// ── Mappa vibe_tag → emoji + colore ──────────────────────────────────────────

const VIBE_MAP: Record<string, { emoji: string; color: string; labelIt: string; labelEn: string }> = {
  "centro":         { emoji: "🎯", color: "#e8c06a", labelIt: "Centrale",        labelEn: "Central" },
  "centrale":       { emoji: "🎯", color: "#e8c06a", labelIt: "Centrale",        labelEn: "Central" },
  "attrazioni":     { emoji: "🏛️", color: "#9333ea", labelIt: "Vicino attrazioni", labelEn: "Near sights" },
  "vita notturna":  { emoji: "🌙", color: "#7c3aed", labelIt: "Vita notturna",  labelEn: "Nightlife" },
  "metro":          { emoji: "🚇", color: "#2563eb", labelIt: "Metro vicina",    labelEn: "Near metro" },
  "trasporti":      { emoji: "🚊", color: "#2563eb", labelIt: "Ben collegato",   labelEn: "Well connected" },
  "stazione":       { emoji: "🚆", color: "#2563eb", labelIt: "Stazione",        labelEn: "Station" },
  "tranquillo":     { emoji: "🤫", color: "#059669", labelIt: "Tranquillo",      labelEn: "Quiet" },
  "budget":         { emoji: "💰", color: "#d97706", labelIt: "Budget",          labelEn: "Budget" },
  "lusso":          { emoji: "💎", color: "#e8c06a", labelIt: "Lusso",           labelEn: "Luxury" },
  "culturale":      { emoji: "🏛️", color: "#9333ea", labelIt: "Culturale",       labelEn: "Cultural" },
  "mare":           { emoji: "🌊", color: "#0891b2", labelIt: "Mare",            labelEn: "Sea" },
  "spiaggia":       { emoji: "🏖️", color: "#0891b2", labelIt: "Spiaggia",        labelEn: "Beach" },
  "mercati":        { emoji: "🛒", color: "#ca8a04", labelIt: "Mercati",          labelEn: "Markets" },
  "famiglie":       { emoji: "👨‍👩‍👧", color: "#16a34a", labelIt: "Famiglie",        labelEn: "Families" },
  "panoramica":     { emoji: "🌅", color: "#ea580c", labelIt: "Panoramica",      labelEn: "Scenic" },
  "vista panoramica":{ emoji: "🌅", color: "#ea580c", labelIt: "Vista panoramica",labelEn: "Great views" },
  "gastronomia":    { emoji: "🍽️", color: "#dc2626", labelIt: "Gastronomia",     labelEn: "Food scene" },
  "shopping":       { emoji: "🛍️", color: "#db2777", labelIt: "Shopping",        labelEn: "Shopping" },
  "locali":         { emoji: "🍷", color: "#b45309", labelIt: "Atmosfera locale", labelEn: "Local vibe" },
  "università":     { emoji: "🎓", color: "#4f46e5", labelIt: "Universitario",   labelEn: "University" },
  "arte":           { emoji: "🎨", color: "#7c3aed", labelIt: "Arte",            labelEn: "Arts" },
  "sicuro":         { emoji: "🛡️", color: "#16a34a", labelIt: "Sicuro",          labelEn: "Safe" },
  "romantico":      { emoji: "✨", color: "#db2777", labelIt: "Romantico",       labelEn: "Romantic" },
  "turistico":      { emoji: "📸", color: "#e8c06a", labelIt: "Turistico",       labelEn: "Touristy" },
  "autentico":      { emoji: "🧭", color: "#b45309", labelIt: "Autentico",       labelEn: "Authentic" },
  "collina":        { emoji: "⛰️", color: "#059669", labelIt: "Collina",         labelEn: "Hill" },
  "porto":          { emoji: "⚓", color: "#0891b2", labelIt: "Porto",           labelEn: "Harbor" },
};

function normalizeVibeTag(tag: string): string {
  return tag.trim().toLowerCase();
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
  if (hasAny(["vita notturna", "locali", "università"])) add(pros, copy.evening);
  if (hasAny(["tranquillo", "famiglie", "sicuro", "romantico"])) add(pros, copy.quiet);
  if (hasAny(["gastronomia", "mercati"])) add(pros, copy.food);
  if (hasAny(["budget"])) add(pros, copy.value);
  if (hasAny(["lusso"])) add(pros, copy.services);

  if (hasAny(["centro", "centrale", "attrazioni", "turistico", "lusso", "shopping"])) add(cons, copy.crowds);
  if (hasAny(["vita notturna", "locali", "università"])) add(cons, copy.noisy);
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

// ── Geo helpers ───────────────────────────────────────────────────────────────

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

function displayNeighborhoodName(neighborhood: Neighborhood, lang: string): string {
  return lang === "en" && neighborhood.name_en ? neighborhood.name_en : neighborhood.name;
}

function displayNeighborhoodDescription(neighborhood: Neighborhood, lang: string): string {
  return lang === "en" && neighborhood.description_en ? neighborhood.description_en : neighborhood.description;
}

function mapsSearchUrl(stop: Stop, _city: string): string {
  // Use coordinates — always unambiguous regardless of city-name language
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
          <span>${htmlEscape(km)} · ${minutes}h</span>
        </div>
        ${routeLink ? `<a class="route-link" href="${htmlEscape(routeLink)}">${isEn ? "Open walking route" : "Apri percorso a piedi"}</a>` : ""}
        ${stops.map((stop, index) => `
          <div class="stop">
            <div class="num">${index + 1}</div>
            <div>
              <h3>${htmlEscape(displayStopName(stop, lang))}</h3>
              <p>${htmlEscape(lang === "en" && stop.description_en ? stop.description_en : stop.description)}</p>
              <small>${htmlEscape(stop.attraction_type ?? "")}${stop.estimated_visit_time ? ` · ${stop.estimated_visit_time} min` : ""}</small>
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
                ${r.food_type ? ` · ${htmlEscape(r.food_type)}` : ""}
                ${r.rating != null ? ` · ${r.rating.toFixed(1)}/5` : ""}
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
      ${(food.places ?? []).map((place) => `<p class="tip">${htmlEscape(place.name)}${place.maps_link ? ` · <a href="${htmlEscape(place.maps_link)}">Maps</a>` : ""}</p>`).join("")}
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
      ${cityInfo.emergency_numbers?.length ? `<h3>${isEn ? "Emergency numbers" : "Numeri di emergenza"}</h3>${cityInfo.emergency_numbers.map((item) => `<p class="tip"><strong>${htmlEscape(isEn && item.label_en ? item.label_en : item.label)}</strong> · ${htmlEscape(item.number)}</p>`).join("")}` : ""}
      ${cityInfo.transport_apps?.length ? `<h3>${isEn ? "Transport apps" : "App trasporti"}</h3>${cityInfo.transport_apps.map((app) => `<p class="tip">${htmlEscape(app.name)}${app.description ? ` · ${htmlEscape(isEn && app.description_en ? app.description_en : app.description)}` : ""}</p>`).join("")}` : ""}
      ${cityInfo.useful_apps?.length ? `<h3>${isEn ? "Useful apps" : "App utili"}</h3>${cityInfo.useful_apps.map((app) => `<p class="tip">${htmlEscape(app.name)}${app.description ? ` · ${htmlEscape(isEn && app.description_en ? app.description_en : app.description)}` : ""}</p>`).join("")}` : ""}
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
          <h1>${htmlEscape(itinerary.city.replace(/_/g, " ").toUpperCase())}</h1>
          <div class="meta">${itinerary.num_days} ${isEn ? "days" : "giorni"} · ${htmlEscape(levelLabel)} · ${itinerary.max_walk_km ?? 5} km/${isEn ? "day" : "giorno"}</div>
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
  if (stops.length < 4) return stops;
  const d = (a: Stop, b: Stop) => haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
  const len = (r: Stop[]) => r.slice(0, -1).reduce((s, _, i) => s + d(r[i], r[i + 1]), 0);
  let best = [...stops], bestDist = len(best), improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const c = [...best.slice(0, i), ...best.slice(i, j + 1).reverse(), ...best.slice(j + 1)];
        const cd = len(c);
        if (cd < bestDist - 1e-9) { best = c; bestDist = cd; improved = true; }
      }
    }
  }
  return best;
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
  };
}

function mapsWaypoint(stop: Stop, _city: string): string {
  // Use coordinates — unambiguous and language-independent
  return encodeURIComponent(`${stop.latitude},${stop.longitude}`);
}

const ATTRACTION_EMOJI: Record<string, string> = {
  museo: "🏛️", chiesa: "⛪", parco: "🌿", piazza: "🏟️",
  archeologia: "⚱️", monumento: "🗿", quartiere: "🏘️",
  panorama: "🌅", mercato: "🛒", palazzo: "🏰",
};
function stopEmoji(s: Stop) {
  return ATTRACTION_EMOJI[s.attraction_type ?? ""] ?? "📍";
}

// ── Tipi per il modal opzioni ─────────────────────────────────────────────────

interface ReloadState {
  dayIndex: number;
  dayNumber: number;
  options: Stop[][];
}

interface ReplaceOption {
  stop: Stop;
  distanceKm: number;
}

interface ReplaceState {
  dayIndex: number;
  stopId: number;
  stopName: string;
  options: ReplaceOption[];
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ItineraryScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { lang, t, toggle } = useLanguage();
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>("itinerary");
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
  const { neighborhoods, loading: neighborhoodsLoading } = useNeighborhoods(itinerary?.city ?? "");
  const { cityInfo, loading: cityInfoLoading } = useCityInfo(itinerary?.city ?? "");

  // Mappa attractionId → dayNumber, usata dalla DayMap per classificare i layer
  const assignedMap = useMemo(() => {
    const map = new Map<number, number>();
    itinerary?.days.forEach((d) => {
      d.stops.forEach((s) => {
        if (s.type === "attraction" && s.id > 0) map.set(s.id, d.day);
      });
    });
    return map;
  }, [itinerary]);
  const [reloadState, setReloadState] = useState<ReloadState | null>(null);
  const [replaceState, setReplaceState] = useState<ReplaceState | null>(null);
  const [openFoodId, setOpenFoodId] = useState<number | null>(null);
  const [saveChoiceVisible, setSaveChoiceVisible] = useState(false);
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapDayNumber, setMapDayNumber] = useState(1);

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

  // ── Sostituisci una singola tappa ─────────────────────────────────────────

  const handleReplaceStop = useCallback((dayIndex: number, stopId: number) => {
    if (!itinerary || attractions.length === 0) return;

    const day = itinerary.days[dayIndex];
    const target = day.stops.find((s) => s.id === stopId && s.type === "attraction");
    if (!target) return;

    const usedIds = new Set(
      itinerary.days.flatMap((d) =>
        d.stops.filter((s) => s.type === "attraction" && s.id > 0).map((s) => s.id),
      ),
    );

    const maxWalkKm = itinerary.max_walk_km ?? 4;
    let candidatePool = attractions.filter((a) => !usedIds.has(a.id) && matchesItineraryLevel(a, itinerary.level));
    if (!isExplorerLevel(itinerary.level)) {
      candidatePool = uniqueAttractions([
        ...candidatePool,
        ...attractions.filter((a) => !usedIds.has(a.id) && a.category_level === 2),
      ]);
    }

    const candidates = candidatePool
      .map((a) => {
        const stop = builderToStop(a, itinerary.city);
        const nextStops = day.stops.map((s) => s.id === stopId ? stop : s);
        return {
          attraction: a,
          distanceKm: walkingKm(target, a),
          validDay: canUseDayStops(nextStops.filter((s) => s.type === "attraction"), maxWalkKm),
        };
      })
      .sort((a, b) => {
        if (a.validDay !== b.validDay) return a.validDay ? -1 : 1;
        const aMatchesLevel = matchesItineraryLevel(a.attraction, itinerary.level) ? 1 : 0;
        const bMatchesLevel = matchesItineraryLevel(b.attraction, itinerary.level) ? 1 : 0;
        if (aMatchesLevel !== bMatchesLevel) return bMatchesLevel - aMatchesLevel;
        return a.distanceKm - b.distanceKm;
      })
      .slice(0, 5);

    if (candidates.length === 0) {
      Alert.alert(
        lang === "en" ? "No alternatives" : "Nessuna alternativa",
        lang === "en" ? "No other attractions available nearby." : "Non ci sono altre attrazioni disponibili nelle vicinanze.",
      );
      return;
    }

    setReplaceState({
      dayIndex,
      stopId,
      stopName: (lang === "en" && target.name_en) ? target.name_en : target.name,
      options: candidates.map((c) => ({
        stop: builderToStop(c.attraction, itinerary.city),
        distanceKm: c.distanceKm,
      })),
    });
  }, [itinerary, attractions, lang]);

  const applyReplaceOption = useCallback((dayIndex: number, stopId: number, replacement: Stop) => {
    setItinerary((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((d, i) =>
          i !== dayIndex ? d : {
            ...d,
            stops: d.stops.map((s) => s.id === stopId ? replacement : s),
            maps_link: d.stops.filter((s) => s.type === "attraction").length >= 2
              ? "https://www.google.com/maps/dir/" + d.stops
                .map((s) => s.id === stopId ? replacement : s)
                .filter((s) => s.type === "attraction")
                .map((s) => mapsWaypoint(s, prev.city))
                .join("/") + "?travelmode=walking"
              : "",
          },
        ),
      };
    });
    setReplaceState(null);
  }, []);

  // ── Genera opzioni per il reload del giorno ───────────────────────────────

  const handleReloadDay = useCallback((dayIndex: number) => {
    if (!itinerary || attractions.length === 0) return;

    const usedInOtherDays = new Set(
      itinerary.days
        .filter((_, i) => i !== dayIndex)
        .flatMap((d) => d.stops.filter((s) => s.type === "attraction" && s.id > 0).map((s) => s.id)),
    );
    const maxWalkKm = itinerary.max_walk_km ?? 4;
    const explorer = isExplorerLevel(itinerary.level);
    const iconLevelAvailable = attractions.filter(
      (a) =>
        !usedInOtherDays.has(a.id) &&
        matchesItineraryLevel(a, itinerary.level),
    );
    const fallbackLevel2 = explorer
      ? []
      : attractions.filter((a) => !usedInOtherDays.has(a.id) && a.category_level === 2);
    let available = iconLevelAvailable.length > 0 ? iconLevelAvailable : fallbackLevel2;

    if (available.length === 0) {
      Alert.alert(
        lang === "en" ? "No alternatives" : "Nessuna alternativa",
        lang === "en" ? "No other attractions available for this day." : "Non ci sono altre attrazioni disponibili per questo giorno.",
      );
      return;
    }

    // Ordina per distanza al centroide del giorno corrente
    const current = itinerary.days[dayIndex].stops.filter((s) => s.type === "attraction");
    const centLat = current.reduce((s, a) => s + a.latitude, 0) / (current.length || 1);
    const centLon = current.reduce((s, a) => s + a.longitude, 0) / (current.length || 1);

    const currentCentroid = { latitude: centLat, longitude: centLon };
    const groupsMap = new Map<string, BuilderAttraction[]>();
    for (const attraction of available) {
      const key = attractionAreaKey(attraction);
      groupsMap.set(key, [...(groupsMap.get(key) ?? []), attraction]);
    }

    const groups = Array.from(groupsMap.values()).sort((a, b) => {
      const aCentroid = attractionCentroid(a);
      const bCentroid = attractionCentroid(b);
      const aDistance = walkingKm(currentCentroid, aCentroid);
      const bDistance = walkingKm(currentCentroid, bCentroid);
      if (explorer) {
        const aExplorerCount = a.filter((item) => item.category_level >= 2).length;
        const bExplorerCount = b.filter((item) => item.category_level >= 2).length;
        if (aExplorerCount !== bExplorerCount) return bExplorerCount - aExplorerCount;
      }
      return bDistance - aDistance;
    });

    let options: Stop[][] = [];
    const targetStops = Math.max(STOPS_PER_DAY, current.length || STOPS_PER_DAY);
    const buildOptionsFromGroups = (candidateGroups: BuilderAttraction[][], allCandidates: BuilderAttraction[]) => {
      const built: Stop[][] = [];
      for (const group of candidateGroups) {
        if (built.length >= OPTIONS_COUNT) break;
        const option = buildAreaDayOption({
          seedGroup: group,
          allCandidates,
          city: itinerary.city,
          maxWalkKm,
          targetStops,
          explorer,
        });
        if (!option) continue;
        const signature = option.map((s) => s.id).sort((a, b) => a - b).join("-");
        if (!built.some((existing) => existing.map((s) => s.id).sort((a, b) => a - b).join("-") === signature)) {
          built.push(option);
        }
      }
      return built;
    };

    options = buildOptionsFromGroups(groups, available);

    if (options.length === 0 && !explorer && fallbackLevel2.length > 0) {
      available = uniqueAttractions([...iconLevelAvailable, ...fallbackLevel2]);
      const mixedGroupsMap = new Map<string, BuilderAttraction[]>();
      for (const attraction of available) {
        const key = attractionAreaKey(attraction);
        mixedGroupsMap.set(key, [...(mixedGroupsMap.get(key) ?? []), attraction]);
      }
      const mixedGroups = Array.from(mixedGroupsMap.values()).sort((a, b) => {
        const aIconic = a.filter((item) => item.category_level === 1).length;
        const bIconic = b.filter((item) => item.category_level === 1).length;
        if (aIconic !== bIconic) return bIconic - aIconic;
        return b.length - a.length;
      });
      options = buildOptionsFromGroups(mixedGroups, available);
    }

    if (options.length === 0) {
      Alert.alert(
        lang === "en" ? "No complete alternatives" : "Nessuna alternativa completa",
        lang === "en"
          ? "I could not build a full alternative day within the selected walking limit."
          : "Non riesco a costruire un giorno alternativo completo rispettando il limite di km selezionato.",
      );
      return;
    }

    // Se c'è una sola opzione, applica direttamente senza modal
    setReloadState({ dayIndex, dayNumber: itinerary.days[dayIndex].day, options });
  }, [itinerary, attractions, lang]);

  // ── Aggiungi attrazione non assegnata al giorno ───────────────────────────

  const handleAddAttraction = useCallback((dayIndex: number, attractionId: number) => {
    if (!itinerary || attractions.length === 0) return;
    const day = itinerary.days[dayIndex];
    const attraction = attractions.find((a) => a.id === attractionId);
    if (!attraction) return;
    if (day.stops.some((s) => s.id === attractionId)) return; // già presente

    const newStop = builderToStop(attraction, itinerary.city);
    const currentAttractions = day.stops.filter((s) => s.type === "attraction");
    // twoOpt ottimizza solo le attrazioni; gli altri stop (food, free_time) sono preservati separatamente
    const optimizedAttractions = twoOptStops([...currentAttractions, newStop]);

    const newMapsLink = optimizedAttractions.length >= 2
      ? "https://www.google.com/maps/dir/" +
        optimizedAttractions.map((s) => mapsWaypoint(s, itinerary.city)).join("/") +
        "?travelmode=walking"
      : "";

    // Recupera gli stop non-attrazione (food, free_time) per non perderli
    const nonAttractionStops = day.stops.filter((s) => s.type !== "attraction");

    setItinerary((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((d, i) =>
          i !== dayIndex
            ? d
            : { ...d, stops: [...optimizedAttractions, ...nonAttractionStops], maps_link: newMapsLink },
        ),
      };
    });
  }, [itinerary, attractions]);

  // ── Sposta attrazione da un altro giorno a questo ─────────────────────────

  const handleMoveAttraction = useCallback((dayIndex: number, attractionId: number, fromDayNumber: number) => {
    if (!itinerary || attractions.length === 0) return;
    const targetDay = itinerary.days[dayIndex];
    const sourceDayIndex = itinerary.days.findIndex((d) => d.day === fromDayNumber);
    if (sourceDayIndex === -1) return;
    const sourceDay = itinerary.days[sourceDayIndex];

    // Trova lo stop nella giornata sorgente (sia Stop che BuilderAttraction)
    const sourceStop = sourceDay.stops.find((s) => s.id === attractionId && s.type === "attraction");
    const attractionData = attractions.find((a) => a.id === attractionId);
    const stop: Stop = sourceStop ?? (attractionData ? builderToStop(attractionData, itinerary.city) : null!);
    if (!stop) return;

    // Ottimizza le attrazioni del giorno destinazione aggiungendo la nuova tappa
    const targetAttractions = targetDay.stops.filter((s) => s.type === "attraction");
    const newTargetAttractions = twoOptStops([...targetAttractions, stop]);

    // Ottimizza le attrazioni del giorno sorgente rimuovendo la tappa spostata
    const newSourceAttractions = twoOptStops(
      sourceDay.stops.filter((s) => s.type === "attraction" && s.id !== attractionId),
    );

    // Preserva gli stop non-attrazione (food, free_time) di entrambi i giorni
    const sourceNonAttractionStops = sourceDay.stops.filter((s) => s.type !== "attraction");
    const targetNonAttractionStops = targetDay.stops.filter((s) => s.type !== "attraction");

    const buildLink = (stops: Stop[]) =>
      stops.length >= 2
        ? "https://www.google.com/maps/dir/" +
          stops.map((s) => mapsWaypoint(s, itinerary.city)).join("/") +
          "?travelmode=walking"
        : "";

    setItinerary((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((d, i) => {
          if (i === sourceDayIndex) return {
            ...d,
            stops: [...newSourceAttractions, ...sourceNonAttractionStops],
            maps_link: buildLink(newSourceAttractions),
          };
          if (i === dayIndex) return {
            ...d,
            stops: [...newTargetAttractions, ...targetNonAttractionStops],
            maps_link: buildLink(newTargetAttractions),
          };
          return d;
        }),
      };
    });
  }, [itinerary, attractions]);

  // ── Rimuovi tappa dal giorno (dalla mappa) ────────────────────────────────

  const handleRemoveAttraction = useCallback((dayIndex: number, attractionId: number) => {
    if (!itinerary) return;
    const day = itinerary.days[dayIndex];
    const remainingAttractions = twoOptStops(
      day.stops.filter((s) => s.type === "attraction" && s.id !== attractionId),
    );
    const nonAttractionStops = day.stops.filter((s) => s.type !== "attraction");
    const newMapsLink = remainingAttractions.length >= 2
      ? "https://www.google.com/maps/dir/" +
        remainingAttractions.map((s) => mapsWaypoint(s, itinerary.city)).join("/") +
        "?travelmode=walking"
      : "";
    setItinerary((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((d, i) =>
          i !== dayIndex
            ? d
            : { ...d, stops: [...remainingAttractions, ...nonAttractionStops], maps_link: newMapsLink },
        ),
      };
    });
  }, [itinerary]);

  const applyReloadOption = useCallback((dayIndex: number, newStops: Stop[]) => {
    const newMapsLink = newStops.length >= 2
      ? "https://www.google.com/maps/dir/" + newStops.map((s) => mapsWaypoint(s, itinerary?.city ?? "")).join("/") + "?travelmode=walking"
      : "";
    setItinerary((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((d, i) =>
          i !== dayIndex ? d : { ...d, stops: newStops, maps_link: newMapsLink },
        ),
      };
    });
    setReloadState(null);
  }, [itinerary?.city]);

  // ── Aggiorna nota di una tappa ───────────────────────────────────────────────

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

  // ── Riordina tappe di un giorno ─────────────────────────────────────────────

  const handleReorderStops = useCallback((dayIndex: number, newStops: Stop[]) => {
    setItinerary((prev) => {
      if (!prev) return prev;
      const attractionStops = newStops.filter((s) => s.type === "attraction");
      const newMapsLink = attractionStops.length >= 2
        ? "https://www.google.com/maps/dir/" +
          attractionStops.map((s) => mapsWaypoint(s, prev.city)).join("/") +
          "?travelmode=walking"
        : prev.days[dayIndex]?.maps_link ?? "";
      return {
        ...prev,
        days: prev.days.map((d, i) =>
          i !== dayIndex ? d : { ...d, stops: newStops, maps_link: newMapsLink },
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
          : "La preview è visibile qui. Usa il comando di stampa del browser per salvarla in PDF.",
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

  const OPTION_LABELS = lang === "en"
    ? ["Option A", "Option B", "Option C"]
    : ["Opzione A", "Opzione B", "Opzione C"];

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
            <Text style={[styles.topDivider, { color: colors.textMuted }]}>·</Text>
            <Text style={[styles.topCity, { color: colors.text }]}>{itinerary.city.replace(/_/g, " ").toUpperCase()}</Text>
          </View>
          <Text style={[styles.topMeta, { color: colors.textMuted }]}>
            {itinerary.num_days} {t.days} · {levelLabel}
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
          <Text style={styles.flagEmoji}>{lang === "it" ? "🇮🇹" : "🇬🇧"}</Text>
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View ref={(ref) => setGuideTarget("content", ref)}>
        {tab === "itinerary" && (
          <>
            {attractions.length > 0 && (
              <TouchableOpacity
                style={[styles.globalMapBtn, { backgroundColor: colors.accentGold + "14", borderColor: colors.accentGold + "44" }]}
                onPress={() => { setMapDayNumber(itinerary.days[0]?.day ?? 1); setMapVisible(true); }}
                activeOpacity={0.8}
              >
                <Ionicons name="map-outline" size={16} color={colors.accentGold} />
                <Text style={[styles.globalMapBtnText, { color: colors.accentGold }]}>
                  {lang === "en" ? "Open Map" : "Apri Mappa"}
                </Text>
              </TouchableOpacity>
            )}
            {itinerary.days.map((day, i) => (
              <DayCard
                key={day.day}
                day={day}
                open={openDay === day.day}
                onToggleOpen={() => setOpenDay((current) => current === day.day ? null : day.day)}
                onReplaceStop={(stopId) => handleReplaceStop(i, stopId)}
                onReloadDay={() => handleReloadDay(i)}
                onReorder={(newStops) => handleReorderStops(i, newStops)}
                onNoteChange={(stopIndex, note) => handleNoteChange(i, stopIndex, note)}
              />
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
                <Text style={styles.emptyNeighborhoodsEmoji}>🏘️</Text>
                <Text style={[styles.emptyNeighborhoodsText, { color: colors.textMuted }]}>{t.noNeighborhoodsData}</Text>
              </View>
            ) : (
              neighborhoods.map((n) => (
                <NeighborhoodCard key={n.id} neighborhood={n} lang={lang} city={itinerary.city} />
              ))
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

      {/* Modal selezione opzioni giorno */}
      <Modal
        visible={reloadState !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setReloadState(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setReloadState(null)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border2 }]} />

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {lang === "en"
                ? `Alternative options — Day ${reloadState?.dayNumber}`
                : `Opzioni alternative — Giorno ${reloadState?.dayNumber}`}
            </Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              {lang === "en" ? "Choose a new day plan" : "Scegli un nuovo programma per la giornata"}
            </Text>

            {reloadState?.options.map((option, oi) => (
              <TouchableOpacity
                key={oi}
                style={[styles.optionCard, { backgroundColor: colors.card2, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() => applyReloadOption(reloadState.dayIndex, option)}
              >
                <View style={styles.optionHeader}>
                  <Text style={[styles.optionLabel, { color: colors.accentGold }]}>{OPTION_LABELS[oi]}</Text>
                  <Text style={[styles.optionMeta, { color: colors.textMuted }]}>
                    {option.length} {lang === "en" ? "stops" : "tappe"} ·{" "}
                    {option.reduce((s, st) => s + (st.estimated_visit_time ?? 0), 0)} min - {formatDistance(routeWalkingKm(option))}
                  </Text>
                </View>
                {option.map((stop, si) => (
                  <View key={stop.id} style={styles.optionStop}>
                    <Text style={[styles.optionStopNum, { backgroundColor: colors.border, color: colors.textSub }]}>{si + 1}</Text>
                    <Text style={styles.optionStopEmoji}>{stopEmoji(stop)}</Text>
                    <Text style={[styles.optionStopName, { color: colors.textSub }]} numberOfLines={1}>
                      {(lang === "en" && stop.name_en) ? stop.name_en : stop.name}
                    </Text>
                  </View>
                ))}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.border }]} onPress={() => setReloadState(null)} activeOpacity={0.8}>
              <Text style={[styles.cancelBtnText, { color: colors.textSub }]}>{lang === "en" ? "Cancel" : "Annulla"}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal sostituzione singola */}
      <Modal
        visible={replaceState !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setReplaceState(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setReplaceState(null)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border2 }]} />

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {lang === "en" ? "Nearby alternatives" : "Alternative vicine"}
            </Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              {lang === "en"
                ? `Replace ${replaceState?.stopName ?? "stop"}`
                : `Sostituisci ${replaceState?.stopName ?? "la tappa"}`}
            </Text>

            {replaceState?.options.map((option, oi) => (
              <TouchableOpacity
                key={option.stop.id}
                style={[styles.replaceOptionCard, { backgroundColor: colors.card2, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() => applyReplaceOption(replaceState.dayIndex, replaceState.stopId, option.stop)}
              >
                <Text style={styles.optionStopNum}>{oi + 1}</Text>
                <Text style={styles.optionStopEmoji}>{stopEmoji(option.stop)}</Text>
                <View style={styles.replaceOptionInfo}>
                  <Text style={styles.optionStopName} numberOfLines={1}>
                    {(lang === "en" && option.stop.name_en) ? option.stop.name_en : option.stop.name}
                  </Text>
                  <Text style={[styles.replaceOptionMeta, { color: colors.accentGreen }]}>
                    {option.stop.estimated_visit_time ?? 60} min · {formatDistance(option.distanceKm)}
                  </Text>
                </View>
                <Ionicons name="swap-horizontal-outline" size={18} color={colors.accentBlue} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.border }]} onPress={() => setReplaceState(null)} activeOpacity={0.8}>
              <Text style={[styles.cancelBtnText, { color: colors.textSub }]}>{lang === "en" ? "Cancel" : "Annulla"}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Mappa globale con selettore giorno */}
      {mapVisible && (() => {
        const mapDayIndex = itinerary.days.findIndex((d) => d.day === mapDayNumber);
        const safeIndex = mapDayIndex >= 0 ? mapDayIndex : 0;
        const mapDay = itinerary.days[safeIndex];
        return mapDay ? (
          <DayMap
            visible={mapVisible}
            onClose={() => setMapVisible(false)}
            day={mapDay}
            allAttractions={attractions}
            assignedMap={assignedMap}
            lang={lang}
            accent={DAY_ACCENTS[(mapDay.day - 1) % DAY_ACCENTS.length]}
            onAddAttraction={(id) => handleAddAttraction(safeIndex, id)}
            onMoveAttraction={(id, fromDay) => handleMoveAttraction(safeIndex, id, fromDay)}
            onRemoveAttraction={(id) => handleRemoveAttraction(safeIndex, id)}
            allDays={itinerary.days}
            onDayChange={setMapDayNumber}
          />
        ) : null;
      })()}

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

// ── Sub-components ────────────────────────────────────────────────────────────

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
          <Text style={styles.tourIcon}>{current.icon}</Text>
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
  return (
    <TouchableOpacity
      style={[styles.tabBtn, active ? [styles.tabBtnActive, { backgroundColor: colors.accentGold }] : styles.tabBtnInactive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={active ? 15 : 18} color={active ? colors.bg : colors.textMuted} />
      {active && <Text style={[styles.tabLabel, { color: colors.bg }]}>{label}</Text>}
    </TouchableOpacity>
  );
}

function NeighborhoodCard({ neighborhood: n, lang, city }: { neighborhood: Neighborhood; lang: string; city: string }) {
  const { colors } = useTheme();
  const name = (lang === "en" && n.name_en) ? n.name_en : n.name;
  const desc = (lang === "en" && n.description_en) ? n.description_en : n.description;
  const { pros, cons } = neighborhoodProsCons(n.vibe_tags, lang);

  // URL Booking: usa quello specifico dal DB, altrimenti genera una ricerca per zona
  const bookingUrl = n.booking_url
    ?? `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(name + ", " + city)}&lang=${lang === "en" ? "en-gb" : "it"}`;

  const openBooking = () => Linking.openURL(bookingUrl);

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
            const vibe = VIBE_MAP[normalizeVibeTag(tag)] ?? { emoji: "📍", color: "#888", labelIt: tag, labelEn: tag };
            const label = lang === "en" ? vibe.labelEn : vibe.labelIt;
            return (
              <View
                key={tag}
                style={[styles.vibeChip, { borderColor: vibe.color + "55", backgroundColor: vibe.color + "18" }]}
              >
                <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
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

      {/* Bottone Booking */}
      <TouchableOpacity style={styles.bookingBtn} onPress={openBooking} activeOpacity={0.8}>
        <Text style={styles.bookingBtnIcon}>🏨</Text>
        <Text style={styles.bookingBtnText}>
          {lang === "en" ? "Find hotels on Booking.com" : "Trova hotel su Booking.com"}
        </Text>
        <Ionicons name="chevron-forward" size={13} color="#0071c2" style={{ marginLeft: "auto" }} />
      </TouchableOpacity>
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1 },

  globalMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  globalMapBtnText: {
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.3,
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
  flagBtn:  { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  guideBtn: { borderWidth: 1 },
  flagEmoji: { fontSize: 20 },

  tabs: {
    flexDirection: "row", marginHorizontal: 16, marginVertical: 12,
    borderRadius: 14, padding: 4, gap: 2,
    alignItems: "center",
  },
  tabBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 8, borderRadius: 10,
  },
  tabBtnActive: {
    flex: 2,                    // il tab attivo occupa più spazio per mostrare il testo
    paddingHorizontal: 10,
  },
  tabBtnInactive: {
    flex: 1,                    // i tab inattivi sono compatti (solo icona)
  },
  tabLabel: { fontWeight: "700", fontSize: 11 },

  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionIntro: { fontSize: 13, fontStyle: "italic", marginBottom: 16, lineHeight: 20 },

  // ── Neighborhoods ────────────────────────────────────────────────────────────
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
  bookingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#0071c240",
    backgroundColor: "#0071c210",
  },
  bookingBtnIcon: { fontSize: 15 },
  bookingBtnText: {
    color: "#4da6e8",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
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

  // ── Modal ──────────────────────────────────────────────────────────────────
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
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: "center", marginBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalSub:   { fontSize: 13, marginBottom: 4 },
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
  replaceOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  replaceOptionInfo: { flex: 1 },
  replaceOptionMeta: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },

  cancelBtn: {
    marginTop: 4,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtnText: { fontWeight: "600", fontSize: 14 },
});
