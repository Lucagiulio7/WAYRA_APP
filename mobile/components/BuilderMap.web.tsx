import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
const SCREEN_H = Dimensions.get("window").height;

const ATTR_EMOJI: Record<string, string> = {
  museo: "🏛️", chiesa: "⛪", parco: "🌿", piazza: "🏟️",
  archeologia: "⚱️", monumento: "🗿", quartiere: "🏘️",
  panorama: "🌅", mercato: "🛒", palazzo: "🏰",
};

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

function mkIcon(color,label,sel,isFood){
  const bg=sel?color:'rgba(10,10,26,0.72)';
  const content=isFood?'🍴':(sel&&label?label:'·');
  return L.divIcon({
    html:'<div class="mk-wrap"><div class="mk-bubble'+(sel?' sel':'')+'" style="border-color:'+color+';background:'+bg+'">'+content+'</div><div class="mk-pin" style="background:'+color+'"></div></div>',
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

function updateState(selAIds,routeCoords,selFIds){
  ATTRS.forEach(function(a){
    const color=LC[a.level]||'#e8c06a';
    const si=selAIds.indexOf(a.id);
    const sel=si>=0;
    AM[a.id].setIcon(mkIcon(color,sel?String(si+1):'',sel,false));
    AM[a.id].setZIndexOffset(sel?1000:0);
  });
  FOODS.forEach(function(f){
    const sel=selFIds.indexOf(f.id)>=0;
    FM[f.id].setIcon(mkIcon(FC,'',sel,true));
    FM[f.id].setZIndexOffset(sel?900:0);
  });
  if(routeLine){map.removeLayer(routeLine);routeLine=null;}
  if(routeCoords.length>=2){
    routeLine=L.polyline(routeCoords,{color:'#e8c06a',weight:2.5,opacity:0.8,dashArray:'6,10'}).addTo(map);
  }
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
  const wvRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [pendingFood, setPendingFood] = useState<BuilderAttraction | null>(null);
  const htmlRef = useRef("");

  // Ricostruisce l'HTML ogni volta che il modal si apre
  useEffect(() => {
    if (visible) {
      setReady(false);
      setPendingFood(null);
      htmlRef.current = buildMapHtml(attractions, foodSpots, isDark);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sincronizza lo stato dei marker via injectJavaScript
  useEffect(() => {
    if (!ready) return;
    const selAIds = currentSlots.filter((s) => s.kind === "attraction").map((s) => s.attraction.id);
    const routeCoords = currentSlots
      .filter((s) => s.kind === "attraction")
      .map((s) => [s.attraction.latitude, s.attraction.longitude]);
    const selFIds = currentSlots.filter((s) => s.kind === "meal").map((s) => s.attraction.id);
    wvRef.current?.injectJavaScript(
      `updateState(${JSON.stringify(selAIds)},${JSON.stringify(routeCoords)},${JSON.stringify(selFIds)});true;`,
    );
  }, [currentSlots, ready]);

  // Messaggi dalla WebView
  const handleMessage = useCallback(
    (event: any) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === "ready") { setReady(true); return; }

        if (msg.type === "tapA") {
          const ex = currentSlots.find((s) => s.kind === "attraction" && s.attraction.id === msg.id);
          if (ex) {
            onRemove(ex.slotId);
          } else {
            const a = attractions.find((x) => x.id === msg.id);
            if (a) onAddAttraction(a);
          }
        }

        if (msg.type === "tapF") {
          const ex = currentSlots.find((s) => s.kind === "meal" && s.attraction.id === msg.id);
          if (ex) {
            onRemove(ex.slotId);
          } else {
            const f = foodSpots.find((x) => x.id === msg.id);
            if (f) {
              if (currentSlots.length === 0) {
                onAddFood(f, null);
              } else {
                setPendingFood(f);
              }
            }
          }
        }
      } catch { /* ignore */ }
    },
    [currentSlots, attractions, foodSpots, onRemove, onAddAttraction, onAddFood],
  );

  // Riordino
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

  // Inserimento food
  const insertFood = (afterSlotId: string | null) => {
    if (!pendingFood) return;
    onAddFood(pendingFood, afterSlotId);
    setPendingFood(null);
  };

  // Helper display
  const slotEmoji = (s: MapSlot) => {
    if (s.kind === "meal") return "🍴";
    return ATTR_EMOJI[(s.attraction.attraction_type ?? "").toLowerCase()] ?? "📍";
  };

  const slotName = (s: MapSlot) =>
    (lang === "en" && s.attraction.name_en) ? s.attraction.name_en : s.attraction.name;

  const attrOrder = (idx: number) =>
    currentSlots.slice(0, idx + 1).filter((s) => s.kind === "attraction").length;

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

        {/* ── Mappa ── */}
        <View style={styles.mapWrap}>
          <WebView
            ref={wvRef}
            source={{ html: htmlRef.current, baseUrl: "https://unpkg.com" }}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            allowUniversalAccessFromFileURLs
            onMessage={handleMessage}
            style={[styles.webview, { backgroundColor: colors.bg }]}
            scrollEnabled={false}
            bounces={false}
            overScrollMode="never"
          />
          {!ready && (
            <View style={[styles.loadingOverlay, { backgroundColor: colors.bg }]}>
              <ActivityIndicator color={colors.accentGold} size="large" />
            </View>
          )}
        </View>

        {/* ── Pannello inferiore ── */}
        <View style={[styles.panel, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          {pendingFood ? (
            /* ── Picker posizione food ── */
            <>
              <View style={styles.panelHeader}>
                <Ionicons name="restaurant-outline" size={15} color={FOOD_COLOR} />
                <Text style={[styles.panelTitle, { color: colors.text }]} numberOfLines={1}>
                  {lang === "en" ? "Insert after…" : "Inserisci dopo…"}
                </Text>
                <TouchableOpacity
                  onPress={() => setPendingFood(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.pendingFoodName, { color: FOOD_COLOR }]} numberOfLines={1}>
                🍴 {slotName({ slotId: "", kind: "meal", attraction: pendingFood })}
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
          ) : (
            /* ── Lista tappe ── */
            <>
              <View style={styles.panelHeader}>
                <Text style={[styles.panelTitle, { color: colors.text }]}>
                  {currentSlots.length === 0
                    ? (lang === "en" ? "Tap attractions on the map" : "Tocca le attrazioni sulla mappa")
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
                      ? "Tap a marker to add a stop.\nGreen markers are food spots."
                      : "Tocca un marker per aggiungere una tappa.\nI marker verdi sono ristoranti."}
                  </Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={styles.stopList} showsVerticalScrollIndicator={false}>
                  {currentSlots.map((slot, idx) => {
                    const color = slot.kind === "meal"
                      ? FOOD_COLOR
                      : (LEVEL_COLORS[slot.attraction.category_level] ?? colors.accentGold);
                    const label = slot.kind === "attraction" ? String(attrOrder(idx)) : "🍴";
                    return (
                      <View
                        key={slot.slotId}
                        style={[styles.stopRow, { borderColor: colors.border, backgroundColor: colors.card2 }]}
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
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </>
          )}
        </View>

      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const PANEL_H = Math.round(SCREEN_H * 0.38);

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
  headerText: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 1 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    marginLeft: 10,
  },
  mapWrap: { flex: 1 },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  panel: { height: PANEL_H, borderTopWidth: 1 },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  panelTitle: { fontSize: 14, fontWeight: "700", flex: 1 },
  pendingFoodName: { fontSize: 13, fontWeight: "600", paddingHorizontal: 14, marginBottom: 6 },
  emptyPanel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyHint: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  stopList: { paddingHorizontal: 12, paddingBottom: 12, gap: 6 },
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
  badgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },
  stopName: { flex: 1, fontSize: 13, fontWeight: "600" },
  rowActions: { flexDirection: "row", alignItems: "center", gap: 6 },
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
});
