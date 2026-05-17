/**
 * useNetworkStatus — monitora la connettività di rete.
 *
 * Restituisce:
 *  - isOnline: true se c'è connessione internet, false altrimenti
 *  - isInternetReachable: null durante il primo controllo, poi bool
 *
 * Usa @react-native-community/netinfo che funziona sia su iOS/Android
 * che su web (polyfill built-in).
 */

import { useEffect, useState } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

export interface NetworkStatus {
  /** Connettività disponibile e internet raggiungibile */
  isOnline: boolean;
  /** null = non ancora determinato, poi true/false */
  isInternetReachable: boolean | null;
  /** Tipo di connessione: wifi, cellular, none, … */
  connectionType: string;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,            // ottimistico: assumi online finché non sai
    isInternetReachable: null,
    connectionType: "unknown",
  });

  useEffect(() => {
    // Primo controllo immediato
    NetInfo.fetch().then(handleState);

    // Sottoscrizione ai cambiamenti
    const unsubscribe = NetInfo.addEventListener(handleState);
    return unsubscribe;
  }, []);

  function handleState(state: NetInfoState) {
    const reachable = state.isInternetReachable;
    const connected  = state.isConnected ?? false;

    setStatus({
      // isOnline = connesso E internet raggiungibile (null = non ancora noto → ottimistico)
      isOnline: connected && (reachable === null ? true : reachable),
      isInternetReachable: reachable,
      connectionType: state.type,
    });
  }

  return status;
}
