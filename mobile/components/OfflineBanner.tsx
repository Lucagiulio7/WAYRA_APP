/**
 * OfflineBanner — banner persistente che appare quando l'utente è offline.
 *
 * Si posiziona in cima alla SafeArea con un'animazione slide-down/up.
 * Non blocca l'interazione: l'app continua a funzionare con i dati cached.
 */

import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Testi ────────────────────────────────────────────────────────────────────

const COPY = {
  en: {
    offline: "No connection — showing cached data",
    back:    "Back online",
  },
  it: {
    offline: "Nessuna connessione — dati in cache",
    back:    "Connessione ripristinata",
  },
} as const;

// ─── Costanti animazione ───────────────────────────────────────────────────────

const BANNER_H = 36;          // altezza banner (px)
const BACK_VISIBLE_MS = 2500; // ms in cui rimane visibile il "tornato online"

// ─── Componente ───────────────────────────────────────────────────────────────

export function OfflineBanner() {
  const { isOnline, isInternetReachable } = useNetworkStatus();
  const { lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const t = COPY[lang as keyof typeof COPY] ?? COPY.it;

  // Considera "noto online" solo quando isInternetReachable è esplicitamente
  // true (non null = ancora in corso). Finché è null non mostriamo nulla.
  const isDefinitelyOffline = isInternetReachable === false;
  const isDefinitelyOnline  = isInternetReachable === true;

  // Traccia lo stato precedente per rilevare la transizione offline→online
  const wasOffline = useRef(false);
  const backTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 0 = nascosto sopra lo schermo, 1 = visibile
  const slideAnim  = useRef(new Animated.Value(0)).current;
  // 0 = banner offline (arancio), 1 = banner "back online" (verde)
  const modeAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isDefinitelyOffline) {
      // Passa offline
      wasOffline.current = true;
      clearBackTimer();
      // Mostra banner offline
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(modeAnim,  { toValue: 0, duration: 200, useNativeDriver: false }),
      ]).start();
    } else if (isDefinitelyOnline && wasOffline.current) {
      // Torna online dopo essere stato offline
      wasOffline.current = false;
      // Anima verso "back online" (verde)
      Animated.timing(modeAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();
      // Dopo BACK_VISIBLE_MS nasconde il banner
      backTimer.current = setTimeout(() => {
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
      }, BACK_VISIBLE_MS);
    }
    // Se era online sin dall'inizio (wasOffline mai settato) non mostriamo nulla
  }, [isDefinitelyOffline, isDefinitelyOnline]);

  // Cleanup timer on unmount
  useEffect(() => () => { clearBackTimer(); }, []);

  function clearBackTimer() {
    if (backTimer.current) {
      clearTimeout(backTimer.current);
      backTimer.current = null;
    }
  }

  // Interpolazioni colore
  const bgColor = modeAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ["#b45309", "#15803d"],   // ambra scuro → verde scuro
  });
  const iconColor = modeAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ["#fef3c7", "#dcfce7"],
  });

  // Traduzione verticale: -BANNER_H-insets.top (fuori schermo) → 0 (visibile)
  const translateY = slideAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [-(BANNER_H + insets.top), 0],
  });

  const label = modeAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, 1],  // useremo un ternario sotto
  });
  void label; // usato solo per il side-effect; testo gestito con stato derivato

  const showBackText = isDefinitelyOnline && !isDefinitelyOffline;

  return (
    <Animated.View
      style={[
        styles.banner,
        { paddingTop: insets.top, transform: [{ translateY }], backgroundColor: bgColor },
      ]}
      pointerEvents="none"          // non blocca touch agli schermi sottostanti
    >
      <View style={styles.inner}>
        <Animated.Text style={{ color: iconColor }}>
          <Ionicons
            name={showBackText ? "checkmark-circle" : "cloud-offline-outline"}
            size={14}
          />
        </Animated.Text>
        <Text style={styles.text}>
          {showBackText ? t.back : t.offline}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Stili ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    minHeight: BANNER_H,
  },
  inner: {
    height: BANNER_H,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
  },
  text: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
