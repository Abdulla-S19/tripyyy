import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { describeWeather, lastYear, sourceFor, weatherRequests, weatherWarning, type DayWeather } from "@/lib/weather";

const today = "2026-09-24";

describe("sourceFor", () => {
  it("uses the forecast for the next 16 days, last year beyond, nothing for the past", () => {
    assert.equal(sourceFor("2026-09-24", today), "forecast");
    assert.equal(sourceFor("2026-10-09", today), "forecast"); // day 16
    assert.equal(sourceFor("2026-10-10", today), "typical");
    assert.equal(sourceFor("2026-09-23", today), null);
  });
});

describe("lastYear", () => {
  it("shifts back a year and handles 29 February", () => {
    assert.equal(lastYear("2026-12-31"), "2025-12-31");
    assert.equal(lastYear("2028-02-29"), "2027-02-28");
  });
});

describe("weatherRequests", () => {
  it("groups days in the same city into one call per source", () => {
    const reqs = weatherRequests(
      [
        { date: "2026-10-01", lat: 9.931, lng: 76.267 },
        { date: "2026-10-02", lat: 9.93, lng: 76.27 },
        { date: "2026-11-20", lat: 9.93, lng: 76.27 },
        { date: "2026-10-03", lat: 0, lng: 0 }, // unknown place: skipped
      ],
      today
    );
    assert.equal(reqs.length, 2);
    const forecast = reqs.find((r) => r.source === "forecast")!;
    assert.match(forecast.url, /^https:\/\/api\.open-meteo\.com\/v1\/forecast\?latitude=9\.93&longitude=76\.27&start_date=2026-10-01&end_date=2026-10-02/);
    const typical = reqs.find((r) => r.source === "typical")!;
    assert.match(typical.url, /archive-api\.open-meteo\.com.*start_date=2025-11-20&end_date=2025-11-20/);
    assert.deepEqual(typical.dates, [{ trip: "2026-11-20", query: "2025-11-20" }]);
  });
});

describe("weather words", () => {
  const w = (p: Partial<DayWeather>): DayWeather => ({ date: "2026-10-01", code: 1, max: 30, min: 23, rainChance: 10, rainMm: 0, source: "forecast", ...p });

  it("names common WMO codes", () => {
    assert.equal(describeWeather(0).label, "Clear");
    assert.equal(describeWeather(63).label, "Rain");
    assert.equal(describeWeather(95).label, "Thunderstorms");
  });

  it("warns only when the weather should change the plan", () => {
    assert.equal(weatherWarning(w({})), null);
    assert.match(weatherWarning(w({ rainChance: 85 }))!, /Heavy rain likely/);
    assert.match(weatherWarning(w({ code: 95 }))!, /Thunderstorms likely/);
    assert.match(weatherWarning(w({ max: 40 }))!, /Very hot/);
    assert.match(weatherWarning(w({ source: "typical", rainChance: null, rainMm: 14 }))!, /Often rainy around this date/);
  });
});
