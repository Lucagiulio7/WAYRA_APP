import Constants from "expo-constants";
import { Platform } from "react-native";

const BACKEND_PORT = "8000";

function normalizeBaseUrl(url?: string | null): string | null {
  const value = url?.trim();
  if (!value) return null;
  return value.replace(/\/+$/, "");
}

function getExpoHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.manifest2?.extra?.expoClient?.hostUri ??
    Constants.manifest?.debuggerHost;

  if (!hostUri) return null;
  return hostUri.split(":")[0] || null;
}

function getDevBaseUrl(): string {
  if (Platform.OS === "web") return `http://localhost:${BACKEND_PORT}`;

  const expoHost = getExpoHost();
  if (expoHost) return `http://${expoHost}:${BACKEND_PORT}`;

  return `http://localhost:${BACKEND_PORT}`;
}

const ENV_BASE_URL = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);

// Production: set EXPO_PUBLIC_API_BASE_URL to a public HTTPS backend.
// Dev/Expo Go: always derive the LAN IP from Metro to avoid stale .env.local IPs.
export const API_BASE_URL = !__DEV__ && ENV_BASE_URL ? ENV_BASE_URL : getDevBaseUrl();
