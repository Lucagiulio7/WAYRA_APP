import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  LayoutAnimation,
  Modal,
  PanResponder,
  PanResponderGestureState,
  Platform,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cacheCityForOffline } from "@/services/cityOfflineCache";
import { normalizeItineraryStructure } from "@/utils/itineraryStructure";
import { openExternalLink as openSafeExternalLink } from "@/utils/externalLinks";
import { useAttractions, BuilderAttraction } from "@/hooks/useAttractions";
import { useFoodSpots } from "@/hooks/useFoodSpots";
import { useCityExtras } from "@/hooks/useCityExtras";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { BuilderMap, MapSlot } from "@/components/BuilderMap";
import { SettingsModal } from "@/components/SettingsModal";
import { useBuilderStore } from "@/store/builderStore";
import { SkeletonList } from "@/components/Skeleton";
import { cityLabel as localizedCityLabel } from "@/utils/cityLabels";
import { localizedDescription, localizedName } from "@/utils/localization";
import { translateAttractionType } from "@/utils/attractionType";
import { isMuseumType, routeWalkingKm, walkingKm } from "@/utils/routeMetrics";
import { MANUAL_MAX_WALK_KM, MAX_ACTIVITY_MINUTES, MAX_MUSEUMS_PER_DAY } from "@/utils/itineraryRules";
import { ContextHelpUI, contextHelpOutline, useContextHelpController, type ContextHelpContent } from "@/components/ContextHelp";
import {
  loadManualBuilderDraft,
  removeManualBuilderDraft,
  saveManualBuilderDraft,
} from "@/services/manualBuilderDraftStorage";
import { FEATURES } from "@/constants/features";

// Ã¢â€â‚¬Ã¢â€â‚¬ Costanti visive Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const ATTRACTION_EMOJI: Record<string, string> = {
  museo: "\u{1F3DB}\u{FE0F}", chiesa: "\u{26EA}", parco: "\u{1F33F}", piazza: "\u{1F3DF}\u{FE0F}",
  archeologia: "\u{2692}\u{FE0F}", monumento: "\u{1F5FF}", quartiere: "\u{1F3D8}\u{FE0F}",
  panorama: "\u{1F305}", mercato: "\u{1F6D2}", palazzo: "\u{1F3F0}",
  basilica: "\u{26EA}", cattedrale: "\u{26EA}", abbazia: "\u{26EA}", convento: "\u{26EA}",
  monastero: "\u{26EA}", cappella: "\u{26EA}", santuario: "\u{26EA}",
  sinagoga: "\u{1F54D}", moschea: "\u{1F54C}", tempio: "\u{1F6D5}",
  castello: "\u{1F3F0}", fortezza: "\u{1F3EF}", torre: "\u{1F5FC}",
  ponte: "\u{1F309}", fontana: "\u{26F2}", villa: "\u{1F3E1}",
  anfiteatro: "\u{1F3DF}\u{FE0F}", statua: "\u{1F5FF}", arco: "\u{1F3DB}\u{FE0F}",
  obelisco: "\u{1F5FF}", mausoleo: "\u{1F3DB}\u{FE0F}",
  teatro: "\u{1F3AD}", opera: "\u{1F3AD}", auditorium: "\u{1F3AD}",
  galleria: "\u{1F5BC}\u{FE0F}", arte: "\u{1F3A8}", biblioteca: "\u{1F4DA}",
  giardino: "\u{1F338}", orto: "\u{1F331}", lago: "\u{1F3DE}\u{FE0F}",
  spiaggia: "\u{1F3D6}\u{FE0F}", costa: "\u{1F30A}", fiordo: "\u{1F30A}",
  collina: "\u{26F0}\u{FE0F}", montagna: "\u{1F3D4}\u{FE0F}",
  viale: "\u{1F333}", strada: "\u{1F6E4}\u{FE0F}", passeggiata: "\u{1F6B6}",
  porto: "\u{2693}", stazione: "\u{1F689}", terme: "\u{2668}\u{FE0F}",
  acquario: "\u{1F420}", zoo: "\u{1F981}", stadio: "\u{1F3DF}\u{FE0F}",
  belvedere: "\u{1F305}", miradouro: "\u{1F305}",
  murales: "\u{1F3A8}",
  attrazione: "\u{1F4CC}",
};

const FOOD_EMOJI: Record<string, string> = {
  ristorante: "\u{1F37D}\u{FE0F}", trattoria: "\u{1F35D}", osteria: "\u{1FAD5}", pizzeria: "\u{1F355}",
  gelateria: "\u{1F366}", "street food": "\u{1F96A}", bar: "\u{2615}", friggitoria: "\u{1F35F}",
};

const LEVEL_COLORS: Record<number, string> = {
  1: "#e8c06a", 2: "#7eb8f7", 3: "#a78bfa",
};


const MANUAL_GUIDE_SLIDES_IT = [
  { icon: "\u{1F9ED}", target: "header", title: "Intestazione", body: "Qui controlli la città e la durata del viaggio. La freccia torna alla schermata precedente; sotto il nome vedi quante tappe hai già inserito." },
  { icon: "\u{1F4D6}", target: "guide", title: "Guida contestuale", body: "Il punto interrogativo attiva la modalità guida. Puoi continuare a scorrere e toccare un controllo per sapere esattamente cosa fa, senza modificare l'itinerario." },
  { icon: "\u{2699}\u{FE0F}", target: "settings", title: "Impostazioni", body: "L'ingranaggio apre lingua, tema e preferenze dell'app. Le modifiche vengono applicate anche al riepilogo finale." },
  { icon: "\u{1F4CC}", target: "tabs", title: "Attrazioni, pasti e piano", body: "Attrazioni mostra i luoghi da visitare, Pasti ristoranti e locali, Piano il riepilogo dei giorni. I numeri indicano gli elementi disponibili o già inseriti." },
  { icon: "\u{1F50E}", target: "search", title: "Ricerca e filtri", body: "Cerca restringe la lista in tempo reale. Il pulsante con gli slider filtra per categoria, per esempio musei, piazze, monumenti o tipi di cucina." },
  { icon: "\u{1F4C6}", target: "plan", title: "Giorni e slot", body: "Il pannello a sinistra contiene i giorni. Aprine uno per vedere gli slot: il monumento identifica un'attrazione, il piatto un pasto. Trascina qui le schede della lista." },
  { icon: "\u{1F6A6}", target: "plan", title: "Controlli del giorno", body: "Tempo, distanza a piedi e musei diventano rossi oltre i limiti consigliati. Puoi superarli, ma l'app ti chiederà conferma prima dell'inserimento." },
  { icon: "\u{1F446}", target: "list", title: "Schede disponibili", body: "La lista a destra contiene i luoghi ancora disponibili. Trascina una scheda nello slot oppure premila per leggere descrizione, posizione su Maps e biglietti, se presenti." },
  { icon: "\u{1F9F9}", target: "plan", title: "Modifica del piano", body: "Il cestino rosso elimina una tappa o uno slot. I pulsanti in fondo aggiungono slot attrazione o pasto; Ottimizza riordina il percorso del giorno." },
  { icon: "\u{1F5FA}\u{FE0F}", target: "view", title: "Apri il riepilogo", body: "Vedi si attiva dopo la prima attrazione. Apre l'itinerario completo con giornate, metriche, mappe e tutte le informazioni della città." },
];

const MANUAL_GUIDE_SLIDES_EN = [
  { icon: "\u{1F9ED}", target: "header", title: "Header", body: "Check the city and trip length here. The arrow returns to the previous screen; below the city name you can see how many stops have already been added." },
  { icon: "\u{1F4D6}", target: "guide", title: "Contextual help", body: "The question mark enables help mode. Keep scrolling and tap a control to learn exactly what it does without changing the itinerary." },
  { icon: "\u{2699}\u{FE0F}", target: "settings", title: "Settings", body: "The gear opens the app language, theme and preferences. Changes also apply to the final itinerary." },
  { icon: "\u{1F4CC}", target: "tabs", title: "Places, food and plan", body: "Places lists attractions, Food lists restaurants and local spots, and Plan summarizes the days. Badges show available or inserted items." },
  { icon: "\u{1F50E}", target: "search", title: "Search and filters", body: "Search narrows the list in real time. The sliders button filters by category, such as museums, squares, monuments or food types." },
  { icon: "\u{1F4C6}", target: "plan", title: "Days and slots", body: "The left panel contains your days. Open one to see its slots: the monument means attraction and the plate means meal. Drag cards here from the list." },
  { icon: "\u{1F6A6}", target: "plan", title: "Day checks", body: "Time, walking distance and museum count turn red beyond the suggested limits. You may exceed them, but the app asks for confirmation first." },
  { icon: "\u{1F446}", target: "list", title: "Available cards", body: "The right list contains places not yet used. Drag a card into a slot or tap it to read its description, Maps location and ticket link when available." },
  { icon: "\u{1F9F9}", target: "plan", title: "Edit the plan", body: "The red trash button removes a stop or slot. Bottom buttons add attraction or meal slots; Optimize reorders the day's route." },
  { icon: "\u{1F5FA}\u{FE0F}", target: "view", title: "Open the summary", body: "View becomes available after the first attraction. It opens the full itinerary with days, metrics, maps and city information." },
];

const MANUAL_GUIDE_SLIDES_FR = [
  { icon: "\u{1F9ED}", target: "header", title: "En-tête", body: "Contrôlez ici la ville et la durée du voyage. La flèche revient à l'écran précédent ; sous le nom, vous voyez combien d'étapes sont déjà ajoutées." },
  { icon: "\u{1F4D6}", target: "guide", title: "Aide contextuelle", body: "Le point d'interrogation active le mode d'aide. Continuez à défiler et touchez un contrôle pour connaître précisément sa fonction sans modifier l'itinéraire." },
  { icon: "\u{2699}\u{FE0F}", target: "settings", title: "Paramètres", body: "L'engrenage ouvre la langue, le thème et les préférences. Les changements s'appliquent aussi au récapitulatif final." },
  { icon: "\u{1F4CC}", target: "tabs", title: "Attractions, repas et plan", body: "Attractions affiche les lieux, Repas les restaurants, et Plan le résumé des jours. Les nombres indiquent les éléments disponibles ou déjà ajoutés." },
  { icon: "\u{1F50E}", target: "search", title: "Recherche et filtres", body: "La recherche réduit la liste en temps réel. Le bouton avec les curseurs filtre par catégorie : musées, places, monuments ou types de cuisine." },
  { icon: "\u{1F4C6}", target: "plan", title: "Jours et emplacements", body: "Le panneau de gauche contient les jours. Ouvrez-en un : le monument indique une attraction et l'assiette un repas. Faites glisser ici les cartes de la liste." },
  { icon: "\u{1F6A6}", target: "plan", title: "Contrôles du jour", body: "Le temps, la marche et les musées passent au rouge au-delà des limites conseillées. Vous pouvez les dépasser après confirmation." },
  { icon: "\u{1F446}", target: "list", title: "Cartes disponibles", body: "La liste de droite contient les lieux encore disponibles. Glissez une carte ou touchez-la pour lire sa description, sa position Maps et le lien de billetterie." },
  { icon: "\u{1F9F9}", target: "plan", title: "Modifier le plan", body: "La corbeille rouge supprime une étape ou un emplacement. Les boutons du bas ajoutent des emplacements ; Optimiser réordonne le parcours." },
  { icon: "\u{1F5FA}\u{FE0F}", target: "view", title: "Ouvrir le récapitulatif", body: "Voir devient actif après la première attraction. Il ouvre l'itinéraire complet avec journées, métriques, cartes et informations sur la ville." },
];

const MANUAL_GUIDE_SLIDES_ES = [
  { icon: "\u{1F9ED}", target: "header", title: "Encabezado", body: "Aquí controlas la ciudad y la duración del viaje. La flecha vuelve a la pantalla anterior; debajo ves cuántas paradas has añadido." },
  { icon: "\u{1F4D6}", target: "guide", title: "Ayuda contextual", body: "El signo de interrogación activa el modo de ayuda. Puedes seguir desplazándote y tocar un control para saber exactamente qué hace sin modificar el itinerario." },
  { icon: "\u{2699}\u{FE0F}", target: "settings", title: "Configuración", body: "El engranaje abre el idioma, el tema y las preferencias. Los cambios también se aplican al resumen final." },
  { icon: "\u{1F4CC}", target: "tabs", title: "Lugares, comida y plan", body: "Lugares muestra atracciones, Comida restaurantes y Plan el resumen de los días. Los números indican elementos disponibles o añadidos." },
  { icon: "\u{1F50E}", target: "search", title: "Búsqueda y filtros", body: "La búsqueda filtra la lista en tiempo real. El botón de controles filtra por categoría: museos, plazas, monumentos o tipos de comida." },
  { icon: "\u{1F4C6}", target: "plan", title: "Días y espacios", body: "El panel izquierdo contiene los días. Abre uno: el monumento indica una atracción y el plato una comida. Arrastra aquí las tarjetas." },
  { icon: "\u{1F6A6}", target: "plan", title: "Controles del día", body: "El tiempo, la distancia a pie y los museos se vuelven rojos al superar los límites. Puedes hacerlo, pero la app pide confirmación." },
  { icon: "\u{1F446}", target: "list", title: "Tarjetas disponibles", body: "La lista derecha contiene lugares aún disponibles. Arrastra una tarjeta o tócala para leer la descripción, la posición en Maps y las entradas." },
  { icon: "\u{1F9F9}", target: "plan", title: "Modificar el plan", body: "La papelera roja elimina una parada o espacio. Los botones inferiores añaden espacios; Optimizar reordena la ruta." },
  { icon: "\u{1F5FA}\u{FE0F}", target: "view", title: "Abrir el resumen", body: "Ver se activa tras la primera atracción. Abre el itinerario completo con días, métricas, mapas e información de la ciudad." },
];

function getEmoji(type?: string | null, isFood = false): string {
  const key = (type ?? "").toLowerCase();
  if (isFood) return FOOD_EMOJI[key] ?? "\u{1F374}";
  if (ATTRACTION_EMOJI[key]) return ATTRACTION_EMOJI[key];
  // Substring fallback for compound types (e.g. "parco storico" Ã¢â€ â€™ Ã°Å¸Å’Â¿)
  const match = Object.keys(ATTRACTION_EMOJI).find(
    (k) => k.length >= 4 && key.includes(k)
  );
  return match ? ATTRACTION_EMOJI[match] : "\u{1F4CC}";
}

function translateType(type?: string | null, lang = "it"): string | null {
  return translateAttractionType(type, lang);
}

function priceLabel(level: number): string {
  if (level === 1) return "\u20AC";
  if (level === 2) return "\u20AC\u20AC";
  return "\u20AC\u20AC\u20AC";
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Geo Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function mapsWaypoint(stop: BuilderAttraction, city: string, lang: string): string {
  return encodeURIComponent(`${localizedName(stop, lang)} ${localizedCityLabel(city, lang)}`.trim());
}

function mapsSearchUrl(stop: BuilderAttraction, city: string, lang: string): string {
  const query = `${localizedName(stop, lang)} ${localizedCityLabel(city, lang)}`.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function isMuseum(stop: BuilderAttraction): boolean {
  return isMuseumType(stop.attraction_type);
}


function fmtDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Ottimizzazione percorso Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬


// Ã¢â€â‚¬Ã¢â€â‚¬ Tipi Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

type SlotKind = "attraction" | "meal";
type SlotData = { id: string; kind: SlotKind; attraction: BuilderAttraction | null; note?: string };
type DayPlan = { day: number; slots: SlotData[] };
type ActiveTab = "attractions" | "food" | "piano";
type DayStats = { minutes: number; distanceKm: number; museums: number; attractions: number; filled: number };
type PlacementCheck = { blocked?: string; warning?: string };
type DockDetail = { dayIdx: number; slot: SlotData } | null;
type AttractionDetail = { item: BuilderAttraction; kind: SlotKind } | null;
type SlotTarget = { dayIdx: number; slotId: string; kind: SlotKind; ref: View | null };
type DragState = { item: BuilderAttraction; kind: SlotKind } | null;

let _slotCounter = 0;
function makeSlot(kind: SlotKind = "attraction"): SlotData {
  return { id: `slot_${++_slotCounter}`, kind, attraction: null };
}

const EMPTY_STATS: DayStats = { minutes: 0, distanceKm: 0, museums: 0, attractions: 0, filled: 0 };

function getDayStats(day: DayPlan | undefined): DayStats {
  if (!day) return EMPTY_STATS;
  const filledSlots = day.slots.filter((s) => s.attraction !== null);
  const attractionSlots = filledSlots.filter((s) => s.kind === "attraction");
  const route = attractionSlots.map((s) => s.attraction!);
  return {
    minutes: attractionSlots.reduce((sum, s) => sum + (s.attraction?.estimated_visit_time ?? 0), 0),
    distanceKm: routeWalkingKm(route),
    museums: attractionSlots.filter((s) => isMuseumType(s.attraction?.attraction_type)).length,
    attractions: attractionSlots.length,
    filled: filledSlots.length,
  };
}

function dayStatsWith(day: DayPlan | undefined, slotId: string, attraction: BuilderAttraction): DayStats {
  if (!day) return EMPTY_STATS;
  const nextSlots = day.slots.map((s) => s.id === slotId ? { ...s, attraction } : s);
  return getDayStats({ ...day, slots: nextSlots });
}

function matchesSearch(item: BuilderAttraction, search: string, lang: string): boolean {
  const query = search.trim().toLocaleLowerCase();
  if (!query) return true;
  return [
    localizedName(item, lang),
    item.name,
    item.name_en,
    item.name_fr,
    item.name_es,
  ].some((value) => value?.toLocaleLowerCase().includes(query));
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Schermata principale Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function DisabledManualBuilderRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return null;
}

export default function CreateItineraryRoute() {
  return FEATURES.manualBuilder
    ? <CreateItineraryScreen />
    : <DisabledManualBuilderRedirect />;
}

function CreateItineraryScreen() {
  const router = useRouter();
  const { city = "roma", numDays: ndStr = "1", cityLabel = "" } =
    useLocalSearchParams<{ city: string; numDays: string; cityLabel: string }>();
  const numDays = Math.max(1, parseInt(ndStr, 10) || 1);
  const { lang } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [builderHydrated, setBuilderHydrated] = useState(false);

  const { attractions, loading, error } = useAttractions(city);
  const { foodSpots, loading: foodLoading, error: foodError } = useFoodSpots(city);
  const { foods, cultureFacts } = useCityExtras(city);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Zustand builder store Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const {
    days,
    expandedDay,
    setExpandedDay,
    dropAttraction,
    removeAttraction,
    deleteSlot: storeDeleteSlot,
    addSlot: storeAddSlot,
    setNote: storeSetNote,
    optimizeDay: storeOptimizeDay,
    addFilledSlot,
    mapAddFood: storeMapAddFood,
    mapReorderSlots,
    addDay: storeAddDay,
    init: initBuilder,
    restore: restoreBuilder,
  } = useBuilderStore();

  // Ripristina soltanto la bozza appartenente alla stessa citta e durata.
  useEffect(() => {
    let active = true;
    setBuilderHydrated(false);
    void loadManualBuilderDraft(city, numDays)
      .then((draft) => {
        if (!active) return;
        if (draft) restoreBuilder(draft.days, draft.expandedDay);
        else initBuilder(numDays);
        setBuilderHydrated(true);
      })
      .catch(() => {
        if (!active) return;
        initBuilder(numDays);
        setBuilderHydrated(true);
      });
    return () => { active = false; };
  }, [city, initBuilder, numDays, restoreBuilder]);

  useEffect(() => {
    if (!builderHydrated || days.length !== numDays) return;
    void saveManualBuilderDraft({
      version: 1,
      city: city.trim().toLowerCase(),
      numDays,
      expandedDay,
      updatedAt: new Date().toISOString(),
      days,
    }).catch(() => {});
  }, [builderHydrated, city, days, expandedDay, numDays]);

  // Ã¢â€â‚¬Ã¢â€â‚¬ State UI (locale) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const [selected, setSelected] = useState<BuilderAttraction | null>(null);
  const [selectedKind, setSelectedKind] = useState<SlotKind>("attraction");
  const [activeTab, setActiveTab] = useState<ActiveTab>("attractions");
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [dockDetail, setDockDetail] = useState<DockDetail>(null);
  const [attractionDetail, setAttractionDetail] = useState<AttractionDetail>(null);
  const [search, setSearch] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dragging, setDragging] = useState<DragState>(null);
  const [mapVisible, setMapVisible] = useState(false);

  const pianoScrollRef     = useRef<ScrollView>(null);
  const dayOffsets         = useRef<Map<number, number>>(new Map());
  const slotTargets        = useRef<Map<string, SlotTarget>>(new Map());
  const draggingRef        = useRef<DragState>(null);
  const guideTargets       = useRef<Map<string, View>>(new Map());
  const guideRootRef       = useRef<View>(null);
  const contextHelp        = useContextHelpController();
  const dragPosition       = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const attrListRef        = useRef<any>(null);
  const foodListRef        = useRef<any>(null);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Derivati Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  const placedAttractionIds = useMemo(() => {
    const s = new Set<number>();
    days.forEach((d) => d.slots.forEach((sl) => { if (sl.attraction && sl.kind === "attraction") s.add(sl.attraction.id); }));
    return s;
  }, [days]);

  const placedFoodIds = useMemo(() => {
    const s = new Set<number>();
    days.forEach((d) => d.slots.forEach((sl) => { if (sl.attraction && sl.kind === "meal") s.add(sl.attraction.id); }));
    return s;
  }, [days]);

  const lastInExpanded = useMemo(() => {
    const d = days.find((d) => d.day === expandedDay);
    return d?.slots.slice().reverse().find((s) => s.attraction !== null)?.attraction ?? null;
  }, [days, expandedDay]);

  const distanceMap = useMemo(() => {
    const map = new Map<number, number>();
    if (!lastInExpanded) return map;
    [...attractions, ...foodSpots].forEach((a) => {
      map.set(a.id, walkingKm(lastInExpanded, a));
    });
    return map;
  }, [attractions, foodSpots, lastInExpanded]);

  // Quando cambia l'ultima tappa posizionata (e quindi si ricalcolano le distanze),
  // riporta entrambe le liste all'inizio in modo che la piÃƒÂ¹ vicina sia sempre visibile
  useEffect(() => {
    attrListRef.current?.scrollToOffset({ offset: 0, animated: false });
    foodListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [lastInExpanded?.id]);

  const attractionCategories = useMemo(() =>
    [...new Set(attractions.map((a) => a.attraction_type).filter(Boolean) as string[])].sort(),
  [attractions]);

  const foodCategories = useMemo(() =>
    [...new Set(foodSpots.map((a) => a.attraction_type).filter(Boolean) as string[])].sort(),
  [foodSpots]);

  const available = useMemo(() => {
    let list = attractions.filter((a) => !placedAttractionIds.has(a.id));
    if (search.trim()) list = list.filter((a) => matchesSearch(a, search, lang));
    if (activeCategories.length > 0) list = list.filter((a) => a.attraction_type && activeCategories.includes(a.attraction_type));
    if (distanceMap.size === 0) return list;
    return [...list].sort((a, b) => (distanceMap.get(a.id) ?? 9999) - (distanceMap.get(b.id) ?? 9999));
  }, [attractions, placedAttractionIds, distanceMap, search, activeCategories, lang]);

  const availableFood = useMemo(() => {
    let list = foodSpots.filter((a) => !placedFoodIds.has(a.id));
    if (search.trim()) list = list.filter((a) => matchesSearch(a, search, lang));
    if (activeCategories.length > 0) list = list.filter((a) => a.attraction_type && activeCategories.includes(a.attraction_type));
    if (distanceMap.size === 0) return list;
    return [...list].sort((a, b) => (distanceMap.get(a.id) ?? 9999) - (distanceMap.get(b.id) ?? 9999));
  }, [foodSpots, placedFoodIds, distanceMap, search, activeCategories, lang]);

  const totalAttractionsPlaced = useMemo(() => {
    let count = 0;
    days.forEach((day) => day.slots.forEach((slot) => {
      if (slot.kind === "attraction" && slot.attraction) count += 1;
    }));
    return count;
  }, [days]);

  const activeDayIndex = useMemo(() =>
    Math.max(0, days.findIndex((d) => d.day === expandedDay)),
  [days, expandedDay]);

  const activeDay: DayPlan | undefined = days[activeDayIndex] ?? days[0];
  const activeDayStats = useMemo(() => getDayStats(activeDay), [activeDay]);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Dati per BuilderMap Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  const currentMapSlots = useMemo((): MapSlot[] =>
    (activeDay?.slots ?? [])
      .filter((s) => s.attraction !== null)
      .map((s) => ({ slotId: s.id, kind: s.kind, attraction: s.attraction! })),
  [activeDay]);

  // Mostra sulla mappa solo attrazioni non piazzate in altri giorni + quelle giÃƒÂ  nel giorno corrente
  const mapAttractions = useMemo(() => {
    const currentIds = new Set(activeDay?.slots.filter((s) => s.kind === "attraction" && s.attraction).map((s) => s.attraction!.id) ?? []);
    return attractions.filter((a) => !placedAttractionIds.has(a.id) || currentIds.has(a.id));
  }, [attractions, placedAttractionIds, activeDay]);

  const mapFoodSpots = useMemo(() => {
    const currentIds = new Set(activeDay?.slots.filter((s) => s.kind === "meal" && s.attraction).map((s) => s.attraction!.id) ?? []);
    return foodSpots.filter((f) => !placedFoodIds.has(f.id) || currentIds.has(f.id));
  }, [foodSpots, placedFoodIds, activeDay]);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Azioni Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  const showMessage = useCallback((title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  }, []);

  const confirmAction = useCallback((title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === "web") {
      if (window.confirm(`${title}\n${message}`)) onConfirm();
      return;
    }
    Alert.alert(title, message, [
      { text: lang === "es" ? "Cancelar" : lang === "fr" ? "Annuler" : lang === "en" ? "Cancel" : "Annulla", style: "cancel" },
      { text: lang === "es" ? "Continuar" : lang === "fr" ? "Continuer" : lang === "en" ? "Continue" : "Continua", style: "default", onPress: onConfirm },
    ]);
  }, [lang]);

  const setGuideTarget = useCallback((key: string, ref: View | null) => {
    if (ref) guideTargets.current.set(key, ref);
    else guideTargets.current.delete(key);
  }, []);

  const validatePlacement = useCallback((day: DayPlan, slot: SlotData, item: BuilderAttraction, kind: SlotKind): PlacementCheck => {
    if (slot.attraction) {
      return { blocked: lang === "es" ? "Este espacio ya está ocupado." : lang === "fr" ? "Cet emplacement est déjà occupé." : lang === "en" ? "This slot is already occupied." : "Questo slot è già occupato." };
    }
    if (slot.kind !== kind) {
      return {
        blocked: kind === "meal"
          ? (lang === "es" ? "Selecciona un espacio de comida." : lang === "fr" ? "Selectionnez un emplacement repas." : lang === "en" ? "Select a meal slot." : "Seleziona uno slot pasto.")
          : (lang === "es" ? "Selecciona un espacio de atraccion." : lang === "fr" ? "Selectionnez un emplacement attraction." : lang === "en" ? "Select an attraction slot." : "Seleziona uno slot attrazione."),
      };
    }
    const warnings: string[] = [];
    const currentStats = getDayStats(day);
    const nextStats = dayStatsWith(day, slot.id, item);
    const itemIsMuseum = isMuseumType(item.attraction_type);

    if (kind === "attraction" && itemIsMuseum && currentStats.museums >= MAX_MUSEUMS_PER_DAY) {
      warnings.push(lang === "es"
        ? "Este día ya tiene dos museos."
        : lang === "fr"
          ? "Cette journée a déjà deux musées."
          : lang === "en"
            ? "This day already has two museums."
            : "Questo giorno ha già due musei.");
    }

    if (kind === "attraction" && nextStats.minutes > MAX_ACTIVITY_MINUTES) {
      const hours = (nextStats.minutes / 60).toFixed(1);
      warnings.push(lang === "es"
        ? "Esta elección llevaría el día a " + hours + " horas de actividades."
        : lang === "fr"
          ? "Ce choix porterait la journee a " + hours + " heures d'activites."
          : lang === "en"
            ? "This would bring the day to " + hours + " hours of activities."
            : "Questa scelta porterebbe il giorno a " + hours + " ore di attività.");
    }

    if (nextStats.distanceKm > MANUAL_MAX_WALK_KM) {
      const distance = nextStats.distanceKm.toFixed(1);
      warnings.push(lang === "es"
        ? "Esta elección llevaría el día a " + distance + " km a pie."
        : lang === "fr"
          ? "Ce choix porterait la journee a " + distance + " km a pied."
          : lang === "en"
            ? "This would bring the day to " + distance + " km on foot."
            : "Questa scelta porterebbe il giorno a " + distance + " km a piedi.");
    }
    if (warnings.length > 0) {
      return {
        warning: `${warnings.join("\n")}\n${lang === "es" ? "Quieres anadirla de todos modos?" : lang === "fr" ? "Voulez-vous l'ajouter quand meme ?" : lang === "en" ? "Do you want to add it anyway?" : "Vuoi inserirla comunque?"}`,
      };
    }

    return {};
  }, [lang]);

  const commitPlacement = useCallback((dayIdx: number, slotId: string, item: BuilderAttraction) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    dropAttraction(dayIdx, slotId, item);
    setSelected(null);
    setActiveSlotId(null);
  }, [dropAttraction]);

  const placeItemInSlot = useCallback((dayIdx: number, slotId: string, item: BuilderAttraction, kind: SlotKind): boolean => {
    const day = days[dayIdx];
    const slot = day?.slots.find((s) => s.id === slotId);
    if (!day || !slot) return false;

    const validation = validatePlacement(day, slot, item, kind);
    if (validation.blocked) {
      showMessage(
        lang === "es" ? "No se puede añadir aquí" : lang === "fr" ? "Ajout impossible ici" : lang === "en" ? "Cannot add here" : "Non posso inserirla qui",
        validation.blocked,
      );
      return false;
    }
    if (validation.warning) {
      confirmAction(
        lang === "es" ? "Confirmar adicion" : lang === "fr" ? "Confirmer l'ajout" : lang === "en" ? "Confirm addition" : "Conferma inserimento",
        validation.warning,
        () => commitPlacement(dayIdx, slotId, item),
      );
      return true;
    }

    commitPlacement(dayIdx, slotId, item);
    return true;
  }, [commitPlacement, confirmAction, days, lang, showMessage, validatePlacement]);

  const placeItemFromList = useCallback((item: BuilderAttraction, kind: SlotKind) => {
    const dayIdx = activeDayIndex;
    const day = days[dayIdx];
    if (!day) return;

    const preferred = activeSlotId ? day.slots.find((s) => s.id === activeSlotId) : null;
    const target = preferred?.kind === kind && !preferred.attraction
      ? preferred
      : day.slots.find((s) => s.kind === kind && !s.attraction);

    if (target) {
      placeItemInSlot(dayIdx, target.id, item, kind);
      return;
    }

    const newSlot = makeSlot(kind);
    const validation = validatePlacement(day, newSlot, item, kind);
    if (validation.blocked) {
      showMessage(
        lang === "es" ? "No se puede añadir aquí" : lang === "fr" ? "Ajout impossible ici" : lang === "en" ? "Cannot add here" : "Non posso inserirla qui",
        validation.blocked,
      );
      return;
    }

    const commitNewSlot = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      addFilledSlot(dayIdx, kind, item);
      setSelected(null);
      setActiveSlotId(null);
    };

    if (validation.warning) {
      confirmAction(
        lang === "es" ? "Confirmar adicion" : lang === "fr" ? "Confirmer l'ajout" : lang === "en" ? "Confirm addition" : "Conferma inserimento",
        validation.warning,
        commitNewSlot,
      );
      return;
    }

    commitNewSlot();
  }, [activeDayIndex, activeSlotId, confirmAction, days, lang, placeItemInSlot, showMessage, validatePlacement]);

  const handleSelectAttraction = useCallback((a: BuilderAttraction, kind: SlotKind) => {
    setAttractionDetail({ item: a, kind });
  }, []);


  const handleSwitchTab = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab !== "attractions" && tab !== "food") return;
    setSearch("");
    setActiveCategories([]);
    setShowFilterModal(false);
    if (tab !== activeTab) setSelected(null);
  }, [activeTab]);

  const handleTapSlot = useCallback((dayIdx: number, slot: SlotData) => {
    if (slot.attraction !== null) setDockDetail({ dayIdx, slot });
  }, []);

  const handleSlotRef = useCallback((dayIdx: number, slot: SlotData, ref: View | null) => {
    if (ref) {
      slotTargets.current.set(slot.id, { dayIdx, slotId: slot.id, kind: slot.kind, ref });
    } else {
      slotTargets.current.delete(slot.id);
    }
  }, []);

  const handleDragStart = useCallback((item: BuilderAttraction, kind: SlotKind, x: number, y: number) => {
    setSelected(item);
    setSelectedKind(kind);
    dragPosition.setValue({ x, y });
    const next = { item, kind };
    draggingRef.current = next;
    setDragging(next);
  }, [dragPosition]);

  const handleCancelSelection = useCallback(() => {
    setSelected(null);
  }, []);

  const openExternalLink = useCallback(async (url: string) => {
    await openSafeExternalLink(url, lang);
  }, [lang]);

  const handleDragMove = useCallback((x: number, y: number) => {
    dragPosition.setValue({ x, y });
  }, [dragPosition]);

  const handleDragEnd = useCallback((x: number, y: number) => {
    const current = draggingRef.current;
    draggingRef.current = null;
    setDragging(null);
    if (!current) {
      setSelected(null);
      return;
    }

    const targets = [...slotTargets.current.values()].filter((target) => target.kind === current.kind && target.ref);
    if (targets.length === 0) {
      setSelected(null);
      return;
    }

    let pending = targets.length;
    let match: SlotTarget | null = null;
    targets.forEach((target) => {
      target.ref?.measureInWindow((slotX, slotY, width, height) => {
        if (!match && x >= slotX && x <= slotX + width && y >= slotY && y <= slotY + height) {
          match = target;
        }
        pending -= 1;
        if (pending === 0) {
          if (match) {
            placeItemInSlot(match.dayIdx, match.slotId, current.item, current.kind);
          } else {
            setSelected(null);
          }
        }
      });
    });
  }, [placeItemInSlot]);

  const handleRemove = useCallback((dayIdx: number, slotId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    removeAttraction(dayIdx, slotId);
  }, [removeAttraction]);

  const handleDeleteSlot = useCallback((dayIdx: number, slotId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    storeDeleteSlot(dayIdx, slotId);
  }, [storeDeleteSlot]);

  const handleAddSlot = useCallback((dayIdx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    storeAddSlot(dayIdx, "attraction");
  }, [storeAddSlot]);

  const handleAddMealSlot = useCallback((dayIdx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    storeAddSlot(dayIdx, "meal");
  }, [storeAddSlot]);

  const handleAddDay = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    storeAddDay();
  }, [storeAddDay]);

  const handleDockSlotPress = useCallback((slot: SlotData) => {
    if (slot.attraction) {
      setDockDetail({ dayIdx: activeDayIndex, slot });
      return;
    }
    setActiveSlotId((current) => current === slot.id ? null : slot.id);
  }, [activeDayIndex]);

  const handleDockDayChange = useCallback((direction: -1 | 1) => {
    const current = activeDayIndex >= 0 ? activeDayIndex : 0;
    const next = Math.min(days.length - 1, Math.max(0, current + direction));
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDay(days[next]?.day ?? 1);
    setActiveSlotId(null);
  }, [activeDayIndex, days]);

  const handleRemoveDockDetail = useCallback(() => {
    if (!dockDetail) return;
    handleRemove(dockDetail.dayIdx, dockDetail.slot.id);
    setDockDetail(null);
  }, [dockDetail, handleRemove]);

  const handleSetNote = useCallback((dayIdx: number, slotId: string, note: string) => {
    storeSetNote(dayIdx, slotId, note);
  }, [storeSetNote]);

  const handleToggleDay = useCallback((day: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = expandedDay === day ? 0 : day;
    setExpandedDay(next);
    if (next !== 0) {
      setTimeout(() => {
        const offset = dayOffsets.current.get(next);
        if (offset !== undefined) pianoScrollRef.current?.scrollTo({ y: offset, animated: true });
      }, 120);
    }
  }, [expandedDay, setExpandedDay]);

  const handleOptimizeDay = useCallback((dayIdx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    storeOptimizeDay(dayIdx);
  }, [storeOptimizeDay]);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Handler BuilderMap Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  const handleMapAddAttraction = useCallback((a: BuilderAttraction) => {
    placeItemFromList(a, "attraction");
  }, [placeItemFromList]);

  const handleMapAddFood = useCallback((food: BuilderAttraction, afterSlotId: string | null) => {
    const day = days[activeDayIndex];
    if (!day) return;

    const candidate: SlotData = { id: "__map_food_candidate__", kind: "meal", attraction: food };
    const nextSlots = [...day.slots];
    const afterIndex = afterSlotId === null ? -1 : nextSlots.findIndex((slot) => slot.id === afterSlotId);
    const insertIndex = afterSlotId === null ? 0 : afterIndex >= 0 ? afterIndex + 1 : nextSlots.length;
    nextSlots.splice(insertIndex, 0, candidate);
    const distanceKm = getDayStats({ ...day, slots: nextSlots }).distanceKm;

    const commit = () => storeMapAddFood(activeDayIndex, food, afterSlotId);
    if (distanceKm <= MANUAL_MAX_WALK_KM) {
      commit();
      return;
    }

    const distance = distanceKm.toFixed(1);
    confirmAction(
      lang === "es" ? "Confirmar adicion" : lang === "fr" ? "Confirmer l'ajout" : lang === "en" ? "Confirm addition" : "Conferma inserimento",
      (lang === "es"
        ? "Este restaurante llevaría el día a " + distance + " km a pie."
        : lang === "fr"
          ? "Ce restaurant porterait la journee a " + distance + " km a pied."
          : lang === "en"
            ? "This restaurant would bring the day to " + distance + " km on foot."
            : "Questo ristorante porterebbe il giorno a " + distance + " km a piedi.")
        + "\n"
        + (lang === "es" ? "Quieres anadirlo de todos modos?" : lang === "fr" ? "Voulez-vous l'ajouter quand meme ?" : lang === "en" ? "Do you want to add it anyway?" : "Vuoi inserirlo comunque?"),
      commit,
    );
  }, [activeDayIndex, confirmAction, days, lang, storeMapAddFood]);

  const handleMapRemove = useCallback((slotId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    removeAttraction(activeDayIndex, slotId);
  }, [activeDayIndex, removeAttraction]);

  const handleMapReorder = useCallback((newSlotIds: string[]) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    mapReorderSlots(activeDayIndex, newSlotIds);
  }, [activeDayIndex, mapReorderSlots]);

  const handleView = async () => {
    if (totalAttractionsPlaced === 0) {
      if (Platform.OS === "web") {
        window.alert(lang === "es" ? "Añade al menos una atracción para ver el itinerario." : lang === "fr" ? "Ajoutez au moins une attraction pour afficher l'itinéraire." : lang === "en" ? "Add at least one attraction to view the itinerary." : "Aggiungi almeno un'attrazione per visualizzare l'itinerario.");
      } else {
        Alert.alert(
          lang === "es" ? "Ninguna atraccion" : lang === "fr" ? "Aucune attraction" : lang === "en" ? "No attractions" : "Nessuna attrazione",
          lang === "es" ? "Añade al menos una atracción para ver el itinerario." : lang === "fr" ? "Ajoutez au moins une attraction pour afficher l'itinéraire." : lang === "en" ? "Add at least one attraction to view the itinerary." : "Aggiungi almeno un'attrazione per visualizzare l'itinerario.",
        );
      }
      return;
    }
    const itineraryDays = days
      .map((d) => {
        const stops = d.slots
          .filter((s) => s.kind === "attraction" && s.attraction !== null)
          .map((s) => ({
            ...s.attraction!,
            type: "attraction" as const,
            tags: s.attraction!.tags ?? [],
            is_food_spot: false,
            notes: s.note?.trim() || undefined,
          }));
        const restaurants = d.slots
          .filter((s) => s.kind === "meal" && s.attraction !== null)
          .map((s) => {
            const food = s.attraction!;
            const displayName = localizedName(food, lang) || food.name;
            const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${displayName} ${localizedCityLabel(city, lang)}`)}`;
            return {
              id: food.id,
              name: food.name,
              name_en: food.name_en,
              name_fr: food.name_fr,
              name_es: food.name_es,
              description: s.note?.trim() || undefined,
              food_type: food.food_type ?? food.attraction_type ?? undefined,
              meal_type: food.meal_type ?? "both",
              rating: food.rating ?? undefined,
              latitude: food.latitude,
              longitude: food.longitude,
              maps_link: mapsLink,
            };
          });
        const mapsLink = stops.length >= 2
          ? "https://www.google.com/maps/dir/" + stops.map((s) => mapsWaypoint(s, city, lang)).join("/") + "?travelmode=walking"
          : "";
        return { day: d.day, stops, maps_link: mapsLink, restaurants };
      })

    const itinerary = {
      city, num_days: days.length, level: [1, 2, 3], creation_mode: "manual" as const, max_walk_km: MANUAL_MAX_WALK_KM,
      days: itineraryDays, food_recommendations: foods, culture_facts: cultureFacts,
    };
    const validated = normalizeItineraryStructure(itinerary, lang);
    if (!validated.itinerary) {
      showMessage(
        lang === "es" ? "Itinerario incompleto" : lang === "fr" ? "Itinéraire incomplet" : lang === "en" ? "Incomplete itinerary" : "Itinerario incompleto",
        lang === "es" ? "Añade al menos una etapa válida a cada día." : lang === "fr" ? "Ajoutez au moins une étape valide à chaque journée." : lang === "en" ? "Add at least one valid stop to every day." : "Aggiungi almeno una tappa valida a ogni giorno.",
      );
      return;
    }
    await AsyncStorage.setItem("wayra_pending_itinerary", JSON.stringify(validated.itinerary));
    await removeManualBuilderDraft().catch(() => undefined);
    void cacheCityForOffline(city).catch(() => {});
    router.push({ pathname: "/itinerary" });
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬ Render Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  // Guard: mostra loading finchÃƒÂ© il builder store non ha inizializzato i giorni
  if (!builderHydrated || days.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]} edges={["top", "bottom"]}>
        <ActivityIndicator color={colors.accentGold} size="large" />
      </SafeAreaView>
    );
  }

  const currentCategories = activeTab === "food" ? foodCategories : attractionCategories;
  const selectedGuide = lang === "es"
    ? MANUAL_GUIDE_SLIDES_ES
    : lang === "fr"
      ? MANUAL_GUIDE_SLIDES_FR
      : lang === "en"
        ? MANUAL_GUIDE_SLIDES_EN
        : MANUAL_GUIDE_SLIDES_IT;
  const helpIconByTarget: Record<string, keyof typeof Ionicons.glyphMap> = {
    header: "compass-outline",
    guide: "help-circle-outline",
    settings: "settings-outline",
    tabs: "albums-outline",
    search: "search-outline",
    plan: "calendar-outline",
    list: "list-outline",
    view: "eye-outline",
  };
  const manualHelp = selectedGuide.reduce<Record<string, ContextHelpContent>>((result, { target, title, body }) => {
    const previous = result[target];
    result[target] = {
      icon: helpIconByTarget[target] ?? "help-circle-outline",
      title: previous?.title ?? title,
      body: previous ? `${previous.body}\n\n${body}` : body,
    };
    return result;
  }, {});
  const headerHelp = manualHelp.header;
  const tabsHelp = manualHelp.tabs;
  const searchHelp = manualHelp.search;

  return (
    <SafeAreaView ref={guideRootRef} style={styles.safe} edges={["top", "bottom"]}>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Header Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <View
        collapsable={false}
        ref={(ref) => setGuideTarget("header", ref)}
        style={[styles.header, contextHelpOutline(contextHelp.active, colors.accentGold)]}
      >
        <TouchableOpacity
          onPress={contextHelp.guard({ ...headerHelp, title: lang === "es" ? "Volver" : lang === "fr" ? "Retour" : lang === "en" ? "Back" : "Indietro" }, () => router.back())}
          style={[styles.backBtn, contextHelpOutline(contextHelp.active, colors.accentGold)]}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={lang === "es" ? "Volver" : lang === "fr" ? "Retour" : lang === "en" ? "Back" : "Indietro"}
        >
          <Ionicons name="chevron-back" size={22} color={colors.accentGold} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {cityLabel || city.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </Text>
          <Text style={styles.headerSub}>
            {days.length} {days.length === 1 ? (lang === "es" ? "día" : lang === "fr" ? "jour" : lang === "en" ? "day" : "giorno") : (lang === "es" ? "días" : lang === "fr" ? "jours" : lang === "en" ? "days" : "giorni")}
            {totalAttractionsPlaced > 0 ? ` \u00B7 ${totalAttractionsPlaced} ${lang === "es" ? "añadidas" : lang === "fr" ? "ajoutées" : lang === "en" ? "placed" : "inserite"}` : ""}
          </Text>
        </View>
        <TouchableOpacity
          ref={(ref) => setGuideTarget("guide", ref)}
          onPress={contextHelp.toggle}
          activeOpacity={0.7}
          style={[styles.flagBtn, styles.guideBtn]}
          accessibilityLabel={lang === "es" ? "Abrir la guía" : lang === "fr" ? "Ouvrir le guide" : lang === "en" ? "Open guide" : "Apri guida"}
          accessibilityRole="button"
          accessibilityState={{ expanded: contextHelp.active }}
          hitSlop={6}
        >
          <Ionicons name={contextHelp.active ? "close" : "help-circle-outline"} size={22} color={colors.accentGold} />
        </TouchableOpacity>
        <TouchableOpacity
          ref={(ref) => setGuideTarget("settings", ref)}
          onPress={contextHelp.guard(manualHelp.settings, () => setShowSettings(true))}
          activeOpacity={0.7}
          style={[styles.flagBtn, contextHelpOutline(contextHelp.active, colors.accentGold)]}
          accessibilityLabel={lang === "es" ? "Configuración" : lang === "fr" ? "Paramètres" : lang === "en" ? "Settings" : "Impostazioni"}
          accessibilityRole="button"
          hitSlop={6}
        >
          <Ionicons name="settings-outline" size={19} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          ref={(ref) => setGuideTarget("view", ref)}
          style={[styles.viewBtn, totalAttractionsPlaced === 0 && styles.viewBtnDisabled, contextHelpOutline(contextHelp.active, colors.accentGold)]}
          onPress={contextHelp.guard(manualHelp.view, handleView)}
          activeOpacity={0.8}
          disabled={!contextHelp.active && totalAttractionsPlaced === 0}
          accessibilityRole="button"
          accessibilityLabel={lang === "es" ? "Ver itinerario" : lang === "fr" ? "Voir l'itinéraire" : lang === "en" ? "View itinerary" : "Vedi itinerario"}
          accessibilityState={{ disabled: !contextHelp.active && totalAttractionsPlaced === 0 }}
        >
          <Ionicons name="eye-outline" size={15} color={totalAttractionsPlaced > 0 ? colors.bg : colors.textMuted} />
          <Text style={[styles.viewBtnText, totalAttractionsPlaced === 0 && { color: colors.textMuted }]}>
            {lang === "es" ? "Ver" : lang === "fr" ? "Voir" : lang === "en" ? "View" : "Vedi"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Tab bar Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <View collapsable={false} ref={(ref) => setGuideTarget("tabs", ref)} style={[styles.tabBar, contextHelpOutline(contextHelp.active, colors.accentGold)]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "attractions" && styles.tabActive, contextHelpOutline(contextHelp.active, colors.accentGold)]}
          onPress={contextHelp.guard({ ...tabsHelp, title: lang === "es" ? "Lugares" : lang === "fr" ? "Attractions" : lang === "en" ? "Places" : "Attrazioni" }, () => handleSwitchTab("attractions"))}
          activeOpacity={0.8}
        >
          <Text style={styles.tabEmoji}>{"\u{1F4CC}"}</Text>
          <Text style={[styles.tabLabel, activeTab === "attractions" && styles.tabLabelActive]}>
            {lang === "es" ? "Lugares" : lang === "fr" ? "Attractions" : lang === "en" ? "Places" : "Attrazioni"}
          </Text>
          {available.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{available.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "food" && styles.tabActiveFood, contextHelpOutline(contextHelp.active, colors.accentGold)]}
          onPress={contextHelp.guard({ ...tabsHelp, icon: "restaurant-outline", title: lang === "es" ? "Comida" : lang === "fr" ? "Repas" : lang === "en" ? "Food" : "Pasti" }, () => handleSwitchTab("food"))}
          activeOpacity={0.8}
        >
          <Text style={styles.tabEmoji}>{"\u{1F37D}\u{FE0F}"}</Text>
          <Text style={[styles.tabLabel, activeTab === "food" && styles.tabLabelActiveFood]}>
            {lang === "es" ? "Comida" : lang === "fr" ? "Repas" : lang === "en" ? "Food" : "Pasti"}
          </Text>
          {availableFood.length > 0 && (
            <View style={[styles.tabBadge, styles.tabBadgeFood]}>
              <Text style={styles.tabBadgeText}>{availableFood.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "piano" && styles.tabActivePiano, contextHelpOutline(contextHelp.active, colors.accentGold)]}
          onPress={contextHelp.guard({ ...tabsHelp, icon: "calendar-outline", title: lang === "es" ? "Plan" : lang === "fr" ? "Plan" : lang === "en" ? "Plan" : "Piano" }, () => setActiveTab("piano"))}
          activeOpacity={0.8}
        >
          <Text style={styles.tabEmoji}>{"\u{1F4C6}"}</Text>
          <Text style={[styles.tabLabel, activeTab === "piano" && styles.tabLabelActivePiano]}>
            {lang === "es" ? "Plan" : lang === "fr" ? "Plan" : lang === "en" ? "Plan" : "Piano"}
          </Text>
          {totalAttractionsPlaced > 0 && (
            <View style={[styles.tabBadge, styles.tabBadgePiano]}>
              <Text style={styles.tabBadgeText}>{totalAttractionsPlaced}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Contenuto tab Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <View style={styles.tabContent}>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ TAB ATTRAZIONI Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {(activeTab === "attractions" || activeTab === "food") && (
          <>
            {/* Barra ricerca + filtro */}
            <View collapsable={false} ref={(ref) => setGuideTarget("search", ref)} style={[styles.searchRow, contextHelpOutline(contextHelp.active, colors.accentGold)]}>
              <View style={[styles.searchBar, contextHelpOutline(contextHelp.active, colors.accentGold)]}>
                <Ionicons name="search-outline" size={15} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={(v) => { setSearch(v); setActiveCategories([]); }}
                  placeholder={lang === "es" ? "Buscar..." : lang === "fr" ? "Rechercher..." : lang === "en" ? "Search..." : "Cerca..."}
                  placeholderTextColor={colors.textMuted}
                  selectionColor={colors.accentGold}
                  returnKeyType="search"
                  editable={!contextHelp.active}
                  onPressIn={() => { if (contextHelp.active) contextHelp.explain(searchHelp); }}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={contextHelp.guard(searchHelp, () => setSearch(""))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[styles.filterBtn, activeCategories.length > 0 && styles.filterBtnActive, contextHelpOutline(contextHelp.active, colors.accentGold)]}
                onPress={contextHelp.guard({ ...searchHelp, icon: "options-outline" }, () => setShowFilterModal(true))}
                activeOpacity={0.8}
              >
                <Ionicons name="options-outline" size={16} color={activeCategories.length > 0 ? colors.accentGold : colors.textMuted} />
                {activeCategories.length > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeCategories.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mapToggleBtn, contextHelpOutline(contextHelp.active, colors.accentGold)]}
                onPress={contextHelp.guard({ ...manualHelp.list, icon: "map-outline", title: lang === "es" ? "Mapa" : lang === "fr" ? "Carte" : lang === "en" ? "Map" : "Mappa" }, () => setMapVisible(true))}
                activeOpacity={0.8}
              >
                <Ionicons name="map-outline" size={16} color={colors.accentGold} />
              </TouchableOpacity>
            </View>

            {/* Contatore */}
            {activeTab === "attractions" && attractions.length > 0 && (
              <Text style={styles.totalCount}>
                {available.length < attractions.length ? `${available.length} / ${attractions.length}` : `${attractions.length}`}
                {" "}{lang === "es" ? "lugares disponibles" : lang === "fr" ? "attractions disponibles" : lang === "en" ? "places available" : "attrazioni disponibili"}
              </Text>
            )}
            {activeTab === "food" && foodSpots.length > 0 && (
              <Text style={styles.totalCount}>
                {availableFood.length < foodSpots.length ? `${availableFood.length} / ${foodSpots.length}` : `${foodSpots.length}`}
                {" "}{lang === "es" ? "sitios disponibles" : lang === "fr" ? "adresses disponibles" : lang === "en" ? "spots available" : "posti disponibili"}
              </Text>
            )}

            <View style={styles.builderWorkspace}>
              <View collapsable={false} ref={(ref) => setGuideTarget("plan", ref)} style={[styles.builderPlanPane, contextHelpOutline(contextHelp.active, colors.accentGold)]}>
                <Text style={styles.builderPaneTitle}>
                  {lang === "es" ? "Espacios del día" : lang === "fr" ? "Emplacements du jour" : lang === "en" ? "Daily slots" : "Slot giornalieri"}
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.builderPlanScroll}>
                  {days.map((d, dayIdx) => (
                    <DayRow
                      key={d.day}
                      day={d}
                      dayIdx={dayIdx}
                      expanded={expandedDay === d.day}
                      placementMode={selected !== null}
                      placementKind={selectedKind}
                      lang={lang}
                      showAddControls
                       onToggle={contextHelp.guard(manualHelp.plan, () => handleToggleDay(d.day))}
                       onTapSlot={(slot) => contextHelp.active ? contextHelp.explain(manualHelp.plan) : handleTapSlot(dayIdx, slot)}
                       onRemove={(slotId) => contextHelp.active ? contextHelp.explain(manualHelp.plan) : handleRemove(dayIdx, slotId)}
                       onDeleteSlot={(slotId) => contextHelp.active ? contextHelp.explain(manualHelp.plan) : handleDeleteSlot(dayIdx, slotId)}
                       onAddSlot={contextHelp.guard(manualHelp.plan, () => handleAddSlot(dayIdx))}
                       onAddMealSlot={contextHelp.guard(manualHelp.plan, () => handleAddMealSlot(dayIdx))}
                      onSlotRef={(slot, ref) => handleSlotRef(dayIdx, slot, ref)}
                       onSetNote={(slotId, note) => contextHelp.active ? contextHelp.explain(manualHelp.plan) : handleSetNote(dayIdx, slotId, note)}
                       onOptimize={contextHelp.guard(manualHelp.plan, () => handleOptimizeDay(dayIdx))}
                    />
                  ))}
                  {days.length < 15 && (
                    <TouchableOpacity style={[styles.addDayBtn, contextHelpOutline(contextHelp.active, colors.accentGold)]} onPress={contextHelp.guard(manualHelp.plan, handleAddDay)} activeOpacity={0.7}>
                      <Ionicons name="add" size={15} color={colors.accentGold} />
                      <Text style={styles.addDayBtnText}>
                        {lang === "es" ? "Añadir día" : lang === "fr" ? "Ajouter un jour" : lang === "en" ? "Add day" : "Aggiungi giorno"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>

              <View collapsable={false} ref={(ref) => setGuideTarget("list", ref)} style={[styles.builderListPane, contextHelpOutline(contextHelp.active, colors.accentGold)]}>
            {/* Lista */}
            {activeTab === "attractions" ? (
              loading ? (
                <SkeletonList count={6} />
              ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : (
                <FlashList
                  ref={attrListRef}
                  data={available}
                  keyExtractor={(a) => String(a.id)}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listScroll}
                  renderItem={({ item: a }) => (
                    <AttractionCard
                      attraction={a}
                      isFood={false}
                      selected={selected?.id === a.id}
                      distance={distanceMap.get(a.id)}
                      lang={lang}
                       onPress={contextHelp.guard(manualHelp.list, () => handleSelectAttraction(a, "attraction"))}
                       onDragStart={(x, y) => contextHelp.active ? contextHelp.explain(manualHelp.list) : handleDragStart(a, "attraction", x, y)}
                       onDragMove={contextHelp.active ? () => {} : handleDragMove}
                       onDragEnd={contextHelp.active ? () => {} : handleDragEnd}
                    />
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      {search || activeCategories.length > 0
                        ? (lang === "es" ? "Sin resultados" : lang === "fr" ? "Aucun résultat" : lang === "en" ? "No results" : "Nessun risultato")
                        : (lang === "es" ? "¡Todas añadidas! \u{1F389}" : lang === "fr" ? "Toutes ajoutées ! \u{1F389}" : lang === "en" ? "All placed! \u{1F389}" : "Tutte inserite! \u{1F389}")}
                    </Text>
                  }
                />
              )
            ) : (
              foodLoading ? (
                <SkeletonList count={5} />
              ) : foodError ? (
                <Text style={styles.errorText}>{foodError}</Text>
              ) : (
                <FlashList
                  ref={foodListRef}
                  data={availableFood}
                  keyExtractor={(a) => String(a.id)}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listScroll}
                  renderItem={({ item: a }) => (
                    <AttractionCard
                      attraction={a}
                      isFood={true}
                      selected={selected?.id === a.id}
                      distance={distanceMap.get(a.id)}
                      lang={lang}
                       onPress={contextHelp.guard(manualHelp.list, () => handleSelectAttraction(a, "meal"))}
                       onDragStart={(x, y) => contextHelp.active ? contextHelp.explain(manualHelp.list) : handleDragStart(a, "meal", x, y)}
                       onDragMove={contextHelp.active ? () => {} : handleDragMove}
                       onDragEnd={contextHelp.active ? () => {} : handleDragEnd}
                    />
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      {search || activeCategories.length > 0
                        ? (lang === "es" ? "Sin resultados" : lang === "fr" ? "Aucun résultat" : lang === "en" ? "No results" : "Nessun risultato")
                        : (lang === "es" ? "¡Todos añadidos! \u{1F389}" : lang === "fr" ? "Tous ajoutés ! \u{1F389}" : lang === "en" ? "All placed! \u{1F389}" : "Tutti inseriti! \u{1F389}")}
                    </Text>
                  }
                />
              )
            )}
              </View>
            </View>
          </>
        )}

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ TAB PIANO Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {activeTab === "piano" && (
          <ScrollView
            ref={pianoScrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pianoScroll}
          >
            {days.map((d, dayIdx) => (
              <View
                key={d.day}
                onLayout={(e) => { dayOffsets.current.set(d.day, e.nativeEvent.layout.y); }}
              >
                <DayRow
                  day={d}
                  dayIdx={dayIdx}
                  expanded={expandedDay === d.day}
                  placementMode={selected !== null}
                  placementKind={selectedKind}
                  lang={lang}
                  onToggle={contextHelp.guard(manualHelp.plan, () => handleToggleDay(d.day))}
                  onTapSlot={(slot) => contextHelp.active ? contextHelp.explain(manualHelp.plan) : handleTapSlot(dayIdx, slot)}
                  onRemove={(slotId) => contextHelp.active ? contextHelp.explain(manualHelp.plan) : handleRemove(dayIdx, slotId)}
                  onDeleteSlot={(slotId) => contextHelp.active ? contextHelp.explain(manualHelp.plan) : handleDeleteSlot(dayIdx, slotId)}
                  onSlotRef={(slot, ref) => handleSlotRef(dayIdx, slot, ref)}
                  onSetNote={(slotId, note) => contextHelp.active ? contextHelp.explain(manualHelp.plan) : handleSetNote(dayIdx, slotId, note)}
                  onOptimize={contextHelp.guard(manualHelp.plan, () => handleOptimizeDay(dayIdx))}
                />
              </View>
            ))}
            {days.length < 15 && (
              <TouchableOpacity style={[styles.addDayBtn, styles.addDayBtnPiano, contextHelpOutline(contextHelp.active, colors.accentGold)]} onPress={contextHelp.guard(manualHelp.plan, handleAddDay)} activeOpacity={0.7}>
                <Ionicons name="add" size={15} color={colors.accentGold} />
                <Text style={styles.addDayBtnText}>
                  {lang === "es" ? "Añadir día" : lang === "fr" ? "Ajouter un jour" : lang === "en" ? "Add day" : "Aggiungi giorno"}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </View>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Modal filtro categorie Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <Modal visible={showFilterModal} transparent animationType="fade" onRequestClose={() => setShowFilterModal(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowFilterModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.filterModal} onPress={() => {}}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>{lang === "es" ? "Filtrar por tipo" : lang === "fr" ? "Filtrer par type" : lang === "en" ? "Filter by type" : "Filtra per tipo"}</Text>
              <TouchableOpacity onPress={() => setActiveCategories([])} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.filterModalReset}>{lang === "es" ? "Restablecer" : lang === "fr" ? "Reinitialiser" : lang === "en" ? "Reset" : "Azzera"}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.filterModalList}>
              {currentCategories.map((cat) => {
                const checked = activeCategories.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    style={styles.filterModalItem}
                    onPress={() => setActiveCategories((prev) => checked ? prev.filter((c) => c !== cat) : [...prev, cat])}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked && <Ionicons name="checkmark" size={11} color={colors.bg} />}
                    </View>
                    <Text style={[styles.filterModalItemText, checked && styles.filterModalItemTextChecked]}>
                      {translateType(cat, lang) ?? cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.filterModalDone} onPress={() => setShowFilterModal(false)} activeOpacity={0.8}>
              <Text style={styles.filterModalDoneText}>
                {lang === "es" ? "Aplicar" : lang === "fr" ? "Appliquer" : lang === "en" ? "Apply" : "Applica"}{activeCategories.length > 0 ? ` (${activeCategories.length})` : ""}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Barra selezione attiva Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <Modal visible={dockDetail !== null} transparent animationType="fade" onRequestClose={() => setDockDetail(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setDockDetail(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.detailModal} onPress={() => {}}>
            {dockDetail?.slot.attraction && (
              <>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailEmoji}>
                    {getEmoji(dockDetail.slot.attraction.attraction_type, dockDetail.slot.kind === "meal")}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailTitle} numberOfLines={2}>
                      {localizedName(dockDetail.slot.attraction, lang)}
                    </Text>
                    <Text style={styles.detailMeta}>
                      {dockDetail.slot.kind === "meal"
                        ? (lang === "es" ? "Espacio de comida" : lang === "fr" ? "Etape repas" : lang === "en" ? "Meal slot" : "Slot pasto")
                        : (translateType(dockDetail.slot.attraction.attraction_type, lang) ?? (lang === "es" ? "Atraccion" : lang === "fr" ? "Attraction" : lang === "en" ? "Attraction" : "Attrazione"))}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDockDetail(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.detailDescription}>
                  {localizedDescription(dockDetail.slot.attraction, lang)}
                </Text>
                <View style={styles.detailActionsRow}>
                  <TouchableOpacity
                    style={styles.detailMapBtn}
                    onPress={() => openExternalLink(mapsSearchUrl(dockDetail.slot.attraction!, city, lang))}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="map-outline" size={16} color={colors.bg} />
                    <Text style={styles.detailMapText}>{lang === "es" ? "Mapa" : lang === "fr" ? "Carte" : lang === "en" ? "Maps" : "Mappe"}</Text>
                  </TouchableOpacity>
                  {isMuseum(dockDetail.slot.attraction) && !!dockDetail.slot.attraction.ticket_url && (
                    <TouchableOpacity
                      style={styles.detailTicketBtn}
                      onPress={() => openExternalLink(dockDetail.slot.attraction!.ticket_url!)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="ticket-outline" size={16} color={colors.text} />
                      <Text style={styles.detailTicketText}>
                        {lang === "es" ? "Entradas" : lang === "fr" ? "Billets" : lang === "en" ? "Tickets" : "Biglietti"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={attractionDetail !== null} transparent animationType="fade" onRequestClose={() => setAttractionDetail(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setAttractionDetail(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.detailModal} onPress={() => {}}>
            {attractionDetail && (
              <>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailEmoji}>
                    {getEmoji(attractionDetail.item.attraction_type, attractionDetail.kind === "meal")}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailTitle} numberOfLines={3}>
                      {localizedName(attractionDetail.item, lang)}
                    </Text>
                    <Text style={[styles.detailMeta, attractionDetail.kind === "meal" && styles.detailMetaMeal]}>
                      {attractionDetail.kind === "meal"
                        ? priceLabel(attractionDetail.item.category_level)
                        : (translateType(attractionDetail.item.attraction_type, lang) ?? (lang === "es" ? "Atraccion" : lang === "fr" ? "Attraction" : lang === "en" ? "Attraction" : "Attrazione"))}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setAttractionDetail(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.detailDescriptionScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.detailDescription}>
                    {localizedDescription(attractionDetail.item, lang) || (lang === "es" ? "Descripción no disponible." : lang === "fr" ? "Description non disponible." : lang === "en" ? "No description available." : "Descrizione non disponibile.")}
                  </Text>
                </ScrollView>
                <View style={styles.detailActionsRow}>
                  <TouchableOpacity
                    style={styles.detailMapBtn}
                    onPress={() => openExternalLink(mapsSearchUrl(attractionDetail.item, city, lang))}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="map-outline" size={16} color={colors.bg} />
                    <Text style={styles.detailMapText}>{lang === "es" ? "Mapa" : lang === "fr" ? "Carte" : lang === "en" ? "Maps" : "Mappe"}</Text>
                  </TouchableOpacity>
                  {isMuseum(attractionDetail.item) && !!attractionDetail.item.ticket_url && (
                    <TouchableOpacity
                      style={styles.detailTicketBtn}
                      onPress={() => openExternalLink(attractionDetail.item.ticket_url!)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="ticket-outline" size={16} color={colors.text} />
                      <Text style={styles.detailTicketText}>
                        {lang === "es" ? "Entradas" : lang === "fr" ? "Billets" : lang === "en" ? "Tickets" : "Biglietti"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {dragging && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.dragPreview,
            {
              left: -110,
              top: -28,
              transform: [
                { translateX: dragPosition.x },
                { translateY: dragPosition.y },
              ],
            },
            dragging.kind === "meal" && styles.dragPreviewMeal,
          ]}
        >
          <Text style={styles.dragPreviewEmoji}>{getEmoji(dragging.item.attraction_type, dragging.kind === "meal")}</Text>
          <Text style={styles.dragPreviewName} numberOfLines={1}>
            {localizedName(dragging.item, lang)}
          </Text>
        </Animated.View>
      )}

      <ContextHelpUI controller={contextHelp} lang={lang} />

      {selected && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionEmoji}>
            {getEmoji(selected.attraction_type, selectedKind === "meal")}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectionName} numberOfLines={1}>
              {localizedName(selected, lang)}
            </Text>
            <Text style={styles.selectionHint}>
              {activeTab === "piano"
                ? (lang === "es" ? "Toca un espacio vacio para anadirla" : lang === "fr" ? "Touchez un emplacement vide pour l'ajouter" : lang === "en" ? "Tap an empty slot to place it" : "Tocca uno slot vuoto per inserirla")
                : (lang === "es" ? "Toca un espacio de la izquierda para anadirla" : lang === "fr" ? "Touchez un emplacement a gauche pour l'ajouter" : lang === "en" ? "Tap a slot on the left to place it" : "Tocca uno slot a sinistra per inserirla")}
            </Text>
          </View>
          <TouchableOpacity onPress={handleCancelSelection} style={styles.cancelBtn} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <BuilderMap
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        lang={lang}
        dayLabel={lang === "es" ? `Día ${activeDay?.day ?? 1}` : lang === "fr" ? `Jour ${activeDay?.day ?? 1}` : lang === "en" ? `Day ${activeDay?.day ?? 1}` : `Giorno ${activeDay?.day ?? 1}`}
        attractions={mapAttractions}
        foodSpots={mapFoodSpots}
        currentSlots={currentMapSlots}
        onAddAttraction={handleMapAddAttraction}
        onAddFood={handleMapAddFood}
        onRemove={handleMapRemove}
        onReorder={handleMapReorder}
      />
    </SafeAreaView>
  );
}

function DaySlotDock({
  day, dayIndex, dayCount, stats, activeSlotId, mode, lang,
  onPrevDay, onNextDay, onSlotPress, onAddSlot, onSummary,
}: {
  day: DayPlan;
  dayIndex: number;
  dayCount: number;
  stats: DayStats;
  activeSlotId: string | null;
  mode: SlotKind;
  lang: string;
  onPrevDay: () => void;
  onNextDay: () => void;
  onSlotPress: (slot: SlotData) => void;
  onAddSlot: () => void;
  onSummary: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const compatibleSlots = day.slots.filter((s) => s.kind === mode);
  const timeColor = stats.minutes >= 240 && stats.minutes <= MAX_ACTIVITY_MINUTES ? colors.accentGreen : colors.accentGold;
  const kmColor = stats.distanceKm <= MANUAL_MAX_WALK_KM ? colors.accentGreen : colors.danger;
  const museumColor = stats.museums <= MAX_MUSEUMS_PER_DAY ? colors.accentGreen : colors.danger;

  return (
    <View style={styles.dayDock}>
      <View style={styles.dayDockTop}>
        <TouchableOpacity
          onPress={onPrevDay}
          disabled={dayIndex <= 0}
          style={[styles.dayDockArrow, dayIndex <= 0 && styles.dayDockArrowDisabled]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={16} color={dayIndex <= 0 ? colors.textMuted : colors.accentGold} />
        </TouchableOpacity>
        <View style={styles.dayDockTitleWrap}>
          <Text style={styles.dayDockTitle}>
            {lang === "es" ? "Día" : lang === "fr" ? "Jour" : lang === "en" ? "Day" : "Giorno"} {day.day}
          </Text>
          <Text style={styles.dayDockSubtitle}>
            {mode === "meal"
              ? (lang === "es" ? "Toca una comida para añadirla" : lang === "fr" ? "Touchez un repas pour l'ajouter" : lang === "en" ? "Tap a meal to add it" : "Tocca un pasto per inserirlo")
              : (lang === "es" ? "Toca un lugar para añadirlo" : lang === "fr" ? "Touchez une attraction pour l'ajouter" : lang === "en" ? "Tap a place to add it" : "Tocca un'attrazione per inserirla")}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onNextDay}
          disabled={dayIndex >= dayCount - 1}
          style={[styles.dayDockArrow, dayIndex >= dayCount - 1 && styles.dayDockArrowDisabled]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={16} color={dayIndex >= dayCount - 1 ? colors.textMuted : colors.accentGold} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onSummary} style={styles.dayDockSummaryBtn} activeOpacity={0.75}>
          <Ionicons name="list-outline" size={15} color={colors.accentBlue} />
        </TouchableOpacity>
      </View>

      <View style={styles.dayDockMetrics}>
        <Text style={[styles.dayDockMetric, { color: timeColor }]}>{Math.floor(stats.minutes / 60)}h{stats.minutes % 60 ? ` ${stats.minutes % 60}m` : ""}</Text>
        <Text style={[styles.dayDockMetric, { color: kmColor }]}>{stats.distanceKm.toFixed(1)} / 4 km</Text>
        <Text style={[styles.dayDockMetric, { color: museumColor }]}>{stats.museums} / {MAX_MUSEUMS_PER_DAY} {lang === "es" ? "museos" : lang === "fr" ? "musées" : lang === "en" ? "museums" : "musei"}</Text>
        <Text style={styles.dayDockMetricMuted}>{stats.filled} {lang === "es" ? "espacios" : lang === "fr" ? "slots" : lang === "en" ? "slots" : "slot"}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayDockSlots}>
        {compatibleSlots.map((slot, idx) => {
          const filled = slot.attraction !== null;
          const active = activeSlotId === slot.id;
          const label = filled
            ? localizedName(slot.attraction!, lang)
            : mode === "meal"
              ? (lang === "es" ? "Comida" : lang === "fr" ? "Repas" : lang === "en" ? "Meal" : "Pasto")
              : (lang === "es" ? "Lugar" : lang === "fr" ? "Lieu" : lang === "en" ? "Place" : "Attrazione");
          return (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.dayDockSlot,
                mode === "meal" && styles.dayDockSlotMeal,
                active && styles.dayDockSlotActive,
                filled && styles.dayDockSlotFilled,
              ]}
              onPress={() => onSlotPress(slot)}
              activeOpacity={0.75}
            >
              <Text style={styles.dayDockSlotIndex}>{idx + 1}</Text>
              <Text style={[styles.dayDockSlotText, filled && styles.dayDockSlotTextFilled]} numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={styles.dayDockAddSlot} onPress={onAddSlot} activeOpacity={0.75}>
          <Ionicons name="add" size={15} color={mode === "meal" ? colors.accentGreen : colors.accentBlue} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ AttractionCard (full-width, piÃƒÂ¹ spaziosa) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function AttractionCard({
  attraction, isFood, selected, distance, lang, onPress, onDragStart, onDragMove, onDragEnd,
}: {
  attraction: BuilderAttraction;
  isFood: boolean;
  selected: boolean;
  distance?: number;
  lang: string;
  onPress: () => void;
  onDragStart: (x: number, y: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const dragStarted = useRef(false);
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_event, gesture: PanResponderGestureState) =>
      Math.abs(gesture.dx) > 6 && Math.abs(gesture.dx) >= Math.abs(gesture.dy) * 0.6,
    onMoveShouldSetPanResponderCapture: (_event, gesture: PanResponderGestureState) =>
      Math.abs(gesture.dx) > 6 && Math.abs(gesture.dx) >= Math.abs(gesture.dy) * 0.6,
    onPanResponderGrant: (_event, gesture) => {
      dragStarted.current = true;
      onDragStart(gesture.moveX, gesture.moveY);
    },
    onPanResponderMove: (_event, gesture) => {
      onDragMove(gesture.moveX, gesture.moveY);
    },
    onPanResponderRelease: (_event, gesture) => {
      onDragEnd(gesture.moveX, gesture.moveY);
      setTimeout(() => { dragStarted.current = false; }, 0);
    },
    onPanResponderTerminate: (_event, gesture) => {
      onDragEnd(gesture.moveX, gesture.moveY);
      setTimeout(() => { dragStarted.current = false; }, 0);
    },
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  }), [onDragEnd, onDragMove, onDragStart]);
  const color = isFood ? colors.accentGreen : (LEVEL_COLORS[attraction.category_level] ?? "#ccc");
  const isMuseum = !isFood && isMuseumType(attraction.attraction_type);
  const name = localizedName(attraction, lang);
  const emoji = getEmoji(attraction.attraction_type, isFood);
  const typeLabel = translateType(attraction.attraction_type, lang);

  return (
    <View
      {...panResponder.panHandlers}
      // @ts-ignore Ã¢â‚¬â€ cursor ÃƒÂ¨ proprietÃƒÂ  web non tipizzata in RN
      style={Platform.OS === "web" ? { cursor: "grab" } : undefined}
    >
      <TouchableOpacity
        style={[
          styles.attrCard,
          isMuseum && styles.attrCardMuseum,
          selected && (isFood ? styles.attrCardSelectedFood : styles.attrCardSelected),
        ]}
        onPress={() => { if (!dragStarted.current) onPress(); }}
        activeOpacity={0.8}
      >
        {/* Drag handle Ã¢â‚¬â€ visibile solo su web come affordance */}
        {Platform.OS === "web" && (
          <Ionicons
            name="reorder-three-outline"
            size={18}
            color={colors.textMuted}
            style={{ marginRight: 6, opacity: 0.5 }}
          />
        )}
        <View style={styles.attrInfo}>
          <View style={styles.attrTopRow}>
            <Text style={styles.attrEmoji}>{emoji}</Text>
            <Text style={styles.attrName} numberOfLines={2}>{name}</Text>
            {selected && <Ionicons name="checkmark-circle" size={18} color={isFood ? colors.accentGreen : colors.accentGold} />}
          </View>
          <View style={styles.attrMeta}>
            {isFood ? (
              <View style={[styles.typeChip, { borderColor: color + "55", backgroundColor: color + "18" }]}>
                <Text style={[styles.typeChipText, { color }]}>{priceLabel(attraction.category_level)}</Text>
              </View>
            ) : (
              typeLabel && (
                <View style={[styles.typeChip, { borderColor: color + "55", backgroundColor: color + "18" }]}>
                  <Text style={[styles.typeChipText, { color }]}>{typeLabel}</Text>
                </View>
              )
            )}
            {attraction.estimated_visit_time ? (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                <Text style={styles.metaText}>{attraction.estimated_visit_time} min</Text>
              </View>
            ) : null}
            {distance !== undefined && (
              <View style={styles.metaItem}>
                <Ionicons name="navigate-outline" size={11} color={colors.accentGreen} />
                <Text style={[styles.metaText, { color: colors.accentGreen }]}>{fmtDist(distance)}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ DayRow Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function DayRow({
  day, dayIdx, expanded, placementMode, placementKind, lang,
  showAddControls = false,
  onToggle, onTapSlot, onRemove, onDeleteSlot, onAddSlot, onAddMealSlot, onSlotRef, onSetNote, onOptimize,
}: {
  day: DayPlan; dayIdx: number; expanded: boolean;
  placementMode: boolean; placementKind: SlotKind; lang: string;
  showAddControls?: boolean;
  onToggle: () => void; onTapSlot: (slot: SlotData) => void;
  onRemove: (slotId: string) => void; onDeleteSlot: (slotId: string) => void;
  onAddSlot?: () => void; onAddMealSlot?: () => void;
  onSlotRef?: (slot: SlotData, ref: View | null) => void;
  onSetNote: (slotId: string, note: string) => void; onOptimize: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const filledCount = day.slots.filter((s) => s.attraction !== null).length;
  const stats = getDayStats(day);
  const canOptimize = (() => {
    let segCount = 0;
    for (const s of day.slots) {
      if (s.attraction === null) continue;
      if (s.kind === "meal") { segCount = 0; continue; }
      segCount++;
      if (segCount >= 2) return true;
    }
    return false;
  })();
  const totalMins = stats.minutes;
  const hh = Math.floor(totalMins / 60);
  const mm = totalMins % 60;
  const timeLabel = totalMins > 0 ? (hh > 0 ? `${hh}h${mm > 0 ? ` ${mm}min` : ""}` : `${mm}min`) : null;
  const metricTimeLabel = totalMins > 0 ? (hh > 0 ? `${hh}h${mm > 0 ? `${mm}` : ""}` : `${mm}m`) : "0m";
  const timeColor = stats.minutes > MAX_ACTIVITY_MINUTES ? colors.danger : stats.minutes >= 240 ? colors.accentGreen : colors.accentGold;
  const kmColor = stats.distanceKm > MANUAL_MAX_WALK_KM ? colors.danger : colors.accentGreen;
  const museumColor = stats.museums > MAX_MUSEUMS_PER_DAY ? colors.danger : colors.accentGreen;

  return (
    <View style={styles.dayRow}>
      <TouchableOpacity style={styles.dayHeader} onPress={onToggle} activeOpacity={0.8}>
        <View style={[styles.dayBadge, expanded && styles.dayBadgeActive]}>
          <Text style={[styles.dayBadgeText, expanded && styles.dayBadgeTextActive]}>{day.day}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.dayTitle} numberOfLines={1}>{lang === "es" ? "Día" : lang === "fr" ? "Jour" : lang === "en" ? "Day" : "Giorno"} {day.day}</Text>
          {timeLabel && <Text style={styles.dayTimeMeta}>{lang === "es" ? "Tiempo" : lang === "fr" ? "Temps" : lang === "en" ? "Time" : "Tempo"} {timeLabel}</Text>}
        </View>
        {filledCount > 0 && (
          <View style={styles.filledBadge}>
            <Text style={styles.filledBadgeText}>{filledCount}</Text>
          </View>
        )}
        {canOptimize && (
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation?.(); onOptimize(); }}
            style={styles.optimizeBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="shuffle-outline" size={15} color={colors.accentBlue} />
            <Text style={styles.optimizeBtnText}>{lang === "es" ? "Opt." : lang === "fr" ? "Opt." : lang === "en" ? "Opt." : "Ottim."}</Text>
          </TouchableOpacity>
        )}
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.dayBody}>
          <View style={styles.dayMetricsColumn}>
            <View style={styles.dayMetricChip}>
              <Text style={[styles.dayMetricText, { color: timeColor }]} numberOfLines={1}>{lang === "es" ? "Tiempo" : lang === "fr" ? "Temps" : lang === "en" ? "Time" : "Tempo"} {metricTimeLabel} / 7h</Text>
            </View>
            <View style={styles.dayMetricChip}>
              <Text style={[styles.dayMetricText, { color: kmColor }]} numberOfLines={1}>Km {stats.distanceKm.toFixed(1)} / 4</Text>
            </View>
            <View style={styles.dayMetricChip}>
              <Text style={[styles.dayMetricText, { color: museumColor }]} numberOfLines={1}>{lang === "es" ? "Museos" : lang === "fr" ? "Musées" : lang === "en" ? "Museums" : "Musei"} {stats.museums} / {MAX_MUSEUMS_PER_DAY}</Text>
            </View>
          </View>
          {day.slots.map((slot, idx) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              index={idx + 1}
              placementMode={placementMode}
              placementKind={placementKind}
              lang={lang}
              onTap={() => onTapSlot(slot)}
              onRemove={() => onRemove(slot.id)}
              onDelete={() => onDeleteSlot(slot.id)}
              onSlotRef={(ref) => onSlotRef?.(slot, ref)}
              onSetNote={(note) => onSetNote(slot.id, note)}
            />
          ))}
          {showAddControls && onAddSlot && onAddMealSlot && (
            <View style={styles.addSlotRow}>
              <TouchableOpacity style={styles.addSlotBtn} onPress={onAddSlot} activeOpacity={0.7}>
                <Ionicons name="add" size={14} color={colors.accentBlue} />
                <Text style={styles.addSlotText}>{"\u{1F3DB}\u{FE0F}"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addMealBtn} onPress={onAddMealSlot} activeOpacity={0.7}>
                <Ionicons name="add" size={14} color={colors.accentGreen} />
                <Text style={styles.addMealText}>{"\u{1F35D}"}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ SlotCard Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function SlotCard({
  slot, index, placementMode, placementKind, lang,
  onTap, onRemove, onDelete, onSlotRef, onSetNote,
}: {
  slot: SlotData; index: number;
  placementMode: boolean; placementKind: SlotKind; lang: string;
  onTap: () => void; onRemove: () => void; onDelete: () => void;
  onSlotRef?: (ref: View | null) => void;
  onSetNote: (note: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isFilled = slot.attraction !== null;
  const isMeal = slot.kind === "meal";
  const name = isFilled
    ? localizedName(slot.attraction!, lang)
    : null;
  const canReceive = placementMode && placementKind === slot.kind;

  if (isFilled) {
    return (
      <TouchableOpacity
        style={[
          styles.slotFilled,
          isMeal && styles.slotFilledMeal,
          !isMeal && isMuseumType(slot.attraction?.attraction_type) && styles.slotFilledMuseum,
        ]}
        onPress={onTap}
        activeOpacity={0.82}
      >
        {/* Colonna sinistra: numero sopra, cestino sotto */}
        <View style={styles.slotLeftCol}>
          <View style={[styles.slotIndex, isMeal && styles.slotIndexMeal]}>
            <Text style={[styles.slotIndexText, isMeal && styles.slotIndexTextMeal]}>{index}</Text>
          </View>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7} style={styles.slotDeleteBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
        {/* Emoji + nome: centrati insieme nella riga */}
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.slotEmoji}>{getEmoji(slot.attraction!.attraction_type, isMeal)}</Text>
          <Text style={styles.slotNameCompact} numberOfLines={3} ellipsizeMode="tail">{name}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      ref={(ref) => {
        onSlotRef?.(ref);
      }}
      style={[
        styles.slotEmpty,
        isMeal && styles.slotEmptyMeal,
        canReceive && (isMeal ? styles.slotEmptyMealActive : styles.slotEmptyActive),
      ]}
      onPress={canReceive ? onTap : undefined}
      activeOpacity={canReceive ? 0.7 : 1}
    >
      <View style={[styles.slotIndex, styles.slotIndexEmpty]}>
        <Text style={styles.slotIndexEmptyText}>{index}</Text>
      </View>
      <Ionicons
        name={isMeal ? "restaurant-outline" : "add-circle-outline"}
        size={16}
        color={canReceive ? (isMeal ? colors.accentGreen : colors.accentBlue) : colors.border2}
      />
      <View style={{ flex: 1 }} />
      <TouchableOpacity
        onPress={onDelete}
        style={{ marginLeft: "auto" }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={14} color={colors.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Styles Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function makeStyles(colors: any) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },

    // Ã¢â€â‚¬Ã¢â€â‚¬ Header Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    header: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 14, paddingVertical: 10,
      gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: {
      width: 36, height: 36, alignItems: "center", justifyContent: "center",
      borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border2, flexShrink: 0,
    },
    headerCenter: { flex: 1 },
    headerTitle: { color: colors.text, fontWeight: "700", fontSize: 16 },
    headerSub: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
    viewBtn: {
      flexDirection: "row", alignItems: "center", gap: 5,
      backgroundColor: colors.accentGold, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 8, flexShrink: 0,
    },
    viewBtnDisabled: { backgroundColor: colors.border },
    viewBtnText: { color: colors.bg, fontWeight: "800", fontSize: 13 },
    flagBtn: {
      width: 32, height: 32, borderRadius: 16, backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border2, alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    guideBtn: {
      borderColor: colors.accentGold + "70",
      backgroundColor: colors.accentGold + "14",
    },
    flagEmoji: { fontSize: 14 },

    // Ã¢â€â‚¬Ã¢â€â‚¬ Tab bar Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    tabBar: {
      flexDirection: "row",
      backgroundColor: colors.card2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 6, paddingVertical: 11, paddingHorizontal: 4,
      borderBottomWidth: 2, borderBottomColor: "transparent",
      position: "relative",
    },
    tabActive: { borderBottomColor: colors.accentGold, backgroundColor: colors.accentGold + "08" },
    tabActiveFood: { borderBottomColor: colors.accentGreen, backgroundColor: colors.accentGreen + "08" },
    tabActivePiano: { borderBottomColor: colors.accentBlue, backgroundColor: colors.accentBlue + "08" },
    tabEmoji: { fontSize: 15 },
    tabLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
    tabLabelActive: { color: colors.accentGold },
    tabLabelActiveFood: { color: colors.accentGreen },
    tabLabelActivePiano: { color: colors.accentBlue },
    tabBadge: {
      minWidth: 18, height: 18, borderRadius: 9,
      backgroundColor: colors.accentGold, alignItems: "center", justifyContent: "center",
      paddingHorizontal: 4,
    },
    tabBadgeFood: { backgroundColor: colors.accentGreen },
    tabBadgePiano: { backgroundColor: colors.accentBlue },
    tabBadgeText: { color: colors.bg, fontSize: 10, fontWeight: "800" },

    // Ã¢â€â‚¬Ã¢â€â‚¬ Tab content Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    tabContent: { flex: 1 },

    // Search
    searchRow: {
      flexDirection: "row", alignItems: "center", gap: 8,
      paddingHorizontal: 16, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    searchBar: {
      flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: colors.card, borderRadius: 10, borderWidth: 1,
      borderColor: colors.border2, paddingHorizontal: 12, paddingVertical: 8,
    },
    searchInput: { flex: 1, color: colors.textSub, fontSize: 14 },
    filterBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border2,
      alignItems: "center", justifyContent: "center",
    },
    filterBtnActive: { borderColor: colors.accentGold + "60", backgroundColor: colors.accentGold + "12" },
    mapToggleBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: colors.accentGold + "14", borderWidth: 1, borderColor: colors.accentGold + "44",
      alignItems: "center", justifyContent: "center",
    },
    filterBadge: {
      position: "absolute", top: -5, right: -5,
      width: 16, height: 16, borderRadius: 8,
      backgroundColor: colors.accentGold, alignItems: "center", justifyContent: "center",
    },
    filterBadgeText: { color: colors.bg, fontSize: 9, fontWeight: "800" },

    totalCount: {
      color: colors.textMuted, fontSize: 11, fontWeight: "600",
      textAlign: "center", paddingVertical: 5, letterSpacing: 0.3,
    },

    builderWorkspace: {
      flex: 1,
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 8,
    },
    builderPlanPane: {
      flex: 1,
      minWidth: 0,
    },
    builderListPane: {
      flex: 1,
      minWidth: 0,
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
      paddingLeft: 8,
    },
    builderPaneTitle: {
      color: colors.accentGold,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 8,
      paddingHorizontal: 2,
    },
    builderPlanScroll: { paddingBottom: 24 },
    listScroll: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 24 },
    pianoScroll: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 100 },

    errorText: { color: colors.danger, fontSize: 13, padding: 16, lineHeight: 19 },
    emptyText: { color: colors.textMuted, fontSize: 13, textAlign: "center", marginTop: 32 },

    // Ã¢â€â‚¬Ã¢â€â‚¬ Attraction card (full-width) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    attrCard: {
      flexDirection: "row", alignItems: "flex-start",
      backgroundColor: colors.card, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border2,
      padding: 12, marginBottom: 10,
    },
    attrCardSelected: { borderColor: colors.accentGold, backgroundColor: colors.accentGold + "0c" },
    attrCardSelectedFood: { borderColor: colors.accentGreen, backgroundColor: colors.accentGreen + "0c" },
    attrCardMuseum: { borderColor: colors.accentPurple + "66", backgroundColor: colors.accentPurple + "15" },
    attrEmoji: { fontSize: 22, flexShrink: 0, lineHeight: 25 },
    attrInfo: { flex: 1 },
    attrTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
    attrName: { flex: 1, color: colors.text, fontSize: 15, fontWeight: "700", lineHeight: 20, marginBottom: 4, minWidth: 0 },
    attrDesc: { color: colors.textSub, fontSize: 12, lineHeight: 17, marginBottom: 8 },
    attrMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
    typeChip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
    typeChipText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    metaText: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },

    // Bottom day dock
    dayDock: {
      backgroundColor: colors.card2,
      borderTopWidth: 1,
      borderTopColor: colors.border2,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 14,
      gap: 10,
    },
    dayDockTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    dayDockArrow: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border2,
      alignItems: "center",
      justifyContent: "center",
    },
    dayDockArrowDisabled: { opacity: 0.55 },
    dayDockTitleWrap: { flex: 1 },
    dayDockTitle: { color: colors.text, fontSize: 15, fontWeight: "800" },
    dayDockSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    dayDockSummaryBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.accentBlue + "12",
      borderWidth: 1,
      borderColor: colors.accentBlue + "38",
      alignItems: "center",
      justifyContent: "center",
    },
    dayDockMetrics: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      flexWrap: "wrap",
    },
    dayDockMetric: {
      fontSize: 11,
      fontWeight: "800",
      backgroundColor: colors.card,
      borderRadius: 7,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    dayDockMetricMuted: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: "700",
      backgroundColor: colors.card,
      borderRadius: 7,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    dayDockSlots: {
      gap: 8,
      paddingRight: 8,
    },
    dayDockSlot: {
      width: 132,
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border2,
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 8,
    },
    dayDockSlotMeal: {
      borderColor: colors.accentGreen + "40",
      backgroundColor: colors.accentGreen + "10",
    },
    dayDockSlotActive: {
      borderColor: colors.accentGold,
      backgroundColor: colors.accentGold + "16",
    },
    dayDockSlotFilled: {
      borderStyle: "solid",
      opacity: 0.78,
    },
    dayDockSlotIndex: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.border2,
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: "800",
      textAlign: "center",
      lineHeight: 18,
      flexShrink: 0,
    },
    dayDockSlotText: { color: colors.textSub, fontSize: 12, fontWeight: "700", flex: 1 },
    dayDockSlotTextFilled: { color: colors.text },
    dayDockAddSlot: {
      width: 46,
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    // Ã¢â€â‚¬Ã¢â€â‚¬ Day row Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    dayRow: {
      backgroundColor: colors.card, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border2, marginBottom: 12, overflow: "hidden",
    },
    dayHeader: {
      flexDirection: "row", alignItems: "center", gap: 8, padding: 12,
    },
    dayBadge: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.border2, alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    dayBadgeActive: { backgroundColor: colors.accentGold + "22", borderWidth: 1.5, borderColor: colors.accentGold },
    dayBadgeText: { color: colors.textMuted, fontSize: 14, fontWeight: "800" },
    dayBadgeTextActive: { color: colors.accentGold },
    dayTitle: { color: colors.textSub, fontSize: 15, fontWeight: "700" },
    dayTimeMeta: { color: colors.accentGreen, fontSize: 11, fontWeight: "700", marginTop: 2 },
    filledBadge: {
      minWidth: 24,
      backgroundColor: colors.accentGreen + "18", borderRadius: 8,
      paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderColor: colors.accentGreen + "30",
      alignItems: "center",
    },
    filledBadgeText: { color: colors.accentGreen, fontSize: 11, fontWeight: "700" },
    optimizeBtn: {
      flexDirection: "row", alignItems: "center", gap: 4,
      padding: 6, borderRadius: 8,
      backgroundColor: colors.accentBlue + "18", borderWidth: 1, borderColor: colors.accentBlue + "40",
    },
    optimizeBtnText: { color: colors.accentBlue, fontSize: 11, fontWeight: "700" },
    dayBody: { paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: colors.border },
    dayMetricsColumn: {
      gap: 5,
      marginTop: 10,
    },
    dayMetricChip: {
      backgroundColor: colors.card2,
      borderWidth: 1,
      borderColor: colors.border2,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    dayMetricText: {
      fontSize: 11,
      fontWeight: "800",
    },

    // Ã¢â€â‚¬Ã¢â€â‚¬ Slot filled Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    slotFilled: {
      minHeight: 72,
      flexDirection: "row", alignItems: "center", gap: 10,
      backgroundColor: colors.border, borderRadius: 12,
      paddingHorizontal: 12, paddingVertical: 10, marginTop: 10, borderWidth: 1, borderColor: colors.border2,
    },
    slotFilledMeal: { backgroundColor: colors.accentGreen + "12", borderColor: colors.accentGreen + "30" },
    slotFilledMuseum: { backgroundColor: colors.accentPurple + "18", borderColor: colors.accentPurple + "44" },
    slotIndex: {
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: colors.border2, alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    slotIndexMeal: { backgroundColor: colors.accentGreen + "28" },
    slotIndexText: { color: colors.textMuted, fontSize: 11, fontWeight: "800" },
    slotIndexTextMeal: { color: colors.accentGreen },
    slotIndexEmpty: { backgroundColor: colors.border },
    slotIndexEmptyText: { color: colors.textMuted, fontSize: 11, fontWeight: "800" },
    slotEmoji: { fontSize: 20, flexShrink: 0 },
    slotName: { color: colors.text, fontSize: 14, fontWeight: "600", lineHeight: 19, flex: 1 },
    slotNameCompact: { color: colors.text, fontSize: 14, fontWeight: "700", lineHeight: 18, flex: 1 },
    slotMetaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
    slotTime: { color: colors.textMuted, fontSize: 12 },
    slotPrice: { color: colors.accentGreen, fontSize: 12, fontWeight: "800" },
    slotNote: {
      color: colors.textMuted, fontSize: 12, marginTop: 8,
      paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border2, minHeight: 18,
    },
    slotActions: { alignItems: "center", justifyContent: "center", flexShrink: 0 },
    slotLeftCol: {
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 6, flexShrink: 0,
    },
    slotDeleteBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.danger + "18",
      borderWidth: 1,
      borderColor: colors.danger + "40",
    },

    // Ã¢â€â‚¬Ã¢â€â‚¬ Slot empty Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    slotEmpty: {
      height: 56,
      flexDirection: "row", alignItems: "center", gap: 10,
      borderRadius: 12, borderWidth: 1.5, borderColor: colors.border,
      borderStyle: "dashed", paddingHorizontal: 12, marginTop: 10,
    },
    slotEmptyMeal: { borderColor: colors.accentGreen + "30" },
    slotEmptyActive: { borderColor: colors.accentBlue + "60", backgroundColor: colors.accentBlue + "10" },
    slotEmptyMealActive: { borderColor: colors.accentGreen + "60", backgroundColor: colors.accentGreen + "10" },
    slotEmptyText: { color: colors.border2, fontSize: 13, fontWeight: "600", flex: 1 },
    slotEmptyTextMeal: { color: colors.accentGreen + "40" },
    slotEmptyTextActive: { color: colors.accentBlue },
    slotEmptyTextMealActive: { color: colors.accentGreen },

    // Drag preview
    dragPreview: {
      position: "absolute",
      zIndex: 50,
      width: 220,
      minHeight: 56,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.accentGold,
      shadowColor: "#000",
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    dragPreviewMeal: {
      borderColor: colors.accentGreen,
      backgroundColor: colors.accentGreen + "15",
    },
    dragPreviewEmoji: { fontSize: 22 },
    dragPreviewName: { flex: 1, color: colors.text, fontSize: 13, fontWeight: "800" },

    // Ã¢â€â‚¬Ã¢â€â‚¬ Add slot Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    addSlotRow: { flexDirection: "row", gap: 10, marginTop: 12 },
    addSlotBtn: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
      paddingVertical: 10, borderRadius: 10,
      backgroundColor: colors.accentBlue + "12", borderWidth: 1, borderColor: colors.accentBlue + "30",
    },
    addSlotText: { color: colors.accentBlue, fontSize: 13, fontWeight: "700" },
    addMealBtn: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
      paddingVertical: 10, borderRadius: 10,
      backgroundColor: colors.accentGreen + "12", borderWidth: 1, borderColor: colors.accentGreen + "30",
    },
    addMealText: { color: colors.accentGreen, fontSize: 13, fontWeight: "700" },
    addDayBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingVertical: 11,
      borderRadius: 10,
      borderWidth: 1.5,
      borderStyle: "dashed" as const,
      borderColor: colors.accentGold + "50",
      backgroundColor: colors.accentGold + "0a",
      marginTop: 6,
    },
    addDayBtnPiano: {
      marginHorizontal: 0,
      marginTop: 4,
    },
    addDayBtnText: { color: colors.accentGold, fontSize: 12, fontWeight: "800" as const },

    // Ã¢â€â‚¬Ã¢â€â‚¬ Selection bar Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    selectionBar: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: colors.card2,
      borderTopWidth: 2, borderTopColor: colors.accentGold + "50",
      paddingHorizontal: 16, paddingVertical: 12,
    },
    selectionEmoji: { fontSize: 26, flexShrink: 0 },
    selectionName: { color: colors.accentGold, fontWeight: "700", fontSize: 15 },
    selectionHint: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    goToPianoBtn: {
      flexDirection: "row", alignItems: "center", gap: 4,
      backgroundColor: colors.accentGold, borderRadius: 10,
      paddingHorizontal: 10, paddingVertical: 7, flexShrink: 0,
    },
    goToPianoBtnText: { fontSize: 14 },
    cancelBtn: { flexShrink: 0, padding: 4 },

    // Ã¢â€â‚¬Ã¢â€â‚¬ Modal filtro Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    modalBackdrop: {
      flex: 1, backgroundColor: "#00000088",
      justifyContent: "center", alignItems: "center", paddingHorizontal: 24,
    },
    filterModal: {
      width: "100%", maxHeight: 440,
      backgroundColor: colors.card, borderRadius: 18,
      borderWidth: 1, borderColor: colors.border2, overflow: "hidden",
    },
    detailModal: {
      width: "100%",
      maxHeight: "82%",
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border2,
      padding: 16,
      gap: 14,
    },
    detailHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    detailEmoji: { fontSize: 28, width: 34, textAlign: "center" },
    detailTitle: { color: colors.text, fontSize: 17, fontWeight: "800", lineHeight: 22 },
    detailMeta: { color: colors.accentGold, fontSize: 12, fontWeight: "700", marginTop: 4 },
    detailMetaMeal: { color: colors.accentGreen },
    detailDescriptionScroll: { maxHeight: 260 },
    detailDescription: { color: colors.textSub, fontSize: 14, lineHeight: 20 },
    detailAddBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      backgroundColor: colors.accentGold,
      borderRadius: 12,
      paddingVertical: 13,
      marginBottom: 10,
    },
    detailAddText: { color: colors.bg, fontSize: 14, fontWeight: "800" },
    detailActionsRow: {
      flexDirection: "row",
      gap: 10,
    },
    detailMapBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      backgroundColor: colors.accentGold,
      borderRadius: 12,
      paddingVertical: 11,
    },
    detailMapText: { color: colors.bg, fontSize: 13, fontWeight: "800" },
    detailTicketBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      backgroundColor: colors.accentPurple + "25",
      borderWidth: 1,
      borderColor: colors.accentPurple + "70",
      borderRadius: 12,
      paddingVertical: 11,
    },
    detailTicketText: { color: colors.text, fontSize: 13, fontWeight: "800" },
    detailDeleteBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.danger,
      borderRadius: 12,
      paddingVertical: 12,
    },
    detailDeleteText: { color: "#fff", fontSize: 14, fontWeight: "800" },
    tourOverlay: {
      flex: 1,
      backgroundColor: "transparent",
    },
    tourHighlight: {
      position: "absolute",
      borderWidth: 2,
      borderColor: colors.accentGold,
      borderRadius: 16,
      backgroundColor: colors.accentGold + "14",
      shadowColor: colors.accentGold,
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
      borderBottomColor: colors.accentGold,
    },
    tourCard: {
      position: "absolute",
      width: 300,
      backgroundColor: colors.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border2,
      padding: 18,
      alignItems: "center",
      gap: 8,
    },
    tourEyebrow: { color: colors.accentGold, fontSize: 11, fontWeight: "800" },
    guideIcon: { fontSize: 38, marginBottom: 2 },
    guideTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "800",
      textAlign: "center",
      lineHeight: 23,
    },
    guideBody: {
      color: colors.textSub,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 19,
      marginTop: 2,
      marginBottom: 6,
    },
    guideDots: { flexDirection: "row", gap: 5, marginVertical: 5 },
    guideDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.border2,
    },
    guideDotActive: { backgroundColor: colors.accentGold, width: 22 },
    guideCta: {
      marginTop: 5,
      backgroundColor: colors.accentGold,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 26,
      minWidth: 170,
      alignItems: "center",
    },
    guideCtaText: { color: colors.bg, fontSize: 15, fontWeight: "800" },
    guideSkip: { paddingVertical: 8 },
    guideSkipText: { color: colors.textMuted, fontSize: 13 },
    filterModalHeader: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 18, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: colors.border2,
    },
    filterModalTitle: { color: colors.textSub, fontSize: 14, fontWeight: "700" },
    filterModalReset: { color: colors.accentBlue, fontSize: 13, fontWeight: "600" },
    filterModalList: { maxHeight: 320 },
    filterModalItem: {
      flexDirection: "row", alignItems: "center", gap: 14,
      paddingHorizontal: 18, paddingVertical: 13,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    checkbox: {
      width: 20, height: 20, borderRadius: 6, borderWidth: 1.5,
      borderColor: colors.border2, backgroundColor: colors.card2,
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    checkboxChecked: { backgroundColor: colors.accentGold, borderColor: colors.accentGold },
    filterModalItemText: { color: colors.textMuted, fontSize: 14 },
    filterModalItemTextChecked: { color: colors.accentGold, fontWeight: "600" },
    filterModalDone: {
      margin: 14, backgroundColor: colors.accentGold,
      borderRadius: 12, paddingVertical: 12, alignItems: "center",
    },
    filterModalDoneText: { color: colors.bg, fontSize: 14, fontWeight: "800" },
  });
}
