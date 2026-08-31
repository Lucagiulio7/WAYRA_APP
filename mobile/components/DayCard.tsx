import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Animated,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ItineraryDay, Restaurant, Stop } from "@/types";
import { DraggableStopList } from "./DraggableStopList";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { localizedName } from "@/utils/localization";
import { translateAttractionType } from "@/utils/attractionType";
import { cityLabel } from "@/utils/cityLabels";
import { PressableCard } from "@/components/ui";
import { localText } from "@/i18n";
import { contextHelpOutline, type ContextHelpContent } from "@/components/ContextHelp";
import { openExternalLink } from "@/utils/externalLinks";
import { analyzeRouteMobility, haversineKm, type MobilityPoint, type RouteTransfer } from "@/utils/routeMetrics";
import type { TripAccommodation } from "@/services/accommodationStorage";
import { requestOptionalUserLocation } from "@/services/userLocation";

const DAY_ACCENTS = ["#e8c06a", "#7eb8f7", "#a78bfa", "#6ee7b7", "#f97316"];

// â”€â”€ Price level (numeric) per ordinamento â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function priceLevel(foodType?: string): number {
  switch (foodType?.toLowerCase()) {
    case "street food": return 1;
    case "bar":         return 1;
    case "gelateria":   return 1;
    case "trattoria":   return 2;
    case "osteria":     return 2;
    case "bistrot":     return 2;
    case "ristorante":  return 3;
    default:            return 2;
  }
}

function getPriceRange(foodType?: string): string {
  switch (priceLevel(foodType)) {
    case 1: return "\u20AC";
    case 3: return "\u20AC\u20AC\u20AC";
    default: return "\u20AC\u20AC";
  }
}

function formatWalkingKm(km: number, lang: string): string {
  const rounded = km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
  return rounded.toLocaleString(lang === "es" ? "es-ES" : lang === "fr" ? "fr-FR" : lang === "en" ? "en-US" : "it-IT", {
    maximumFractionDigits: km < 10 ? 1 : 0,
  });
}

function mapsWaypoint(stop: Stop, lang: string): string {
  const query = `${localizedName(stop, lang)} ${cityLabel(stop.city ?? "", lang)}`.trim();
  return encodeURIComponent(query);
}

function buildRouteMapsLink(stops: MobilityPoint[], lang: string): string {
  const routeStops = stops as Stop[];
  if (routeStops.length < 2) return "";
  return "https://www.google.com/maps/dir/" +
    routeStops.map((stop) => mapsWaypoint(stop, lang)).join("/") +
    "?travelmode=walking";
}

function buildFirstStopMapsLink(stop: Stop | undefined, lang: string, fallbackCity = ""): string {
  if (!stop) return "";
  const destination = `${localizedName(stop, lang)} ${cityLabel(stop.city ?? fallbackCity, lang)}`.trim();
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=transit`;
}

function buildCurrentLocationToStopMapsLink(
  stop: Stop | undefined,
  coordinates: { latitude: number; longitude: number } | undefined,
  lang: string,
  fallbackCity = "",
): string {
  if (!stop) return "";
  const destination = `${localizedName(stop, lang)} ${cityLabel(stop.city ?? fallbackCity, lang)}`.trim();
  const origin = coordinates
    ? `&origin=${encodeURIComponent(`${coordinates.latitude},${coordinates.longitude}`)}`
    : "";
  return `https://www.google.com/maps/dir/?api=1${origin}&destination=${encodeURIComponent(destination)}&travelmode=transit`;
}

function accommodationWaypoint(accommodation: TripAccommodation, lang: string): string {
  return encodeURIComponent([accommodation.name, accommodation.address, cityLabel(accommodation.city, lang)].filter(Boolean).join(", "));
}

function buildAccommodationToStopMapsLink(accommodation: TripAccommodation, stop: Stop | undefined, lang: string): string {
  if (!stop) return "";
  const destination = `${localizedName(stop, lang)} ${cityLabel(stop.city ?? accommodation.city, lang)}`.trim();
  return `https://www.google.com/maps/dir/?api=1&origin=${accommodationWaypoint(accommodation, lang)}&destination=${encodeURIComponent(destination)}&travelmode=transit`;
}

function buildReturnToAccommodationMapsLink(accommodation: TripAccommodation, stop: Stop | undefined, lang: string): string {
  if (!stop) return "";
  const origin = `${localizedName(stop, lang)} ${cityLabel(stop.city ?? accommodation.city, lang)}`.trim();
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${accommodationWaypoint(accommodation, lang)}&travelmode=transit`;
}

function buildInternalTransferMapsLink(transfer: RouteTransfer, lang: string): string {
  const from = transfer.from as Stop;
  const to = transfer.to as Stop;
  const origin = `${localizedName(from, lang)} ${cityLabel(from.city ?? "", lang)}`.trim();
  const destination = `${localizedName(to, lang)} ${cityLabel(to.city ?? "", lang)}`.trim();
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=transit`;
}

// â”€â”€ Props â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface Props {
  day: ItineraryDay;
  city?: string;
  maxWalkKm?: number;
  open?: boolean;
  onToggleOpen?: () => void;
  onOptimizeDay?: () => void;
  onReorder?: (newStops: Stop[]) => void;
  onNoteChange?: (stopIndex: number, note: string) => void;
  onDragStateChange?: (dragging: boolean) => void;
  onRemoveRestaurant?: (restaurantId: number) => void;
  accommodation?: TripAccommodation | null;
  helpActive?: boolean;
  onHelpRequest?: (content: ContextHelpContent) => void;
}

export function DayCard({ day, city = "", maxWalkKm = 5, open: controlledOpen, onToggleOpen, onOptimizeDay, onReorder, onNoteChange, onDragStateChange, onRemoveRestaurant, accommodation, helpActive = false, onHelpRequest }: Props) {
  const [internalOpen, setInternalOpen] = useState(day.day === 1);
  const [foodOpen, setFoodOpen] = useState(false);
  const [startChoiceVisible, setStartChoiceVisible] = useState(false);
  const accent = DAY_ACCENTS[(day.day - 1) % DAY_ACCENTS.length];
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const tx = (values: Record<string, string>) => localText(lang, values);
  const dayHelp = {
    stops: { icon: "location-outline", title: tx({ it: "Tappe del giorno", en: "Day stops", fr: "Étapes du jour", es: "Paradas del día" }), body: tx({ it: "Apri la giornata per leggere le tappe, le durate e le note. In modalità normale puoi aprire i dettagli delle singole attrazioni.", en: "Open the day to read stops, durations and notes. In normal mode you can open each attraction's details.", fr: "Ouvrez la journée pour consulter les étapes, durées et notes. En mode normal, chaque attraction peut être ouverte.", es: "Abre el día para ver paradas, duraciones y notas. En modo normal puedes abrir cada atracción." }) } as ContextHelpContent,
    optimize: { icon: "shuffle-outline", title: tx({ it: "Ottimizza percorso", en: "Optimize route", fr: "Optimiser le parcours", es: "Optimizar ruta" }), body: tx({ it: "Riordina automaticamente le attrazioni per ridurre il percorso a piedi.", en: "Automatically reorders attractions to reduce walking.", fr: "Réordonne automatiquement les attractions pour réduire la marche.", es: "Reordena automáticamente las atracciones para reducir la caminata." }) } as ContextHelpContent,
    maps: { icon: "map-outline", title: tx({ it: "Percorsi su Maps", en: "Routes in Maps", fr: "Parcours dans Maps", es: "Rutas en Maps" }), body: tx({ it: "Apre separatamente i tratti a piedi e quelli consigliati con mezzi, così la distanza pedonale non include i trasferimenti tra zone lontane.", en: "Opens walking sections and recommended transit sections separately, so walking distance excludes transfers between distant areas.", fr: "Ouvre séparément les portions à pied et en transports, afin que la distance de marche exclue les transferts entre zones éloignées.", es: "Abre por separado los tramos a pie y en transporte, para que la distancia caminando no incluya traslados entre zonas lejanas." }) } as ContextHelpContent,
    transfer: { icon: "bus-outline", title: tx({ it: "Raggiungi la prima tappa", en: "Reach the first stop", fr: "Rejoindre la première étape", es: "Llegar a la primera parada" }), body: tx({ it: "Apre le indicazioni dalla tua posizione alla prima tappa con i mezzi pubblici. Il percorso a piedi della giornata rimane separato.", en: "Opens public transport directions from your position to the first stop. The day's walking route remains separate.", fr: "Ouvre l'itinéraire en transports depuis votre position jusqu'à la première étape. Le parcours à pied reste séparé.", es: "Abre las indicaciones en transporte público desde tu posición hasta la primera parada. La ruta a pie queda separada." }) } as ContextHelpContent,
    food: { icon: "restaurant-outline", title: tx({ it: "Posti scelti dove mangiare", en: "Selected places to eat", fr: "Adresses choisies", es: "Lugares elegidos para comer" }), body: tx({ it: "Mostra i ristoranti scelti dalla mappa per questa giornata. Puoi aprirli su Maps o rimuoverli.", en: "Shows restaurants selected from the map for this day. You can open them in Maps or remove them.", fr: "Affiche les restaurants choisis sur la carte pour cette journée. Vous pouvez les ouvrir dans Maps ou les retirer.", es: "Muestra los restaurantes elegidos en el mapa para este día. Puedes abrirlos en Maps o quitarlos." }) } as ContextHelpContent,
  };
  const open = controlledOpen ?? internalOpen;
  const chevronRotation = useRef(new Animated.Value(open ? 1 : 0)).current;
  const optimizeRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(chevronRotation, {
      toValue: open ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [chevronRotation, open]);

  const chevronRotate = chevronRotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });


  const attractionStops = useMemo(
    () => day.stops.filter((s) => s.type === "attraction"),
    [day.stops],
  );
  const totalMinutes = useMemo(
    () => attractionStops.reduce((sum, s) => sum + (s.estimated_visit_time ?? 0), 0),
    [attractionStops],
  );
  const hours = Math.floor(totalMinutes / 60);
  const mins  = totalMinutes % 60;
  const mobilityPlan = useMemo(
    () => analyzeRouteMobility(attractionStops, maxWalkKm),
    [attractionStops, maxWalkKm],
  );
  const walkingKm = mobilityPlan.walkingKm;
  const walkingRouteLinks = useMemo(
    () => mobilityPlan.walkingGroups
      .filter((group) => group.length > 1)
      .map((group) => buildRouteMapsLink(group, lang)),
    [mobilityPlan.walkingGroups, lang],
  );
  const firstStopMapsLink = useMemo(() => buildFirstStopMapsLink(attractionStops[0], lang, city), [attractionStops, lang, city]);
  const accommodationToFirstStopLink = useMemo(
    () => accommodation ? buildAccommodationToStopMapsLink(accommodation, attractionStops[0], lang) : "",
    [accommodation, attractionStops, lang],
  );
  const returnToAccommodationLink = useMemo(
    () => accommodation ? buildReturnToAccommodationMapsLink(accommodation, attractionStops[attractionStops.length - 1], lang) : "",
    [accommodation, attractionStops, lang],
  );

  const openFromCurrentLocation = async () => {
    setStartChoiceVisible(false);
    const result = await requestOptionalUserLocation();
    const firstStop = attractionStops[0];
    const link = buildCurrentLocationToStopMapsLink(firstStop, result.coordinates, lang, city);
    if (!link) return;

    if (result.status === "available" && result.coordinates && firstStop) {
      const distanceFromCity = haversineKm(result.coordinates, firstStop);
      if (distanceFromCity > 80) {
        Alert.alert(
          tx({ it: "Sei lontano dalla destinazione", en: "You are far from the destination", fr: "Vous êtes loin de la destination", es: "Estás lejos del destino" }),
          tx({
            it: accommodation ? "La posizione attuale sembra fuori dalla città del viaggio. Puoi partire dal tuo alloggio oppure aprire comunque il percorso." : "La posizione attuale sembra fuori dalla città del viaggio. Aprire comunque il percorso?",
            en: accommodation ? "Your current location appears to be outside the trip city. You can start from your accommodation or open the route anyway." : "Your current location appears to be outside the trip city. Open the route anyway?",
            fr: accommodation ? "Votre position actuelle semble être hors de la ville du voyage. Vous pouvez partir de votre logement ou ouvrir quand même l'itinéraire." : "Votre position actuelle semble être hors de la ville du voyage. Ouvrir quand même l'itinéraire ?",
            es: accommodation ? "Tu ubicación actual parece estar fuera de la ciudad del viaje. Puedes salir desde tu alojamiento o abrir la ruta de todos modos." : "Tu ubicación actual parece estar fuera de la ciudad del viaje. ¿Abrir la ruta de todos modos?",
          }),
          [
            { text: tx({ it: "Annulla", en: "Cancel", fr: "Annuler", es: "Cancelar" }), style: "cancel" },
            ...(accommodationToFirstStopLink ? [{ text: tx({ it: "Dall'alloggio", en: "From accommodation", fr: "Depuis le logement", es: "Desde el alojamiento" }), onPress: () => openMaps(accommodationToFirstStopLink) }] : []),
            { text: tx({ it: "Apri comunque", en: "Open anyway", fr: "Ouvrir quand même", es: "Abrir de todos modos" }), onPress: () => openMaps(link) },
          ],
        );
        return;
      }
    }

    openMaps(link);
  };

  const allRestaurants = useMemo(
    () => (day.restaurants ?? []).slice().sort(
      (a, b) => priceLevel(a.food_type) - priceLevel(b.food_type),
    ),
    [day.restaurants],
  );

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (onToggleOpen) onToggleOpen();
    else setInternalOpen((v) => !v);
    if (open) setFoodOpen(false);
  };

  useEffect(() => {
    if (!open) setFoodOpen(false);
  }, [open]);

  const toggleFood = () => {
    if (helpActive) { onHelpRequest?.(dayHelp.food); return; }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFoodOpen((v) => !v);
  };

  const optimizeDay = () => {
    if (helpActive) { onHelpRequest?.(dayHelp.optimize); return; }
    if (!onOptimizeDay) return;
    optimizeRotation.setValue(0);
    Animated.timing(optimizeRotation, {
      toValue: 1,
      duration: 460,
      useNativeDriver: true,
    }).start();
    onOptimizeDay();
  };

  const openMaps = async (url: string | null | undefined) => {
    if (helpActive) { onHelpRequest?.(dayHelp.maps); return; }
    if (!url) return;
    await openExternalLink(url, lang, { title: t.errTitle, message: t.errOpenMaps });
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.card, borderColor: colors.border }, open && { borderColor: accent, backgroundColor: accent + "10" }, contextHelpOutline(helpActive, colors.accentGold)]}>
      {/* Header giorno â€” struttura piatta: left togglabile + right pulsanti separati */}
      <View style={[styles.header, open && { backgroundColor: accent + "12" }]}>
        {/* Area toggle (badge + testi + chevron) */}
        <TouchableOpacity
          style={styles.headerToggle}
          onPress={toggle}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`${t.dayLabel} ${day.day}`}
          accessibilityState={{ expanded: open }}
        >
          <View style={[styles.dayBadge, { backgroundColor: accent + "22", borderColor: accent }]}>
            <Text style={[styles.dayNumber, { color: accent }]}>{day.day}</Text>
          </View>
          <View style={styles.flex1}>
            <View style={styles.dayTitleRow}>
              <Text style={[styles.dayTitle, { color: colors.text }]}>{t.dayLabel} {day.day}</Text>
              {day.day_type === "excursion" && (
                <View style={[styles.walkBadge, { borderColor: colors.accentBlue + "66", backgroundColor: colors.accentBlue + "18" }]}>
                  <Ionicons name="compass-outline" size={12} color={colors.accentBlue} />
                  <Text style={[styles.walkBadgeText, { color: colors.accentBlue }]}>
                    {tx({ it: "Escursione", en: "Excursion", fr: "Excursion", es: "Excursión" })}
                  </Text>
                </View>
              )}
              {day.day_type !== "excursion" && day.transfer_required && (
                <View style={[styles.walkBadge, { borderColor: colors.accentBlue + "66", backgroundColor: colors.accentBlue + "18" }]}>
                  <Ionicons name="bus-outline" size={12} color={colors.accentBlue} />
                  <Text style={[styles.walkBadgeText, { color: colors.accentBlue }]}>
                    {tx({ it: "Trasferimento", en: "Transfer", fr: "Transfert", es: "Traslado" })}
                  </Text>
                </View>
              )}
              {walkingKm > 0 && (
                <View style={[styles.walkBadge, { borderColor: accent + "66", backgroundColor: accent + "18" }]}>
                  <Ionicons name="walk-outline" size={12} color={accent} />
                  <Text style={[styles.walkBadgeText, { color: accent }]}>
                    ~{formatWalkingKm(walkingKm, lang)} km
                  </Text>
                </View>
              )}
              {mobilityPlan.transfers.length > 0 && (
                <View style={[styles.walkBadge, { borderColor: colors.accentBlue + "66", backgroundColor: colors.accentBlue + "18" }]}>
                  <Ionicons name="bus-outline" size={12} color={colors.accentBlue} />
                  <Text style={[styles.walkBadgeText, { color: colors.accentBlue }]}>{mobilityPlan.transfers.length}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.dayMeta, { color: colors.textSub }]}>
              {attractionStops.length} {t.places} · {hours}h{mins > 0 ? ` ${mins}min` : ""}
            </Text>
          </View>
          <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </Animated.View>
        </TouchableOpacity>

        {/* Pulsanti azione â€” fuori dal TouchableOpacity del toggle */}
        <View style={styles.headerActions}>
          {!!onOptimizeDay && attractionStops.length > 1 && (
            <PressableCard
              onPress={optimizeDay}
              haptic="light"
              pressScale={0.88}
              style={[styles.optimizeBtn, { backgroundColor: colors.accentBlue + "16", borderColor: colors.accentBlue + "55" }]}
              accessibilityLabel={lang === "es" ? "Optimizar el orden de las paradas" : lang === "fr" ? "Optimiser l'ordre des étapes" : lang === "en" ? "Optimize stop order" : "Ottimizza ordine tappe"}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Animated.View style={{ transform: [{ rotate: optimizeRotation.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "180deg"],
              }) }] }}>
                <Ionicons name="shuffle-outline" size={16} color={colors.accentBlue} />
              </Animated.View>
            </PressableCard>
          )}
        </View>
      </View>

      {open && (
        <View style={styles.body}>
          {/* Placeholder giorno vuoto */}
          {attractionStops.length === 0 && (
            <View style={[styles.emptyDay, { borderColor: colors.border }]}>
              <Text style={styles.emptyDayEmoji}>{"\u{1F4ED}"}</Text>
              <Text style={[styles.emptyDayText, { color: colors.textMuted }]}>
                {lang === "es" ? "No hay atracciones añadidas para este día" : lang === "fr" ? "Aucune attraction ajoutée pour cette journée" : lang === "en" ? "No attractions added for this day" : "Nessuna attrazione aggiunta per questo giorno"}
              </Text>
            </View>
          )}
          {/* Stop attrazioni â€” drag-and-drop */}
          {attractionStops.length > 0 && (
          <DraggableStopList
            stops={day.stops}
            onReorder={onReorder ?? (() => {})}
            onNoteChange={onNoteChange}
            onDragStateChange={onDragStateChange}
            lang={lang}
            colors={colors}
            helpActive={helpActive}
            onHelpRequest={() => onHelpRequest?.(dayHelp.stops)}
          />
          )}

          {/* Pulsante percorso Maps */}
          {!!firstStopMapsLink && (
            <TouchableOpacity
              style={[styles.mapsBtn, { borderColor: colors.accentBlue, backgroundColor: colors.accentBlue + "0D" }]}
              onPress={() => {
                if (helpActive) { onHelpRequest?.(dayHelp.transfer); return; }
                if (accommodationToFirstStopLink) setStartChoiceVisible(true);
                else void openFromCurrentLocation();
              }}
              activeOpacity={0.8}
              accessibilityRole="link"
              accessibilityLabel={tx({ it: "Raggiungi la prima tappa", en: "Reach the first stop", fr: "Rejoindre la première étape", es: "Llegar a la primera parada" })}
            >
              <Ionicons name={day.transfer_mode === "ferry" ? "boat-outline" : "bus-outline"} size={17} color={colors.accentBlue} />
              <Text style={[styles.mapsBtnText, { color: colors.accentBlue }]}>
                {tx({ it: "Raggiungi la prima tappa", en: "Reach the first stop", fr: "Rejoindre la première étape", es: "Llegar a la primera parada" })}
              </Text>
              <Ionicons name="open-outline" size={14} color={colors.accentBlue} />
            </TouchableOpacity>
          )}

          {!!returnToAccommodationLink && (
            <TouchableOpacity
              style={[styles.mapsBtn, { borderColor: colors.accentPurple, backgroundColor: colors.accentPurple + "0D" }]}
              onPress={() => helpActive ? onHelpRequest?.(dayHelp.transfer) : openMaps(returnToAccommodationLink)}
              activeOpacity={0.8}
              accessibilityRole="link"
              accessibilityLabel={tx({ it: "Torna all'alloggio", en: "Return to accommodation", fr: "Retourner au logement", es: "Volver al alojamiento" })}
            >
              <Ionicons name="home-outline" size={17} color={colors.accentPurple} />
              <Text style={[styles.mapsBtnText, { color: colors.accentPurple }]}>
                {tx({ it: "Torna all'alloggio", en: "Return to accommodation", fr: "Retourner au logement", es: "Volver al alojamiento" })}
              </Text>
              <Ionicons name="open-outline" size={14} color={colors.accentPurple} />
            </TouchableOpacity>
          )}

          {mobilityPlan.transfers.map((transfer, index) => (
            <TouchableOpacity
              key={`${transfer.from.id ?? index}-${transfer.to.id ?? index}`}
              style={[styles.mapsBtn, { borderColor: colors.accentBlue, backgroundColor: colors.accentBlue + "0D" }]}
              onPress={() => helpActive ? onHelpRequest?.(dayHelp.maps) : openMaps(buildInternalTransferMapsLink(transfer, lang))}
              activeOpacity={0.8}
              accessibilityRole="link"
              accessibilityLabel={tx({ it: "Apri trasferimento su Maps", en: "Open transfer in Maps", fr: "Ouvrir le transfert dans Maps", es: "Abrir traslado en Maps" })}
            >
              <Ionicons name={transfer.mode === "ferry" ? "boat-outline" : "train-outline"} size={17} color={colors.accentBlue} />
              <Text style={[styles.mapsBtnText, { color: colors.accentBlue }]} numberOfLines={2}>
                {tx({ it: "Con i mezzi", en: "By transit", fr: "En transports", es: "En transporte" })}: {localizedName(transfer.from as Stop, lang)} → {localizedName(transfer.to as Stop, lang)}
              </Text>
              <Ionicons name="open-outline" size={14} color={colors.accentBlue} />
            </TouchableOpacity>
          ))}

          {walkingRouteLinks.map((routeLink, index) => (
            <TouchableOpacity
              key={`walking-${index}`}
              style={[styles.mapsBtn, { borderColor: accent, backgroundColor: colors.bg }]}
              onPress={() => helpActive ? onHelpRequest?.(dayHelp.maps) : openMaps(routeLink)}
              activeOpacity={0.8}
              accessibilityRole="link"
              accessibilityLabel={t.openRouteMaps}
            >
              <Ionicons name="walk-outline" size={16} color={accent} />
              <Text style={[styles.mapsBtnText, { color: accent }]}>
                {walkingRouteLinks.length > 1 ? `${t.openRouteMaps} ${index + 1}` : t.openRouteMaps}
              </Text>
              <Ionicons name="open-outline" size={14} color={accent} />
            </TouchableOpacity>
          ))}

          {/* Sezione cibo: mostra solo i ristoranti gia scelti dalla mappa */}
          {allRestaurants.length > 0 && (
            <View style={[styles.foodSection, { borderColor: colors.accentGreen + "40", backgroundColor: colors.accentGreen + "08" }]}>
              <TouchableOpacity
                style={styles.foodHeader}
                onPress={toggleFood}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ expanded: foodOpen }}
                accessibilityLabel={t.wantToEat}
              >
              <Text style={styles.foodHeaderEmoji}>{"\u{1F374}"}</Text>
                <Text style={[styles.foodHeaderText, { color: colors.accentGreen }]}>{t.wantToEat}</Text>
                <Ionicons
                  name={foodOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.accentGreen}
                />
              </TouchableOpacity>

              {foodOpen && (
                <View style={[styles.restaurantList, { borderTopColor: colors.accentGreen + "20" }]}>
                  {allRestaurants.map((r) => (
                    <RestaurantRow
                      key={r.id}
                      restaurant={r}
                      lang={lang}
                      colors={colors}
                       onMaps={() => helpActive ? onHelpRequest?.(dayHelp.food) : openMaps(r.maps_link)}
                       onRemove={onRemoveRestaurant ? () => helpActive ? onHelpRequest?.(dayHelp.food) : onRemoveRestaurant(r.id) : undefined}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}

      <Modal visible={startChoiceVisible} transparent animationType="fade" onRequestClose={() => setStartChoiceVisible(false)}>
        <TouchableOpacity style={[styles.routeChoiceBackdrop, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setStartChoiceVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.routeChoiceSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.routeChoiceTitle, { color: colors.text }]}>{tx({ it: "Da dove vuoi partire?", en: "Where do you want to start?", fr: "D'où voulez-vous partir ?", es: "¿Desde dónde quieres salir?" })}</Text>
            <Text style={[styles.routeChoiceSubtitle, { color: colors.textMuted }]}>{tx({ it: "Il trasferimento verso la prima tappa resta separato dai chilometri a piedi della giornata.", en: "The transfer to the first stop remains separate from the day's walking distance.", fr: "Le trajet jusqu'à la première étape reste séparé de la distance à pied de la journée.", es: "El traslado hasta la primera parada queda separado de la distancia a pie del día." })}</Text>
            <TouchableOpacity style={[styles.routeChoiceButton, { borderColor: colors.accentBlue + "66", backgroundColor: colors.accentBlue + "12" }]} onPress={() => void openFromCurrentLocation()}>
              <Ionicons name="navigate-outline" size={20} color={colors.accentBlue} />
              <View style={styles.routeChoiceText}>
                <Text style={[styles.routeChoiceButtonTitle, { color: colors.text }]}>{tx({ it: "La mia posizione", en: "My current location", fr: "Ma position actuelle", es: "Mi ubicación actual" })}</Text>
                <Text style={[styles.routeChoiceButtonSub, { color: colors.textMuted }]}>{tx({ it: "Maps userà la posizione disponibile al momento dell'apertura.", en: "Maps will use your available location when it opens.", fr: "Maps utilisera votre position disponible à l'ouverture.", es: "Maps usará tu ubicación disponible al abrirse." })}</Text>
              </View>
              <Ionicons name="open-outline" size={15} color={colors.accentBlue} />
            </TouchableOpacity>
            {!!accommodationToFirstStopLink && (
              <TouchableOpacity style={[styles.routeChoiceButton, { borderColor: colors.accentPurple + "66", backgroundColor: colors.accentPurple + "12" }]} onPress={() => { setStartChoiceVisible(false); openMaps(accommodationToFirstStopLink); }}>
                <Ionicons name="home-outline" size={20} color={colors.accentPurple} />
                <View style={styles.routeChoiceText}>
                  <Text style={[styles.routeChoiceButtonTitle, { color: colors.text }]}>{accommodation?.name || tx({ it: "Il mio alloggio", en: "My accommodation", fr: "Mon logement", es: "Mi alojamiento" })}</Text>
                  <Text style={[styles.routeChoiceButtonSub, { color: colors.textMuted }]} numberOfLines={2}>{accommodation?.address}</Text>
                </View>
                <Ionicons name="open-outline" size={15} color={colors.accentPurple} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// â”€â”€ SubSection collapsibile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€ Restaurant row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function RestaurantRow({
  restaurant,
  lang,
  colors,
  onMaps,
  onRemove,
}: {
  restaurant: Restaurant;
  lang: string;
  colors: any;
  onMaps: () => void;
  onRemove?: () => void;
}) {
  const price       = getPriceRange(restaurant.food_type);
  const displayName = localizedName(restaurant, lang);

  return (
    <View style={[styles.restaurantRow, { borderTopColor: colors.border2 }]}>
      <View style={styles.restaurantInfo}>
        <Text style={[styles.restaurantName, { color: colors.text }]}>{displayName}</Text>
        {!!restaurant.food_type && (
          <Text style={[styles.restaurantType, { color: colors.textSub }]}>
            {translateAttractionType(restaurant.food_type, lang) ?? restaurant.food_type}
          </Text>
        )}
      </View>

      <View style={styles.restaurantRight}>
        <Text style={[styles.priceRange, { color: colors.accentGreen }]}>{price}</Text>
        {restaurant.rating != null && (
          <View style={[styles.ratingBadge, { backgroundColor: colors.accentGold + "18" }]}>
            <Ionicons name="star" size={11} color={colors.accentGold} />
            <Text style={[styles.ratingText, { color: colors.accentGold }]}>{restaurant.rating.toFixed(1)}</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={onMaps}
          activeOpacity={0.7}
          style={styles.mapsIcon}
          accessibilityRole="link"
          accessibilityLabel={lang === "es" ? `Abrir ${displayName} en Maps` : lang === "fr" ? `Ouvrir ${displayName} dans Maps` : lang === "en" ? `Open ${displayName} in Maps` : `Apri ${displayName} su Maps`}
          hitSlop={6}
        >
          <Ionicons name="location-outline" size={20} color={colors.accentGreen} />
        </TouchableOpacity>
        {onRemove && (
          <TouchableOpacity
            onPress={onRemove}
            activeOpacity={0.7}
            style={styles.removeRestaurantBtn}
            accessibilityRole="button"
            accessibilityLabel={lang === "es" ? `Eliminar ${displayName}` : lang === "fr" ? `Supprimer ${displayName}` : lang === "en" ? `Remove ${displayName}` : `Rimuovi ${displayName}`}
            hitSlop={6}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  emptyDay: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyDayEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyDayText: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.7,
  },
  wrapper: {
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 0,
    paddingRight: 12,
  },
  headerToggle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: { fontSize: 18, fontWeight: "800" },
  flex1:    { flex: 1 },
  dayTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  dayTitle: { fontSize: 16, fontWeight: "700" },
  dayMeta:  { fontSize: 12, marginTop: 2 },
  walkBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  walkBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  body:     { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 14 },
  optimizeBtn: {
    padding: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  mapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 10,
  },
  mapsBtnText: { fontWeight: "700", fontSize: 14 },
  routeChoiceBackdrop: { flex: 1, justifyContent: "flex-end", padding: 14 },
  routeChoiceSheet: { width: "100%", maxWidth: 520, alignSelf: "center", borderWidth: 1, borderRadius: 12, padding: 16, gap: 10 },
  routeChoiceTitle: { fontSize: 18, fontWeight: "900" },
  routeChoiceSubtitle: { fontSize: 12, lineHeight: 18, marginBottom: 2 },
  routeChoiceButton: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderRadius: 8, padding: 12 },
  routeChoiceText: { flex: 1, minWidth: 0 },
  routeChoiceButtonTitle: { fontSize: 14, fontWeight: "900" },
  routeChoiceButtonSub: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  // â”€â”€ Food section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  foodSection: {
    marginTop: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: "hidden",
  },
  foodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  foodHeaderEmoji: { fontSize: 18 },
  foodHeaderText: {
    flex: 1,
    fontWeight: "700",
    fontSize: 14,
  },
  restaurantList: {
    borderTopWidth: 1,
    gap: 0,
  },
  // â”€â”€ Sub-sezione (spuntino / pasto) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // â”€â”€ Restaurant row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  restaurantRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    gap: 10,
  },
  restaurantInfo:  { flex: 1 },
  restaurantName:  { fontWeight: "600", fontSize: 14 },
  restaurantType:  { fontSize: 12, marginTop: 2, textTransform: "capitalize" },
  restaurantRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  priceRange: {
    fontWeight: "700",
    fontSize: 13,
    minWidth: 28,
    textAlign: "right",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  ratingText: { fontWeight: "700", fontSize: 12 },
  mapsIcon:   { padding: 4 },
  removeRestaurantBtn: { padding: 4 },
});
