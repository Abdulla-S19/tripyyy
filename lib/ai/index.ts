import "server-only";
import { tripNights, type TripFormValues } from "@/lib/trip-schema";
import { itineraryDaySchema, itinerarySchema, type Itinerary, type ItineraryDay } from "@/types/itinerary";
import { modelChain, runChain } from "./chain";
import { DayExtractor } from "./day-stream";
import { callGemini } from "./gemini";
import { callMock } from "./mock";
import { callOpenAI } from "./openai";
import { normalizeItinerary } from "./schema";
import { AIError, type ModelCaller, type ProviderId } from "./types";

const callers: Record<ProviderId, ModelCaller> = { gemini: callGemini, openai: callOpenAI, mock: callMock };

export type GenerationHooks = {
  /** A day finished streaming and passed validation (preview only; the final itinerary is authoritative). */
  onDay?: (day: ItineraryDay) => void;
  /** Streamed output so far should be discarded: a fallback model or a corrective retry is starting. */
  onRetry?: (reason: string) => void;
  signal?: AbortSignal;
};

export type GenerationResult = { itinerary: Itinerary; provider: string; model: string };

/**
 * Generates, validates and normalises an itinerary.
 * Two layers of resilience: runChain falls back across models when one is busy or fails,
 * and an unusable answer gets one corrective retry with the validation errors as feedback.
 */
export async function generateItinerary(trip: TripFormValues, hooks: GenerationHooks = {}): Promise<GenerationResult> {
  const chain = modelChain();
  const expectedDays = tripNights(trip).total + 1;
  let feedback: string | undefined;
  let usable: GenerationResult | undefined;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0 && feedback) hooks.onRetry?.("Tidying up the plan");
    let extractor = new DayExtractor();
    const { data, ref } = await runChain(chain, callers, trip, {
      feedback,
      signal: hooks.signal,
      onFallback: () => {
        extractor = new DayExtractor();
        hooks.onRetry?.("Switching to a less busy planner");
      },
      onText: (delta) => {
        for (const d of extractor.push(delta)) {
          const day = itineraryDaySchema.safeParse(d);
          if (day.success) hooks.onDay?.(day.data);
        }
      },
    });

    const parsed = itinerarySchema.safeParse(data);
    if (parsed.success) {
      const itinerary = normalizeItinerary(parsed.data, trip.budget);
      usable = { itinerary, provider: ref.provider, model: ref.model };
      if (itinerary.days.length === expectedDays) return usable;
      feedback = `The trip needs exactly ${expectedDays} days but you returned ${itinerary.days.length}.`;
    } else {
      feedback = parsed.error.issues
        .slice(0, 8)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
    }
  }
  if (usable) return usable;
  throw new AIError(`The AI returned an itinerary we couldn't use (${feedback}).`, "invalid");
}

export { AIError };
