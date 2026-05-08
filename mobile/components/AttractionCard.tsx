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

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const LEVEL_COLORS: Record<number, string> = {
  1: "#e8c06a",
  2: "#7eb8f7",
  3: "#a78bfa",
};

const LEVEL_LABELS: Record<number, string> = {
  1: "Iconico",
  2: "Ricercato",
  3: "Nascosto",
};

interface Props {
  attraction: Attraction;
  index: number;
}

export function AttractionCard({ attraction, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const color = LEVEL_COLORS[attraction.category_level] ?? "#ccc";

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={toggle} activeOpacity={0.85}>
      <View style={styles.header}>
        <View style={[styles.indexBadge, { backgroundColor: color + "33", borderColor: color }]}>
          <Text style={[styles.indexText, { color }]}>{index}</Text>
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{attraction.name}</Text>
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={12} color="#888" />
            <Text style={styles.metaText}>{attraction.estimated_visit_time} min</Text>
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
          color="#666"
        />
      </View>

      {expanded && (
        <View style={styles.body}>
          <Text style={styles.description}>{attraction.description}</Text>
          {!!attraction.wiki_snippet && (
            <View style={styles.wikiBlock}>
              <Ionicons name="information-circle-outline" size={14} color="#7eb8f7" />
              <Text style={styles.wikiText}>{attraction.wiki_snippet}</Text>
            </View>
          )}
          {attraction.tags.length > 0 && (
            <View style={styles.tags}>
              {attraction.tags.map((tag) => (
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e1e30",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2a2a42",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  name: {
    color: "#f0f0f0",
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 3,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: "#888",
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
    borderTopColor: "#2a2a42",
    gap: 8,
  },
  description: {
    color: "#c0c0d8",
    fontSize: 13,
    lineHeight: 20,
  },
  wikiBlock: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#1a1a40",
    padding: 10,
    borderRadius: 10,
    alignItems: "flex-start",
  },
  wikiText: {
    flex: 1,
    color: "#a0b4d0",
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
    backgroundColor: "#2a2a42",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    color: "#888",
    fontSize: 11,
  },
});
