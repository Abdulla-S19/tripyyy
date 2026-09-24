import { tripCalendar } from "@/lib/trip-calendar";
import { toMinutes } from "@/lib/trip-view";
import type { Itinerary, ItineraryDay, ItineraryItem } from "@/types/itinerary";

// Road warnings added in code, so the most important ones never depend on the model remembering:
// weekend/holiday traffic from the computed calendar, and a few well-known, long-standing rules
// that apply whenever a drive clearly passes that way. Each is added at most once a day, and not
// at all when the day's plan already says it.

const MAX_ALERTS = 4;
/** A warning about congestion (not a "night traffic ban"), so the calendar one isn't added twice. */
const MENTIONS_TRAFFIC = /(heavy|weekend|holiday|festival|peak|rush|evening|morning|long)[^.]*traffic|traffic jam|congest|queue|crowd|rush hour/i;

// The Bandipur–Mudumalai and Bandipur–Muthanga forest roads: named outright, or a drive between
// the Mysuru side and the Nilgiris/Wayanad side, which has to cross them.
const MYSURU_SIDE = "gundlupet|mysuru|mysore|bengaluru|bangalore|chamarajanagar";
const FOREST_SIDE = "ooty|udhagamandalam|gudalur|masinagudi|sultan bathery|wayanad|kalpetta|muthanga";
const CROSSES_BANDIPUR = new RegExp(`bandipur|mudumalai|theppakadu|(${MYSURU_SIDE}).*(${FOREST_SIDE})|(${FOREST_SIDE}).*(${MYSURU_SIDE})`, "i");

/** Long-standing rules on specific roads. "entering" rules only apply to drives heading into the area. */
const KNOWN_RULES: { on: RegExp; said: RegExp; alert: string; entering?: boolean }[] = [
  {
    on: CROSSES_BANDIPUR,
    said: /bandipur|mudumalai|muthanga|night (traffic )?ban|9 ?pm|21:00/i,
    alert: "Bandipur forest roads (to Ooty via Mudumalai, to Wayanad via Muthanga) are closed 9 pm–6 am: cross the check posts in daylight.",
  },
  {
    on: /ooty|udhagamandalam|coonoor|kotagiri|nilgiri|kodaikanal/i,
    said: /e-?pass/i,
    entering: true,
    alert: "An e-pass is needed to drive into the Nilgiris (Ooty, Coonoor) and Kodaikanal: apply online before the trip and check the latest rules.",
  },
];

const minutes = (i: ItineraryItem) => {
  if (!i.endTime) return 0;
  const m = toMinutes(i.endTime) - toMinutes(i.time);
  return m <= 0 ? m + 24 * 60 : m;
};

/** Self-driven or chauffeured road legs of an hour or more (not short city hops). */
export const isLongDrive = (i: ItineraryItem) => i.kind === "transport" && (i.mode === "car" || i.mode === "bike") && minutes(i) >= 60;

/** Where a drive is going: its destination, or the title's "… to X" part when there's none. */
const heading = (i: ItineraryItem) => i.to || i.title.split(/ to /i).pop() || "";
const routeText = (i: ItineraryItem) => [i.title, i.from, i.to, i.detail].join(" ");
const dayText = (d: ItineraryDay) => d.items.flatMap((i) => [i.detail, i.bookingTip, ...i.alternatives, ...(i.alerts ?? [])]).join(" \n ");

function add(item: ItineraryItem, alert: string): ItineraryItem {
  const alerts = item.alerts ?? [];
  return alerts.length >= MAX_ALERTS ? item : { ...item, alerts: [...alerts, alert] };
}

/** Adds calendar and known-rule warnings to the long drives of a road trip, once per day. */
export function withRoadAlerts(it: Itinerary): Itinerary {
  const calendar = new Map(tripCalendar(it.days.map((d) => d.date)).map((c) => [c.date, c]));
  const longWeekend = [...calendar.values()].some((c) => c.holiday) && [...calendar.values()].some((c) => c.weekend);

  const days = it.days.map((d) => {
    const items = [...d.items];
    const said = dayText(d);
    const attach = (match: (i: ItineraryItem) => boolean, alert: string) => {
      const at = items.findIndex((i) => isLongDrive(i) && match(i));
      if (at >= 0) items[at] = add(items[at], alert);
    };

    for (const rule of KNOWN_RULES) {
      if (rule.said.test(said)) continue;
      attach((i) => rule.on.test(rule.entering ? heading(i) : routeText(i)), rule.alert);
    }
    const cal = calendar.get(d.date);
    if ((cal?.holiday || cal?.weekend) && !MENTIONS_TRAFFIC.test(said)) {
      const why = cal.holiday ? `${cal.holiday}${longWeekend ? " long weekend" : ""}` : longWeekend ? "Long weekend" : "Weekend";
      attach(() => true, `${why}: expect heavy traffic leaving cities and queues on hill-station and beach roads. Start early.`);
    }
    return { ...d, items };
  });
  return { ...it, days };
}

// ── Hard rules a plan must not break ───────────────────────────────────────

const CLOSED_FROM = 21 * 60;
const CLOSED_UNTIL = 6 * 60;
const closedAt = (m: number) => m >= CLOSED_FROM || m < CLOSED_UNTIL;

/**
 * Drives scheduled through the Bandipur forest while it's closed (9 pm–6 am), as retry feedback.
 * A drive that starts inside the closure, or a shorter drive that ends well into it, must cross closed.
 */
export function roadProblems(days: ItineraryDay[]): string[] {
  const problems: string[] = [];
  for (const d of days) {
    for (const i of d.items) {
      if (!isLongDrive(i) || !CROSSES_BANDIPUR.test(routeText(i))) continue;
      const start = toMinutes(i.time);
      const end = toMinutes(i.endTime);
      const lateEnd = closedAt(end) && (end >= CLOSED_FROM + 30 || end < CLOSED_UNTIL) && minutes(i) <= 4 * 60;
      if (closedAt(start) || lateEnd) {
        problems.push(
          `Day ${d.day} "${i.title}" (${i.time}–${i.endTime}) crosses the Bandipur forest road while it is closed (9 pm–6 am). ` +
            `Reschedule it: cross before 8:30 pm, or stop for the night before the forest (e.g. Gundlupet or Mysuru) and cross at 6 am the next morning. Say why in alerts.`
        );
      }
    }
  }
  return problems;
}
