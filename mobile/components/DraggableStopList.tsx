/**
 * DraggableStopList
 *
 * Lista di tappe con drag-and-drop via PanResponder nativo.
 * Tenere premuto il grip (≡) per 250 ms, poi trascinare.
 *
 * Algoritmo shift:
 *   - item i < d (sopra il dragged) e i >= slot  → shift GIÙ  (+draggedH)
 *   - item i > d (sotto il dragged) e i <= slot  → shift SU   (-draggedH)
 *   - tutto il resto                              → 0
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Stop } from "@/types";
import { StopCard } from "./StopCard";
import { ITEM_GAP, DEFAULT_H, sKey, touchToSlot, reorderStops } from "@/utils/draggableUtils";

// ── Costanti ──────────────────────────────────────────────────────────────────

const LONG_PRESS = 250;  // ms prima che il drag si attivi

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  stops: Stop[];
  onReorder: (newStops: Stop[]) => void;
  onReplaceStop?: (stopId: number) => void;
  onNoteChange?: (stopIndex: number, note: string) => void;
  lang: string;
  colors: any;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function DraggableStopList({
  stops,
  onReorder,
  onReplaceStop,
  onNoteChange,
  lang,
  colors,
}: Props) {
  const [displayed, setDisplayed] = useState(stops);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  // Sincronizza quando il parent aggiorna le tappe (es. sostituzione)
  useEffect(() => { setDisplayed(stops); }, [stops]);

  // ── Refs per PanResponder (closures non-stale) ────────────────────────────
  const displayedRef    = useRef(stops);
  displayedRef.current  = displayed;

  const containerRef    = useRef<View>(null);
  const containerPageY  = useRef(0);
  const heights         = useRef<Map<string, number>>(new Map());
  const idxKeysRef      = useRef<string[]>([]);          // sKey per ogni posizione
  const isDragging      = useRef(false);
  const activeDragIdx   = useRef<number | null>(null);
  const currentSlot     = useRef(0);
  const longPressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Animated ──────────────────────────────────────────────────────────────
  const dragAnim  = useRef(new Animated.Value(0)).current;
  const shiftAnims = useRef<Animated.Value[]>([]);
  // Garantisce abbastanza valori (il numero di tappe può crescere)
  while (shiftAnims.current.length < Math.max(stops.length, displayed.length)) {
    shiftAnims.current.push(new Animated.Value(0));
  }

  // ── Aggiorna shift degli elementi non-dragged ─────────────────────────────
  const updateShifts = useCallback((d: number, slot: number) => {
    const ss   = displayedRef.current;
    const keys = idxKeysRef.current;
    const draggedH = (heights.current.get(keys[d]) ?? DEFAULT_H) + ITEM_GAP;

    const anims: Animated.CompositeAnimation[] = [];
    for (let i = 0; i < ss.length; i++) {
      if (i === d) continue;
      let shift = 0;
      if (i < d && i >= slot) shift =  draggedH;
      if (i > d && i <= slot) shift = -draggedH;
      anims.push(
        Animated.spring(shiftAnims.current[i], {
          toValue: shift, useNativeDriver: true, bounciness: 0, speed: 28,
        }),
      );
    }
    Animated.parallel(anims).start();
  }, []);

  const resetShifts = useCallback(() => {
    Animated.parallel(
      shiftAnims.current.map((a) =>
        Animated.spring(a, { toValue: 0, useNativeDriver: true, bounciness: 0 }),
      ),
    ).start();
  }, []);

  // ── Factory PanResponder ──────────────────────────────────────────────────
  const makePanResponder = useCallback(
    (orderIdx: number) =>
      PanResponder.create({
        onStartShouldSetPanResponder:    () => true,
        onMoveShouldSetPanResponder:     () => isDragging.current,
        onPanResponderTerminationRequest: () => !isDragging.current,
        onShouldBlockNativeResponder:    () => isDragging.current,

        onPanResponderGrant: () => {
          longPressTimer.current = setTimeout(() => {
            containerRef.current?.measure((_x, _y, _w, _h, _px, pageY) => {
              containerPageY.current = pageY;
            });
            isDragging.current     = true;
            activeDragIdx.current  = orderIdx;
            currentSlot.current    = orderIdx;
            dragAnim.setValue(0);
            shiftAnims.current.forEach((a) => a.setValue(0));
            setDraggingIdx(orderIdx);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          }, LONG_PRESS);
        },

        onPanResponderMove: (e, gs) => {
          if (!isDragging.current) {
            if (Math.abs(gs.dy) > 10 || Math.abs(gs.dx) > 10) {
              clearTimeout(longPressTimer.current!);
            }
            return;
          }
          dragAnim.setValue(gs.dy);
          const touchListY = e.nativeEvent.pageY - containerPageY.current;
          const slot = touchToSlot(
            touchListY,
            orderIdx,
            displayedRef.current,
            heights.current,
            idxKeysRef.current,
          );
          if (slot !== currentSlot.current) {
            currentSlot.current = slot;
            updateShifts(orderIdx, slot);
          }
        },

        onPanResponderRelease: (_, _gs) => {
          clearTimeout(longPressTimer.current!);
          if (!isDragging.current) { isDragging.current = false; return; }

          isDragging.current = false;
          const slot     = currentSlot.current;
          const newStops = reorderStops(displayedRef.current, orderIdx, slot);

          dragAnim.setValue(0);
          resetShifts();
          setDisplayed(newStops);
          setDraggingIdx(null);
          activeDragIdx.current = null;
          onReorder(newStops);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        },

        onPanResponderTerminate: () => {
          clearTimeout(longPressTimer.current!);
          isDragging.current    = false;
          activeDragIdx.current = null;
          dragAnim.setValue(0);
          resetShifts();
          setDraggingIdx(null);
        },
      }),
    [dragAnim, updateShifts, resetShifts, onReorder],
  );

  // Ricostruisce i PanResponder quando la lista cambia
  const panResponders    = useRef<ReturnType<typeof PanResponder.create>[]>([]);
  const panRespondersFor = useRef<Stop[]>([]);
  if (panRespondersFor.current !== displayed) {
    // Aggiorna le chiavi per questa configurazione
    idxKeysRef.current     = displayed.map(sKey);
    panResponders.current  = displayed.map((_, i) => makePanResponder(i));
    panRespondersFor.current = displayed;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  let attractionIdx = 0;
  let foodIdx       = 0;

  return (
    <View ref={containerRef} style={styles.container}>
      {displayed.map((stop, orderIdx) => {
        const isDrag   = draggingIdx === orderIdx;
        const key      = sKey(stop, orderIdx);
        const attrIdx  = stop.type === "attraction"
          ? ++attractionIdx
          : (stop.type === "food" || stop.type === "meal")
            ? ++foodIdx
            : undefined;
        const shiftAnim = isDrag
          ? dragAnim
          : (shiftAnims.current[orderIdx] ?? new Animated.Value(0));

        return (
          <Animated.View
            key={key}
            style={[
              styles.item,
              { transform: [{ translateY: shiftAnim }] },
              isDrag && styles.itemDragging,
            ]}
            onLayout={(e) => {
              heights.current.set(key, e.nativeEvent.layout.height);
            }}
          >
            {/* ── Grip handle ── */}
            <View
              style={[
                styles.handle,
                isDrag && { backgroundColor: colors.accentGold + "22" },
              ]}
              {...panResponders.current[orderIdx]?.panHandlers}
            >
              <Ionicons
                name="reorder-three-outline"
                size={22}
                color={isDrag ? colors.accentGold : colors.textMuted}
              />
            </View>

            {/* ── Tappa ── */}
            <View style={styles.card}>
              <StopCard
                stop={stop}
                index={attrIdx}
                onReplace={
                  stop.type === "attraction" && stop.id > 0 && onReplaceStop
                    ? () => onReplaceStop(stop.id)
                    : undefined
                }
                onNoteChange={
                  onNoteChange ? (note) => onNoteChange(orderIdx, note) : undefined
                }
              />
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: ITEM_GAP },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemDragging: {
    zIndex: 999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    opacity: 0.96,
  },
  handle: {
    width: 30,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  card: { flex: 1 },
});
