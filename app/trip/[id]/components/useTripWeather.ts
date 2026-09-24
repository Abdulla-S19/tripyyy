"use client";

import { useEffect, useState } from "react";
import { tripWeather, type DayWeather } from "@/lib/weather";
import type { ItineraryDay } from "@/types/itinerary";

/** Weather per trip date for each day's city. Fails quietly: no data just means no weather shown. */
export function useTripWeather(days: ItineraryDay[] | undefined) {
  const [weather, setWeather] = useState<Record<string, DayWeather>>({});
  // Re-fetch only when a day's date or city changes, not on every edit of the plan.
  const key = (days ?? []).map((d) => `${d.date}@${d.lat.toFixed(2)},${d.lng.toFixed(2)}`).join("|");

  useEffect(() => {
    if (!key) return;
    const ctl = new AbortController();
    const places = key.split("|").map((p) => {
      const [date, coords] = p.split("@");
      const [lat, lng] = coords.split(",").map(Number);
      return { date, lat, lng };
    });
    tripWeather(places, ctl.signal)
      .then((w) => !ctl.signal.aborted && setWeather(w))
      .catch(() => {});
    return () => ctl.abort();
  }, [key]);

  return weather;
}
