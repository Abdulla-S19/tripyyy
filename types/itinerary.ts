import { z } from "zod";

// Every field is required (empty string / 0 when not applicable) so the same schema
// works for Gemini's responseJsonSchema and OpenAI's strict structured outputs.

export const ITEM_KINDS = ["transport", "food", "place", "stay", "activity", "free"] as const;
export const ITEM_MODES = ["", "train", "bus", "flight", "car", "bike", "auto", "cab", "walk", "boat", "metro", "toy-train"] as const;

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM");

export const itineraryItemSchema = z.object({
  time,
  endTime: z.string().describe("HH:MM end time, or empty string"),
  kind: z.enum(ITEM_KINDS),
  title: z.string().min(1).describe("Short action title, e.g. 'KSRTC bus to Ooty' or 'Lunch at Paragon'"),
  detail: z.string().describe("One or two practical sentences: what, why, how"),
  location: z.string().describe("Place or area name, empty if not relevant"),
  lat: z.number().describe("Latitude of this place (for transport: the arrival point), 0 if unknown"),
  lng: z.number().describe("Longitude of this place (for transport: the arrival point), 0 if unknown"),
  costPerPerson: z.number().min(0).describe("Estimated cost per person in the trip currency, 0 if free"),
  mode: z.enum(ITEM_MODES).describe("Transport mode for transport items, empty string otherwise"),
  operator: z.string().describe("Operator/service name for transport (e.g. 'KSRTC Swift', 'Jan Shatabdi'), else empty"),
  from: z.string().describe("Departure point for transport, else empty"),
  to: z.string().describe("Arrival point for transport, else empty"),
  bookingTip: z.string().describe("How/when to book or what to verify, else empty"),
  alternatives: z.array(z.string()).max(3).describe("Up to 3 alternative options, e.g. other restaurants"),
});

export const itineraryDaySchema = z.object({
  day: z.number().int().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  city: z.string().describe("Where the traveller sleeps or ends this day"),
  lat: z.number().describe("Latitude of that city"),
  lng: z.number().describe("Longitude of that city"),
  title: z.string().describe("Short headline for the day, e.g. 'Trivandrum → Kozhikode'"),
  summary: z.string().describe("One sentence on the shape of the day"),
  items: z.array(itineraryItemSchema).min(1),
});

export const rentalSuggestionSchema = z.object({
  name: z.string(),
  category: z.string(),
  seats: z.number().int(),
  pricePerDay: z.number().min(0),
  rating: z.number().min(0).max(5),
  provider: z.string().describe("Rental company or platform, e.g. 'Zoomcar', 'Revv', a local operator"),
  why: z.string(),
});

export const budgetSchema = z.object({
  transport: z.number().min(0),
  stays: z.number().min(0),
  food: z.number().min(0),
  activities: z.number().min(0),
  other: z.number().min(0),
  totalPerPerson: z.number().min(0),
  note: z.string().describe("One sentence on how the plan fits the budget"),
});

export const itinerarySchema = z.object({
  title: z.string().describe("Evocative trip name, e.g. 'Nilgiris by rail and road'"),
  summary: z.string().describe("Two sentences describing the trip"),
  currency: z.string(),
  days: z.array(itineraryDaySchema).min(1),
  rentals: z.array(rentalSuggestionSchema).max(5).describe("Rental car suggestions if the traveller rents a car, else empty"),
  budget: budgetSchema,
  tips: z.array(z.string()).max(6).describe("Practical tips specific to this route and season"),
  packing: z.array(z.string()).max(10),
});

export type ItineraryItem = z.infer<typeof itineraryItemSchema>;
export type ItineraryDay = z.infer<typeof itineraryDaySchema>;
export type RentalSuggestion = z.infer<typeof rentalSuggestionSchema>;
export type Itinerary = z.infer<typeof itinerarySchema>;
export type ItemKind = (typeof ITEM_KINDS)[number];
