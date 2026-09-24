import "server-only";
import { dayProblems } from "@/lib/replan";
import { roadProblems, withRoadAlerts } from "@/lib/road-alerts";
import { tripNights, type TripFormValues } from "@/lib/trip-schema";
import { itineraryDaySchema, itinerarySchema, type Itinerary, type ItineraryDay } from "@/types/itinerary";
import { modelChain, runChain } from "./chain";
import { DayExtractor } from "./day-stream";
import { callGemini } from "./gemini";
import { callMock } from "./mock";
import { callOpenAI } from "./openai";
import { buildDayPrompt, drivenLegs } from "./prompt";
import { dayJsonSchema, normalizeItinerary } from "./schema";
import { AIError, type ModelCaller, type PromptContext, type ProviderId } from "./types";

const callers: Record<ProviderId, ModelCaller> = { gemini: callGemini, openai: callOpenAI, mock: callMock };

export type GenerationHooks = {
  /** A day finished streaming and passed validation (preview only; the final itinerary is authoritative). */
  onDay?: (day: ItineraryDay) => void;
  /** Streamed output so far should be discarded: a fallback model or a corrective retry is starting. */
  onRetry?: (reason: string) => void;
  signal?: AbortSignal;
  context?: PromptContext;
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
      context: hooks.context,
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
      const itinerary = finish(normalizeItinerary(parsed.data, trip.budget), trip);
      usable = { itinerary, provider: ref.provider, model: ref.model };
      const problems = [
        ...(itinerary.days.length === expectedDays ? [] : [`The trip needs exactly ${expectedDays} days but you returned ${itinerary.days.length}.`]),
        ...(drivenLegs(trip).length ? roadProblems(itinerary.days) : []),
      ];
      if (!problems.length) return usable;
      console.warn(`[generate] plan needs another pass: ${problems.join(" | ")}`);
      feedback = problems.join("\n");
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

/** Code-side touches every plan gets: road trips get calendar and known-rule warnings on long drives. */
const finish = (it: Itinerary, trip: TripFormValues) => (drivenLegs(trip).length ? withRoadAlerts(it) : it);

export type ReplanResult = { itinerary: Itinerary; day: ItineraryDay; provider: string; model: string };

/**
 * Re-plans one day and slots it back into the itinerary. The answer is checked for places already
 * used on other days; if any slipped through, the model gets one retry told exactly which to replace.
 */
export async function replanDay(
  trip: TripFormValues,
  itinerary: Itinerary,
  dayNo: number,
  request: string,
  opts: { signal?: AbortSignal; onRetry?: (reason: string) => void; context?: PromptContext } = {}
): Promise<ReplanResult> {
  const current = itinerary.days.find((d) => d.day === dayNo);
  if (!current) throw new AIError(`Day ${dayNo} isn't part of this trip.`, "invalid");
  const others = itinerary.days.filter((d) => d.day !== dayNo);
  const prompt = buildDayPrompt(trip, itinerary, dayNo, request, opts.context);
  let feedback: string | undefined;
  let usable: ReplanResult | undefined;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) opts.onRetry?.("Fixing repeated places and prices");
    const { data, ref } = await runChain(modelChain(), callers, trip, {
      feedback,
      signal: opts.signal,
      task: { name: "day", prompt, jsonSchema: dayJsonSchema, zod: itineraryDaySchema },
      onFallback: () => opts.onRetry?.("Switching to a less busy planner"),
    });

    const parsed = itineraryDaySchema.safeParse(data);
    if (!parsed.success) {
      feedback = parsed.error.issues
        .slice(0, 8)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      continue;
    }
    // The day's place in the trip is fixed, whatever the model wrote.
    const day: ItineraryDay = { ...parsed.data, day: dayNo, date: current.date, city: parsed.data.city || current.city };
    const days = itinerary.days.map((d) => (d.day === dayNo ? day : d));
    // The old budget note may talk about things this day no longer has; let it be recomputed.
    const next = finish(normalizeItinerary({ ...itinerary, days, budget: { ...itinerary.budget, note: "" } }, trip.budget), trip);
    usable = { itinerary: next, day: next.days.find((d) => d.day === dayNo)!, provider: ref.provider, model: ref.model };

    const problems = [...dayProblems(day, current, others, request, trip.currency), ...(drivenLegs(trip).length ? roadProblems([day]) : [])];
    if (!problems.length) return usable;
    console.warn(`[replan] day ${dayNo} needs another pass: ${problems.join(" | ")}`);
    feedback = problems.join("\n");
  }
  if (usable) return usable; // an imperfect day beats failing the whole request
  throw new AIError(`The AI returned a day we couldn't use (${feedback}).`, "invalid");
}

export { AIError };
