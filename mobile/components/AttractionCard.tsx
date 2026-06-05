import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Attraction } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const LEVEL_COLORS: Record<number, string> = {
  1: "#e8c06a",
  2: "#7eb8f7",
  3: "#a78bfa",
};

interface Props {
  attraction: Attraction;
  index: number;
}

export function AttractionCard({ attraction, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { lang, t } = useLanguage();
  const { colors, isDark } = useTheme();

  const LEVEL_LABELS: Record<number, string> = {
    1: t.levelIconic,
    2: t.levelCurated,
    3: t.levelHidden,
  };

  const color = LEVEL_COLORS[attraction.category_level] ?? "#ccc";
  const displayName = (lang === "en" && attraction.name_en) ? attraction.name_en : attraction.name;
  const displayDesc = (lang === "en" && attraction.description_en) ? attraction.description_en : attraction.description;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const wikiBg = isDark ? "#1a1a40" : "#eeeaf8";

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card2, borderColor: colors.border }]}
      onPress={toggle}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.indexWrap}>
          {attraction.must_see && (
            <Ionicons name="star" size={12} color="#f5c84b" style={styles.mustSeeIndexIcon} />
          )}
          <View style={[styles.indexBadge, { backgroundColor: color + "33", borderColor: color }]}>
            <Text style={[styles.indexText, { color }]}>{index}</Text>
          </View>
        </View>
        <View style={styles.titleBlock}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
          </View>
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={12} color={colors.textSub} />
            <Text style={[styles.metaText, { color: colors.textSub }]}>{attraction.estimated_visit_time} min</Text>
            <View style={[styles.levelBadge, { backgroundColor: color + "22" }]}>
              <Text style={[styles.levelText, { color }]}>
                {LEVEL_LABELS[attraction.category_level]}
              </Text>
            </View>
          </View>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textMuted}
        />
      </View>

      {expanded && (
        <View style={[styles.body, { borderTopColor: colors.border }]}>
          <Text style={[styles.description, { color: colors.textSub }]}>{displayDesc}</Text>
          {!!attraction.wiki_snippet && (
            <View style={[styles.wikiBlock, { backgroundColor: wikiBg }]}>
              <Ionicons name="information-circle-outline" size={14} color={colors.accentBlue} />
              <Text style={[styles.wikiText, { color: isDark ? "#a0b4d0" : "#3a5570" }]}>{attraction.wiki_snippet}</Text>
            </View>
          )}
          {attraction.tags.length > 0 && (
            <View style={styles.tags}>
              {attraction.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.border }]}>
                  <Text style={[styles.tagText, { color: colors.textSub }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  indexWrap: {
    width: 32,
    alignItems: "center",
    flexShrink: 0,
  },
  mustSeeIndexIcon: {
    marginBottom: 2,
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  indexText: {
    fontWeight: "700",
    fontSize: 14,
  },
  titleBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginBottom: 3,
  },
  name: {
    fontWeight: "600",
    fontSize: 15,
    flex: 1,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    marginRight: 6,
  },
  levelBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  levelText: {
    fontSize: 10,
    fontWeight: "600",
  },
  body: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
  },
  wikiBlock: {
    flexDirection: "row",
    gap: 6,
    padding: 10,
    borderRadius: 10,
    alignItems: "flex-start",
  },
  wikiText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
  },
});
