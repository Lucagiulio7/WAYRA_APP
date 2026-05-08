import React, { useState } from "react";
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
import { Stop } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

// ── Colori per livello ────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<number, string> = {
  1: "#e8c06a",
  2: "#7eb8f7",
  3: "#a78bfa",
};

// ── Emoji per tipo di attrazione ──────────────────────────────────────────────

const ATTRACTION_EMOJI: Record<string, string> = {
  museo:       "🏛️",
  chiesa:      "⛪",
  parco:       "🌿",
  piazza:      "🏟️",
  archeologia: "⚱️",
  monumento:   "🗿",
  quartiere:   "🏘️",
  panorama:    "🌅",
  mercato:     "🛒",
  palazzo:     "🏰",
};

function getAttractionEmoji(type?: string | null): string {
  return ATTRACTION_EMOJI[type ?? ""] ?? "📍";
}

function isMuseum(type?: string | null): boolean {
  return type === "museo";
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  stop: Stop;
  index?: number;
  onReplace?: () => void;
}

export function StopCard({ stop, index, onReplace }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { lang, t } = useLanguage();

  const LEVEL_LABELS: Record<number, string> = {
    1: t.levelIconicBadge,
    2: t.levelCuratedBadge,
    3: t.levelHiddenBadge,
  };

  if (stop.type === "free_time") {
    return <FreeTimeStop stop={stop} lang={lang} freeTimeLabel={t.freeTimeLabel} />;
  }

  if (stop.type === "food") {
    return <FoodStop stop={stop} lang={lang} index={index ?? 1} />;
  }

  return (
    <AttractionStop
      stop={stop}
      index={index ?? 1}
      expanded={expanded}
      setExpanded={setExpanded}
      lang={lang}
      levelLabels={LEVEL_LABELS}
      onReplace={onReplace}
    />
  );
}

// ── Attraction ────────────────────────────────────────────────────────────────

function FoodStop({ stop, lang, index }: { stop: Stop; lang: string; index: number }) {
  const displayName = (lang === "en" && stop.name_en) ? stop.name_en : stop.name;
  const displayDesc = (lang === "en" && stop.description_en) ? stop.description_en : stop.description;
  const emoji = stop.attraction_type ? getAttractionEmoji(stop.attraction_type) : "🍴";

  const openMaps = async () => {
    const query = stop.city ? `${stop.name}, ${stop.city}` : stop.name;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    try { await Linking.openURL(url); }
    catch { Alert.alert("Errore", "Impossibile aprire Maps."); }
  };

  return (
    <View style={styles.foodStopCard}>
      <View style={styles.row}>
        <View style={styles.foodIndexBadge}>
          <Text style={styles.foodIndexText}>{index}</Text>
        </View>
        <Text style={styles.attractionEmoji}>{emoji}</Text>
        <View style={styles.flex1}>
          <Text style={styles.foodStopName} numberOfLines={2}>{displayName}</Text>
          {!!displayDesc && (
            <Text style={styles.foodStopDesc} numberOfLines={2}>{displayDesc}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={openMaps}
          activeOpacity={0.7}
          style={styles.mapsIcon}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="location-outline" size={18} color="#6ee7b7" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AttractionStop({
  stop,
  index,
  expanded,
  setExpanded,
  lang,
  levelLabels,
  onReplace,
}: {
  stop: Stop;
  index: number;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  lang: string;
  levelLabels: Record<number, string>;
  onReplace?: () => void;
}) {
  const color  = LEVEL_COLORS[stop.category_level ?? 1] ?? "#ccc";
  const museum = isMuseum(stop.attraction_type);
  const emoji  = getAttractionEmoji(stop.attraction_type);

  const displayName = (lang === "en" && stop.name_en) ? stop.name_en : stop.name;
  const displayDesc = (lang === "en" && stop.description_en) ? stop.description_en : stop.description;

  const cardBg     = museum ? "#1a0f2e" : "#1e1e30";
  const cardBorder = museum ? "#7c3aed55" : "#2a2a42";

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const openTickets = async () => {
    if (!stop.ticket_url) return;
    try { await Linking.openURL(stop.ticket_url); }
    catch { Alert.alert("Errore", "Impossibile aprire il link."); }
  };

  const openMaps = async () => {
    const query = stop.city ? `${stop.name}, ${stop.city}` : stop.name;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    try { await Linking.openURL(url); }
    catch { Alert.alert("Errore", "Impossibile aprire Maps."); }
  };

  return (
    <TouchableOpacity
      style={[styles.attractionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
      onPress={toggle}
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        {/* Numero indice */}
        <View style={[styles.indexBadge, { backgroundColor: color + "28", borderColor: color }]}>
          <Text style={[styles.indexText, { color }]}>{index}</Text>
        </View>

        {/* Emoji tipo + nome */}
        <View style={styles.flex1}>
          <View style={styles.nameRow}>
            <Text style={styles.attractionEmoji}>{emoji}</Text>
            <Text style={styles.attractionName} numberOfLines={2}>{displayName}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="time-outline" size={12} color="#777" />
            <Text style={styles.metaText}>{stop.estimated_visit_time} min</Text>
            {stop.category_level !== undefined && (
              <View style={[styles.levelBadge, { backgroundColor: color + "22" }]}>
                <Text style={[styles.levelText, { color }]}>
                  {levelLabels[stop.category_level]}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Pulsante biglietti (solo musei con ticket_url) */}
        {museum && !!stop.ticket_url && (
          <TouchableOpacity
            onPress={openTickets}
            activeOpacity={0.7}
            style={styles.ticketBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="ticket-outline" size={18} color="#a78bfa" />
          </TouchableOpacity>
        )}

        {/* Icona Maps */}
        <TouchableOpacity
          onPress={openMaps}
          activeOpacity={0.7}
          style={styles.mapsIcon}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="location-outline" size={18} color="#6ee7b7" />
        </TouchableOpacity>

        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#555" />
      </View>

      {expanded && (
        <View style={[styles.expandedBody, { borderTopColor: museum ? "#7c3aed22" : "#2a2a42" }]}>
          {!!displayDesc && (
            <Text style={styles.description}>{displayDesc}</Text>
          )}
          {museum && !!stop.ticket_url && (
            <TouchableOpacity
              style={styles.ticketFullBtn}
              onPress={openTickets}
              activeOpacity={0.8}
            >
              <Ionicons name="ticket-outline" size={14} color="#a78bfa" />
              <Text style={styles.ticketFullText}>
                {lang === "en" ? "Buy tickets online" : "Acquista biglietti online"}
              </Text>
              <Ionicons name="open-outline" size={13} color="#a78bfa" />
            </TouchableOpacity>
          )}
          {!!onReplace && (
            <TouchableOpacity
              onPress={onReplace}
              activeOpacity={0.8}
              style={styles.replaceBtn}
            >
              <Ionicons name="shuffle-outline" size={14} color="#7eb8f7" />
              <Text style={styles.replaceBtnText}>
                {lang === "en" ? "Replace with nearby" : "Sostituisci con alternativa vicina"}
              </Text>
            </TouchableOpacity>
          )}
          {(stop.tags ?? []).length > 0 && (
            <View style={styles.tags}>
              {stop.tags!.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Free Time ─────────────────────────────────────────────────────────────────

function FreeTimeStop({
  stop,
  lang,
  freeTimeLabel,
}: {
  stop: Stop;
  lang: string;
  freeTimeLabel: string;
}) {
  const displayName = (lang === "en" && stop.name_en) ? stop.name_en : stop.name;
  const displayDesc = (lang === "en" && stop.description_en) ? stop.description_en : stop.description;

  return (
    <View style={styles.freeTimeCard}>
      <Text style={styles.freeTimeEmoji}>🚶</Text>
      <View style={styles.flex1}>
        <Text style={styles.freeTimeLabel}>{freeTimeLabel}</Text>
        <Text style={styles.freeTimeName}>{displayName}</Text>
        {!!displayDesc && (
          <Text style={styles.freeTimeDesc}>{displayDesc}</Text>
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row:     { flexDirection: "row", alignItems: "center", gap: 8 },
  nameRow: { flexDirection: "row", alignItems: "flex-start", gap: 5, flex: 1, marginBottom: 3 },
  flex1:   { flex: 1 },
  attractionCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  indexBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  indexText:      { fontWeight: "700", fontSize: 13 },
  attractionEmoji:{ fontSize: 15, lineHeight: 20, flexShrink: 0 },
  attractionName: { color: "#f0f0f0", fontWeight: "600", fontSize: 14, flex: 1, lineHeight: 19 },
  metaText:       { color: "#777", fontSize: 12, marginRight: 6 },
  foodStopCard: {
    backgroundColor: "#0f1f1a",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1e3a2e",
  },
  foodIndexBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#6ee7b7",
    backgroundColor: "#6ee7b728",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  foodIndexText: { color: "#6ee7b7", fontWeight: "700", fontSize: 13 },
  foodStopName: { color: "#f0f0f0", fontWeight: "600", fontSize: 14, lineHeight: 19 },
  foodStopDesc: { color: "#7aa895", fontSize: 12, lineHeight: 17, marginTop: 2 },
  levelBadge:     { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  levelText:      { fontSize: 10, fontWeight: "600" },
  ticketBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: "#a78bfa18",
    borderWidth: 1,
    borderColor: "#a78bfa44",
    flexShrink: 0,
  },
  mapsIcon: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: "#6ee7b718",
    borderWidth: 1,
    borderColor: "#6ee7b744",
    flexShrink: 0,
  },
  expandedBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  description: { color: "#b0b0c8", fontSize: 13, lineHeight: 19 },
  ticketFullBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#a78bfa15",
    borderWidth: 1,
    borderColor: "#a78bfa44",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  ticketFullText: { color: "#a78bfa", fontWeight: "600", fontSize: 13 },
  replaceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#7eb8f712",
    borderWidth: 1,
    borderColor: "#7eb8f740",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  replaceBtnText: { color: "#7eb8f7", fontSize: 12, fontWeight: "600" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  tag: {
    backgroundColor: "#2a2a42",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { color: "#777", fontSize: 11 },
  freeTimeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#6ee7b712",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#6ee7b740",
    padding: 12,
    marginBottom: 8,
    marginLeft: 12,
  },
  freeTimeEmoji: { fontSize: 22, marginTop: 2 },
  freeTimeLabel: {
    color: "#6ee7b7",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  freeTimeName: { color: "#f0f0f0", fontWeight: "600", fontSize: 14, marginTop: 1 },
  freeTimeDesc: { color: "#888", fontSize: 12, marginTop: 3, lineHeight: 17 },
});
