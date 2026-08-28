import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { localText } from "@/i18n";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ code?: string | string[]; error_description?: string | string[] }>();
  const router = useRouter();
  const { lang } = useLanguage();
  const { colors } = useTheme();
  const tx = (values: Record<string, string>) => localText(lang, values);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    const openRecoverySession = async () => {
      const providerError = first(params.error_description);
      const code = first(params.code);
      if (providerError || !code) {
        if (active) {
          setError(providerError || tx({
            it: "Link non valido o scaduto.",
            en: "Invalid or expired link.",
            fr: "Lien invalide ou expiré.",
            es: "Enlace no válido o caducado.",
          }));
        }
        return;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!active) return;
      if (exchangeError) setError(exchangeError.message);
      else setReady(true);
    };

    void openRecoverySession();
    return () => { active = false; };
  }, [params.code, params.error_description]);

  const updatePassword = async () => {
    setError(null);
    if (password.length < 8) {
      setError(tx({
        it: "Usa almeno 8 caratteri.",
        en: "Use at least 8 characters.",
        fr: "Utilisez au moins 8 caractères.",
        es: "Usa al menos 8 caracteres.",
      }));
      return;
    }
    if (password !== confirmPassword) {
      setError(tx({
        it: "Le password non coincidono.",
        en: "Passwords do not match.",
        fr: "Les mots de passe ne correspondent pas.",
        es: "Las contraseñas no coinciden.",
      }));
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) setError(updateError.message);
    else setSuccess(true);
  };

  if (!ready && !error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accentGold} />
          <Text style={styles.muted}>
            {tx({ it: "Verifica del link...", en: "Verifying link...", fr: "Vérification du lien...", es: "Verificando el enlace..." })}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.content}>
          <View style={styles.heading}>
            <Ionicons name={success ? "checkmark-circle-outline" : "key-outline"} size={32} color={success ? colors.accentGreen : colors.accentGold} />
            <Text style={styles.title}>
              {tx({ it: "Nuova password", en: "New password", fr: "Nouveau mot de passe", es: "Nueva contraseña" })}
            </Text>
            <Text style={styles.muted}>
              {success
                ? tx({ it: "Password aggiornata correttamente.", en: "Password updated successfully.", fr: "Mot de passe mis à jour.", es: "Contraseña actualizada correctamente." })
                : tx({ it: "Scegli una nuova password per il tuo account Wayra.", en: "Choose a new password for your Wayra account.", fr: "Choisissez un nouveau mot de passe pour votre compte Wayra.", es: "Elige una nueva contraseña para tu cuenta Wayra." })}
            </Text>
          </View>

          {!success && ready && (
            <>
              <PasswordField value={password} onChange={setPassword} placeholder={tx({ it: "Nuova password", en: "New password", fr: "Nouveau mot de passe", es: "Nueva contraseña" })} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} styles={styles} colors={colors} />
              <PasswordField value={confirmPassword} onChange={setConfirmPassword} placeholder={tx({ it: "Conferma password", en: "Confirm password", fr: "Confirmez le mot de passe", es: "Confirma la contraseña" })} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} styles={styles} colors={colors} />
            </>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={success || !ready ? () => router.replace("/auth") : updatePassword}
            disabled={loading}
            activeOpacity={0.84}
          >
            {loading ? <ActivityIndicator color={colors.bg} /> : (
              <Text style={styles.buttonText}>
                {success || !ready
                  ? tx({ it: "Torna all'accesso", en: "Back to sign in", fr: "Retour à la connexion", es: "Volver al acceso" })
                  : tx({ it: "Aggiorna password", en: "Update password", fr: "Mettre à jour", es: "Actualizar contraseña" })}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type PasswordFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useTheme>["colors"];
};

function PasswordField({ value, onChange, placeholder, visible, onToggle, styles, colors }: PasswordFieldProps) {
  return (
    <View style={styles.inputRow}>
      <Ionicons name="lock-closed-outline" size={17} color={colors.textMuted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSub}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity onPress={onToggle} accessibilityRole="button">
        <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    flex: { flex: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 24 },
    content: { flex: 1, justifyContent: "center", paddingHorizontal: 24, gap: 14 },
    heading: { alignItems: "center", gap: 8, marginBottom: 10 },
    title: { color: colors.text, fontSize: 25, fontWeight: "900", textAlign: "center" },
    muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: "center" },
    inputRow: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 8 },
    input: { flex: 1, color: colors.text, fontSize: 15 },
    error: { color: colors.danger, fontSize: 13, lineHeight: 18, textAlign: "center" },
    button: { minHeight: 50, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, borderRadius: 8, backgroundColor: colors.accentGold, marginTop: 4 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: colors.bg, fontSize: 14, fontWeight: "900" },
  });
}
