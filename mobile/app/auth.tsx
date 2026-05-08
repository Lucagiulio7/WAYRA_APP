import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Linking,
} from "react-native";

// ── URL legali — aggiorna prima della pubblicazione ────────────────────────────
const PRIVACY_URL = "https://wayra.app/privacy";
const TERMS_URL   = "https://wayra.app/terms";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle, signInWithApple, resetPassword } = useAuth();
  const { lang } = useLanguage();
  const { colors } = useTheme();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isLogin = mode === "login";
  const isForgot = mode === "forgot";

  const handleGoogle = async () => {
    setSocialLoading("google");
    setError(null);
    const { error: err } = await signInWithGoogle();
    setSocialLoading(null);
    if (err) setError(err);
    else router.back();
  };

  const handleApple = async () => {
    setSocialLoading("apple");
    setError(null);
    const { error: err } = await signInWithApple();
    setSocialLoading(null);
    if (err) setError(err);
    else router.back();
  };

  const handleForgot = async () => {
    Keyboard.dismiss();
    if (!email.trim()) {
      setError(lang === "it" ? "Inserisci la tua email" : "Enter your email");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    const { error: err } = await resetPassword(email.trim());
    setLoading(false);
    if (err) {
      setError(translateError(err, lang));
    } else {
      setSuccess(
        lang === "it"
          ? "Email inviata! Controlla la tua casella di posta."
          : "Email sent! Check your inbox.",
      );
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!email.trim() || !password.trim()) {
      setError(lang === "it" ? "Compila tutti i campi" : "Fill in all fields");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    const fn = isLogin ? signIn : signUp;
    const { error: authError } = await fn(email.trim(), password);

    setLoading(false);

    if (authError) {
      setError(translateError(authError, lang));
    } else if (!isLogin) {
      setSuccess(
        lang === "it"
          ? "Account creato! Controlla la tua email per confermare."
          : "Account created! Check your email to confirm.",
      );
    } else {
      router.back();
    }
  };

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity
              onPress={() => {
                if (isForgot) { setMode("login"); setError(null); setSuccess(null); }
                else router.back();
              }}
              style={s.backBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={22} color={colors.accentGold} />
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <View style={s.logoArea}>
            <Text style={s.brand}>WAYRA</Text>
            <Text style={s.tagline}>
              {isForgot
                ? (lang === "it" ? "Recupera password" : "Reset password")
                : isLogin
                  ? (lang === "it" ? "Accedi al tuo account" : "Sign in to your account")
                  : (lang === "it" ? "Crea un account" : "Create an account")}
            </Text>
          </View>

          {/* Form */}
          <View style={s.form}>

            {/* ── Forgot password mode ── */}
            {isForgot ? (
              <>
                <View style={s.fieldGroup}>
                  <Text style={s.label}>Email</Text>
                  <View style={s.inputRow}>
                    <Ionicons name="mail-outline" size={16} color={colors.textMuted} style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      value={email}
                      onChangeText={(v) => { setEmail(v); setError(null); }}
                      placeholder="name@example.com"
                      placeholderTextColor={colors.textSub}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      selectionColor={colors.accentGold}
                    />
                  </View>
                </View>

                {!!error && (
                  <View style={s.errorBox}>
                    <Ionicons name="warning-outline" size={14} color="#f87171" />
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                )}
                {!!success && (
                  <View style={s.successBox}>
                    <Ionicons name="checkmark-circle-outline" size={14} color="#6ee7b7" />
                    <Text style={s.successText}>{success}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[s.cta, loading && s.ctaDisabled]}
                  onPress={handleForgot}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.bg} />
                  ) : (
                    <Text style={s.ctaText}>
                      {lang === "it" ? "Invia email di recupero" : "Send reset email"}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setMode("login"); setError(null); setSuccess(null); }}
                  style={s.toggleBtn}
                  activeOpacity={0.7}
                >
                  <Text style={s.toggleText}>
                    {lang === "it" ? "Torna al login" : "Back to sign in"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* ── Email ── */}
                <View style={s.fieldGroup}>
                  <Text style={s.label}>Email</Text>
                  <View style={s.inputRow}>
                    <Ionicons name="mail-outline" size={16} color={colors.textMuted} style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      value={email}
                      onChangeText={(v) => { setEmail(v); setError(null); }}
                      placeholder="name@example.com"
                      placeholderTextColor={colors.textSub}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      selectionColor={colors.accentGold}
                    />
                  </View>
                </View>

                {/* ── Password ── */}
                <View style={s.fieldGroup}>
                  <View style={s.passwordLabelRow}>
                    <Text style={s.label}>Password</Text>
                    {isLogin && (
                      <TouchableOpacity
                        onPress={() => { setMode("forgot"); setError(null); setSuccess(null); }}
                        activeOpacity={0.7}
                      >
                        <Text style={s.forgotLink}>
                          {lang === "it" ? "Password dimenticata?" : "Forgot password?"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={s.inputRow}>
                    <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      value={password}
                      onChangeText={(v) => { setPassword(v); setError(null); }}
                      placeholder={lang === "it" ? "La tua password" : "Your password"}
                      placeholderTextColor={colors.textSub}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      selectionColor={colors.accentGold}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword((v) => !v)}
                      style={s.eyeBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={16}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Error / Success */}
                {!!error && (
                  <View style={s.errorBox}>
                    <Ionicons name="warning-outline" size={14} color="#f87171" />
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                )}
                {!!success && (
                  <View style={s.successBox}>
                    <Ionicons name="checkmark-circle-outline" size={14} color="#6ee7b7" />
                    <Text style={s.successText}>{success}</Text>
                  </View>
                )}

                {/* Submit */}
                <TouchableOpacity
                  style={[s.cta, loading && s.ctaDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.bg} />
                  ) : (
                    <Text style={s.ctaText}>
                      {isLogin
                        ? (lang === "it" ? "Accedi" : "Sign in")
                        : (lang === "it" ? "Crea account" : "Create account")}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* ── Social divider ── */}
                <View style={s.dividerRow}>
                  <View style={s.dividerLine} />
                  <Text style={s.dividerText}>{lang === "it" ? "oppure" : "or"}</Text>
                  <View style={s.dividerLine} />
                </View>

                {/* ── Google Sign In ── */}
                <TouchableOpacity
                  style={[s.socialBtn, socialLoading === "google" && s.socialBtnLoading]}
                  onPress={handleGoogle}
                  disabled={!!socialLoading}
                  activeOpacity={0.85}
                >
                  {socialLoading === "google" ? (
                    <ActivityIndicator color={colors.text} size="small" />
                  ) : (
                    <>
                      <Text style={s.googleIcon}>G</Text>
                      <Text style={s.socialBtnText}>
                        {lang === "it" ? "Continua con Google" : "Continue with Google"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* ── Apple Sign In (iOS only) ── */}
                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    style={[s.socialBtn, s.appleBtn, socialLoading === "apple" && s.socialBtnLoading]}
                    onPress={handleApple}
                    disabled={!!socialLoading}
                    activeOpacity={0.85}
                  >
                    {socialLoading === "apple" ? (
                      <ActivityIndicator color={colors.bg} size="small" />
                    ) : (
                      <>
                        <Ionicons name="logo-apple" size={18} color={colors.bg} />
                        <Text style={[s.socialBtnText, s.appleBtnText]}>
                          {lang === "it" ? "Continua con Apple" : "Continue with Apple"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Toggle mode */}
                <TouchableOpacity
                  onPress={() => { setMode(isLogin ? "register" : "login"); setError(null); setSuccess(null); }}
                  style={s.toggleBtn}
                  activeOpacity={0.7}
                >
                  <Text style={s.toggleText}>
                    {isLogin
                      ? (lang === "it" ? "Non hai un account? Registrati" : "No account? Register")
                      : (lang === "it" ? "Hai già un account? Accedi" : "Already have an account? Sign in")}
                  </Text>
                </TouchableOpacity>

                {/* Continua senza account */}
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={s.guestBtn}
                  activeOpacity={0.7}
                >
                  <Text style={s.guestText}>
                    {lang === "it" ? "Continua senza account" : "Continue without account"}
                  </Text>
                </TouchableOpacity>

                {/* Privacy / Termini */}
                <View style={s.legalRow}>
                  <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)} activeOpacity={0.7}>
                    <Text style={s.legalLink}>
                      {lang === "it" ? "Privacy Policy" : "Privacy Policy"}
                    </Text>
                  </TouchableOpacity>
                  <Text style={s.legalSep}>·</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)} activeOpacity={0.7}>
                    <Text style={s.legalLink}>
                      {lang === "it" ? "Termini di servizio" : "Terms of Service"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function translateError(msg: string, lang: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return lang === "it" ? "Email o password errati" : "Invalid email or password";
  if (m.includes("already registered") || m.includes("user already"))
    return lang === "it" ? "Email già registrata" : "Email already registered";
  if (m.includes("password"))
    return lang === "it" ? "Password troppo corta (min 6 caratteri)" : "Password too short (min 6 chars)";
  if (m.includes("email"))
    return lang === "it" ? "Indirizzo email non valido" : "Invalid email address";
  return lang === "it" ? "Errore. Riprova." : "Error. Please try again.";
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

    header: { paddingTop: 8, marginBottom: 8 },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      alignItems: "center", justifyContent: "center",
    },

    logoArea: { alignItems: "center", marginVertical: 36 },
    brand: {
      color: colors.accentGold, fontSize: 56,
      fontFamily: "BebasNeue_400Regular", letterSpacing: 6,
    },
    tagline: { color: colors.textMuted, fontSize: 13, marginTop: 4 },

    form: { gap: 16 },

    fieldGroup: { gap: 6 },
    passwordLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    label: { color: colors.textMuted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
    forgotLink: { color: colors.accentBlue, fontSize: 11, fontWeight: "600" },
    inputRow: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: colors.inputBg, borderRadius: 14,
      borderWidth: 1.5, borderColor: colors.border,
      paddingHorizontal: 12,
    },
    inputIcon: { marginRight: 8, flexShrink: 0 },
    input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 14 },
    eyeBtn: { padding: 4 },

    errorBox: {
      flexDirection: "row", gap: 8, alignItems: "flex-start",
      backgroundColor: "#f8717122", borderRadius: 10, padding: 12,
      borderWidth: 1, borderColor: "#f8717144",
    },
    errorText: { flex: 1, color: "#f87171", fontSize: 13, lineHeight: 18 },

    successBox: {
      flexDirection: "row", gap: 8, alignItems: "flex-start",
      backgroundColor: "#6ee7b718", borderRadius: 10, padding: 12,
      borderWidth: 1, borderColor: "#6ee7b740",
    },
    successText: { flex: 1, color: "#6ee7b7", fontSize: 13, lineHeight: 18 },

    cta: {
      backgroundColor: colors.accentGold, borderRadius: 16,
      paddingVertical: 16, alignItems: "center", marginTop: 8,
    },
    ctaDisabled: { opacity: 0.7 },
    ctaText: { color: colors.bg, fontSize: 16, fontWeight: "800" },

    dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { color: colors.textMuted, fontSize: 12 },

    socialBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingVertical: 14,
    },
    socialBtnLoading: { opacity: 0.6 },
    socialBtnText: { color: colors.text, fontSize: 15, fontWeight: "600" },
    googleIcon: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "800",
      width: 20,
      textAlign: "center",
    },

    appleBtn: { backgroundColor: colors.text, borderColor: colors.text },
    appleBtnText: { color: colors.bg },

    toggleBtn: { alignItems: "center", paddingVertical: 4 },
    toggleText: { color: colors.accentBlue, fontSize: 13 },

    guestBtn: { alignItems: "center", paddingVertical: 4 },
    guestText: { color: colors.textMuted, fontSize: 12 },

    legalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingTop: 4,
    },
    legalLink: { color: colors.textMuted, fontSize: 11, textDecorationLine: "underline" },
    legalSep:  { color: colors.textMuted, fontSize: 11 },
  });
}
