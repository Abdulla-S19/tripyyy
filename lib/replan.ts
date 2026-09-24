import { dayTotal, durationLabel, money, toMinutes } from "@/lib/trip-view";
import type { ItineraryDay, ItineraryItem } from "@/types/itinerary";

// Helpers for re-planning a single day: what must stay fixed, and what must not repeat.

/** Meals and breaks on their own ("Breakfast", "Free time") aren't places, so they may repeat. */
const GENERIC = /^(early |late |quick )?(breakfast|brunch|lunch|dinner|snacks?|tea|coffee|rest|free time|check ?in|check ?out|leisure|relax(ation|ing)?|overnight)$/;
const LEAD = /^(visit( to)?|explore|tour( of)?|see|discover|stroll( through| around)?|walk( through| around)?)\s+/;

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/** What an item is "about": "Lunch at Kashi Art Cafe" → "kashi art cafe"; "Visit Mattancherry Palace" → "mattancherry palace". */
export function placeKey(item: Pick<ItineraryItem, "kind" | "title">): string | null {
  if (item.kind === "transport" || item.kind === "stay") return null;
  const t = norm(item.title);
  const at = t.lastIndexOf(" at ");
  const key = (at >= 0 ? t.slice(at + 4) : t).replace(LEAD, "").trim();
  return key.length < 4 || GENERIC.test(key) ? null : key;
}

/** Titles on the new day that repeat a place already planned on another day. */
export function repeatedPlaces(day: ItineraryDay, others: ItineraryDay[]): string[] {
  const used = others.flatMap((d) => d.items.map(placeKey)).filter((k): k is string => !!k);
  return day.items
    .filter((item) => {
      const k = placeKey(item);
      return !!k && used.some((u) => u === k || (u.length >= 6 && k.includes(u)) || (k.length >= 6 && u.includes(k)));
    })
    .map((i) => i.title);
}

/** The traveller asked to spend more, so a pricier day is expected. */
const WANTS_MORE = /premium|luxur|splurge|upgrade|fancy|fine dining|resort|5[- ]?star|expensive|no budget/i;

/**
 * Everything wrong with a re-planned day, phrased as instructions for a retry:
 * places repeated from other days, the night's stay charged twice, or a cost far above the old day.
 */
export function dayProblems(next: ItineraryDay, current: ItineraryDay, others: ItineraryDay[], request: string, currency: string): string[] {
  const problems: string[] = [];
  const repeats = repeatedPlaces(next, others);
  if (repeats.length) problems.push(`These are already planned on other days, replace them with different places: ${repeats.join("; ")}.`);

  const paidStays = next.items.filter((i) => i.kind === "stay" && i.costPerPerson > 0);
  if (paidStays.length > 1) problems.push(`Only the overnight stay item should carry the room cost; set costPerPerson to 0 on the others (${paidStays.slice(1).map((i) => i.title).join("; ")}).`);

  const was = dayTotal(current);
  const now = dayTotal(next);
  const slack = currency === "INR" ? 1500 : 20; // small days can grow a little without a retry
  if (!WANTS_MORE.test(request) && now > Math.max(was * 1.4, was + slack)) {
    const priciest = [...next.items].sort((a, b) => b.costPerPerson - a.costPerPerson).slice(0, 3);
    problems.push(
      `This day costs ${money(now, currency)} per person, far more than the ${money(was, currency)} it replaces. Use realistic local prices and cheaper options; the priciest items are: ${priciest.map((i) => `${i.title} (${money(i.costPerPerson, currency)})`).join("; ")}.`
    );
  }
  return problems;
}

const minutes = (i: ItineraryItem) => {
  if (!i.endTime) return 0;
  const m = toMinutes(i.endTime) - toMinutes(i.time);
  return m <= 0 ? m + 24 * 60 : m;
};

/** Long journeys the rest of the trip depends on (the train in, the bus home): keep them unless asked. */
export function fixedJourneys(day: ItineraryDay): string[] {
  return day.items
    .filter((i) => i.kind === "transport" && (i.mode === "train" || i.mode === "flight" || minutes(i) >= 75))
    .map((i) => `${i.time}${i.endTime ? `–${i.endTime} (${durationLabel(i.time, i.endTime)})` : ""} ${i.title}${i.from && i.to ? `: ${i.from} → ${i.to}` : ""}`);
}
