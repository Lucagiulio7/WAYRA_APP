import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ItineraryDay, Restaurant, Stop } from "@/types";
import { DraggableStopList } from "./DraggableStopList";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

const DAY_ACCENTS = ["#e8c06a", "#7eb8f7", "#a78bfa", "#6ee7b7", "#f97316"];

// ── Price level (numeric) per ordinamento ──────────────────────────────────

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
    case 1: return "€";
    case 3: return "€€€";
    default: return "€€";
  }
}

// ── Classificazione spuntino vs pasto ─────────────────────────────────────

function isSnack(foodType?: string): boolean {
  const t = foodType?.toLowerCase();
  return (
    t === "street food" ||
    t === "bar"         ||
    t === "gelateria"   ||
    t === "snack"       ||
    t === "bakery"      ||
    t === "pasticceria" ||
    t === "caffe"       ||
    t === "caffè"       ||
    t === "dolci"
  );
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const f1 = (lat1 * Math.PI) / 180;
  const f2 = (lat2 * Math.PI) / 180;
  const df = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimatedWalkingKm(stops: ItineraryDay["stops"]): number {
  const routeStops = stops.filter((s) =>
    (s.type === "attraction" || s.type === "food" || s.type === "meal") &&
    Number.isFinite(s.latitude) &&
    Number.isFinite(s.longitude),
  );
  if (routeStops.length < 2) return 0;
  return routeStops.slice(0, -1).reduce(
    (sum, stop, index) => {
      const straightKm = haversineKm(
      stop.latitude,
      stop.longitude,
      routeStops[index + 1].latitude,
      routeStops[index + 1].longitude,
      );
      return sum + straightKm * walkingDistanceFactor(straightKm);
    },
    0,
  );
}

function walkingDistanceFactor(straightKm: number): number {
  if (straightKm > 2) return 1.1;
  if (straightKm > 1) return 1.15;
  if (straightKm > 0.5) return 1.3;
  if (straightKm > 0.3) return 1.4;
  return 1.5;
}

function formatWalkingKm(km: number, lang: string): string {
  const rounded = km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
  return rounded.toLocaleString(lang === "en" ? "en-US" : "it-IT", {
    maximumFractionDigits: km < 10 ? 1 : 0,
  });
}

// ── Props ─────────────────────────────────────────────────────────────────

interface Props {
  day: ItineraryDay;
  open?: boolean;
  onToggleOpen?: () => void;
  onOptimizeDay?: () => void;
  onReplaceStop?: (stopId: number) => void;
  onReplaceFood?: (stopId: number) => void;
  onReorder?: (newStops: Stop[]) => void;
  onNoteChange?: (stopIndex: number, note: string) => void;
}

export function DayCard({ day, open: controlledOpen, onToggleOpen, onOptimizeDay, onReplaceStop, onReplaceFood, onReorder, onNoteChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(day.day === 1);
  const [foodOpen, setFoodOpen] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [mealOpen, setMealOpen]   = useState(false);
  const accent = DAY_ACCENTS[(day.day - 1) % DAY_ACCENTS.length];
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const open = controlledOpen ?? internalOpen;

  const attractionStops = day.stops.filter((s) => s.type === "attraction");
  const totalMinutes = attractionStops.reduce(
    (sum, s) => sum + (s.estimated_visit_time ?? 0),
    0,
  );
  const hours = Math.floor(totalMinutes / 60);
  const mins  = totalMinutes % 60;
  const walkingKm = estimatedWalkingKm(day.stops);

  // Dividi ristoranti in spuntini e pasti, ordinati per prezzo
  const allRestaurants = (day.restaurants ?? []).slice().sort(
    (a, b) => priceLevel(a.food_type) - priceLevel(b.food_type),
  );
  const snacks = allRestaurants.filter((r) => isSnack(r.food_type));
  const meals  = allRestaurants.filter((r) => !isSnack(r.food_type));

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (onToggleOpen) onToggleOpen();
    else setInternalOpen((v) => !v);
    if (open) { setFoodOpen(false); setSnackOpen(false); setMealOpen(false); }
  };

  useEffect(() => {
    if (!open) {
      setFoodOpen(false);
      setSnackOpen(false);
      setMealOpen(false);
    }
  }, [open]);

  const toggleFood = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFoodOpen((v) => !v);
    if (foodOpen) { setSnackOpen(false); setMealOpen(false); }
  };

  const openMaps = async (url: string | null | undefined) => {
    if (!url) return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
      else Alert.alert(t.errOpenMaps);
    } catch {
      Alert.alert(t.errTitle, t.errOpenLink);
    }
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.card, borderColor: colors.border }, open && { borderColor: accent, backgroundColor: accent + "10" }]}>
      {/* Header giorno — struttura piatta: left togglabile + right pulsanti separati */}
      <View style={[styles.header, open && { backgroundColor: accent + "12" }]}>
        {/* Area toggle (badge + testi + chevron) */}
        <TouchableOpacity style={styles.headerToggle} onPress={toggle} activeOpacity={0.8}>
          <View style={[styles.dayBadge, { backgroundColor: accent + "22", borderColor: accent }]}>
            <Text style={[styles.dayNumber, { color: accent }]}>{day.day}</Text>
          </View>
          <View style={styles.flex1}>
            <View style={styles.dayTitleRow}>
              <Text style={[styles.dayTitle, { color: colors.text }]}>{t.dayLabel} {day.day}</Text>
              {walkingKm > 0 && (
                <View style={[styles.walkBadge, { borderColor: accent + "66", backgroundColor: accent + "18" }]}>
                  <Ionicons name="walk-outline" size={12} color={accent} />
                  <Text style={[styles.walkBadgeText, { color: accent }]}>
                    ~{formatWalkingKm(walkingKm, lang)} km
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.dayMeta, { color: colors.textSub }]}>
              {attractionStops.length} {t.places} · {hours}h{mins > 0 ? ` ${mins}min` : ""}
            </Text>
          </View>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Pulsanti azione — fuori dal TouchableOpacity del toggle */}
        <View style={styles.headerActions}>
          {!!onOptimizeDay && attractionStops.length > 1 && (
            <TouchableOpacity
              onPress={onOptimizeDay}
              activeOpacity={0.7}
              style={[styles.optimizeBtn, { backgroundColor: colors.accentBlue + "16", borderColor: colors.accentBlue + "55" }]}
              accessibilityLabel={lang === "en" ? "Optimize stop order" : "Ottimizza ordine tappe"}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="shuffle-outline" size={16} color={colors.accentBlue} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {open && (
        <View style={styles.body}>
          {/* Placeholder giorno vuoto */}
          {attractionStops.length === 0 && (
            <View style={[styles.emptyDay, { borderColor: colors.border }]}>
              <Text style={styles.emptyDayEmoji}>📭</Text>
              <Text style={[styles.emptyDayText, { color: colors.textMuted }]}>
                {lang === "en" ? "No attractions added for this day" : "Nessuna attrazione aggiunta per questo giorno"}
              </Text>
            </View>
          )}
          {/* Stop attrazioni — drag-and-drop */}
          {attractionStops.length > 0 && (
          <DraggableStopList
            stops={day.stops}
            onReorder={onReorder ?? (() => {})}
            onReplaceStop={onReplaceStop}
            onReplaceFood={onReplaceFood}
            onNoteChange={onNoteChange}
            lang={lang}
            colors={colors}
          />
          )}

          {/* Pulsante percorso Maps */}
          {!!day.maps_link && (
            <TouchableOpacity
              style={[styles.mapsBtn, { borderColor: accent, backgroundColor: colors.bg }]}
              onPress={() => openMaps(day.maps_link)}
              activeOpacity={0.8}
            >
              <Ionicons name="map" size={16} color={accent} />
              <Text style={[styles.mapsBtnText, { color: accent }]}>{t.openRouteMaps}</Text>
              <Ionicons name="open-outline" size={14} color={accent} />
            </TouchableOpacity>
          )}

          {/* Sezione cibo */}
          {allRestaurants.length > 0 && (
            <View style={[styles.foodSection, { borderColor: colors.accentGreen + "40", backgroundColor: colors.accentGreen + "08" }]}>
              {/* Header principale */}
              <TouchableOpacity
                style={styles.foodHeader}
                onPress={toggleFood}
                activeOpacity={0.8}
              >
                <Text style={styles.foodHeaderEmoji}>🍴</Text>
                <Text style={[styles.foodHeaderText, { color: colors.accentGreen }]}>{t.wantToEat}</Text>
                <Ionicons
                  name={foodOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.accentGreen}
                />
              </TouchableOpacity>

              {foodOpen && (
                <View style={[styles.subSections, { borderTopColor: colors.accentGreen + "20" }]}>
                  {/* ── Spuntino ── */}
                  {snacks.length > 0 && (
                    <SubSection
                      emoji="🍦"
                      label={lang === "en" ? "Quick bite" : "Spuntino"}
                      open={snackOpen}
                      onToggle={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setSnackOpen((v) => !v);
                      }}
                    >
                      {snacks.map((r) => (
                        <RestaurantRow
                          key={r.id}
                          restaurant={r}
                          lang={lang}
                          colors={colors}
                          onMaps={() => openMaps(r.maps_link)}
                        />
                      ))}
                    </SubSection>
                  )}

                  {/* ── Pranzo / Cena ── */}
                  {meals.length > 0 && (
                    <SubSection
                      emoji="🍽️"
                      label={lang === "en" ? "Lunch & Dinner" : "Pranzo & Cena"}
                      open={mealOpen}
                      onToggle={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setMealOpen((v) => !v);
                      }}
                    >
                      {meals.map((r) => (
                        <RestaurantRow
                          key={r.id}
                          restaurant={r}
                          lang={lang}
                          colors={colors}
                          onMaps={() => openMaps(r.maps_link)}
                        />
                      ))}
                    </SubSection>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      )}

    </View>
  );
}

// ── SubSection collapsibile ───────────────────────────────────────────────────

function SubSection({
  emoji,
  label,
  open,
  onToggle,
  children,
}: {
  emoji: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.subSection, { borderTopColor: colors.accentGreen + "15" }]}>
      <TouchableOpacity
        style={[styles.subHeader, { backgroundColor: colors.accentGreen + "06" }]}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <Text style={styles.subEmoji}>{emoji}</Text>
        <Text style={[styles.subLabel, { color: colors.accentGreen + "cc" }]}>{label}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={14} color={colors.accentGreen + "99"} />
      </TouchableOpacity>
      {open && <View style={styles.subBody}>{children}</View>}
    </View>
  );
}

// ── Restaurant row ────────────────────────────────────────────────────────────

function RestaurantRow({
  restaurant,
  lang,
  colors,
  onMaps,
}: {
  restaurant: Restaurant;
  lang: string;
  colors: any;
  onMaps: () => void;
}) {
  const price       = getPriceRange(restaurant.food_type);
  const displayName = (lang === "en" && restaurant.name_en) ? restaurant.name_en : restaurant.name;

  return (
    <View style={[styles.restaurantRow, { borderTopColor: colors.border2 }]}>
      <View style={styles.restaurantInfo}>
        <Text style={[styles.restaurantName, { color: colors.text }]}>{displayName}</Text>
        {!!restaurant.food_type && (
          <Text style={[styles.restaurantType, { color: colors.textSub }]}>{restaurant.food_type}</Text>
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
        <TouchableOpacity onPress={onMaps} activeOpacity={0.7} style={styles.mapsIcon}>
          <Ionicons name="location-outline" size={20} color={colors.accentGreen} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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

  // ── Food section ────────────────────────────────────────────
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
  subSections: {
    borderTopWidth: 1,
    gap: 0,
  },
  // ── Sub-sezione (spuntino / pasto) ───────────────────────────
  subSection: {
    borderTopWidth: 1,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  subEmoji: { fontSize: 16 },
  subLabel: {
    flex: 1,
    fontWeight: "600",
    fontSize: 13,
  },
  subBody: {},
  // ── Restaurant row ───────────────────────────────────────────
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
});
