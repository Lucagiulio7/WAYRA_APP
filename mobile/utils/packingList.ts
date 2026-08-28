export type PackingClimate = "mild" | "warm" | "cold" | "rainy";
export type PackingTripType = "city" | "beach" | "nature" | "business";
export type PackingCategory = "documents" | "clothing" | "toiletries" | "health" | "tech" | "extras";

export interface PackingItem {
  id: string;
  key?: string;
  category: PackingCategory;
  quantity: number;
  checked: boolean;
  customLabel?: string;
}

export interface PackingListState {
  days: number;
  climate: PackingClimate;
  tripType: PackingTripType;
  items: PackingItem[];
  updatedAt: string;
}

export interface PackingCollectionState {
  version: 2;
  activeKey: string;
  profiles: Record<string, PackingListState>;
  updatedAt: string;
}

type Rule = {
  key: string;
  category: PackingCategory;
  quantity?: (days: number, climate: PackingClimate, tripType: PackingTripType) => number;
  climates?: PackingClimate[];
  tripTypes?: PackingTripType[];
  when?: (days: number, climate: PackingClimate, tripType: PackingTripType) => boolean;
};

const underwearQuantity = (days: number) => days <= 7
  ? days + 1
  : Math.min(10, 8 + Math.ceil((days - 7) / 7));

const socksQuantity = (days: number, _climate: PackingClimate, tripType: PackingTripType) => {
  if (tripType === "beach") return Math.min(7, Math.max(2, Math.ceil(days / 2)));
  return underwearQuantity(days);
};

const topsQuantity = (days: number, climate: PackingClimate, tripType: PackingTripType) => {
  const changesEvery = climate === "warm" || tripType === "beach" ? 1.5 : 2;
  return Math.min(7, Math.max(days === 1 ? 1 : 2, Math.ceil(days / changesEvery)));
};

const bottomsQuantity = (days: number, climate: PackingClimate, tripType: PackingTripType) => {
  if (days === 1) return 1;
  const changesEvery = climate === "warm" || tripType === "beach" ? 2.5 : 3;
  return Math.min(5, Math.max(2, Math.ceil(days / changesEvery)));
};

const travelBottleQuantity = (days: number) => days <= 10 ? 1 : days <= 21 ? 2 : 3;
const sunscreenQuantity = (days: number) => days <= 7 ? 1 : days <= 14 ? 2 : 3;
const swimwearQuantity = (days: number) => days === 1 ? 1 : days <= 4 ? 2 : days <= 8 ? 3 : 4;

const RULES: Rule[] = [
  { key: "identityDocument", category: "documents" },
  { key: "tickets", category: "documents" },
  { key: "wallet", category: "documents" },
  { key: "insurance", category: "documents" },
  { key: "healthCard", category: "documents" },
  { key: "underwear", category: "clothing", quantity: underwearQuantity },
  { key: "socks", category: "clothing", quantity: socksQuantity },
  { key: "tops", category: "clothing", quantity: topsQuantity },
  { key: "bottoms", category: "clothing", quantity: bottomsQuantity },
  { key: "sleepwear", category: "clothing", quantity: (days) => days >= 7 ? 2 : 1 },
  { key: "comfortableShoes", category: "clothing", quantity: (days, _climate, tripType) => days >= 7 && ["city", "business"].includes(tripType) ? 2 : 1 },
  { key: "lightJacket", category: "clothing", climates: ["mild"] },
  { key: "rainJacket", category: "clothing", climates: ["rainy"] },
  { key: "warmCoat", category: "clothing", climates: ["cold"] },
  { key: "sweaters", category: "clothing", quantity: (days) => Math.min(4, Math.max(2, Math.ceil(days / 3))), climates: ["cold"] },
  { key: "thermalLayers", category: "clothing", quantity: (days) => Math.min(3, Math.max(1, Math.ceil(days / 3))), climates: ["cold"] },
  { key: "scarfGloves", category: "clothing", climates: ["cold"] },
  { key: "sunHat", category: "clothing", climates: ["warm"] },
  { key: "swimwear", category: "clothing", quantity: swimwearQuantity, tripTypes: ["beach"] },
  { key: "flipFlops", category: "clothing", tripTypes: ["beach"] },
  { key: "formalOutfit", category: "clothing", quantity: (days) => Math.min(4, Math.max(1, Math.ceil(days / 3))), tripTypes: ["business"] },
  { key: "toothbrush", category: "toiletries" },
  { key: "toothpaste", category: "toiletries", quantity: travelBottleQuantity },
  { key: "deodorant", category: "toiletries", quantity: (days) => days > 14 ? 2 : 1 },
  { key: "shampoo", category: "toiletries", quantity: travelBottleQuantity },
  { key: "showerGel", category: "toiletries", quantity: travelBottleQuantity },
  { key: "conditioner", category: "toiletries", quantity: travelBottleQuantity },
  { key: "hairbrush", category: "toiletries" },
  { key: "razor", category: "toiletries" },
  { key: "moisturizer", category: "toiletries" },
  { key: "medicines", category: "health" },
  { key: "plastersDisinfectant", category: "health" },
  { key: "painReliever", category: "health" },
  { key: "sunscreen", category: "health", quantity: sunscreenQuantity, when: (_days, climate, tripType) => climate === "warm" || tripType === "beach" },
  { key: "afterSun", category: "health", when: (_days, climate, tripType) => climate === "warm" && tripType === "beach" },
  { key: "phone", category: "tech" },
  { key: "phoneCharger", category: "tech" },
  { key: "powerBank", category: "tech" },
  { key: "powerAdapter", category: "tech" },
  { key: "headphones", category: "tech" },
  { key: "umbrella", category: "extras", climates: ["rainy"] },
  { key: "sunglasses", category: "extras", when: (_days, climate, tripType) => climate === "warm" || tripType === "beach" },
  { key: "waterBottle", category: "extras", tripTypes: ["city", "nature"] },
  { key: "daypack", category: "extras", tripTypes: ["city", "nature"] },
  { key: "beachTowel", category: "extras", tripTypes: ["beach"] },
  { key: "hikingShoes", category: "extras", tripTypes: ["nature"] },
  { key: "insectRepellent", category: "extras", when: (_days, climate, tripType) => (tripType === "nature" && climate !== "cold") || (tripType === "beach" && climate === "warm") },
  { key: "backpackRainCover", category: "extras", climates: ["rainy"], tripTypes: ["nature"] },
  { key: "laundryDetergent", category: "extras", when: (days) => days >= 8 },
  { key: "laundryBag", category: "extras" },
  { key: "workDocuments", category: "extras", tripTypes: ["business"] },
  { key: "laptop", category: "tech", tripTypes: ["business"] },
  { key: "laptopCharger", category: "tech", tripTypes: ["business"] },
];

export function normalizePackingDays(days: number): number {
  if (!Number.isFinite(days)) return 3;
  return Math.min(30, Math.max(1, Math.round(days)));
}

export function packingProfileKey(days: number, climate: PackingClimate, tripType: PackingTripType): string {
  return `${normalizePackingDays(days)}:${climate}:${tripType}`;
}

export function getPackingProfile(
  profiles: Record<string, PackingListState>,
  days: number,
  climate: PackingClimate,
  tripType: PackingTripType,
): PackingListState | undefined {
  return profiles[packingProfileKey(days, climate, tripType)];
}

export function upsertPackingProfile(
  profiles: Record<string, PackingListState>,
  profile: PackingListState,
): Record<string, PackingListState> {
  return {
    ...profiles,
    [packingProfileKey(profile.days, profile.climate, profile.tripType)]: profile,
  };
}

export function generatePackingItems(
  days: number,
  climate: PackingClimate,
  tripType: PackingTripType,
  previous: PackingItem[] = [],
): PackingItem[] {
  const normalizedDays = normalizePackingDays(days);
  const previousById = new Map(previous.map((item) => [item.id, item]));
  const generated = RULES.filter((rule) => !rule.climates || rule.climates.includes(climate))
    .filter((rule) => !rule.tripTypes || rule.tripTypes.includes(tripType))
    .filter((rule) => !rule.when || rule.when(normalizedDays, climate, tripType))
    .map((rule) => {
      const id = `generated:${rule.key}`;
      return {
        id,
        key: rule.key,
        category: rule.category,
        quantity: rule.quantity ? rule.quantity(normalizedDays, climate, tripType) : 1,
        checked: previousById.get(id)?.checked ?? false,
      } satisfies PackingItem;
    });

  return [...generated, ...previous.filter((item) => Boolean(item.customLabel))];
}

export function packingProgress(items: PackingItem[]): { checked: number; total: number; percentage: number } {
  const total = items.length;
  const checked = items.filter((item) => item.checked).length;
  return { checked, total, percentage: total === 0 ? 0 : Math.round((checked / total) * 100) };
}
