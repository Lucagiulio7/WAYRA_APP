import {
  generatePackingItems,
  getPackingProfile,
  normalizePackingDays,
  packingProgress,
  packingProfileKey,
  PackingItem,
  PackingListState,
  upsertPackingProfile,
} from "@/utils/packingList";

describe("packing list", () => {
  it("uses an independent key for every duration, climate and trip combination", () => {
    expect(packingProfileKey(7, "warm", "beach")).toBe("7:warm:beach");
    expect(packingProfileKey(7, "warm", "city")).not.toBe(packingProfileKey(7, "warm", "beach"));
    expect(packingProfileKey(8, "warm", "beach")).not.toBe(packingProfileKey(7, "warm", "beach"));
    expect(packingProfileKey(7, "cold", "beach")).not.toBe(packingProfileKey(7, "warm", "beach"));
  });

  it("restores an edited list only for its exact combination", () => {
    const beachItems = generatePackingItems(7, "warm", "beach");
    const editedBeachItems = beachItems
      .filter((item) => item.key !== "afterSun")
      .map((item) => item.key === "swimwear" ? { ...item, quantity: 5, checked: true } : item);
    const beachProfile: PackingListState = {
      days: 7,
      climate: "warm",
      tripType: "beach",
      items: editedBeachItems,
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const cityProfile: PackingListState = {
      days: 7,
      climate: "warm",
      tripType: "city",
      items: generatePackingItems(7, "warm", "city"),
      updatedAt: "2026-01-02T00:00:00.000Z",
    };

    let profiles = upsertPackingProfile({}, beachProfile);
    profiles = upsertPackingProfile(profiles, cityProfile);

    const restored = getPackingProfile(profiles, 7, "warm", "beach");
    expect(restored?.items.find((item) => item.key === "swimwear")).toMatchObject({ quantity: 5, checked: true });
    expect(restored?.items.some((item) => item.key === "afterSun")).toBe(false);
    expect(getPackingProfile(profiles, 7, "warm", "city")?.items).toEqual(cityProfile.items);
    expect(getPackingProfile(profiles, 8, "warm", "beach")).toBeUndefined();
  });

  it("normalizes duration and scales clothing quantities", () => {
    expect(normalizePackingDays(0)).toBe(1);
    expect(normalizePackingDays(45)).toBe(30);
    expect(normalizePackingDays(Number.NaN)).toBe(3);

    const items = generatePackingItems(7, "mild", "city");
    expect(items.find((item) => item.key === "underwear")?.quantity).toBe(8);
    expect(items.find((item) => item.key === "tops")?.quantity).toBe(4);
    expect(items.find((item) => item.key === "bottoms")?.quantity).toBe(3);
  });

  it("adds only the suggestions matching climate and trip type", () => {
    const beach = generatePackingItems(4, "warm", "beach");
    expect(beach.some((item) => item.key === "swimwear")).toBe(true);
    expect(beach.some((item) => item.key === "sunscreen")).toBe(true);
    expect(beach.some((item) => item.key === "warmCoat")).toBe(false);

    const coldNature = generatePackingItems(4, "cold", "nature");
    expect(coldNature.some((item) => item.key === "warmCoat")).toBe(true);
    expect(coldNature.some((item) => item.key === "hikingShoes")).toBe(true);
    expect(coldNature.some((item) => item.key === "thermalLayers")).toBe(true);
    expect(coldNature.some((item) => item.key === "insectRepellent")).toBe(false);
    expect(coldNature.some((item) => item.key === "beachTowel")).toBe(false);

    const rainyNature = generatePackingItems(4, "rainy", "nature");
    expect(rainyNature.some((item) => item.key === "backpackRainCover")).toBe(true);
    expect(rainyNature.some((item) => item.key === "insectRepellent")).toBe(true);
  });

  it("scales a one-week beach trip realistically", () => {
    const items = generatePackingItems(7, "warm", "beach");
    expect(items.find((item) => item.key === "swimwear")?.quantity).toBe(3);
    expect(items.find((item) => item.key === "tops")?.quantity).toBe(5);
    expect(items.find((item) => item.key === "bottoms")?.quantity).toBe(3);
    expect(items.find((item) => item.key === "socks")?.quantity).toBe(4);
    expect(items.find((item) => item.key === "sunscreen")?.quantity).toBe(1);
    expect(items.some((item) => item.key === "afterSun")).toBe(true);
    expect(items.some((item) => item.key === "sunglasses")).toBe(true);
  });

  it("assumes laundry on long trips instead of scaling daily clothes forever", () => {
    const twoWeeks = generatePackingItems(14, "mild", "city");
    expect(twoWeeks.find((item) => item.key === "underwear")?.quantity).toBe(9);
    expect(twoWeeks.find((item) => item.key === "tops")?.quantity).toBe(7);
    expect(twoWeeks.find((item) => item.key === "sleepwear")?.quantity).toBe(2);
    expect(twoWeeks.some((item) => item.key === "laundryDetergent")).toBe(true);

    const month = generatePackingItems(30, "warm", "beach");
    expect(month.find((item) => item.key === "underwear")?.quantity).toBe(10);
    expect(month.find((item) => item.key === "swimwear")?.quantity).toBe(4);
    expect(month.find((item) => item.key === "sunscreen")?.quantity).toBe(3);
    expect(month.find((item) => item.key === "shampoo")?.quantity).toBe(3);
  });

  it("produces valid unique suggestions for every climate and trip combination", () => {
    const climates = ["mild", "warm", "cold", "rainy"] as const;
    const tripTypes = ["city", "beach", "nature", "business"] as const;
    for (const climate of climates) {
      for (const tripType of tripTypes) {
        const items = generatePackingItems(7, climate, tripType);
        expect(items.length).toBeGreaterThan(20);
        expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
        expect(items.every((item) => Number.isInteger(item.quantity) && item.quantity >= 1)).toBe(true);
      }
    }
  });

  it("uses concrete toiletries instead of generic kits", () => {
    const items = generatePackingItems(3, "mild", "city");
    expect(items.some((item) => item.key === "shampoo")).toBe(true);
    expect(items.some((item) => item.key === "showerGel")).toBe(true);
    expect(items.some((item) => item.key === "conditioner")).toBe(true);
    expect(items.some((item) => item.key === "showerKit")).toBe(false);
    expect(items.some((item) => item.key === "personalCare")).toBe(false);
  });

  it("keeps compatible checks and custom items when suggestions change", () => {
    const custom: PackingItem = {
      id: "custom:1",
      category: "extras",
      quantity: 1,
      checked: true,
      customLabel: "Libro",
    };
    const previous = generatePackingItems(3, "mild", "city");
    previous[0] = { ...previous[0], checked: true };

    const updated = generatePackingItems(5, "rainy", "city", [...previous, custom]);
    expect(updated.find((item) => item.id === previous[0].id)?.checked).toBe(true);
    expect(updated.find((item) => item.id === custom.id)).toEqual(custom);
    expect(updated.some((item) => item.key === "umbrella")).toBe(true);
  });

  it("calculates completion without dividing by zero", () => {
    expect(packingProgress([])).toEqual({ checked: 0, total: 0, percentage: 0 });
    expect(packingProgress([
      { id: "1", category: "extras", quantity: 1, checked: true },
      { id: "2", category: "extras", quantity: 1, checked: false },
    ])).toEqual({ checked: 1, total: 2, percentage: 50 });
  });
});
