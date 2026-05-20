/**
 * draggableUtils — funzioni pure estratte da DraggableStopList.
 * Separate per semplicità di test (nessuna dipendenza React Native).
 */

import { Stop } from "@/types";

export const ITEM_GAP   = 8;
export const DEFAULT_H  = 100;

/**
 * Chiave stabile per Map altezze e React key.
 * Le tappe senza id univoco (id === -1) usano type + indice.
 */
export function sKey(stop: Stop, idx: number): string {
  return stop.id === -1 ? `${stop.type}-ft-${idx}` : `${stop.type}-${stop.id}`;
}

/**
 * Dato il tocco Y relativo al container e l'indice del drag,
 * restituisce lo slot d'inserimento nella lista ridotta (0..N-1).
 */
export function touchToSlot(
  touchListY: number,
  d: number,
  stops: Stop[],
  heights: Map<string, number>,
  idxKeys: string[],
): number {
  const N = stops.length;
  let y    = 0;
  let slot = 0;
  for (let i = 0; i < N; i++) {
    if (i === d) continue;
    const h = (heights.get(idxKeys[i]) ?? DEFAULT_H) + ITEM_GAP;
    if (touchListY > y + h / 2) slot++;
    y += h;
  }
  return slot;
}

/**
 * Riordina un array di Stop spostando l'elemento `fromIdx` nello slot `toSlot`.
 * Restituisce un nuovo array senza mutare l'originale.
 */
export function reorderStops(stops: Stop[], fromIdx: number, toSlot: number): Stop[] {
  const next = [...stops];
  const [removed] = next.splice(fromIdx, 1);
  next.splice(toSlot, 0, removed);
  return next;
}
