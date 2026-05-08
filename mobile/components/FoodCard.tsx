import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Food } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  food: Food;
  expanded?: boolean;
  onToggle?: () => void;
}

export function FoodCard({ food, expanded: controlledExpanded, onToggle }: Props) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const { lang, t } = useLanguage();
  const expanded = controlledExpanded ?? internalExpanded;

  const displayName        = (lang === "en" && food.name_en)         ? food.name_en         : food.name;
  const displayDesc        = (lang === "en" && food.description_en)  ? food.description_en  : food.description;
  const displayIngredients = (lang === "en" && food.ingredients_en?.length) ? food.ingredients_en : food.ingredients;

  const places = food.places ?? [];

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (onToggle) onToggle();
    else setInternalExpanded((v) => !v);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={toggle} activeOpacity={0.85}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🍝</Text>
        <Text style={styles.name}>{displayName}</Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color="#666" />
      </View>

      {expanded && (
        <View style={styles.body}>
          <Text style={styles.description}>{displayDesc}</Text>

          {/* Ingredienti */}
          <View style={styles.ingredientsBlock}>
            <View style={styles.ingredientsList}>
              {displayIngredients.map((ing, i) => (
                <View key={i} style={styles.ingredientChip}>
                  <Text style={styles.ingredientText}>{ing}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Ristoranti consigliati */}
          {places.length > 0 && (
            <View style={styles.placesBlock}>
              <Text style={styles.placesTitle}>📍 {t.whereToEat}</Text>
              {places.map((place, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.placeRow}
                  onPress={() => Linking.openURL(place.maps_link)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="restaurant-outline" size={14} color="#e8c06a" style={styles.placeIcon} />
                  <Text style={styles.placeName}>{place.name}</Text>
                  <Ionicons name="open-outline" size={13} color="#666" />
                </TouchableOpacity>
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
  emoji: {
    fontSize: 22,
  },
  name: {
    flex: 1,
    color: "#f0f0f0",
    fontWeight: "600",
    fontSize: 15,
  },
  body: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a42",
    gap: 12,
  },
  description: {
    color: "#c0c0d8",
    fontSize: 13,
    lineHeight: 20,
  },
  ingredientsBlock: {
    gap: 8,
  },
  ingredientsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  ingredientChip: {
    backgroundColor: "#e8c06a22",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#e8c06a44",
  },
  ingredientText: {
    color: "#e8c06a",
    fontSize: 12,
  },
  placesBlock: {
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#2a2a42",
  },
  placesTitle: {
    color: "#a0a0c0",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#252540",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#33334a",
  },
  placeIcon: {
    width: 16,
  },
  placeName: {
    flex: 1,
    color: "#dcdcf0",
    fontSize: 13,
    fontWeight: "500",
  },
});
