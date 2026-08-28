import React, { Component, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
  /** Testo del fallback – opzionale, default in italiano */
  fallbackTitle?: string;
  fallbackMessage?: string;
  retryLabel?: string;
  /** Se true mostra il pulsante "Riprova" che fa reset del boundary */
  resetable?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

class ErrorBoundaryInner extends Component<Props, State> {
  static defaultProps = {
    fallbackTitle: "Qualcosa non ha funzionato",
    fallbackMessage: "Si \u00e8 verificato un errore inatteso. Riprova o riavvia l\u2019app.",
    retryLabel: "Riprova",
    resetable: true,
  };

  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In produzione qui andrà Sentry.captureException(error, { extra: info })
    if (__DEV__) {
      console.error("[ErrorBoundary] caught:", error, info.componentStack);
    }
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    const { hasError, error } = this.state;
    const { children, fallbackTitle, fallbackMessage, retryLabel, resetable } = this.props;

    if (!hasError) return children;

    return (
      <View style={styles.container}>
        <Ionicons name="warning-outline" size={52} color="#e8c06a" />
        <Text style={styles.title}>{fallbackTitle}</Text>
        <Text style={styles.message}>{fallbackMessage}</Text>
        {__DEV__ && error && (
          <Text style={styles.devError} numberOfLines={4}>
            {error.message}
          </Text>
        )}
        {resetable && (
          <TouchableOpacity style={styles.button} onPress={this.reset} activeOpacity={0.8}>
            <Ionicons name="refresh" size={16} color="#0f0f1e" style={{ marginRight: 6 }} />
            <Text style={styles.buttonText}>{retryLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────
// Hardcoded dark fallback: se l'app crasha, ThemeContext potrebbe non esserci

export function ErrorBoundary(props: Props) {
  const { lang } = useLanguage();
  const labels = lang === "es"
    ? { title: "Algo salio mal", message: "Se produjo un error inesperado. Intentalo de nuevo o reinicia la aplicacion.", retry: "Intentar de nuevo" }
    : lang === "fr"
    ? { title: "Un probl\u00e8me est survenu", message: "Une erreur inattendue s\u2019est produite. R\u00e9essayez ou red\u00e9marrez l\u2019application.", retry: "R\u00e9essayer" }
    : lang === "en"
      ? { title: "Something went wrong", message: "An unexpected error occurred. Try again or restart the app.", retry: "Try again" }
      : { title: "Qualcosa non ha funzionato", message: "Si \u00e8 verificato un errore inatteso. Riprova o riavvia l\u2019app.", retry: "Riprova" };

  return (
    <ErrorBoundaryInner
      {...props}
      fallbackTitle={props.fallbackTitle ?? labels.title}
      fallbackMessage={props.fallbackMessage ?? labels.message}
      retryLabel={props.retryLabel ?? labels.retry}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f1e",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 14,
  },
  title: {
    color: "#e2e0f0",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    color: "#8b89a0",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  devError: {
    color: "#f87171",
    fontSize: 11,
    fontFamily: "monospace" as any,
    textAlign: "left",
    backgroundColor: "#1a1a2e",
    padding: 10,
    borderRadius: 8,
    alignSelf: "stretch",
    marginTop: 4,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8c06a",
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 6,
  },
  buttonText: {
    color: "#0f0f1e",
    fontSize: 14,
    fontWeight: "700",
  },
});
