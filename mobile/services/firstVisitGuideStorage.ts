import AsyncStorage from "@react-native-async-storage/async-storage";

const GUIDE_PREFIX = "urveya_first_visit_guide_v1:";

export function firstVisitGuideKey(guideId: string): string {
  return `${GUIDE_PREFIX}${guideId}`;
}

export async function hasCompletedFirstVisitGuide(guideId: string): Promise<boolean> {
  return (await AsyncStorage.getItem(firstVisitGuideKey(guideId))) === "completed";
}

export async function markFirstVisitGuideCompleted(guideId: string): Promise<void> {
  await AsyncStorage.setItem(firstVisitGuideKey(guideId), "completed");
}

export async function resetFirstVisitGuide(guideId: string): Promise<void> {
  await AsyncStorage.removeItem(firstVisitGuideKey(guideId));
}

