import { z } from "zod";
import { CURRENCY_IDS, LEG_MODE_IDS, MOOD_IDS, TRANSPORT_IDS, TRAVEL_STYLE_IDS, currencyOf, type LegModeId } from "./trip-options";

const city = (msg: string) => z.string().trim().min(2, msg).max(60, "That name is too long");
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// Stop cities are checked in refineRoute, and only while stopovers are switched on —
// hidden rows left behind by toggling stopovers off must not block the form.
export const waypointSchema = z.object({
  city: z.string().trim().max(60, "That name is too long"),
  nights: z.number().int().min(0, "Can't be negative").max(14, "Up to 14 nights per stop"),
});

const routeShape = {
  origin: city("Where are you starting from?"),
  destination: city("Where are you headed?"),
  hasStops: z.boolean(),
  waypoints: z.array(waypointSchema).max(5, "Up to 5 stops"),
  /** Places near the destination to visit as day trips from the base (not overnight stops). */
  sideTrips: z.array(z.string().trim().min(2).max(40)).max(8, "Up to 8 places"),
};

const scheduleShape = {
  departDate: z.string().min(1, "Pick a departure date"),
  departTime: z.string().min(1, "Pick a departure time"),
  tripType: z.enum(["one-way", "round"]),
  stayNights: z.number().int().min(0).max(30, "Up to 30 nights"),
  returnDate: z.string(),
  returnTo: z.string().trim().max(60),
  /** Latest arrival time back home ("HH:MM"), or "" for flexible. */
  returnBy: z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, "Pick a valid time"),
};

const peopleShape = {
  adults: z.number().int().min(1, "At least one adult").max(20, "Up to 20 adults"),
  children: z.number().int().min(0).max(10, "Up to 10 children"),
  moods: z.array(z.enum(MOOD_IDS)),
  customMoods: z.array(z.string().trim().min(2).max(24)).max(5, "Up to 5 of your own moods"),
  budget: z.number({ error: "Enter a budget" }).positive("Enter a budget"),
  travelStyle: z.enum(TRAVEL_STYLE_IDS),
  currency: z.enum(CURRENCY_IDS),
};

const transportShape = {
  transport: z.enum(TRANSPORT_IDS),
  rental: z.object({
    driveType: z.enum(["self", "driver"]),
    carId: z.string(),
    /** Where the car is collected; "" = the first rental leg's start. */
    pickup: z.string().trim().max(60),
    /** Where it's returned; "" = same as pickup, "suggest" = let the planner pick the best drop point. */
    dropoff: z.string().trim().max(60),
  }),
  ownVehicle: z.enum(["car", "bike"]),
  legModes: z.array(z.union([z.enum(LEG_MODE_IDS), z.literal("")])),
};

type Ctx = z.RefinementCtx;
type Route = z.infer<z.ZodObject<typeof routeShape>>;
type Schedule = z.infer<z.ZodObject<typeof scheduleShape>>;
type People = z.infer<z.ZodObject<typeof peopleShape>>;

export const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

export const addDays = (iso: string, days: number) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

function refineRoute(v: Route, ctx: Ctx) {
  if (v.origin && v.destination && same(v.origin, v.destination)) {
    ctx.addIssue({ code: "custom", path: ["destination"], message: "Destination can't be where you start" });
  }
  if (!v.hasStops) return;
  if (v.waypoints.length === 0) {
    ctx.addIssue({ code: "custom", path: ["waypoints"], message: "Add a stop, or switch stopovers off" });
  }
  v.waypoints.forEach((w, i) => {
    if (w.city.trim().length < 2) {
      ctx.addIssue({ code: "custom", path: ["waypoints", i, "city"], message: "Add a city for this stop, or remove it" });
    } else if (same(w.city, v.origin) || same(w.city, v.destination)) {
      ctx.addIssue({ code: "custom", path: ["waypoints", i, "city"], message: "A stop can't be your start or destination" });
    } else if (v.waypoints.findIndex((o) => same(o.city, w.city)) !== i) {
      ctx.addIssue({ code: "custom", path: ["waypoints", i, "city"], message: "You've already added this stop" });
    }
  });
}

function refineSchedule(v: Schedule & Pick<Route, "hasStops" | "waypoints">, ctx: Ctx) {
  if (v.departDate && v.departDate < todayISO()) {
    ctx.addIssue({ code: "custom", path: ["departDate"], message: "Departure can't be in the past" });
  }
  if (v.tripType !== "round") return;
  if (!v.returnDate) {
    ctx.addIssue({ code: "custom", path: ["returnDate"], message: "Pick a return date" });
    return;
  }
  const stopNights = v.hasStops ? v.waypoints.reduce((n, w) => n + w.nights, 0) : 0;
  const total = daysBetween(v.departDate, v.returnDate);
  if (total < 0) {
    ctx.addIssue({ code: "custom", path: ["returnDate"], message: "Return must be after departure" });
  } else if (total < stopNights) {
    ctx.addIssue({
      code: "custom",
      path: ["returnDate"],
      message: `Your stops alone need ${stopNights} night${stopNights === 1 ? "" : "s"} — pick a later date`,
    });
  }
}

function refinePeople(v: People, ctx: Ctx) {
  if (v.moods.length + v.customMoods.length === 0) {
    ctx.addIssue({ code: "custom", path: ["moods"], message: "Pick at least one mood" });
  }
  const c = currencyOf(v.currency);
  if (v.budget < c.min) {
    ctx.addIssue({ code: "custom", path: ["budget"], message: `Budgets start at ${c.symbol}${c.min.toLocaleString()} per person` });
  }
}

function refineTransport(
  v: z.infer<z.ZodObject<typeof transportShape>> & Pick<Route, "hasStops" | "waypoints"> & Pick<Schedule, "tripType">,
  ctx: Ctx
) {
  if (v.transport !== "mix") return;
  const legs = (v.hasStops ? v.waypoints.length : 0) + 1 + (v.tripType === "round" ? 1 : 0);
  for (let i = 0; i < legs; i++) {
    if (!v.legModes[i]) ctx.addIssue({ code: "custom", path: ["legModes", i], message: "Choose how you'll travel this leg" });
  }
}

export const stepSchemas = [
  z.object(routeShape).superRefine(refineRoute),
  z.object({ ...scheduleShape, hasStops: routeShape.hasStops, waypoints: routeShape.waypoints }).superRefine(refineSchedule),
  z.object(peopleShape).superRefine(refinePeople),
  z
    .object({ ...transportShape, hasStops: routeShape.hasStops, waypoints: routeShape.waypoints, tripType: scheduleShape.tripType })
    .superRefine(refineTransport),
] as const;

export const tripSchema = z
  .object({ ...routeShape, ...scheduleShape, ...peopleShape, ...transportShape })
  .superRefine((v, ctx) => {
    refineRoute(v, ctx);
    refineSchedule(v, ctx);
    refinePeople(v, ctx);
    refineTransport(v, ctx);
  });

export type TripFormValues = z.infer<typeof tripSchema>;
export type Waypoint = z.infer<typeof waypointSchema>;

export const STEP_FIELDS: (keyof TripFormValues)[][] = [
  ["origin", "destination", "hasStops", "waypoints", "sideTrips"],
  ["departDate", "departTime", "tripType", "stayNights", "returnDate", "returnTo", "returnBy"],
  ["adults", "children", "moods", "customMoods", "travelStyle", "budget", "currency"],
  ["transport", "rental", "ownVehicle", "legModes"],
];

export function defaultTrip(): TripFormValues {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  const depart = d.toISOString().slice(0, 10);
  const returnDate = addDays(depart, 3);
  return {
    origin: "",
    destination: "",
    hasStops: false,
    waypoints: [],
    sideTrips: [],
    departDate: depart,
    departTime: "06:30",
    tripType: "round",
    stayNights: 2,
    returnDate,
    returnTo: "",
    returnBy: "",
    adults: 2,
    children: 0,
    moods: [],
    customMoods: [],
    budget: 8000,
    travelStyle: "balanced",
    currency: "INR",
    transport: "train",
    rental: { driveType: "self", carId: "", pickup: "", dropoff: "" },
    ownVehicle: "car",
    legModes: [],
  };
}

/** Fills fields added after a draft or saved trip was stored. */
export const withTripDefaults = (v: Partial<TripFormValues>): TripFormValues => {
  const d = defaultTrip();
  // Nested objects gain fields too (e.g. rental.pickup), so merge them one level deep.
  return { ...d, ...v, rental: { ...d.rental, ...v.rental } };
};

export type Leg = { from: string; to: string; kind: "outbound" | "return" };

export function tripLegs(v: Pick<TripFormValues, "origin" | "destination" | "hasStops" | "waypoints" | "tripType" | "returnTo">): Leg[] {
  const stops = v.hasStops ? v.waypoints.map((w) => w.city || "Next stop") : [];
  const chain = [v.origin || "Start", ...stops, v.destination || "Destination"];
  const legs: Leg[] = chain.slice(1).map((to, i) => ({ from: chain[i], to, kind: "outbound" }));
  if (v.tripType === "round") {
    legs.push({ from: chain[chain.length - 1], to: v.returnTo.trim() || chain[0], kind: "return" });
  }
  return legs;
}

export function tripNights(v: Pick<TripFormValues, "hasStops" | "waypoints" | "tripType" | "departDate" | "returnDate" | "stayNights">) {
  const stopNights = v.hasStops ? v.waypoints.reduce((n, w) => n + (w.nights || 0), 0) : 0;
  if (v.tripType === "round" && v.departDate && v.returnDate) {
    const total = Math.max(daysBetween(v.departDate, v.returnDate), 0);
    return { total, stopNights, destinationNights: Math.max(total - stopNights, 0) };
  }
  return { total: stopNights + v.stayNights, stopNights, destinationNights: v.stayNights };
}

export type LegMode = LegModeId;
