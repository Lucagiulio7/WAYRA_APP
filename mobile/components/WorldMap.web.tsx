import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { MapStatusOverlay } from "./MapStatusOverlay";

// ── Dati città con coordinate geografiche ────────────────────────────────────

const CITY_DATA = [
  { id: "vienna",             iso3: "AUT", lat: 48.21, lng: 16.37, emoji: "🎵", labelIt: "Vienna",              labelEn: "Vienna" },
  { id: "bruges",             iso3: "BEL", lat: 51.21, lng:  3.22, emoji: "🚤", labelIt: "Bruges",              labelEn: "Bruges" },
  { id: "copenaghen",         iso3: "DNK", lat: 55.68, lng: 12.57, emoji: "🚲", labelIt: "Copenaghen",          labelEn: "Copenhagen" },
  { id: "parigi",             iso3: "FRA", lat: 48.86, lng:  2.35, emoji: "🗼", labelIt: "Parigi",              labelEn: "Paris" },
  { id: "marsiglia",          iso3: "FRA", lat: 43.30, lng:  5.37, emoji: "⚓", labelIt: "Marsiglia",           labelEn: "Marseille" },
  { id: "berlino",            iso3: "DEU", lat: 52.52, lng: 13.40, emoji: "🐻", labelIt: "Berlino",             labelEn: "Berlin" },
  { id: "monaco_di_baviera",  iso3: "DEU", lat: 48.14, lng: 11.58, emoji: "🍺", labelIt: "Monaco di Baviera",   labelEn: "Munich" },
  { id: "francoforte",        iso3: "DEU", lat: 50.11, lng:  8.68, emoji: "🏦", labelIt: "Francoforte",         labelEn: "Frankfurt" },
  { id: "helsinki",           iso3: "FIN", lat: 60.17, lng: 24.94, emoji: "🧭", labelIt: "Helsinki",            labelEn: "Helsinki" },
  { id: "atene",              iso3: "GRC", lat: 37.98, lng: 23.73, emoji: "🏛",  labelIt: "Atene",               labelEn: "Athens" },
  { id: "candia",             iso3: "GRC", lat: 35.34, lng: 25.13, emoji: "🏺", labelIt: "Candia",              labelEn: "Heraklion" },
  { id: "dublino",            iso3: "IRL", lat: 53.33, lng: -6.25, emoji: "🍀", labelIt: "Dublino",             labelEn: "Dublin" },
  { id: "dubrovnik",          iso3: "HRV", lat: 42.65, lng: 18.09, emoji: "🏰", labelIt: "Dubrovnik",           labelEn: "Dubrovnik" },
  { id: "reykjavik",          iso3: "ISL", lat: 64.15, lng: -21.94, emoji: "🌋", labelIt: "Reykjavík",          labelEn: "Reykjavík" },
  { id: "roma",               iso3: "ITA", lat: 41.90, lng: 12.50, emoji: "🏛️", labelIt: "Roma",                labelEn: "Rome" },
  { id: "milano",             iso3: "ITA", lat: 45.47, lng:  9.19, emoji: "💎", labelIt: "Milano",              labelEn: "Milan" },
  { id: "venezia",            iso3: "ITA", lat: 45.44, lng: 12.32, emoji: "🚣", labelIt: "Venezia",             labelEn: "Venice" },
  { id: "napoli",             iso3: "ITA", lat: 40.84, lng: 14.25, emoji: "🍕", labelIt: "Napoli",              labelEn: "Naples" },
  { id: "firenze",            iso3: "ITA", lat: 43.77, lng: 11.25, emoji: "🌸", labelIt: "Firenze",             labelEn: "Florence" },
  { id: "marrakech",          iso3: "MAR", lat: 31.63, lng: -8.00, emoji: "🌴", labelIt: "Marrakech",           labelEn: "Marrakech" },
  { id: "amsterdam",          iso3: "NLD", lat: 52.37, lng:  4.90, emoji: "🚲", labelIt: "Amsterdam",           labelEn: "Amsterdam" },
  { id: "cracovia",           iso3: "POL", lat: 50.06, lng: 19.94, emoji: "🦅", labelIt: "Cracovia",            labelEn: "Krakow" },
  { id: "varsavia",           iso3: "POL", lat: 52.23, lng: 21.01, emoji: "⚔️", labelIt: "Varsavia",            labelEn: "Warsaw" },
  { id: "lisbona",            iso3: "PRT", lat: 38.72, lng: -9.14, emoji: "🚋", labelIt: "Lisbona",             labelEn: "Lisbon" },
  { id: "porto",              iso3: "PRT", lat: 41.16, lng: -8.63, emoji: "🍷", labelIt: "Porto",               labelEn: "Porto" },
  { id: "londra",             iso3: "GBR", lat: 51.51, lng: -0.13, emoji: "🎡", labelIt: "Londra",              labelEn: "London" },
  { id: "edimburgo",          iso3: "GBR", lat: 55.95, lng: -3.19, emoji: "🏰", labelIt: "Edimburgo",           labelEn: "Edinburgh" },
  { id: "praga",              iso3: "CZE", lat: 50.08, lng: 14.44, emoji: "🏰", labelIt: "Praga",               labelEn: "Prague" },
  { id: "bucarest",           iso3: "ROU", lat: 44.43, lng: 26.10, emoji: "🌹", labelIt: "Bucarest",            labelEn: "Bucharest" },
  { id: "bratislava",         iso3: "SVK", lat: 48.15, lng: 17.11, emoji: "🏯", labelIt: "Bratislava",          labelEn: "Bratislava" },
  { id: "barcellona",         iso3: "ESP", lat: 41.39, lng:  2.15, emoji: "🌊", labelIt: "Barcellona",          labelEn: "Barcelona" },
  { id: "madrid",             iso3: "ESP", lat: 40.42, lng: -3.70, emoji: "🎨", labelIt: "Madrid",              labelEn: "Madrid" },
  { id: "siviglia",           iso3: "ESP", lat: 37.39, lng: -5.99, emoji: "💃", labelIt: "Siviglia",            labelEn: "Seville" },
  { id: "valencia",           iso3: "ESP", lat: 39.47, lng: -0.38, emoji: "🍊", labelIt: "Valencia",            labelEn: "Valencia" },
  { id: "valletta",           iso3: "MLT", lat: 35.90, lng: 14.51, emoji: "⚔️", labelIt: "Valletta",            labelEn: "Valletta" },
  { id: "stoccolma",          iso3: "SWE", lat: 59.33, lng: 18.07, emoji: "🌊", labelIt: "Stoccolma",           labelEn: "Stockholm" },
  { id: "oslo",               iso3: "NOR", lat: 59.91, lng: 10.75, emoji: "🏔️", labelIt: "Oslo",                labelEn: "Oslo" },
  { id: "bergen",             iso3: "NOR", lat: 60.39, lng:  5.32, emoji: "🎣", labelIt: "Bergen",              labelEn: "Bergen" },
  { id: "istanbul",           iso3: "TUR", lat: 41.01, lng: 28.98, emoji: "🕌", labelIt: "Istanbul",            labelEn: "Istanbul" },
  { id: "antalya",            iso3: "TUR", lat: 36.89, lng: 30.71, emoji: "🏖️", labelIt: "Antalya",             labelEn: "Antalya" },
  { id: "muğla",              iso3: "TUR", lat: 37.22, lng: 28.36, emoji: "🛥️", labelIt: "Muğla",               labelEn: "Muğla" },
  { id: "budapest",           iso3: "HUN", lat: 47.50, lng: 19.04, emoji: "♨️", labelIt: "Budapest",            labelEn: "Budapest" },
];

const AVAILABLE_ISO3 = [...new Set(CITY_DATA.map((c) => c.iso3))];

// ── Costruisce l'HTML Leaflet (versione web: usa window.parent.postMessage) ──

function buildMapHtml(lang: string): string {
  const cityJson = JSON.stringify(CITY_DATA);
  const availableJson = JSON.stringify(AVAILABLE_ISO3);
  const hint = lang === "es"
    ? "Toca un pais destacado para ver sus ciudades"
    : lang === "fr"
    ? "Touchez un pays mis en evidence pour voir les villes"
    : lang === "it"
      ? "Tocca un paese evidenziato per vedere le città"
      : "Tap a highlighted country to see cities";
  const tapCity = lang === "es"
    ? "Toca una ciudad para seleccionarla"
    : lang === "fr"
    ? "Touchez une ville pour la selectionner"
    : lang === "it"
      ? "Tocca una città per selezionarla"
      : "Tap a city to select it";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#0a0a1a;font-family:-apple-system,sans-serif}
#map{width:100%;height:100%}
.leaflet-container{background:#0a0a1a!important}
.city-wrap{
  white-space:nowrap;
  display:flex;flex-direction:column;align-items:center;
  transform:translateX(-50%) translateY(-100%);
  cursor:pointer;
}
.city-bubble{
  background:rgba(10,10,26,0.92);
  border:1.5px solid #e8c06a;
  border-radius:20px;
  padding:4px 9px 4px 6px;
  display:flex;align-items:center;gap:4px;
  box-shadow:0 2px 10px rgba(232,192,106,0.28);
}
.city-bubble:active{background:rgba(232,192,106,0.15)}
.city-emoji{font-size:13px;line-height:1}
.city-name{color:#f0f0f0;font-size:11px;font-weight:700;letter-spacing:0.1px}
.city-pin{width:1.5px;height:5px;background:#e8c06a}
#toast{
  position:fixed;bottom:18px;left:50%;transform:translateX(-50%);
  background:rgba(12,12,28,0.9);border:1px solid #2a2a42;
  border-radius:20px;padding:9px 18px;
  color:#888;font-size:12px;font-weight:600;letter-spacing:0.3px;
  pointer-events:none;transition:opacity 0.4s;white-space:nowrap;
  z-index:9999;
}
</style>
</head>
<body>
<div id="map"></div>
<div id="toast">${hint}</div>
<script>
const LANG = '${lang}';
const CITY_DATA = ${cityJson};
const AVAILABLE_ISO3 = new Set(${availableJson});
const HINT = '${hint}';
const TAP_CITY = '${tapCity}';

function sendMessage(data) {
  window.parent.postMessage(JSON.stringify(data), '*');
}

const map = L.map('map',{
  center:[49,13],zoom:4,
  zoomControl:false,attributionControl:false,
  minZoom:2,maxZoom:10
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',{
  subdomains:'abcd',maxZoom:20
}).addTo(map);

const toast = document.getElementById('toast');
let cityMarkers=[], activeLayer=null;

function setToast(msg){ toast.textContent=msg; toast.style.opacity='1'; }
function hideToast(){ toast.style.opacity='0'; }

function clearMarkers(){
  cityMarkers.forEach(m=>map.removeLayer(m));
  cityMarkers=[];
}

function showCities(iso3){
  clearMarkers();
  const cities = CITY_DATA.filter(c=>c.iso3===iso3);
  cities.forEach(city=>{
    const label = LANG==='fr' ? city.labelEn : LANG==='it' ? city.labelIt : city.labelEn;
    const icon = L.divIcon({
      html: '<div class="city-wrap"><div class="city-bubble"><span class="city-emoji">'+city.emoji+'</span><span class="city-name">'+label+'</span></div><div class="city-pin"></div></div>',
      className:'',
      iconSize:[0,0],
      iconAnchor:[0,0]
    });
    const mk = L.marker([city.lat,city.lng],{icon,interactive:true,zIndexOffset:1000});
    mk.on('click',function(e){
      L.DomEvent.stopPropagation(e);
      sendMessage({type:'citySelected',cityId:city.id});
    });
    mk.addTo(map);
    cityMarkers.push(mk);
  });
  setToast(TAP_CITY);
}

function resetCountry(){
  if(activeLayer){
    activeLayer.setStyle({fillColor:'#e8c06a',fillOpacity:0.2,color:'#e8c06a',weight:1.5,opacity:0.6});
    activeLayer=null;
  }
  clearMarkers();
  setToast(HINT);
}

fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
  .then(r=>r.json())
  .then(data=>{
    L.geoJSON(data,{
      style:function(feature){
        const has=AVAILABLE_ISO3.has(feature.id);
        return {
          fillColor: has?'#e8c06a':'#111122',
          fillOpacity: has?0.2:0.05,
          color: has?'#e8c06a':'#252540',
          weight: has?1.5:0.4,
          opacity: has?0.6:0.2
        };
      },
      onEachFeature:function(feature,layer){
        if(!AVAILABLE_ISO3.has(feature.id)) return;
        layer.on('click',function(e){
          L.DomEvent.stopPropagation(e);
          if(activeLayer===layer){resetCountry();return;}
          if(activeLayer) activeLayer.setStyle({fillColor:'#e8c06a',fillOpacity:0.2,color:'#e8c06a',weight:1.5,opacity:0.6});
          layer.setStyle({fillColor:'#e8c06a',fillOpacity:0.45,color:'#f0d080',weight:2.5,opacity:0.9});
          activeLayer=layer;
          showCities(feature.id);
        });
        layer.on('mouseover',function(){
          if(layer!==activeLayer) layer.setStyle({fillOpacity:0.35,weight:2.0});
        });
        layer.on('mouseout',function(){
          if(layer!==activeLayer) layer.setStyle({fillOpacity:0.2,weight:1.5});
        });
      }
    }).addTo(map);
    sendMessage({type:'ready'});
    setToast(HINT);
  })
  .catch(function(err){
    sendMessage({type:'error',message:err.message});
  });

map.on('click',function(){resetCountry();});
</script>
</body>
</html>`;
}

// ── Componente WorldMapModal (versione web) ───────────────────────────────────

interface Props {
  visible: boolean;
  lang: string;
  onSelect: (cityId: string) => void;
  onClose: () => void;
}

export function WorldMapModal({ visible, lang, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [mapReloadKey, setMapReloadKey] = useState(0);
  const htmlRef = useRef(buildMapHtml(lang));
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setStatus("loading");
      htmlRef.current = buildMapHtml(lang);
    }
  }, [visible, lang]);

  // Ascolta i messaggi dall'iframe tramite postMessage
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "ready")        setStatus("ready");
        if (msg.type === "error")        setStatus("error");
        if (msg.type === "citySelected") { onSelect(msg.cityId); onClose(); }
      } catch { /* ignore */ }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onSelect, onClose]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.safe, { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* ── Header ── */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {lang === "es" ? "Elegir destino" : lang === "fr" ? "Choisir la destination" : lang === "it" ? "Scegli la destinazione" : "Choose destination"}
          </Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.card }]} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Mappa ── */}
        <View style={styles.mapWrap}>
          {/* iframe nativo web al posto di WebView */}
          <iframe
            key={mapReloadKey}
            ref={iframeRef}
            srcDoc={htmlRef.current}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              backgroundColor: colors.bg,
            }}
            sandbox="allow-scripts allow-same-origin"
          />

          {/* Loading overlay */}
          {status === "loading" && (
            <MapStatusOverlay status="loading" lang={lang} />
          )}

          {/* Error overlay */}
          {status === "error" && (
            <MapStatusOverlay
              status="error"
              lang={lang}
              onRetry={() => {
                setStatus("loading");
                htmlRef.current = buildMapHtml(lang);
                setMapReloadKey((value) => value + 1);
              }}
            />
          )}
        </View>
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
  },

  mapWrap: { flex: 1, position: "relative" },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 40,
  },
  overlayText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  retryBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryText: { fontSize: 14, fontWeight: "600" },
});
