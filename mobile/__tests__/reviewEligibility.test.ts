jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  markReviewAttempted,
  recordPositiveOutcome,
  REVIEW_ELIGIBILITY,
} from "@/services/reviewEligibility";

describe("review eligibility", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("waits for two positive outcomes", async () => {
    await expect(recordPositiveOutcome("1.0.0")).resolves.toBe(false);
    await expect(recordPositiveOutcome("1.0.0")).resolves.toBe(true);
  });

  it("does not ask twice for the same version", async () => {
    await recordPositiveOutcome("1.0.0");
    await recordPositiveOutcome("1.0.0");
    await markReviewAttempted("1.0.0");

    await expect(recordPositiveOutcome("1.0.0")).resolves.toBe(false);
    await expect(recordPositiveOutcome("1.1.0")).resolves.toBe(true);
  });

  it("recovers from malformed local state", async () => {
    await AsyncStorage.setItem(REVIEW_ELIGIBILITY.storageKey, "not-json");
    await expect(recordPositiveOutcome("1.0.0")).resolves.toBe(false);
  });
});
