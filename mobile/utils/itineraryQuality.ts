import type { BuilderAttraction } from "@/hooks/useAttractions";
import type {
  Itinerary,
  ItineraryDay,
  ItineraryQuality,
  ItineraryQualityIssue,
  Stop,
} from "@/types";
import {
  activityMinutes,
  attractionStops,
  getEffortProfile,
  MAX_MUSEUMS_PER_DAY,
  museumCount,
} from "@/utils/itineraryRules";
import {
  buildMapsLink,
  builderToStop,
  twoOptStops,
} from "@/utils/itineraryEditor";
import { analyzeRouteMobility } from "@/utils/routeMetrics";

const MINIMUM_MINUTES_TOLERANCE = 10;

function levelValues(itinerary: Itinerary): number[] {
  return Array.isArray(itinerary.level) ? itinerary.level : [itinerary.level];
}

function requiredMustSeeStops(catalogStops: Stop[]): Stop[] {
  return catalogStops
    .filter((stop) => stop.must_see)
    .sort((a, b) => (a.must_see_rank ?? 999) - (b.must_see_rank ?? 999))
    .slice(0, 1);
}

function stopQuality(stop: Stop, itinerary: Itinerary): number {
  const levels = levelValues(itinerary);
  const category = stop.category_level ?? 3;
  const levelScore = levels.length === 1 && levels[0] === 1
    ? ({ 1: 120, 2: 55, 3: 25 }[category] ?? 0)
    : ({ 1: 75, 2: 115, 3: 95 }[category] ?? 0);
  const mustSeeScore = stop.must_see
    ? 350 - Math.min(stop.must_see_rank ?? 99, 40) * 5
    : 0;
  return levelScore + mustSeeScore + Math.min(stop.estimated_visit_time ?? 60, 120) / 20;
}

function optimizeStops(stops: Stop[]): Stop[] {
  const attractions = twoOptStops(attractionStops(stops));
  const otherStops = stops.filter((stop) => stop.type !== "attraction");
  return otherStops.length === 0 ? attractions : [...attractions, ...otherStops];
}

function routeMobility(stops: Stop[], maxWalkKm: number) {
  return analyzeRouteMobility(attractionStops(optimizeStops(stops)), maxWalkKm);
}

function mobilityCost(stops: Stop[], maxWalkKm: number): number {
  const mobility = routeMobility(stops, maxWalkKm);
  return mobility.walkingKm + mobility.transfers.length * maxWalkKm;
}

function hardOverflow(stops: Stop[], maxWalkKm: number): number {
  const profile = getEffortProfile(maxWalkKm);
  const mobility = routeMobility(stops, maxWalkKm);
  return Math.max(0, attractionStops(stops).length - profile.maxAttractions) * 1000
    + Math.max(0, activityMinutes(stops) - profile.maxMinutes) * 10
    + Math.max(0, museumCount(stops) - MAX_MUSEUMS_PER_DAY) * 1000
    + Math.max(0, mobility.walkingKm - maxWalkKm) * 1000
    + Math.max(0, mobility.transfers.length - 1) * 1000;
}

function fits(stops: Stop[], maxWalkKm: number): boolean {
  return hardOverflow(stops, maxWalkKm) <= 0.0001;
}

function minimumStopsForDay(day: ItineraryDay, profileMinimum: number): number {
  return day.day_type === "excursion"
    ? Math.max(2, profileMinimum - 2)
    : profileMinimum;
}

function minimumMinutesForDay(day: ItineraryDay, profileMinimum: number): number {
  // A remote excursion spends a meaningful part of the day on the transfer.
  // Keep a real activity floor without pretending that travel time is a visit.
  return day.day_type === "excursion"
    ? Math.max(120, profileMinimum - 120)
    : profileMinimum;
}

function softDeficit(day: ItineraryDay, stops: Stop[], maxWalkKm: number): number {
  const profile = getEffortProfile(maxWalkKm);
  const missingStops = Math.max(0, minimumStopsForDay(day, profile.minAttractions) - attractionStops(stops).length);
  const missingMinutes = Math.max(
    0,
    minimumMinutesForDay(day, profile.minMinutes)
      - MINIMUM_MINUTES_TOLERANCE
      - activityMinutes(stops),
  );
  return missingStops * 120 + missingMinutes;
}

function rebalanceDays(
  sourceDays: ItineraryDay[],
  maxWalkKm: number,
): { days: ItineraryDay[]; adjusted: boolean } {
  const days = sourceDays.map((day) => ({ ...day, stops: optimizeStops(day.stops) }));
  let adjusted = false;
  const recipientIndexes = days
    .map((day, index) => ({ index, deficit: softDeficit(day, day.stops, maxWalkKm) }))
    .filter((entry) => entry.deficit > 0)
    .sort((a, b) => b.deficit - a.deficit);

  for (const recipient of recipientIndexes) {
    for (let move = 0; move < 3; move += 1) {
      const recipientDay = days[recipient.index];
      const recipientStops = attractionStops(recipientDay.stops);
      if (softDeficit(recipientDay, recipientStops, maxWalkKm) <= 0) break;
      let best: {
        donorIndex: number;
        donorStops: Stop[];
        recipientStops: Stop[];
        improvement: number;
        walkingCost: number;
      } | null = null;

      for (let donorIndex = 0; donorIndex < days.length; donorIndex += 1) {
        if (donorIndex === recipient.index) continue;
        const donorDay = days[donorIndex];
        const donorStops = attractionStops(donorDay.stops);
        const before = softDeficit(recipientDay, recipientStops, maxWalkKm)
          + softDeficit(donorDay, donorStops, maxWalkKm);

        for (const candidate of donorStops) {
          const nextDonor = optimizeStops(donorStops.filter((stop) => stop.id !== candidate.id));
          const nextRecipient = optimizeStops([...recipientStops, candidate]);
          if (!nextDonor.length || !fits(nextDonor, maxWalkKm) || !fits(nextRecipient, maxWalkKm)) continue;
          const after = softDeficit(recipientDay, nextRecipient, maxWalkKm)
            + softDeficit(donorDay, nextDonor, maxWalkKm);
          const improvement = before - after;
          if (improvement <= 0) continue;
          const walkingCost = mobilityCost(nextDonor, maxWalkKm)
            + mobilityCost(nextRecipient, maxWalkKm);
          if (
            !best
            || improvement > best.improvement
            || (improvement === best.improvement && walkingCost < best.walkingCost)
          ) {
            best = {
              donorIndex,
              donorStops: nextDonor,
              recipientStops: nextRecipient,
              improvement,
              walkingCost,
            };
          }
        }
      }

      if (!best) break;
      days[best.donorIndex] = { ...days[best.donorIndex], stops: best.donorStops };
      days[recipient.index] = { ...days[recipient.index], stops: best.recipientStops };
      adjusted = true;
    }
  }

  return { days, adjusted };
}

function capDay(stops: Stop[], itinerary: Itinerary, maxWalkKm: number): { stops: Stop[]; adjusted: boolean } {
  let result = optimizeStops(stops);
  let adjusted = false;

  while (hardOverflow(result, maxWalkKm) > 0.0001 && attractionStops(result).length > 1) {
    const attractions = attractionStops(result);
    const options = attractions.map((removed) => {
      const projected = optimizeStops(result.filter(
        (stop) => !(stop.type === "attraction" && stop.id === removed.id),
      ));
      const mustSeePenalty = removed.must_see ? 100000 : 0;
      return {
        removed,
        projected,
        score: hardOverflow(projected, maxWalkKm) * 100000
          + mustSeePenalty
          + stopQuality(removed, itinerary) * 100
          + mobilityCost(projected, maxWalkKm),
      };
    });
    const best = options.sort((a, b) => a.score - b.score)[0];
    if (!best || best.projected.length === result.length) break;
    result = best.projected;
    adjusted = true;
  }

  return { stops: result, adjusted };
}

function candidateScore(
  dayStops: Stop[],
  candidate: Stop,
  itinerary: Itinerary,
  maxWalkKm: number,
): number {
  const profile = getEffortProfile(maxWalkKm);
  const projected = optimizeStops([...dayStops, candidate]);
  const distanceIncrease = mobilityCost(projected, maxWalkKm)
    - mobilityCost(dayStops, maxWalkKm);
  const targetGap = Math.abs(profile.targetMinutes - activityMinutes(projected));
  return distanceIncrease * 1000
    + targetGap
    - stopQuality(candidate, itinerary) * 20
    - (candidate.must_see ? 10000 : 0);
}

function qualityIssues(
  itinerary: Itinerary,
  allAttractions: BuilderAttraction[],
): ItineraryQualityIssue[] {
  const maxWalkKm = itinerary.max_walk_km ?? 5;
  const profile = getEffortProfile(maxWalkKm);
  const issues: ItineraryQualityIssue[] = [];
  const seen = new Set<number>();

  for (const day of itinerary.days) {
    const stops = attractionStops(day.stops);
    if (stops.length === 0) issues.push({ code: "empty_day", day: day.day });
    for (const stop of stops) {
      if (seen.has(stop.id)) issues.push({ code: "duplicate_stop", day: day.day });
      seen.add(stop.id);
    }
    const minutes = activityMinutes(stops);
    const museums = museumCount(stops);
    const mobility = routeMobility(stops, maxWalkKm);
    const distance = mobility.walkingKm;
    const minimumStops = minimumStopsForDay(day, profile.minAttractions);
    const minimumMinutes = minimumMinutesForDay(day, profile.minMinutes);
    if (
      stops.length < minimumStops
      && minutes < minimumMinutes - MINIMUM_MINUTES_TOLERANCE
    ) {
      issues.push({ code: "too_few_stops", day: day.day, actual: stops.length, expected: minimumStops });
    }
    if (minutes < minimumMinutes - MINIMUM_MINUTES_TOLERANCE) {
      issues.push({ code: "too_few_minutes", day: day.day, actual: minutes, expected: minimumMinutes });
    }
    if (stops.length > profile.maxAttractions) {
      issues.push({ code: "too_many_stops", day: day.day, actual: stops.length, expected: profile.maxAttractions });
    }
    if (minutes > profile.maxMinutes) {
      issues.push({ code: "too_many_minutes", day: day.day, actual: minutes, expected: profile.maxMinutes });
    }
    if (museums > MAX_MUSEUMS_PER_DAY) {
      issues.push({ code: "too_many_museums", day: day.day, actual: museums, expected: MAX_MUSEUMS_PER_DAY });
    }
    if (distance > maxWalkKm + 0.01) {
      issues.push({ code: "walking_limit", day: day.day, actual: Number(distance.toFixed(2)), expected: maxWalkKm });
    }
  }

  const scheduled = new Set(itinerary.days.flatMap((day) => attractionStops(day.stops).map((stop) => stop.id)));
  const catalogStops = allAttractions
    .filter((attraction) => !attraction.is_food_spot)
    .map((attraction) => builderToStop(attraction, itinerary.city));
  const missingMustSee = requiredMustSeeStops(catalogStops)
    .filter((stop) => !scheduled.has(stop.id));

  for (const stop of missingMustSee) {
    const compatible = itinerary.days.some((day) => {
      if (fits([...attractionStops(day.stops), stop], maxWalkKm)) return true;
      return attractionStops(day.stops).some((current) => (
        !current.must_see
        && fits(
          [...attractionStops(day.stops).filter((item) => item.id !== current.id), stop],
          maxWalkKm,
        )
      ));
    });
    if (compatible) {
      issues.push({ code: "must_see_missing" });
    }
  }

  return issues;
}

export function validateItineraryQuality(
  itinerary: Itinerary,
  allAttractions: BuilderAttraction[] = [],
  adjusted = false,
): ItineraryQuality {
  const issues = qualityIssues(itinerary, allAttractions);
  return {
    status: issues.length > 0 ? "limited" : adjusted ? "adjusted" : "ok",
    adjusted,
    issues,
  };
}

export function repairBundledItinerary(
  source: Itinerary,
  allAttractions: BuilderAttraction[],
  language: string,
): Itinerary {
  const maxWalkKm = source.max_walk_km ?? 5;
  const profile = getEffortProfile(maxWalkKm);
  let adjusted = false;
  const seen = new Set<number>();

  let days: ItineraryDay[] = source.days.map((day) => {
    const uniqueStops = day.stops.filter((stop) => {
      if (stop.type !== "attraction") return true;
      if (seen.has(stop.id)) {
        adjusted = true;
        return false;
      }
      seen.add(stop.id);
      return true;
    });
    const capped = capDay(uniqueStops, source, maxWalkKm);
    adjusted = adjusted || capped.adjusted;
    return { ...day, stops: capped.stops };
  });

  const scheduledIds = () => new Set(
    days.flatMap((day) => attractionStops(day.stops).map((stop) => stop.id)),
  );
  const catalogStops = allAttractions
    .filter((attraction) => !attraction.is_food_spot)
    .map((attraction) => builderToStop(attraction, source.city));

  const missingMustSee = () => requiredMustSeeStops(catalogStops)
    .filter((stop) => !scheduledIds().has(stop.id));

  for (const mustSee of missingMustSee()) {
    let best: { dayIndex: number; removeId?: number; stops: Stop[]; score: number } | null = null;
    for (let dayIndex = 0; dayIndex < days.length; dayIndex += 1) {
      const day = days[dayIndex];
      const current = attractionStops(day.stops);
      const variants: Array<{ removeId?: number; stops: Stop[] }> = [
        { stops: [...current, mustSee] },
        ...current
          .filter((stop) => !stop.must_see)
          .map((stop) => ({
            removeId: stop.id,
            stops: [...current.filter((item) => item.id !== stop.id), mustSee],
          })),
      ];
      for (const variant of variants) {
        const optimized = optimizeStops(variant.stops);
        if (!fits(optimized, maxWalkKm)) continue;
        const removed = variant.removeId == null
          ? undefined
          : current.find((stop) => stop.id === variant.removeId);
        const score = mobilityCost(optimized, maxWalkKm)
          + (removed ? stopQuality(removed, source) * 10 : 0)
          + dayIndex / 100;
        if (!best || score < best.score) {
          best = { dayIndex, removeId: variant.removeId, stops: optimized, score };
        }
      }
    }
    if (best) {
      days[best.dayIndex] = { ...days[best.dayIndex], stops: best.stops };
      adjusted = true;
    }
  }

  const maxRounds = profile.maxAttractions * Math.max(1, days.length);
  for (let round = 0; round < maxRounds; round += 1) {
    let changed = false;
    const dayOrder = days
      .map((day, index) => ({ index, stops: attractionStops(day.stops) }))
      .sort((a, b) => (
        activityMinutes(a.stops) - activityMinutes(b.stops)
        || a.stops.length - b.stops.length
      ));

    for (const entry of dayOrder) {
      const current = attractionStops(days[entry.index].stops);
      const minimumStops = minimumStopsForDay(days[entry.index], profile.minAttractions);
      if (
        current.length >= minimumStops
        && activityMinutes(current) >= minimumMinutesForDay(days[entry.index], profile.minMinutes)
          - MINIMUM_MINUTES_TOLERANCE
      ) {
        continue;
      }
      const used = scheduledIds();
      const candidates = catalogStops
        .filter((candidate) => !used.has(candidate.id))
        .filter((candidate) => fits([...current, candidate], maxWalkKm))
        .sort((a, b) => (
          candidateScore(current, a, source, maxWalkKm)
          - candidateScore(current, b, source, maxWalkKm)
        ));
      const candidate = candidates[0];
      if (!candidate) continue;
      days[entry.index] = {
        ...days[entry.index],
        stops: optimizeStops([...current, candidate]),
      };
      adjusted = true;
      changed = true;
    }
    if (!changed) break;
  }

  const rebalanced = rebalanceDays(days, maxWalkKm);
  days = rebalanced.days;
  adjusted = adjusted || rebalanced.adjusted;

  days = days.map((day) => {
    const stops = optimizeStops(day.stops);
    return {
      ...day,
      stops,
      maps_link: buildMapsLink(stops, source.city, language),
    };
  });

  const itinerary = { ...source, days };
  return {
    ...itinerary,
    quality: validateItineraryQuality(itinerary, allAttractions, adjusted),
  };
}
