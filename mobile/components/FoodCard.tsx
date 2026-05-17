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
import { useTheme } from "@/contexts/ThemeContext";

// ── Emoji dinamica per piatto ─────────────────────────────────────────────────

const FOOD_EMOJI_MAP: Array<[RegExp, string]> = [
  [/pizza/i,                                                           "🍕"],
  [/gelato|ice.?cream/i,                                               "🍦"],
  [/pasta|spaghetti|tagliat|fettuc|penne|rigatoni|lasagna|gnocchi|carbonara|amatriciana|cacio/i, "🍝"],
  [/risotto/i,                                                         "🍚"],
  [/paella/i,                                                          "🥘"],
  [/tagine|tajin|couscous/i,                                           "🫕"],
  [/moussaka|musaka/i,                                                 "🥘"],
  [/gyro|souvlaki|kebab|shawarma|doner/i,                              "🥙"],
  [/schnitzel|wurst|bratwurst|sausage/i,                               "🥩"],
  [/fish|pesce|baccalà|bacalhau|cod|salmon|sardine|trout/i,            "🐟"],
  [/seafood|gamberi|calamari|prawn|shrimp/i,                           "🦐"],
  [/meat|carne|steak|bistecca/i,                                       "🥩"],
  [/burger|sandwich|panino/i,                                          "🥪"],
  [/salad|insalata/i,                                                  "🥗"],
  [/cheese|formaggio|raclette|fondue/i,                                "🧀"],
  [/soup|zuppa|minestra|stew|gazpacho|borsch/i,                        "🍲"],
  [/curry|tikka|masala/i,                                              "🍛"],
  [/baklava|pastry|strudel|pasteis|tart|dolce|torta/i,                 "🥐"],
  [/chocolate|cioccolat/i,                                             "🍫"],
  [/coffee|caffè|espresso/i,                                           "☕"],
  [/beer|birra|bier/i,                                                 "🍺"],
  [/wine|vino/i,                                                       "🍷"],
];

function getFoodEmoji(name: string, description?: string | null): string {
  const text = `${name} ${description ?? ""}`;
  for (const [regex, emoji] of FOOD_EMOJI_MAP) {
    if (regex.test(text)) return emoji;
  }
  return "🍴";
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  food: Food;
  expanded?: boolean;
  onToggle?: () => void;
}

export function FoodCard({ food, expanded: controlledExpanded, onToggle }: Props) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const expanded = controlledExpanded ?? internalExpanded;

  const displayName        = (lang === "en" && food.name_en)         ? food.name_en         : food.name;
  const displayDesc        = (lang === "en" && food.description_en)  ? food.description_en  : food.description;
  const displayIngredients = (lang === "en" && food.ingredients_en?.length) ? food.ingredients_en : food.ingredients;

  const places = food.places ?? [];
  const emoji  = getFoodEmoji(displayName, displayDesc);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (onToggle) onToggle();
    else setInternalExpanded((v) => !v);
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={toggle}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.textMuted} />
      </View>

      {expanded && (
        <View style={[styles.body, { borderTopColor: colors.border }]}>
          <Text style={[styles.description, { color: colors.textSub }]}>{displayDesc}</Text>

          {/* Ingredienti */}
          <View style={styles.ingredientsBlock}>
            <View style={styles.ingredientsList}>
              {displayIngredients.map((ing, i) => (
                <View key={i} style={[styles.ingredientChip, { backgroundColor: colors.accentGold + "22", borderColor: colors.accentGold + "44" }]}>
                  <Text style={[styles.ingredientText, { color: colors.accentGold }]}>{ing}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Ristoranti consigliati */}
          {places.length > 0 && (
            <View style={[styles.placesBlock, { borderTopColor: colors.border }]}>
              <Text style={[styles.placesTitle, { color: colors.textMuted }]}>
                📍 {t.whereToEat}
              </Text>
              {places.map((place, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.placeRow, { backgroundColor: colors.card2, borderColor: colors.border }]}
                  onPress={() => Linking.openURL(place.maps_link)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="restaurant-outline" size={14} color={colors.accentGold} style={styles.placeIcon} />
                  <Text style={[styles.placeName, { color: colors.text }]}>{place.name}</Text>
                  <Ionicons name="open-outline" size={13} color={colors.textMuted} />
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
  emoji: {
    fontSize: 22,
  },
  name: {
    flex: 1,
    fontWeight: "600",
    fontSize: 15,
  },
  body: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  description: {
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
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  ingredientText: {
    fontSize: 12,
  },
  placesBlock: {
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
  },
  placesTitle: {
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
    borderRadius: 9,
    borderWidth: 1,
  },
  placeIcon: {
    width: 16,
  },
  placeName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
});
