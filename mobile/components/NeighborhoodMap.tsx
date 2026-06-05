import React, { useEffect, useMemo, useState } from "react";
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

interface Props {
  visible: boolean;
  onClose: () => void;
  neighborhoods: Neighborhood[];
  city: string;
  cityLabel: string;
  attractions: BuilderAttraction[];
  foodSpots?: BuilderAttraction[];
  lang: string;
}

const AREA_COLORS = ["#e8c06a", "#7eb8f7", "#a78bfa", "#6ee7b7", "#f97316", "#f472b6", "#22d3ee", "#fb7185"];

const VIBE_STYLES: Record<string, { icon: string; color: string; labelIt: string; labelEn: string }> = {
  centro: { icon: "⌖", color: "#e8c06a", labelIt: "Centrale", labelEn: "Central" },
  centrale: { icon: "⌖", color: "#e8c06a", labelIt: "Centrale", labelEn: "Central" },
  attrazioni: { icon: "⌖", color: "#9333ea", labelIt: "Vicino attrazioni", labelEn: "Near sights" },
  turistico: { icon: "⌖", color: "#e8c06a", labelIt: "Turistico", labelEn: "Touristy" },
  "vita notturna": { icon: "◐", color: "#7c3aed", labelIt: "Vita notturna", labelEn: "Nightlife" },
  locali: { icon: "◐", color: "#b45309", labelIt: "Atmosfera locale", labelEn: "Local vibe" },
  metro: { icon: "▭", color: "#2563eb", labelIt: "Metro vicina", labelEn: "Near metro" },
  trasporti: { icon: "▭", color: "#2563eb", labelIt: "Ben collegato", labelEn: "Well connected" },
  stazione: { icon: "▭", color: "#2563eb", labelIt: "Stazione", labelEn: "Station" },
  tranquillo: { icon: "◌", color: "#059669", labelIt: "Tranquillo", labelEn: "Quiet" },
  famiglie: { icon: "◌", color: "#16a34a", labelIt: "Famiglie", labelEn: "Families" },
  sicuro: { icon: "◌", color: "#16a34a", labelIt: "Sicuro", labelEn: "Safe" },
  budget: { icon: "$", color: "#d97706", labelIt: "Budget", labelEn: "Budget" },
  lusso: { icon: "◆", color: "#e8c06a", labelIt: "Lusso", labelEn: "Luxury" },
  culturale: { icon: "▣", color: "#9333ea", labelIt: "Culturale", labelEn: "Cultural" },
  arte: { icon: "▣", color: "#7c3aed", labelIt: "Arte", labelEn: "Arts" },
  mare: { icon: "≈", color: "#0891b2", labelIt: "Mare", labelEn: "Sea" },
  spiaggia: { icon: "≈", color: "#0891b2", labelIt: "Spiaggia", labelEn: "Beach" },
  porto: { icon: "≈", color: "#0891b2", labelIt: "Porto", labelEn: "Harbor" },
  mercati: { icon: "▤", color: "#ca8a04", labelIt: "Mercati", labelEn: "Markets" },
  gastronomia: { icon: "▤", color: "#dc2626", labelIt: "Gastronomia", labelEn: "Food scene" },
  shopping: { icon: "◧", color: "#db2777", labelIt: "Shopping", labelEn: "Shopping" },
  universita: { icon: "◇", color: "#4f46e5", labelIt: "Università", labelEn: "University" },
  "vista panoramica": { icon: "△", color: "#ea580c", labelIt: "Vista panoramica", labelEn: "Great views" },
  panoramica: { icon: "△", color: "#ea580c", labelIt: "Panoramica", labelEn: "Scenic" },
  collina: { icon: "△", color: "#059669", labelIt: "Collina", labelEn: "Hill" },
  romantico: { icon: "♡", color: "#db2777", labelIt: "Romantico", labelEn: "Romantic" },
  autentico: { icon: "✦", color: "#b45309", labelIt: "Autentico", labelEn: "Authentic" },
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

function vibeStyle(tag: string, lang: string) {
  const key = normalize(tag.replace(/_/g, " "));
  const style = VIBE_STYLES[key] ?? {
    icon: "•",
    color: "#888888",
    labelIt: tag.replace(/_/g, " "),
    labelEn: tag.replace(/_/g, " "),
  };
  return {
    icon: style.icon,
    color: style.color,
    label: lang === "en" ? style.labelEn : style.labelIt,
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
  const candidates = [neighborhood.name, neighborhood.name_en ?? ""].map(normalize).filter(Boolean);
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
    const name = lang === "en" && n.name_en ? n.name_en : n.name;
    const desc = lang === "en" && n.description_en ? n.description_en : n.description;
    const normalizedName = normalize(`${n.name} ${n.name_en ?? ""}`);
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

function buildHtml(areas: ReturnType<typeof buildAreas>, lang: string, isDark: boolean): string {
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
  const bg = isDark ? "#0a0a1a" : "#f3f1ec";
  const popupBg = isDark ? "#161625" : "#ffffff";
  const popupBorder = isDark ? "#2a2a42" : "#ddd6c7";
  const text = isDark ? "#f0f0f0" : "#1d1a16";
  const muted = isDark ? "#aaa" : "#5d574f";
  const areasJson = JSON.stringify(areas);
  const isEn = lang === "en";

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
.leaflet-popup-content-wrapper{background:${popupBg};border:1px solid ${popupBorder};border-radius:16px;color:${text};box-shadow:0 8px 28px rgba(0,0,0,.28)}
.leaflet-popup-tip{background:${popupBg}}
.leaflet-popup-content{min-width:210px;max-width:260px;margin:14px}
.area-title{font-size:15px;font-weight:800;margin-bottom:6px;color:${text}}
.area-desc{font-size:12px;line-height:1.45;color:${muted};margin-bottom:10px}
.tag-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.tag{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:800;border-radius:999px;padding:4px 8px}
.tag-icon{width:15px;height:15px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:${popupBg}}
.hint{position:absolute;left:12px;right:12px;bottom:12px;z-index:500;background:${isDark ? "rgba(16,16,32,.88)" : "rgba(255,255,255,.9)"};border:1px solid ${popupBorder};border-radius:14px;padding:9px 12px;font-size:12px;color:${muted};text-align:center;backdrop-filter:blur(8px)}
</style>
</head>
<body>
<div id="map"></div>
<div class="hint">${esc(isEn ? "Tap a colored area to see the neighborhood features." : "Tocca un'area colorata per vedere le caratteristiche della zona.")}</div>
<script>
function sendMessage(payload){try{if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(JSON.stringify(payload));}else if(window.parent){window.parent.postMessage(JSON.stringify(payload),'*');}}catch(e){}}
window.onerror=function(msg){sendMessage({type:'error',message:String(msg)});return true;};
try{
const AREAS=${areasJson};
const map=L.map('map',{zoomControl:false,attributionControl:false});
L.tileLayer('${tileUrl}',{maxZoom:19}).addTo(map);
let bounds=null;
AREAS.forEach(function(a){
  const tags=(a.tags||[]).map(function(t){
    const bg=t.color+'18';
    const border=t.color+'55';
    return '<span class="tag" style="background:'+bg+';border:1px solid '+border+';color:'+t.color+'"><span class="tag-icon" style="background:'+t.color+'">'+t.icon+'</span>'+t.label+'</span>';
  }).join('');
  const popup='<div class="area-title">'+a.name+'</div><div class="area-desc">'+a.desc+'</div><div class="tag-row">'+tags+'</div>';
  const layer=L.geoJSON(a.geometry,{style:function(){return{color:a.color,weight:2.8,fillColor:a.color,fillOpacity:.24,opacity:.95};}}).addTo(map);
  layer.bindPopup(popup);
  const layerBounds=layer.getBounds();
  bounds=bounds ? bounds.extend(layerBounds) : layerBounds;
});
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

export function NeighborhoodMap({ visible, onClose, neighborhoods, city, cityLabel, attractions, foodSpots = [], lang }: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const isEn = lang === "en";
  const areas = useMemo(
    () => buildAreas(neighborhoods, city, attractions, foodSpots, lang),
    [neighborhoods, city, attractions, foodSpots, lang],
  );
  const html = useMemo(() => buildHtml(areas, lang, isDark), [areas, lang, isDark]);

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
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "ready") setStatus("ready");
      if (msg.type === "error") setStatus("error");
    } catch {}
  };

  const iframe = Platform.OS === "web"
    ? React.createElement("iframe", {
        srcDoc: html,
        style: { width: "100%", height: "100%", border: "none", backgroundColor: colors.bg },
        sandbox: "allow-scripts allow-same-origin",
      })
    : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: colors.bg }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.card2 }]} activeOpacity={0.75}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.accentGold }]}>{isEn ? "Stay Map" : "Mappa alloggi"}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{cityLabel}</Text>
          </View>
        </View>

        <View style={styles.mapWrap}>
          {Platform.OS === "web" ? iframe : (
            <WebView
              source={{ html, baseUrl: "https://unpkg.com" }}
              originWhitelist={["*"]}
              javaScriptEnabled
              domStorageEnabled
              onMessage={handleMessage}
              onLoadEnd={() => setTimeout(() => setStatus((s) => s === "loading" ? "ready" : s), 4500)}
              onError={() => setStatus("error")}
              style={[styles.webview, { backgroundColor: colors.bg }]}
            />
          )}

          {status === "loading" && (
            <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
              <ActivityIndicator color={colors.accentGold} size="large" />
              <Text style={[styles.overlayText, { color: colors.textMuted }]}>{isEn ? "Loading lodging map..." : "Caricamento mappa alloggi..."}</Text>
            </View>
          )}
          {status === "error" && (
            <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
              <Ionicons name="map-outline" size={42} color={colors.textMuted} />
              <Text style={[styles.overlayText, { color: colors.textMuted }]}>{isEn ? "Internet connection required for the map." : "Connessione internet necessaria per la mappa."}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
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
