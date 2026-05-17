import React, { Component, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
  /** Testo del fallback – opzionale, default in italiano */
  fallbackTitle?: string;
  fallbackMessage?: string;
  /** Se true mostra il pulsante "Riprova" che fa reset del boundary */
  resetable?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<Props, State> {
  static defaultProps = {
    fallbackTitle: "Qualcosa è andato storto",
    fallbackMessage: "Si è verificato un errore inatteso. Riprova o riavvia l'app.",
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
    const { children, fallbackTitle, fallbackMessage, resetable } = this.props;

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
            <Text style={styles.buttonText}>Riprova</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────
// Hardcoded dark fallback: se l'app crasha, ThemeContext potrebbe non esserci

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
