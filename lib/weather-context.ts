import "server-only";
import { findCity } from "@/lib/cities";
import { tripCalendar } from "@/lib/trip-calendar";
import { addDays, tripNights, type TripFormValues } from "@/lib/trip-schema";
import { describeWeather, tripWeather, weatherWarning } from "@/lib/weather";

/**
 * Notable weather for the trip's cities on the trip dates, as prompt lines, so the plan can avoid
 * ghat and forest drives in heavy rain and keep indoor backups. Best effort: a slow or failed
 * lookup (4 s cap) just means no weather lines.
 */
export async function weatherNotes(trip: TripFormValues): Promise<string[]> {
  const dates = Array.from({ length: tripNights(trip).total + 1 }, (_, i) => addDays(trip.departDate, i));
  const names = [trip.origin, ...(trip.hasStops ? trip.waypoints.map((w) => w.city) : []), trip.destination, ...(trip.sideTrips ?? [])];
  const cities = [...new Map(names.map((n) => [n.trim().toLowerCase(), findCity(n)])).values()].filter((c) => !!c);
  if (!cities.length) return [];

  const labels = new Map(tripCalendar(dates).map((c) => [c.date, c.label.replace(/ \d{4}$/, "")]));
  const signal = AbortSignal.timeout(4000);
  const perCity = await Promise.all(
    cities.map(async (c) => ({ name: c.name, weather: await tripWeather(dates.map((date) => ({ date, lat: c.lat, lng: c.lng })), signal).catch(() => ({})) }))
  );

  const lines: string[] = [];
  let any = false;
  for (const { name, weather } of perCity) {
    const days = Object.values(weather);
    if (days.length) any = true;
    const notable = days
      .filter((w) => weatherWarning(w) || w.code >= 61)
      .map((w) => `${labels.get(w.date)}: ${describeWeather(w.code).label.toLowerCase()}, ${w.max}°/${w.min}°C${w.rainChance != null ? `, ${w.rainChance}% rain` : ""}${w.source === "typical" ? " (typical, last year)" : ""}`);
    if (notable.length) lines.push(`  - ${name}: ${notable.join("; ")}`);
  }
  if (!lines.length) return any ? ["  No heavy rain, storms or extreme heat expected in the route cities on these dates."] : [];
  return lines.slice(0, 8);
}
