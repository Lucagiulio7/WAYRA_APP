import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupportedStorage } from "@supabase/supabase-js";
import { Platform } from "react-native";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/constants/supabase";

const webStorage: SupportedStorage = {
  getItem: async (key) => typeof window === "undefined" ? null : window.localStorage.getItem(key),
  setItem: async (key, value) => {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  },
};

const authStorage = Platform.OS === "web" ? webStorage : AsyncStorage;
const canRefreshSession = Platform.OS !== "web" || typeof window !== "undefined";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: authStorage,
    autoRefreshToken: canRefreshSession,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
