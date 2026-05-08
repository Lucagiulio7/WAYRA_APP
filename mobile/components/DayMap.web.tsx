import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ItineraryDay } from "@/types";
import { BuilderAttraction } from "@/hooks/useAttractions";

interface Props {
  visible: boolean;
  onClose: () => void;
  day: ItineraryDay;
  allAttractions: BuilderAttraction[];
  assignedMap: Map<number, number>;
  lang: string;
  accent: string;
  onAddAttraction?: (attractionId: number) => void;
  onMoveAttraction?: (attractionId: number, fromDay: number) => void;
  onRemoveAttraction?: (attractionId: number) => void;
  allDays?: ItineraryDay[];
  onDayChange?: (dayNumber: number) => void;
}

const DAY_ACCENTS = ["#e8c06a", "#7eb8f7", "#a78bfa", "#6ee7b7", "#f97316"];

// ── Escape HTML ───────────────────────────────────────────────────────────────

function esc(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── buildHtml — stessa versione full-featured del file nativo ─────────────────

function buildHtml(
  day: ItineraryDay,
  allAttractions: BuilderAttraction[],
  assignedMap: Map<number, number>,
  lang: string,
  accent: string,
): string {
  const isEn = lang === "en";

  const validCoords = (lat: unknown, lon: unknown): boolean =>
    typeof lat === "number" && isFinite(lat) &&
    typeof lon === "number" && isFinite(lon);

  const dayStops = day.stops
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

  const unassigned = allAttractions
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

  const L = {
    dayLabel:       isEn ? "Day" : "Giorno",
    minsLabel:      "min",
    explLabel:      isEn ? "Not in itinerary" : "Non nell'itinerario",
    mapsLabel:      isEn ? "Open in Maps ↗" : "Apri in Maps ↗",
    addLabel:       isEn ? `＋ Add to Day ${day.day}` : `＋ Aggiungi al Giorno ${day.day}`,
    moveLabel:      isEn ? `↗ Move to Day ${day.day}` : `↗ Sposta al Giorno ${day.day}`,
    removeLabel:    isEn ? `✕ Remove from Day ${day.day}` : `✕ Rimuovi dal Giorno ${day.day}`,
    filterAll:      isEn ? "All" : "Tutti",
    filterIconic:   isEn ? "Iconic" : "Iconico",
    filterCurated:  isEn ? "Curated" : "Ricercato",
    filterHidden:   isEn ? "Hidden" : "Nascosto",
    distFromRoute:  isEn ? "from today's stops" : "dalle tappe di oggi",
    rulerLabel:     isEn ? "Measure distance" : "Misura distanza",
  };

  const stopsJson      = JSON.stringify(dayStops);
  const otherDayJson   = JSON.stringify(otherDay);
  const unassignedJson = JSON.stringify(unassigned);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=5.0,user-scalable=yes"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0a0a1a;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
#map{width:100%;height:100%}
.leaflet-container{background:#0a0a1a!important}
.leaflet-popup-content-wrapper{background:#161625;border:1px solid #2a2a42;border-radius:14px;box-shadow:0 4px 24px rgba(0,0,0,.6);color:#f0f0f0}
.leaflet-popup-tip{background:#161625}
.leaflet-popup-content{margin:12px 14px;min-width:170px;max-width:230px}
.leaflet-popup-close-button{color:#555!important;top:8px!important;right:10px!important;font-size:18px!important}
.pop-badge{display:inline-block;font-size:10px;font-weight:700;padding:2px 9px;border-radius:8px;margin-bottom:7px}
.pop-badge-day{color:${accent};background:${accent}22;border:1px solid ${accent}55}
.pop-badge-expl{color:#6ee7b7;background:#6ee7b722;border:1px solid #6ee7b755}
.pop-name{font-size:13px;font-weight:700;color:#f0f0f0;margin-bottom:3px;line-height:1.3}
.pop-type{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
.pop-desc{font-size:11px;color:#aaa;line-height:1.5;margin-bottom:5px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}
.pop-meta{font-size:10px;color:#555;margin-bottom:5px}
.pop-maps{display:block;text-align:center;margin-top:8px;font-size:11px;font-weight:700;color:#7eb8f7;background:#7eb8f714;border:1px solid #7eb8f740;border-radius:8px;padding:6px;cursor:pointer;text-decoration:none;width:100%;font-family:inherit}
.pop-add{display:block;text-align:center;margin-top:6px;font-size:11px;font-weight:700;color:#6ee7b7;background:#6ee7b714;border:1px solid #6ee7b750;border-radius:8px;padding:6px;cursor:pointer;width:100%;font-family:inherit}
.pop-move{display:block;text-align:center;margin-top:6px;font-size:11px;font-weight:700;color:#e8c06a;background:#e8c06a14;border:1px solid #e8c06a50;border-radius:8px;padding:6px;cursor:pointer;width:100%;font-family:inherit}
.pop-remove{display:block;text-align:center;margin-top:6px;font-size:11px;font-weight:700;color:#f97316;background:#f9731614;border:1px solid #f9731650;border-radius:8px;padding:6px;cursor:pointer;width:100%;font-family:inherit}
.stop-circle{width:30px;height:30px;border-radius:50%;background:${accent};border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#0f0f1e;box-shadow:0 2px 10px rgba(0,0,0,.55);line-height:1}
.other-circle{width:26px;height:26px;border-radius:50%;background:#7eb8f7;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#0f0f1e;box-shadow:0 2px 8px rgba(0,0,0,.5);line-height:1;opacity:.9}
.unass-dot{width:24px;height:24px;border-radius:50%;background:#1a1a2e;border:1.5px solid #3a3a5a;display:flex;align-items:center;justify-content:center;font-size:13px;opacity:.85;box-shadow:0 1px 4px rgba(0,0,0,.4);line-height:1}
.pop-dist{font-size:10px;color:#7eb8f7;margin-top:3px;margin-bottom:2px}
#ruler-btn{position:absolute;top:12px;right:12px;z-index:1000;width:38px;height:38px;border-radius:10px;background:rgba(12,12,26,.92);border:1px solid #2a2a42;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:17px;color:#aaa;font-family:inherit;outline:none;padding:0}
.dist-label{background:rgba(12,12,26,.92);border:1px solid #7eb8f755;border-radius:8px;padding:4px 10px;font-size:12px;font-weight:700;color:#7eb8f7;white-space:nowrap;pointer-events:none;transform:translateX(-50%) translateY(-50%)}
#filter-bar{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);z-index:1000;display:flex;gap:4px;background:rgba(12,12,26,.92);border:1px solid #2a2a42;border-radius:999px;padding:5px 8px;backdrop-filter:blur(6px)}
.filter-btn{border:none;border-radius:999px;outline:none;padding:5px 13px;font-size:11px;font-weight:700;letter-spacing:.3px;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,sans-serif;transition:background .15s,color .15s}
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
window.onerror = function(msg, src, line, col, err) {
  sendMessage({type: 'error', message: String(msg)});
  return true;
};

try {

const DAY_STOPS    = ${stopsJson};
const OTHER_DAY    = ${otherDayJson};
const UNASSIGNED   = ${unassignedJson};
const ACCENT       = ${JSON.stringify(accent)};
const DAY_NUM      = ${day.day};
const DAY_LABEL    = ${JSON.stringify(L.dayLabel)};
const MINS_LABEL   = ${JSON.stringify(L.minsLabel)};
const EXPL_LABEL   = ${JSON.stringify(L.explLabel)};
const MAPS_LABEL   = ${JSON.stringify(L.mapsLabel)};
const ADD_LABEL    = ${JSON.stringify(L.addLabel)};
const MOVE_LABEL   = ${JSON.stringify(L.moveLabel)};
const REMOVE_LABEL = ${JSON.stringify(L.removeLabel)};
const FILTER_ALL     = ${JSON.stringify(L.filterAll)};
const FILTER_ICONIC  = ${JSON.stringify(L.filterIconic)};
const FILTER_CURATED = ${JSON.stringify(L.filterCurated)};
const FILTER_HIDDEN  = ${JSON.stringify(L.filterHidden)};
const DIST_FROM_ROUTE = ${JSON.stringify(L.distFromRoute)};
const RULER_LABEL    = ${JSON.stringify(L.rulerLabel)};
const LEVEL_COLORS   = {1:'#e8c06a', 2:'#7eb8f7', 3:'#a78bfa'};

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
function mapsUrl(lat,lon,name){ return 'https://www.google.com/maps/search/'+encodeURIComponent(name)+'/@'+lat+','+lon+',17z'; }
function hKm(lat1,lon1,lat2,lon2){
  var R=6371,f1=lat1*Math.PI/180,f2=lat2*Math.PI/180;
  var df=(lat2-lat1)*Math.PI/180,dl=(lon2-lon1)*Math.PI/180;
  var a=Math.sin(df/2)*Math.sin(df/2)+Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)*Math.sin(dl/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function wKm(lat1,lon1,lat2,lon2){
  var km=hKm(lat1,lon1,lat2,lon2);
  return km>2?km*1.1:km>1?km*1.15:km>0.5?km*1.3:km>0.3?km*1.4:km*1.5;
}
function fDist(km){ return km<1?Math.round(km*1000)+' m':km.toFixed(1)+' km'; }
function nearestDayDist(lat,lon){
  if(!DAY_STOPS.length) return null;
  var best=Infinity;
  DAY_STOPS.forEach(function(s){ var k=wKm(lat,lon,s.lat,s.lon); if(k<best) best=k; });
  return best;
}

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
});

var unassLayers = {};
var currentFilter = 0;
function setFilter(level) {
  currentFilter = level;
  [1,2,3].forEach(function(lv){
    if (level === 0 || level === lv) { if (!map.hasLayer(unassLayers[lv])) unassLayers[lv].addTo(map); }
    else { if (map.hasLayer(unassLayers[lv])) map.removeLayer(unassLayers[lv]); }
  });
  document.querySelectorAll('.filter-btn').forEach(function(b){
    var lv = parseInt(b.dataset.level || '0');
    var active = lv === level;
    b.style.background = active ? (LEVEL_COLORS[lv] || 'rgba(240,240,240,0.15)') : 'transparent';
    b.style.color = active ? '#0f0f1e' : '#666';
  });
}

var measureStart = null;
var measureLayer = null;
function toggleMeasure(){
  measureStart = null;
  if(measureLayer) measureLayer.clearLayers();
  var btn = document.getElementById('ruler-btn');
  if(!btn) return;
  var active = btn.dataset.active !== '1';
  btn.dataset.active = active ? '1' : '0';
  btn.style.borderColor = active ? '#7eb8f7' : '#2a2a42';
  btn.style.background  = active ? 'rgba(126,184,247,0.2)' : 'rgba(12,12,26,0.92)';
  btn.style.color       = active ? '#7eb8f7' : '#aaa';
}

function mapsButton(url){ return '<button type="button" class="pop-maps" data-action="maps" data-url="'+url.replace(/"/g,'&quot;')+'">'+MAPS_LABEL+'</button>'; }
function addButton(id)  { return '<button type="button" class="pop-add"  data-action="add"  data-id="'+id+'">'+ADD_LABEL+'</button>'; }
function moveButton(id,from){ return '<button type="button" class="pop-move" data-action="move" data-id="'+id+'" data-from="'+from+'">'+MOVE_LABEL+'</button>'; }
function removeButton(id){ return '<button type="button" class="pop-remove" data-action="remove" data-id="'+id+'">'+REMOVE_LABEL+'</button>'; }

var map = L.map('map',{zoomControl:false,attributionControl:false,minZoom:12,maxZoom:19});
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:20}).addTo(map);
measureLayer = L.layerGroup().addTo(map);

[1,2,3].forEach(function(lv){ unassLayers[lv] = L.layerGroup(); });
UNASSIGNED.forEach(function(a){
  var lv=a.level||1, lc=LEVEL_COLORS[lv]||'#3a3a5a';
  var icon=L.divIcon({html:'<div class="unass-dot" style="border-color:'+lc+'">'+typeEmoji(a.type)+'</div>',className:'',iconSize:[24,24],iconAnchor:[12,12],popupAnchor:[0,-14]});
  var url=mapsUrl(a.lat,a.lon,a.name);
  var nd=nearestDayDist(a.lat,a.lon);
  var popup='<div class="pop-badge pop-badge-expl">'+EXPL_LABEL+'</div>'+
    '<div class="pop-name">'+a.name+'</div>'+
    (a.type?'<div class="pop-type">'+a.type+'</div>':'')+
    (nd!==null?'<div class="pop-dist">🚶 ~'+fDist(nd)+' '+DIST_FROM_ROUTE+'</div>':'')+
    (a.desc?'<div class="pop-desc">'+a.desc+'</div>':'')+
    (a.mins?'<div class="pop-meta">~'+a.mins+' '+MINS_LABEL+'</div>':'')+
    addButton(a.id)+mapsButton(url);
  L.marker([a.lat,a.lon],{icon:icon,zIndexOffset:100}).bindPopup(popup,{maxWidth:250}).addTo(unassLayers[lv]);
});
[1,2,3].forEach(function(lv){ unassLayers[lv].addTo(map); });

(function(){
  var bar=document.createElement('div'); bar.id='filter-bar';
  [{level:0,label:FILTER_ALL,color:'rgba(240,240,240,0.15)'},{level:1,label:FILTER_ICONIC,color:LEVEL_COLORS[1]},{level:2,label:FILTER_CURATED,color:LEVEL_COLORS[2]},{level:3,label:FILTER_HIDDEN,color:LEVEL_COLORS[3]}]
  .forEach(function(f){
    var btn=document.createElement('button'); btn.className='filter-btn'; btn.textContent=f.label;
    btn.dataset.action='filter'; btn.dataset.level=f.level;
    btn.style.background=f.level===0?f.color:'transparent'; btn.style.color=f.level===0?'#f0f0f0':'#666';
    bar.appendChild(btn);
  });
  document.getElementById('map').appendChild(bar);
})();

(function(){
  var btn=document.createElement('button'); btn.id='ruler-btn'; btn.innerHTML='📏';
  btn.title=RULER_LABEL; btn.dataset.action='ruler'; btn.dataset.active='0';
  document.getElementById('map').appendChild(btn);
})();

map.on('click', function(e){
  var btn=document.getElementById('ruler-btn');
  if(!btn||btn.dataset.active!=='1') return;
  var tgt=e.originalEvent&&e.originalEvent.target;
  if(tgt&&tgt.closest&&(tgt.closest('#filter-bar')||tgt.closest('#ruler-btn'))) return;
  var ll=e.latlng;
  if(!measureStart){
    measureLayer.clearLayers(); measureStart=ll;
    L.circleMarker(ll,{radius:7,color:'#7eb8f7',fillColor:'#7eb8f7',fillOpacity:.9,weight:2}).addTo(measureLayer);
  } else {
    var p1=measureStart,p2=ll;
    L.circleMarker(p2,{radius:7,color:'#7eb8f7',fillColor:'#7eb8f7',fillOpacity:.9,weight:2}).addTo(measureLayer);
    L.polyline([p1,p2],{color:'#7eb8f7',weight:2.5,dashArray:'7,5',opacity:.9}).addTo(measureLayer);
    var km=wKm(p1.lat,p1.lng,p2.lat,p2.lng);
    var mid=L.latLng((p1.lat+p2.lat)/2,(p1.lng+p2.lng)/2);
    L.marker(mid,{icon:L.divIcon({html:'<div class="dist-label">~'+fDist(km)+'</div>',className:'',iconAnchor:[0,0]}),interactive:false,zIndexOffset:2000}).addTo(measureLayer);
    measureStart=null;
  }
});

OTHER_DAY.forEach(function(s){
  var icon=L.divIcon({html:'<div class="other-circle">'+s.dayNum+'</div>',className:'',iconSize:[26,26],iconAnchor:[13,13],popupAnchor:[0,-15]});
  var url=mapsUrl(s.lat,s.lon,s.name);
  var nd2=nearestDayDist(s.lat,s.lon);
  var popup='<div class="pop-badge pop-badge-day">'+DAY_LABEL+' '+s.dayNum+'</div>'+
    '<div class="pop-name">'+s.name+'</div>'+
    (s.type?'<div class="pop-type">'+s.type+'</div>':'')+
    (nd2!==null?'<div class="pop-dist">🚶 ~'+fDist(nd2)+' '+DIST_FROM_ROUTE+'</div>':'')+
    (s.desc?'<div class="pop-desc">'+s.desc+'</div>':'')+
    (s.mins?'<div class="pop-meta">~'+s.mins+' '+MINS_LABEL+'</div>':'')+
    moveButton(s.id,s.dayNum)+mapsButton(url);
  L.marker([s.lat,s.lon],{icon:icon,zIndexOffset:200}).bindPopup(popup,{maxWidth:250}).addTo(map);
});

if(DAY_STOPS.length>1){
  L.polyline(DAY_STOPS.map(function(s){return[s.lat,s.lon];}),{color:ACCENT,weight:2.5,dashArray:'8,8',opacity:.85}).addTo(map);
}
DAY_STOPS.forEach(function(s){
  var icon=L.divIcon({html:'<div class="stop-circle">'+s.idx+'</div>',className:'',iconSize:[30,30],iconAnchor:[15,15],popupAnchor:[0,-17]});
  var url=mapsUrl(s.lat,s.lon,s.name);
  var popup='<div class="pop-name">'+s.name+'</div>'+
    (s.type?'<div class="pop-type">'+s.type+'</div>':'')+
    (s.desc?'<div class="pop-desc">'+s.desc+'</div>':'')+
    (s.mins?'<div class="pop-meta">~'+s.mins+' '+MINS_LABEL+'</div>':'')+
    removeButton(s.id)+mapsButton(url);
  L.marker([s.lat,s.lon],{icon:icon,zIndexOffset:1000}).bindPopup(popup,{maxWidth:250}).addTo(map);
});

setTimeout(function(){
  map.invalidateSize();
  if(DAY_STOPS.length>0){
    map.fitBounds(L.latLngBounds(DAY_STOPS.map(function(s){return[s.lat,s.lon];})),{padding:[55,55],maxZoom:16});
  } else {
    var all=[].concat(OTHER_DAY).concat(UNASSIGNED).filter(function(a){return a.lat&&a.lon;});
    if(all.length>0) map.fitBounds(L.latLngBounds(all.map(function(a){return[a.lat,a.lon];})),{padding:[40,40]});
    else map.setView([48,13],4);
  }
  sendMessage({type:'ready'});
}, 350);

} catch(err) {
  sendMessage({type:'error', message: String(err && err.message ? err.message : err)});
}
</script>
</body>
</html>`;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function DayMap({
  visible, onClose, day, allAttractions, assignedMap, lang, accent,
  onAddAttraction, onMoveAttraction, onRemoveAttraction,
  allDays, onDayChange,
}: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const insets = useSafeAreaInsets();

  const html = useMemo(
    () => buildHtml(day, allAttractions, assignedMap, lang, accent),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [day.day, day.stops.length, assignedMap.size, allAttractions.length, lang, accent],
  );

  useEffect(() => {
    if (visible) setStatus("loading");
  }, [visible, html]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "ready")    setStatus("ready");
        if (msg.type === "error")    setStatus("error");
        if (msg.type === "openMaps") Linking.openURL(msg.url).catch(() => {});
        if (msg.type === "addAttraction"    && onAddAttraction)    onAddAttraction(msg.id);
        if (msg.type === "moveAttraction"   && onMoveAttraction)   onMoveAttraction(msg.id, msg.fromDay);
        if (msg.type === "removeAttraction" && onRemoveAttraction) onRemoveAttraction(msg.id);
      } catch { /* ignore */ }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onAddAttraction, onMoveAttraction, onRemoveAttraction]);

  const isEn = lang === "en";

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

        {/* Header con day picker */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color="#888" />
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
                  <TouchableOpacity
                    key={d.day}
                    onPress={() => onDayChange(d.day)}
                    style={[styles.dayPill, active && { borderColor: da, backgroundColor: da + "22" }]}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.dayPillText, { color: active ? da : "#666" }]}>
                      {isEn ? `Day ${d.day}` : `Giorno ${d.day}`}
                    </Text>
                  </TouchableOpacity>
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
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: accent }]} />
            <Text style={styles.legendLabel}>{isEn ? "Today's stops" : "Tappe di oggi"}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#7eb8f7" }]} />
            <Text style={styles.legendLabel}>{isEn ? "Other days" : "Altri giorni"}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#3a3a5a", borderWidth: 1, borderColor: "#5a5a7a" }]} />
            <Text style={styles.legendLabel}>{isEn ? "Explore" : "Da esplorare"}</Text>
          </View>
        </View>

        {/* Mappa */}
        <View style={styles.mapWrap}>
          <iframe
            srcDoc={html}
            style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#0a0a1a" } as any}
            sandbox="allow-scripts allow-same-origin"
          />

          {status === "loading" && (
            <View style={styles.overlay}>
              <ActivityIndicator color={accent} size="large" />
              <Text style={styles.overlayText}>{isEn ? "Loading map…" : "Caricamento mappa…"}</Text>
            </View>
          )}
          {status === "error" && (
            <View style={styles.overlay}>
              <Ionicons name="wifi-outline" size={44} color="#444" />
              <Text style={styles.overlayText}>
                {isEn ? "Internet connection required for the map" : "Connessione internet necessaria per la mappa"}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.retryBtn} activeOpacity={0.8}>
                <Text style={styles.retryText}>{isEn ? "Close" : "Chiudi"}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f0f1e" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e30",
  },
  title: { fontSize: 20, fontWeight: "800", letterSpacing: 1, flex: 1 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#161625",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  dayPickerScroll: { flex: 1 },
  dayPickerContent: { gap: 6, paddingHorizontal: 2, alignItems: "center" },
  dayPill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1.5,
    borderColor: "#2a2a42", backgroundColor: "#161625",
  },
  dayPillText: { fontSize: 12, fontWeight: "700" },
  legend: {
    flexDirection: "row", gap: 16,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#1a1a2a",
    flexWrap: "wrap",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11, color: "#888", fontWeight: "600" },
  mapWrap: { flex: 1, position: "relative" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0f0f1e",
    alignItems: "center", justifyContent: "center",
    gap: 16, paddingHorizontal: 40,
  },
  overlayText: { color: "#555", fontSize: 14, textAlign: "center", lineHeight: 20 },
  retryBtn: {
    marginTop: 8, backgroundColor: "#1e1e30",
    borderWidth: 1, borderColor: "#2a2a42",
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24,
  },
  retryText: { color: "#888", fontSize: 14, fontWeight: "600" },
});
