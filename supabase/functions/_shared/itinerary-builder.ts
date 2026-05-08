/**
 * itinerary-builder.ts
 * Port TypeScript dell'algoritmo Python in services/itinerary_builder.py
 *
 * Pipeline:
 *   filterAttractions → splitDays → twoOpt → findRestaurantsForDay → generateMapsLink
 */

// ── Tipi ─────────────────────────────────────────────────────────────────────

export interface Attraction {
  id: number;
  name: string;
  name_en?: string | null;
  description?: string;
  description_en?: string | null;
  category_level: number;
  block_id?: number | null;
  zone?: string | null;
  latitude: number;
  longitude: number;
  estimated_visit_time: number;
  tags: string[];
  city: string;
  is_food_spot: boolean;
  food_type?: string | null;
  meal_type?: string | null;
  rating?: number | null;
  attraction_type?: string | null;
  ticket_url?: string | null;
}

export interface Restaurant {
  id: number;
  name: string;
  name_en?: string | null;
  description?: string;
  description_en?: string | null;
  food_type?: string | null;
  rating?: number | null;
  latitude: number;
  longitude: number;
  maps_link: string;
}

export interface Stop extends Attraction {
  type: "attraction" | "free_time";
  meal?: "lunch" | "dinner";
}

export interface ItineraryDay {
  day: number;
  stops: Stop[];
  maps_link: string;
  restaurants: Restaurant[];
}

// ── Costanti ─────────────────────────────────────────────────────────────────

const BACKUP_MAX_KM = 5.0;
const CLUSTER_RADIUS_KM = 1.5;
const MIN_CLUSTER_NEIGHBORS = 2;
const MIN_MINUTES_PER_DAY = 300;   // soglia minima: 5 ore
const MAX_MINUTES_PER_DAY = 420;   // soglia massima: 7 ore
const DEFAULT_MAX_WALK_KM_PER_DAY = 4.0;   // percorso a piedi massimo per giorno
const MAX_MUSEUMS_PER_DAY = 1;
// In modalità esploratore, ogni giorno deve conservare almeno questo numero
// di attrazioni iconiche (category_level === 1) per garantire le tappe principali.
const MIN_ICONIC_PER_EXPLORER_DAY = 2;
// Limiti per giorno in base alla modalità di camminata scelta dall'utente:
//   Rilassato (≤3 km): esattamente 5 attrazioni
//   Bilanciato (≤5 km): da 6 a 8 attrazioni
//   Intenso   (>5 km): da 9 a 10 attrazioni
// I vincoli temporali (MAX_MINUTES_PER_DAY) restano sempre attivi.
function dayLimits(maxWalkKm: number): { min: number; max: number } {
  if (maxWalkKm <= 3) return { min: 5, max: 5 };
  if (maxWalkKm <= 5) return { min: 6, max: 8 };
  return { min: 9, max: 10 };
}

// ── Geo utilities ─────────────────────────────────────────────────────────────

function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371.0;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type GeoPoint = { latitude: number; longitude: number };

function walkingKm(a: GeoPoint, b: GeoPoint): number {
  const straightKm = haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
  return straightKm * walkingDistanceFactor(straightKm);
}

function walkingDistanceFactor(straightKm: number): number {
  if (straightKm > 2) return 1.1;
  if (straightKm > 1) return 1.15;
  if (straightKm > 0.5) return 1.3;
  if (straightKm > 0.3) return 1.4;
  return 1.5;
}

function routeDistance(route: GeoPoint[]): number {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += walkingKm(route[i], route[i + 1]);
  }
  return total;
}

function twoOpt(route: Attraction[]): Attraction[] {
  if (route.length < 4) return route;
  let best = [...route];
  let bestDist = routeDistance(best);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, j + 1).reverse(),
          ...best.slice(j + 1),
        ];
        const dist = routeDistance(candidate);
        if (dist < bestDist - 1e-9) {
          best = candidate;
          bestDist = dist;
          improved = true;
        }
      }
    }
  }
  return best;
}

function optimizedDistance(attractions: Attraction[]): number {
  return routeDistance(twoOpt([...attractions]));
}

function canAddToDay(day: Attraction[], candidate: Attraction, maxWalkKm: number): boolean {
  if (day.some((a) => a.id === candidate.id)) return false;
  const next = [...day, candidate];
  if (next.length > dayLimits(maxWalkKm).max) return false;
  if (dayMinutes(next) > MAX_MINUTES_PER_DAY) return false;
  if (museumCount(next) > MAX_MUSEUMS_PER_DAY) return false;
  return optimizedDistance(next) <= maxWalkKm;
}

function fitsDay(day: Attraction[], maxWalkKm: number): boolean {
  if (day.length > dayLimits(maxWalkKm).max) return false;
  if (dayMinutes(day) > MAX_MINUTES_PER_DAY) return false;
  if (museumCount(day) > MAX_MUSEUMS_PER_DAY) return false;
  return optimizedDistance(day) <= maxWalkKm;
}

function pickRemovalIndex(day: Attraction[]): number {
  const ordered = twoOpt([...day]);
  const currentDistance = routeDistance(ordered);
  const currentMinutes = dayMinutes(day);
  let bestIndex = 0;
  let bestScore = -Infinity;

  for (let i = 0; i < day.length; i++) {
    const candidate = day.filter((_, idx) => idx !== i);
    const distanceGain = currentDistance - optimizedDistance(candidate);
    const minutesGain = currentMinutes - dayMinutes(candidate);
    const museumPenalty = museumCount(day) > MAX_MUSEUMS_PER_DAY && day[i].attraction_type?.toLowerCase() === "museo" ? 1000 : 0;
    const score = museumPenalty + distanceGain * 100 + minutesGain / 10;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

// ── Step 1: filter ────────────────────────────────────────────────────────────

function filterAttractions(
  attractions: Attraction[],
  level: number | number[],
): Attraction[] {
  const levels = Array.isArray(level) ? level : [level];
  const allNonFood = attractions.filter((a) => !a.is_food_spot);

  function neighbors(a: Attraction): number {
    return allNonFood.filter(
      (b) =>
        b.id !== a.id &&
        haversineKm(a.latitude, a.longitude, b.latitude, b.longitude) <=
          CLUSTER_RADIUS_KM,
    ).length;
  }

  return attractions.filter(
    (a) =>
      !a.is_food_spot &&
      levels.includes(a.category_level) &&
      neighbors(a) >= MIN_CLUSTER_NEIGHBORS,
  );
}

function isExplorerLevel(level: number | number[]): boolean {
  const levels = Array.isArray(level) ? level : [level];
  return levels.some((l) => l >= 2);
}

function uniqueById(attractions: Attraction[]): Attraction[] {
  const seen = new Set<number>();
  const result: Attraction[] = [];
  for (const attraction of attractions) {
    if (seen.has(attraction.id)) continue;
    seen.add(attraction.id);
    result.push(attraction);
  }
  return result;
}

// ── Step 2: split into days (block-aware, time-budget) ───────────────────────

function dayMinutes(attractions: Attraction[]): number {
  return attractions.reduce((sum, a) => sum + (a.estimated_visit_time ?? 60), 0);
}

function museumCount(attractions: Attraction[]): number {
  return attractions.filter((a) => a.attraction_type?.toLowerCase() === "museo").length;
}

function splitDays(attractions: Attraction[], numDays: number, maxWalkKm: number): Attraction[][] {
  if (attractions.length === 0) return [];

  const { min: minPerDay, max: maxPerDay } = dayLimits(maxWalkKm);

  const byBlock = new Map<number, Attraction[]>();
  for (const a of attractions) {
    const block = a.block_id ?? 0;
    if (!byBlock.has(block)) byBlock.set(block, []);
    byBlock.get(block)!.push(a);
  }

  const orderedBlocks = Array.from(byBlock.keys()).sort((a, b) => a - b);
  const numBlocks = orderedBlocks.length;
  const days: Attraction[][] = [];
  let currentDay: Attraction[] = [];

  for (let i = 0; i < orderedBlocks.length; i++) {
    const blockAttrs  = byBlock.get(orderedBlocks[i])!;
    const slotsLeft   = numDays - days.length;
    const blocksAfter = numBlocks - i - 1;

    const newCount   = currentDay.length + blockAttrs.length;
    const newMinutes = dayMinutes(currentDay) + dayMinutes(blockAttrs);
    const hitMax     = newCount > maxPerDay || newMinutes > MAX_MINUTES_PER_DAY;
    const metMin     = dayMinutes(currentDay) >= MIN_MINUTES_PER_DAY && currentDay.length >= minPerDay;

    if (currentDay.length > 0 && (hitMax || metMin) && slotsLeft > 1 && blocksAfter > 0) {
      days.push([...currentDay]);
      currentDay = [];
    }

    currentDay.push(...blockAttrs);
  }

  if (currentDay.length > 0 && days.length < numDays) {
    // Cap last day by count AND time (same as intermediate days)
    const capped: Attraction[] = [];
    let mins = 0;
    for (const a of currentDay) {
      const t = a.estimated_visit_time ?? 60;
      if (capped.length >= maxPerDay || mins + t > MAX_MINUTES_PER_DAY) break;
      capped.push(a);
      mins += t;
    }
    if (capped.length > 0) days.push(capped);
  }

  return days.filter((d) => d.length > 0);
}

/**
 * Taglia ogni giorno ai limiti massimi di count e minuti.
 * Gli attrazioni in eccesso vengono scartate qui e recuperate dal backup pool
 * in buildItinerary (non sono in assignedIds, quindi il sweep le include).
 */
function capDaysByLimits(days: Attraction[][], maxWalkKm: number): { days: Attraction[][]; overflow: Attraction[] } {
  const { max: maxPerDay } = dayLimits(maxWalkKm);
  const overflow: Attraction[] = [];
  const capped = days.map((day) => {
    let kept = [...day];

    while (
      kept.length > maxPerDay ||
      dayMinutes(kept) > MAX_MINUTES_PER_DAY ||
      museumCount(kept) > MAX_MUSEUMS_PER_DAY ||
      optimizedDistance(kept) > maxWalkKm
    ) {
      if (kept.length <= 1) break;
      const removeIndex = pickRemovalIndex(kept);
      const [removed] = kept.splice(removeIndex, 1);
      if (removed) overflow.push(removed);
    }

    return twoOpt(kept);
  });

  return { days: capped, overflow };
}

function ensureDayCount(days: Attraction[][], numDays: number): Attraction[][] {
  const result = days.filter((day) => day.length > 0).map((day) => [...day]);
  while (result.length < numDays) {
    let splitIdx = -1;
    for (let i = 0; i < result.length; i++) {
      if (
        result[i].length > 1 &&
        (splitIdx < 0 ||
          result[i].length > result[splitIdx].length ||
          (result[i].length === result[splitIdx].length &&
            dayMinutes(result[i]) > dayMinutes(result[splitIdx])))
      ) {
        splitIdx = i;
      }
    }
    if (splitIdx < 0) break;
    const day = result[splitIdx];
    const cut = Math.max(1, Math.floor(day.length / 2));
    result[splitIdx] = day.slice(0, cut);
    result.splice(splitIdx + 1, 0, day.slice(cut));
  }
  return result.slice(0, numDays);
}

/**
 * Redistribuisce i musei in eccesso (>MAX_MUSEUMS_PER_DAY per giorno).
 * I musei rimossi vengono inseriti in giorni con 0 musei e spazio disponibile.
 * Restituisce anche la lista dei musei non ricollocati (per il backup pool).
 */
function rebalanceMuseums(days: Attraction[][], maxWalkKm: number): { days: Attraction[][]; freed: Attraction[] } {
  const { max: maxPerDay } = dayLimits(maxWalkKm);
  const result: Attraction[][] = days.map((d) => [...d]);
  const overflow: Attraction[] = [];

  // Rimuovi musei in eccesso da ogni giorno
  for (const day of result) {
    let count = 0;
    const keep: Attraction[] = [];
    for (const a of day) {
      if (a.attraction_type?.toLowerCase() === "museo") {
        if (count < MAX_MUSEUMS_PER_DAY) { keep.push(a); count++; }
        else { overflow.push(a); }
      } else {
        keep.push(a);
      }
    }
    day.length = 0;
    day.push(...keep);
  }

  // Prova a inserire i musei in eccesso in giorni che non ne hanno ancora
  const stillFree: Attraction[] = [];
  for (const museum of overflow) {
    let placed = false;
    for (const day of result) {
      if (
        museumCount(day) < MAX_MUSEUMS_PER_DAY &&
        day.length < maxPerDay &&
        dayMinutes(day) + (museum.estimated_visit_time ?? 60) <= MAX_MINUTES_PER_DAY
      ) {
        day.push(museum);
        placed = true;
        break;
      }
    }
    if (!placed) stillFree.push(museum);
  }

  return { days: result, freed: stillFree };
}

// ── Step 2c: fill thin days from backup pool ──────────────────────────────────

function fillThinDays(
  days: Attraction[][],
  backup: Attraction[],
  maxWalkKm: number,
  preferExploration = false,
): { days: Attraction[][]; backup: Attraction[] } {
  const result: Attraction[][] = days.map((d) => [...d]);
  const usedIds = new Set<number>();

  const { min: minPerDay, max: maxPerDay } = dayLimits(maxWalkKm);

  // Un giorno è "completo" quando:
  // - ha raggiunto il cap assoluto (maxPerDay), oppure
  // - è nel range [min, max) e ha già abbastanza minuti (solo se min < max)
  const isDayFull = (d: Attraction[]): boolean => {
    if (d.length >= maxPerDay) return true;
    if (minPerDay < maxPerDay && d.length >= minPerDay && dayMinutes(d) >= MIN_MINUTES_PER_DAY) return true;
    return false;
  };

  for (const day of result) {
    if (day.length === 0 || isDayFull(day)) continue;

    while (!isDayFull(day)) {
      // Anchor = ultimo stop nella rotta 2-opt corrente (non l'ultimo aggiunto)
      const ordered = twoOpt([...day]);
      const anchor = ordered[ordered.length - 1];

      const available = backup
        .filter((a) => !usedIds.has(a.id) && !a.is_food_spot)
        .sort(
          (a, b) => {
            if (preferExploration) {
              const aExploration = a.category_level >= 2 ? 1 : 0;
              const bExploration = b.category_level >= 2 ? 1 : 0;
              if (aExploration !== bExploration) return bExploration - aExploration;
              if (a.category_level !== b.category_level) return b.category_level - a.category_level;
            } else if (a.category_level !== b.category_level) {
              return a.category_level - b.category_level;
            }
            return (
              walkingKm(anchor, a) -
              walkingKm(anchor, b)
            );
          },
        );

      let added = false;
      for (const candidate of available) {
        if (!canAddToDay(day, candidate, maxWalkKm)) continue;
        day.push(candidate);
        usedIds.add(candidate.id);
        added = true;
        break;
      }

      if (!added) break; // nessun candidato disponibile, il giorno non può crescere
    }
  }

  const remaining = backup.filter((a) => !usedIds.has(a.id));
  return { days: result, backup: remaining };
}

function diversifyExplorerDays(
  days: Attraction[][],
  backup: Attraction[],
  maxWalkKm: number,
): { days: Attraction[][]; backup: Attraction[] } {
  const result = days.map((day) => [...day]);
  const usedIds = new Set(result.flat().map((a) => a.id));
  const pool = uniqueById(backup)
    .filter((a) => !usedIds.has(a.id) && !a.is_food_spot && a.category_level >= 2)
    .sort((a, b) => b.category_level - a.category_level);

  const consumeCandidate = (candidate: Attraction) => {
    const idx = pool.findIndex((a) => a.id === candidate.id);
    if (idx >= 0) pool.splice(idx, 1);
    usedIds.add(candidate.id);
  };

  for (const day of result) {
    if (day.length === 0) continue;

    const targetExploratoryStops = day.length >= 5 ? 2 : 1;
    while (
      day.filter((a) => a.category_level >= 2).length < targetExploratoryStops &&
      pool.length > 0
    ) {
      let changed = false;

      for (const candidate of [...pool]) {
        if (canAddToDay(day, candidate, maxWalkKm)) {
          day.push(candidate);
          consumeCandidate(candidate);
          changed = true;
          break;
        }

        // Rimpiazza un'iconica solo se ne restano almeno MIN_ICONIC_PER_EXPLORER_DAY
        const iconicCount = day.filter((a) => a.category_level === 1).length;
        if (iconicCount <= MIN_ICONIC_PER_EXPLORER_DAY) break;

        const replaceable = day
          .map((attraction, index) => ({ attraction, index }))
          .filter(({ attraction }) => attraction.category_level === 1)
          .sort((a, b) =>
            (a.attraction.estimated_visit_time ?? 60) -
            (b.attraction.estimated_visit_time ?? 60),
          );

        for (const { attraction, index } of replaceable) {
          const next = day.map((a, i) => (i === index ? candidate : a));
          if (!fitsDay(next, maxWalkKm)) continue;
          day[index] = candidate;
          consumeCandidate(candidate);
          pool.push(attraction);
          usedIds.delete(attraction.id);
          changed = true;
          break;
        }

        if (changed) break;
      }

      if (!changed) break;
    }
  }

  const remaining = uniqueById([...backup, ...pool]).filter((a) => !usedIds.has(a.id));
  return { days: result, backup: remaining };
}

// ── Step 4: free-time placeholder ────────────────────────────────────────────
// Nota: i pasti non sono inseriti inline negli stops — vengono restituiti
// separatamente tramite findRestaurantsForDay (campo `restaurants` per giorno).

function makeFreeTime(ref: Attraction, minutes = 60): Stop {
  return {
    ...ref,
    id: -1,
    type: "free_time",
    name: "Tempo libero",
    name_en: "Free time",
    description: "Esplora la zona a piedi, siediti in un bar locale o entra in una chiesa aperta.",
    description_en: "Explore the area on foot, sit in a local café or step into an open church.",
    estimated_visit_time: minutes,
    tags: ["relax"],
    category_level: 0,
    is_food_spot: false,
    food_type: null,
    meal_type: null,
    rating: null,
  };
}

// ── Step 4b: 5 ristoranti per giorno (2€ + 2€€ + 1€€€, no ripetizioni) ───────

function toRestaurant(f: Attraction): Restaurant {
  return {
    id: f.id,
    name: f.name,
    name_en: f.name_en,
    description: f.description,
    description_en: f.description_en,
    food_type: f.food_type,
    rating: f.rating,
    latitude: f.latitude,
    longitude: f.longitude,
    // Apre il ristorante per nome su Google Maps (mostra orari, menu, recensioni)
    maps_link: `https://www.google.com/maps/search/${encodeURIComponent(f.name)}/@${f.latitude},${f.longitude},16z`,
  };
}

const SNACK_TYPES = new Set(["street food", "bar", "gelateria", "snack", "bakery", "pasticceria", "caffe", "caffè", "dolci"]);

function isSnackType(foodType?: string | null): boolean {
  return SNACK_TYPES.has(foodType?.toLowerCase() ?? "");
}

function findRestaurantsForDay(
  dayAttractions: Attraction[],
  foodSpots: Attraction[],
  usedIds: Set<number>,
): Restaurant[] {
  if (dayAttractions.length === 0 || foodSpots.length === 0) return [];

  // Centroide del giorno
  const lat = dayAttractions.reduce((s, a) => s + a.latitude, 0) / dayAttractions.length;
  const lon = dayAttractions.reduce((s, a) => s + a.longitude, 0) / dayAttractions.length;

  const byDist = (a: Attraction, b: Attraction) =>
    haversineKm(lat, lon, a.latitude, a.longitude) -
    haversineKm(lat, lon, b.latitude, b.longitude);

  // Disponibili per questo giorno, ordinati per distanza
  const available = foodSpots
    .filter((f) => !usedIds.has(f.id))
    .sort(byDist);

  const snackPool = available.filter((f) => isSnackType(f.food_type));
  const mealPool  = available.filter((f) => !isSnackType(f.food_type));

  // Seleziona 3 spuntini + 5 pasti (se non bastano, completa con l'altro bucket)
  const snacks = snackPool.slice(0, 3);
  const meals  = mealPool.slice(0, 5);

  // Fallback: se gli spuntini sono meno di 3, aggiungi pasti extra
  const shortage = 3 - snacks.length;
  const extraMeals = shortage > 0
    ? mealPool.filter((f) => !meals.some((m) => m.id === f.id)).slice(0, shortage)
    : [];

  const result = [...snacks, ...meals, ...extraMeals]
    .sort(byDist)
    .slice(0, 8);

  for (const f of result) usedIds.add(f.id);

  return result.map(toRestaurant);
}

// ── Step 5: Google Maps link ──────────────────────────────────────────────────

function generateMapsLink(stops: Stop[]): string {
  const waypoints: string[] = [];
  let prevName: string | null = null;
  for (const s of stops) {
    if (s.type === "free_time") continue;
    if (!s.name) continue;
    // Use "Stop Name, City" so Google Maps resolves the correct place and shows the name
    const label = s.city ? `${s.name}, ${s.city}` : s.name;
    if (label !== prevName) {
      waypoints.push(encodeURIComponent(label));
      prevName = label;
    }
  }
  if (waypoints.length === 0) return "";
  return "https://www.google.com/maps/dir/" + waypoints.join("/") + "?travelmode=walking";
}

// ── Entry point ───────────────────────────────────────────────────────────────

export function buildItinerary(
  attractions: Attraction[],
  foodSpots: Attraction[],
  numDays: number,
  level: number | number[],
  maxWalkKm = DEFAULT_MAX_WALK_KM_PER_DAY,
): ItineraryDay[] {
  const explorerMode = isExplorerLevel(level);
  const filtered = filterAttractions(attractions, level);
  if (filtered.length === 0) return [];

  const daysRaw = ensureDayCount(splitDays(filtered, numDays, maxWalkKm), numDays);
  const { days: daysLimited, overflow } = capDaysByLimits(daysRaw, maxWalkKm);
  const { days: daysMuseumBalanced, freed } = rebalanceMuseums(daysLimited, maxWalkKm);
  const { days: daysCapped, overflow: postMuseumOverflow } = capDaysByLimits(daysMuseumBalanced, maxWalkKm);

  // assignedIds esclude gli overflow → il backup sweep li raccoglie automaticamente
  const assignedIds = new Set(daysCapped.flat().map((a) => a.id));
  // I musei liberati da rebalanceMuseums tornano nel backup pool
  let backup: Attraction[] = uniqueById([
    ...overflow,
    ...freed,
    ...postMuseumOverflow,
    ...filtered.filter((a) => !assignedIds.has(a.id)),
    ...(!explorerMode
      ? attractions.filter((a) => !a.is_food_spot && a.category_level === 2 && !assignedIds.has(a.id))
      : []),
  ]);

  const { days: daysDiversified, backup: backupAfterDiversify } = explorerMode
    ? diversifyExplorerDays(daysCapped, backup, maxWalkKm)
    : { days: daysCapped, backup };
  backup = backupAfterDiversify;

  // Fill any day that ended up with too few attractions after museum rebalancing
  const { days: daysFilled, backup: backupAfterFill } = fillThinDays(daysDiversified, backup, maxWalkKm, explorerMode);
  backup = backupAfterFill;

  const daysOrdered = daysFilled.map((day) => twoOpt([...day]));
  const usedBackupIds = new Set<number>();

  // Stops: solo attrazioni + tempo libero (niente pranzo/cena inline)
  const daysWithStops = daysOrdered.map((day) =>
    insertFreeTimeOnly(day, backup, usedBackupIds, maxWalkKm),
  );

  const usedRestaurantIds = new Set<number>();
  return daysWithStops.map((stops, i) => ({
    day: i + 1,
    stops,
    maps_link: generateMapsLink(stops),
    restaurants: findRestaurantsForDay(daysOrdered[i], foodSpots, usedRestaurantIds),
  }));
}

/**
 * Come insertMealStops ma senza i pasti — aggiunge solo il backup/free_time
 * pomeridiano se il giorno ha meno attrazioni del previsto.
 */
function insertFreeTimeOnly(
  day: Attraction[],
  backupAttractions: Attraction[],
  usedBackupIds: Set<number>,
  maxWalkKm: number = BACKUP_MAX_KM,
): Stop[] {
  const n = day.length;
  const morningCount = Math.max(1, Math.ceil((n + 1) / 2));
  const afternoon = day.slice(morningCount);
  const result: Stop[] = day.slice(0, morningCount).map((a) => ({ ...a, type: "attraction" as const }));

  if (afternoon.length > 0) {
    for (const attr of afternoon) {
      result.push({ ...attr, type: "attraction" });
    }
  } else {
    const available = backupAttractions.filter(
      (a) => !usedBackupIds.has(a.id) && !a.is_food_spot,
    );
    if (available.length > 0) {
      const ref = result[result.length - 1];
      const nearest = available.reduce((best, a) => {
        const d = walkingKm(ref, a);
        const bd = walkingKm(ref, best);
        return d < bd ? a : best;
      });
      const dist = walkingKm(ref, nearest);
      if (dist <= maxWalkKm) {
        result.push({ ...nearest, type: "attraction" });
        usedBackupIds.add(nearest.id);
      } else {
        result.push(makeFreeTime(ref));
      }
    } else if (result.length > 0) {
      result.push(makeFreeTime(result[result.length - 1]));
    }
  }

  return result;
}
