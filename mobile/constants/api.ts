// In sviluppo: legge EXPO_PUBLIC_API_BASE_URL da .env.local
// In produzione: legge da .env.production (impostare l'URL del backend pubblico)
// Fallback all'IP LAN locale per compatibilità con le sessioni Expo Go già aperte
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://192.168.1.23:8000";
