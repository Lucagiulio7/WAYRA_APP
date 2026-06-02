/**
 * BottomSheet — sheet a metà schermo con drag-to-dismiss e rubber-band.
 *
 * Comportamento "fisico":
 *  - Slide-in da basso con spring naturale (animazione di apertura)
 *  - Drag verso il basso sull'handle ≡ → sheet segue il dito
 *  - Drag oltre il threshold (default ~120px) al release → chiusura con velocity-aware spring
 *  - Drag verso l'ALTO → rubber-band con resistenza (la sheet non sale oltre)
 *  - Tap sul backdrop → chiude
 *
 * Uso:
 *   <BottomSheet
 *     visible={open}
 *     onClose={() => setOpen(false)}
 *     heightFraction={0.88}
 *   >
 *     <YourContent />
 *   </BottomSheet>
 *
 * NB: il drag è abilitato SOLO sull'handle area (la striscia in alto), NON
 * sul contenuto. Così l'utente può scrollare la lista interna senza chiudere
 * la sheet per sbaglio.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const CLOSE_THRESHOLD = 120;   // px — drag minimo per dismiss
const CLOSE_VELOCITY  = 0.5;   // velocity minima per dismiss anticipato
const RUBBER_FACTOR   = 0.35;  // intensità rubber-band (0..1 — più basso = più "rigido")

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Frazione di altezza schermo (0..1). Default 0.88. */
  heightFraction?: number;
  /** Stile esterno (override). */
  containerStyle?: ViewStyle;
  children: React.ReactNode;
}

export function BottomSheet({
  visible,
  onClose,
  heightFraction = 0.88,
  containerStyle,
  children,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetHeight = SCREEN_HEIGHT * heightFraction;

  // translateY: 0 = posizione finale aperta, sheetHeight = nascosta sotto
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const dragOffset = useRef(0);
  const [mounted, setMounted] = useState(visible);

  // Apertura/chiusura animata
  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 14,
        bounciness: 4,
      }).start();
    } else if (mounted) {
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, sheetHeight, translateY, mounted]);

  // ── PanResponder sull'handle area ───────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  (_, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        translateY.stopAnimation((v: number) => { dragOffset.current = v; });
      },
      onPanResponderMove: (_, g) => {
        // dy > 0 → drag verso il basso (chiusura); dy < 0 → drag verso l'alto (rubber-band)
        let next = dragOffset.current + g.dy;
        if (next < 0) {
          // resistenza progressiva: più sali, più "tira" indietro
          next = next * RUBBER_FACTOR;
        }
        translateY.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const totalDrag = (dragOffset.current + g.dy);
        const fastDownSwipe = g.vy > CLOSE_VELOCITY;
        if (totalDrag > CLOSE_THRESHOLD || fastDownSwipe) {
          // Chiusura — usa velocity come "spinta" per fluidità
          Animated.timing(translateY, {
            toValue: sheetHeight,
            duration: 220,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          // Snap back a 0
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            speed: 18,
            bounciness: 5,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 18,
          bounciness: 5,
        }).start();
      },
    }),
  ).current;

  // Backdrop opacity scala con la posizione della sheet (1 quando aperta, 0 quando chiusa)
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, sheetHeight],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={StyleSheet.absoluteFill}>
        {/* Backdrop con opacity animata */}
        <Animated.View
          pointerEvents={visible ? "auto" : "none"}
          style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              backgroundColor: colors.bg,
              borderColor: colors.border,
              paddingBottom: insets.bottom + 12,
              transform: [{ translateY }],
            },
            containerStyle,
          ]}
        >
          {/* Drag handle — solo questa zona accetta il pan */}
          <View {...panResponder.panHandlers} style={styles.handleArea}>
            <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
          </View>

          {/* Contenuto — scrollabile internamente, non drag-aware */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  // Area cliccabile più grande dell'indicatore visivo per facilitare il drag
  handleArea: {
    paddingVertical: 12,
    alignItems: "center",
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  content: { flex: 1 },
});
