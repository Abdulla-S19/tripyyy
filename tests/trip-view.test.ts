import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildIcs, durationLabel, routeStops, shareText } from "@/lib/trip-view";
import { sampleItinerary, sampleTrip } from "./helpers";

describe("durations", () => {
  it("formats hours and minutes, including journeys past midnight", () => {
    assert.equal(durationLabel("06:30", "15:20"), "8h 50m");
    assert.equal(durationLabel("22:00", "05:30"), "7h 30m");
    assert.equal(durationLabel("10:00", "10:45"), "45m");
    assert.equal(durationLabel("10:00", ""), "");
  });
});

describe("calendar export", () => {
  const ics = buildIcs(sampleItinerary(), "t1");

  it("writes one event per itinerary item", () => {
    assert.equal(ics.match(/BEGIN:VEVENT/g)?.length, 6);
    assert.ok(ics.startsWith("BEGIN:VCALENDAR") && ics.trimEnd().endsWith("END:VCALENDAR"));
  });

  it("uses the item's end time when there is one", () => {
    assert.match(ics, /DTSTART:20261014T063000\r\nDTEND:20261014T152000/);
  });

  it("escapes commas and semicolons in text", () => {
    assert.match(ics, /SUMMARY:Check in\\; hotel\\, sea view/);
  });
});

describe("route and sharing", () => {
  it("places known cities from the built-in list and closes the loop home", () => {
    const stops = routeStops(sampleTrip(), sampleItinerary());
    assert.deepEqual(stops.map((s) => `${s.name}:${s.kind}`), ["Trivandrum:start", "Ooty:end", "Trivandrum:return"]);
    assert.ok(Math.abs(stops[0].lat - 8.52) < 0.01);
  });

  it("shares a readable day-by-day summary", () => {
    const text = shareText(sampleTrip(), sampleItinerary());
    assert.match(text, /Day 1 \(.+\): Trivandrum → Kozhikode/);
    assert.match(text, /Planned with TRIPYYY$/);
  });
});
