/**
 * Skeleton — primitivi per placeholder animati (shimmer/pulse).
 *
 * Esporta:
 *  - SkeletonBox       blocco rettangolare pulsante (base)
 *  - AttractionCardSkeleton  replica della AttractionCard del builder
 *  - SkeletonList      N card skeleton pronte per sostituire ActivityIndicator
 */

import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

// ─── Animazione ───────────────────────────────────────────────────────────────

const DURATION = 900; // ms di un ciclo pulse

function usePulse() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: DURATION, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: DURATION, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });
}

// ─── SkeletonBox ─────────────────────────────────────────────────────────────

interface BoxProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width = "100%", height = 14, borderRadius = 6, style }: BoxProps) {
  const { colors } = useTheme();
  const opacity = usePulse();

  return (
    <Animated.View
      style={[
        {
          width: width as ViewStyle["width"],
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ─── AttractionCardSkeleton ───────────────────────────────────────────────────
// Replica la struttura di AttractionCard in create-itinerary.tsx:
//   [emoji 25px] + [col: riga nome + riga meta (chip + tempo)]

export function AttractionCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border2 }]}>
      {/* Emoji placeholder */}
      <SkeletonBox width={25} height={25} borderRadius={6} style={{ flexShrink: 0 }} />

      {/* Contenuto testuale */}
      <View style={styles.info}>
        {/* Nome (2 righe simulate) */}
        <SkeletonBox width="80%" height={14} borderRadius={5} style={{ marginBottom: 6 }} />
        <SkeletonBox width="55%" height={11} borderRadius={5} style={{ marginBottom: 10 }} />

        {/* Meta: chip tipo + tempo */}
        <View style={styles.meta}>
          <SkeletonBox width={56} height={18} borderRadius={8} />
          <SkeletonBox width={44} height={18} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

// ─── SkeletonList ─────────────────────────────────────────────────────────────

interface ListProps {
  count?: number;
}

export function SkeletonList({ count = 6 }: ListProps) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <AttractionCardSkeleton key={i} />
      ))}
    </View>
  );
}

// ─── Stili ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  info: {
    flex: 1,
  },
  meta: {
    flexDirection: "row",
    gap: 8,
  },
  list: {
    paddingTop: 4,
    paddingBottom: 24,
  },
});
