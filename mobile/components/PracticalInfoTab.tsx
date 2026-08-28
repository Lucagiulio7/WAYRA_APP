import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CityInfo, EmergencyNumber, TransportApp } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { exactLocalizedField, localizedField } from "@/utils/localization";
import { openExternalLink } from "@/utils/externalLinks";

interface Props {
  info: CityInfo;
}

const emoji = (...points: number[]) => String.fromCodePoint(...points);

const ENGLISH_LEVEL_COLOR: Record<string, string> = {
  alto: "#4ade80",
  medio: "#facc15",
  basso: "#f87171",
};

const ENGLISH_LEVEL_IT: Record<string, string> = {
  alto: "Alto",
  medio: "Medio",
  basso: "Basso",
};

const ENGLISH_LEVEL_EN: Record<string, string> = {
  alto: "High",
  medio: "Medium",
  basso: "Low",
};

const ENGLISH_LEVEL_FR: Record<string, string> = {
  alto: "Eleve",
  medio: "Moyen",
  basso: "Faible",
};

const ENGLISH_LEVEL_ES: Record<string, string> = {
  alto: "Alto",
  medio: "Medio",
  basso: "Bajo",
};

function Section({
  title,
  icon,
  children,
  colors,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View style={[styles.section, { backgroundColor: colors.card2, borderColor: colors.border }]}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <Ionicons name={icon} size={16} color={colors.accentGold} />
        <Text style={[styles.sectionTitle, { color: colors.accentGold }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function InfoRow({
  emoji: emojiValue,
  label,
  value,
  colors,
}: {
  emoji: string;
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoEmoji}>{emojiValue}</Text>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function AppCard({ app, lang, colors, transport }: { app: TransportApp; lang: string; colors: any; transport: boolean }) {
  const genericDescription = transport
    ? (lang === "es" ? "Aplicación recomendada para moverte por la ciudad." : lang === "fr" ? "Application recommandée pour vous déplacer en ville." : lang === "en" ? "Recommended app for getting around the city." : "App consigliata per muoversi in città.")
    : (lang === "es" ? "Aplicación útil recomendada para el viaje." : lang === "fr" ? "Application utile recommandée pour le voyage." : lang === "en" ? "Useful app recommended for the trip." : "App utile consigliata per il viaggio.");
  const desc = exactLocalizedField<string>(app, "description", lang, genericDescription);

  const openApp = async () => {
    const query = encodeURIComponent(app.name);
    const fallbackUrl = Platform.OS === "ios"
      ? `https://apps.apple.com/search?term=${query}`
      : `https://play.google.com/store/search?q=${query}&c=apps`;
    const directUrl = Platform.OS === "ios" ? app.ios_url : app.android_url;
    await openExternalLink(directUrl ?? fallbackUrl, lang, {
      fallbackUrl,
      message: lang === "es" ? "No se puede abrir la tienda de aplicaciones." : lang === "fr" ? "Impossible d'ouvrir la boutique d'applications." : lang === "en" ? "The app store could not be opened." : "Non è stato possibile aprire lo store.",
    });
  };

  return (
    <TouchableOpacity
      style={[styles.appCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={openApp}
      activeOpacity={0.75}
    >
      <View style={styles.appInfo}>
        <Text style={[styles.appName, { color: colors.text }]}>{app.name}</Text>
        {desc ? <Text style={[styles.appDesc, { color: colors.textSub }]}>{desc}</Text> : null}
      </View>
      <View style={[styles.appBadge, { backgroundColor: colors.accentGold + "22", borderColor: colors.accentGold + "44" }]}>
        <Ionicons name="download-outline" size={14} color={colors.accentGold} />
      </View>
    </TouchableOpacity>
  );
}

function EmergencyRow({ item, lang, colors }: { item: EmergencyNumber; lang: string; colors: any }) {
  const fallbackLabel = lang === "es" ? "Número de emergencia" : lang === "fr" ? "Numéro d'urgence" : lang === "en" ? "Emergency number" : "Numero di emergenza";
  const label = exactLocalizedField<string>(item, "label", lang, fallbackLabel);
  return (
    <TouchableOpacity
      style={[styles.emergencyRow, { backgroundColor: colors.danger + "1a", borderColor: colors.danger + "33" }]}
      onPress={() => openExternalLink(`tel:${item.number}`, lang)}
      activeOpacity={0.75}
    >
      <Text style={[styles.emergencyNumber, { color: colors.danger }]}>{item.number}</Text>
      <Text style={[styles.emergencyLabel, { color: colors.text }]}>{label}</Text>
      <Ionicons name="call-outline" size={14} color={colors.danger} />
    </TouchableOpacity>
  );
}

export function PracticalInfoTab({ info }: Props) {
  const { lang, t } = useLanguage();
  const { colors } = useTheme();

  const currency = localizedField<string>(info, "currency", lang, "");
  const language = localizedField<string>(info, "language", lang, "");
  const water = localizedField<string>(info, "water", lang, "");
  const tipping = localizedField<string>(info, "tipping", lang, "");
  const engNote = localizedField<string>(info, "english_note", lang, "");
  const englishLevelLabels: Record<string, Record<string, string>> = {
    it: ENGLISH_LEVEL_IT,
    en: ENGLISH_LEVEL_EN,
    fr: ENGLISH_LEVEL_FR,
    es: ENGLISH_LEVEL_ES,
  };
  const engLevel = englishLevelLabels[lang]?.[info.english_level]
    ?? ENGLISH_LEVEL_EN[info.english_level]
    ?? info.english_level;
  const engColor = ENGLISH_LEVEL_COLOR[info.english_level] ?? "#facc15";
  const tips = localizedField<string[]>(info, "quick_tips", lang, []);

  return (
    <View style={styles.container}>
      <Section title={t.practicalEssentials} icon="information-circle-outline" colors={colors}>
        <View style={styles.infoGrid}>
          <InfoRow emoji={emoji(0x1f4b6)} label={t.practicalCurrency} value={currency} colors={colors} />
          <InfoRow emoji={emoji(0x1f5e3, 0xfe0f)} label={t.practicalLanguage} value={language} colors={colors} />

          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>{emoji(0x1f1ec, 0x1f1e7)}</Text>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t.practicalEnglish}</Text>
              <View style={styles.engRow}>
                <View style={[styles.engDot, { backgroundColor: engColor }]} />
                <Text style={[styles.engLevel, { color: engColor }]}>{engLevel}</Text>
                {engNote ? <Text style={[styles.engNote, { color: colors.textSub }]}> - {engNote}</Text> : null}
              </View>
            </View>
          </View>

          <InfoRow emoji={emoji(0x1f550)} label={t.practicalTimezone} value={info.timezone} colors={colors} />
          {info.voltage ? <InfoRow emoji={emoji(0x1f50c)} label={t.practicalVoltage} value={info.voltage} colors={colors} /> : null}
          {water ? <InfoRow emoji={emoji(0x1f4a7)} label={t.practicalWater} value={water} colors={colors} /> : null}
          {tipping ? <InfoRow emoji={emoji(0x1f4b0)} label={t.practicalTipping} value={tipping} colors={colors} /> : null}
        </View>
      </Section>

      {info.emergency_numbers.length > 0 ? (
        <Section title={t.practicalEmergency} icon="alert-circle-outline" colors={colors}>
          {info.emergency_numbers.map((item, index) => (
            <EmergencyRow key={index} item={item} lang={lang} colors={colors} />
          ))}
        </Section>
      ) : null}

      {info.transport_apps.length > 0 ? (
        <Section title={t.practicalTransportApps} icon="subway-outline" colors={colors}>
          {info.transport_apps.map((app, index) => (
            <AppCard key={index} app={app} lang={lang} colors={colors} transport />
          ))}
        </Section>
      ) : null}

      {info.useful_apps.length > 0 ? (
        <Section title={t.practicalUsefulApps} icon="apps-outline" colors={colors}>
          {info.useful_apps.map((app, index) => (
            <AppCard key={index} app={app} lang={lang} colors={colors} transport={false} />
          ))}
        </Section>
      ) : null}

      {tips.length > 0 ? (
        <Section title={t.practicalTips} icon="bulb-outline" colors={colors}>
          {tips.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <Text style={[styles.tipBullet, { color: colors.accentGold }]}>{">"}</Text>
              <Text style={[styles.tipText, { color: colors.textSub }]}>{tip}</Text>
            </View>
          ))}
        </Section>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 24,
  },
  section: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  infoGrid: {
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoEmoji: {
    fontSize: 18,
    width: 26,
    textAlign: "center",
    marginTop: 1,
  },
  infoContent: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 13,
    lineHeight: 18,
  },
  engRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  engDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  engLevel: {
    fontSize: 13,
    fontWeight: "700",
  },
  engNote: {
    fontSize: 12,
    flex: 1,
  },
  emergencyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
  },
  emergencyNumber: {
    fontWeight: "800",
    fontSize: 18,
    minWidth: 44,
  },
  emergencyLabel: {
    flex: 1,
    fontSize: 13,
  },
  appCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  appInfo: {
    flex: 1,
    gap: 2,
  },
  appName: {
    fontWeight: "600",
    fontSize: 14,
  },
  appDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  appBadge: {
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  tipBullet: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "700",
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
