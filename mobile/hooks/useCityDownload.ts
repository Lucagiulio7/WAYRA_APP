/**
 * useCityDownload — gestione pacchetti città offline
 *
 * Scarica e pre-cacha in TanStack Query tutti i dati di una città
 * (attrazioni, ristoranti, city info, extras, quartieri) così che
 * siano disponibili senza rete al prossimo accesso.
 *
 * La lista delle città scaricate è persistita su AsyncStorage e
 * sopravvive ai riavvii dell'app.
 */

import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { queryClient } from "@/lib/queryClient";
import {
  fetchAttractions,
  fetchFoodSpots,
  fetchCityInfo,
  fetchCityExtras,
  fetchNeighborhoods,
} from "@/lib/cityFetchers";

// ─── Costanti ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "wayra_downloaded_cities_v1";

// staleTime lungo per i pacchetti offline: 7 giorni
// (l'utente può forzare un aggiornamento re-scaricando)
const OFFLINE_STALE = 1000 * 60 * 60 * 24 * 7;

// ─── Tipi ─────────────────────────────────────────────────────────────────────

export type DownloadStatus = "idle" | "downloading" | "done" | "error";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCityDownload() {
  // Set delle città scaricate (persistito)
  const [downloaded, setDownloaded] = useState<ReadonlySet<string>>(new Set());
  // Stato download per città: idle | downloading | done | error
  const [statuses, setStatuses] = useState<Record<string, DownloadStatus>>({});

  // Carica la lista dal disco all'avvio
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const arr: string[] = JSON.parse(raw);
          setDownloaded(new Set(arr));
          // Segna tutte le città già scaricate come "done"
          setStatuses((prev) => {
            const next = { ...prev };
            arr.forEach((c) => { next[c] = "done"; });
            return next;
          });
        }
      })
      .catch(() => {/* ignora errori di lettura */});
  }, []);

  // ── Helpers interni ────────────────────────────────────────────────────────

  function setStatus(city: string, status: DownloadStatus) {
    setStatuses((prev) => ({ ...prev, [city]: status }));
  }

  async function persistDownloaded(updated: Set<string>) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...updated]));
  }

  // ── Download ───────────────────────────────────────────────────────────────

  const downloadCity = useCallback(async (city: string) => {
    if (statuses[city] === "downloading") return; // già in corso

    setStatus(city, "downloading");

    try {
      // prefetchQuery: se i dati sono già in cache freschi, non ri-fetcha
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ["attractions", city],
          queryFn: () => fetchAttractions(city),
          staleTime: OFFLINE_STALE,
        }),
        queryClient.prefetchQuery({
          queryKey: ["foodSpots", city],
          queryFn: () => fetchFoodSpots(city),
          staleTime: OFFLINE_STALE,
        }),
        queryClient.prefetchQuery({
          queryKey: ["cityInfo", city],
          queryFn: () => fetchCityInfo(city),
          staleTime: OFFLINE_STALE,
        }),
        queryClient.prefetchQuery({
          queryKey: ["cityExtras", city],
          queryFn: () => fetchCityExtras(city),
          staleTime: OFFLINE_STALE,
        }),
        queryClient.prefetchQuery({
          queryKey: ["neighborhoods", city],
          queryFn: () => fetchNeighborhoods(city),
          staleTime: OFFLINE_STALE,
        }),
      ]);

      const updated = new Set([...downloaded, city]);
      setDownloaded(updated);
      setStatus(city, "done");
      await persistDownloaded(updated);
    } catch {
      setStatus(city, "error");
    }
  }, [downloaded, statuses]);

  // ── Elimina pacchetto ──────────────────────────────────────────────────────

  const deleteCity = useCallback(async (city: string) => {
    // Rimuove dalla cache TanStack Query
    queryClient.removeQueries({ queryKey: ["attractions",   city] });
    queryClient.removeQueries({ queryKey: ["foodSpots",     city] });
    queryClient.removeQueries({ queryKey: ["cityInfo",      city] });
    queryClient.removeQueries({ queryKey: ["cityExtras",    city] });
    queryClient.removeQueries({ queryKey: ["neighborhoods", city] });

    const updated = new Set([...downloaded].filter((c) => c !== city));
    setDownloaded(updated);
    setStatus(city, "idle");
    await persistDownloaded(updated);
  }, [downloaded]);

  // ── Helpers pubblici ───────────────────────────────────────────────────────

  const getStatus = useCallback(
    (city: string): DownloadStatus => statuses[city] ?? "idle",
    [statuses],
  );

  const isDownloaded = useCallback(
    (city: string) => downloaded.has(city),
    [downloaded],
  );

  /** Chiede conferma e poi cancella il pacchetto */
  const confirmDelete = useCallback((city: string, cityLabel: string, lang: string) => {
    Alert.alert(
      lang === "en" ? "Delete offline package?" : "Eliminare pacchetto offline?",
      lang === "en"
        ? `All offline data for ${cityLabel} will be removed from this device.`
        : `Tutti i dati offline di ${cityLabel} verranno rimossi dal dispositivo.`,
      [
        { text: lang === "en" ? "Cancel" : "Annulla", style: "cancel" },
        {
          text: lang === "en" ? "Delete" : "Elimina",
          style: "destructive",
          onPress: () => deleteCity(city),
        },
      ],
    );
  }, [deleteCity]);

  return {
    isDownloaded,
    getStatus,
    downloadCity,
    deleteCity,
    confirmDelete,
    downloadedCount: downloaded.size,
  };
}
