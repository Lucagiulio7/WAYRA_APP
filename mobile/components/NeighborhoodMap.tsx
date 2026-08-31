import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Neighborhood } from "@/types";
import type { BuilderAttraction } from "@/hooks/useAttractions";
import { useTheme } from "@/contexts/ThemeContext";
import { NEIGHBORHOOD_POLYGONS } from "@/data/neighborhoodPolygons";
import { translations } from "@/i18n";
import { localizedDescription, localizedName } from "@/utils/localization";
import { localText } from "@/i18n";
import { neighborhoodVibe } from "@/utils/neighborhoods";
import { ContextHelpUI, contextHelpOutline, useContextHelpController, type ContextHelpContent } from "./ContextHelp";
import { useFirstVisitGuide } from "@/hooks/useFirstVisitGuide";
import { useTransitNetwork } from "@/hooks/useTransitNetwork";
import { MapStatusOverlay } from "./MapStatusOverlay";
import { transitBadgeForCity, transitModeForCity, transitPresentation, type TransitNetwork } from "@/data/transitNetworks";
import type { TripAccommodation } from "@/services/accommodationStorage";

interface Props {
  visible: boolean;
  onClose: () => void;
  neighborhoods: Neighborhood[];
  city: string;
  cityLabel: string;
  attractions: BuilderAttraction[];
  foodSpots?: BuilderAttraction[];
  accommodation?: TripAccommodation | null;
  lang: string;
}

const AREA_COLORS = ["#e8c06a", "#7eb8f7", "#a78bfa", "#6ee7b7", "#f97316", "#f472b6", "#22d3ee", "#fb7185"];

const VIBE_STYLES: Record<string, { icon: string; color: string; labelIt: string; labelEn: string; labelFr: string; labelEs: string }> = {
  centro: { icon: "C", color: "#e8c06a", labelIt: "Centrale", labelEn: "Central", labelFr: "Central", labelEs: "Central" },
  centrale: { icon: "C", color: "#e8c06a", labelIt: "Centrale", labelEn: "Central", labelFr: "Central", labelEs: "Central" },
  attrazioni: { icon: "A", color: "#9333ea", labelIt: "Vicino attrazioni", labelEn: "Near sights", labelFr: "Proche des sites", labelEs: "Cerca de atracciones" },
  turistico: { icon: "T", color: "#e8c06a", labelIt: "Turistico", labelEn: "Touristy", labelFr: "Touristique", labelEs: "Turistico" },
  "vita notturna": { icon: "N", color: "#7c3aed", labelIt: "Vita notturna", labelEn: "Nightlife", labelFr: "Vie nocturne", labelEs: "Vida nocturna" },
  locali: { icon: "L", color: "#b45309", labelIt: "Atmosfera locale", labelEn: "Local vibe", labelFr: "Ambiance locale", labelEs: "Ambiente local" },
  metro: { icon: "M", color: "#2563eb", labelIt: "Metro vicina", labelEn: "Near metro", labelFr: "Metro proche", labelEs: "Metro cercano" },
  trasporti: { icon: "T", color: "#2563eb", labelIt: "Ben collegato", labelEn: "Well connected", labelFr: "Bien desservi", labelEs: "Bien comunicado" },
  stazione: { icon: "G", color: "#2563eb", labelIt: "Stazione", labelEn: "Station", labelFr: "Gare", labelEs: "Estacion" },
  tranquillo: { icon: "Q", color: "#059669", labelIt: "Tranquillo", labelEn: "Quiet", labelFr: "Calme", labelEs: "Tranquilo" },
  famiglie: { icon: "F", color: "#16a34a", labelIt: "Famiglie", labelEn: "Families", labelFr: "Familles", labelEs: "Familias" },
  sicuro: { icon: "S", color: "#16a34a", labelIt: "Sicuro", labelEn: "Safe", labelFr: "Sur", labelEs: "Seguro" },
  budget: { icon: "$", color: "#d97706", labelIt: "Budget", labelEn: "Budget", labelFr: "Budget", labelEs: "Economico" },
  lusso: { icon: "L", color: "#e8c06a", labelIt: "Lusso", labelEn: "Luxury", labelFr: "Luxe", labelEs: "Lujo" },
  culturale: { icon: "A", color: "#9333ea", labelIt: "Culturale", labelEn: "Cultural", labelFr: "Culturel", labelEs: "Cultural" },
  arte: { icon: "A", color: "#7c3aed", labelIt: "Arte", labelEn: "Arts", labelFr: "Art", labelEs: "Arte" },
  mare: { icon: "W", color: "#0891b2", labelIt: "Mare", labelEn: "Sea", labelFr: "Mer", labelEs: "Mar" },
  spiaggia: { icon: "W", color: "#0891b2", labelIt: "Spiaggia", labelEn: "Beach", labelFr: "Plage", labelEs: "Playa" },
  porto: { icon: "P", color: "#0891b2", labelIt: "Porto", labelEn: "Harbor", labelFr: "Port", labelEs: "Puerto" },
  mercati: { icon: "M", color: "#ca8a04", labelIt: "Mercati", labelEn: "Markets", labelFr: "Marches", labelEs: "Mercados" },
  gastronomia: { icon: "G", color: "#dc2626", labelIt: "Gastronomia", labelEn: "Food scene", labelFr: "Gastronomie", labelEs: "Gastronomia" },
  shopping: { icon: "S", color: "#db2777", labelIt: "Shopping", labelEn: "Shopping", labelFr: "Shopping", labelEs: "Compras" },
  universita: { icon: "U", color: "#4f46e5", labelIt: "Universit\u00e0", labelEn: "University", labelFr: "Universit\u00e9", labelEs: "Universidad" },
  "vista panoramica": { icon: "V", color: "#ea580c", labelIt: "Vista panoramica", labelEn: "Great views", labelFr: "Belle vue", labelEs: "Buenas vistas" },
  panoramica: { icon: "V", color: "#ea580c", labelIt: "Panoramica", labelEn: "Scenic", labelFr: "Panoramique", labelEs: "Panoramico" },
  collina: { icon: "H", color: "#059669", labelIt: "Collina", labelEn: "Hill", labelFr: "Colline", labelEs: "Colina" },
  romantico: { icon: "R", color: "#db2777", labelIt: "Romantico", labelEn: "Romantic", labelFr: "Romantique", labelEs: "Romantico" },
  autentico: { icon: "A", color: "#b45309", labelIt: "Autentico", labelEn: "Authentic", labelFr: "Authentique", labelEs: "Autentico" },
};

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function vibeSymbol(key: string): string {
  if (["centro", "centro storico", "centrale"].includes(key)) return String.fromCodePoint(127919);
  if (["attrazioni", "storico"].includes(key)) return String.fromCodePoint(9733);
  if (["culturale", "arte"].includes(key)) return String.fromCodePoint(127963);
  if (["vita notturna", "movida"].includes(key)) return String.fromCodePoint(9790);
  if (["locali", "autentico"].includes(key)) return String.fromCodePoint(9829);
  if (key === "metro") return String.fromCodePoint(128647);
  if (["trasporti", "stazione"].includes(key)) return String.fromCodePoint(8644);
  if (key === "turistico") return String.fromCodePoint(127915);
  if (["tranquillo", "verde", "parco", "parchi"].includes(key)) return String.fromCodePoint(10087);
  if (key === "famiglie") return String.fromCodePoint(128101);
  if (["gastronomia", "cibo"].includes(key)) return String.fromCodePoint(127860);
  if (key === "sicuro") return String.fromCodePoint(10003);
  if (["shopping", "commercio", "mercati"].includes(key)) return String.fromCodePoint(128717);
  if (["residenziale", "romantico"].includes(key)) return String.fromCodePoint(9825);
  if (["panoramica", "vista panoramica"].includes(key)) return String.fromCodePoint(9673);
  if (key === "collina") return String.fromCodePoint(9651);
  if (key === "budget") return String.fromCodePoint(128176);
  if (["lusso", "elegante"].includes(key)) return String.fromCodePoint(9830);
  if (key === "mare") return String.fromCodePoint(8779);
  if (key === "spiaggia") return String.fromCodePoint(9728);
  if (key === "porto") return String.fromCodePoint(9875);
  if (["universita", "studenti"].includes(key)) return String.fromCodePoint(127891);
  if (key === "business") return String.fromCodePoint(9670);
  return String.fromCodePoint(8226);
}

function vibeStyle(tag: string, lang: string) {
  const style = neighborhoodVibe(tag, lang);
  return {
    icon: style.symbol,
    color: style.color,
    label: style.label,
  };
}

function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const r = 6371;
  const f1 = a.lat * Math.PI / 180;
  const f2 = b.lat * Math.PI / 180;
  const df = (b.lat - a.lat) * Math.PI / 180;
  const dl = (b.lon - a.lon) * Math.PI / 180;
  const x = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function fallbackPolygon(center: { lat: number; lon: number }, radiusMeters: number) {
  const latDelta = radiusMeters / 111_320;
  const lonDelta = radiusMeters / (111_320 * Math.cos(center.lat * Math.PI / 180));
  return {
    type: "Polygon" as const,
    coordinates: [[
      [center.lon - lonDelta, center.lat - latDelta],
      [center.lon + lonDelta, center.lat - latDelta],
      [center.lon + lonDelta, center.lat + latDelta],
      [center.lon - lonDelta, center.lat + latDelta],
      [center.lon - lonDelta, center.lat - latDelta],
    ]],
  };
}

function findLocalPolygon(city: string, neighborhood: Neighborhood) {
  const cityKey = normalize(city);
  const candidates = [neighborhood.name, neighborhood.name_en ?? "", neighborhood.name_fr ?? "", neighborhood.name_es ?? ""].map(normalize).filter(Boolean);
  return NEIGHBORHOOD_POLYGONS.find((item) =>
    normalize(item.city) === cityKey &&
    item.names.some((name) => {
      const key = normalize(name);
      return candidates.some((candidate) => candidate === key || candidate.includes(key) || key.includes(candidate));
    }),
  )?.geometry;
}

function buildAreas(
  neighborhoods: Neighborhood[],
  city: string,
  attractions: BuilderAttraction[],
  foodSpots: BuilderAttraction[],
  lang: string,
) {
  const allPoints = [...attractions, ...foodSpots]
    .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
  const center = allPoints.length
    ? {
        lat: allPoints.reduce((sum, p) => sum + p.latitude, 0) / allPoints.length,
        lon: allPoints.reduce((sum, p) => sum + p.longitude, 0) / allPoints.length,
      }
    : { lat: 41.9, lon: 12.5 };

  return neighborhoods.map((n, index) => {
    const name = localizedName(n, lang);
    const desc = localizedDescription(n, lang);
    const normalizedName = normalize(`${n.name} ${n.name_en ?? ""} ${n.name_fr ?? ""} ${n.name_es ?? ""}`);
    const nameTokens = new Set(normalizedName.split(" ").filter((token) => token.length >= 4));
    const matched = allPoints.filter((point) => {
      const zone = normalize(point.zone ?? "");
      if (!zone) return false;
      if (normalizedName.includes(zone) || zone.includes(normalizedName)) return true;
      return zone.split(" ").some((token) => token.length >= 4 && nameTokens.has(token));
    });

    const angle = (Math.PI * 2 * index) / Math.max(neighborhoods.length, 1);
    const fallbackRadius = 0.010 + index * 0.0018;
    const areaCenter = matched.length
      ? {
          lat: matched.reduce((sum, p) => sum + p.latitude, 0) / matched.length,
          lon: matched.reduce((sum, p) => sum + p.longitude, 0) / matched.length,
        }
      : {
          lat: center.lat + Math.sin(angle) * fallbackRadius,
          lon: center.lon + Math.cos(angle) * fallbackRadius,
        };
    const radius = matched.length
      ? Math.max(420, Math.min(1600, Math.max(...matched.map((p) => distanceKm(areaCenter, { lat: p.latitude, lon: p.longitude }))) * 1000 + 260))
      : 850;

    return {
      id: n.id,
      name: esc(name),
      desc: esc(desc),
      lat: areaCenter.lat,
      lon: areaCenter.lon,
      geometry: n.geojson ?? findLocalPolygon(city, n) ?? fallbackPolygon(areaCenter, radius),
      color: AREA_COLORS[index % AREA_COLORS.length],
      tags: (n.vibe_tags ?? []).map((tag) => {
        const style = vibeStyle(tag, lang);
        return {
          icon: esc(style.icon),
          label: esc(style.label),
          color: style.color,
        };
      }),
    };
  });
}

function buildLandmarks(attractions: BuilderAttraction[], lang: string) {
  return attractions
    .filter((item) => item.category_level === 1 && Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
    .map((item) => ({
      id: item.id,
      name: esc(localizedName(item, lang)),
      lat: item.latitude,
      lon: item.longitude,
    }));
}

export function buildHtml(
  areas: ReturnType<typeof buildAreas>,
  landmarks: ReturnType<typeof buildLandmarks>,
  city: string,
  lang: string,
  isDark: boolean,
  transitNetwork: TransitNetwork | null,
  documentId = "lodging-map",
  accommodation?: TripAccommodation | null,
): string {
  const tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  const bg = "#dfe8ec";
  const popupBg = isDark ? "#161625" : "#ffffff";
  const popupBorder = isDark ? "#2a2a42" : "#ddd6c7";
  const text = isDark ? "#f0f0f0" : "#1d1a16";
  const muted = isDark ? "#aaa" : "#5d574f";
  const areasJson = JSON.stringify(areas);
  const landmarksJson = JSON.stringify(landmarks);
  const accommodationJson = JSON.stringify(
    accommodation && Number.isFinite(accommodation.latitude) && Number.isFinite(accommodation.longitude)
      ? { name: esc(accommodation.name ?? (lang === "fr" ? "Mon logement" : lang === "es" ? "Mi alojamiento" : lang === "en" ? "My accommodation" : "Il mio alloggio")), address: esc(accommodation.address), lat: accommodation.latitude, lon: accommodation.longitude }
      : null,
  );
  const transitJson = JSON.stringify(transitNetwork).replace(/</g, "\\u003c");
  const t = translations[lang as keyof typeof translations] ?? translations.it;
  const landmarkLabel = lang === "fr"
    ? "Attraction embl\u00e9matique"
    : lang === "es"
      ? "Atracci\u00f3n ic\u00f3nica"
      : lang === "en"
        ? "Iconic attraction"
        : "Attrazione iconica";
  const transitCopy = transitPresentation(transitNetwork?.mode ?? transitModeForCity(city), lang);
  const transitLabel = transitCopy.label;
  const stationLabel = transitCopy.station;
  const linesLabel = lang === "fr" ? "Lignes" : lang === "es" ? "Líneas" : lang === "en" ? "Lines" : "Linee";
  const transitModeLabels = {
    recommended: lang === "fr" ? "Conseillés" : lang === "es" ? "Recomendados" : lang === "en" ? "Recommended" : "Consigliati",
    metro: "Metro",
    tram: lang === "fr" ? "Tramway" : "Tram",
    train: lang === "it" ? "Treno" : lang === "es" ? "Tren" : "Train",
    water: lang === "fr" ? "Bateau" : lang === "it" ? "Traghetto" : "Ferry",
  };

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=5.0,user-scalable=yes"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
html,body,#map{width:100%;height:100%;margin:0;background:${bg};font-family:-apple-system,BlinkMacSystemFont,sans-serif}
.leaflet-container{background:${bg}!important}
.leaflet-control-attribution{background:rgba(255,255,255,.9)!important;color:#4b5563!important;font-size:9px!important;padding:2px 5px!important}
.leaflet-control-attribution a{color:#2563eb!important}
.leaflet-popup-content-wrapper{background:${popupBg};border:1px solid ${popupBorder};border-radius:16px;color:${text};box-shadow:0 8px 28px rgba(0,0,0,.28)}
.leaflet-popup-tip{background:${popupBg}}
.leaflet-popup-content{box-sizing:border-box;width:min(260px,calc(100vw - 72px))!important;min-width:0;max-width:260px;margin:14px;overflow:hidden}
.area-title{font-size:15px;font-weight:800;margin-bottom:6px;color:${text}}
.area-title,.area-desc,.station-kicker{max-width:100%;overflow-wrap:anywhere;word-break:break-word;white-space:normal}
.area-desc{font-size:12px;line-height:1.45;color:${muted};margin-bottom:10px}
.tag-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.tag{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:800;border-radius:999px;padding:4px 8px}
.tag-icon{width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;font-size:14px;line-height:1;color:inherit}
.landmark-marker{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e8c06a;color:#11111f;border:2px solid #fff;font-size:13px;font-weight:900;box-shadow:0 3px 12px rgba(0,0,0,.5)}
.accommodation-marker{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:#a78bfa;color:#11111f;border:2px solid #fff;font-size:19px;box-shadow:0 4px 14px rgba(0,0,0,.42)}
.accommodation-toggle{position:absolute;top:12px;right:12px;z-index:1000;width:40px;height:38px;border-radius:10px;background:${isDark ? "rgba(12,12,26,.92)" : "rgba(255,255,255,.95)"};border:1px solid #a78bfa;display:flex;align-items:center;justify-content:center;color:#a78bfa;font-size:19px;font-weight:900;box-shadow:0 3px 12px rgba(0,0,0,.16)}.accommodation-toggle.off{opacity:.55;border-color:${popupBorder};color:${muted}}
.landmark-kicker{color:#b58b2d;font-size:10px;font-weight:900;text-transform:uppercase;margin-bottom:4px}
.transit-toggle{position:absolute;top:12px;left:12px;z-index:1000;min-width:42px;height:38px;border-radius:10px;padding:0 11px;background:${isDark ? "rgba(12,12,26,.92)" : "rgba(255,255,255,.95)"};border:1px solid ${popupBorder};display:flex;align-items:center;justify-content:center;gap:6px;color:${muted};font:800 11px -apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 3px 12px rgba(0,0,0,.16)}
.transit-toggle.active{color:${text};border-color:#0891b2;background:${isDark ? "rgba(8,145,178,.22)" : "rgba(207,250,254,.96)"}}
.transit-badge{display:inline-flex;align-items:center;justify-content:center;min-width:23px;height:23px;border-radius:6px;background:#0891b2;color:#fff;font-size:13px;font-weight:900}
.transit-mode-panel{position:absolute;top:56px;left:12px;z-index:1000;display:flex;flex-wrap:wrap;gap:5px;max-width:min(360px,calc(100% - 24px));padding:6px;border-radius:10px;background:${isDark ? "rgba(12,12,26,.92)" : "rgba(255,255,255,.95)"};border:1px solid ${popupBorder};box-shadow:0 3px 12px rgba(0,0,0,.16)}
.transit-mode-btn{border:1px solid ${popupBorder};border-radius:8px;padding:5px 8px;background:transparent;color:${muted};font:800 10px -apple-system,BlinkMacSystemFont,sans-serif}.transit-mode-btn.active{border-color:#0891b2;background:#0891b222;color:${text}}
.station-kicker{color:#0891b2;font-size:10px;font-weight:900;text-transform:uppercase;margin-bottom:4px}.station-lines{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;max-width:100%}.station-line{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;max-width:100%;min-width:25px;min-height:22px;height:auto;padding:4px 7px;border-radius:6px;font-size:10px;font-weight:900;line-height:1.25;text-align:center;white-space:normal;overflow-wrap:anywhere;word-break:break-word;border:1px solid rgba(0,0,0,.16)}
.hint{position:absolute;left:12px;right:12px;bottom:12px;z-index:500;background:${isDark ? "rgba(16,16,32,.88)" : "rgba(255,255,255,.9)"};border:1px solid ${popupBorder};border-radius:14px;padding:9px 12px;font-size:12px;color:${muted};text-align:center;backdrop-filter:blur(8px)}
</style>
</head>
<body>
<div id="map"></div>
<div class="hint">${esc(t.lodgingMapHint)}</div>
<script>
const DOCUMENT_ID=${JSON.stringify(documentId)};
const AREAS=${areasJson};
const LANDMARKS=${landmarksJson};
const ACCOMMODATION=${accommodationJson};
const TRANSIT=${transitJson};
const TRANSIT_LABEL=${JSON.stringify(transitLabel)};
const TRANSIT_BADGE=${JSON.stringify(transitNetwork?.badge ?? transitBadgeForCity(city))};
const STATION_LABEL=${JSON.stringify(stationLabel)};
const LINES_LABEL=${JSON.stringify(linesLabel)};
const TRANSIT_MODE_LABELS=${JSON.stringify(transitModeLabels)};
function sendMessage(payload){try{payload.documentId=DOCUMENT_ID;if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(JSON.stringify(payload));}else if(window.parent){window.parent.postMessage(JSON.stringify(payload),'*');}}catch(e){}}
function htmlText(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function hKm(lat1,lon1,lat2,lon2){var R=6371,f1=lat1*Math.PI/180,f2=lat2*Math.PI/180;var df=(lat2-lat1)*Math.PI/180,dl=(lon2-lon1)*Math.PI/180;var a=Math.sin(df/2)*Math.sin(df/2)+Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)*Math.sin(dl/2);return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
function lodgingTransitFocus(){return ACCOMMODATION?[ACCOMMODATION]:(LANDMARKS.length?LANDMARKS:AREAS);}
function isLodgingTransitPointRelevant(point,maxKm){var focus=lodgingTransitFocus();if(!focus.length)return true;for(var i=0;i<focus.length;i++){if(hKm(point[0],point[1],focus[i].lat,focus[i].lon)<=maxKm)return true;}return false;}
function isLodgingTransitEdgeRelevant(a,b){var ar=isLodgingTransitPointRelevant(a,4),br=isLodgingTransitPointRelevant(b,4);return ar&&br;}
window.onerror=function(msg){sendMessage({type:'error',message:String(msg)});return true;};
try{
const map=L.map('map',{zoomControl:false,attributionControl:true});
L.tileLayer('${tileUrl}',{subdomains:'abcd',maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'}).addTo(map);
let bounds=null;
AREAS.forEach(function(a){
try{
  const tags=(a.tags||[]).map(function(t){
    const bg=t.color+'18';
    const border=t.color+'55';
    return '<span class="tag" style="background:'+bg+';border:1px solid '+border+';color:'+t.color+'"><span class="tag-icon">'+t.icon+'</span>'+t.label+'</span>';
  }).join('');
  const popup='<div class="area-title">'+a.name+'</div><div class="area-desc">'+a.desc+'</div><div class="tag-row">'+tags+'</div>';
  const layer=L.geoJSON(a.geometry,{style:function(){return{color:a.color,weight:2.8,fillColor:a.color,fillOpacity:.24,opacity:.95};}}).addTo(map);
  layer.bindPopup(popup);
  const layerBounds=layer.getBounds();
  bounds=bounds ? bounds.extend(layerBounds) : layerBounds;
}catch(e){
  // Una geometria non valida non deve bloccare tutte le altre zone.
}
});
LANDMARKS.forEach(function(item){
try{
  const icon=L.divIcon({className:'',html:'<div class="landmark-marker">&#9733;</div>',iconSize:[24,24],iconAnchor:[12,12],popupAnchor:[0,-12]});
  const marker=L.marker([item.lat,item.lon],{icon:icon,zIndexOffset:800}).addTo(map);
  marker.bindPopup('<div class="landmark-kicker">${esc(landmarkLabel)}</div><div class="area-title">'+item.name+'</div>');
  const pointBounds=L.latLngBounds([item.lat,item.lon],[item.lat,item.lon]);
  bounds=bounds ? bounds.extend(pointBounds) : pointBounds;
}catch(e){
  // Mantieni disponibili le altre attrazioni anche con un dato corrotto.
}
});
if(ACCOMMODATION){
  const accommodationLayer=L.layerGroup().addTo(map);
  const icon=L.divIcon({className:'',html:'<div class="accommodation-marker">&#8962;</div>',iconSize:[34,34],iconAnchor:[17,17],popupAnchor:[0,-19]});
  const marker=L.marker([ACCOMMODATION.lat,ACCOMMODATION.lon],{icon:icon,zIndexOffset:1200}).addTo(accommodationLayer);
  marker.bindPopup('<div class="landmark-kicker" style="color:#a78bfa">'+ACCOMMODATION.name+'</div><div class="area-desc">'+ACCOMMODATION.address+'</div>');
  const pointBounds=L.latLngBounds([ACCOMMODATION.lat,ACCOMMODATION.lon],[ACCOMMODATION.lat,ACCOMMODATION.lon]);
  bounds=bounds ? bounds.extend(pointBounds) : pointBounds;
  const button=document.createElement('button');button.className='accommodation-toggle';button.innerHTML='&#8962;';button.setAttribute('aria-label',ACCOMMODATION.name);button.addEventListener('click',function(){const visible=map.hasLayer(accommodationLayer);if(visible)map.removeLayer(accommodationLayer);else accommodationLayer.addTo(map);button.classList.toggle('off',visible);});document.getElementById('map').appendChild(button);
}
var transitLayer=null;
var transitItems=[];
var selectedTransitMode='recommended';
function renderTransitLayer(){if(!transitLayer)return;transitLayer.clearLayers();transitItems.forEach(function(item){if(selectedTransitMode==='recommended'||item.modes.indexOf(selectedTransitMode)>=0)item.layer.addTo(transitLayer);});}
function setTransitMode(mode){selectedTransitMode=mode;renderTransitLayer();document.querySelectorAll('.transit-mode-btn').forEach(function(button){button.classList.toggle('active',button.dataset.mode===mode);});}
if(TRANSIT&&TRANSIT.lines&&TRANSIT.lines.length){
  map.createPane('transit-lines');map.getPane('transit-lines').style.zIndex=320;
  map.createPane('transit-stations');map.getPane('transit-stations').style.zIndex=610;
  transitLayer=L.layerGroup();
  var transitColors={};
  TRANSIT.lines.forEach(function(line){
    transitColors[line.id]=line.color;
    (line.paths||[]).forEach(function(path){for(var pathIndex=0;pathIndex<path.length-1;pathIndex++){var from=path[pathIndex],to=path[pathIndex+1];if(isLodgingTransitEdgeRelevant(from,to))transitItems.push({layer:L.polyline([from,to],{pane:'transit-lines',color:line.color,weight:4,opacity:.82,lineCap:'round',lineJoin:'round'}),modes:[line.mode||TRANSIT.mode||'metro']});}});
  });
  TRANSIT.stations.forEach(function(station){
    if(!isLodgingTransitPointRelevant([station.latitude,station.longitude],4))return;
    var interchange=station.lineIds.length>1;
    var color=transitColors[station.lineIds[0]]||'#0891b2';
    var marker=L.circleMarker([station.latitude,station.longitude],{pane:'transit-stations',radius:interchange?6:4,color:interchange?'#111827':color,weight:interchange?2.5:2,fillColor:'#fff',fillOpacity:1,opacity:1});
    var chips=station.lineIds.map(function(id){var line=TRANSIT.lines.find(function(item){return item.id===id;});var bg=line?line.color:'#64748b';var fg=line?line.textColor:'#fff';return '<span class="station-line" style="background:'+bg+';color:'+fg+'">'+htmlText(id)+'</span>';}).join('');
    marker.bindPopup('<div class="station-kicker">'+STATION_LABEL+'</div><div class="area-title">'+htmlText(station.name)+'</div><div class="area-desc">'+LINES_LABEL+'</div><div class="station-lines">'+chips+'</div>');
    var stationModes=station.lineIds.map(function(id){var item=TRANSIT.lines.find(function(line){return line.id===id;});return(item&&item.mode)||TRANSIT.mode||'metro';}).filter(function(mode,index,modes){return modes.indexOf(mode)===index;});
    transitItems.push({layer:marker,modes:stationModes});
  });
  renderTransitLayer();
  transitLayer.addTo(map);
  var transitVisible=true;
  var transitButton=document.createElement('button');
  transitButton.className='transit-toggle active';
  transitButton.setAttribute('aria-pressed','true');
  transitButton.innerHTML='<span class="transit-badge">'+TRANSIT_BADGE+'</span><span>'+TRANSIT_LABEL+'</span>';
  transitButton.addEventListener('click',function(){transitVisible=!transitVisible;if(transitVisible)transitLayer.addTo(map);else map.removeLayer(transitLayer);transitButton.classList.toggle('active',transitVisible);transitButton.setAttribute('aria-pressed',transitVisible?'true':'false');var panel=document.querySelector('.transit-mode-panel');if(panel)panel.style.display=transitVisible?'flex':'none';});
  document.getElementById('map').appendChild(transitButton);
  if(TRANSIT.mode==='mixed'){
    var availableModes=TRANSIT.lines.map(function(line){return line.mode||'metro';}).filter(function(mode,index,modes){return mode!=='mixed'&&modes.indexOf(mode)===index;});
    var modePanel=document.createElement('div');modePanel.className='transit-mode-panel';
    ['recommended'].concat(availableModes).forEach(function(mode){var button=document.createElement('button');button.className='transit-mode-btn'+(mode==='recommended'?' active':'');button.textContent=TRANSIT_MODE_LABELS[mode]||mode;button.dataset.mode=mode;button.addEventListener('click',function(){setTransitMode(mode);});modePanel.appendChild(button);});
    document.getElementById('map').appendChild(modePanel);
  }
}
setTimeout(function(){
  map.invalidateSize();
  if(bounds&&bounds.isValid()){map.fitBounds(bounds,{padding:[52,52],maxZoom:14});}else{map.setView([48,13],4);}
  sendMessage({type:'ready'});
},300);
}catch(e){sendMessage({type:'error',message:String(e&&e.message?e.message:e)});}
</script>
</body>
</html>`;
}

function neighborhoodMapHelp(lang: string) {
  const tx = (values: Record<string, string>) => localText(lang, values);
  const item = (icon: ContextHelpContent["icon"], title: Record<string, string>, body: Record<string, string>): ContextHelpContent => ({ icon, title: tx(title), body: tx(body) });
  return {
    close: item("close-circle-outline", { it: "Chiudi la mappa", en: "Close the map", fr: "Fermer la carte", es: "Cerrar el mapa" }, { it: "Torna alle schede delle zone dove alloggiare.", en: "Return to the neighborhood cards.", fr: "Revenez aux fiches des quartiers où séjourner.", es: "Vuelve a las fichas de las zonas donde alojarte." }),
    map: item("business-outline", { it: "Zone e punti di riferimento", en: "Areas and landmarks", fr: "Quartiers et points de repère", es: "Zonas y puntos de referencia" }, { it: "Ogni colore delimita una zona consigliata. Tocca un’area per leggerne caratteristiche, pro e contro; le attrazioni iconiche aiutano a capire la posizione rispetto ai luoghi principali.", en: "Each color outlines a recommended area. Tap it to view its traits, pros, and cons; iconic attractions help you understand its position relative to key sights.", fr: "Chaque couleur délimite un quartier conseillé. Touchez-le pour consulter ses caractéristiques, avantages et inconvénients ; les attractions emblématiques servent de points de repère.", es: "Cada color delimita una zona recomendada. Tócala para ver sus características, ventajas y desventajas; las atracciones icónicas sirven como referencia." }),
  };
}

export function NeighborhoodMap({ visible, onClose, neighborhoods, city, cityLabel, attractions, foodSpots = [], accommodation, lang }: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [transitFallback, setTransitFallback] = useState(false);
  const [mapReloadKey, setMapReloadKey] = useState(0);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const contextHelp = useContextHelpController();
  const mapHelp = neighborhoodMapHelp(lang);
  const firstVisitGuide = useFirstVisitGuide({
    guideId: "neighborhood-map-v1",
    controller: contextHelp,
    enabled: visible,
    steps: [{ content: mapHelp.map }],
  });
  const { network: transitNetwork, resolved: transitResolved } = useTransitNetwork(city, visible);
  const t = translations[lang as keyof typeof translations] ?? translations.it;
  const landmarkLabel = lang === "fr"
    ? "Attraction embl\u00e9matique"
    : lang === "es"
      ? "Atracci\u00f3n ic\u00f3nica"
      : lang === "en"
        ? "Iconic attraction"
        : "Attrazione iconica";
  const areas = useMemo(
    () => buildAreas(neighborhoods, city, attractions, foodSpots, lang),
    [neighborhoods, city, attractions, foodSpots, lang],
  );
  const landmarks = useMemo(() => buildLandmarks(attractions, lang), [attractions, lang]);
  const effectiveTransit = transitFallback ? null : transitNetwork;
  const documentId = useMemo(
    () => [city, lang, isDark ? "dark" : "light", transitFallback ? "fallback" : (effectiveTransit?.fetchedAt ?? "base"), areas.length, landmarks.length, accommodation?.updatedAt, mapReloadKey].join(":"),
    [city, lang, isDark, transitFallback, effectiveTransit?.fetchedAt, areas.length, landmarks.length, accommodation?.updatedAt, mapReloadKey],
  );
  const html = useMemo(
    () => buildHtml(areas, landmarks, city, lang, isDark, effectiveTransit, documentId, accommodation),
    [areas, landmarks, city, lang, isDark, effectiveTransit, accommodation, documentId],
  );
  const currentDocumentId = useRef(documentId);
  currentDocumentId.current = documentId;

  useEffect(() => {
    if (visible) setTransitFallback(false);
  }, [visible, city]);

  useEffect(() => {
    if (visible) setStatus("loading");
  }, [visible, html]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handler = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.documentId !== documentId) return;
        if (msg.type === "ready") setStatus("ready");
        if (msg.type === "error") {
          console.warn("[lodging-map]", msg.message ?? "Embedded map error");
          if (effectiveTransit && !transitFallback) setTransitFallback(true);
          else setStatus("error");
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [documentId, effectiveTransit, transitFallback]);

  const handleMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.documentId !== documentId) return;
      if (msg.type === "ready") setStatus("ready");
      if (msg.type === "error") {
        console.warn("[lodging-map]", msg.message ?? "Embedded map error");
        if (effectiveTransit && !transitFallback) setTransitFallback(true);
        else setStatus("error");
      }
    } catch {}
  };

  const handleWebViewError = (event: any) => {
    const message = event?.nativeEvent?.description ?? "WebView loading error";
    console.warn("[lodging-map]", message);
    setStatus("error");
  };

  const handleLoadEnd = () => {
    const loadedDocumentId = documentId;
    setTimeout(() => {
      if (currentDocumentId.current === loadedDocumentId) {
        setStatus((current) => current === "loading" ? "ready" : current);
      }
    }, 4500);
  };

  const iframe = Platform.OS === "web" && transitResolved
    ? React.createElement("iframe", {
        key: documentId,
        srcDoc: html,
        style: { width: "100%", height: "100%", border: "none", backgroundColor: colors.bg },
        sandbox: "allow-scripts allow-same-origin",
      })
    : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={firstVisitGuide.mandatory ? () => {} : onClose}>
      <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: colors.bg }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={contextHelp.guard(mapHelp.close, onClose)}
            style={[styles.closeBtn, { backgroundColor: colors.card2 }]}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={mapHelp.close.title}
            hitSlop={6}
          >
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.accentGold }]}>{t.lodgingMapTitle}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{cityLabel}</Text>
          </View>
          <TouchableOpacity
            onPress={firstVisitGuide.onHelpPress}
            style={[styles.closeBtn, { backgroundColor: contextHelp.active ? colors.accentGold : colors.card2 }, contextHelpOutline(contextHelp.active, colors.accentGold)]}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={lang === "es" ? "Ayuda del mapa" : lang === "fr" ? "Aide de la carte" : lang === "en" ? "Map help" : "Guida della mappa"}
            accessibilityState={{ expanded: contextHelp.active }}
            hitSlop={6}
          >
            <Ionicons name={contextHelp.active ? "help" : "help-outline"} size={21} color={contextHelp.active ? colors.bg : colors.accentGold} />
          </TouchableOpacity>
        </View>

        <View style={styles.mapWrap}>
          {!transitResolved ? null : Platform.OS === "web" ? iframe : (
            <WebView
              key={documentId}
              source={{ html, baseUrl: "https://unpkg.com" }}
              originWhitelist={["*"]}
              javaScriptEnabled
              domStorageEnabled
              onMessage={handleMessage}
              onLoadEnd={handleLoadEnd}
              onError={handleWebViewError}
              style={[styles.webview, { backgroundColor: colors.bg }]}
            />
          )}

          {status === "loading" && (
            <MapStatusOverlay status="loading" lang={lang} />
          )}
          {status === "error" && (
            <MapStatusOverlay
              status="error"
              lang={lang}
              onRetry={() => {
                setStatus("loading");
                setMapReloadKey((value) => value + 1);
              }}
            />
          )}
          {contextHelp.active && (
            <TouchableOpacity style={styles.guideOverlay} activeOpacity={1} onPress={(event) => contextHelp.explain(mapHelp.map, { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY })} />
          )}
        </View>
        <ContextHelpUI controller={contextHelp} lang={lang} guided={firstVisitGuide.guided} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  guideOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 30 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: "900" },
  subtitle: { fontSize: 12, marginTop: 2 },
  mapWrap: { flex: 1 },
  webview: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 34,
  },
  overlayText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
