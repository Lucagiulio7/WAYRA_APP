import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CityInfo, TransportApp, EmergencyNumber } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

interface Props {
  info: CityInfo;
}

// Livello inglese → colore + etichetta
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

// ── Sezione generica ──────────────────────────────────────────────────────────
function Section({
  title, icon, children, colors,
}: {
  title: string; icon: string; children: React.ReactNode; colors: any;
}) {
  return (
    <View style={[styles.section, { backgroundColor: colors.card2, borderColor: colors.border }]}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <Ionicons name={icon as any} size={16} color={colors.accentGold} />
        <Text style={[styles.sectionTitle, { color: colors.accentGold }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ── Riga info (es. Moneta: Euro) ──────────────────────────────────────────────
function InfoRow({
  emoji, label, value, colors,
}: {
  emoji: string; label: string; value: string; colors: any;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoEmoji}>{emoji}</Text>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

// ── Card app (trasporti / utili) ──────────────────────────────────────────────
function AppCard({ app, lang, colors }: { app: TransportApp; lang: "it" | "en"; colors: any }) {
  const desc = (lang === "en" && app.description_en) ? app.description_en : app.description;

  const openApp = () => {
    const query = encodeURIComponent(app.name);
    const url = Platform.OS === "ios"
      ? `itms-apps://itunes.apple.com/search?term=${query}&media=software`
      : `https://play.google.com/store/search?q=${query}&c=apps`;
    Linking.openURL(url);
  };

  return (
    <TouchableOpacity
      style={[styles.appCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={openApp}
      activeOpacity={0.75}
    >
      <View style={styles.appInfo}>
        <Text style={[styles.appName, { color: colors.text }]}>{app.name}</Text>
        {desc && <Text style={[styles.appDesc, { color: colors.textSub }]}>{desc}</Text>}
      </View>
      <View style={[styles.appBadge, { backgroundColor: colors.accentGold + "22", borderColor: colors.accentGold + "44" }]}>
        <Ionicons name="download-outline" size={14} color={colors.accentGold} />
      </View>
    </TouchableOpacity>
  );
}

// ── Numero emergenza ──────────────────────────────────────────────────────────
function EmergencyRow({ item, lang, colors }: { item: EmergencyNumber; lang: "it" | "en"; colors: any }) {
  const label = (lang === "en" && item.label_en) ? item.label_en : item.label;
  return (
    <TouchableOpacity
      style={[styles.emergencyRow, { backgroundColor: colors.danger + "1a", borderColor: colors.danger + "33" }]}
      onPress={() => Linking.openURL(`tel:${item.number}`)}
      activeOpacity={0.75}
    >
      <Text style={[styles.emergencyNumber, { color: colors.danger }]}>{item.number}</Text>
      <Text style={[styles.emergencyLabel, { color: colors.text }]}>{label}</Text>
      <Ionicons name="call-outline" size={14} color={colors.danger} />
    </TouchableOpacity>
  );
}

// ── Componente principale ─────────────────────────────────────────────────────
export function PracticalInfoTab({ info }: Props) {
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const contentLang: "it" | "en" = lang === "it" ? "it" : "en";

  const currency = (contentLang === "en" && info.currency_en)  ? info.currency_en  : info.currency;
  const language = (contentLang === "en" && info.language_en)  ? info.language_en  : info.language;
  const water    = (contentLang === "en" && info.water_en)     ? info.water_en     : info.water;
  const tipping  = (contentLang === "en" && info.tipping_en)   ? info.tipping_en   : info.tipping;
  const engNote  = (contentLang === "en" && info.english_note_en) ? info.english_note_en : info.english_note;
  const engLevel = contentLang === "en"
    ? ENGLISH_LEVEL_EN[info.english_level] ?? info.english_level
    : ENGLISH_LEVEL_IT[info.english_level] ?? info.english_level;
  const engColor = ENGLISH_LEVEL_COLOR[info.english_level] ?? "#facc15";
  const tips     = (contentLang === "en" && info.quick_tips_en?.length)
    ? info.quick_tips_en
    : info.quick_tips ?? [];

  return (
    <View style={styles.container}>

      {/* ── Essenziali ── */}
      <Section title={t.practicalEssentials} icon="information-circle-outline" colors={colors}>
        <View style={styles.infoGrid}>
          <InfoRow emoji="💶" label={t.practicalCurrency} value={currency} colors={colors} />
          <InfoRow emoji="🗣️" label={t.practicalLanguage} value={language} colors={colors} />

          {/* English level */}
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>🇬🇧</Text>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t.practicalEnglish}</Text>
              <View style={styles.engRow}>
                <View style={[styles.engDot, { backgroundColor: engColor }]} />
                <Text style={[styles.engLevel, { color: engColor }]}>{engLevel}</Text>
                {engNote && <Text style={[styles.engNote, { color: colors.textSub }]}> — {engNote}</Text>}
              </View>
            </View>
          </View>

          <InfoRow emoji="🕐" label={t.practicalTimezone} value={info.timezone} colors={colors} />
          {info.voltage && <InfoRow emoji="🔌" label={t.practicalVoltage} value={info.voltage} colors={colors} />}
          {water && <InfoRow emoji="💧" label={t.practicalWater} value={water} colors={colors} />}
          {tipping && <InfoRow emoji="💰" label={t.practicalTipping} value={tipping} colors={colors} />}
        </View>
      </Section>

      {/* ── Emergenze ── */}
      {info.emergency_numbers.length > 0 && (
        <Section title={t.practicalEmergency} icon="alert-circle-outline" colors={colors}>
          {info.emergency_numbers.map((e, i) => (
            <EmergencyRow key={i} item={e} lang={contentLang} colors={colors} />
          ))}
        </Section>
      )}

      {/* ── App mezzi ── */}
      {info.transport_apps.length > 0 && (
        <Section title={t.practicalTransportApps} icon="subway-outline" colors={colors}>
          {info.transport_apps.map((app, i) => (
            <AppCard key={i} app={app} lang={contentLang} colors={colors} />
          ))}
        </Section>
      )}

      {/* ── App utili ── */}
      {info.useful_apps.length > 0 && (
        <Section title={t.practicalUsefulApps} icon="apps-outline" colors={colors}>
          {info.useful_apps.map((app, i) => (
            <AppCard key={i} app={app} lang={contentLang} colors={colors} />
          ))}
        </Section>
      )}

      {/* ── Consigli rapidi ── */}
      {tips.length > 0 && (
        <Section title={t.practicalTips} icon="bulb-outline" colors={colors}>
          {tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={[styles.tipBullet, { color: colors.accentGold }]}>›</Text>
              <Text style={[styles.tipText, { color: colors.textSub }]}>{tip}</Text>
            </View>
          ))}
        </Section>
      )}

    </View>
  );
}

// Stili statici (le parti non dipendenti dal tema rimangono in StyleSheet)
const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 24,
  },

  // Sezione
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

  // Info grid
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

  // English level
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

  // Emergenze
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

  // App cards
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

  // Consigli
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
