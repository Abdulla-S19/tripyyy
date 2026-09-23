import { findCity } from "@/lib/cities";
import { formatMoney, LEG_MODES, MOODS, RENTAL_CARS, TRANSPORT_MODES, type CurrencyId } from "@/lib/trip-options";
import type { TripFormValues } from "@/lib/trip-schema";
import type { Itinerary, ItemKind, ItineraryDay, ItineraryItem } from "@/types/itinerary";

/** Budget categories in their validated palette order (CVD-checked on the dark surface). */
export const BUDGET_CATEGORIES = [
  { key: "activities", label: "Activities", color: "#2f9573" },
  { key: "transport", label: "Transport", color: "#3b6fd4" },
  { key: "food", label: "Food", color: "#b8852a" },
  { key: "stays", label: "Stays", color: "#8a6ad0" },
  { key: "other", label: "Other", color: "#c2587e" },
] as const;

export type BudgetKey = (typeof BUDGET_CATEGORIES)[number]["key"];

export const KIND_BUCKET: Record<ItemKind, BudgetKey> = {
  transport: "transport",
  food: "food",
  place: "activities",
  activity: "activities",
  stay: "stays",
  free: "other",
};

export const KIND_LABEL: Record<ItemKind, string> = { transport: "Travel", food: "Food", place: "Sightseeing", activity: "Activity", stay: "Stay", free: "Free time" };

/** How the group travels, in words (used by the print layout and the PDF). */
export function transportLabel(trip: TripFormValues) {
  const mode = TRANSPORT_MODES.find((m) => m.id === trip.transport)?.label ?? trip.transport;
  if (trip.transport === "rental") {
    const car = trip.rental.carId ? `, ${RENTAL_CARS.find((c) => c.id === trip.rental.carId)?.name}` : "";
    return `${mode} (${trip.rental.driveType === "self" ? "self-drive" : "with driver"}${car})`;
  }
  if (trip.transport === "own") return `${mode} (${trip.ownVehicle === "bike" ? "bike" : "car"})`;
  if (trip.transport === "mix") return trip.legModes.map((m) => LEG_MODES.find((x) => x.id === m)?.label).filter(Boolean).join(", ");
  return mode;
}

export const moodLabels = (trip: TripFormValues) => [...MOODS.filter((m) => trip.moods.includes(m.id)).map((m) => m.label), ...(trip.customMoods ?? [])];

/** "Nilgiris by rail" → "nilgiris-by-rail", for downloaded file names. */
export const fileSlug = (title: string) => title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "trip";

export const kindColor = (k: ItemKind) => BUDGET_CATEGORIES.find((c) => c.key === KIND_BUCKET[k])!.color;

export const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

export function durationLabel(start: string, end: string) {
  if (!end) return "";
  let mins = toMinutes(end) - toMinutes(start);
  if (mins <= 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}

export const dayLabel = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-IN", opts);

export const dayTotal = (d: ItineraryDay) => d.items.reduce((n, i) => n + i.costPerPerson, 0);

export const money = (n: number, currency: string) => (n === 0 ? "Free" : formatMoney(Math.round(n), currency as CurrencyId));

export const hasCoords = (p: { lat?: number; lng?: number }) =>
  typeof p.lat === "number" && typeof p.lng === "number" && (p.lat !== 0 || p.lng !== 0) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;

export type MapFocus = { lat: number; lng: number; title: string; subtitle?: string; key: string };

export const toFocus = (item: ItineraryItem, key: string): MapFocus => ({
  lat: item.lat,
  lng: item.lng,
  title: item.title,
  subtitle: [item.time, item.location].filter(Boolean).join(" · "),
  key,
});

export type RouteStop ={ name: string; lat: number; lng: number; kind: "start" | "stop" | "end" | "return" };

/** The trip's city chain with coordinates: known city list first, AI coordinates as fallback. */
export function routeStops(trip: TripFormValues, it: Itinerary): RouteStop[] {
  const aiCoords = (name: string) => {
    const d = it.days.find((x) => x.city.toLowerCase().includes(name.toLowerCase()) && hasCoords(x));
    return d ? { lat: d.lat, lng: d.lng } : undefined;
  };
  const locate = (name: string) => {
    const c = findCity(name);
    return c ? { lat: c.lat, lng: c.lng } : aiCoords(name);
  };
  const names: { name: string; kind: RouteStop["kind"] }[] = [
    { name: trip.origin, kind: "start" },
    ...(trip.hasStops ? trip.waypoints.map((w) => ({ name: w.city, kind: "stop" as const })) : []),
    { name: trip.destination, kind: "end" },
  ];
  if (trip.tripType === "round") {
    const back = trip.returnTo.trim() || trip.origin;
    names.push({ name: back, kind: "return" });
  }
  return names.flatMap((n) => {
    const p = locate(n.name);
    return p ? [{ name: n.name, kind: n.kind, ...p }] : [];
  });
}

/** Gently curved arc between two points, sampled for a GeoJSON LineString. */
export function arc(a: [number, number], b: [number, number], samples = 48, bend = 0.18): [number, number][] {
  const [x1, y1] = a;
  const [x2, y2] = b;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const cx = mx - (y2 - y1) * bend;
  const cy = my + (x2 - x1) * bend;
  return Array.from({ length: samples + 1 }, (_, i) => {
    const t = i / samples;
    const u = 1 - t;
    return [u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y1 + 2 * u * t * cy + t * t * y2];
  });
}

export function shareText(trip: TripFormValues, it: Itinerary) {
  const cur = trip.currency;
  const lines = [
    `${it.title}`,
    `${[trip.origin, ...(trip.hasStops ? trip.waypoints.map((w) => w.city) : []), trip.destination].join(" → ")} · ${it.days.length} days · ${trip.adults + trip.children} travelling`,
    `About ${money(it.budget.totalPerPerson, cur)} per person`,
    "",
  ];
  for (const d of it.days) {
    lines.push(`Day ${d.day} (${dayLabel(d.date)}): ${d.title}`);
    for (const i of d.items) lines.push(`  ${i.time}  ${i.title}${i.costPerPerson ? ` (${money(i.costPerPerson, cur)})` : ""}`);
    lines.push("");
  }
  lines.push("Planned with TRIPYYY");
  return lines.join("\n");
}

const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
const icsStamp = (date: string, time: string) => `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;

function addMinutes(date: string, time: string, mins: number) {
  const d = new Date(`${date}T${time}:00`);
  d.setMinutes(d.getMinutes() + mins);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

/** Calendar file with one event per itinerary item, in the traveller's local (floating) time. */
export function buildIcs(it: Itinerary, id: string) {
  const out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//TRIPYYY//Trip planner//EN", "CALSCALE:GREGORIAN", `X-WR-CALNAME:${icsEscape(it.title)}`];
  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  it.days.forEach((d) =>
    d.items.forEach((item: ItineraryItem, n) => {
      const next = d.items[n + 1];
      const mins = item.endTime
        ? (toMinutes(item.endTime) - toMinutes(item.time) + 1440) % 1440 || 60
        : next
          ? Math.max(toMinutes(next.time) - toMinutes(item.time), 15)
          : 60;
      const end = addMinutes(d.date, item.time, mins);
      out.push(
        "BEGIN:VEVENT",
        `UID:${id}-${d.day}-${n}@tripyyy`,
        `DTSTAMP:${now}`,
        `DTSTART:${icsStamp(d.date, item.time)}`,
        `DTEND:${icsStamp(end.date, end.time)}`,
        `SUMMARY:${icsEscape(item.title)}`,
        `DESCRIPTION:${icsEscape([item.detail, item.bookingTip].filter(Boolean).join("\n"))}`,
        ...(item.location ? [`LOCATION:${icsEscape(item.location)}`] : []),
        "END:VEVENT"
      );
    })
  );
  out.push("END:VCALENDAR");
  return out.join("\r\n");
}
