import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Food } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { localizedField, localizedName, localizedDescription } from "@/utils/localization";
import { curatedFoodIcon } from "@/data/foodIcons";
import { openExternalLink } from "@/utils/externalLinks";

const emoji = (...points: number[]) => String.fromCodePoint(...points);

const FOOD_EMOJI_RULES: Array<{ pattern: RegExp; icon: string }> = [
  { pattern: /croissant/i, icon: emoji(0x1F950) },
  { pattern: /tarte tatin|apple|mele|mela/i, icon: emoji(0x1F34E) },
  { pattern: /croque monsieur|croque-monsieur|toast/i, icon: emoji(0x1F96A) },
  { pattern: /macaron/i, icon: emoji(0x1F36A) },
  { pattern: /escargot|snail|lumache|lumaca/i, icon: emoji(0x1F40C) },
  { pattern: /pastel de nata|pasteis de nata|custard tart/i, icon: emoji(0x1F967) },
  { pattern: /cataplana|marisco|mariscos/i, icon: emoji(0x1F990) },
  { pattern: /acorda|bread stew/i, icon: emoji(0x1F963) },
  { pattern: /ginjinha|sour cherry liqueur/i, icon: emoji(0x1F377) },
  { pattern: /bifana/i, icon: emoji(0x1F96A) },
  { pattern: /pa amb tomaquet|bread with tomato/i, icon: emoji(0x1F345) },
  { pattern: /fideua/i, icon: emoji(0x1F958) },
  { pattern: /croquetas|croquettes/i, icon: emoji(0x1F9C6) },
  { pattern: /bombas de la barceloneta|barceloneta bombas/i, icon: emoji(0x1F954) },
  { pattern: /crema catalana|catalan cream/i, icon: emoji(0x1F36E) },
  { pattern: /escalivada/i, icon: emoji(0x1F957) },
  { pattern: /patatas bravas/i, icon: emoji(0x1F954) },
  { pattern: /coca de recapte/i, icon: emoji(0x1FAD3) },
  { pattern: /cocido madrileno|cocido madrileño/i, icon: emoji(0x1F372) },
  { pattern: /bocadillo de calamares|calamari sandwich/i, icon: emoji(0x1F991) },
  { pattern: /tortilla espanola|tortilla española|spanish omelette/i, icon: emoji(0x1F373) },
  { pattern: /callos|tripe/i, icon: emoji(0x1F372) },
  { pattern: /churros/i, icon: emoji(0x1F369) },
  { pattern: /croquetas de jamon|croquetas de jamón|ham croquettes/i, icon: emoji(0x1F9C6) },
  { pattern: /oreja|pig ear/i, icon: emoji(0x1F969) },
  { pattern: /suppli|suppli al telefono|arancini|arancino/i, icon: emoji(0x1F359) },
  { pattern: /maritozzo|brioche/i, icon: emoji(0x1F950) },
  { pattern: /carciofo|carciofi|artichoke|artichokes/i, icon: emoji(0x1F957) },
  { pattern: /tarallo|pretzel/i, icon: emoji(0x1F968) },
  { pattern: /sfogliatella/i, icon: emoji(0x1F950) },
  { pattern: /baba|babà/i, icon: emoji(0x1F370) },
  { pattern: /cuoppo|fritto misto|fried cone/i, icon: emoji(0x1F364) },
  { pattern: /pizza|pinsa|pizzetta/i, icon: emoji(0x1F355) },
  { pattern: /crepe|crepes|pancake|poffertjes|palacsinta/i, icon: emoji(0x1F95E) },
  { pattern: /carbonara|amatriciana|cacio|pepe|gricia|ragu|genovese|pasta|spaghetti|bucatini|rigatoni|tagliatelle|fettucc|lasagn|gnocchi|pierogi|spaetzle/i, icon: emoji(0x1F35D) },
  { pattern: /risotto|paella|rice|riso|arancini|suppli|rijsttafel/i, icon: emoji(0x1F35A) },
  { pattern: /fish|pesce|baccal|bacalhau|cod|salmon|sardine|sarde|aringa|herring|trout|trota|seafood|gamber|calamari|prawn|shrimp|aalsuppe|eel|plaice|scholle/i, icon: emoji(0x1F41F) },
  { pattern: /soup|zuppa|brodo|goulash|erwtensoep|aalsuppe|caldo/i, icon: emoji(0x1F963) },
  { pattern: /steak|beef|bue|oxtail|coda|veal|vitello|pork|maiale|speck|salsiccia|sausage|kebab|lamb|agnello|abbacchio|schnitzel|kassler|meat|carne|cozido/i, icon: emoji(0x1F969) },
  { pattern: /chicken|pollo|duck|anatra|goose|oca/i, icon: emoji(0x1F357) },
  { pattern: /cheese|formaggio|pecorino|kaas|reblochon|raclette|fondue|feta|bryndza/i, icon: emoji(0x1F9C0) },
  { pattern: /salad|insalata|piyaz|verdura|vegetable|artichoke|carciof|kale|grunkohl|gruenkohl|beans|bohnen/i, icon: emoji(0x1F957) },
  { pattern: /bread|pane|focaccia|brotchen|sandwich|panino|baguette/i, icon: emoji(0x1F956) },
  { pattern: /brioche|maritozzo|franzbrotchen|pastry|sfoglia|pasteis|pastel|strudel|baklava|waffel|waffle|stroopwafel|tart|torta|cake|dessert|dolce|chocolate|cioccolat/i, icon: emoji(0x1F370) },
  { pattern: /gelato|ice.?cream|sorbet/i, icon: emoji(0x1F368) },
  { pattern: /coffee|caffe|espresso/i, icon: emoji(0x2615) },
  { pattern: /beer|birra|bier/i, icon: emoji(0x1F37A) },
  { pattern: /wine|vino|vin |genepi|liqueur|porto|port wine/i, icon: emoji(0x1F377) },
  { pattern: /olive|olio/i, icon: emoji(0x1FAD2) },
  { pattern: /orange|arancia|nata|fruit|frutta|berry|grutze/i, icon: emoji(0x1F34A) },
  { pattern: /potato|patata|kartoffel|stamppot|gratin/i, icon: emoji(0x1F954) },
  { pattern: /fried|fritto|fritta|fritt|bitterballen|croquette|crocchett/i, icon: emoji(0x1F9C6) },
];

function normalizeFoodText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getFoodEmoji(name: string, description?: string | null, ingredients?: string[]): string {
  const text = normalizeFoodText(`${name} ${description ?? ""} ${(ingredients ?? []).join(" ")}`);
  return FOOD_EMOJI_RULES.find((rule) => rule.pattern.test(text))?.icon ?? emoji(0x1F37D, 0xFE0F);
}

function localizedFoodName(food: Food, lang: string): string {
  return localizedName(food, lang);
}

function localizedFoodDescription(food: Food, lang: string): string {
  return localizedDescription(food, lang);
}

function localizedFoodIngredients(food: Food, lang: string): string[] {
  return localizedField<string[]>(food, "ingredients", lang, []);
}

function localizedFoodPlaceName(place: NonNullable<Food["places"]>[number], lang: string): string {
  return localizedName(place, lang);
}

function getStableFoodEmoji(food: Food): string {
  const curatedIcon = curatedFoodIcon(food.city, food.name);
  if (curatedIcon) return curatedIcon;

  const allIngredients = [
    ...(food.ingredients ?? []),
    ...(food.ingredients_en ?? []),
    ...(food.ingredients_fr ?? []),
    ...(food.ingredients_es ?? []),
  ];
  return getFoodEmoji(
    `${food.name} ${food.name_en ?? ""} ${food.name_fr ?? ""} ${food.name_es ?? ""}`.trim(),
    `${food.description ?? ""} ${food.description_en ?? ""} ${food.description_fr ?? ""} ${food.description_es ?? ""}`.trim(),
    allIngredients,
  );
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

  const displayName = localizedFoodName(food, lang);
  const displayDesc = localizedFoodDescription(food, lang);
  const displayIngredients = localizedFoodIngredients(food, lang);

  const places = food.places ?? [];
  const foodIcon = getStableFoodEmoji(food);

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
        <View style={[styles.iconBox, { backgroundColor: colors.accentGold + "18", borderColor: colors.accentGold + "44" }]}>
          <Text style={styles.foodEmoji}>{foodIcon}</Text>
        </View>
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
                {t.whereToEat}
              </Text>
              {places.map((place, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.placeRow, { backgroundColor: colors.card2, borderColor: colors.border }]}
                  onPress={() => openExternalLink(place.maps_link, lang)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="restaurant-outline" size={14} color={colors.accentGold} style={styles.placeIcon} />
                  <View style={styles.placeContent}>
                    <Text style={[styles.placeName, { color: colors.text }]}>{localizedFoodPlaceName(place, lang)}</Text>
                    <Text style={[styles.placeEvidence, { color: colors.textMuted }]}>
                      {place.rating
                        ? `${place.rating.toFixed(1)} / 5`
                        : place.curated
                          ? (lang === "es" ? "Selección editorial" : lang === "fr" ? "Sélection éditoriale" : lang === "en" ? "Editorial selection" : "Selezione editoriale")
                          : (lang === "es" ? "Lugar sugerido" : lang === "fr" ? "Adresse suggérée" : lang === "en" ? "Suggested place" : "Locale suggerito")}
                    </Text>
                  </View>
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
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  foodEmoji: {
    fontSize: 17,
    lineHeight: 21,
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
    fontSize: 13,
    fontWeight: "500",
  },
  placeContent: {
    flex: 1,
    gap: 2,
  },
  placeEvidence: {
    fontSize: 11,
  },
});
