import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { BuilderAttraction } from "@/hooks/useAttractions";
import { localizedDescription, localizedName } from "@/utils/localization";
import { localText } from "@/i18n";
import { ContextHelpUI, contextHelpOutline, useContextHelpController, type ContextHelpContent } from "./ContextHelp";
import { MapStatusOverlay } from "./MapStatusOverlay";

// â”€â”€ Tipo condiviso con create-itinerary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface MapSlot {
  slotId: string;
  kind: "attraction" | "meal";
  attraction: BuilderAttraction;
}

// â”€â”€ Props â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface Props {
  visible: boolean;
  onClose: () => void;
  lang: string;
  dayLabel: string;
  attractions: BuilderAttraction[];
  foodSpots: BuilderAttraction[];
  currentSlots: MapSlot[];
  onAddAttraction: (a: BuilderAttraction) => void;
  onAddFood: (f: BuilderAttraction, afterSlotId: string | null) => void;
  onRemove: (slotId: string) => void;
  onReorder: (newSlotIds: string[]) => void;
}

// â”€â”€ Costanti â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const LEVEL_COLORS: Record<number, string> = {
  1: "#e8c06a",
  2: "#7eb8f7",
  3: "#a78bfa",
};
const FOOD_COLOR = "#6ee7b7";
const SCREEN_H   = Dimensions.get("window").height;
const ATTR_EMOJI: Record<string, string> = {
  museo: "\u{1F3DB}\u{FE0F}",
  chiesa: "\u{26EA}",
  parco: "\u{1F33F}",
  piazza: "\u{1F3DF}\u{FE0F}",
  archeologia: "\u{2692}\u{FE0F}",
  monumento: "\u{1F5FF}",
  quartiere: "\u{1F3D8}\u{FE0F}",
  panorama: "\u{1F305}",
  mercato: "\u{1F6D2}",
  palazzo: "\u{1F3F0}",
  basilica: "\u{26EA}",
  cattedrale: "\u{26EA}",
  abbazia: "\u{26EA}",
  convento: "\u{26EA}",
  monastero: "\u{26EA}",
  cappella: "\u{26EA}",
  santuario: "\u{26EA}",
  sinagoga: "\u{1F54D}",
  moschea: "\u{1F54C}",
  tempio: "\u{1F6D5}",
  castello: "\u{1F3F0}",
  fortezza: "\u{1F3EF}",
  torre: "\u{1F5FC}",
  ponte: "\u{1F309}",
  fontana: "\u{26F2}",
  villa: "\u{1F3E1}",
  anfiteatro: "\u{1F3DF}\u{FE0F}",
  statua: "\u{1F5FF}",
  arco: "\u{1F3DB}\u{FE0F}",
  obelisco: "\u{1F5FF}",
  mausoleo: "\u{1F3DB}\u{FE0F}",
  teatro: "\u{1F3AD}",
  opera: "\u{1F3AD}",
  auditorium: "\u{1F3AD}",
  galleria: "\u{1F5BC}\u{FE0F}",
  arte: "\u{1F3A8}",
  biblioteca: "\u{1F4DA}",
  giardino: "\u{1F338}",
  orto: "\u{1F331}",
  lago: "\u{1F3DE}\u{FE0F}",
  spiaggia: "\u{1F3D6}\u{FE0F}",
  costa: "\u{1F30A}",
  fiordo: "\u{1F30A}",
  collina: "\u{26F0}\u{FE0F}",
  montagna: "\u{1F3D4}\u{FE0F}",
  viale: "\u{1F333}",
  strada: "\u{1F6E4}\u{FE0F}",
  passeggiata: "\u{1F6B6}",
  porto: "\u{2693}",
  stazione: "\u{1F689}",
  terme: "\u{2668}\u{FE0F}",
  acquario: "\u{1F420}",
  zoo: "\u{1F981}",
  stadio: "\u{1F3DF}\u{FE0F}",
  belvedere: "\u{1F305}",
  miradouro: "\u{1F305}",
  murales: "\u{1F3A8}",
  attrazione: "\u{1F4CC}",
};

function attrEmoji(type?: string | null): string {
  const key = (type ?? "").toLowerCase();
  if (ATTR_EMOJI[key]) return ATTR_EMOJI[key];
  const match = Object.keys(ATTR_EMOJI).find((k) => k.length >= 4 && key.includes(k));
  return match ? ATTR_EMOJI[match] : "\u{1F4CC}";
}

// â”€â”€ Stato pannello inferiore â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type PanelMode = "list" | "detail" | "food-insert";

interface FilterState {
  levels: number[];   // livelli visibili: sottoinsieme di [1,2,3]
  food: boolean;      // marker cibo visibili
}

const ALL_FILTERS: FilterState = { levels: [1, 2, 3], food: true };

// â”€â”€ HTML Leaflet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function buildMapHtml(
  attractions: BuilderAttraction[],
  foodSpots: BuilderAttraction[],
  isDark: boolean,
): string {
  const tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  const mapBg = "#dfe8ec";

  const allPoints = [...attractions, ...foodSpots];
  const lats = allPoints.map((a) => a.latitude);
  const lngs = allPoints.map((a) => a.longitude);
  const centerLat = lats.length ? lats.reduce((a, b) => a + b, 0) / lats.length : 48;
  const centerLng = lngs.length ? lngs.reduce((a, b) => a + b, 0) / lngs.length : 13;

  const attrJson = JSON.stringify(
    attractions.map((a) => ({ id: a.id, lat: a.latitude, lng: a.longitude, level: a.category_level })),
  );
  const foodJson = JSON.stringify(
    foodSpots.map((f) => ({ id: f.id, lat: f.latitude, lng: f.longitude })),
  );

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:${mapBg};font-family:-apple-system,sans-serif;overflow:hidden}
#map{width:100%;height:100%}
.leaflet-container{background:${mapBg}!important}
.leaflet-control-attribution{background:rgba(255,255,255,.9)!important;color:#4b5563!important;font-size:9px!important;padding:2px 5px!important}
.leaflet-control-attribution a{color:#2563eb!important}
.leaflet-marker-icon,.leaflet-marker-shadow{border:none!important;background:transparent!important}
.mk-wrap{
  display:flex;flex-direction:column;align-items:center;
  transform:translateX(-50%) translateY(-100%);
  cursor:pointer;
}
.mk-bubble{
  min-width:26px;height:26px;border-radius:13px;border:2px solid;
  display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:800;color:#fff;padding:0 5px;
  box-shadow:0 2px 8px rgba(0,0,0,0.5);
  transition:transform 0.12s;
}
.mk-bubble.sel{transform:scale(1.3)}
.mk-bubble.foc{transform:scale(1.65)!important;border-width:3px!important;border-color:#fff!important;box-shadow:0 0 0 3px rgba(255,255,255,0.3),0 4px 14px rgba(0,0,0,0.8)!important}
.mk-pin{width:2px;height:5px;margin-top:-1px}
</style>
</head>
<body>
<div id="map"></div>
<script>
const ATTRS=${attrJson};
const FOODS=${foodJson};
const LC={1:'#e8c06a',2:'#7eb8f7',3:'#a78bfa'};
const FC='${FOOD_COLOR}';

const map=L.map('map',{
  center:[${centerLat},${centerLng}],zoom:14,
  zoomControl:false,attributionControl:true,
  minZoom:3,maxZoom:19
});
L.tileLayer('${tileUrl}',{subdomains:'abcd',maxZoom:20,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'}).addTo(map);

const AM={},FM={};
let routeLine=null;
var _selAIds=[],_selFIds=[],_focId=null,_focFood=false;

function mkIcon(color,label,sel,isFood,foc){
  const bg=sel?color:'rgba(10,10,26,0.72)';
  const content=isFood?'\u{1F374}':(sel&&label?label:'·');
  const cls='mk-bubble'+(sel?' sel':'')+(foc?' foc':'');
  return L.divIcon({
    html:'<div class="mk-wrap"><div class="'+cls+'" style="border-color:'+color+';background:'+bg+'">'+content+'</div><div class="mk-pin" style="background:'+color+'"></div></div>',
    className:'',iconSize:[0,0],iconAnchor:[0,0]
  });
}

function sendMsg(payload){
  var s=JSON.stringify(payload);
  try{
    if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(s);}
    else if(window.parent&&window.parent!==window){window.parent.postMessage(s,'*');}
  }catch(e){}
}

ATTRS.forEach(function(a){
  const color=LC[a.level]||'#e8c06a';
  const mk=L.marker([a.lat,a.lng],{icon:mkIcon(color,'',false,false),interactive:true,zIndexOffset:0});
  mk.on('click',function(e){
    L.DomEvent.stopPropagation(e);
    sendMsg({type:'tapA',id:a.id});
  });
  mk.addTo(map);
  AM[a.id]=mk;
});

FOODS.forEach(function(f){
  const mk=L.marker([f.lat,f.lng],{icon:mkIcon(FC,'',false,true),interactive:true,zIndexOffset:0});
  mk.on('click',function(e){
    L.DomEvent.stopPropagation(e);
    sendMsg({type:'tapF',id:f.id});
  });
  mk.addTo(map);
  FM[f.id]=mk;
});

function _applyStyles(){
  ATTRS.forEach(function(a){
    var c=LC[a.level]||'#e8c06a',si=_selAIds.indexOf(a.id),sel=si>=0,foc=!_focFood&&a.id===_focId;
    AM[a.id].setIcon(mkIcon(c,sel?String(si+1):'',sel,false,foc));
    AM[a.id].setZIndexOffset(foc?2000:(sel?1000:0));
  });
  FOODS.forEach(function(f){
    var sel=_selFIds.indexOf(f.id)>=0,foc=_focFood&&f.id===_focId;
    FM[f.id].setIcon(mkIcon(FC,'',sel,true,foc));
    FM[f.id].setZIndexOffset(foc?2000:(sel?900:0));
  });
}
function focusMarker(id,isFood){
  _focId=id;_focFood=!!isFood;
  _applyStyles();
  var mk=isFood?FM[id]:AM[id];
  if(id!=null&&mk){map.flyTo(mk.getLatLng(),Math.max(map.getZoom(),15),{animate:true,duration:0.4});}
}
function updateState(selAIds,routeCoords,selFIds){
  _selAIds=selAIds;_selFIds=selFIds;
  _applyStyles();
  if(routeLine){map.removeLayer(routeLine);routeLine=null;}
  if(routeCoords.length>=2){
    routeLine=L.polyline(routeCoords,{color:'#e8c06a',weight:2.5,opacity:0.8,dashArray:'6,10'}).addTo(map);
  }
}

/* â”€â”€ Filtro marker â”€â”€ */
function setFilter(levels, showFood) {
  ATTRS.forEach(function(a){
    try {
      var el = AM[a.id] && AM[a.id].getElement ? AM[a.id].getElement() : null;
      if (el) el.style.display = (levels.indexOf(a.level) >= 0) ? '' : 'none';
    } catch(e) {}
  });
  FOODS.forEach(function(f){
    try {
      var el = FM[f.id] && FM[f.id].getElement ? FM[f.id].getElement() : null;
      if (el) el.style.display = showFood ? '' : 'none';
    } catch(e) {}
  });
}

sendMsg({type:'ready'});
</script>
</body>
</html>`;
}

// â”€â”€ Componente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function builderMapHelp(lang: string) {
  const tx = (values: Record<string, string>) => localText(lang, values);
  const item = (icon: ContextHelpContent["icon"], title: Record<string, string>, body: Record<string, string>): ContextHelpContent => ({ icon, title: tx(title), body: tx(body) });
  return {
    close: item("close-circle-outline", { it: "Chiudi la mappa", en: "Close the map", fr: "Fermer la carte", es: "Cerrar el mapa" }, { it: "Torna alla composizione manuale conservando le tappe già inserite.", en: "Return to the manual builder while keeping the stops already added.", fr: "Revenez à la création manuelle en conservant les étapes déjà ajoutées.", es: "Vuelve a la creación manual conservando las paradas ya añadidas." }),
    map: item("map-outline", { it: "Mappa delle tappe", en: "Stops map", fr: "Carte des étapes", es: "Mapa de paradas" }, { it: "Esplora attrazioni e ristoranti. Tocca un indicatore per leggere i dettagli e aggiungerlo al giorno selezionato.", en: "Explore attractions and restaurants. Tap a marker to view its details and add it to the selected day.", fr: "Explorez les attractions et les restaurants. Touchez un repère pour afficher ses détails et l’ajouter au jour sélectionné.", es: "Explora atracciones y restaurantes. Toca un marcador para ver sus detalles y añadirlo al día seleccionado." }),
    panel: item("list-outline", { it: "Tappe del giorno", en: "Day stops", fr: "Étapes du jour", es: "Paradas del día" }, { it: "Il pannello mostra le tappe già scelte. Da qui puoi aprirne i dettagli, rimuoverle o controllarne l’ordine.", en: "This panel shows the selected stops. Open details, remove stops, or check their order here.", fr: "Ce panneau affiche les étapes choisies. Vous pouvez ouvrir leurs détails, les retirer ou vérifier leur ordre.", es: "Este panel muestra las paradas elegidas. Aquí puedes abrir sus detalles, eliminarlas o comprobar su orden." }),
  };
}

export function BuilderMap({
  visible, onClose, lang, dayLabel,
  attractions, foodSpots, currentSlots,
  onAddAttraction, onAddFood, onRemove, onReorder,
}: Props) {
  const { colors, isDark } = useTheme();
  const contextHelp = useContextHelpController();
  const mapHelp = builderMapHelp(lang);
  const insets = useSafeAreaInsets();
  const wvRef  = useRef<WebView>(null);

  const [ready,          setReady]          = useState(false);
  const [mapHtml,        setMapHtml]        = useState("");
  const [mapError,       setMapError]       = useState(false);
  const [mapReloadKey,   setMapReloadKey]   = useState(0);
  const [panelMode,      setPanelMode]      = useState<PanelMode>("list");
  const [preview,        setPreview]        = useState<BuilderAttraction | null>(null);
  const [previewKind,    setPreviewKind]    = useState<"attraction" | "meal" | null>(null);
  const [filter,         setFilter]         = useState<FilterState>(ALL_FILTERS);
  const [focusedAttrId,  setFocusedAttrId]  = useState<number | null>(null);
  const [focusedIsFood,  setFocusedIsFood]  = useState(false);

  const panelFadeA = useRef(new Animated.Value(1)).current;

  const switchPanel = useCallback((mode: PanelMode, cb?: () => void) => {
    Animated.timing(panelFadeA, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setPanelMode(mode);
      cb?.();
      Animated.timing(panelFadeA, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  }, [panelFadeA]);

  // Apre il modal: ricostruisce HTML e resetta tutto
  useEffect(() => {
    if (visible) {
      setReady(false);
      setMapError(false);
      setPanelMode("list");
      setPreview(null);
      setPreviewKind(null);
      setFilter(ALL_FILTERS);
      setFocusedAttrId(null);
      setFocusedIsFood(false);
      setMapHtml(buildMapHtml(attractions, foodSpots, isDark));
      panelFadeA.setValue(1); // reset fade nel caso il modal fosse stato chiuso durante un'animazione
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timeout: se Leaflet non risponde in 15s (es. offline) mostra errore
  useEffect(() => {
    if (!mapHtml || ready || mapError) return;
    const t = setTimeout(() => setMapError(true), 15_000);
    return () => clearTimeout(t);
  }, [mapHtml, ready, mapError]);

  // Sincronizza i marker selezionati
  useEffect(() => {
    if (!ready) return;
    const selAIds     = currentSlots.filter((s) => s.kind === "attraction").map((s) => s.attraction.id);
    const routeCoords = currentSlots.filter((s) => s.kind === "attraction")
      .map((s) => [s.attraction.latitude, s.attraction.longitude]);
    const selFIds     = currentSlots.filter((s) => s.kind === "meal").map((s) => s.attraction.id);
    wvRef.current?.injectJavaScript(
      `updateState(${JSON.stringify(selAIds)},${JSON.stringify(routeCoords)},${JSON.stringify(selFIds)});true;`,
    );
  }, [currentSlots, ready]);

  // Applica i filtri via JS quando cambiano
  useEffect(() => {
    if (!ready) return;
    wvRef.current?.injectJavaScript(
      `setFilter(${JSON.stringify(filter.levels)},${filter.food});true;`,
    );
  }, [filter, ready]);

  // Sincronizza il marker evidenziato
  useEffect(() => {
    if (!ready) return;
    wvRef.current?.injectJavaScript(
      `focusMarker(${focusedAttrId !== null ? focusedAttrId : "null"},${focusedIsFood});true;`,
    );
  }, [focusedAttrId, focusedIsFood, ready]);

  // â”€â”€ Messaggi dalla WebView â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === "ready") { setReady(true); return; }

        if (msg.type === "tapA") {
          const a = attractions.find((x) => x.id === msg.id);
          if (!a) return;
          setFocusedAttrId(msg.id);
          setFocusedIsFood(false);
          switchPanel("detail", () => {
            setPreview(a);
            setPreviewKind("attraction");
          });
        }

        if (msg.type === "tapF") {
          const f = foodSpots.find((x) => x.id === msg.id);
          if (!f) return;
          setFocusedAttrId(msg.id);
          setFocusedIsFood(true);
          switchPanel("detail", () => {
            setPreview(f);
            setPreviewKind("meal");
          });
        }
      } catch { /* ignore */ }
    },
    [attractions, foodSpots, switchPanel],
  );

  // â”€â”€ Azioni dal pannello â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleAdd = () => {
    if (!preview || !previewKind) return;
    if (previewKind === "attraction") {
      onAddAttraction(preview);
      switchPanel("list", () => setPreview(null));
    } else {
      // food
      if (currentSlots.length === 0) {
        onAddFood(preview, null);
        switchPanel("list", () => setPreview(null));
      } else {
        switchPanel("food-insert");
      }
    }
  };

  const handleRemove = () => {
    if (!preview || !previewKind) return;
    const kind = previewKind === "attraction" ? "attraction" : "meal";
    const ex   = currentSlots.find((s) => s.kind === kind && s.attraction.id === preview.id);
    if (ex) onRemove(ex.slotId);
    switchPanel("list", () => setPreview(null));
  };

  const insertFood = (afterSlotId: string | null) => {
    if (!preview) return;
    onAddFood(preview, afterSlotId);
    switchPanel("list", () => setPreview(null));
  };

  const backToList = () => {
    setFocusedAttrId(null);
    setFocusedIsFood(false);
    switchPanel("list", () => {
      setPreview(null);
      setPreviewKind(null);
    });
  };

  // â”€â”€ Riordino slot â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const ids = currentSlots.map((s) => s.slotId);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    onReorder(ids);
  };

  const moveDown = (idx: number) => {
    if (idx >= currentSlots.length - 1) return;
    const ids = currentSlots.map((s) => s.slotId);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    onReorder(ids);
  };

  // â”€â”€ Helper display â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const slotEmoji = (s: MapSlot) => {
    if (s.kind === "meal") return "\u{1F374}";
    return attrEmoji(s.attraction.attraction_type);
  };
  const slotName = (s: MapSlot) =>
    localizedName(s.attraction, lang);
  const attrOrder = (idx: number) =>
    currentSlots.slice(0, idx + 1).filter((s) => s.kind === "attraction").length;

  const previewName = preview
    ? localizedName(preview, lang)
    : "";
  const previewDesc = preview
    ? localizedDescription(preview, lang)
    : "";
  const previewEmoji = preview
    ? (previewKind === "meal" ? "\u{1F374}" : attrEmoji(preview.attraction_type))
    : "";
  const previewColor = preview && previewKind === "attraction"
    ? (LEVEL_COLORS[preview.category_level] ?? colors.accentGold)
    : FOOD_COLOR;

  const isAlreadyAdded = !!preview && (previewKind === "attraction"
    ? currentSlots.some((s) => s.kind === "attraction" && s.attraction.id === preview.id)
    : currentSlots.some((s) => s.kind === "meal"       && s.attraction.id === preview.id));

  // â”€â”€ Filtri â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const toggleLevel = (lvl: number) => {
    setFilter((prev) => {
      const next = prev.levels.includes(lvl)
        ? prev.levels.filter((l) => l !== lvl)
        : [...prev.levels, lvl];
      return { ...prev, levels: next };
    });
  };
  const toggleFood = () => setFilter((prev) => ({ ...prev, food: !prev.food }));

  const FILTER_CHIPS = [
    { id: 1,      label: lang === "es" ? "Iconica" : lang === "fr" ? "Iconique" : lang === "en" ? "Iconic" : "Iconica",  color: LEVEL_COLORS[1], onPress: () => toggleLevel(1), active: filter.levels.includes(1) },
    { id: 2,      label: lang === "es" ? "Seleccionada" : lang === "fr" ? "Recherch\u00e9e" : lang === "en" ? "Curated" : "Ricercata",color: LEVEL_COLORS[2], onPress: () => toggleLevel(2), active: filter.levels.includes(2) },
    { id: 3,      label: lang === "es" ? "Oculta" : lang === "fr" ? "Cach\u00e9e" : lang === "en" ? "Hidden" : "Nascosta", color: LEVEL_COLORS[3], onPress: () => toggleLevel(3), active: filter.levels.includes(3) },
    { id: "food", label: lang === "es" ? "Cocina" : lang === "fr" ? "Cuisine" : lang === "en" ? "Food" : "Cibo", color: FOOD_COLOR, onPress: toggleFood, active: filter.food },
  ] as const;

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>

        {/* â”€â”€ Header â”€â”€ */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {lang === "es" ? "Seleccionar en el mapa" : lang === "fr" ? "S\u00e9lectionner sur la carte" : lang === "en" ? "Select on map" : "Seleziona sulla mappa"}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>{dayLabel}</Text>
          </View>
          <TouchableOpacity
            onPress={contextHelp.guard(mapHelp.close, onClose)}
            style={[styles.closeBtn, { backgroundColor: colors.card2 }]}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={contextHelp.toggle}
            style={[styles.closeBtn, { backgroundColor: contextHelp.active ? colors.accentGold : colors.card2 }, contextHelpOutline(contextHelp.active, colors.accentGold)]}
            activeOpacity={0.7}
          >
            <Ionicons name={contextHelp.active ? "help" : "help-outline"} size={20} color={contextHelp.active ? colors.bg : colors.accentGold} />
          </TouchableOpacity>
        </View>

        {/* â”€â”€ Mappa + chip filtri sovrapposti â”€â”€ */}
        <View style={styles.mapWrap}>
          <WebView
            key={mapReloadKey}
            ref={wvRef}
            source={{ html: mapHtml, baseUrl: "https://unpkg.com" }}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            onMessage={handleMessage}
            onError={() => setMapError(true)}
            style={[styles.webview, { backgroundColor: colors.bg }]}
            scrollEnabled={false}
            bounces={false}
            overScrollMode="never"
          />
          {!ready && !mapError && (
            <MapStatusOverlay status="loading" lang={lang} />
          )}
          {mapError && (
            <MapStatusOverlay
              status="error"
              lang={lang}
              onRetry={() => {
                setMapError(false);
                setReady(false);
                setMapReloadKey((value) => value + 1);
                setMapHtml(buildMapHtml(attractions, foodSpots, isDark));
              }}
            />
          )}

          {/* â”€â”€ Chip filtri (floating) â”€â”€ */}
          {ready && (
            <View style={styles.filterRow} pointerEvents="box-none">
              {FILTER_CHIPS.map((chip) => (
                <TouchableOpacity
                  key={String(chip.id)}
                  onPress={chip.onPress}
                  activeOpacity={0.8}
                  style={[
                    styles.filterChip,
                    chip.active
                      ? { backgroundColor: chip.color, borderColor: chip.color }
                      : { backgroundColor: colors.bg + "ee", borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.filterChipText, { color: chip.active ? "#fff" : colors.textMuted }]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {contextHelp.active && (
            <TouchableOpacity style={styles.guideOverlay} activeOpacity={1} onPress={() => contextHelp.explain(mapHelp.map)} />
          )}
        </View>

        {/* â”€â”€ Pannello inferiore â”€â”€ */}
        <View style={[styles.panel, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Animated.View style={[styles.panelInner, { opacity: panelFadeA }]}>

          {/* â”€â”€ MODE: dettaglio tappa â”€â”€ */}
          {panelMode === "detail" && preview && (
            <>
              {/* Testa pannello: back + titolo */}
              <View style={styles.panelHeader}>
                <TouchableOpacity onPress={backToList} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="arrow-back" size={20} color={colors.textMuted} />
                </TouchableOpacity>
                <Text style={[styles.panelTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                  {lang === "es" ? "Detalles de la parada" : lang === "fr" ? "D\u00e9tails de l\u2019\u00e9tape" : lang === "en" ? "Stop details" : "Dettagli tappa"}
                </Text>
              </View>

              <ScrollView contentContainerStyle={styles.detailBody} showsVerticalScrollIndicator={false}>
                {/* Nome + emoji + badge livello */}
                <View style={styles.detailNameRow}>
                  <Text style={styles.detailEmoji}>{previewEmoji}</Text>
                  <View style={styles.detailNameWrap}>
                    <Text style={[styles.detailName, { color: colors.text }]}>{previewName}</Text>
                    {previewKind === "attraction" && (
                      <View style={[styles.levelBadge, { backgroundColor: previewColor + "22" }]}>
                        <Text style={[styles.levelBadgeText, { color: previewColor }]}>
                          {preview.category_level === 1
                            ? (lang === "es" ? "Iconica" : lang === "fr" ? "Iconique" : lang === "en" ? "Iconic" : "Iconica")
                            : preview.category_level === 2
                              ? (lang === "es" ? "Seleccionada" : lang === "fr" ? "Sélectionnée" : lang === "en" ? "Curated" : "Ricercata")
                              : (lang === "es" ? "Oculta" : lang === "fr" ? "Cachee" : lang === "en" ? "Hidden" : "Nascosta")}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Meta: durata visita */}
                {!!preview.estimated_visit_time && (
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={14} color={colors.textSub} />
                    <Text style={[styles.metaText, { color: colors.textSub }]}>
                      {preview.estimated_visit_time} min
                    </Text>
                  </View>
                )}

                {/* Descrizione */}
                {!!previewDesc && (
                  <Text style={[styles.detailDesc, { color: colors.textSub }]}>{previewDesc}</Text>
                )}

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* CTA */}
                {isAlreadyAdded ? (
                  <TouchableOpacity
                    style={[styles.ctaRemove, { borderColor: colors.danger + "55", backgroundColor: colors.danger + "10" }]}
                    onPress={handleRemove}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={[styles.ctaText, { color: colors.danger }]}>
                      {lang === "es" ? "Eliminar del día" : lang === "fr" ? "Retirer de la journée" : lang === "en" ? "Remove from day" : "Rimuovi dalla giornata"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.ctaAdd, { backgroundColor: previewColor }]}
                    onPress={handleAdd}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#fff" />
                    <Text style={[styles.ctaText, { color: "#fff" }]}>
                      {lang === "es" ? "Añadir al día" : lang === "fr" ? "Ajouter à la journée" : lang === "en" ? "Add to day" : "Aggiungi alla giornata"}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </>
          )}

          {/* â”€â”€ MODE: inserimento posizione food â”€â”€ */}
          {panelMode === "food-insert" && preview && (
            <>
              <View style={styles.panelHeader}>
                <TouchableOpacity onPress={() => switchPanel("detail")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="arrow-back" size={20} color={colors.textMuted} />
                </TouchableOpacity>
                <Ionicons name="restaurant-outline" size={15} color={FOOD_COLOR} />
                <Text style={[styles.panelTitle, { color: colors.text }]} numberOfLines={1}>
                  {lang === "es" ? "Insertar después de..." : lang === "fr" ? "Insérer après..." : lang === "en" ? "Insert after..." : "Inserisci dopo..."}
                </Text>
              </View>
              <Text style={[styles.pendingFoodName, { color: FOOD_COLOR }]} numberOfLines={1}>
                {"\u{1F374}"} {previewName}
              </Text>
              <ScrollView contentContainerStyle={styles.insertList} showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.insertRow, { borderColor: colors.border, backgroundColor: colors.card2 }]}
                  onPress={() => insertFood(null)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-up-outline" size={14} color={colors.textSub} />
                  <Text style={[styles.insertLabel, { color: colors.textSub }]}>
                    {lang === "es" ? "Al principio" : lang === "fr" ? "Au début" : lang === "en" ? "At the beginning" : "All'inizio"}
                  </Text>
                </TouchableOpacity>
                {currentSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot.slotId}
                    style={[styles.insertRow, { borderColor: colors.border, backgroundColor: colors.card2 }]}
                    onPress={() => insertFood(slot.slotId)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.insertEmoji}>{slotEmoji(slot)}</Text>
                    <Text style={[styles.insertLabel, { color: colors.textSub }]} numberOfLines={1}>
                      {lang === "es" ? "Después de" : lang === "fr" ? "Après" : lang === "en" ? "After" : "Dopo"} {slotName(slot)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* â”€â”€ MODE: lista tappe giornata â”€â”€ */}
          {panelMode === "list" && (
            <>
              <View style={styles.panelHeader}>
                <Text style={[styles.panelTitle, { color: colors.text }]}>
                  {currentSlots.length === 0
                    ? (lang === "es" ? "Toca un marcador para ver los detalles" : lang === "fr" ? "Touchez un marqueur pour voir les détails" : lang === "en" ? "Tap a marker to see details" : "Tocca un marker per i dettagli")
                    : `${currentSlots.length} ${lang === "es"
                        ? `parada${currentSlots.length !== 1 ? "s" : ""}`
                        : lang === "fr"
                        ? `etape${currentSlots.length !== 1 ? "s" : ""}`
                        : lang === "en"
                          ? `stop${currentSlots.length !== 1 ? "s" : ""}`
                          : `tapp${currentSlots.length !== 1 ? "e" : "a"}`}`}
                </Text>
              </View>

              {currentSlots.length === 0 ? (
                <View style={styles.emptyPanel}>
                  <Ionicons name="map-outline" size={36} color={colors.border} />
                  <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                    {lang === "fr"
                      ? "Touchez un marqueur pour voir les détails et ajouter une étape.\nLes marqueurs verts sont des restaurants."
                      : lang === "es"
                        ? "Toca un marcador para ver los detalles y añadir una parada.\nLos marcadores verdes son restaurantes."
                      : lang === "en"
                        ? "Tap a marker to view details and add a stop.\nGreen markers are food spots."
                        : "Tocca un marker per vedere i dettagli e aggiungere la tappa.\nI marker verdi sono ristoranti."}
                  </Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={styles.stopList} showsVerticalScrollIndicator={false}>
                  {currentSlots.map((slot, idx) => {
                    const color = slot.kind === "meal"
                      ? FOOD_COLOR
                      : (LEVEL_COLORS[slot.attraction.category_level] ?? colors.accentGold);
                    const label = slot.kind === "attraction" ? String(attrOrder(idx)) : "\u{1F374}";
                    const isFocused = focusedAttrId === slot.attraction.id;
                    return (
                      <TouchableOpacity
                        key={slot.slotId}
                        activeOpacity={0.75}
                        onPress={() => {
                          setFocusedAttrId(slot.attraction.id);
                          setFocusedIsFood(slot.kind === "meal");
                          switchPanel("detail", () => {
                            setPreview(slot.attraction);
                            setPreviewKind(slot.kind === "meal" ? "meal" : "attraction");
                          });
                        }}
                        style={[
                          styles.stopRow,
                          { borderColor: colors.border, backgroundColor: colors.card2 },
                          isFocused && { borderColor: color, backgroundColor: color + "18" },
                        ]}
                      >
                        <View style={[styles.badge, { backgroundColor: color }]}>
                          <Text style={styles.badgeText}>{label}</Text>
                        </View>
                        <Text style={[styles.stopName, { color: colors.text }]} numberOfLines={1}>
                          {slotName(slot)}
                        </Text>
                        <View style={styles.rowActions}>
                          <TouchableOpacity
                            onPress={() => moveUp(idx)}
                            disabled={idx === 0}
                            style={{ opacity: idx === 0 ? 0.2 : 1 }}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Ionicons name="chevron-up" size={16} color={colors.textMuted} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => moveDown(idx)}
                            disabled={idx === currentSlots.length - 1}
                            style={{ opacity: idx === currentSlots.length - 1 ? 0.2 : 1 }}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => onRemove(slot.slotId)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Ionicons name="trash-outline" size={15} color={colors.danger} />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </>
          )}

          </Animated.View>
          {contextHelp.active && (
            <TouchableOpacity style={styles.guideOverlay} activeOpacity={1} onPress={() => contextHelp.explain(mapHelp.panel)} />
          )}
        </View>
        <ContextHelpUI controller={contextHelp} lang={lang} />
      </View>
    </Modal>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PANEL_H = Math.round(SCREEN_H * 0.40);

const styles = StyleSheet.create({
  root: { flex: 1 },
  guideOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 30 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerText:  { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSub:   { fontSize: 12, marginTop: 1 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    marginLeft: 10,
  },

  // â”€â”€ Mappa + filtri â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  mapWrap:      { flex: 1 },
  webview:      { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  mapErrorTitle: { fontSize: 16, fontWeight: "700", marginTop: 14, textAlign: "center" },
  mapErrorBody:  { fontSize: 13, textAlign: "center", lineHeight: 18, marginTop: 6, paddingHorizontal: 32 },
  mapRetryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  mapRetryText: { fontSize: 14, fontWeight: "700" },

  filterRow: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // â”€â”€ Pannello â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  panel:      { height: PANEL_H, borderTopWidth: 1 },
  panelInner: { flex: 1 },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  panelTitle: { fontSize: 14, fontWeight: "700", flex: 1 },

  // â”€â”€ Detail panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  detailBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  detailNameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  detailEmoji:    { fontSize: 28, lineHeight: 34 },
  detailNameWrap: { flex: 1, gap: 4 },
  detailName:     { fontSize: 16, fontWeight: "700", lineHeight: 21 },
  levelBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelBadgeText: { fontSize: 11, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 13 },
  detailDesc: { fontSize: 13, lineHeight: 18 },
  divider:    { height: 1, marginVertical: 4 },

  ctaAdd: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 13,
  },
  ctaRemove: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
  },
  ctaText: { fontSize: 15, fontWeight: "800" },

  // â”€â”€ Food insert â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  pendingFoodName: { fontSize: 13, fontWeight: "600", paddingHorizontal: 14, marginBottom: 6 },
  insertList: { paddingHorizontal: 12, paddingBottom: 12, gap: 6 },
  insertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  insertEmoji: { fontSize: 15 },
  insertLabel: { fontSize: 13, flex: 1 },

  // â”€â”€ Stop list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  emptyPanel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyHint:  { fontSize: 13, textAlign: "center", lineHeight: 19 },
  stopList:   { paddingHorizontal: 12, paddingBottom: 12, gap: 6 },
  stopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  badge: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  badgeText:  { fontSize: 10, fontWeight: "800", color: "#fff" },
  stopName:   { flex: 1, fontSize: 13, fontWeight: "600" },
  rowActions: { flexDirection: "row", alignItems: "center", gap: 6 },
});
