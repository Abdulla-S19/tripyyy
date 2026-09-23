import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DayExtractor } from "@/lib/ai/day-stream";
import { buildTripPrompt } from "@/lib/ai/prompt";
import { itineraryJsonSchema, normalizeItinerary } from "@/lib/ai/schema";
import { sampleItinerary, sampleTrip } from "./helpers";

describe("streamed day extraction", () => {
  it("emits each day once its object closes, across arbitrary chunk boundaries", () => {
    const json = JSON.stringify(sampleItinerary());
    for (const size of [1, 7, 64, json.length]) {
      const ex = new DayExtractor();
      const days: unknown[] = [];
      for (let i = 0; i < json.length; i += size) days.push(...ex.push(json.slice(i, i + size)));
      assert.equal(days.length, 2, `chunk size ${size}`);
      assert.equal((days[1] as { title: string }).title, "Kozhikode → Ooty");
    }
  });

  it("isn't fooled by braces, brackets or quotes inside strings", () => {
    const it = sampleItinerary();
    it.days[0].items[0].detail = 'A "quoted" {brace} and ]bracket[ \\ backslash';
    const ex = new DayExtractor();
    const days = ex.push(JSON.stringify(it));
    assert.equal(days.length, 2);
    assert.equal((days[0] as { items: { detail: string }[] }).items[0].detail, it.days[0].items[0].detail);
  });
});

describe("itinerary normalisation", () => {
  it("recomputes the budget from item costs, ignoring the AI's arithmetic", () => {
    const b = normalizeItinerary(sampleItinerary(), 8000).budget;
    assert.deepEqual(
      { transport: b.transport, stays: b.stays, food: b.food, activities: b.activities, other: b.other, total: b.totalPerPerson },
      { transport: 600, stays: 700, food: 300, activities: 170, other: 30, total: 1800 }
    );
  });

  it("sorts each day's items by time", () => {
    const d = normalizeItinerary(sampleItinerary(), 8000).days[0];
    assert.deepEqual(d.items.map((i) => i.time), ["06:30", "16:00", "19:30"]);
  });

  it("strips JSON-schema keywords Gemini rejects", () => {
    const text = JSON.stringify(itineraryJsonSchema);
    for (const k of ['"pattern"', '"minimum"', '"$schema"']) assert.ok(!text.includes(k), `${k} should be stripped`);
  });
});

describe("prompt", () => {
  it("asks for arrival home by the chosen time", () => {
    const p = buildTripPrompt(sampleTrip({ returnBy: "19:30" }));
    assert.match(p, /ARRIVE in Trivandrum by 19:30/);
  });

  it("includes the traveller's own moods and flags them", () => {
    const p = buildTripPrompt(sampleTrip({ customMoods: ["Tea estates"] }));
    assert.match(p, /Moods: Mountain, Tea estates \(the last ones were written by the traveller/);
  });

  it("briefs last-mile apps when travelling without a vehicle", () => {
    assert.match(buildTripPrompt(sampleTrip({ transport: "local" })), /Rapido bike taxis/);
  });

  it("keeps budget-friendly trips out of AC classes and star hotels", () => {
    const p = buildTripPrompt(sampleTrip({ travelStyle: "budget" }));
    assert.match(p, /Sleeper \(SL\)[\s\S]*Never 3AC\/2AC\/1AC/);
    assert.match(p, /No 3-star or above/);
    assert.match(p, /never exceed the budget for a budget-friendly trip/);
  });

  it("asks for flights and 5-star stays on luxury trips", () => {
    assert.match(buildTripPrompt(sampleTrip({ travelStyle: "luxury" })), /5-star, heritage palaces/);
  });

  it("plans a one-way rental drop and the onward journey", () => {
    const p = buildTripPrompt(sampleTrip({ transport: "rental", rental: { driveType: "self", carId: "", pickup: "Kozhikode", dropoff: "Coimbatore" } }));
    assert.match(p, /Pick the car up in Kozhikode and drop it off in Coimbatore \(one-way hire/);
    assert.match(p, /journey from Coimbatore/);
  });

  it("lets the planner choose the drop city", () => {
    assert.match(buildTripPrompt(sampleTrip({ transport: "rental", rental: { driveType: "self", carId: "", pickup: "", dropoff: "suggest" } })), /Choose the best city to drop it off/);
  });

  it("plans must-see places as day trips from the base, not stops", () => {
    const p = buildTripPrompt(sampleTrip({ sideTrips: ["Coonoor", "Pykara Falls"] }));
    assert.match(p, /Must-see places near Ooty: Coonoor, Pykara Falls/);
    assert.match(p, /NOT overnight stops/);
  });

  it("plans fuel and tolls for an own vehicle", () => {
    assert.match(buildTripPrompt(sampleTrip({ transport: "own", ownVehicle: "bike" })), /own motorbike/);
  });
});
