// Supabase config — letta da .env (EXPO_PUBLIC_*) con fallback ai valori di sviluppo.
// In produzione DEVE essere configurata via .env.production o variabili EAS.
// L'anon key è pubblica per design ma le tabelle Supabase devono avere RLS policies attive.

const FALLBACK_SUPABASE_URL = "https://uoxzksmgzylpdrssrwlb.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVveHprc21nenlscGRyc3Nyd2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NTYxOTUsImV4cCI6MjA5MjMzMjE5NX0.WOmH8x5PTyS4jGCAmHetFFO9Oz437BTgoBl5LLW-7WQ";

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || FALLBACK_SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || FALLBACK_SUPABASE_ANON_KEY;

export const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
