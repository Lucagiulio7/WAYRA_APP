/**
 * FadeInUp — entrance animation primitiva.
 *
 * Wrappa qualsiasi elemento per fargli fare un'animazione di entrata:
 *   - Translate Y: +12px → 0 (sale dal basso)
 *   - Opacity: 0 → 1
 *   - Spring naturale (non lineare)
 *
 * Usata per stagger animation su liste:
 *   {items.map((item, i) => (
 *     <FadeInUp key={item.id} delay={i * 50}>
 *       <ItemCard item={item} />
 *     </FadeInUp>
 *   ))}
 *
 * Il delay incrementale fa apparire le card "a cascata", effetto premium.
 *
 * Props:
 *  - delay: ms prima di iniziare (default 0)
 *  - duration: ms dell'animazione (default 380)
 *  - distance: px di translate iniziale (default 12)
 *  - disabled: se true skip l'animazione (per testing o accessibilità)
 */
import React, { useEffect, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";

interface Props {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function FadeInUp({
  children,
  delay = 0,
  duration = 380,
  distance = 12,
  disabled = false,
  style,
}: Props) {
  const opacity = useRef(new Animated.Value(disabled ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(disabled ? 0 : distance)).current;

  useEffect(() => {
    if (disabled) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        speed: 14,
        bounciness: 4,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  // Volutamente non includiamo opacity/translateY (ref stabili) né props (vogliamo girare solo all'init)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        style,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Helper: calcola il delay per item con cap massimo.
 * Evita che con liste lunghe l'ultimo item appaia dopo 3 secondi.
 *
 *   {items.map((it, i) => (
 *     <FadeInUp delay={staggerDelay(i)}>...</FadeInUp>
 *   ))}
 */
export function staggerDelay(index: number, step: number = 50, max: number = 400): number {
  return Math.min(index * step, max);
}
