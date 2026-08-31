jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  accommodationKey,
  loadTripAccommodation,
  removeTripAccommodation,
  saveTripAccommodation,
} from "@/services/accommodationStorage";

describe("trip accommodation storage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("keeps accommodation separate by city and trip date", async () => {
    await saveTripAccommodation({
      city: " Roma ",
      startDate: "2026-10-01",
      name: " Hotel Centro ",
      address: " Via del Corso 1 ",
      latitude: 41.9028,
      longitude: 12.4964,
      updatedAt: "2026-08-31T10:00:00.000Z",
    });

    await expect(loadTripAccommodation("roma", "2026-10-01")).resolves.toMatchObject({
      city: "roma",
      name: "Hotel Centro",
      address: "Via del Corso 1",
    });
    await expect(loadTripAccommodation("roma", "2026-10-02")).resolves.toBeNull();
    await expect(loadTripAccommodation("parigi", "2026-10-01")).resolves.toBeNull();
  });

  it("removes only the selected trip accommodation", async () => {
    const base = { city: "roma", address: "Via Roma 1", updatedAt: "2026-08-31T10:00:00.000Z" };
    await saveTripAccommodation({ ...base, startDate: "2026-10-01" });
    await saveTripAccommodation({ ...base, startDate: "2026-11-01" });

    await removeTripAccommodation("roma", "2026-10-01");

    await expect(loadTripAccommodation("roma", "2026-10-01")).resolves.toBeNull();
    await expect(loadTripAccommodation("roma", "2026-11-01")).resolves.not.toBeNull();
  });

  it("recovers from malformed or invalid local content", async () => {
    await AsyncStorage.setItem("urveya_trip_accommodations_v1", JSON.stringify({
      [accommodationKey("roma")]: { city: "roma", address: "", updatedAt: "bad" },
    }));

    await expect(loadTripAccommodation("roma")).resolves.toBeNull();
  });
});
