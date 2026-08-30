import AsyncStorage from "@react-native-async-storage/async-storage";

import { withStorageLock } from "@/services/resilientStorage";

const REVIEW_STATE_KEY = "urveya_review_state_v1";
const REQUIRED_POSITIVE_OUTCOMES = 2;

type ReviewState = {
  positiveOutcomes: number;
  attemptedVersions: string[];
};

const EMPTY_STATE: ReviewState = {
  positiveOutcomes: 0,
  attemptedVersions: [],
};

function decodeReviewState(raw: string | null): ReviewState {
  if (!raw) return EMPTY_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<ReviewState>;
    return {
      positiveOutcomes: Number.isFinite(parsed.positiveOutcomes)
        ? Math.max(0, Math.floor(parsed.positiveOutcomes as number))
        : 0,
      attemptedVersions: Array.isArray(parsed.attemptedVersions)
        ? parsed.attemptedVersions.filter((value): value is string => typeof value === "string")
        : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

/**
 * Registra un risultato utile concluso dall'utente e indica se questa versione
 * puo chiedere una recensione. La decisione e serializzata per evitare doppi
 * prompt quando due azioni terminano quasi contemporaneamente.
 */
export function recordPositiveOutcome(appVersion: string): Promise<boolean> {
  return withStorageLock(REVIEW_STATE_KEY, async () => {
    const current = decodeReviewState(await AsyncStorage.getItem(REVIEW_STATE_KEY));
    const next: ReviewState = {
      ...current,
      positiveOutcomes: Math.min(current.positiveOutcomes + 1, REQUIRED_POSITIVE_OUTCOMES),
    };
    await AsyncStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(next));
    return next.positiveOutcomes >= REQUIRED_POSITIVE_OUTCOMES
      && !next.attemptedVersions.includes(appVersion);
  });
}

/** Segna il tentativo prima di aprire il prompt nativo, anche se lo store non lo mostra. */
export function markReviewAttempted(appVersion: string): Promise<void> {
  return withStorageLock(REVIEW_STATE_KEY, async () => {
    const current = decodeReviewState(await AsyncStorage.getItem(REVIEW_STATE_KEY));
    if (current.attemptedVersions.includes(appVersion)) return;
    const next: ReviewState = {
      ...current,
      attemptedVersions: [...current.attemptedVersions, appVersion].slice(-5),
    };
    await AsyncStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(next));
  });
}

export const REVIEW_ELIGIBILITY = {
  storageKey: REVIEW_STATE_KEY,
  requiredPositiveOutcomes: REQUIRED_POSITIVE_OUTCOMES,
} as const;
