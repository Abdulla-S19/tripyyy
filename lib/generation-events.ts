import type { Itinerary, ItineraryDay } from "@/types/itinerary";

/** Newline-delimited JSON events streamed by POST /api/generate. */
export type GenerationEvent =
  | { type: "start"; expectedDays: number }
  | { type: "day"; day: ItineraryDay }
  | { type: "retry"; reason: string }
  | { type: "done"; itinerary: Itinerary; provider: string; model: string }
  | { type: "error"; message: string };
