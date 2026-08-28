import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CountryFlag from "react-native-country-flag";
import { useLanguage } from "@/contexts/LanguageContext";
import { ColorPalette, useTheme } from "@/contexts/ThemeContext";
import { LANGUAGE_OPTIONS, languageOption, localText } from "@/i18n";
import { getAnalyticsConsent, setAnalyticsConsent, track } from "@/services/AnalyticsService";
import { AccountDeletionButton } from "@/components/AccountDeletionButton";
import { openExternalLink } from "@/utils/externalLinks";

type SettingsModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { lang, setLang } = useLanguage();
  const { colors, toggleTheme } = useTheme();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const currentLanguage = languageOption(lang);
  const styles = makeStyles(colors);
  const tx = (values: Record<string, string>) => localText(lang, values);

  useEffect(() => {
    if (!visible) return;
    getAnalyticsConsent()
      .then(setAnalyticsEnabled)
      .catch(() => {});
  }, [visible]);

  const updateAnalyticsConsent = async (enabled: boolean) => {
    setAnalyticsEnabled(enabled);
    await setAnalyticsConsent(enabled);
    track("analytics_consent_updated", { enabled });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Ionicons name="settings-outline" size={22} color={colors.accentBlue} />
            </View>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>
                {tx({ it: "Impostazioni", en: "Settings", fr: "Param\u00e8tres", es: "Configuraci\u00f3n" })}
              </Text>
              <Text style={styles.subtitle}>
                {tx({ it: "Lingua, tema e controlli privacy.", en: "Language, theme and privacy controls.", fr: "Langue, th\u00e8me et contr\u00f4les de confidentialit\u00e9.", es: "Idioma, tema y controles de privacidad." })}
              </Text>
            </View>
          </View>

          <View style={styles.grid}>
            <View style={styles.languageCard}>
              <View style={styles.languageHeader}>
                <Ionicons name="language-outline" size={18} color={colors.accentGold} />
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>
                    {tx({ it: "Lingua", en: "Language", fr: "Langue", es: "Idioma" })}
                  </Text>
                  <Text style={styles.actionSub}>{currentLanguage.label}</Text>
                </View>
              </View>
              <View style={styles.languageChoiceRow}>
                {LANGUAGE_OPTIONS.map((option) => {
                  const active = option.code === lang;
                  return (
                    <TouchableOpacity
                      key={option.code}
                      onPress={() => setLang(option.code)}
                      activeOpacity={0.82}
                      style={[styles.languageChoice, active && styles.languageChoiceActive]}
                    >
                      <CountryFlag isoCode={option.flagIso} size={13} />
                      <Text style={[styles.languageChoiceText, active && styles.languageChoiceTextActive]}>
                        {option.shortLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity style={styles.action} onPress={toggleTheme} activeOpacity={0.82}>
              <Ionicons name="contrast-outline" size={18} color={colors.accentPurple} />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>
                  {tx({ it: "Tema", en: "Theme", fr: "Th\u00e8me", es: "Tema" })}
                </Text>
                <Text style={styles.actionSub}>
                  {tx({ it: "Cambia aspetto", en: "Switch app look", fr: "Changer l'apparence", es: "Cambiar apariencia" })}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.consentRow}>
            <View style={styles.consentText}>
              <Text style={styles.consentTitle}>
                {tx({ it: "Analytics anonimi", en: "Anonymous analytics", fr: "Analytics anonymes", es: "Anal\u00edticas an\u00f3nimas" })}
              </Text>
              <Text style={styles.consentBody}>
                {tx({ it: "Aiutano a capire ricerche, itinerari generati, mappe, PDF e salvataggi.", en: "Helps us understand searches, generated trips, maps, PDF exports and saved itineraries.", fr: "Nous aide \u00e0 comprendre les recherches, itin\u00e9raires g\u00e9n\u00e9r\u00e9s, cartes, PDF et sauvegardes.", es: "Nos ayudan a comprender las b\u00fasquedas, los viajes generados, los mapas, los PDF y los itinerarios guardados." })}
              </Text>
            </View>
            <Switch
              value={analyticsEnabled}
              onValueChange={updateAnalyticsConsent}
              trackColor={{ false: colors.border, true: colors.accentGreen + "88" }}
              thumbColor={analyticsEnabled ? colors.accentGreen : colors.textMuted}
            />
          </View>

          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={() => openExternalLink("https://wayra.app/privacy", lang)}>
              <Text style={styles.legalLink}>
                {tx({ it: "Privacy", en: "Privacy", fr: "Confidentialité", es: "Privacidad" })}
              </Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>·</Text>
            <TouchableOpacity onPress={() => openExternalLink("https://wayra.app/terms", lang)}>
              <Text style={styles.legalLink}>
                {tx({ it: "Termini", en: "Terms", fr: "Conditions", es: "Términos" })}
              </Text>
            </TouchableOpacity>
          </View>

          <AccountDeletionButton onDeleted={onClose} />

          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.85}>
            <Text style={styles.closeText}>
              {tx({ it: "Fatto", en: "Done", fr: "Termin\u00e9", es: "Listo" })}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const makeStyles = (colors: ColorPalette) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  sheet: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 20,
    padding: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentBlue + "18",
    borderWidth: 1,
    borderColor: colors.accentBlue + "55",
  },
  titleWrap: { flex: 1 },
  title: { color: colors.text, fontSize: 20, fontWeight: "900" },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 3, lineHeight: 17 },
  grid: { gap: 10 },
  languageCard: {
    padding: 13,
    borderRadius: 16,
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.border2,
  },
  languageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 11,
  },
  languageChoiceRow: { flexDirection: "row", gap: 8 },
  languageChoice: {
    flex: 1,
    minHeight: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  languageChoiceActive: {
    backgroundColor: colors.accentGold + "1f",
    borderColor: colors.accentGold,
  },
  languageChoiceText: { color: colors.textSub, fontSize: 12, fontWeight: "900" },
  languageChoiceTextActive: { color: colors.accentGold },
  action: {
    minHeight: 58,
    padding: 13,
    borderRadius: 16,
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.border2,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  actionText: { flex: 1 },
  actionTitle: { color: colors.text, fontSize: 14, fontWeight: "900" },
  actionSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  consentRow: {
    marginTop: 10,
    padding: 13,
    borderRadius: 16,
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.border2,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  consentText: { flex: 1 },
  consentTitle: { color: colors.text, fontSize: 13, fontWeight: "900", marginBottom: 4 },
  consentBody: { color: colors.textSub, fontSize: 11, lineHeight: 16 },
  legalLinks: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, marginVertical: 12 },
  legalLink: { color: colors.accentBlue, fontSize: 12, fontWeight: "800" },
  legalSeparator: { color: colors.textMuted },
  closeBtn: {
    marginTop: 14,
    minHeight: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentGold,
  },
  closeText: { color: colors.bg, fontSize: 14, fontWeight: "900" },
});
