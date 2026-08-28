import "react-native-url-polyfill/auto";
import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, asyncStoragePersister } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { track } from "@/services/AnalyticsService";

// ── Sentry: error monitoring in produzione ────────────────────────────────────
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: __DEV__ ? "development" : "production",
    tracesSampleRate: __DEV__ ? 0 : 0.2,
    enableNativeNagger: false, // silenzia warning su web/Expo Go
  });
}

SplashScreen.preventAutoHideAsync();

function AppStack() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "slide_from_right",
        }}
      >
        {/* Valigia parte mentre la schermata e' ancora in transizione: il fade evita lo scatto iniziale. */}
        <Stack.Screen name="packing" options={{ animation: "fade" }} />
      </Stack>
      {/* Banner offline — sovrapposto in cima, non blocca touch */}
      <OfflineBanner />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BebasNeue_400Regular,
    ...Ionicons.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    track("app_opened");
  }, []);


  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          buster: "wayra-local-catalog-v2",
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => query.meta?.persist === true,
          },
        }}
      >
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <SafeAreaProvider>
                <AppStack />
              </SafeAreaProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  );
}
