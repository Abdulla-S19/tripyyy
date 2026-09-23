import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stepSchemas, tripLegs, tripNights, tripSchema, withTripDefaults } from "@/lib/trip-schema";
import { sampleTrip } from "./helpers";

const issues = (r: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  r.success ? [] : r.error!.issues.map((i) => `${i.path.join(".")}: ${i.message}`);

describe("trip validation", () => {
  it("accepts a complete trip", () => {
    assert.deepEqual(issues(tripSchema.safeParse(sampleTrip())), []);
  });

  it("rejects the same start and destination, ignoring case", () => {
    assert.match(issues(stepSchemas[0].safeParse(sampleTrip({ destination: "trivandrum" })))[0], /^destination: /);
  });

  it("ignores hidden stops when stopovers are switched off", () => {
    const r = stepSchemas[0].safeParse(sampleTrip({ hasStops: false, waypoints: [{ city: "", nights: 1 }] }));
    assert.deepEqual(issues(r), []);
  });

  it("requires a city for each stop when stopovers are on", () => {
    const r = stepSchemas[0].safeParse(sampleTrip({ hasStops: true, waypoints: [{ city: "", nights: 1 }] }));
    assert.deepEqual(issues(r), ["waypoints.0.city: Add a city for this stop, or remove it"]);
  });

  it("rejects a duplicate stop", () => {
    const r = stepSchemas[0].safeParse(sampleTrip({ hasStops: true, waypoints: [{ city: "Kochi", nights: 1 }, { city: "kochi", nights: 1 }] }));
    assert.deepEqual(issues(r), ["waypoints.1.city: You've already added this stop"]);
  });

  it("rejects a departure in the past", () => {
    assert.match(issues(stepSchemas[1].safeParse(sampleTrip({ departDate: "2020-01-01" })))[0], /in the past/);
  });

  it("needs enough nights for the stops before returning", () => {
    const r = stepSchemas[1].safeParse(sampleTrip({ hasStops: true, waypoints: [{ city: "Kochi", nights: 5 }] }));
    assert.match(issues(r)[0], /stops alone need 5 nights/);
  });

  it("rejects a malformed return-by time but allows flexible", () => {
    assert.equal(issues(stepSchemas[1].safeParse(sampleTrip({ returnBy: "25:00" }))).length, 1);
    assert.deepEqual(issues(stepSchemas[1].safeParse(sampleTrip({ returnBy: "" }))), []);
  });

  it("accepts custom moods alone and rejects no mood at all", () => {
    assert.deepEqual(issues(stepSchemas[2].safeParse(sampleTrip({ moods: [], customMoods: ["Tea estates"] }))), []);
    assert.deepEqual(issues(stepSchemas[2].safeParse(sampleTrip({ moods: [], customMoods: [] }))), ["moods: Pick at least one mood"]);
  });

  it("rejects a budget under the currency minimum", () => {
    assert.match(issues(stepSchemas[2].safeParse(sampleTrip({ budget: 200 })))[0], /start at ₹1,000/);
  });

  it("requires a mode for every leg only when transport is mix", () => {
    assert.equal(issues(stepSchemas[3].safeParse(sampleTrip({ transport: "mix", legModes: ["train", ""] }))).length, 1);
    assert.deepEqual(issues(stepSchemas[3].safeParse(sampleTrip({ transport: "train", legModes: ["train", ""] }))), []);
  });
});

describe("trip geometry", () => {
  it("builds legs including the return journey", () => {
    const legs = tripLegs(sampleTrip({ hasStops: true, waypoints: [{ city: "Kozhikode", nights: 1 }] }));
    assert.deepEqual(legs.map((l) => `${l.from}>${l.to}`), ["Trivandrum>Kozhikode", "Kozhikode>Ooty", "Ooty>Trivandrum"]);
  });

  it("splits nights between stops and the destination", () => {
    assert.deepEqual(tripNights(sampleTrip({ hasStops: true, waypoints: [{ city: "Kozhikode", nights: 1 }] })), { total: 3, stopNights: 1, destinationNights: 2 });
  });

  it("fills fields that older saved drafts don't have", () => {
    const old = { origin: "A", destination: "B" } as Parameters<typeof withTripDefaults>[0];
    const filled = withTripDefaults(old);
    assert.equal(filled.returnBy, "");
    assert.deepEqual(filled.customMoods, []);
    assert.equal(filled.ownVehicle, "car");
    assert.deepEqual(filled.sideTrips, []);
  });

  it("adds new rental fields to an older saved rental", () => {
    const old = { origin: "A", destination: "B", rental: { driveType: "driver", carId: "innova" } } as unknown as Parameters<typeof withTripDefaults>[0];
    assert.deepEqual(withTripDefaults(old).rental, { driveType: "driver", carId: "innova", pickup: "", dropoff: "" });
  });
});
