export type GeoPoint = { latitude: number; longitude: number };

export type MobilityPoint = GeoPoint & {
  id?: number;
  name?: string;
  name_en?: string | null;
  attraction_type?: string | null;
  tags?: string[];
};

export type RouteTransfer = {
  from: MobilityPoint;
  to: MobilityPoint;
  distanceKm: number;
  mode: "public_transport" | "ferry";
};

export type RouteMobilityPlan = {
  walkingKm: number;
  walkingGroups: MobilityPoint[][];
  transfers: RouteTransfer[];
};

export function isMuseumType(type?: string | null): boolean {
  return /(^|\s)muse[ou](\s|$)/i.test((type ?? "").trim());
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const earthRadiusKm = 6371;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const deltaLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const deltaLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const value = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function walkingDistanceFactor(straightKm: number): number {
  if (straightKm > 2) return 1.1;
  if (straightKm > 1) return 1.15;
  if (straightKm > 0.5) return 1.3;
  if (straightKm > 0.3) return 1.4;
  return 1.5;
}

export function walkingKm(a: GeoPoint, b: GeoPoint): number {
  const straightKm = haversineKm(a, b);
  return straightKm * walkingDistanceFactor(straightKm);
}

export function routeWalkingKm(stops: GeoPoint[]): number {
  let total = 0;
  for (let index = 0; index < stops.length - 1; index += 1) {
    total += walkingKm(stops[index], stops[index + 1]);
  }
  return total;
}

export function preferredWalkingLegKm(maxWalkKm: number): number {
  if (maxWalkKm <= 3) return 1.75;
  if (maxWalkKm <= 5) return 2.25;
  return 2.75;
}

function transferMode(a: MobilityPoint, b: MobilityPoint): RouteTransfer["mode"] {
  const text = [
    a.name,
    a.name_en,
    a.attraction_type,
    ...(a.tags ?? []),
    b.name,
    b.name_en,
    b.attraction_type,
    ...(b.tags ?? []),
  ].filter(Boolean).join(" ").toLocaleLowerCase();
  return /suomenlinna|ferry|traghetto|island|isola|île|isla/.test(text)
    ? "ferry"
    : "public_transport";
}

export function analyzeRouteMobility(
  stops: MobilityPoint[],
  maxWalkKm: number,
): RouteMobilityPlan {
  if (stops.length === 0) return { walkingKm: 0, walkingGroups: [], transfers: [] };

  const threshold = preferredWalkingLegKm(maxWalkKm);
  const walkingGroups: MobilityPoint[][] = [[stops[0]]];
  const transfers: RouteTransfer[] = [];
  let walkingTotal = 0;

  for (let index = 0; index < stops.length - 1; index += 1) {
    const from = stops[index];
    const to = stops[index + 1];
    const distanceKm = walkingKm(from, to);
    if (distanceKm > threshold) {
      transfers.push({ from, to, distanceKm, mode: transferMode(from, to) });
      walkingGroups.push([to]);
    } else {
      walkingTotal += distanceKm;
      walkingGroups[walkingGroups.length - 1].push(to);
    }
  }

  return {
    walkingKm: walkingTotal,
    walkingGroups: walkingGroups.filter((group) => group.length > 0),
    transfers,
  };
}
