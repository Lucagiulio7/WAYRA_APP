/**
 * Skeleton — primitivi per placeholder animati (shimmer/pulse).
 *
 * Esporta:
 *  - SkeletonBox       blocco rettangolare pulsante (base)
 *  - AttractionCardSkeleton  replica della AttractionCard del builder
 *  - SkeletonList      N card skeleton pronte per sostituire ActivityIndicator
 */

import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View, ViewStyle, LayoutChangeEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/ThemeContext";

// ─── Animazione shimmer ───────────────────────────────────────────────────────
// Un gradient che scorre da sinistra a destra, infinitamente.
// Più fluido del classico pulse-opacity, comunica "lavoro in corso".

const SHIMMER_DURATION = 1100; // ms per ciclo

function useShimmer() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: SHIMMER_DURATION,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return anim;
}

// ─── SkeletonBox ─────────────────────────────────────────────────────────────

interface BoxProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width = "100%", height = 14, borderRadius = 6, style }: BoxProps) {
  const { colors, isDark } = useTheme();
  const anim = useShimmer();
  const [boxWidth, setBoxWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== boxWidth) setBoxWidth(w);
  };

  // Il gradient è largo 2× la box e scorre da -boxWidth a +boxWidth
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-boxWidth, boxWidth],
  });

  // Colore base e highlight del shimmer
  const baseColor = colors.border;
  const highlight = isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.55)";

  return (
    <View
      onLayout={handleLayout}
      style={[
        {
          width: width as ViewStyle["width"],
          height,
          borderRadius,
          backgroundColor: baseColor,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {boxWidth > 0 && (
        <Animated.View
          style={{
            width: boxWidth * 2,
            height: "100%",
            transform: [{ translateX }],
          }}
        >
          <LinearGradient
            colors={["transparent", highlight, "transparent"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
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

// ─── ItinerarySkeleton ────────────────────────────────────────────────────────
// Usato nell'overlay di generazione per mostrare visivamente "cosa stiamo costruendo".

function DaySkeletonMini({ stopsCount }: { stopsCount: number }) {
  const { colors } = useTheme();
  return (
    <View style={[iStyles.dayCard, { backgroundColor: colors.card2, borderColor: colors.border }]}>
      {/* Header giorno */}
      <View style={iStyles.dayHeader}>
        <SkeletonBox width={68} height={11} borderRadius={4} />
        <SkeletonBox width={28} height={11} borderRadius={4} />
      </View>
      {/* Tappe */}
      {Array.from({ length: stopsCount }).map((_, i) => (
        <View key={i} style={iStyles.stopRow}>
          <SkeletonBox width={22} height={22} borderRadius={11} style={{ flexShrink: 0 }} />
          <View style={iStyles.stopText}>
            <SkeletonBox width="70%" height={10} borderRadius={4} />
            <SkeletonBox width="42%" height={8}  borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ItinerarySkeleton({ days = 2 }: { days?: number }) {
  return (
    <View style={iStyles.wrap}>
      {Array.from({ length: days }).map((_, d) => (
        <DaySkeletonMini key={d} stopsCount={d === 0 ? 3 : 2} />
      ))}
    </View>
  );
}

const iStyles = StyleSheet.create({
  wrap:    { width: "100%", gap: 8 },
  dayCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stopText: { flex: 1, gap: 5 },
});

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
