import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

type Props = {
  status: "loading" | "error";
  lang: string;
  accent?: string;
  onRetry?: () => void;
};

function copy(lang: string) {
  if (lang === "es") return { unavailable: "Mapa no disponible", retry: "Reintentar" };
  if (lang === "fr") return { unavailable: "Carte indisponible", retry: "Réessayer" };
  if (lang === "en") return { unavailable: "Map unavailable", retry: "Retry" };
  return { unavailable: "Mappa non disponibile", retry: "Riprova" };
}

export function MapStatusOverlay({ status, lang, accent, onRetry }: Props) {
  const { colors } = useTheme();
  const labels = copy(lang);
  const highlight = accent ?? colors.accentGold;

  return (
    <View style={[styles.overlay, { backgroundColor: colors.bg }]} accessibilityLiveRegion="polite">
      {status === "loading" ? (
        <ActivityIndicator color={highlight} size="large" />
      ) : (
        <>
          <Ionicons name="cloud-offline-outline" size={36} color={colors.textMuted} />
          <Text style={[styles.label, { color: colors.textSub }]}>{labels.unavailable}</Text>
          {onRetry ? (
            <TouchableOpacity
              onPress={onRetry}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={labels.retry}
              style={[styles.retry, { backgroundColor: colors.card2, borderColor: highlight + "70" }]}
            >
              <Ionicons name="refresh" size={21} color={highlight} />
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 25,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  retry: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
