jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  firstVisitGuideKey,
  hasCompletedFirstVisitGuide,
  markFirstVisitGuideCompleted,
  resetFirstVisitGuide,
} from "@/services/firstVisitGuideStorage";

describe("firstVisitGuideStorage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("considera nuova una guida mai completata", async () => {
    await expect(hasCompletedFirstVisitGuide("home-v1")).resolves.toBe(false);
  });

  it("ricorda il completamento per la singola sezione", async () => {
    await markFirstVisitGuideCompleted("home-v1");

    await expect(hasCompletedFirstVisitGuide("home-v1")).resolves.toBe(true);
    await expect(hasCompletedFirstVisitGuide("packing-v1")).resolves.toBe(false);
  });

  it("puo azzerare una guida senza toccare le altre", async () => {
    await markFirstVisitGuideCompleted("home-v1");
    await markFirstVisitGuideCompleted("packing-v1");
    await resetFirstVisitGuide("home-v1");

    await expect(hasCompletedFirstVisitGuide("home-v1")).resolves.toBe(false);
    await expect(hasCompletedFirstVisitGuide("packing-v1")).resolves.toBe(true);
  });

  it("usa chiavi versionate e isolate", () => {
    expect(firstVisitGuideKey("home-v1")).toBe("urveya_first_visit_guide_v1:home-v1");
  });
});
