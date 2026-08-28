import type { BuilderAttraction } from "@/hooks/useAttractions";
import type { DayPlan, SlotData } from "@/store/builderStore";
import { readWithBackup, removeResilientValue, writeWithBackup } from "@/services/resilientStorage";

const PRIMARY_KEY = "wayra_manual_builder_draft_v1";
const BACKUP_KEY = "wayra_manual_builder_draft_backup_v1";

export interface ManualBuilderDraft {
  version: 1;
  city: string;
  numDays: number;
  expandedDay: number;
  updatedAt: string;
  days: DayPlan[];
}

function validAttraction(value: unknown): value is BuilderAttraction {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<BuilderAttraction>;
  return typeof item.id === "number" && Number.isFinite(item.id)
    && typeof item.name === "string" && Boolean(item.name.trim())
    && typeof item.latitude === "number" && Number.isFinite(item.latitude)
    && typeof item.longitude === "number" && Number.isFinite(item.longitude);
}

function validSlot(value: unknown): value is SlotData {
  if (!value || typeof value !== "object") return false;
  const slot = value as Partial<SlotData>;
  return typeof slot.id === "string" && Boolean(slot.id)
    && (slot.kind === "attraction" || slot.kind === "meal")
    && (slot.attraction === null || validAttraction(slot.attraction))
    && (slot.note === undefined || typeof slot.note === "string");
}

function decode(raw: string): ManualBuilderDraft | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const draft = value as Partial<ManualBuilderDraft>;
    if (draft.version !== 1 || typeof draft.city !== "string" || !draft.city) return null;
    if (!Number.isInteger(draft.numDays) || (draft.numDays ?? 0) < 1 || !Array.isArray(draft.days)) return null;
    if (draft.days.length !== draft.numDays) return null;
    const daysValid = draft.days.every((day, index) => day && typeof day === "object"
      && day.day === index + 1 && Array.isArray(day.slots) && day.slots.every(validSlot));
    if (!daysValid) return null;
    return {
      version: 1,
      city: draft.city.trim().toLowerCase(),
      numDays: draft.numDays,
      expandedDay: Math.min(Math.max(1, Number(draft.expandedDay) || 1), draft.numDays),
      updatedAt: typeof draft.updatedAt === "string" ? draft.updatedAt : new Date(0).toISOString(),
      days: draft.days,
    };
  } catch {
    return null;
  }
}

export async function loadManualBuilderDraft(city: string, numDays: number): Promise<ManualBuilderDraft | null> {
  const draft = await readWithBackup(PRIMARY_KEY, BACKUP_KEY, decode);
  return draft?.city === city.trim().toLowerCase() && draft.numDays === numDays ? draft : null;
}

export function saveManualBuilderDraft(draft: ManualBuilderDraft): Promise<void> {
  return writeWithBackup(PRIMARY_KEY, BACKUP_KEY, JSON.stringify(draft), decode);
}

export function removeManualBuilderDraft(): Promise<void> {
  return removeResilientValue(PRIMARY_KEY, BACKUP_KEY);
}
