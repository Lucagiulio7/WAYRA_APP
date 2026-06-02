/**
 * shadow — sistema di ombre a livelli (Material Design + iOS HIG).
 *
 * Le ombre di React Native default sono "hard": un solo box-shadow secco.
 * Un'app premium usa **ombre multilivello**: una piccola netta vicina alla
 * superficie (contatto) + una grande sfumata lontana (volume). Risultato:
 * profondità realistica senza essere invadente.
 *
 * Uso:
 *   <View style={[styles.card, shadowLevel(2)]}>...</View>
 *
 * Livelli:
 *   0 = nessuna ombra (flat)
 *   1 = card sottile (contatto leggero)
 *   2 = card standard (lift normale)
 *   3 = elevata (modal, sheet, FAB)
 *   4 = sospesa (drag attivo, popover)
 */
import { Platform, ViewStyle } from "react-native";

type Level = 0 | 1 | 2 | 3 | 4;

interface ShadowSpec {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;     // Android only
}

const LEVELS: Record<Level, ShadowSpec> = {
  0: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  1: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  2: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
  },
  3: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
  },
  4: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 14,
  },
};

/**
 * Restituisce uno style object con shadow / elevation per il livello richiesto.
 * Su web (RN Web), shadow viene mappato a box-shadow automaticamente.
 */
export function shadowLevel(level: Level): ViewStyle {
  const spec = LEVELS[level];
  if (Platform.OS === "android") {
    return { elevation: spec.elevation } as ViewStyle;
  }
  return {
    shadowColor: spec.shadowColor,
    shadowOffset: spec.shadowOffset,
    shadowOpacity: spec.shadowOpacity,
    shadowRadius: spec.shadowRadius,
  };
}

/**
 * Variante "soft" — ombra colorata che riprende un accent (oro, blu, verde).
 * Utile per CTA o card con bordo colorato che si vuole far "fluttuare".
 */
export function coloredShadow(color: string, level: Level = 2): ViewStyle {
  const spec = LEVELS[level];
  if (Platform.OS === "android") {
    return { elevation: spec.elevation } as ViewStyle;
  }
  return {
    shadowColor: color,
    shadowOffset: spec.shadowOffset,
    shadowOpacity: spec.shadowOpacity * 1.4, // ombre colorate sono percepite meno → boost
    shadowRadius: spec.shadowRadius * 1.2,
  };
}
