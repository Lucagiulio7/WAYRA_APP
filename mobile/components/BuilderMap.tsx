import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { BuilderAttraction } from "@/hooks/useAttractions";

// ── Tipo condiviso con create-itinerary ───────────────────────────────────────

export interface MapSlot {
  slotId: string;
  kind: "attraction" | "meal";
  attraction: BuilderAttraction;
}

// ── Props ─────────────────────────────────────────────────────────────────────

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

// ── Costanti ──────────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<number, string> = {
  1: "#e8c06a",
  2: "#7eb8f7",
  3: "#a78bfa",
};
const FOOD_COLOR = "#6ee7b7";

const ATTR_EMOJI: Record<string, string> = {
  // Già presenti
  museo: "🏛️", chiesa: "⛪", parco: "🌿", piazza: "🏟️",
  archeologia: "⚱️", monumento: "🗿", quartiere: "🏘️",
  panorama: "🌅", mercato: "🛒", palazzo: "🏰",
  // Edifici religiosi
  basilica: "⛪", cattedrale: "⛪", abbazia: "⛪", convento: "⛪",
  monastero: "⛪", cappella: "⛪", santuario: "⛪",
  sinagoga: "🕍", moschea: "🕌", tempio: "🛕",
  // Strutture e monumenti
  castello: "🏰", fortezza: "🏯", torre: "🗼",
  ponte: "🌉", fontana: "⛲", villa: "🏡",
  anfiteatro: "🏟️", statua: "🗿", arco: "🏛️",
  obelisco: "🗿", mausoleo: "🏛️",
  // Arte e cultura
  teatro: "🎭", opera: "🎭", auditorium: "🎭",
  galleria: "🖼️", arte: "🎨", biblioteca: "📚",
  // Natura e outdoor
  giardino: "🌸", orto: "🌱", lago: "🏞️",
  spiaggia: "🏖️", costa: "🌊", fiordo: "🌊",
  collina: "⛰️", montagna: "🏔️",
  // Strade e percorsi
  viale: "🌳", strada: "🛤️", passeggiata: "🚶",
  // Infrastrutture
  porto: "⚓", stazione: "🚉", terme: "♨️",
  acquario: "🐠", zoo: "🦁", stadio: "🏟️",
  // Belvedere / punti panoramici
  belvedere: "🌅", miradouro: "🌅",
  // Murales e arte di strada
  murales: "🎨",
  // Attrazione generica (esplicita)
  attrazione: "📌",
};

function attrEmoji(type?: string | null): string {
  const key = (type ?? "").toLowerCase();
  if (ATTR_EMOJI[key]) return ATTR_EMOJI[key];
  const match = Object.keys(ATTR_EMOJI).find((k) => k.length >= 4 && key.includes(k));
  return match ? ATTR_EMOJI[match] : "📍";
}

// ── Stato pannello inferiore ──────────────────────────────────────────────────

type PanelMode = "list" | "detail" | "food-insert";

interface FilterState {
  levels: number[];   // livelli visibili: sottoinsieme di [1,2,3]
  food: boolean;      // marker cibo visibili
}

const ALL_FILTERS: FilterState = { levels: [1, 2, 3], food: true };

// ── HTML Leaflet ──────────────────────────────────────────────────────────────

function buildMapHtml(
  attractions: BuilderAttraction[],
  foodSpots: BuilderAttraction[],
  isDark: boolean,
): string {
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
  const mapBg = isDark ? "#0a0a1a" : "#f0eff0";

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
  zoomControl:false,attributionControl:false,
  minZoom:3,maxZoom:19
});
L.tileLayer('${tileUrl}',{subdomains:'abcd',maxZoom:20}).addTo(map);

const AM={},FM={};
let routeLine=null;
var _selAIds=[],_selFIds=[],_focId=null,_focFood=false;

function mkIcon(color,label,sel,isFood,foc){
  const bg=sel?color:'rgba(10,10,26,0.72)';
  const content=isFood?'🍴':(sel&&label?label:'·');
  const cls='mk-bubble'+(sel?' sel':'')+(foc?' foc':'');
  return L.divIcon({
    html:'<div class="mk-wrap"><div class="'+cls+'" style="border-color:'+color+';background:'+bg+'">'+content+'</div><div class="mk-pin" style="background:'+color+'"></div></div>',
    className:'',iconSize:[0,0],iconAnchor:[0,0]
  });
}

ATTRS.forEach(function(a){
  const color=LC[a.level]||'#e8c06a';
  const mk=L.marker([a.lat,a.lng],{icon:mkIcon(color,'',false,false),interactive:true,zIndexOffset:0});
  mk.on('click',function(e){
    L.DomEvent.stopPropagation(e);
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'tapA',id:a.id}));
  });
  mk.addTo(map);
  AM[a.id]=mk;
});

FOODS.forEach(function(f){
  const mk=L.marker([f.lat,f.lng],{icon:mkIcon(FC,'',false,true),interactive:true,zIndexOffset:0});
  mk.on('click',function(e){
    L.DomEvent.stopPropagation(e);
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'tapF',id:f.id}));
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

/* ── Filtro marker ── */
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

window.ReactNativeWebView.postMessage(JSON.stringify({type:'ready'}));
</script>
</body>
</html>`;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function BuilderMap({
  visible, onClose, lang, dayLabel,
  attractions, foodSpots, currentSlots,
  onAddAttraction, onAddFood, onRemove, onReorder,
}: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const panelH = Math.round(screenH * 0.40);
  const wvRef      = useRef<WebView>(null);
  const panelFadeA = useRef(new Animated.Value(1)).current;

  const [ready,          setReady]          = useState(false);
  const [mapHtml,        setMapHtml]        = useState("");
  const [mapError,       setMapError]       = useState(false);
  const [panelMode,      setPanelMode]      = useState<PanelMode>("list");
  const [preview,        setPreview]        = useState<BuilderAttraction | null>(null);
  const [previewKind,    setPreviewKind]    = useState<"attraction" | "meal" | null>(null);
  const [filter,         setFilter]         = useState<FilterState>(ALL_FILTERS);
  const [focusedAttrId,  setFocusedAttrId]  = useState<number | null>(null);
  const [focusedIsFood,  setFocusedIsFood]  = useState(false);

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

  // ── Transizione pannello con fade ────────────────────────────────────────

  const switchPanel = useCallback((mode: PanelMode, cb?: () => void) => {
    Animated.timing(panelFadeA, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setPanelMode(mode);
      cb?.();
      Animated.timing(panelFadeA, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  }, [panelFadeA]);

  // ── Messaggi dalla WebView ────────────────────────────────────────────────

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
          switchPanel("detail", () => { setPreview(a); setPreviewKind("attraction"); });
        }

        if (msg.type === "tapF") {
          const f = foodSpots.find((x) => x.id === msg.id);
          if (!f) return;
          setFocusedAttrId(msg.id);
          setFocusedIsFood(true);
          switchPanel("detail", () => { setPreview(f); setPreviewKind("meal"); });
        }
      } catch { /* ignore */ }
    },
    [attractions, foodSpots, switchPanel],
  );

  // ── Azioni dal pannello ───────────────────────────────────────────────────

  const handleAdd = () => {
    if (!preview || !previewKind) return;
    if (previewKind === "attraction") {
      const snap = preview;
      onAddAttraction(snap);
      switchPanel("list", () => setPreview(null));
    } else {
      if (currentSlots.length === 0) {
        const snap = preview;
        onAddFood(snap, null);
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
    const snap = preview;
    onAddFood(snap, afterSlotId);
    switchPanel("list", () => setPreview(null));
  };

  const backToList = () => {
    setFocusedAttrId(null);
    setFocusedIsFood(false);
    switchPanel("list", () => { setPreview(null); setPreviewKind(null); });
  };

  // ── Riordino slot ─────────────────────────────────────────────────────────

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

  // ── Helper display ────────────────────────────────────────────────────────

  const slotEmoji = (s: MapSlot) => {
    if (s.kind === "meal") return "🍴";
    return attrEmoji(s.attraction.attraction_type);
  };
  const slotName = (s: MapSlot) =>
    (lang === "en" && s.attraction.name_en) ? s.attraction.name_en : s.attraction.name;
  const attrOrder = (idx: number) =>
    currentSlots.slice(0, idx + 1).filter((s) => s.kind === "attraction").length;

  const previewName = preview
    ? ((lang === "en" && preview.name_en) ? preview.name_en : preview.name)
    : "";
  const previewDesc = preview
    ? ((lang === "en" && preview.description_en) ? preview.description_en : preview.description) ?? ""
    : "";
  const previewEmoji = preview
    ? (previewKind === "meal" ? "🍴" : attrEmoji(preview.attraction_type))
    : "";
  const previewColor = preview && previewKind === "attraction"
    ? (LEVEL_COLORS[preview.category_level] ?? colors.accentGold)
    : FOOD_COLOR;

  const isAlreadyAdded = !!preview && (previewKind === "attraction"
    ? currentSlots.some((s) => s.kind === "attraction" && s.attraction.id === preview.id)
    : currentSlots.some((s) => s.kind === "meal"       && s.attraction.id === preview.id));

  // ── Filtri ────────────────────────────────────────────────────────────────

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
    { id: 1,      label: lang === "en" ? "Iconic"   : "Iconica",  color: LEVEL_COLORS[1], onPress: () => toggleLevel(1), active: filter.levels.includes(1) },
    { id: 2,      label: lang === "en" ? "Curated"  : "Ricercata",color: LEVEL_COLORS[2], onPress: () => toggleLevel(2), active: filter.levels.includes(2) },
    { id: 3,      label: lang === "en" ? "Hidden"   : "Nascosta", color: LEVEL_COLORS[3], onPress: () => toggleLevel(3), active: filter.levels.includes(3) },
    { id: "food", label: lang === "en" ? "Food"     : "Cibo",     color: FOOD_COLOR,      onPress: toggleFood,            active: filter.food               },
  ] as const;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>

        {/* ── Header ── */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {lang === "en" ? "Select on map" : "Seleziona sulla mappa"}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>{dayLabel}</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.card2 }]}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Mappa + chip filtri sovrapposti ── */}
        <View style={styles.mapWrap}>
          <WebView
            ref={wvRef}
            source={{ html: mapHtml, baseUrl: "https://unpkg.com" }}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            allowUniversalAccessFromFileURLs
            onMessage={handleMessage}
            onError={() => setMapError(true)}
            style={[styles.webview, { backgroundColor: colors.bg }]}
            scrollEnabled={false}
            bounces={false}
            overScrollMode="never"
          />
          {!ready && !mapError && (
            <View style={[styles.loadingOverlay, { backgroundColor: colors.bg }]}>
              <ActivityIndicator color={colors.accentGold} size="large" />
            </View>
          )}
          {mapError && (
            <View style={[styles.loadingOverlay, { backgroundColor: colors.bg }]}>
              <Ionicons name="wifi-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.mapErrorTitle, { color: colors.text }]}>
                {lang === "en" ? "Map unavailable" : "Mappa non disponibile"}
              </Text>
              <Text style={[styles.mapErrorBody, { color: colors.textMuted }]}>
                {lang === "en"
                  ? "Check your internet connection and try again."
                  : "Controlla la connessione internet e riprova."}
              </Text>
              <TouchableOpacity
                style={[styles.mapRetryBtn, { backgroundColor: colors.accentGold }]}
                onPress={() => {
                  setMapError(false);
                  setReady(false);
                  setMapHtml(buildMapHtml(attractions, foodSpots, isDark));
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh-outline" size={16} color={colors.bg} />
                <Text style={[styles.mapRetryText, { color: colors.bg }]}>
                  {lang === "en" ? "Retry" : "Riprova"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Chip filtri (floating) ── */}
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
        </View>

        {/* ── Pannello inferiore ── */}
        <View style={[styles.panel, { height: panelH, backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Animated.View style={[styles.panelInner, { opacity: panelFadeA }]}>

          {/* ── MODE: dettaglio tappa ── */}
          {panelMode === "detail" && preview && (
            <>
              {/* Testa pannello: back + titolo */}
              <View style={styles.panelHeader}>
                <TouchableOpacity onPress={backToList} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="arrow-back" size={20} color={colors.textMuted} />
                </TouchableOpacity>
                <Text style={[styles.panelTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                  {lang === "en" ? "Stop details" : "Dettagli tappa"}
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
                            ? (lang === "en" ? "Iconic"   : "Iconica")
                            : preview.category_level === 2
                              ? (lang === "en" ? "Curated" : "Ricercata")
                              : (lang === "en" ? "Hidden"  : "Nascosta")}
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
                      {lang === "en" ? "Remove from day" : "Rimuovi dalla giornata"}
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
                      {lang === "en" ? "Add to day" : "Aggiungi alla giornata"}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </>
          )}

          {/* ── MODE: inserimento posizione food ── */}
          {panelMode === "food-insert" && preview && (
            <>
              <View style={styles.panelHeader}>
                <TouchableOpacity onPress={() => switchPanel("detail")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="arrow-back" size={20} color={colors.textMuted} />
                </TouchableOpacity>
                <Ionicons name="restaurant-outline" size={15} color={FOOD_COLOR} />
                <Text style={[styles.panelTitle, { color: colors.text }]} numberOfLines={1}>
                  {lang === "en" ? "Insert after…" : "Inserisci dopo…"}
                </Text>
              </View>
              <Text style={[styles.pendingFoodName, { color: FOOD_COLOR }]} numberOfLines={1}>
                🍴 {previewName}
              </Text>
              <ScrollView contentContainerStyle={styles.insertList} showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.insertRow, { borderColor: colors.border, backgroundColor: colors.card2 }]}
                  onPress={() => insertFood(null)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-up-outline" size={14} color={colors.textSub} />
                  <Text style={[styles.insertLabel, { color: colors.textSub }]}>
                    {lang === "en" ? "At the beginning" : "All'inizio"}
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
                      {lang === "en" ? "After" : "Dopo"} {slotName(slot)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* ── MODE: lista tappe giornata ── */}
          {panelMode === "list" && (
            <>
              <View style={styles.panelHeader}>
                <Text style={[styles.panelTitle, { color: colors.text }]}>
                  {currentSlots.length === 0
                    ? (lang === "en" ? "Tap a marker to see details" : "Tocca un marker per i dettagli")
                    : `${currentSlots.length} ${lang === "en"
                        ? `stop${currentSlots.length !== 1 ? "s" : ""}`
                        : `tapp${currentSlots.length !== 1 ? "e" : "a"}`}`}
                </Text>
              </View>

              {currentSlots.length === 0 ? (
                <View style={styles.emptyPanel}>
                  <Ionicons name="map-outline" size={36} color={colors.border} />
                  <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                    {lang === "en"
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
                    const label = slot.kind === "attraction" ? String(attrOrder(idx)) : "🍴";
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
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
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

  // ── Mappa + filtri ──────────────────────────────────────────────────────────
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

  // ── Pannello ────────────────────────────────────────────────────────────────
  panel: { borderTopWidth: 1 },  // height è dinamica via inline style (useWindowDimensions)
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

  // ── Detail panel ────────────────────────────────────────────────────────────
  detailBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  detailNameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  detailEmoji:   { fontSize: 28, lineHeight: 34 },
  detailNameWrap: { flex: 1, gap: 4 },
  detailName:    { fontSize: 16, fontWeight: "700", lineHeight: 21 },
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

  // ── Food insert ─────────────────────────────────────────────────────────────
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

  // ── Stop list ───────────────────────────────────────────────────────────────
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
