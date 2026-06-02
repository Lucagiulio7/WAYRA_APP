/**
 * PulseGlow — alone "vivo" intorno a un elemento per attirare l'attenzione.
 *
 * Uso classico: CTA primario che diventa "pronto" (es. tutti i campi compilati).
 * L'alone pulsa cresce/decresce in opacity e scala, comunicando "ora puoi premere"
 * senza essere invadente.
 *
 * Pattern di uso:
 *   <View style={{ position: "relative" }}>
 *     <PulseGlow active={isReady} color={accentGold} borderRadius={14} />
 *     <CtaButton />
 *   </View>
 *
 * Tecnicamente è una View assoluta posizionata DIETRO al contenuto (zIndex=-1).
 * Quando active=false l'animazione si ferma e l'alone diventa invisibile.
 */
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewStyle } from "react-native";

interface Props {
  /** Se true l'alone pulsa, se false è invisibile. */
  active: boolean;
  /** Colore principale dell'alone (hex). */
  color: string;
  /** Raggio degli angoli — match con il bottone sottostante. Default 12. */
  borderRadius?: number;
  /** Override stile (per debugging). */
  style?: ViewStyle;
}

const DURATION = 1600; // ms — pulse "lento e respiratorio"

export function PulseGlow({ active, color, borderRadius = 12, style }: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(active ? 1 : 0)).current;

  // Fade in/out quando active cambia
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: active ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [active, fadeAnim]);

  // Loop di pulse solo quando attivo
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

  // Pulse esterno: cresce di scala + perde opacity
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const opacity = Animated.multiply(
    fadeAnim,
    anim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
  );

  // Alone interno (sempre presente quando attivo): glow morbido statico
  const innerOpacity = Animated.multiply(
    fadeAnim,
    anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.6] }),
  );

  return (
    <>
      {/* Alone esterno che pulsa via scale + fade */}
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
      {/* Glow interno statico — dà profondità anche tra le fasi del pulse */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.glow,
          {
            backgroundColor: color,
            borderRadius,
            opacity: innerOpacity,
            transform: [{ scale: 1.04 }],
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  glow: { zIndex: -1 },
});
