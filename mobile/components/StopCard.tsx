import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stop } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

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
  onNoteChange?: (note: string) => void;
}

export function StopCard({ stop, index, onReplace, onNoteChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { lang, t } = useLanguage();
  const { colors, isDark } = useTheme();

  const LEVEL_LABELS: Record<number, string> = {
    1: t.levelIconicBadge,
    2: t.levelCuratedBadge,
    3: t.levelHiddenBadge,
  };

  if (stop.type === "free_time") {
    return <FreeTimeStop stop={stop} lang={lang} freeTimeLabel={t.freeTimeLabel} colors={colors} />;
  }

  // "food" = vecchio formato, "meal" = formato backend attuale
  if (stop.type === "food" || stop.type === "meal") {
    return <FoodStop stop={stop} lang={lang} index={index ?? 1} colors={colors} isDark={isDark} onNoteChange={onNoteChange} />;
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
      onNoteChange={onNoteChange}
      colors={colors}
      isDark={isDark}
    />
  );
}

// ── Food stop ─────────────────────────────────────────────────────────────────

function FoodStop({
  stop, lang, index, colors, isDark, onNoteChange,
}: {
  stop: Stop; lang: string; index: number; colors: any; isDark: boolean;
  onNoteChange?: (note: string) => void;
}) {
  const [expanded, setExpanded]   = useState(false);
  const [noteText, setNoteText]   = useState(stop.notes ?? "");
  useEffect(() => { setNoteText(stop.notes ?? ""); }, [stop.notes]);

  const displayName = (lang === "en" && stop.name_en) ? stop.name_en : stop.name;
  const displayDesc = (lang === "en" && stop.description_en) ? stop.description_en : stop.description;
  const emoji = stop.attraction_type ? getAttractionEmoji(stop.attraction_type) : "🍴";

  const openMaps = async () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`;
    try { await Linking.openURL(url); }
    catch { Alert.alert("Errore", "Impossibile aprire Maps."); }
  };

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const foodBg     = isDark ? "#0f1f1a" : "#eaf7f3";
  const foodBorder = isDark ? "#1e3a2e" : "#b8dfd4";

  return (
    <TouchableOpacity
      style={[styles.foodStopCard, { backgroundColor: foodBg, borderColor: foodBorder }]}
      onPress={toggle}
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        <View style={[styles.foodIndexBadge, { borderColor: colors.accentGreen, backgroundColor: colors.accentGreen + "28" }]}>
          <Text style={[styles.foodIndexText, { color: colors.accentGreen }]}>{index}</Text>
        </View>
        <Text style={styles.attractionEmoji}>{emoji}</Text>
        <View style={styles.flex1}>
          <Text style={[styles.foodStopName, { color: colors.text }]} numberOfLines={2}>{displayName}</Text>
          {!!displayDesc && (
            <Text style={[styles.foodStopDesc, { color: isDark ? "#7aa895" : "#3d7a65" }]} numberOfLines={2}>{displayDesc}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={openMaps}
          activeOpacity={0.7}
          style={[styles.mapsIcon, { backgroundColor: colors.accentGreen + "18", borderColor: colors.accentGreen + "44" }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="location-outline" size={18} color={colors.accentGreen} />
        </TouchableOpacity>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
      </View>

      {expanded && (
        <View style={[styles.expandedBody, { borderTopColor: foodBorder }]}>
          <NoteInput
            value={noteText}
            onChange={setNoteText}
            onBlur={() => onNoteChange?.(noteText)}
            lang={lang}
            colors={colors}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Attraction stop ───────────────────────────────────────────────────────────

function AttractionStop({
  stop, index, expanded, setExpanded, lang, levelLabels, onReplace, onNoteChange, colors, isDark,
}: {
  stop: Stop;
  index: number;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  lang: string;
  levelLabels: Record<number, string>;
  onReplace?: () => void;
  onNoteChange?: (note: string) => void;
  colors: any;
  isDark: boolean;
}) {
  const [noteText, setNoteText] = useState(stop.notes ?? "");
  useEffect(() => { setNoteText(stop.notes ?? ""); }, [stop.notes]);

  const color  = LEVEL_COLORS[stop.category_level ?? 1] ?? "#ccc";
  const museum = isMuseum(stop.attraction_type);
  const emoji  = getAttractionEmoji(stop.attraction_type);

  const displayName = (lang === "en" && stop.name_en) ? stop.name_en : stop.name;
  const displayDesc = (lang === "en" && stop.description_en) ? stop.description_en : stop.description;

  // Museum gets a subtle purple tint that works on both themes
  const cardBg     = museum ? (isDark ? "#1a0f2e" : "#f0eaff") : colors.card2;
  const cardBorder = museum ? "#7c3aed55" : colors.border;
  const expandedBorderColor = museum ? (isDark ? "#7c3aed22" : "#c4b0f0") : colors.border;

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
    const url = `https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`;
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
            <Text style={[styles.attractionName, { color: colors.text }]} numberOfLines={2}>{displayName}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="time-outline" size={12} color={colors.textSub} />
            <Text style={[styles.metaText, { color: colors.textSub }]}>{stop.estimated_visit_time} min</Text>
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
            style={[styles.ticketBtn, { backgroundColor: colors.accentPurple + "18", borderColor: colors.accentPurple + "44" }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="ticket-outline" size={18} color={colors.accentPurple} />
          </TouchableOpacity>
        )}

        {/* Icona Maps */}
        <TouchableOpacity
          onPress={openMaps}
          activeOpacity={0.7}
          style={[styles.mapsIcon, { backgroundColor: colors.accentGreen + "18", borderColor: colors.accentGreen + "44" }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="location-outline" size={18} color={colors.accentGreen} />
        </TouchableOpacity>

        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
      </View>

      {expanded && (
        <View style={[styles.expandedBody, { borderTopColor: expandedBorderColor }]}>
          {!!displayDesc && (
            <Text style={[styles.description, { color: colors.textSub }]}>{displayDesc}</Text>
          )}
          {museum && !!stop.ticket_url && (
            <TouchableOpacity
              style={[styles.ticketFullBtn, { backgroundColor: colors.accentPurple + "15", borderColor: colors.accentPurple + "44" }]}
              onPress={openTickets}
              activeOpacity={0.8}
            >
              <Ionicons name="ticket-outline" size={14} color={colors.accentPurple} />
              <Text style={[styles.ticketFullText, { color: colors.accentPurple }]}>
                {lang === "en" ? "Buy tickets online" : "Acquista biglietti online"}
              </Text>
              <Ionicons name="open-outline" size={13} color={colors.accentPurple} />
            </TouchableOpacity>
          )}
          {!!onReplace && (
            <TouchableOpacity
              onPress={onReplace}
              activeOpacity={0.8}
              style={[styles.replaceBtn, { backgroundColor: colors.accentBlue + "12", borderColor: colors.accentBlue + "40" }]}
            >
              <Ionicons name="shuffle-outline" size={14} color={colors.accentBlue} />
              <Text style={[styles.replaceBtnText, { color: colors.accentBlue }]}>
                {lang === "en" ? "Replace with nearby" : "Sostituisci con alternativa vicina"}
              </Text>
            </TouchableOpacity>
          )}
          {(stop.tags ?? []).length > 0 && (
            <View style={styles.tags}>
              {stop.tags!.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.border }]}>
                  <Text style={[styles.tagText, { color: colors.textSub }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          <NoteInput
            value={noteText}
            onChange={setNoteText}
            onBlur={() => onNoteChange?.(noteText)}
            lang={lang}
            colors={colors}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Note Input ────────────────────────────────────────────────────────────────

function NoteInput({
  value, onChange, onBlur, lang, colors,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  lang: string;
  colors: any;
}) {
  return (
    <View style={[styles.noteWrap, { borderColor: colors.border, backgroundColor: colors.inputBg ?? colors.bg }]}>
      <Ionicons name="pencil-outline" size={13} color={colors.textMuted} style={styles.noteIcon} />
      <TextInput
        style={[styles.noteInput, { color: colors.text }]}
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        placeholder={lang === "en" ? "Add a note…" : "Aggiungi una nota…"}
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={300}
        selectionColor={colors.accentGold}
      />
    </View>
  );
}

// ── Free Time ─────────────────────────────────────────────────────────────────

function FreeTimeStop({
  stop, lang, freeTimeLabel, colors,
}: {
  stop: Stop; lang: string; freeTimeLabel: string; colors: any;
}) {
  const displayName = (lang === "en" && stop.name_en) ? stop.name_en : stop.name;
  const displayDesc = (lang === "en" && stop.description_en) ? stop.description_en : stop.description;

  return (
    <View style={[styles.freeTimeCard, { backgroundColor: colors.accentGreen + "12", borderColor: colors.accentGreen + "40" }]}>
      <Text style={styles.freeTimeEmoji}>🚶</Text>
      <View style={styles.flex1}>
        <Text style={[styles.freeTimeLabel, { color: colors.accentGreen }]}>{freeTimeLabel}</Text>
        <Text style={[styles.freeTimeName, { color: colors.text }]}>{displayName}</Text>
        {!!displayDesc && (
          <Text style={[styles.freeTimeDesc, { color: colors.textSub }]}>{displayDesc}</Text>
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
  indexText:       { fontWeight: "700", fontSize: 13 },
  attractionEmoji: { fontSize: 15, lineHeight: 20, flexShrink: 0 },
  attractionName:  { fontWeight: "600", fontSize: 14, flex: 1, lineHeight: 19 },
  metaText:        { fontSize: 12, marginRight: 6 },
  foodStopCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  foodIndexBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  foodIndexText: { fontWeight: "700", fontSize: 13 },
  foodStopName:  { fontWeight: "600", fontSize: 14, lineHeight: 19 },
  foodStopDesc:  { fontSize: 12, lineHeight: 17, marginTop: 2 },
  levelBadge:    { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  levelText:     { fontSize: 10, fontWeight: "600" },
  ticketBtn: {
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
  },
  mapsIcon: {
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
  },
  expandedBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  description:   { fontSize: 13, lineHeight: 19 },
  ticketFullBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  ticketFullText: { fontWeight: "600", fontSize: 13 },
  replaceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  replaceBtnText: { fontSize: 12, fontWeight: "600" },
  tags:  { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  tag:   { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11 },
  noteWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 2,
  },
  noteIcon: { marginTop: 3, flexShrink: 0 },
  noteInput: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    minHeight: 36,
    paddingVertical: 0,
  },

  freeTimeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 8,
    marginLeft: 12,
  },
  freeTimeEmoji: { fontSize: 22, marginTop: 2 },
  freeTimeLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  freeTimeName: { fontWeight: "600", fontSize: 14, marginTop: 1 },
  freeTimeDesc: { fontSize: 12, marginTop: 3, lineHeight: 17 },
});
