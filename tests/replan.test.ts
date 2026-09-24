import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDayPrompt } from "@/lib/ai/prompt";
import { dayProblems, fixedJourneys, placeKey, repeatedPlaces } from "@/lib/replan";
import type { ItineraryDay } from "@/types/itinerary";
import { item, sampleItinerary, sampleTrip } from "./helpers";

const day = (n: number, items: ItineraryDay["items"]): ItineraryDay => ({
  day: n,
  date: `2026-10-1${n}`,
  city: "Kochi",
  lat: 9.93,
  lng: 76.26,
  title: `Day ${n}`,
  summary: "",
  items,
});

describe("placeKey", () => {
  it("takes the place after 'at' and drops lead verbs", () => {
    assert.equal(placeKey({ kind: "food", title: "Lunch at Kashi Art Cafe" }), "kashi art cafe");
    assert.equal(placeKey({ kind: "place", title: "Visit Mattancherry Palace" }), "mattancherry palace");
  });

  it("ignores journeys, stays and bare meals", () => {
    assert.equal(placeKey({ kind: "transport", title: "Auto to Fort Kochi" }), null);
    assert.equal(placeKey({ kind: "stay", title: "Check-in at Spencer Home" }), null);
    assert.equal(placeKey({ kind: "food", title: "Breakfast" }), null);
  });
});

describe("repeatedPlaces", () => {
  const others = [
    day(1, [
      item({ time: "12:00", kind: "food", title: "Lunch at Kashi Art Cafe" }),
      item({ time: "17:00", kind: "activity", title: "Kathakali Performance at Kerala Kathakali Centre" }),
      item({ time: "08:00", kind: "food", title: "Breakfast" }),
    ]),
  ];

  it("flags a restaurant or show already on another day", () => {
    const next = day(2, [
      item({ time: "09:00", kind: "food", title: "Brunch at Kashi Art Cafe" }),
      item({ time: "18:00", kind: "activity", title: "Evening show at Kerala Kathakali Centre" }),
      item({ time: "13:00", kind: "food", title: "Lunch at Ginger House" }),
    ]);
    assert.deepEqual(repeatedPlaces(next, others), ["Brunch at Kashi Art Cafe", "Evening show at Kerala Kathakali Centre"]);
  });

  it("lets meals, the hotel and new places through", () => {
    const next = day(2, [
      item({ time: "08:00", kind: "food", title: "Breakfast" }),
      item({ time: "10:00", kind: "stay", title: "Check-in at Spencer Home" }),
      item({ time: "11:00", kind: "place", title: "Hill Palace Museum" }),
    ]);
    assert.deepEqual(repeatedPlaces(next, others), []);
  });
});

describe("dayProblems", () => {
  const current = day(2, [
    item({ time: "10:00", kind: "activity", title: "Kayaking", costPerPerson: 1800 }),
    item({ time: "21:00", kind: "stay", title: "Overnight at Spencer Home", costPerPerson: 1200 }),
  ]);
  const pricey = day(2, [
    item({ time: "10:00", kind: "stay", title: "Refresh at Spencer Home", costPerPerson: 1500 }),
    item({ time: "16:00", kind: "activity", title: "Coastal Cycling Trail", costPerPerson: 6000 }),
    item({ time: "21:00", kind: "stay", title: "Overnight at Spencer Home", costPerPerson: 1500 }),
  ]);

  it("catches a doubled stay charge and a day that got far pricier", () => {
    const p = dayProblems(pricey, current, [], "more adventure", "INR");
    assert.equal(p.length, 2);
    assert.match(p[0], /Only the overnight stay item should carry the room cost.*Overnight at Spencer Home/);
    assert.match(p[1], /costs ₹9,000 per person, far more than the ₹3,000.*Coastal Cycling Trail \(₹6,000\)/);
  });

  it("allows a pricier day when the traveller asked for it", () => {
    assert.equal(dayProblems(pricey, current, [], "upgrade to a premium resort", "INR").filter((x) => /far more/.test(x)).length, 0);
  });

  it("is happy with a similar, new day", () => {
    const fine = day(2, [item({ time: "10:00", kind: "activity", title: "Zipline", costPerPerson: 1500 }), item({ time: "21:00", kind: "stay", title: "Overnight", costPerPerson: 1200 })]);
    assert.deepEqual(dayProblems(fine, current, [], "", "INR"), []);
  });
});

describe("fixedJourneys", () => {
  it("keeps trains and long road legs, not short hops", () => {
    const d = day(3, [
      item({ time: "09:30", endTime: "09:45", kind: "transport", mode: "auto", title: "Auto to the jetty" }),
      item({ time: "10:00", endTime: "14:30", kind: "transport", mode: "bus", title: "KSRTC to Munnar", from: "Kochi", to: "Munnar" }),
      item({ time: "15:45", endTime: "19:45", kind: "transport", mode: "train", title: "Train home" }),
    ]);
    const j = fixedJourneys(d);
    assert.equal(j.length, 2);
    assert.match(j[0], /^10:00–14:30 \(4h 30m\) KSRTC to Munnar: Kochi → Munnar$/);
    assert.match(j[1], /Train home/);
  });
});

describe("buildDayPrompt", () => {
  const trip = sampleTrip();
  const plan = sampleItinerary();

  it("re-plans only the chosen day and passes the request through", () => {
    const p = buildDayPrompt(trip, plan, 2, "add a trek");
    assert.match(p, /Re-plan ONE day/);
    assert.match(p, /Day to re-plan: Day 2 \(2026-10-15\)/);
    assert.match(p, /What the traveller wants changed on this day: "add a trek"/);
    assert.match(p, /Keep "day": 2 and "date": "2026-10-15"/);
  });

  it("lists other days' places as off-limits and keeps the night's city", () => {
    const p = buildDayPrompt(trip, plan, 2, "");
    assert.match(p, /Do NOT repeat anything already planned on other days/);
    assert.doesNotMatch(p, /- Day 2: /); // the day being replaced isn't in the off-limits list
    assert.match(p, /Nothing specific\. Give a fresh, clearly different take/);
  });

  it("rejects a day that isn't in the trip", () => {
    assert.throws(() => buildDayPrompt(trip, plan, 9, ""), /Day 9 is not in this itinerary/);
  });
});
