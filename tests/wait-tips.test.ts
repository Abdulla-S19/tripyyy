import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WAIT_TIPS, pickTips } from "@/lib/wait-tips";
import { sampleTrip } from "./helpers";

const has = (tips: string[], re: RegExp) => tips.some((t) => re.test(t));

describe("loading tips", () => {
  it("has a large pool with no duplicates", () => {
    assert.ok(WAIT_TIPS.length >= 40);
    assert.equal(new Set(WAIT_TIPS.map((t) => t.text)).size, WAIT_TIPS.length);
  });

  it("leads with tips that match the trip", () => {
    const tips = pickTips(sampleTrip({ transport: "train", moods: ["mountain"] }));
    assert.equal(tips.length, 14);
    const firstTwo = tips.slice(0, 2).join(" ");
    assert.match(firstTwo, /train|Tatkal|PNR|berth|IRCTC|station|hill|toy-train|mist|cold/i);
  });

  it("covers app cabs and bike taxis when there's no vehicle", () => {
    assert.ok(has(pickTips(sampleTrip({ transport: "local" }), 60), /Rapido|app cabs|Prepaid auto/));
  });

  it("adds family and budget tips when they apply, and not otherwise", () => {
    assert.ok(has(pickTips(sampleTrip({ children: 2 }), 60), /kids|Children under 5/));
    assert.ok(has(pickTips(sampleTrip({ travelStyle: "budget" }), 60), /tourism lodges|UTS|Thali/));
    assert.ok(!has(pickTips(sampleTrip({ transport: "flight", moods: ["cultural"], travelStyle: "luxury" }), 60), /Thali lunches|UTS app/));
  });

  it("gives driving tips for own vehicles and rentals", () => {
    assert.ok(has(pickTips(sampleTrip({ transport: "own" }), 60), /FASTag/));
    assert.ok(has(pickTips(sampleTrip({ transport: "rental" }), 60), /photograph every scratch/));
  });
});
