/**
 * PressableCard — wrapper con feedback "press" uniforme.
 *
 * Standardizza il comportamento tap su tutta l'app:
 *  - Scale down a 0.96 sul press-in (spring back al release)
 *  - Haptic feedback (light/medium/selection)
 *  - Opacity drop sottile per leggibilità del feedback
 *  - Disabled state corretto (no animazione + no haptic)
 *
 * Uso al posto di TouchableOpacity quando vuoi UX "premium":
 *   <PressableCard onPress={...} haptic="light">
 *     <View>...</View>
 *   </PressableCard>
 */
import React, { useCallback, useRef } from "react";
import { Animated, Pressable, PressableProps, ViewStyle, StyleProp, GestureResponderEvent, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";

type HapticLevel = "none" | "selection" | "light" | "medium" | "heavy";

interface Props extends Omit<PressableProps, "style" | "children"> {
  children?: React.ReactNode;
  /** Stile applicato al container animato. */
  style?: StyleProp<ViewStyle>;
  /** Stile del contenuto animato interno, utile per righe icona + testo. */
  contentStyle?: StyleProp<ViewStyle>;
  /** Tipo di feedback aptico. Default: "selection". */
  haptic?: HapticLevel;
  /** Scala minima al press-in. Default 0.96. */
  pressScale?: number;
  /** Disabilita scale animation (es. per item-list dove crea jank). */
  noScale?: boolean;
}

function triggerHaptic(level: HapticLevel) {
  if (level === "none") return;
  try {
    switch (level) {
      case "selection":
        Haptics.selectionAsync();
        break;
      case "light":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  } catch {
    /* dispositivi senza haptic engine (web, alcuni Android) — silenzioso */
  }
}

export const PressableCard = React.forwardRef<React.ElementRef<typeof Pressable>, Props>(function PressableCard({
  children,
  style,
  contentStyle,
  haptic = "selection",
  pressScale = 0.96,
  noScale = false,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: Props, forwardedRef) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      if (disabled) return;
      if (!noScale) {
        Animated.parallel([
          Animated.spring(scale, {
            toValue: pressScale,
            useNativeDriver: true,
            speed: 50,
            bounciness: 0,
          }),
          Animated.timing(opacity, {
            toValue: 0.88,
            duration: 70,
            useNativeDriver: true,
          }),
        ]).start();
      }
      onPressIn?.(e);
    },
    [disabled, noScale, scale, opacity, pressScale, onPressIn],
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      if (!noScale) {
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 28,
            bounciness: 6,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
        ]).start();
      }
      onPressOut?.(e);
    },
    [noScale, scale, opacity, onPressOut],
  );

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (disabled) return;
      triggerHaptic(haptic);
      onPress?.(e);
    },
    [disabled, haptic, onPress],
  );

  return (
    <Pressable
      ref={forwardedRef}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      // Lo stile (incluso flex/width/height) va sul Pressable stesso —
      // così il layout del parent (flex row, grid, ecc.) è rispettato.
      // Il Pressable gestisce padding/border/alignItems/justifyContent
      // esattamente come faceva TouchableOpacity prima.
      style={[style, disabled && styles.disabled]}
      {...rest}
    >
      {/* Animated.View interno: SOLO trasformazione + opacity, niente flex.
          Ha le dimensioni del contenuto, e il Pressable la centra grazie ai
          suoi alignItems/justifyContent originali. */}
      <Animated.View
        style={[contentStyle, { transform: [{ scale }], opacity: disabled ? 1 : opacity }]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  disabled: { opacity: 0.55 },
});
