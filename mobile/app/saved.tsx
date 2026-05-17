import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useSavedItineraries, SavedItinerary } from "@/hooks/useSavedItineraries";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const CITY_EMOJIS: Record<string, string> = {
  roma: "🏛️",
  napoli: "🍕",
  firenze: "🌸",
  londra: "🎡",
  edimburgo: "🏰",
  barcellona: "🌊",
  madrid: "🎨",
  siviglia: "💃",
  valencia: "🍊",
  parigi: "🗼",
  berlino: "🐻",
  monaco_di_baviera: "🍺",
  amsterdam: "🚲",
  vienna: "🎵",
  praga: "🏰",
  bratislava: "🏯",
  lisbona: "🚋",
  porto: "🍷",
  atene: "🏛",
  budapest: "♨️",
  istanbul: "🕌",
  antalya: "🏖️",
  muğla: "🛥️",
  milano: "💎",
  venezia: "🚣",
  candia: "🏺",
  varsavia: "⚔️",
  francoforte: "🏦",
  marrakech: "🌴",
  copenaghen: "🚲",
  stoccolma: "🌊",
  bruges: "🚤",
  dublino: "🍀",
  marsiglia: "⚓",
  cracovia: "🦅",
  bucarest: "🌹",
  oslo: "🏔️",
  bergen: "🎣",
};

function formatDate(iso: string, lang: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === "it" ? "it-IT" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function SavedScreen() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { user, signOut } = useAuth();
  const { saved, loading, remove } = useSavedItineraries();
  const { colors } = useTheme();

  const handleOpen = async (entry: SavedItinerary) => {
    await AsyncStorage.setItem("wayra_pending_itinerary", JSON.stringify(entry.itinerary));
    router.push({ pathname: "/itinerary" });
  };

  const handleDelete = (entry: SavedItinerary) => {
    Alert.alert(
      lang === "it" ? "Elimina viaggio" : "Delete trip",
      lang === "it"
        ? `Vuoi eliminare l'itinerario di ${entry.itinerary.city}?`
        : `Delete the itinerary for ${entry.itinerary.city}?`,
      [
        { text: lang === "it" ? "Annulla" : "Cancel", style: "cancel" },
        {
          text: lang === "it" ? "Elimina" : "Delete",
          style: "destructive",
          onPress: () => remove(entry.id),
        },
      ],
    );
  };

  const handleLogout = () => {
    const doSignOut = async () => {
      await signOut();
      router.replace("/");
    };

    if (Platform.OS === "web") {
      // Alert.alert su web usa window.confirm che può essere bloccato;
      // usiamo direttamente window.confirm
      const ok = window.confirm(
        lang === "it"
          ? "Vuoi uscire dal tuo account?"
          : "Sign out of your account?"
      );
      if (ok) doSignOut();
    } else {
      Alert.alert(
        lang === "it" ? "Disconnetti" : "Sign out",
        lang === "it" ? "Vuoi uscire dal tuo account?" : "Sign out of your account?",
        [
          { text: lang === "it" ? "Annulla" : "Cancel", style: "cancel" },
          {
            text: lang === "it" ? "Esci" : "Sign out",
            style: "destructive",
            onPress: doSignOut,
          },
        ],
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border2 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.accentGold} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>
            {lang === "it" ? "I tuoi viaggi" : "Your trips"}
          </Text>
          {saved.length > 0 && (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {saved.length} {lang === "it" ? "salvati" : "saved"}
            </Text>
          )}
        </View>

        {user ? (
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.accountBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.8}
          >
            <Ionicons name="person-circle-outline" size={18} color={colors.accentGold} />
            <Text style={[styles.accountEmail, { color: colors.accentGold }]} numberOfLines={1}>
              {user.email?.split("@")[0]}
            </Text>
            <Ionicons name="log-out-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push("/auth")}
            style={[styles.loginBtn, { backgroundColor: colors.accentGold }]}
            activeOpacity={0.8}
          >
            <Ionicons name="log-in-outline" size={16} color={colors.bg} />
            <Text style={[styles.loginBtnText, { color: colors.bg }]}>
              {lang === "it" ? "Accedi" : "Sign in"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Banner sync */}
      {!user && saved.length > 0 && (
        <TouchableOpacity
          style={[styles.syncBanner, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
          onPress={() => router.push("/auth")}
          activeOpacity={0.85}
        >
          <Ionicons name="cloud-upload-outline" size={16} color={colors.accentBlue} />
          <Text style={[styles.syncText, { color: colors.accentBlue }]}>
            {lang === "it"
              ? "Accedi per sincronizzare i viaggi su tutti i dispositivi"
              : "Sign in to sync your trips across all devices"}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.accentBlue} />
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator color={colors.accentGold} style={{ marginTop: 40 }} />
      ) : saved.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={48} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.textSub }]}>
            {lang === "it" ? "Nessun viaggio salvato" : "No saved trips"}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            {lang === "it"
              ? "Genera o crea un itinerario e premi 🔖 per salvarlo"
              : "Generate or build an itinerary and tap 🔖 to save it"}
          </Text>
          {!user && (
            <TouchableOpacity
              style={[styles.emptyLoginBtn, { backgroundColor: colors.accentGold }]}
              onPress={() => router.push("/auth")}
              activeOpacity={0.85}
            >
              <Ionicons name="person-outline" size={16} color={colors.bg} />
              <Text style={[styles.emptyLoginText, { color: colors.bg }]}>
                {lang === "it" ? "Accedi al tuo account" : "Sign in to your account"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {[...saved].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()).map((entry) => {
            const emoji = CITY_EMOJIS[entry.itinerary.city] ?? "✈️";
            const cityLabel = entry.itinerary.city
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
            const days = entry.itinerary.num_days;
            const level = Array.isArray(entry.itinerary.level)
              ? "Mix"
              : entry.itinerary.level === 1
                ? (lang === "it" ? "Iconico" : "Iconic")
                : (lang === "it" ? "Esploratore" : "Explorer");

            return (
              <TouchableOpacity
                key={entry.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleOpen(entry)}
                activeOpacity={0.85}
              >
                <Text style={styles.cardEmoji}>{emoji}</Text>

                <View style={styles.cardInfo}>
                  <Text style={[styles.cardCity, { color: colors.text }]}>{cityLabel}</Text>
                  <View style={styles.cardMeta}>
                    <View style={[styles.metaBadge, { backgroundColor: colors.card2 }]}>
                      <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
                      <Text style={[styles.metaText, { color: colors.textSub }]}>
                        {days} {lang === "it" ? "giorni" : "days"}
                      </Text>
                    </View>
                    <View style={[styles.metaBadge, { backgroundColor: colors.card2 }]}>
                      <Ionicons name="star-outline" size={11} color={colors.textMuted} />
                      <Text style={[styles.metaText, { color: colors.textSub }]}>{level}</Text>
                    </View>
                  </View>
                  <Text style={[styles.cardDate, { color: colors.textMuted }]}>
                    {formatDate(entry.savedAt, lang)}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleDelete(entry)}
                  style={styles.deleteBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36, height: 36, alignItems: "center", justifyContent: "center",
    borderRadius: 18, borderWidth: 1, flexShrink: 0,
  },
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 1 },
  accountBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 7,
    maxWidth: 140, flexShrink: 0,
  },
  accountEmail: { fontSize: 11, fontWeight: "700", flex: 1 },
  loginBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8, flexShrink: 0,
  },
  loginBtnText: { fontSize: 12, fontWeight: "800" },
  syncBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderBottomWidth: 1,
    paddingHorizontal: 16, paddingVertical: 11,
  },
  syncText: { flex: 1, fontSize: 12, lineHeight: 17 },
  empty: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 40, gap: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  emptySubtitle: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  emptyLoginBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 12, marginTop: 8,
  },
  emptyLoginText: { fontSize: 14, fontWeight: "800" },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 16, borderWidth: 1.5, padding: 14,
  },
  cardEmoji: { fontSize: 32, flexShrink: 0 },
  cardInfo: { flex: 1 },
  cardCity: { fontSize: 17, fontWeight: "700", marginBottom: 5 },
  cardMeta: { flexDirection: "row", gap: 8, marginBottom: 5 },
  metaBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  metaText: { fontSize: 11, fontWeight: "600" },
  cardDate: { fontSize: 11 },
  deleteBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center", flexShrink: 0 },
});
