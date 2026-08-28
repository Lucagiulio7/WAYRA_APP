import { QueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

// ─── QueryClient ────────────────────────────────────────────────────────────
// Il catalogo e' incluso nell'app: non scade e non richiede tentativi di rete.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: 1000 * 60 * 60 * 24,
      retry: false,
    },
  },
});

// ─── AsyncStorage Persister ─────────────────────────────────────────────────
// Solo le query marcate esplicitamente come persistenti vengono salvate.
// Il catalogo bundled non va duplicato in AsyncStorage.
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "wayra_query_cache",
  throttleTime: 1000,   // scrive su storage max 1x/sec per performance
});
