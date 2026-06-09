import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

export type AnalyticsEventName =
  | "app_opened"
  | "onboarding_completed"
  | "search_performed"
  | "destination_viewed"
  | "manual_builder_opened"
  | "trip_created"
  | "itinerary_generated"
  | "trip_generation_failed"
  | "trip_viewed"
  | "itinerary_tab_viewed"
  | "itinerary_day_viewed"
  | "map_opened"
  | "restaurant_or_food_viewed"
  | "restaurant_selected"
  | "restaurant_removed"
  | "accommodation_area_viewed"
  | "pdf_preview_opened"
  | "pdf_export_started"
  | "trip_saved"
  | "trip_unsaved"
  | "settings_opened"
  | "analytics_consent_updated";

type AnalyticsPrimitive = string | number | boolean | null;
type AnalyticsValue = AnalyticsPrimitive | AnalyticsValue[] | { [key: string]: AnalyticsValue };
export type AnalyticsProperties = Record<string, AnalyticsValue | undefined>;

const ANONYMOUS_ID_KEY = "wayra_analytics_anonymous_id";
const CONSENT_KEY = "wayra_analytics_consent";
const DEFAULT_ANALYTICS_ENABLED = process.env.EXPO_PUBLIC_ANALYTICS_ENABLED !== "false";

function createAnonymousId() {
  return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

async function getAnonymousId() {
  const stored = await AsyncStorage.getItem(ANONYMOUS_ID_KEY);
  if (stored) return stored;

  const next = createAnonymousId();
  await AsyncStorage.setItem(ANONYMOUS_ID_KEY, next);
  return next;
}

function cleanProperties(properties: AnalyticsProperties) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined),
  );
}

export async function getAnalyticsConsent() {
  const stored = await AsyncStorage.getItem(CONSENT_KEY);
  if (stored === null) return DEFAULT_ANALYTICS_ENABLED;
  return stored === "true";
}

export async function setAnalyticsConsent(enabled: boolean) {
  await AsyncStorage.setItem(CONSENT_KEY, enabled ? "true" : "false");
}

export async function track(event: AnalyticsEventName, properties: AnalyticsProperties = {}) {
  try {
    const enabled = await getAnalyticsConsent();
    if (!enabled) return;

    const anonymousId = await getAnonymousId();
    const { data } = await supabase.auth.getSession();

    await supabase.from("analytics_events").insert({
      event,
      anonymous_id: anonymousId,
      user_id: data.session?.user?.id ?? null,
      platform: Platform.OS,
      properties: cleanProperties(properties),
    });
  } catch (error) {
    if (__DEV__) console.warn("[analytics] track failed:", event, error);
  }
}
