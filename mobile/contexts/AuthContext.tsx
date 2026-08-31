import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { Session, User } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

const OAUTH_REDIRECT_URI = makeRedirectUri({ scheme: "urveya", path: "auth-callback" });
const PASSWORD_REDIRECT_URI = makeRedirectUri({ scheme: "urveya", path: "reset-password" });

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithApple: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signInWithApple: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  signOut: async () => {},
  deleteAccount: async () => ({ error: null }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setSession(null);
          setUser(null);
          return;
        }
        setSession(data.session);
        setUser(data.session?.user ?? null);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // ── Email / Password ──────────────────────────────────────────────────────

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  // ── Google OAuth ──────────────────────────────────────────────────────────

  const signInWithGoogle = async (): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: OAUTH_REDIRECT_URI,
          skipBrowserRedirect: true,
        },
      });
      if (error || !data.url) return { error: error?.message ?? "Errore OAuth Google" };

      const result = await WebBrowser.openAuthSessionAsync(data.url, OAUTH_REDIRECT_URI);

      if (result.type === "success") {
        // PKCE flow: il codice è nel query param
        const urlObj = new URL(result.url);
        const code = urlObj.searchParams.get("code");
        if (code) {
          const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchErr) return { error: exchErr.message };
        }
      }
      return { error: null };
    } catch (e: any) {
      return { error: e?.message ?? "Errore sconosciuto" };
    }
  };

  // ── Apple Sign In (solo iOS) ──────────────────────────────────────────────

  const signInWithApple = async (): Promise<{ error: string | null }> => {
    if (Platform.OS !== "ios") return { error: "Apple Sign In è disponibile solo su iOS" };
    try {
      const AppleAuth = await import("expo-apple-authentication");
      const credential = await AppleAuth.signInAsync({
        requestedScopes: [
          AppleAuth.AppleAuthenticationScope.FULL_NAME,
          AppleAuth.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) return { error: "Token Apple non ricevuto" };

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });
      return { error: error?.message ?? null };
    } catch (e: any) {
      // L'utente ha premuto Annulla — non è un errore da mostrare
      if (e?.code === "ERR_REQUEST_CANCELED") return { error: null };
      return { error: e?.message ?? "Errore Apple Sign In" };
    }
  };

  // ── Reset Password ────────────────────────────────────────────────────────

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: PASSWORD_REDIRECT_URI,
    });
    return { error: error?.message ?? null };
  };

  // ── Sign Out ──────────────────────────────────────────────────────────────

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) await supabase.auth.signOut({ scope: "local" });
    } catch {
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  const deleteAccount = async (): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.functions.invoke("delete-account", {
        method: "POST",
      });
      if (error) return { error: error.message };

      await supabase.auth.signOut({ scope: "local" });
      setUser(null);
      setSession(null);
      return { error: null };
    } catch (error: any) {
      return { error: error?.message ?? "Unable to delete the account" };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signInWithApple, resetPassword, signOut, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
