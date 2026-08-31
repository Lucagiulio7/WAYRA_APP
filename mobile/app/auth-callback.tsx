import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { localText } from "@/i18n";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string | string[]; error_description?: string | string[] }>();
  const router = useRouter();
  const { lang } = useLanguage();
  const { colors } = useTheme();
  const tx = (values: Record<string, string>) => localText(lang, values);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const completeSignIn = async () => {
      const providerError = first(params.error_description);
      const code = first(params.code);
      if (providerError || !code) {
        if (active) {
          setError(providerError || tx({
            it: "Codice di accesso non valido.",
            en: "Invalid sign-in code.",
            fr: "Code de connexion invalide.",
            es: "Código de acceso no válido.",
          }));
        }
        return;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!active) return;
      if (exchangeError) setError(exchangeError.message);
      else router.replace("/");
    };

    void completeSignIn();
    return () => { active = false; };
  }, [params.code, params.error_description, router]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        {error ? (
          <>
            <Text style={[styles.title, { color: colors.danger }]}>
              {tx({ it: "Accesso non riuscito", en: "Sign-in failed", fr: "Échec de la connexion", es: "Error de acceso" })}
            </Text>
            <Text style={[styles.body, { color: colors.textSub }]}>{error}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => router.replace("/auth")}
              style={[styles.backButton, { backgroundColor: colors.accentGold }]}
              activeOpacity={0.82}
            >
              <Text style={[styles.backButtonText, { color: colors.bg }]}>
                {tx({ it: "Torna all'accesso", en: "Back to sign in", fr: "Retour à la connexion", es: "Volver al acceso" })}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ActivityIndicator color={colors.accentGold} size="large" />
            <Text style={[styles.body, { color: colors.textSub }]}>
              {tx({ it: "Completamento accesso...", en: "Completing sign-in...", fr: "Connexion en cours...", es: "Completando el acceso..." })}
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 },
  title: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  body: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  backButton: { minHeight: 44, paddingHorizontal: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 4 },
  backButtonText: { fontSize: 14, fontWeight: "800" },
});
