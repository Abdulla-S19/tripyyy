import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildTripPrompt, drivenLegs } from "@/lib/ai/prompt";
import { isLongDrive, roadProblems, withRoadAlerts } from "@/lib/road-alerts";
import { calendarLines, tripCalendar } from "@/lib/trip-calendar";
import { itinerarySchema } from "@/types/itinerary";
import { item, sampleItinerary, sampleTrip } from "./helpers";

describe("tripCalendar", () => {
  it("names weekdays and flags weekends and fixed holidays", () => {
    const [fri, sat, gandhi] = tripCalendar(["2026-10-09", "2026-10-10", "2026-10-02"]);
    assert.equal(fri.label, "Fri 9 Oct 2026");
    assert.equal(fri.weekend, false);
    assert.equal(sat.weekend, true);
    assert.equal(gandhi.holiday, "Gandhi Jayanti");
  });

  it("warns about a long weekend", () => {
    const lines = calendarLines(["2026-08-15", "2026-08-16"]); // Sat 15 Aug, Sun 16 Aug
    assert.match(lines[0], /Day 1: Sat 15 Aug 2026 \(weekend\) \(Independence Day\)/);
    assert.match(lines.at(-1)!, /long weekend/);
  });
});

describe("road trip rules", () => {
  it("apply to own car, rental and bike trips", () => {
    for (const transport of ["own", "rental", "bike"] as const) {
      const p = buildTripPrompt(sampleTrip({ transport }));
      assert.match(p, /Road trip rules for the driven legs: the route is a choice/, transport);
      assert.match(p, /Bandipur–Mudumalai, 9 pm–6 am/);
    }
  });

  it("stay out of train and bus trips", () => {
    assert.doesNotMatch(buildTripPrompt(sampleTrip({ transport: "train" })), /Road trip rules/);
    assert.doesNotMatch(buildTripPrompt(sampleTrip({ transport: "bus" })), /Road trip rules/);
  });

  it("name only the driven legs of a mixed trip", () => {
    const trip = sampleTrip({ transport: "mix", tripType: "round", legModes: ["train", "rental"] });
    assert.deepEqual(drivenLegs(trip).map((l) => `${l.from}→${l.to}`), ["Ooty→Trivandrum"]);
    assert.match(buildTripPrompt(trip), /Road trip rules for the driven legs \(Ooty → Trivandrum\)/);
  });
});

describe("prompt context", () => {
  it("includes the trip calendar and the weather lines it is given", () => {
    const p = buildTripPrompt(sampleTrip(), { weather: ["  - Ooty: Sat 17 Oct: heavy rain, 18°/12°C, 90% rain"] });
    assert.match(p, /Trip calendar \(for traffic, crowds and opening days\):\n  - Day 1: /);
    assert.match(p, /Weather on the trip dates[\s\S]*Ooty: Sat 17 Oct: heavy rain/);
  });

  it("leaves weather out when there is none", () => {
    assert.doesNotMatch(buildTripPrompt(sampleTrip()), /Weather on the trip dates/);
  });
});

describe("withRoadAlerts", () => {
  const drive = (p: Partial<Parameters<typeof item>[0]> = {}) =>
    item({ time: "16:00", endTime: "21:30", kind: "transport", mode: "car", title: "Drive to Ooty via Mysore", from: "Bengaluru", to: "Ooty", ...p });
  const plan = (date: string, items: ReturnType<typeof item>[]) => ({
    ...sampleItinerary(),
    days: [{ day: 1, date, city: "Ooty", lat: 11.41, lng: 76.7, title: "Drive", summary: "", items }],
  });

  it("adds the long-weekend, Bandipur and e-pass warnings the model left out", () => {
    const out = withRoadAlerts(plan("2026-10-02", [drive()])).days[0].items[0].alerts!;
    assert.equal(out.length, 3);
    assert.match(out[0], /Bandipur forest roads .* are closed 9 pm–6 am/);
    assert.match(out[1], /e-pass is needed to drive into the Nilgiris/);
    assert.match(out[2], /^Gandhi Jayanti: expect heavy traffic/);
  });

  it("doesn't repeat what the model already said", () => {
    const said = drive({ alerts: ["Bandipur check post closed 9 pm–6 am: cross by 8:30 pm", "Heavy weekend traffic at the ghat"] });
    const out = withRoadAlerts(plan("2026-10-03", [said])).days[0].items[0].alerts!;
    assert.equal(out.filter((a) => /Bandipur/.test(a)).length, 1);
    assert.equal(out.filter((a) => /traffic/.test(a)).length, 1);
    assert.equal(out.length, 3); // + e-pass only
  });

  it("asks for the e-pass only on the way into the Nilgiris", () => {
    const back = drive({ title: "Drive from Ooty to Bengaluru", from: "Ooty", to: "Bengaluru", detail: "Via NH275 from Ooty" });
    const out = withRoadAlerts(plan("2026-10-07", [back])).days[0].items[0].alerts!;
    assert.equal(out.some((a) => /e-pass/.test(a)), false);
    assert.equal(out.some((a) => /Bandipur/.test(a)), true);
  });

  it("adds each warning once a day, on the first drive it applies to", () => {
    const leg1 = drive({ title: "Drive to Gundlupet", from: "Bengaluru", to: "Gundlupet", time: "08:00", endTime: "12:00" });
    const leg2 = drive({ title: "Drive to Ooty via Gudalur", from: "Gundlupet", to: "Ooty", time: "13:00", endTime: "16:00" });
    const [a, b] = withRoadAlerts(plan("2026-10-03", [leg1, leg2])).days[0].items;
    assert.deepEqual(a.alerts?.map((x) => x.slice(0, 12)), ["Weekend: exp"]);
    assert.equal(b.alerts?.length, 2); // Bandipur crossing + e-pass, not the weekend note again
  });

  it("doesn't flag Bandipur on the Mysuru–Bengaluru stretch", () => {
    const home = drive({ title: "Drive Gundlupet to Bengaluru", from: "Gundlupet", to: "Bengaluru", detail: "Via Mysuru Ring Road and the Expressway" });
    const out = withRoadAlerts(plan("2026-10-07", [home])).days[0].items[0].alerts ?? [];
    assert.equal(out.some((x) => /Bandipur/.test(x)), false);
  });

  it("leaves short hops, trains and weekday drives elsewhere alone", () => {
    const hop = item({ time: "09:30", endTime: "10:00", kind: "transport", mode: "car", title: "Cab to Doddabetta" });
    const train = item({ time: "06:00", endTime: "12:00", kind: "transport", mode: "train", title: "Train to Kochi" });
    const weekday = drive({ title: "Drive to Munnar", from: "Kochi", to: "Munnar" });
    assert.equal(isLongDrive(hop), false);
    const out = withRoadAlerts(plan("2026-10-07", [hop, train, weekday])).days[0].items; // Wed
    assert.deepEqual(out.map((i) => i.alerts ?? []), [[], [], []]);
  });
});

describe("roadProblems", () => {
  const leg = (time: string, endTime: string, p: Partial<Parameters<typeof item>[0]> = {}) =>
    item({ time, endTime, kind: "transport", mode: "car", title: "Drive to Ooty via Gudalur", from: "Gundlupet", to: "Ooty", ...p });
  const day = (items: ReturnType<typeof item>[]) => [{ day: 1, date: "2026-10-02", city: "Ooty", lat: 11.4, lng: 76.7, title: "", summary: "", items }];

  it("catches a forest crossing during the 9 pm–6 am closure", () => {
    const p = roadProblems(day([leg("21:00", "23:30")]));
    assert.equal(p.length, 1);
    assert.match(p[0], /Day 1 "Drive to Ooty via Gudalur" \(21:00–23:30\) crosses the Bandipur forest road while it is closed/);
    assert.equal(roadProblems(day([leg("19:30", "22:15")])).length, 1); // ends deep in the closure
  });

  it("allows daylight crossings, a long drive that crosses before 9 pm, and roads elsewhere", () => {
    assert.deepEqual(roadProblems(day([leg("06:30", "09:30")])), []);
    assert.deepEqual(roadProblems(day([leg("16:00", "21:30", { title: "Drive to Ooty via Mysore", from: "Bengaluru" })])), []);
    assert.deepEqual(roadProblems(day([leg("21:00", "23:00", { title: "Drive to Munnar", from: "Kochi", to: "Munnar" })])), []);
  });
});

describe("alerts field", () => {
  it("keeps trips saved before it existed valid", () => {
    const old = sampleItinerary();
    assert.equal(old.days[0].items[0].alerts, undefined);
    assert.equal(itinerarySchema.safeParse(old).success, true);
  });

  it("accepts warnings, and null from strict-output models", () => {
    const it = sampleItinerary();
    it.days[0].items[0].alerts = ["Bandipur closed 9 pm–6 am"];
    it.days[0].items[1].alerts = null;
    assert.equal(itinerarySchema.safeParse(it).success, true);
  });
});
