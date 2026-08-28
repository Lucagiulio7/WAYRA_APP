import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { localText } from "@/i18n";

export interface ContextHelpContent {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  note?: string;
}

export interface ContextHelpController {
  active: boolean;
  selected: ContextHelpContent | null;
  toggle: () => void;
  exit: () => void;
  close: () => void;
  explain: (content: ContextHelpContent) => void;
  guard: <T extends unknown[]>(content: ContextHelpContent, action: (...args: T) => void) => (...args: T) => void;
}

export function useContextHelpController(): ContextHelpController {
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState<ContextHelpContent | null>(null);

  const exit = useCallback(() => {
    setSelected(null);
    setActive(false);
  }, []);

  const toggle = useCallback(() => {
    setSelected(null);
    setActive((value) => !value);
  }, []);

  const explain = useCallback((content: ContextHelpContent) => {
    setSelected(content);
  }, []);

  const close = useCallback(() => setSelected(null), []);

  const guard = useCallback(
    <T extends unknown[]>(content: ContextHelpContent, action: (...args: T) => void) =>
      (...args: T) => {
        if (active) {
          setSelected(content);
          return;
        }
        action(...args);
      },
    [active],
  );

  return { active, selected, toggle, exit, close, explain, guard };
}

export function contextHelpOutline(active: boolean, color: string) {
  return active
    ? {
        shadowColor: color,
        shadowOpacity: 0.28,
        shadowRadius: 7,
        shadowOffset: { width: 0, height: 0 },
        elevation: 2,
      }
    : null;
}

export function ContextHelpUI({
  controller,
  lang,
}: {
  controller: ContextHelpController;
  lang: string;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bannerEntrance = useRef(new Animated.Value(0)).current;
  const tx = (values: Record<string, string>) => localText(lang, values);

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
              {tx({
                it: "Scorri liberamente e tocca un elemento evidenziato per sapere cosa fa.",
                en: "Scroll freely and tap a highlighted element to learn what it does.",
                fr: "Faites défiler librement et touchez un élément surligné pour découvrir sa fonction.",
                es: "Desplázate libremente y toca un elemento resaltado para saber qué hace.",
              })}
            </Text>
            <TouchableOpacity
              onPress={controller.exit}
              style={styles.bannerClose}
              accessibilityLabel={tx({ it: "Esci dalla guida", en: "Exit help", fr: "Quitter l'aide", es: "Salir de la ayuda" })}
            >
              <Ionicons name="close" size={19} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <Modal
        visible={Boolean(controller.selected)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={controller.close}
      >
        <Pressable style={styles.backdrop} onPress={controller.close}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <View style={[styles.iconBox, { backgroundColor: colors.accentGold + "18", borderColor: colors.accentGold + "55" }]}>
                <Ionicons name={controller.selected?.icon ?? "help-circle-outline"} size={23} color={colors.accentGold} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>{controller.selected?.title}</Text>
              <TouchableOpacity
                onPress={controller.close}
                style={[styles.closeButton, { backgroundColor: colors.card2 }]}
                accessibilityLabel={tx({ it: "Chiudi", en: "Close", fr: "Fermer", es: "Cerrar" })}
              >
                <Ionicons name="close" size={19} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.body, { color: colors.textSub }]}>{controller.selected?.body}</Text>

            {controller.selected?.note ? (
              <View style={[styles.note, { backgroundColor: colors.accentBlue + "12", borderColor: colors.accentBlue + "45" }]}>
                <Ionicons name="information-circle-outline" size={17} color={colors.accentBlue} />
                <Text style={[styles.noteText, { color: colors.textSub }]}>{controller.selected.note}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={[styles.confirm, { backgroundColor: colors.accentGold }]} onPress={controller.close}>
              <Text style={[styles.confirmText, { color: colors.bg }]}>
                {tx({ it: "Ho capito", en: "Got it", fr: "J'ai compris", es: "Entendido" })}
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
    backgroundColor: "#0000009a",
    justifyContent: "flex-end",
    padding: 12,
  },
  sheet: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 13,
  },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 18, fontWeight: "900" },
  closeButton: { width: 36, height: 36, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  body: { fontSize: 14, lineHeight: 21 },
  note: { borderWidth: 1, borderRadius: 7, padding: 10, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  confirm: { minHeight: 44, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  confirmText: { fontSize: 14, fontWeight: "900" },
});
