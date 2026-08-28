/**
 * useCityDownload — gestione pacchetti città offline
 *
 * Prepara i contenuti dinamici (in particolare i trasporti) e registra
 * la versione del pacchetto locale già incluso nell'app.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";
import {
  cacheCityForOffline,
  listCachedCities,
  removeCityOfflineCache,
} from "@/services/cityOfflineCache";

// ─── Tipi ─────────────────────────────────────────────────────────────────────

export type DownloadStatus = "idle" | "downloading" | "done" | "error";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCityDownload() {
  // Set delle città scaricate (persistito)
  const [downloaded, setDownloaded] = useState<ReadonlySet<string>>(new Set());
  // Stato download per città: idle | downloading | done | error
  const [statuses, setStatuses] = useState<Record<string, DownloadStatus>>({});
  const inFlight = useRef(new Set<string>());

  // Carica la lista dal disco all'avvio
  useEffect(() => {
    listCachedCities()
      .then((cities) => {
        setDownloaded(cities);
        setStatuses((prev) => {
          const next = { ...prev };
          cities.forEach((city) => { next[city] = "done"; });
          return next;
        });
      })
      .catch(() => {/* ignora errori di lettura */});
  }, []);

  // ── Helpers interni ────────────────────────────────────────────────────────

  function setStatus(city: string, status: DownloadStatus) {
    setStatuses((prev) => ({ ...prev, [city]: status }));
  }

  // ── Download ───────────────────────────────────────────────────────────────

  const downloadCity = useCallback(async (city: string) => {
    const cityKey = city.trim().toLowerCase();
    if (!cityKey || inFlight.current.has(cityKey)) return;

    inFlight.current.add(cityKey);
    setStatus(cityKey, "downloading");

    try {
      await cacheCityForOffline(cityKey);
      setDownloaded((previous) => new Set(previous).add(cityKey));
      setStatus(cityKey, "done");
    } catch {
      setStatus(cityKey, "error");
    } finally {
      inFlight.current.delete(cityKey);
    }
  }, []);

  // ── Elimina pacchetto ──────────────────────────────────────────────────────

  const deleteCity = useCallback(async (city: string) => {
    const cityKey = city.trim().toLowerCase();
    await removeCityOfflineCache(cityKey);
    setDownloaded((previous) => {
      const next = new Set(previous);
      next.delete(cityKey);
      return next;
    });
    setStatus(cityKey, "idle");
  }, []);

  // ── Helpers pubblici ───────────────────────────────────────────────────────

  const getStatus = useCallback(
    (city: string): DownloadStatus => statuses[city.trim().toLowerCase()] ?? "idle",
    [statuses],
  );

  const isDownloaded = useCallback(
    (city: string) => downloaded.has(city.trim().toLowerCase()),
    [downloaded],
  );

  /** Chiede conferma e poi cancella il pacchetto */
  const confirmDelete = useCallback((city: string, cityLabel: string, lang: string) => {
    const copy = {
      it: {
        title: "Rimuovere i dati offline?",
        body: `I dati offline di ${cityLabel} verranno rimossi dal dispositivo.`,
        cancel: "Annulla",
        remove: "Rimuovi",
      },
      en: {
        title: "Remove offline data?",
        body: `Offline data for ${cityLabel} will be removed from this device.`,
        cancel: "Cancel",
        remove: "Remove",
      },
      fr: {
        title: "Supprimer les données hors ligne ?",
        body: `Les données hors ligne de ${cityLabel} seront supprimées de cet appareil.`,
        cancel: "Annuler",
        remove: "Supprimer",
      },
      es: {
        title: "¿Eliminar los datos sin conexión?",
        body: `Los datos sin conexión de ${cityLabel} se eliminarán de este dispositivo.`,
        cancel: "Cancelar",
        remove: "Eliminar",
      },
    }[lang as "it" | "en" | "fr" | "es"] ?? {
      title: "Remove offline data?",
      body: `Offline data for ${cityLabel} will be removed from this device.`,
      cancel: "Cancel",
      remove: "Remove",
    };
    Alert.alert(
      copy.title,
      copy.body,
      [
        { text: copy.cancel, style: "cancel" },
        {
          text: copy.remove,
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
