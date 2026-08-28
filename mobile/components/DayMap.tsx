import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
import { localizedDescription, localizedField, localizedName } from "@/utils/localization";
import { translateAttractionType } from "@/utils/attractionType";
import { localText } from "@/i18n";
import { ContextHelpUI, contextHelpOutline, useContextHelpController, type ContextHelpContent } from "./ContextHelp";
import { useTransitNetwork } from "@/hooks/useTransitNetwork";
import { transitBadgeForCity, transitModeForCity, transitPresentation, type TransitNetwork } from "@/data/transitNetworks";
import { MapStatusOverlay } from "./MapStatusOverlay";
import { openExternalLink } from "@/utils/externalLinks";

// â”€â”€ Props â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface Props {
  visible: boolean;
  onClose: () => void;
  city: string;
  day: ItineraryDay;
  allAttractions: BuilderAttraction[];
  allFoodSpots?: BuilderAttraction[];
  foodSelection?: { mealType?: string | null; origin?: { latitude: number; longitude: number; name?: string } } | null;
  /** attractionId â†’ dayNumber (per classificare layer 2 vs layer 3) */
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

function dayMapHelp(lang: string): Record<string, ContextHelpContent> {
  const tx = (values: Record<string, string>) => localText(lang, values);
  return {
    close: { icon: "close-outline", title: tx({ it: "Chiudi mappa", en: "Close map", fr: "Fermer la carte", es: "Cerrar mapa" }), body: tx({ it: "Torna all'itinerario mantenendo tutte le modifiche già effettuate.", en: "Return to the itinerary while keeping all changes.", fr: "Revenez à l'itinéraire en conservant les modifications.", es: "Vuelve al itinerario conservando los cambios." }) },
    days: { icon: "calendar-outline", title: tx({ it: "Seleziona giorno", en: "Select day", fr: "Choisir le jour", es: "Elegir día" }), body: tx({ it: "Passa alla mappa di un'altra giornata senza chiudere questa schermata.", en: "Switch to another day's map without closing this screen.", fr: "Passez à la carte d'une autre journée sans fermer cet écran.", es: "Cambia al mapa de otro día sin cerrar esta pantalla." }) },
    legend: { icon: "layers-outline", title: tx({ it: "Colori della mappa", en: "Map colors", fr: "Couleurs de la carte", es: "Colores del mapa" }), body: tx({ it: "Il colore del giorno indica le tappe odierne, il blu quelle già previste altrove e il grigio i luoghi ancora disponibili.", en: "The day color marks today's stops, blue marks stops planned on other days, and grey marks available places.", fr: "La couleur du jour indique les étapes du jour, le bleu celles des autres jours et le gris les lieux disponibles.", es: "El color del día marca las paradas de hoy, el azul las de otros días y el gris los lugares disponibles." }) },
    map: { icon: "map-outline", title: tx({ it: "Mappa interattiva", en: "Interactive map", fr: "Carte interactive", es: "Mapa interactivo" }), body: tx({ it: "Tocca un marker per leggere i dettagli e aggiungere, spostare o rimuovere una tappa. Con il filtro Cucina puoi salvare o rimuovere un ristorante per il giorno visualizzato, senza modificare il percorso a piedi.", en: "Tap a marker for details and to add, move or remove a stop. With the Food filter, you can save or remove a restaurant for the displayed day without changing the walking route.", fr: "Touchez un marqueur pour consulter les détails et ajouter, déplacer ou retirer une étape. Le filtre Cuisine permet d'enregistrer ou de retirer un restaurant pour le jour affiché sans modifier le parcours à pied.", es: "Toca un marcador para ver detalles y añadir, mover o quitar una parada. Con el filtro Cocina puedes guardar o quitar un restaurante del día mostrado sin modificar la ruta a pie." }) },
    reorder: { icon: "reorder-three-outline", title: tx({ it: "Riordina tappe", en: "Reorder stops", fr: "Réordonner les étapes", es: "Reordenar paradas" }), body: tx({ it: "Apre l'elenco del giorno: tieni premuta la maniglia e trascina una tappa nella posizione desiderata.", en: "Opens the day's list: hold the handle and drag a stop to the desired position.", fr: "Ouvre la liste du jour : maintenez la poignée puis déplacez une étape.", es: "Abre la lista del día: mantén pulsado el control y arrastra una parada." }) },
  };
}

// â”€â”€ Costruzione HTML Leaflet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function esc(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildHtml(
  day: ItineraryDay,
  city: string,
  allAttractions: BuilderAttraction[],
  allFoodSpots: BuilderAttraction[],
  foodSelection: { mealType?: string | null; origin?: { latitude: number; longitude: number; name?: string } } | null | undefined,
  assignedMap: Map<number, number>,
  lang: string,
  accent: string,
  isDark: boolean,
  transitNetwork: TransitNetwork | null,
): string {
  const isEn = lang === "en";
  const isFr = lang === "fr";
  const isEs = lang === "es";
  const labelsEs: Record<string, string> = {"La tua posizione":"Tu posición","Giorno":"Día","Già in programma":"Ya planificado","Non nell'itinerario":"Fuera del itinerario","Apri in Maps":"Abrir en Maps","Tutti":"Todos","Iconico":"Icónico","Ricercato":"Seleccionado","Nascosto":"Oculto","Cucina":"Cocina","Linee":"Líneas","A piedi ~":"A pie ~","dalle tappe di oggi":"desde las paradas de hoy","Misura distanza":"Medir distancia","Posto cibo":"Restaurante","Posto scelto":"Lugar elegido","Piatto tipico":"Plato típico","Scegli questo posto":"Elegir este lugar","Rimuovi questo posto":"Eliminar este lugar","Come arrivare con i mezzi":"Cómo llegar en transporte público","Fermata vicina":"Parada cercana","Trasporto pubblico":"Transporte público"};
  const label = (it: string, en: string, fr: string) => isEs ? (labelsEs[it] ?? en) : isFr ? fr : isEn ? en : it;

  // Colori tema per l'HTML interno
  const mapBg      = "#dfe8ec";
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
  const tileUrl    = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  // Helper: coordinate valide
  const validCoords = (lat: unknown, lon: unknown): boolean =>
    typeof lat === "number" && isFinite(lat) &&
    typeof lon === "number" && isFinite(lon);

  // â”€â”€ Layer 1: attrazioni del giorno (in ordine di percorso) â”€â”€
  const foodMode = !!foodSelection;
  const foodOrigin = foodSelection?.origin && validCoords(foodSelection.origin.latitude, foodSelection.origin.longitude)
    ? {
        lat: foodSelection.origin.latitude,
        lon: foodSelection.origin.longitude,
        name: esc(foodSelection.origin.name ?? label("La tua posizione", "Your position", "Votre position")),
      }
    : null;
  const contextStops = day.stops;

  const dayStops = contextStops
    .filter((s) => s.type === "attraction" && s.id > 0 && validCoords(s.latitude, s.longitude))
    .map((s, idx) => ({
      id: s.id,
      lat: s.latitude,
      lon: s.longitude,
      name: esc(localizedName(s, lang)),
      desc: esc(localizedDescription(s, lang)),
      type: esc(translateAttractionType(s.attraction_type, lang) ?? ""),
      mins: s.estimated_visit_time ?? 0,
      idx: idx + 1,
    }));

  const dayStopIds = new Set(dayStops.map((s) => s.id));

  // â”€â”€ Layer 2: attrazioni degli altri giorni â”€â”€
  const otherDay = allAttractions
    .filter((a) => {
      const d = assignedMap.get(a.id);
      return d !== undefined && d !== day.day && !dayStopIds.has(a.id) && validCoords(a.latitude, a.longitude);
    })
    .map((a) => ({
      id: a.id,
      lat: a.latitude,
      lon: a.longitude,
      name: esc(localizedName(a, lang)),
      desc: esc(localizedDescription(a, lang)),
      type: esc(translateAttractionType(a.attraction_type, lang) ?? ""),
      mins: a.estimated_visit_time ?? 0,
      dayNum: assignedMap.get(a.id)!,
    }));

  // â”€â”€ Layer 3: attrazioni non nell'itinerario â”€â”€
  const unassigned = foodMode ? [] : allAttractions
    .filter((a) => !assignedMap.has(a.id) && !dayStopIds.has(a.id) && validCoords(a.latitude, a.longitude))
    .map((a) => ({
      id: a.id,
      lat: a.latitude,
      lon: a.longitude,
      name: esc(localizedName(a, lang)),
      desc: esc(localizedDescription(a, lang)),
      type: esc(translateAttractionType(a.attraction_type, lang) ?? ""),
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
      const recommendedDishes = localizedField<string[]>(
        r,
        "recommended_dishes",
        lang,
        localizedField<string[]>(source, "recommended_dishes", lang, []),
      );
      return {
        id: r.id,
        lat: r.latitude,
        lon: r.longitude,
        name: esc(localizedName(r, lang)),
        desc: esc(localizedDescription(r, lang)),
        type: esc(translateAttractionType(r.food_type, lang) ?? (r.food_type ?? "")),
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
      name: esc(localizedName(a, lang)),
      desc: esc(localizedDescription(a, lang)),
      type: esc(translateAttractionType(a.food_type ?? a.attraction_type, lang) ?? ""),
      mins: a.estimated_visit_time ?? 60,
      rating: a.rating ?? null,
      recommendedDishes: localizedField<string[]>(a, "recommended_dishes", lang, []).map(esc),
      hasDishMatch: Boolean(a.has_curated_dish_match || a.recommended_dishes?.length),
    }));

  const transitMode = transitNetwork?.mode ?? transitModeForCity(city);
  const transitCopy = transitPresentation(transitMode, lang);
  const L = {
    dayLabel: label("Giorno", "Day", "Jour"),
    plannedLabel: label("Già in programma", "Already planned", "Déjà prévu"),
    minsLabel: "min",
    explLabel: label("Non nell'itinerario", "Not in itinerary", "Hors itinéraire"),
    mapsLabel: label("Apri in Maps", "Open in Maps", "Ouvrir dans Maps"),
    addLabel: label(`Aggiungi al giorno ${day.day}`, `Add to Day ${day.day}`, `Ajouter au jour ${day.day}`),
    moveLabel: label(`Sposta al giorno ${day.day}`, `Move to Day ${day.day}`, `Deplacer au jour ${day.day}`),
    removeLabel: label(`Rimuovi dal giorno ${day.day}`, `Remove from Day ${day.day}`, `Retirer du jour ${day.day}`),
    filterAll: label("Tutti", "All", "Tous"),
    filterIconic: label("Iconico", "Iconic", "Iconique"),
    filterCurated: label("Ricercato", "Curated", "Sélectionné"),
    filterHidden: label("Nascosto", "Hidden", "Caché"),
    filterFood: label("Cucina", "Food", "Cuisine"),
    transitLabel: transitCopy.label,
    stationLabel: transitCopy.station,
    linesLabel: label("Linee", "Lines", "Lignes"),
    transitDirectionsLabel: label("Come arrivare con i mezzi", "Public transport directions", "Itinéraire en transports"),
    nearbyStopLabel: label("Fermata vicina", "Nearby stop", "Arrêt à proximité"),
    publicTransitLabel: label("Trasporto pubblico", "Public transport", "Transports publics"),
    recommendedTransitLabel: isEs ? "Recomendados" : label("Consigliati", "Recommended", "Conseillés"),
    metroModeLabel: "Metro",
    tramModeLabel: label("Tram", "Tram", "Tramway"),
    trainModeLabel: label("Treno", "Train", "Train"),
    waterModeLabel: isEs ? "Ferry" : label("Traghetto", "Ferry", "Bateau"),
    walkPrefix: label("A piedi ~", "Walk ~", "À pied ~"),
    distFromRoute: label("dalle tappe di oggi", "from today's stops", "des étapes du jour"),
    rulerLabel: label("Misura distanza", "Measure distance", "Mesurer la distance"),
    foodLabel: label("Posto cibo", "Food spot", "Restaurant"),
    selectedFoodLabel: label("Posto scelto", "Chosen food spot", "Lieu choisi"),
    typicalDishLabel: label("Piatto tipico", "Typical dish", "Plat typique"),
    selectFood: label("Scegli questo posto", "Choose this place", "Choisir ce lieu"),
    removeFood: label("Rimuovi questo posto", "Remove this place", "Retirer ce lieu"),
  };

  // Serializza come JSON â€” le stringhe sono giÃ  escaped per HTML, sicure nei popup
  const stopsJson      = JSON.stringify(dayStops);
  const otherDayJson   = JSON.stringify(otherDay);
  const unassignedJson = JSON.stringify(unassigned);
  const selectedFoodJson = JSON.stringify(selectedFoodSpots);
  const foodJson       = JSON.stringify(foodSpots);
  const originJson     = JSON.stringify(foodOrigin);
  const transitJson    = JSON.stringify(transitNetwork).replace(/</g, "\\u003c");

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
.leaflet-control-attribution{background:rgba(255,255,255,.9)!important;color:#4b5563!important;font-size:9px!important;padding:2px 5px!important}
.leaflet-control-attribution a{color:#2563eb!important}

/* Popup */
.leaflet-popup-content-wrapper{
  background:${popupBg};border:1px solid ${popupBdr};border-radius:14px;
  box-shadow:0 4px 24px rgba(0,0,0,0.25);color:${popupText};
}
.leaflet-popup-tip{background:${popupBg}}
.leaflet-popup-content{box-sizing:border-box;margin:12px 14px;width:min(230px,calc(100vw - 72px))!important;min-width:0;max-width:230px;overflow:hidden}
.leaflet-popup-close-button{color:${popupMeta}!important;top:8px!important;right:10px!important;font-size:18px!important}
.pop-badge{display:inline-block;font-size:10px;font-weight:700;padding:2px 9px;border-radius:8px;margin-bottom:7px}
.pop-badge-day{color:${accent};background:${accent}22;border:1px solid ${accent}55}
.pop-badge-planned{color:#7eb8f7;background:#7eb8f722;border:1px solid #7eb8f766}
.pop-badge-expl{color:#6ee7b7;background:#6ee7b722;border:1px solid #6ee7b755}
.pop-name{font-size:13px;font-weight:700;color:${popupText};margin-bottom:3px;line-height:1.3}
.pop-name,.pop-type,.pop-desc,.pop-meta,.transit-access{max-width:100%;overflow-wrap:anywhere;word-break:break-word;white-space:normal}
.pop-type{font-size:10px;color:${popupSub};text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
.pop-desc{font-size:11px;color:${popupSub};line-height:1.5;margin-bottom:5px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}
.pop-meta{font-size:10px;color:${popupMeta};margin-bottom:5px}
.pop-maps{display:block;text-align:center;margin-top:8px;font-size:11px;font-weight:700;
  color:#7eb8f7;background:#7eb8f714;border:1px solid #7eb8f740;
  border-radius:8px;padding:6px;cursor:pointer;text-decoration:none;width:100%;font-family:inherit}
.pop-transit{display:block;text-align:center;margin-top:7px;font-size:11px;font-weight:800;color:#0891b2;background:#0891b214;border:1px solid #0891b250;border-radius:8px;padding:7px;cursor:pointer;width:100%;font-family:inherit}
.transit-access{margin-top:8px;padding:7px 8px;border-radius:8px;background:#0891b212;border:1px solid #0891b235;color:${popupSub};font-size:10px;line-height:1.35}.transit-access strong{color:#0891b2}.transit-access-lines{font-weight:900;color:${popupText}}
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

/* Layer 1 â€” tappa del giorno */
.stop-circle{
  width:30px;height:30px;border-radius:50%;
  background:${accent};border:2.5px solid #fff;
  display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:800;color:#0f0f1e;
  box-shadow:0 2px 10px rgba(0,0,0,0.55);
  line-height:1;
}

/* Layer 2 â€” altro giorno: cerchio numerato blu, speculare al layer 1 */
.other-circle{
  width:32px;height:26px;border-radius:999px;
  background:#7eb8f7;border:2px solid #fff;
  display:flex;align-items:center;justify-content:center;
  font-size:10px;font-weight:900;color:#0f0f1e;
  box-shadow:0 0 0 3px rgba(126,184,247,0.28),0 2px 8px rgba(0,0,0,0.5);
  line-height:1;opacity:0.9;
}

/* Layer 3 â€” non in itinerario */
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

/* Marker evidenziato in modalitÃ  righello */
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

/* Righello â€” bottone overlay top-right */
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

/* Filter bar â€” overlay sulla mappa */
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
.transit-toggle{position:absolute;top:12px;left:12px;z-index:1000;min-width:42px;height:38px;border-radius:10px;padding:0 11px;background:${filterBg};border:1px solid ${filterBdr};display:flex;align-items:center;justify-content:center;gap:6px;color:${inactiveC};font:800 11px -apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 3px 12px rgba(0,0,0,.16)}
.transit-toggle.active{color:${popupText};border-color:#0891b2;background:${isDark ? "rgba(8,145,178,.22)" : "rgba(207,250,254,.96)"}}
.transit-badge{display:inline-flex;align-items:center;justify-content:center;min-width:23px;height:23px;border-radius:6px;background:#0891b2;color:#fff;font-size:13px;font-weight:900}
.transit-mode-panel{position:absolute;top:56px;left:12px;z-index:1000;display:flex;flex-wrap:wrap;gap:5px;max-width:min(360px,calc(100% - 24px));padding:6px;border-radius:10px;background:${filterBg};border:1px solid ${filterBdr};box-shadow:0 3px 12px rgba(0,0,0,.16)}
.transit-mode-btn{border:1px solid ${filterBdr};border-radius:8px;padding:5px 8px;background:transparent;color:${inactiveC};font:800 10px -apple-system,BlinkMacSystemFont,sans-serif}.transit-mode-btn.active{border-color:#0891b2;background:#0891b222;color:${popupText}}
.station-lines{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;max-width:100%}.station-line{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;max-width:100%;min-width:25px;min-height:22px;height:auto;padding:4px 7px;border-radius:6px;font-size:10px;font-weight:900;line-height:1.25;text-align:center;white-space:normal;overflow-wrap:anywhere;word-break:break-word;border:1px solid rgba(0,0,0,.16)}
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
const TRANSIT      = ${transitJson};
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
const TRANSIT_LABEL    = ${JSON.stringify(L.transitLabel)};
const TRANSIT_BADGE    = ${JSON.stringify(transitNetwork?.badge ?? transitBadgeForCity(city))};
const STATION_LABEL    = ${JSON.stringify(L.stationLabel)};
const LINES_LABEL      = ${JSON.stringify(L.linesLabel)};
const TRANSIT_DIRECTIONS_LABEL = ${JSON.stringify(L.transitDirectionsLabel)};
const NEARBY_STOP_LABEL = ${JSON.stringify(L.nearbyStopLabel)};
const PUBLIC_TRANSIT_LABEL = ${JSON.stringify(L.publicTransitLabel)};
const TRANSIT_MODE_LABELS = ${JSON.stringify({ recommended: L.recommendedTransitLabel, metro: L.metroModeLabel, tram: L.tramModeLabel, train: L.trainModeLabel, water: L.waterModeLabel })};
const CITY_NAME        = ${JSON.stringify(city)};
const WALK_PREFIX      = ${JSON.stringify(L.walkPrefix)};
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
  if(t.includes('museo')||t.includes('museum')||t.includes('musee')) return '&#127963;';
  if(t.includes('parco')||t.includes('giardino')||t.includes('park')||t.includes('garden')||t.includes('parc')||t.includes('jardin')) return '&#127795;';
  if(t.includes('piazza')||t.includes('plaza')||t.includes('square')||t.includes('place')) return '&#9968;';
  if(t.includes('chiesa')||t.includes('cattedrale')||t.includes('basilica')||t.includes('church')||t.includes('cathedral')||t.includes('eglise')) return '&#9962;';
  if(t.includes('castello')||t.includes('fortezza')||t.includes('torre')||t.includes('palazzo')||t.includes('castle')||t.includes('palace')||t.includes('tour')||t.includes('palais')||t.includes('mulino')||t.includes('windmill')||t.includes('moulin')) return '&#127984;';
  if(t.includes('mercato')||t.includes('market')||t.includes('marche')) return '&#128722;';
  if(t.includes('teatro')||t.includes('opera')||t.includes('theatre')||t.includes('theater')) return '&#127917;';
  if(t.includes('panorama')||t.includes('belvedere')||t.includes('terrazza')||t.includes('viewpoint')||t.includes('point de vue')) return '&#128269;';
  if(t.includes('fontana')||t.includes('fountain')) return '&#9968;';
  if(t.includes('spiaggia')||t.includes('beach')||t.includes('plage')) return '&#127958;';
  if(t.includes('porto')||t.includes('harbour')||t.includes('marina')||t.includes('port')) return '&#9875;';
  if(t.includes('mura')||t.includes('murailles')||t.includes('walls')) return '&#128511;';
  return '&#128205;';
}

function plainText(value){
  var textarea=document.createElement('textarea');textarea.innerHTML=String(value||'');return textarea.value;
}
function mapsUrl(lat,lon,name){
  return 'https://www.google.com/maps/search/'+encodeURIComponent(plainText(name))+'/@'+lat+','+lon+',17z';
}
function transitDirectionsUrl(name){
  return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(plainText(name)+', '+CITY_NAME)+'&travelmode=transit&dir_action=navigate';
}
function htmlText(value){
  return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// â”€â”€ Helpers geo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  return km<1?Math.round(km*1000)+' m':km.toFixed(1)+' km';
}
function nearestDayDist(lat,lon){
  if(FOOD_ORIGIN) return wKm(lat, lon, FOOD_ORIGIN.lat, FOOD_ORIGIN.lon);
  if(!DAY_STOPS.length) return null;
  var bestKm=Infinity;
  DAY_STOPS.forEach(function(s){ var k=wKm(lat,lon,s.lat,s.lon); if(k<bestKm) bestKm=k; });
  return bestKm;
}
function transitAccess(lat,lon){
  if(!TRANSIT||!TRANSIT.stations||!TRANSIT.stations.length) return '<div class="transit-access"><strong>'+PUBLIC_TRANSIT_LABEL+'</strong></div>';
  var nearest=null,best=Infinity;
  TRANSIT.stations.forEach(function(station){var km=hKm(lat,lon,station.latitude,station.longitude);if(km<best){best=km;nearest=station;}});
  if(!nearest||best>1.2) return '<div class="transit-access"><strong>'+PUBLIC_TRANSIT_LABEL+'</strong></div>';
  var lines=(nearest.lineIds||[]).join(' · ');
  return '<div class="transit-access"><strong>'+NEARBY_STOP_LABEL+':</strong> '+htmlText(nearest.name)+' · '+fDist(best)+(lines?' <span class="transit-access-lines">'+htmlText(lines)+'</span>':'')+'</div>';
}
function transitFocusPoints(){
  if(DAY_STOPS.length) return DAY_STOPS;
  return OTHER_DAY.concat(UNASSIGNED);
}
function isTransitPointRelevant(point,maxKm){
  var focus=transitFocusPoints();
  if(!focus.length) return true;
  for(var i=0;i<focus.length;i++){if(hKm(point[0],point[1],focus[i].lat,focus[i].lon)<=maxKm)return true;}
  return false;
}
function isTransitEdgeRelevant(a,b){
  var aRelevant=isTransitPointRelevant(a,3),bRelevant=isTransitPointRelevant(b,3);
  return aRelevant&&bRelevant;
}

// â”€â”€ Event delegation unificata per tutti i bottoni popup e filter bar â”€â”€â”€â”€â”€â”€â”€â”€
document.addEventListener('click', function(e){
  var btn = e.target && e.target.closest ? e.target.closest('button[data-action]') : null;
  if (!btn || !btn.dataset) return;
  var action = btn.dataset.action;
  if (action === 'filter') { setFilter(Number(btn.dataset.level)); return; }
  if (action === 'transit') { toggleTransit(); return; }
  if (action === 'transitMode') { setTransitMode(btn.dataset.mode||'recommended'); return; }
  if (action === 'ruler')  { toggleMeasure(); return; }
  if (action === 'maps')   sendMessage({type:'openMaps',        url: btn.dataset.url});
  if (action === 'add')    sendMessage({type:'addAttraction',   id: Number(btn.dataset.id)});
  if (action === 'move')   sendMessage({type:'moveAttraction',  id: Number(btn.dataset.id), fromDay: Number(btn.dataset.from)});
  if (action === 'remove') sendMessage({type:'removeAttraction',id: Number(btn.dataset.id)});
  if (action === 'selectFood') sendMessage({type:'selectFood', id: Number(btn.dataset.id)});
  if (action === 'removeFood') sendMessage({type:'removeFood', id: Number(btn.dataset.id)});
});
// â”€â”€ Filter bar: mostra/nasconde layer 3 per livello â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
var unassLayers = {};
var foodLayer = null;
var currentFilter = 0;
var transitLayer = null;
var transitVisible = true;
var transitItems = [];
var selectedTransitMode = 'recommended';

function renderTransitLayer(){
  if(!transitLayer)return;
  transitLayer.clearLayers();
  transitItems.forEach(function(item){if(selectedTransitMode==='recommended'||item.modes.indexOf(selectedTransitMode)>=0)item.layer.addTo(transitLayer);});
}
function setTransitMode(mode){
  selectedTransitMode=mode;
  renderTransitLayer();
  document.querySelectorAll('.transit-mode-btn').forEach(function(button){button.classList.toggle('active',button.dataset.mode===mode);});
}

function toggleTransit() {
  if (!transitLayer) return;
  transitVisible = !transitVisible;
  if (transitVisible) transitLayer.addTo(map); else map.removeLayer(transitLayer);
  var button = document.getElementById('transit-toggle');
  if (button) {
    button.classList.toggle('active', transitVisible);
    button.setAttribute('aria-pressed', transitVisible ? 'true' : 'false');
  }
  var modePanel=document.querySelector('.transit-mode-panel');if(modePanel)modePanel.style.display=transitVisible?'flex':'none';
}

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

// â”€â”€ Righello misura distanza â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// Wrapper marker: in modalitÃ  righello il click usa la posizione del marker
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
function transitDirectionsButton(name){
  var url=transitDirectionsUrl(name);
  return '<button type="button" class="pop-transit" data-action="maps" data-url="'+url.replace(/"/g,'&quot;')+'">'+TRANSIT_DIRECTIONS_LABEL+'</button>';
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

var map = L.map('map',{zoomControl:false,attributionControl:true,minZoom:3,maxZoom:19});
L.tileLayer('${tileUrl}',{subdomains:'abcd',maxZoom:20,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'}).addTo(map);
measureLayer = L.layerGroup().addTo(map);
foodLayer = L.layerGroup();

// â”€â”€ Layer 3: non in itinerario â€” gruppi per livello (filtrabili) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    (nd !== null ? '<div class="pop-dist">'+WALK_PREFIX+fDist(nd)+' '+DIST_FROM_ROUTE+'</div>' : '')+
    (a.desc ? '<div class="pop-desc">'+a.desc+'</div>' : '')+
    (a.mins ? '<div class="pop-meta">~'+a.mins+' '+MINS_LABEL+'</div>' : '')+
    transitAccess(a.lat,a.lon)+
    addButton(a.id)+
    transitDirectionsButton(a.name)+
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
    html:'<div class="food-dot '+(isTypical?'typical':'')+'">&#127869;&#65039;</div>',
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
    (dishes?'<div class="pop-meta">'+TYPICAL_DISH_LABEL+': '+dishes+'</div>':'')+
    (nd!==null?'<div class="pop-dist">'+WALK_PREFIX+fDist(nd)+' '+DIST_FROM_ROUTE+'</div>':'')+
    (f.rating?'<div class="pop-meta">&#9733; '+f.rating+'</div>':'')+
    (f.desc?'<div class="pop-desc">'+f.desc+'</div>':'')+
    selectFoodButton(f.id)+
    mapsButton(url);
  foodLayer.addLayer(attachMarker(L.marker([f.lat,f.lon],{icon:icon,zIndexOffset:900}), popup));
});
if (FOOD_MODE && foodLayer) foodLayer.addTo(map);

SELECTED_FOOD.forEach(function(f){
  var icon=L.divIcon({
    html:'<div class="food-dot selected">&#127869;&#65039;</div>',
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
    (dishes?'<div class="pop-meta">'+TYPICAL_DISH_LABEL+': '+dishes+'</div>':'')+
    (nd!==null?'<div class="pop-dist">'+WALK_PREFIX+fDist(nd)+' '+DIST_FROM_ROUTE+'</div>':'')+
    (f.rating?'<div class="pop-meta">&#9733; '+f.rating+'</div>':'')+
    (f.desc?'<div class="pop-desc">'+f.desc+'</div>':'')+
    removeFoodButton(f.id)+
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

if (TRANSIT && TRANSIT.lines && TRANSIT.lines.length) {
  map.createPane('transit-lines');
  map.getPane('transit-lines').style.zIndex = 320;
  map.createPane('transit-stations');
  map.getPane('transit-stations').style.zIndex = 610;
  transitLayer = L.layerGroup();
  var transitColors = {};
  TRANSIT.lines.forEach(function(line) {
    transitColors[line.id] = line.color;
    (line.paths || []).forEach(function(path) {
      for(var pathIndex=0;pathIndex<path.length-1;pathIndex++){
        var from=path[pathIndex],to=path[pathIndex+1];
        if(isTransitEdgeRelevant(from,to))transitItems.push({layer:L.polyline([from,to],{pane:'transit-lines',color:line.color,weight:4,opacity:.82,lineCap:'round',lineJoin:'round'}),modes:[line.mode||TRANSIT.mode||'metro']});
      }
    });
  });
  TRANSIT.stations.forEach(function(station) {
    if(!isTransitPointRelevant([station.latitude,station.longitude],3))return;
    var interchange = station.lineIds.length > 1;
    var color = transitColors[station.lineIds[0]] || '#0891b2';
    var marker = L.circleMarker([station.latitude, station.longitude], {
      pane:'transit-stations',radius:interchange?6:4,color:interchange?'#111827':color,
      weight:interchange?2.5:2,fillColor:'#ffffff',fillOpacity:1,opacity:1
    });
    var chips = station.lineIds.map(function(id) {
      var line = TRANSIT.lines.find(function(item){return item.id===id;});
      var bg = line ? line.color : '#64748b';
      var fg = line ? line.textColor : '#ffffff';
      return '<span class="station-line" style="background:'+bg+';color:'+fg+'">'+htmlText(id)+'</span>';
    }).join('');
    marker.bindPopup('<div class="pop-type">'+STATION_LABEL+'</div><div class="pop-name">'+htmlText(station.name)+'</div><div class="pop-meta">'+LINES_LABEL+'</div><div class="station-lines">'+chips+'</div>');
    var stationModes=station.lineIds.map(function(id){var item=TRANSIT.lines.find(function(line){return line.id===id;});return(item&&item.mode)||TRANSIT.mode||'metro';}).filter(function(mode,index,modes){return modes.indexOf(mode)===index;});
    transitItems.push({layer:marker,modes:stationModes});
  });
  renderTransitLayer();
  transitLayer.addTo(map);
  var transitButton = document.createElement('button');
  transitButton.id = 'transit-toggle';
  transitButton.className = 'transit-toggle active';
  transitButton.dataset.action = 'transit';
  transitButton.setAttribute('aria-pressed','true');
  transitButton.innerHTML = '<span class="transit-badge">'+TRANSIT_BADGE+'</span><span>'+TRANSIT_LABEL+'</span>';
  document.getElementById('map').appendChild(transitButton);
  if(TRANSIT.mode==='mixed'){
    var availableModes=TRANSIT.lines.map(function(line){return line.mode||'metro';}).filter(function(mode,index,modes){return mode!=='mixed'&&modes.indexOf(mode)===index;});
    var modePanel=document.createElement('div');modePanel.className='transit-mode-panel';
    ['recommended'].concat(availableModes).forEach(function(mode){var button=document.createElement('button');button.className='transit-mode-btn'+(mode==='recommended'?' active':'');button.dataset.action='transitMode';button.dataset.mode=mode;button.textContent=TRANSIT_MODE_LABELS[mode]||mode;modePanel.appendChild(button);});
    document.getElementById('map').appendChild(modePanel);
  }
}

// â”€â”€ Crea filter bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Crea bottone righello â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
(function(){
  var btn = document.createElement('button');
  btn.id = 'ruler-btn';
  btn.innerHTML = '&#128207;';
  btn.title = RULER_LABEL;
  btn.dataset.action = 'ruler';
  btn.dataset.active = '0';
  document.getElementById('map').appendChild(btn);
})();

// â”€â”€ Click sulla mappa in modalitÃ  misura (zone vuote tra marker) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
map.on('click', function(e){
  if(!isRulerActive()) return;
  // Ignora click su overlay (filter bar, ruler btn)
  var tgt = e.originalEvent && e.originalEvent.target;
  if(tgt && tgt.closest && (tgt.closest('#filter-bar') || tgt.closest('#ruler-btn') || tgt.closest('#transit-toggle'))) return;
  handleMeasureClick(e.latlng);
});

// â”€â”€ Layer 2: altri giorni â€” cerchio numerato blu â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    (nd2!==null?'<div class="pop-dist">'+WALK_PREFIX+fDist(nd2)+' '+DIST_FROM_ROUTE+'</div>':'')+
    (s.desc?'<div class="pop-desc">'+s.desc+'</div>':'')+
    (s.mins?'<div class="pop-meta">~'+s.mins+' '+MINS_LABEL+'</div>':'')+
    transitAccess(s.lat,s.lon)+
    moveButton(s.id, s.dayNum)+
    transitDirectionsButton(s.name)+
    mapsButton(url);
  attachMarker(L.marker([s.lat,s.lon],{icon:icon,zIndexOffset:200}), popup).addTo(map);
});

// â”€â”€ Layer 1: tappe del giorno + polilinea (segment-by-segment stagger) â”€â”€â”€â”€â”€
// Disegniamo i segmenti uno alla volta con un piccolo delay (effetto "rotta
// che si traccia"). Ogni segmento Ã¨ creato direttamente con opacity finale â€”
// niente CSS transition perchÃ© su WebView i browser engine spesso non
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
    transitAccess(s.lat,s.lon)+
    removeButton(s.id)+
    transitDirectionsButton(s.name)+
    mapsButton(url);
  attachMarker(L.marker([s.lat,s.lon],{icon:icon,zIndexOffset:1000}), popup).addTo(map);
});

// â”€â”€ Auto-zoom sulle tappe del giorno â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Eseguiamo zoom e invalidateSize in un timeout: il WebView di RN
// finisce il layout DOPO che questo script gira, quindi la mappa
// avrebbe dimensione 0Ã—0 senza il ritardo.
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

// â”€â”€ Componente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function DayMap({
  visible, onClose, city, day, allAttractions, allFoodSpots = [], foodSelection,
  assignedMap, lang, accent, onAddAttraction, onMoveAttraction, onRemoveAttraction, onReorderStops, onSelectFood, onRemoveFood,
  allDays, onDayChange,
}: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [mapReloadKey, setMapReloadKey] = useState(0);
  const [showStopsSheet, setShowStopsSheet] = useState(false);
  const [isDraggingStop, setIsDraggingStop] = useState(false);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const isEn = lang === "en";
  const isFr = lang === "fr";
  const isEs = lang === "es";
  const contextHelp = useContextHelpController();
  const mapHelp = dayMapHelp(lang);
  const { network: transitNetwork, loading: transitLoading, supported: transitSupported } = useTransitNetwork(city, visible);
  const cityTransitMode = transitNetwork?.mode ?? transitModeForCity(city);

  // Chiudi la sheet quando si cambia giorno o si chiude la mappa
  useEffect(() => { setShowStopsSheet(false); setIsDraggingStop(false); }, [day.day, visible]);

  // â”€â”€ Crossfade quando si cambia giorno â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Per evitare il flash bianco della WebView durante il reload, facciamo dip
  // di opacity quando day.day cambia: 1 â†’ 0.35 (200ms) â†’ 1 (350ms).
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
    () => buildHtml(day, city, allAttractions, allFoodSpots, foodSelection, assignedMap, lang, accent, isDark, transitNetwork),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [day.day, city, stopOrderSignature, restaurantSignature, assignedMap.size, allAttractions.length, allFoodSpots.length, foodSelection?.origin?.latitude, foodSelection?.origin?.longitude, foodSelection?.mealType, lang, accent, isDark, transitNetwork],
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
        if (msg.type === "openMaps")        void openExternalLink(msg.url, lang);
        if (msg.type === "addAttraction"    && onAddAttraction)    onAddAttraction(msg.id);
        if (msg.type === "moveAttraction"   && onMoveAttraction)   onMoveAttraction(msg.id, msg.fromDay);
        if (msg.type === "removeAttraction" && onRemoveAttraction) onRemoveAttraction(msg.id);
        if (msg.type === "selectFood"       && onSelectFood)       onSelectFood(msg.id);
        if (msg.type === "removeFood"       && onRemoveFood)       onRemoveFood(msg.id);
      } catch { /* ignore */ }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [lang, onAddAttraction, onMoveAttraction, onRemoveAttraction, onSelectFood, onRemoveFood]);

  const handleMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "ready")    setStatus("ready");
      if (msg.type === "error")    setStatus("error");
      if (msg.type === "openMaps") void openExternalLink(msg.url, lang);
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

  const mapBg = "#dfe8ec";
  const iframe = Platform.OS === "web"
    ? React.createElement("iframe", {
        key: `${stopOrderSignature}:${mapReloadKey}`,
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
          <TouchableOpacity
            onPress={contextHelp.guard(mapHelp.close, onClose)}
            style={[styles.closeBtn, { backgroundColor: colors.card2 }, contextHelpOutline(contextHelp.active, colors.accentGold)]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={mapHelp.close.title}
            hitSlop={6}
          >
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
                     onPress={contextHelp.guard(mapHelp.days, () => onDayChange(d.day))}
                    haptic="selection"
                    pressScale={0.94}
                    style={[
                      styles.dayPill,
                      { borderColor: colors.border, backgroundColor: colors.card2 },
                      active && { borderColor: da, backgroundColor: da + "22" },
                    ]}
                  >
                    <Text style={[styles.dayPillText, { color: active ? da : colors.textMuted }]}>
                      {isEs ? `Día ${d.day}` : isFr ? `Jour ${d.day}` : isEn ? `Day ${d.day}` : `Giorno ${d.day}`}
                    </Text>
                  </PressableCard>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={[styles.title, { color: accent }]}>
              {isEs ? `Día ${day.day}` : isFr ? `Jour ${day.day}` : isEn ? `Day ${day.day}` : `Giorno ${day.day}`}
            </Text>
          )}
          <TouchableOpacity
            onPress={contextHelp.toggle}
            style={[styles.closeBtn, { backgroundColor: colors.accentGold + "18", borderColor: colors.accentGold + "70", borderWidth: 1 }]}
            accessibilityRole="button"
            accessibilityLabel={isEs ? "Ayuda del mapa" : isFr ? "Aide de la carte" : isEn ? "Map help" : "Guida della mappa"}
            accessibilityState={{ expanded: contextHelp.active }}
            hitSlop={6}
          >
            <Ionicons name={contextHelp.active ? "close" : "help-circle-outline"} size={21} color={colors.accentGold} />
          </TouchableOpacity>
        </View>

        {/* Legenda */}
        <TouchableOpacity activeOpacity={1} onPress={contextHelp.guard(mapHelp.legend, () => {})} style={[styles.legend, { borderBottomColor: colors.border }, contextHelpOutline(contextHelp.active, colors.accentGold)]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: accent }]} />
            <Text style={[styles.legendLabel, { color: colors.textSub }]}>{isEs ? "Paradas de hoy" : isFr ? "Étapes du jour" : isEn ? "Today's stops" : "Tappe di oggi"}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accentBlue }]} />
            <Text style={[styles.legendLabel, { color: colors.textSub }]}>{isEs ? "Planificado en otros días" : isFr ? "Prévu les autres jours" : isEn ? "Planned in other days" : "Già previsti in altri giorni"}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: isDark ? "#3a3a5a" : "#b0b0c8", borderWidth: 1, borderColor: isDark ? "#5a5a7a" : "#9090a8" }]} />
             <Text style={[styles.legendLabel, { color: colors.textSub }]}>{isEs ? "Por explorar" : isFr ? "À explorer" : isEn ? "Explore" : "Da esplorare"}</Text>
          </View>
        </TouchableOpacity>

        {/* Mappa â€” wrappata in Animated.View per il crossfade su cambio giorno */}
        <View style={styles.mapWrap}>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: mapFade }]}>
            {Platform.OS === "web" ? iframe : (
              <WebView
                key={`${stopOrderSignature}:${mapReloadKey}`}
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
          {contextHelp.active && (
            <TouchableOpacity activeOpacity={1} onPress={() => contextHelp.explain(mapHelp.map)} style={[StyleSheet.absoluteFill, { zIndex: 20 }]} />
          )}

          {status === "loading" && (
            <MapStatusOverlay status="loading" lang={lang} accent={accent} />
          )}

          {status === "error" && (
            <MapStatusOverlay
              status="error"
              lang={lang}
              accent={accent}
              onRetry={() => {
                setStatus("loading");
                setMapReloadKey((value) => value + 1);
              }}
            />
          )}

          {status === "ready" && transitSupported && transitLoading && (
            <View style={[styles.transitLoadingBadge, { backgroundColor: colors.card2, borderColor: colors.border }]}>
              <ActivityIndicator color="#0891b2" size="small" />
              <Text style={[styles.transitLoadingText, { color: colors.textSub }]}>
                {transitPresentation(cityTransitMode, lang).loading}
              </Text>
            </View>
          )}

          {/* â”€â”€ FAB "Riordina tappe" â€” in basso a sinistra, a fianco del filtro â”€â”€ */}
          {status === "ready" && !!onReorderStops && day.stops.length > 1 && (
            <TouchableOpacity
               onPress={contextHelp.guard(mapHelp.reorder, () => setShowStopsSheet(true))}
              activeOpacity={0.8}
              style={[
                styles.reorderFab,
                { backgroundColor: colors.card2, borderColor: accent + "55" },
              ]}
              accessibilityLabel={isEs ? "Reordenar paradas" : isFr ? "Réordonner les étapes" : isEn ? "Reorder stops" : "Riordina tappe"}
              accessibilityRole="button"
            >
              <Ionicons name="reorder-three-outline" size={22} color={accent} />
            </TouchableOpacity>
          )}
        <ContextHelpUI controller={contextHelp} lang={lang} />
       </View>

        {/* â”€â”€ Bottom sheet riordino tappe â€” drag-to-dismiss + rubber-band â”€â”€ */}
        {!!onReorderStops && (
          <BottomSheet
            visible={showStopsSheet}
            onClose={() => setShowStopsSheet(false)}
            heightFraction={0.88}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: accent }]}>
                {isEs ? `Día ${day.day} · Reordenar paradas` : isFr ? `Jour ${day.day} · Réordonner les étapes` : isEn ? `Day ${day.day} · Reorder stops` : `Giorno ${day.day} · Riordina tappe`}
              </Text>
              <TouchableOpacity
                onPress={() => setShowStopsSheet(false)}
                style={[styles.closeBtn, { backgroundColor: colors.card2 }]}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={mapHelp.close.title}
                hitSlop={6}
              >
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.sheetHint, { color: colors.textMuted }]}>
               {isEs
                 ? "Mantén pulsado el control de una parada y arrástrala para reordenarla."
                 : isFr
                 ? "Maintenez la poignée de déplacement d’une étape, puis faites-la glisser pour la réordonner."
                : isEn
                  ? "Long-press a stop’s reorder handle, then drag it up or down."
                  : "Tieni premuta la maniglia di una tappa e trascinala per riordinarla."}
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

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  transitLoadingBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 15,
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  transitLoadingText: { fontSize: 11, lineHeight: 15, fontWeight: "800" },
  overlayText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  retryBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryText: { fontSize: 14, fontWeight: "600" },

  // â”€â”€ FAB riordino + bottom sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
