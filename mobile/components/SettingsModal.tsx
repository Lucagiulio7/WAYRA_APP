import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CountryFlag from "react-native-country-flag";
import { useLanguage } from "@/contexts/LanguageContext";
import { ColorPalette, useTheme } from "@/contexts/ThemeContext";
import { LANGUAGE_OPTIONS, languageOption, localText } from "@/i18n";
import { AccountDeletionButton } from "@/components/AccountDeletionButton";
import { ContextHelpUI, contextHelpOutline, useContextHelpController, type ContextHelpContent } from "@/components/ContextHelp";
import { openExternalLink } from "@/utils/externalLinks";

type SettingsModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { lang, setLang } = useLanguage();
  const { colors, toggleTheme } = useTheme();
  const currentLanguage = languageOption(lang);
  const contextHelp = useContextHelpController();
  const styles = makeStyles(colors);
  const tx = (values: Record<string, string>) => localText(lang, values);
  const help = (icon: ContextHelpContent["icon"], title: Record<string, string>, body: Record<string, string>): ContextHelpContent => ({
    icon,
    title: tx(title),
    body: tx(body),
  });
  const settingsHelp = {
    language: help("language-outline", { it: "Lingua dell'app", en: "App language", fr: "Langue de l'application", es: "Idioma de la aplicación" }, { it: "Cambia subito testi, contenuti delle città e PDF. La scelta viene ricordata sul dispositivo.", en: "Immediately changes interface text, city content and PDFs. The choice is saved on this device.", fr: "Modifie immédiatement les textes, le contenu des villes et les PDF. Le choix est mémorisé sur cet appareil.", es: "Cambia inmediatamente los textos, el contenido de las ciudades y los PDF. La elección se guarda en este dispositivo." }),
    theme: help("contrast-outline", { it: "Tema", en: "Theme", fr: "Thème", es: "Tema" }, { it: "Alterna tra aspetto scuro e chiaro senza modificare i tuoi dati o itinerari.", en: "Switches between dark and light appearance without changing your data or itineraries.", fr: "Alterne entre les apparences sombre et claire sans modifier vos données ni vos itinéraires.", es: "Alterna entre el aspecto oscuro y claro sin cambiar tus datos ni itinerarios." }),
    privacy: help("shield-checkmark-outline", { it: "Privacy", en: "Privacy", fr: "Confidentialité", es: "Privacidad" }, { it: "Apre l'informativa che descrive dati locali, account, posizione facoltativa e fornitori esterni.", en: "Opens the policy covering local data, accounts, optional location and external providers.", fr: "Ouvre la politique concernant les données locales, le compte, la localisation facultative et les fournisseurs externes.", es: "Abre la política sobre datos locales, cuenta, ubicación opcional y proveedores externos." }),
    terms: help("document-text-outline", { it: "Termini", en: "Terms", fr: "Conditions", es: "Términos" }, { it: "Apre le condizioni d'uso e i limiti delle informazioni di viaggio fornite dall'app.", en: "Opens the terms of use and the limits of the travel information provided by the app.", fr: "Ouvre les conditions d'utilisation et les limites des informations de voyage fournies.", es: "Abre las condiciones de uso y los límites de la información de viaje ofrecida." }),
    account: help("person-remove-outline", { it: "Account e cancellazione", en: "Account and deletion", fr: "Compte et suppression", es: "Cuenta y eliminación" }, { it: "L'account è facoltativo e serve alla sincronizzazione. Da qui puoi eliminare definitivamente account e itinerari sincronizzati.", en: "The account is optional and enables sync. Here you can permanently delete the account and synced itineraries.", fr: "Le compte est facultatif et permet la synchronisation. Vous pouvez supprimer définitivement le compte et les itinéraires synchronisés.", es: "La cuenta es opcional y permite sincronizar. Aquí puedes eliminar definitivamente la cuenta y los itinerarios sincronizados." }),
    close: help("checkmark-outline", { it: "Chiudi impostazioni", en: "Close settings", fr: "Fermer les paramètres", es: "Cerrar configuración" }, { it: "Torna alla schermata precedente. Le modifiche a lingua e tema sono già salvate.", en: "Returns to the previous screen. Language and theme changes are already saved.", fr: "Revient à l'écran précédent. Les changements de langue et de thème sont déjà enregistrés.", es: "Vuelve a la pantalla anterior. Los cambios de idioma y tema ya están guardados." }),
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
            <TouchableOpacity
              onPress={contextHelp.toggle}
              style={[styles.helpButton, contextHelp.active && { backgroundColor: colors.accentGold }]}
              accessibilityRole="button"
              accessibilityLabel={tx({ it: "Guida impostazioni", en: "Settings help", fr: "Aide des paramètres", es: "Ayuda de configuración" })}
              accessibilityState={{ selected: contextHelp.active }}
            >
              <Ionicons name={contextHelp.active ? "close" : "help-circle-outline"} size={21} color={contextHelp.active ? colors.bg : colors.accentGold} />
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            <View style={[styles.languageCard, contextHelpOutline(contextHelp.active, colors.accentGold)]}>
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
                      onPress={contextHelp.guard(settingsHelp.language, () => setLang(option.code))}
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

            <TouchableOpacity style={[styles.action, contextHelpOutline(contextHelp.active, colors.accentGold)]} onPress={contextHelp.guard(settingsHelp.theme, toggleTheme)} activeOpacity={0.82}>
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

          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={contextHelp.guard(settingsHelp.privacy, () => openExternalLink("https://wayra.app/privacy", lang))}>
              <Text style={styles.legalLink}>
                {tx({ it: "Privacy", en: "Privacy", fr: "Confidentialité", es: "Privacidad" })}
              </Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>·</Text>
            <TouchableOpacity onPress={contextHelp.guard(settingsHelp.terms, () => openExternalLink("https://wayra.app/terms", lang))}>
              <Text style={styles.legalLink}>
                {tx({ it: "Termini", en: "Terms", fr: "Conditions", es: "Términos" })}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.accountArea, contextHelpOutline(contextHelp.active, colors.accentGold)]}>
            <AccountDeletionButton onDeleted={onClose} />
            {contextHelp.active ? (
              <TouchableOpacity style={StyleSheet.absoluteFill} onPress={contextHelp.guard(settingsHelp.account, () => {})} accessibilityLabel={settingsHelp.account.title} />
            ) : null}
          </View>

          <TouchableOpacity onPress={contextHelp.guard(settingsHelp.close, onClose)} style={[styles.closeBtn, contextHelpOutline(contextHelp.active, colors.text)]} activeOpacity={0.85}>
            <Text style={styles.closeText}>
              {tx({ it: "Fatto", en: "Done", fr: "Termin\u00e9", es: "Listo" })}
            </Text>
          </TouchableOpacity>
          <ContextHelpUI controller={contextHelp} lang={lang} />
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
  helpButton: { width: 38, height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center" },
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
  legalLinks: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, marginVertical: 12 },
  legalLink: { color: colors.accentBlue, fontSize: 12, fontWeight: "800" },
  legalSeparator: { color: colors.textMuted },
  accountArea: { position: "relative" },
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
