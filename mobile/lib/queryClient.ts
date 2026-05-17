import { QueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

// ─── QueryClient ────────────────────────────────────────────────────────────
// staleTime: 10 min  → dati freschi per 10 min, nessuna re-fetch inutile
// gcTime:    24 h    → le query scadute restano in cache per 24 h (offline)
// retry:     2       → al massimo 2 tentativi extra prima di mostrare errore
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10,       // 10 minuti
      gcTime: 1000 * 60 * 60 * 24,     // 24 ore (persistenza offline)
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    },
  },
});

// ─── AsyncStorage Persister ─────────────────────────────────────────────────
// Serializza l'intera cache TanStack su AsyncStorage.
// Al prossimo avvio, i dati sono disponibili immediatamente (senza spinner).
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "wayra_query_cache",
  throttleTime: 1000,   // scrive su storage max 1x/sec per performance
});
