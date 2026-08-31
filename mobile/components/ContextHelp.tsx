import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  findNodeHandle,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { localText } from "@/i18n";
import { calculateContextHelpPlacement, type ContextHelpAnchor } from "@/utils/contextHelpPlacement";

export type { ContextHelpAnchor } from "@/utils/contextHelpPlacement";

export interface ContextHelpContent {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  note?: string;
}

export interface ContextHelpController {
  active: boolean;
  selected: ContextHelpContent | null;
  anchor: ContextHelpAnchor | null;
  enter: () => void;
  toggle: () => void;
  exit: () => void;
  close: () => void;
  explain: (content: ContextHelpContent, anchor?: ContextHelpAnchor | null) => void;
  guard: <T extends unknown[]>(content: ContextHelpContent, action: (...args: T) => void) => (...args: T) => void;
}

export function useContextHelpController(): ContextHelpController {
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState<ContextHelpContent | null>(null);
  const [anchor, setAnchor] = useState<ContextHelpAnchor | null>(null);

  const enter = useCallback(() => {
    setSelected(null);
    setAnchor(null);
    setActive(true);
  }, []);

  const exit = useCallback(() => {
    setSelected(null);
    setAnchor(null);
    setActive(false);
  }, []);

  const toggle = useCallback(() => {
    setSelected(null);
    setAnchor(null);
    setActive((value) => !value);
  }, []);

  const explain = useCallback((content: ContextHelpContent, nextAnchor?: ContextHelpAnchor | null) => {
    setAnchor(nextAnchor ?? null);
    setSelected(content);
  }, []);

  const close = useCallback(() => {
    setSelected(null);
    setAnchor(null);
  }, []);

  const guard = useCallback(
    <T extends unknown[]>(content: ContextHelpContent, action: (...args: T) => void) =>
      (...args: T) => {
        if (active) {
          const candidate = (args as unknown[])[0] as { nativeEvent?: { pageX?: number; pageY?: number } } | undefined;
          const pageX = candidate?.nativeEvent?.pageX;
          const pageY = candidate?.nativeEvent?.pageY;
          setAnchor(Number.isFinite(pageX) && Number.isFinite(pageY) ? { x: pageX!, y: pageY! } : null);
          setSelected(content);
          return;
        }
        action(...args);
      },
    [active],
  );

  return { active, selected, anchor, enter, toggle, exit, close, explain, guard };
}

export interface GuidedContextHelp {
  index: number;
  total: number;
  expected: ContextHelpContent;
  onAcknowledge: (selected: ContextHelpContent | null) => void;
}

export function contextHelpOutline(active: boolean, color: string) {
  return active
    ? {
        shadowColor: color,
        shadowOpacity: 0.18,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 0 },
        elevation: 1,
      }
    : null;
}

export function ContextHelpUI({
  controller,
  lang,
  guided,
}: {
  controller: ContextHelpController;
  lang: string;
  guided?: GuidedContextHelp;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const bannerEntrance = useRef(new Animated.Value(0)).current;
  const titleRef = useRef<Text>(null);
  const [cardHeight, setCardHeight] = useState(270);
  const tx = (values: Record<string, string>) => localText(lang, values);
  const cardWidth = Math.min(380, screenWidth - 24);
  const placement = calculateContextHelpPlacement({
    screenWidth,
    screenHeight,
    cardWidth,
    cardHeight,
    anchor: controller.anchor,
    safeTop: insets.top,
    safeBottom: insets.bottom,
  });
  const selectedIsExpected = Boolean(
    guided
    && controller.selected
    && controller.selected.title === guided.expected.title
    && controller.selected.body === guided.expected.body,
  );
  const acknowledge = () => guided
    ? guided.onAcknowledge(controller.selected)
    : controller.close();

  useEffect(() => {
    if (!controller.active || controller.selected) return;
    bannerEntrance.setValue(0);
    Animated.spring(bannerEntrance, {
      toValue: 1,
      damping: 17,
      stiffness: 190,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [bannerEntrance, controller.active, controller.selected]);

  useEffect(() => {
    if (!controller.selected) return;
    const timeout = setTimeout(() => {
      const node = findNodeHandle(titleRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, 180);
    return () => clearTimeout(timeout);
  }, [controller.selected]);

  return (
    <>
      {controller.active && !controller.selected && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.bannerLayer,
            {
              bottom: Math.max(insets.bottom, 8) + 8,
              opacity: bannerEntrance,
              transform: [
                { translateY: bannerEntrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                { scale: bannerEntrance.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
              ],
            },
          ]}
        >
          <View pointerEvents="box-none" style={[styles.banner, { backgroundColor: colors.card, borderColor: colors.accentGold }]}>
            <Ionicons pointerEvents="none" name="help-circle" size={18} color={colors.accentGold} />
            <Text pointerEvents="none" style={[styles.bannerText, { color: colors.text }]}>
              {guided
                ? `${tx({ it: "Passo", en: "Step", fr: "Étape", es: "Paso" })} ${guided.index + 1}/${guided.total} · ${tx({ it: "Tocca", en: "Tap", fr: "Touchez", es: "Toca" })}: ${guided.expected.title}`
                : tx({
                it: "Scorri liberamente e tocca un elemento evidenziato per sapere cosa fa.",
                en: "Scroll freely and tap a highlighted element to learn what it does.",
                fr: "Faites défiler librement et touchez un élément surligné pour découvrir sa fonction.",
                es: "Desplázate libremente y toca un elemento resaltado para saber qué hace.",
              })}
            </Text>
            {!guided && <TouchableOpacity
              onPress={controller.exit}
              style={styles.bannerClose}
              accessibilityLabel={tx({ it: "Esci dalla guida", en: "Exit help", fr: "Quitter l'aide", es: "Salir de la ayuda" })}
            >
              <Ionicons name="close" size={19} color={colors.textMuted} />
            </TouchableOpacity>}
          </View>
        </Animated.View>
      )}

      <Modal
        visible={Boolean(controller.selected)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={guided ? () => {} : controller.close}
      >
        <Pressable style={styles.backdrop} onPress={guided ? undefined : controller.close}>
          <Pressable
            accessibilityViewIsModal
            accessibilityLiveRegion="polite"
            onLayout={(event) => setCardHeight(event.nativeEvent.layout.height)}
            style={[
              styles.sheet,
              {
                top: placement.top,
                left: placement.left,
                width: cardWidth,
                maxHeight: Math.max(240, screenHeight - insets.top - insets.bottom - 24),
                backgroundColor: colors.card,
                borderColor: colors.accentGold + "88",
              },
            ]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <View style={[styles.iconBox, { backgroundColor: colors.accentGold + "18", borderColor: colors.accentGold + "55" }]}>
                <Ionicons name={controller.selected?.icon ?? "help-circle-outline"} size={23} color={colors.accentGold} />
              </View>
              <Text ref={titleRef} accessible accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{controller.selected?.title}</Text>
              {!guided && <TouchableOpacity
                onPress={controller.close}
                style={[styles.closeButton, { backgroundColor: colors.card2 }]}
                accessibilityLabel={tx({ it: "Chiudi", en: "Close", fr: "Fermer", es: "Cerrar" })}
              >
                <Ionicons name="close" size={19} color={colors.textMuted} />
              </TouchableOpacity>}
            </View>

            <ScrollView
              style={styles.contentScroll}
              contentContainerStyle={styles.contentScrollInner}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Text style={[styles.body, { color: colors.textSub }]}>{controller.selected?.body}</Text>

              {controller.selected?.note ? (
                <View style={[styles.note, { backgroundColor: colors.accentBlue + "12", borderColor: colors.accentBlue + "45" }]}>
                  <Ionicons name="information-circle-outline" size={17} color={colors.accentBlue} />
                  <Text style={[styles.noteText, { color: colors.textSub }]}>{controller.selected.note}</Text>
                </View>
              ) : null}
            </ScrollView>

            <TouchableOpacity style={[styles.confirm, { backgroundColor: colors.accentGold }]} onPress={acknowledge}>
              <Text style={[styles.confirmText, { color: colors.bg }]}>
                {guided
                  ? selectedIsExpected
                    ? (guided.index + 1 === guided.total
                      ? tx({ it: "Completa guida", en: "Complete guide", fr: "Terminer le guide", es: "Completar guía" })
                      : tx({ it: "Avanti", en: "Next", fr: "Suivant", es: "Siguiente" }))
                    : tx({ it: "Torna al passo richiesto", en: "Return to the required step", fr: "Revenir à l'étape demandée", es: "Volver al paso requerido" })
                  : tx({ it: "Ho capito", en: "Got it", fr: "J'ai compris", es: "Entendido" })}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bannerLayer: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 50,
    alignItems: "center",
  },
  banner: {
    width: "100%",
    maxWidth: 520,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  bannerText: { flex: 1, fontSize: 11.5, lineHeight: 16, fontWeight: "600" },
  bannerClose: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  backdrop: {
    flex: 1,
    backgroundColor: "#00000070",
  },
  sheet: {
    position: "absolute",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 13,
    elevation: 14,
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
  },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 18, fontWeight: "900" },
  closeButton: { width: 36, height: 36, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  body: { fontSize: 14, lineHeight: 21 },
  contentScroll: { flexShrink: 1 },
  contentScrollInner: { gap: 13 },
  note: { borderWidth: 1, borderRadius: 7, padding: 10, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  confirm: { minHeight: 44, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  confirmText: { fontSize: 14, fontWeight: "900" },
});
