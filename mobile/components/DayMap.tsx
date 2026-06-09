import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ItineraryDay, Stop } from "@/types";
import { BuilderAttraction } from "@/hooks/useAttractions";
import { useTheme } from "@/contexts/ThemeContext";
import { DraggableStopList } from "./DraggableStopList";
import { BottomSheet, PressableCard } from "./ui";

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  day: ItineraryDay;
  allAttractions: BuilderAttraction[];
  allFoodSpots?: BuilderAttraction[];
  foodSelection?: { mealType?: string | null; origin?: { latitude: number; longitude: number; name?: string } } | null;
  /** attractionId → dayNumber (per classificare layer 2 vs layer 3) */
  assignedMap: Map<number, number>;
  lang: string;
  accent: string;
  /** Aggiunge un'attrazione non assegnata al giorno corrente */
  onAddAttraction?: (attractionId: number) => void;
  /** Sposta un'attrazione da un altro giorno al giorno corrente */
  onMoveAttraction?: (attractionId: number, fromDay: number) => void;
  /** Rimuove una tappa dal giorno corrente */
  onRemoveAttraction?: (attractionId: number) => void;
  /** Riordina le tappe del giorno corrente (chiamato dalla tendina con drag&drop) */
  onReorderStops?: (newStops: Stop[]) => void;
  onSelectFood?: (foodSpotId: number) => void;
  onRemoveFood?: (foodSpotId: number) => void;
  /** Tutte le giornate (per il selettore giorno nell'header) */
  allDays?: ItineraryDay[];
  /** Callback quando l'utente cambia giorno dal selettore */
  onDayChange?: (dayNumber: number) => void;
}

const DAY_ACCENTS = ["#e8c06a", "#7eb8f7", "#a78bfa", "#6ee7b7", "#f97316"];

// ── Costruzione HTML Leaflet ──────────────────────────────────────────────────

function esc(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(
  day: ItineraryDay,
  allAttractions: BuilderAttraction[],
  allFoodSpots: BuilderAttraction[],
  foodSelection: { mealType?: string | null; origin?: { latitude: number; longitude: number; name?: string } } | null | undefined,
  assignedMap: Map<number, number>,
  lang: string,
  accent: string,
  isDark: boolean,
): string {
  const isEn = lang === "en";

  // Colori tema per l'HTML interno
  const mapBg      = isDark ? "#0a0a1a"              : "#f0eff0";
  const popupBg    = isDark ? "#161625"              : "#ffffff";
  const popupBdr   = isDark ? "#2a2a42"              : "#d0d0e0";
  const popupText  = isDark ? "#f0f0f0"              : "#1a1928";
  const popupSub   = isDark ? "#aaa"                 : "#555";
  const popupMeta  = isDark ? "#555"                 : "#888";
  const filterBg   = isDark ? "rgba(12,12,26,0.92)"  : "rgba(245,245,245,0.95)";
  const filterBdr  = isDark ? "#2a2a42"              : "#c0c0d0";
  const inactiveC  = isDark ? "#666"                 : "#555";
  const rulerBg    = isDark ? "rgba(12,12,26,0.92)"  : "rgba(245,245,245,0.95)";
  const rulerColor = isDark ? "#aaa"                 : "#555";
  const tileUrl    = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";

  // Helper: coordinate valide
  const validCoords = (lat: unknown, lon: unknown): boolean =>
    typeof lat === "number" && isFinite(lat) &&
    typeof lon === "number" && isFinite(lon);

  // ── Layer 1: attrazioni del giorno (in ordine di percorso) ──
  const foodMode = !!foodSelection;
  const foodOrigin = foodSelection?.origin && validCoords(foodSelection.origin.latitude, foodSelection.origin.longitude)
    ? {
        lat: foodSelection.origin.latitude,
        lon: foodSelection.origin.longitude,
        name: esc(foodSelection.origin.name ?? (isEn ? "Your position" : "La tua posizione")),
      }
    : null;
  const contextStops = day.stops;

  const dayStops = contextStops
    .filter((s) => s.type === "attraction" && s.id > 0 && validCoords(s.latitude, s.longitude))
    .map((s, idx) => ({
      id: s.id,
      lat: s.latitude,
      lon: s.longitude,
      name: esc(isEn && s.name_en ? s.name_en : s.name),
      desc: esc((isEn && s.description_en ? s.description_en : s.description) ?? ""),
      type: esc(s.attraction_type ?? ""),
      mins: s.estimated_visit_time ?? 0,
      idx: idx + 1,
    }));

  const dayStopIds = new Set(dayStops.map((s) => s.id));

  // ── Layer 2: attrazioni degli altri giorni ──
  const otherDay = allAttractions
    .filter((a) => {
      const d = assignedMap.get(a.id);
      return d !== undefined && d !== day.day && !dayStopIds.has(a.id) && validCoords(a.latitude, a.longitude);
    })
    .map((a) => ({
      id: a.id,
      lat: a.latitude,
      lon: a.longitude,
      name: esc(isEn && a.name_en ? a.name_en : a.name),
      desc: esc((isEn && a.description_en ? a.description_en : a.description) ?? ""),
      type: esc(a.attraction_type ?? ""),
      mins: a.estimated_visit_time ?? 0,
      dayNum: assignedMap.get(a.id)!,
    }));

  // ── Layer 3: attrazioni non nell'itinerario ──
  const unassigned = foodMode ? [] : allAttractions
    .filter((a) => !assignedMap.has(a.id) && !dayStopIds.has(a.id) && validCoords(a.latitude, a.longitude))
    .map((a) => ({
      id: a.id,
      lat: a.latitude,
      lon: a.longitude,
      name: esc(isEn && a.name_en ? a.name_en : a.name),
      desc: esc((isEn && a.description_en ? a.description_en : a.description) ?? ""),
      type: esc(a.attraction_type ?? ""),
      mins: a.estimated_visit_time ?? 0,
      level: a.category_level ?? 1,
    }));

  const usedFoodIds = new Set(
    (day.restaurants ?? []).map((r) => r.id),
  );
  const selectedFoodSpots = (day.restaurants ?? [])
    .filter((r) => validCoords(r.latitude, r.longitude))
    .map((r) => {
      const source = allFoodSpots.find((spot) => spot.id === r.id);
      const recommendedDishes = isEn && (r.recommended_dishes_en?.length || source?.recommended_dishes_en?.length)
        ? (r.recommended_dishes_en ?? source?.recommended_dishes_en ?? [])
        : (r.recommended_dishes ?? source?.recommended_dishes ?? []);
      return {
        id: r.id,
        lat: r.latitude,
        lon: r.longitude,
        name: esc(isEn && r.name_en ? r.name_en : r.name),
        desc: esc((isEn && r.description_en ? r.description_en : r.description) ?? ""),
        type: esc(r.food_type ?? ""),
        mealType: esc(r.meal_type ?? ""),
        rating: r.rating ?? null,
        mapsLink: r.maps_link,
        recommendedDishes: recommendedDishes.map(esc),
        hasDishMatch: Boolean(r.has_curated_dish_match || source?.has_curated_dish_match || recommendedDishes.length),
      };
    });
  const targetMeal = foodSelection?.mealType;
  const foodSpots = allFoodSpots
    .filter((a) =>
      !usedFoodIds.has(a.id) &&
      validCoords(a.latitude, a.longitude) &&
      (targetMeal === "meal" || !targetMeal || !a.meal_type || a.meal_type === targetMeal || a.meal_type === "both"),
    )
    .map((a) => ({
      id: a.id,
      lat: a.latitude,
      lon: a.longitude,
      name: esc(isEn && a.name_en ? a.name_en : a.name),
      desc: esc((isEn && a.description_en ? a.description_en : a.description) ?? ""),
      type: esc(a.food_type ?? a.attraction_type ?? ""),
      mins: a.estimated_visit_time ?? 60,
      rating: a.rating ?? null,
      recommendedDishes: (isEn && a.recommended_dishes_en?.length ? a.recommended_dishes_en : a.recommended_dishes ?? []).map(esc),
      hasDishMatch: Boolean(a.has_curated_dish_match || a.recommended_dishes?.length),
    }));

  const L = {
    dayLabel:    isEn ? "Day" : "Giorno",
    plannedLabel: isEn ? "Already planned" : "Gia in programma",
    minsLabel:   isEn ? "min" : "min",
    explLabel:   isEn ? "Not in itinerary" : "Non nell'itinerario",
    mapsLabel:   isEn ? "Open in Maps ↗" : "Apri in Maps ↗",
    addLabel:    isEn ? `＋ Add to Day ${day.day}` : `＋ Aggiungi al Giorno ${day.day}`,
    moveLabel:   isEn ? `↗ Move to Day ${day.day}` : `↗ Sposta al Giorno ${day.day}`,
    removeLabel:    isEn ? `✕ Remove from Day ${day.day}` : `✕ Rimuovi dal Giorno ${day.day}`,
    filterAll:      isEn ? "All" : "Tutti",
    filterIconic:   isEn ? "Iconic" : "Iconico",
    filterCurated:  isEn ? "Curated" : "Ricercato",
    filterHidden:   isEn ? "Hidden" : "Nascosto",
    filterFood:     isEn ? "Food" : "Cucina",
    distFromRoute:  isEn ? "from today's stops" : "dalle tappe di oggi",
    rulerLabel:     isEn ? "Measure distance" : "Misura distanza",
    foodLabel:      isEn ? "Food spot" : "Posto cibo",
    selectedFoodLabel: isEn ? "Chosen food spot" : "Posto scelto",
    typicalDishLabel: isEn ? "Typical dish" : "Piatto tipico",
    selectFood:     isEn ? "Choose this place" : "Scegli questo posto",
    removeFood:     isEn ? "Remove this place" : "Rimuovi questo posto",
  };

  // Serializza come JSON — le stringhe sono già escaped per HTML, sicure nei popup
  const stopsJson      = JSON.stringify(dayStops);
  const otherDayJson   = JSON.stringify(otherDay);
  const unassignedJson = JSON.stringify(unassigned);
  const selectedFoodJson = JSON.stringify(selectedFoodSpots);
  const foodJson       = JSON.stringify(foodSpots);
  const originJson     = JSON.stringify(foodOrigin);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=5.0,user-scalable=yes"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:${mapBg};font-family:-apple-system,BlinkMacSystemFont,sans-serif}
#map{width:100%;height:100%}
.leaflet-container{background:${mapBg}!important}

/* Popup */
.leaflet-popup-content-wrapper{
  background:${popupBg};border:1px solid ${popupBdr};border-radius:14px;
  box-shadow:0 4px 24px rgba(0,0,0,0.25);color:${popupText};
}
.leaflet-popup-tip{background:${popupBg}}
.leaflet-popup-content{margin:12px 14px;min-width:170px;max-width:230px}
.leaflet-popup-close-button{color:${popupMeta}!important;top:8px!important;right:10px!important;font-size:18px!important}
.pop-badge{display:inline-block;font-size:10px;font-weight:700;padding:2px 9px;border-radius:8px;margin-bottom:7px}
.pop-badge-day{color:${accent};background:${accent}22;border:1px solid ${accent}55}
.pop-badge-planned{color:#7eb8f7;background:#7eb8f722;border:1px solid #7eb8f766}
.pop-badge-expl{color:#6ee7b7;background:#6ee7b722;border:1px solid #6ee7b755}
.pop-name{font-size:13px;font-weight:700;color:${popupText};margin-bottom:3px;line-height:1.3}
.pop-type{font-size:10px;color:${popupSub};text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
.pop-desc{font-size:11px;color:${popupSub};line-height:1.5;margin-bottom:5px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}
.pop-meta{font-size:10px;color:${popupMeta};margin-bottom:5px}
.pop-maps{display:block;text-align:center;margin-top:8px;font-size:11px;font-weight:700;
  color:#7eb8f7;background:#7eb8f714;border:1px solid #7eb8f740;
  border-radius:8px;padding:6px;cursor:pointer;text-decoration:none;width:100%;font-family:inherit}
.pop-add{display:block;text-align:center;margin-top:6px;font-size:11px;font-weight:700;
  color:#6ee7b7;background:#6ee7b714;border:1px solid #6ee7b750;
  border-radius:8px;padding:6px;cursor:pointer;width:100%;font-family:inherit}
.pop-move{display:block;text-align:center;margin-top:6px;font-size:11px;font-weight:700;
  color:#e8c06a;background:#e8c06a14;border:1px solid #e8c06a50;
  border-radius:8px;padding:6px;cursor:pointer;width:100%;font-family:inherit}
.pop-remove{display:block;text-align:center;margin-top:6px;font-size:11px;font-weight:700;
  color:#f97316;background:#f9731614;border:1px solid #f9731650;
  border-radius:8px;padding:6px;cursor:pointer;width:100%;font-family:inherit}
.pop-food{display:block;text-align:center;margin-top:6px;font-size:11px;font-weight:700;
  color:#6ee7b7;background:#6ee7b714;border:1px solid #6ee7b750;
  border-radius:8px;padding:6px;cursor:pointer;width:100%;font-family:inherit}
.pop-food.remove{color:#ef4444;background:#ef444414;border-color:#ef444455}

/* Layer 1 — tappa del giorno */
.stop-circle{
  width:30px;height:30px;border-radius:50%;
  background:${accent};border:2.5px solid #fff;
  display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:800;color:#0f0f1e;
  box-shadow:0 2px 10px rgba(0,0,0,0.55);
  line-height:1;
}

/* Layer 2 — altro giorno: cerchio numerato blu, speculare al layer 1 */
.other-circle{
  width:32px;height:26px;border-radius:999px;
  background:#7eb8f7;border:2px solid #fff;
  display:flex;align-items:center;justify-content:center;
  font-size:10px;font-weight:900;color:#0f0f1e;
  box-shadow:0 0 0 3px rgba(126,184,247,0.28),0 2px 8px rgba(0,0,0,0.5);
  line-height:1;opacity:0.9;
}

/* Layer 3 — non in itinerario */
.unass-dot{
  width:24px;height:24px;border-radius:50%;
  background:#1a1a2e;border:1.5px solid #3a3a5a;
  display:flex;align-items:center;justify-content:center;
  font-size:13px;opacity:.85;
  box-shadow:0 1px 4px rgba(0,0,0,0.4);
  line-height:1;
}
.food-dot{
  width:30px;height:30px;border-radius:50%;
  background:#6ee7b7;border:2px solid #fff;
  display:flex;align-items:center;justify-content:center;
  font-size:15px;box-shadow:0 2px 10px rgba(0,0,0,0.45);
  line-height:1;
}
.food-dot.typical{
  background:#f97316;
  box-shadow:0 2px 12px rgba(249,115,22,0.55);
}
.food-dot.selected{
  width:34px;height:34px;
  background:#a855f7;
  border:2.5px solid #fff;
  box-shadow:0 0 0 6px rgba(168,85,247,0.36),0 0 0 12px rgba(168,85,247,0.16),0 2px 14px rgba(0,0,0,0.58);
}
.origin-dot{
  width:18px;height:18px;border-radius:50%;
  background:#2f8cff;border:3px solid #fff;
  box-shadow:0 0 0 7px rgba(47,140,255,0.28),0 2px 12px rgba(0,0,0,0.45);
  animation:originPulse 1.45s ease-in-out infinite;
}
@keyframes originPulse{
  0%{box-shadow:0 0 0 4px rgba(47,140,255,0.42),0 2px 12px rgba(0,0,0,0.45)}
  55%{box-shadow:0 0 0 13px rgba(47,140,255,0.08),0 2px 12px rgba(0,0,0,0.45)}
  100%{box-shadow:0 0 0 4px rgba(47,140,255,0.42),0 2px 12px rgba(0,0,0,0.45)}
}

/* Popup: distanza dalle tappe del giorno */
.pop-dist{font-size:10px;color:#7eb8f7;margin-top:3px;margin-bottom:2px}

/* Marker evidenziato in modalità righello */
.leaflet-marker-icon.measure-selected > div{
  box-shadow:0 0 0 3px #7eb8f7, 0 0 14px rgba(126,184,247,0.85)!important;
  transform:scale(1.18);
  transition:transform .15s ease, box-shadow .15s ease;
}
@keyframes measurePulse{
  0%   { box-shadow:0 0 0 3px #7eb8f7, 0 0 0   rgba(126,184,247,0.85); }
  60%  { box-shadow:0 0 0 6px rgba(126,184,247,0.2), 0 0 18px rgba(126,184,247,0.95); }
  100% { box-shadow:0 0 0 3px #7eb8f7, 0 0 0   rgba(126,184,247,0.85); }
}
.leaflet-marker-icon.measure-selected.measure-active > div{
  animation: measurePulse 1.2s ease-in-out infinite;
}

/* Righello — bottone overlay top-right */
#ruler-btn{
  position:absolute;top:12px;right:12px;z-index:1000;
  width:38px;height:38px;border-radius:10px;
  background:${rulerBg};border:1px solid ${filterBdr};
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;font-size:17px;color:${rulerColor};
  font-family:inherit;outline:none;padding:0;
}

/* Etichetta distanza sul tratto misurato */
.dist-label{
  background:${rulerBg};border:1px solid #7eb8f755;
  border-radius:8px;padding:4px 10px;
  font-size:12px;font-weight:700;color:#7eb8f7;
  white-space:nowrap;pointer-events:none;
  transform:translateX(-50%) translateY(-50%);
}

/* Filter bar — overlay sulla mappa */
#filter-bar{
  position:absolute;bottom:14px;left:50%;transform:translateX(-50%);
  z-index:1000;display:flex;gap:4px;
  background:${filterBg};
  border:1px solid ${filterBdr};border-radius:999px;
  padding:5px 8px;backdrop-filter:blur(6px);
}
.filter-btn{
  border:none;border-radius:999px;outline:none;
  padding:5px 13px;font-size:11px;font-weight:700;letter-spacing:.3px;
  cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,sans-serif;
  transition:background .15s,color .15s;
}
</style>
</head>
<body>
<div id="map"></div>
<script>
function sendMessage(payload) {
  try {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    } else if (window.parent) {
      window.parent.postMessage(JSON.stringify(payload), '*');
    }
  } catch(e) {}
}

// Segnala errori JS non catchati a React Native / web
window.onerror = function(msg, src, line, col, err) {
  sendMessage({type: 'error', message: String(msg)});
  return true;
};

try {

const DAY_STOPS    = ${stopsJson};
const OTHER_DAY    = ${otherDayJson};
const UNASSIGNED   = ${unassignedJson};
const SELECTED_FOOD = ${selectedFoodJson};
const FOOD_SPOTS   = ${foodJson};
const FOOD_ORIGIN  = ${originJson};
const FOOD_MODE    = ${JSON.stringify(foodMode)};
const ACCENT       = ${JSON.stringify(accent)};
const DAY_NUM      = ${day.day};
const DAY_LABEL    = ${JSON.stringify(L.dayLabel)};
const PLANNED_LABEL = ${JSON.stringify(L.plannedLabel)};
const MINS_LABEL   = ${JSON.stringify(L.minsLabel)};
const EXPL_LABEL   = ${JSON.stringify(L.explLabel)};
const MAPS_LABEL   = ${JSON.stringify(L.mapsLabel)};
const ADD_LABEL      = ${JSON.stringify(L.addLabel)};
const MOVE_LABEL     = ${JSON.stringify(L.moveLabel)};
const REMOVE_LABEL   = ${JSON.stringify(L.removeLabel)};
const FILTER_ALL     = ${JSON.stringify(L.filterAll)};
const FILTER_ICONIC    = ${JSON.stringify(L.filterIconic)};
const FILTER_CURATED   = ${JSON.stringify(L.filterCurated)};
const FILTER_HIDDEN    = ${JSON.stringify(L.filterHidden)};
const FILTER_FOOD      = ${JSON.stringify(L.filterFood)};
const DIST_FROM_ROUTE  = ${JSON.stringify(L.distFromRoute)};
const RULER_LABEL      = ${JSON.stringify(L.rulerLabel)};
const FOOD_LABEL       = ${JSON.stringify(L.foodLabel)};
const SELECTED_FOOD_LABEL = ${JSON.stringify(L.selectedFoodLabel)};
const TYPICAL_DISH_LABEL = ${JSON.stringify(L.typicalDishLabel)};
const SELECT_FOOD_LABEL = ${JSON.stringify(L.selectFood)};
const REMOVE_FOOD_LABEL = ${JSON.stringify(L.removeFood)};
const LEVEL_COLORS     = {1:'#e8c06a', 2:'#7eb8f7', 3:'#a78bfa', 4:'#f97316'};

function typeEmoji(t){
  t=(t||'').toLowerCase();
  if(t.includes('museo')||t.includes('museum')) return '🏛';
  if(t.includes('parco')||t.includes('giardino')||t.includes('park')||t.includes('garden')) return '🌳';
  if(t.includes('piazza')||t.includes('plaza')||t.includes('square')) return '⛲';
  if(t.includes('chiesa')||t.includes('cattedrale')||t.includes('basilica')||t.includes('church')||t.includes('cathedral')) return '⛪';
  if(t.includes('castello')||t.includes('fortezza')||t.includes('torre')||t.includes('palazzo')||t.includes('castle')||t.includes('palace')) return '🏰';
  if(t.includes('mercato')||t.includes('market')) return '🛒';
  if(t.includes('teatro')||t.includes('opera')||t.includes('theatre')||t.includes('theater')) return '🎭';
  if(t.includes('panorama')||t.includes('belvedere')||t.includes('terrazza')||t.includes('viewpoint')) return '🔭';
  if(t.includes('fontana')||t.includes('fountain')) return '⛲';
  if(t.includes('spiaggia')||t.includes('beach')) return '🏖';
  if(t.includes('porto')||t.includes('harbour')||t.includes('marina')) return '⚓';
  return '📍';
}

function mapsUrl(lat,lon,name){
  return 'https://www.google.com/maps/search/'+encodeURIComponent(name)+'/@'+lat+','+lon+',17z';
}

// ── Helpers geo ───────────────────────────────────────────────────────────────
function hKm(lat1,lon1,lat2,lon2){
  var R=6371;
  var f1=lat1*Math.PI/180,f2=lat2*Math.PI/180;
  var df=(lat2-lat1)*Math.PI/180,dl=(lon2-lon1)*Math.PI/180;
  var a=Math.sin(df/2)*Math.sin(df/2)+Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)*Math.sin(dl/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function wKm(lat1,lon1,lat2,lon2){
  var km=hKm(lat1,lon1,lat2,lon2);
  return km>2?km*1.1:km>1?km*1.15:km>0.5?km*1.3:km>0.3?km*1.4:km*1.5;
}
function fDist(km){
  return km<1?Math.round(km*1000)+' m':km.toFixed(1)+' km';
}
function nearestDayDist(lat,lon){
  if(FOOD_ORIGIN) return wKm(lat, lon, FOOD_ORIGIN.lat, FOOD_ORIGIN.lon);
  if(!DAY_STOPS.length) return null;
  var bestKm=Infinity;
  DAY_STOPS.forEach(function(s){ var k=wKm(lat,lon,s.lat,s.lon); if(k<bestKm) bestKm=k; });
  return bestKm;
}

// ── Event delegation unificata per tutti i bottoni popup e filter bar ────────
document.addEventListener('click', function(e){
  var btn = e.target && e.target.closest ? e.target.closest('button[data-action]') : null;
  if (!btn || !btn.dataset) return;
  var action = btn.dataset.action;
  if (action === 'filter') { setFilter(Number(btn.dataset.level)); return; }
  if (action === 'ruler')  { toggleMeasure(); return; }
  if (action === 'maps')   sendMessage({type:'openMaps',        url: btn.dataset.url});
  if (action === 'add')    sendMessage({type:'addAttraction',   id: Number(btn.dataset.id)});
  if (action === 'move')   sendMessage({type:'moveAttraction',  id: Number(btn.dataset.id), fromDay: Number(btn.dataset.from)});
  if (action === 'remove') sendMessage({type:'removeAttraction',id: Number(btn.dataset.id)});
  if (action === 'selectFood') sendMessage({type:'selectFood', id: Number(btn.dataset.id)});
  if (action === 'removeFood') sendMessage({type:'removeFood', id: Number(btn.dataset.id)});
});

// ── Filter bar: mostra/nasconde layer 3 per livello ──────────────────────────
var unassLayers = {};
var foodLayer = null;
var currentFilter = 0;

function setFilter(level) {
  currentFilter = level;
  [1,2,3].forEach(function(lv){
    if (level !== 4 && (level === 0 || level === lv)) {
      if (!map.hasLayer(unassLayers[lv])) unassLayers[lv].addTo(map);
    } else {
      if (map.hasLayer(unassLayers[lv])) map.removeLayer(unassLayers[lv]);
    }
  });
  if (foodLayer) {
    if (level === 4) {
      if (!map.hasLayer(foodLayer)) foodLayer.addTo(map);
    } else if (!FOOD_MODE && map.hasLayer(foodLayer)) {
      map.removeLayer(foodLayer);
    }
  }
  document.querySelectorAll('.filter-btn').forEach(function(b){
    var lv = parseInt(b.dataset.level || '0');
    var active = lv === level;
    b.classList.toggle('active', active);
    b.style.background = active ? (LEVEL_COLORS[lv] || 'rgba(240,240,240,0.15)') : 'transparent';
    b.style.color = active ? '#0f0f1e' : '${inactiveC}';
  });
}

// ── Righello misura distanza ──────────────────────────────────────────────────
var measureStart = null;
var measureLayer = null; // inizializzato dopo la creazione della mappa
var measureHighlights = []; // marker attualmente evidenziati come punti di misura

function isRulerActive(){
  var btn = document.getElementById('ruler-btn');
  return !!(btn && btn.dataset.active === '1');
}

function clearMeasureHighlights(){
  for(var i=0;i<measureHighlights.length;i++){
    var m = measureHighlights[i];
    if(m && m._icon){
      m._icon.classList.remove('measure-selected');
      m._icon.classList.remove('measure-active');
    }
  }
  measureHighlights = [];
}

function highlightMeasureMarker(marker, isActive){
  if(!marker || !marker._icon) return;
  marker._icon.classList.add('measure-selected');
  if(isActive) marker._icon.classList.add('measure-active');
  measureHighlights.push(marker);
}

function handleMeasureClick(latlng, marker){
  if(!measureLayer) return;
  if(!measureStart){
    // Primo punto: reset stato + evidenzia eventuale marker (con animazione pulse)
    measureLayer.clearLayers();
    clearMeasureHighlights();
    measureStart = latlng;
    L.circleMarker(latlng, {
      radius:7, color:'#7eb8f7', fillColor:'#7eb8f7', fillOpacity:0.9, weight:2
    }).addTo(measureLayer);
    if(marker) highlightMeasureMarker(marker, true);
  } else {
    // Secondo punto: traccia linea + etichetta, evidenzia anche il secondo marker
    var p1 = measureStart, p2 = latlng;
    L.circleMarker(p2, {
      radius:7, color:'#7eb8f7', fillColor:'#7eb8f7', fillOpacity:0.9, weight:2
    }).addTo(measureLayer);
    L.polyline([p1, p2], {
      color:'#7eb8f7', weight:2.5, dashArray:'7,5', opacity:0.9
    }).addTo(measureLayer);
    var km = wKm(p1.lat, p1.lng, p2.lat, p2.lng);
    var mid = L.latLng((p1.lat+p2.lat)/2, (p1.lng+p2.lng)/2);
    L.marker(mid, {
      icon: L.divIcon({
        html: '<div class="dist-label">~'+fDist(km)+'</div>',
        className:'', iconAnchor:[0,0]
      }),
      interactive:false, zIndexOffset:2000
    }).addTo(measureLayer);
    if(marker) highlightMeasureMarker(marker, false);
    // Rimuovi l'animazione pulse dal primo marker (rimane evidenziato statico)
    for(var i=0;i<measureHighlights.length;i++){
      var m = measureHighlights[i];
      if(m && m._icon) m._icon.classList.remove('measure-active');
    }
    measureStart = null; // pronto per la prossima misurazione
  }
}

// Wrapper marker: in modalità righello il click usa la posizione del marker
// come punto di misura invece di aprire il popup
function attachMarker(marker, popupHtml, popupOpts){
  marker.bindPopup(popupHtml, popupOpts || {maxWidth: 250});
  // Rimuovi il listener di default di bindPopup (auto-apertura su click)
  marker.off('click');
  marker.on('click', function(){
    if(isRulerActive()){
      handleMeasureClick(marker.getLatLng(), marker);
    } else {
      marker.openPopup();
    }
  });
  return marker;
}

function toggleMeasure(){
  measureStart = null;
  if(measureLayer) measureLayer.clearLayers();
  clearMeasureHighlights();
  var btn = document.getElementById('ruler-btn');
  if(!btn) return;
  var active = btn.dataset.active !== '1';
  btn.dataset.active = active ? '1' : '0';
  btn.style.borderColor = active ? '#7eb8f7' : '#2a2a42';
  btn.style.background  = active ? 'rgba(126,184,247,0.2)' : 'rgba(12,12,26,0.92)';
  btn.style.color       = active ? '#7eb8f7' : '#aaa';
}

function mapsButton(url){
  return '<button type="button" class="pop-maps" data-action="maps" data-url="'+url.replace(/"/g,'&quot;')+'">'+MAPS_LABEL+'</button>';
}
function addButton(id){
  return '<button type="button" class="pop-add" data-action="add" data-id="'+id+'">'+ADD_LABEL+'</button>';
}
function moveButton(id, fromDay){
  return '<button type="button" class="pop-move" data-action="move" data-id="'+id+'" data-from="'+fromDay+'">'+MOVE_LABEL+'</button>';
}
function removeButton(id){
  return '<button type="button" class="pop-remove" data-action="remove" data-id="'+id+'">'+REMOVE_LABEL+'</button>';
}
function selectFoodButton(id){
  return '<button type="button" class="pop-food" data-action="selectFood" data-id="'+id+'">'+SELECT_FOOD_LABEL+'</button>';
}
function removeFoodButton(id){
  return '<button type="button" class="pop-food remove" data-action="removeFood" data-id="'+id+'">'+REMOVE_FOOD_LABEL+'</button>';
}

var map = L.map('map',{zoomControl:false,attributionControl:false,minZoom:12,maxZoom:19});
L.tileLayer('${tileUrl}',{subdomains:'abcd',maxZoom:20}).addTo(map);
measureLayer = L.layerGroup().addTo(map);
foodLayer = L.layerGroup();

// ── Layer 3: non in itinerario — gruppi per livello (filtrabili) ─────────────
[1,2,3].forEach(function(lv){ unassLayers[lv] = L.layerGroup(); });

UNASSIGNED.forEach(function(a){
  var lv = a.level || 1;
  var lc = LEVEL_COLORS[lv] || '#3a3a5a';
  var emoji = typeEmoji(a.type);
  var icon = L.divIcon({
    html: '<div class="unass-dot" style="border-color:'+lc+'">'+emoji+'</div>',
    className:'',
    iconSize:[24,24],
    iconAnchor:[12,12],
    popupAnchor:[0,-14]
  });
  var url = mapsUrl(a.lat, a.lon, a.name);
  var nd = nearestDayDist(a.lat, a.lon);
  var popup =
    '<div class="pop-badge pop-badge-expl">'+EXPL_LABEL+'</div>'+
    '<div class="pop-name">'+a.name+'</div>'+
    (a.type ? '<div class="pop-type">'+a.type+'</div>' : '')+
    (nd !== null ? '<div class="pop-dist">🚶 ~'+fDist(nd)+' '+DIST_FROM_ROUTE+'</div>' : '')+
    (a.desc ? '<div class="pop-desc">'+a.desc+'</div>' : '')+
    (a.mins ? '<div class="pop-meta">~'+a.mins+' '+MINS_LABEL+'</div>' : '')+
    addButton(a.id)+
    mapsButton(url);
  var marker = L.marker([a.lat, a.lon], {icon: icon, zIndexOffset: 100});
  attachMarker(marker, popup);
  unassLayers[lv].addLayer(marker);
});
// Aggiungi tutti i layer alla mappa (filtro iniziale = "Tutti")
[1,2,3].forEach(function(lv){ unassLayers[lv].addTo(map); });

FOOD_SPOTS.forEach(function(f){
  var isTypical = !!f.hasDishMatch;
  var icon=L.divIcon({
    html:'<div class="food-dot '+(isTypical?'typical':'')+'">🍽</div>',
    className:'',
    iconSize:[30,30],
    iconAnchor:[15,15],
    popupAnchor:[0,-17]
  });
  var url=mapsUrl(f.lat,f.lon,f.name);
  var nd=nearestDayDist(f.lat,f.lon);
  var dishes=(f.recommendedDishes||[]).join(', ');
  var popup=
    '<div class="pop-badge pop-badge-expl">'+FOOD_LABEL+'</div>'+
    '<div class="pop-name">'+f.name+'</div>'+
    (f.type?'<div class="pop-type">'+f.type+'</div>':'')+
    (dishes?'<div class="pop-meta">🍝 '+TYPICAL_DISH_LABEL+': '+dishes+'</div>':'')+
    (nd!==null?'<div class="pop-dist">🚶 ~'+fDist(nd)+' '+DIST_FROM_ROUTE+'</div>':'')+
    (f.rating?'<div class="pop-meta">★ '+f.rating+'</div>':'')+
    (f.desc?'<div class="pop-desc">'+f.desc+'</div>':'')+
    (FOOD_MODE ? selectFoodButton(f.id) : '')+
    mapsButton(url);
  foodLayer.addLayer(attachMarker(L.marker([f.lat,f.lon],{icon:icon,zIndexOffset:900}), popup));
});
if (FOOD_MODE && foodLayer) foodLayer.addTo(map);

SELECTED_FOOD.forEach(function(f){
  var icon=L.divIcon({
    html:'<div class="food-dot selected">🍽</div>',
    className:'',
    iconSize:[34,34],
    iconAnchor:[17,17],
    popupAnchor:[0,-19]
  });
  var url=f.mapsLink || mapsUrl(f.lat,f.lon,f.name);
  var nd=nearestDayDist(f.lat,f.lon);
  var dishes=(f.recommendedDishes||[]).join(', ');
  var popup=
    '<div class="pop-badge pop-badge-expl">'+SELECTED_FOOD_LABEL+'</div>'+
    '<div class="pop-name">'+f.name+'</div>'+
    (f.type?'<div class="pop-type">'+f.type+'</div>':'')+
    (dishes?'<div class="pop-meta">🍝 '+TYPICAL_DISH_LABEL+': '+dishes+'</div>':'')+
    (nd!==null?'<div class="pop-dist">🚶 ~'+fDist(nd)+' '+DIST_FROM_ROUTE+'</div>':'')+
    (f.rating?'<div class="pop-meta">★ '+f.rating+'</div>':'')+
    (f.desc?'<div class="pop-desc">'+f.desc+'</div>':'')+
    (FOOD_MODE ? removeFoodButton(f.id) : '')+
    mapsButton(url);
  attachMarker(L.marker([f.lat,f.lon],{icon:icon,zIndexOffset:950}), popup).addTo(map);
});

if(FOOD_ORIGIN){
  var originIcon=L.divIcon({
    html:'<div class="origin-dot"></div>',
    className:'',
    iconSize:[30,30],
    iconAnchor:[15,15],
    popupAnchor:[0,-16]
  });
  attachMarker(
    L.marker([FOOD_ORIGIN.lat,FOOD_ORIGIN.lon],{icon:originIcon,zIndexOffset:1100}),
    '<div class="pop-badge pop-badge-day">'+FOOD_ORIGIN.name+'</div>',
    {maxWidth:220}
  ).addTo(map);
}

// ── Crea filter bar ───────────────────────────────────────────────────────────
(function(){
  if (FOOD_MODE) return;
  var bar = document.createElement('div');
  bar.id = 'filter-bar';
  var filters = [
    {level:0, label:FILTER_ALL,     color:'rgba(240,240,240,0.15)'},
    {level:1, label:FILTER_ICONIC,  color:LEVEL_COLORS[1]},
    {level:2, label:FILTER_CURATED, color:LEVEL_COLORS[2]},
    {level:3, label:FILTER_HIDDEN,  color:LEVEL_COLORS[3]},
    {level:4, label:FILTER_FOOD,    color:LEVEL_COLORS[4]},
  ];
  filters.forEach(function(f){
    var btn = document.createElement('button');
    btn.className = 'filter-btn' + (f.level === 0 ? ' active' : '');
    btn.textContent = f.label;
    btn.dataset.action = 'filter';
    btn.dataset.level  = f.level;
    btn.style.background = f.level === 0 ? f.color : 'transparent';
    btn.style.color      = f.level === 0 ? '${popupText}' : '${inactiveC}';
    bar.appendChild(btn);
  });
  document.getElementById('map').appendChild(bar);
})();

// ── Crea bottone righello ─────────────────────────────────────────────────────
(function(){
  var btn = document.createElement('button');
  btn.id = 'ruler-btn';
  btn.innerHTML = '📏';
  btn.title = RULER_LABEL;
  btn.dataset.action = 'ruler';
  btn.dataset.active = '0';
  document.getElementById('map').appendChild(btn);
})();

// ── Click sulla mappa in modalità misura (zone vuote tra marker) ────────────
map.on('click', function(e){
  if(!isRulerActive()) return;
  // Ignora click su overlay (filter bar, ruler btn)
  var tgt = e.originalEvent && e.originalEvent.target;
  if(tgt && tgt.closest && (tgt.closest('#filter-bar') || tgt.closest('#ruler-btn'))) return;
  handleMeasureClick(e.latlng);
});

// ── Layer 2: altri giorni — cerchio numerato blu ───────────────────────────────
OTHER_DAY.forEach(function(s){
  var icon=L.divIcon({
    html:'<div class="other-circle">G'+s.dayNum+'</div>',
    className:'',
    iconSize:[32,26],
    iconAnchor:[16,13],
    popupAnchor:[0,-15]
  });
  var url=mapsUrl(s.lat,s.lon,s.name);
  var nd2=nearestDayDist(s.lat,s.lon);
  var popup=
    '<div class="pop-badge pop-badge-planned">'+PLANNED_LABEL+' - '+DAY_LABEL+' '+s.dayNum+'</div>'+
    '<div class="pop-name">'+s.name+'</div>'+
    (s.type?'<div class="pop-type">'+s.type+'</div>':'')+
    (nd2!==null?'<div class="pop-dist">🚶 ~'+fDist(nd2)+' '+DIST_FROM_ROUTE+'</div>':'')+
    (s.desc?'<div class="pop-desc">'+s.desc+'</div>':'')+
    (s.mins?'<div class="pop-meta">~'+s.mins+' '+MINS_LABEL+'</div>':'')+
    moveButton(s.id, s.dayNum)+
    mapsButton(url);
  attachMarker(L.marker([s.lat,s.lon],{icon:icon,zIndexOffset:200}), popup).addTo(map);
});

// ── Layer 1: tappe del giorno + polilinea (segment-by-segment stagger) ─────
// Disegniamo i segmenti uno alla volta con un piccolo delay (effetto "rotta
// che si traccia"). Ogni segmento è creato direttamente con opacity finale —
// niente CSS transition perché su WebView i browser engine spesso non
// scatenano il reflow necessario, lasciando il path invisibile.
if(DAY_STOPS.length>1){
  var segCount = DAY_STOPS.length - 1;
  var STEP_MS  = Math.max(70, Math.min(150, 500 / segCount));
  for (var i = 0; i < segCount; i++) {
    (function(idx){
      var s = DAY_STOPS[idx];
      var n = DAY_STOPS[idx+1];
      setTimeout(function(){
        L.polyline([[s.lat,s.lon],[n.lat,n.lon]],{
          color:ACCENT, weight:2.5, dashArray:'8,8', opacity:0.85
        }).addTo(map);
      }, idx * STEP_MS);
    })(i);
  }
}

DAY_STOPS.forEach(function(s){
  var icon=L.divIcon({
    html:'<div class="stop-circle">'+s.idx+'</div>',
    className:'',
    iconSize:[30,30],
    iconAnchor:[15,15],
    popupAnchor:[0,-17]
  });
  var url=mapsUrl(s.lat,s.lon,s.name);
  var popup=
    '<div class="pop-name">'+s.name+'</div>'+
    (s.type?'<div class="pop-type">'+s.type+'</div>':'')+
    (s.desc?'<div class="pop-desc">'+s.desc+'</div>':'')+
    (s.mins?'<div class="pop-meta">~'+s.mins+' '+MINS_LABEL+'</div>':'')+
    removeButton(s.id)+
    mapsButton(url);
  attachMarker(L.marker([s.lat,s.lon],{icon:icon,zIndexOffset:1000}), popup).addTo(map);
});

// ── Auto-zoom sulle tappe del giorno ─────────────────────────────────────────
// Eseguiamo zoom e invalidateSize in un timeout: il WebView di RN
// finisce il layout DOPO che questo script gira, quindi la mappa
// avrebbe dimensione 0×0 senza il ritardo.
setTimeout(function() {
  map.invalidateSize();
  if(DAY_STOPS.length>0){
    var bounds=L.latLngBounds(DAY_STOPS.map(function(s){return[s.lat,s.lon];}));
    if(FOOD_MODE) FOOD_SPOTS.forEach(function(f){ bounds.extend([f.lat,f.lon]); });
    SELECTED_FOOD.forEach(function(f){ bounds.extend([f.lat,f.lon]); });
    if(FOOD_ORIGIN) bounds.extend([FOOD_ORIGIN.lat,FOOD_ORIGIN.lon]);
    map.fitBounds(bounds,{padding:[55,55],maxZoom:16});
  } else {
    var all=[].concat(FOOD_MODE ? FOOD_SPOTS : []).concat(OTHER_DAY).concat(UNASSIGNED).filter(function(a){return a.lat&&a.lon;});
    if(all.length>0) map.fitBounds(L.latLngBounds(all.map(function(a){return[a.lat,a.lon];})),{padding:[40,40]});
    else map.setView([48,13],4);
  }
  sendMessage({type:'ready'});
}, 350);

} catch(err) {
  sendMessage({type: 'error', message: String(err && err.message ? err.message : err)});
}
</script>
</body>
</html>`;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function DayMap({
  visible, onClose, day, allAttractions, allFoodSpots = [], foodSelection,
  assignedMap, lang, accent, onAddAttraction, onMoveAttraction, onRemoveAttraction, onReorderStops, onSelectFood, onRemoveFood,
  allDays, onDayChange,
}: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [showStopsSheet, setShowStopsSheet] = useState(false);
  const [isDraggingStop, setIsDraggingStop] = useState(false);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Chiudi la sheet quando si cambia giorno o si chiude la mappa
  useEffect(() => { setShowStopsSheet(false); setIsDraggingStop(false); }, [day.day, visible]);

  // ── Crossfade quando si cambia giorno ─────────────────────────────────────
  // Per evitare il flash bianco della WebView durante il reload, facciamo dip
  // di opacity quando day.day cambia: 1 → 0.35 (200ms) → 1 (350ms).
  const mapFade = useRef(new Animated.Value(1)).current;
  const prevDayRef = useRef(day.day);
  useEffect(() => {
    if (prevDayRef.current === day.day) return;
    prevDayRef.current = day.day;
    Animated.sequence([
      Animated.timing(mapFade, { toValue: 0.35, duration: 180, useNativeDriver: true }),
      Animated.timing(mapFade, { toValue: 1,    duration: 320, delay: 120, useNativeDriver: true }),
    ]).start();
  }, [day.day, mapFade]);
  const stopOrderSignature = useMemo(
    () => day.stops.map((s) => `${s.type}:${s.id}:${s.latitude}:${s.longitude}`).join("|"),
    [day.stops],
  );
  const restaurantSignature = useMemo(
    () => (day.restaurants ?? []).map((r) => `${r.id}:${r.latitude}:${r.longitude}:${r.meal_type ?? ""}:${(r.recommended_dishes ?? []).join(",")}:${(r.recommended_dishes_en ?? []).join(",")}`).join("|"),
    [day.restaurants],
  );

  const html = useMemo(
    () => buildHtml(day, allAttractions, allFoodSpots, foodSelection, assignedMap, lang, accent, isDark),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [day.day, stopOrderSignature, restaurantSignature, assignedMap.size, allAttractions.length, allFoodSpots.length, foodSelection?.origin?.latitude, foodSelection?.origin?.longitude, foodSelection?.mealType, lang, accent, isDark],
  );

  useEffect(() => {
    if (visible) setStatus("loading");
  }, [visible, html]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handler = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "ready") setStatus("ready");
        if (msg.type === "error") setStatus("error");
        if (msg.type === "openMaps")        Linking.openURL(msg.url).catch(() => {});
        if (msg.type === "addAttraction"    && onAddAttraction)    onAddAttraction(msg.id);
        if (msg.type === "moveAttraction"   && onMoveAttraction)   onMoveAttraction(msg.id, msg.fromDay);
        if (msg.type === "removeAttraction" && onRemoveAttraction) onRemoveAttraction(msg.id);
        if (msg.type === "selectFood"       && onSelectFood)       onSelectFood(msg.id);
        if (msg.type === "removeFood"       && onRemoveFood)       onRemoveFood(msg.id);
      } catch { /* ignore */ }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onAddAttraction, onMoveAttraction, onRemoveAttraction, onSelectFood, onRemoveFood]);

  const handleMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "ready")    setStatus("ready");
      if (msg.type === "error")    setStatus("error");
      if (msg.type === "openMaps") Linking.openURL(msg.url).catch(() => {});
      if (msg.type === "addAttraction"    && onAddAttraction)    onAddAttraction(msg.id);
      if (msg.type === "moveAttraction"   && onMoveAttraction)   onMoveAttraction(msg.id, msg.fromDay);
      if (msg.type === "removeAttraction" && onRemoveAttraction) onRemoveAttraction(msg.id);
      if (msg.type === "selectFood"       && onSelectFood)       onSelectFood(msg.id);
      if (msg.type === "removeFood"       && onRemoveFood)       onRemoveFood(msg.id);
    } catch { /* ignore */ }
  };

  // Fallback: se il postMessage non arriva (es. ponte non pronto) togliamo
  // comunque il loading 4s dopo che la pagina ha finito di caricare
  const handleLoadEnd = () => {
    // Fallback: se il bridge non consegna 'ready' entro 6s, togliamo il loading
    setTimeout(() => setStatus((s) => s === "loading" ? "ready" : s), 6000);
  };

  const mapBg = isDark ? "#0a0a1a" : "#f0eff0";
  const isEn = lang === "en";
  const iframe = Platform.OS === "web"
    ? React.createElement("iframe", {
        key: stopOrderSignature,
        srcDoc: html,
        style: {
          width: "100%",
          height: "100%",
          border: "none",
          backgroundColor: mapBg,
        },
        sandbox: "allow-scripts allow-same-origin",
      })
    : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: colors.bg }]}>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.card2 }]} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          {allDays && allDays.length > 1 && onDayChange ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dayPickerScroll}
              contentContainerStyle={styles.dayPickerContent}
            >
              {allDays.map((d) => {
                const da = DAY_ACCENTS[(d.day - 1) % DAY_ACCENTS.length];
                const active = d.day === day.day;
                return (
                  <PressableCard
                    key={d.day}
                    onPress={() => onDayChange(d.day)}
                    haptic="selection"
                    pressScale={0.94}
                    style={[
                      styles.dayPill,
                      { borderColor: colors.border, backgroundColor: colors.card2 },
                      active && { borderColor: da, backgroundColor: da + "22" },
                    ]}
                  >
                    <Text style={[styles.dayPillText, { color: active ? da : colors.textMuted }]}>
                      {isEn ? `Day ${d.day}` : `Giorno ${d.day}`}
                    </Text>
                  </PressableCard>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={[styles.title, { color: accent }]}>
              {isEn ? `Day ${day.day}` : `Giorno ${day.day}`}
            </Text>
          )}
        </View>

        {/* Legenda */}
        <View style={[styles.legend, { borderBottomColor: colors.border }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: accent }]} />
            <Text style={[styles.legendLabel, { color: colors.textSub }]}>{isEn ? "Today's stops" : "Tappe di oggi"}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accentBlue }]} />
            <Text style={[styles.legendLabel, { color: colors.textSub }]}>{isEn ? "Planned in other days" : "Gia in altri giorni"}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: isDark ? "#3a3a5a" : "#b0b0c8", borderWidth: 1, borderColor: isDark ? "#5a5a7a" : "#9090a8" }]} />
            <Text style={[styles.legendLabel, { color: colors.textSub }]}>{isEn ? "Explore" : "Da esplorare"}</Text>
          </View>
        </View>

        {/* Mappa — wrappata in Animated.View per il crossfade su cambio giorno */}
        <View style={styles.mapWrap}>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: mapFade }]}>
            {Platform.OS === "web" ? iframe : (
              <WebView
                key={stopOrderSignature}
                source={{ html, baseUrl: "https://unpkg.com" }}
                originWhitelist={["*"]}
                javaScriptEnabled
                domStorageEnabled
                onMessage={handleMessage}
                onLoadEnd={handleLoadEnd}
                onError={() => setStatus("error")}
                style={[styles.webview, { backgroundColor: colors.bg }]}
                bounces={false}
                overScrollMode="never"
              />
            )}
          </Animated.View>

          {status === "loading" && (
            <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
              <ActivityIndicator color={accent} size="large" />
              <Text style={[styles.overlayText, { color: colors.textSub }]}>
                {isEn ? "Loading map…" : "Caricamento mappa…"}
              </Text>
            </View>
          )}

          {status === "error" && (
            <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
              <Ionicons name="wifi-outline" size={44} color={colors.textMuted} />
              <Text style={[styles.overlayText, { color: colors.textSub }]}>
                {isEn
                  ? "Internet connection required for the map"
                  : "Connessione internet necessaria per la mappa"}
              </Text>
              <TouchableOpacity onPress={onClose} style={[styles.retryBtn, { backgroundColor: colors.card2, borderColor: colors.border }]} activeOpacity={0.8}>
                <Text style={[styles.retryText, { color: colors.textSub }]}>{isEn ? "Close" : "Chiudi"}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── FAB "Riordina tappe" — in basso a sinistra, a fianco del filtro ── */}
          {status === "ready" && !!onReorderStops && day.stops.length > 1 && (
            <TouchableOpacity
              onPress={() => setShowStopsSheet(true)}
              activeOpacity={0.8}
              style={[
                styles.reorderFab,
                { backgroundColor: colors.card2, borderColor: accent + "55" },
              ]}
              accessibilityLabel={isEn ? "Reorder stops" : "Riordina tappe"}
            >
              <Ionicons name="reorder-three-outline" size={22} color={accent} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Bottom sheet riordino tappe — drag-to-dismiss + rubber-band ── */}
        {!!onReorderStops && (
          <BottomSheet
            visible={showStopsSheet}
            onClose={() => setShowStopsSheet(false)}
            heightFraction={0.88}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: accent }]}>
                {isEn ? `Day ${day.day} · Reorder stops` : `Giorno ${day.day} · Riordina tappe`}
              </Text>
              <TouchableOpacity
                onPress={() => setShowStopsSheet(false)}
                style={[styles.closeBtn, { backgroundColor: colors.card2 }]}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.sheetHint, { color: colors.textMuted }]}>
              {isEn
                ? "Long-press the ≡ handle on a stop and drag up or down to reorder."
                : "Tieni premuto l'icona ≡ a sinistra di una tappa e trascina per riordinare."}
            </Text>
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              showsVerticalScrollIndicator={true}
              scrollEnabled={!isDraggingStop}
            >
              <DraggableStopList
                stops={day.stops}
                onReorder={(newStops) => onReorderStops(newStops)}
                onDragStateChange={setIsDraggingStop}
                lang={lang}
                colors={colors}
              />
            </ScrollView>
          </BottomSheet>
        )}
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: "800", letterSpacing: 1, flex: 1 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  dayPickerScroll: { flex: 1 },
  dayPickerContent: { gap: 6, paddingHorizontal: 2, alignItems: "center" },
  dayPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  dayPillText: { fontSize: 12, fontWeight: "700" },

  legend: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    flexWrap: "wrap",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11, fontWeight: "600" },

  mapWrap: { flex: 1, position: "relative" },
  webview: { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 40,
  },
  overlayText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  retryBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryText: { fontSize: 14, fontWeight: "600" },

  // ── FAB riordino + bottom sheet ───────────────────────────────────────────
  reorderFab: {
    position: "absolute",
    bottom: 68,        // sopra il filter bar (filter sta a bottom 14 con altezza ~36 + gap)
    left: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  // (sheetBackdrop/sheetContainer/sheetHandle ora gestiti da BottomSheet)
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sheetTitle: { fontSize: 16, fontWeight: "800", letterSpacing: 0.4, flex: 1 },
  sheetHint: { fontSize: 12, marginBottom: 12, lineHeight: 17 },
  sheetScroll: { flex: 1 },
  sheetScrollContent: { paddingBottom: 12 },
});
