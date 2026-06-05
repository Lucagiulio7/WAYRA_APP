import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewStyle } from "react-native";

interface Props {
  active: boolean;
  color: string;
  borderRadius?: number;
  style?: ViewStyle;
}

const DURATION = 2600;

export function PulseGlow({ active, color, borderRadius = 12, style }: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: active ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [active, fadeAnim]);

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: DURATION / 2,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: DURATION / 2,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] });
  const opacity = Animated.multiply(
    fadeAnim,
    anim.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0] }),
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.glow,
        {
          backgroundColor: color,
          borderRadius,
          opacity,
          transform: [{ scale }],
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  glow: { zIndex: -1 },
});
