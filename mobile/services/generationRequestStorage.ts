import type { BundledGenerateParams } from "@/services/bundledItinerary";
import { readWithBackup, removeResilientValue, writeWithBackup } from "@/services/resilientStorage";

const PRIMARY_KEY = "wayra_generation_request_v1";
const BACKUP_KEY = "wayra_generation_request_backup_v1";
const MAX_AGE_MS = 30 * 60 * 1000;

export interface GenerationRequest {
  version: 1;
  id: string;
  createdAt: string;
  params: BundledGenerateParams;
}

function decode(raw: string): GenerationRequest | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const request = value as Partial<GenerationRequest>;
    const params = request.params as Partial<BundledGenerateParams> | undefined;
    if (request.version !== 1 || typeof request.id !== "string" || !request.id) return null;
    if (typeof request.createdAt !== "string" || !Number.isFinite(Date.parse(request.createdAt))) return null;
    if (!params || typeof params.city !== "string" || !params.city.trim()) return null;
    if (!Number.isInteger(params.num_days) || (params.num_days ?? 0) < 1 || (params.num_days ?? 0) > 15) return null;
    if (params.level !== 1 && params.level !== "mix") return null;
    if (params.max_walk_km !== undefined && (!Number.isFinite(params.max_walk_km) || params.max_walk_km < 1)) return null;
    return request as GenerationRequest;
  } catch {
    return null;
  }
}

export function saveGenerationRequest(request: GenerationRequest): Promise<void> {
  return writeWithBackup(PRIMARY_KEY, BACKUP_KEY, JSON.stringify(request), decode);
}

export async function loadGenerationRequest(): Promise<GenerationRequest | null> {
  const request = await readWithBackup(PRIMARY_KEY, BACKUP_KEY, decode);
  if (!request) return null;
  if (Date.now() - Date.parse(request.createdAt) > MAX_AGE_MS) {
    await clearGenerationRequest();
    return null;
  }
  return request;
}

export function clearGenerationRequest(): Promise<void> {
  return removeResilientValue(PRIMARY_KEY, BACKUP_KEY);
}

export function createGenerationRequest(params: BundledGenerateParams): GenerationRequest {
  return {
    version: 1,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    params,
  };
}
