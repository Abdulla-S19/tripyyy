import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/api";
import { AIError, replanDay } from "@/lib/ai";
import { currentUserId } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { withTripDefaults, type TripFormValues } from "@/lib/trip-schema";
import { tooLarge } from "@/lib/trips-server";
import { itinerarySchema } from "@/types/itinerary";

export const runtime = "nodejs";
// One day is far smaller than a trip (~15–40s), but a model fallback can double that.
export const maxDuration = 120;

const LIMIT = Number(process.env.REPLAN_LIMIT_PER_HOUR || 15);

// Saved trips keep their original answers (their dates may now be in the past), so only the
// essentials are checked here; the full planning rules applied when the trip was made.
const body = z.object({
  trip: z.looseObject({ origin: z.string().min(1).max(60), destination: z.string().min(1).max(60) }),
  itinerary: itinerarySchema,
  day: z.number().int().min(1).max(14),
  request: z.string().max(300).default(""),
});

const fail = (status: number, error: string, extra?: Record<string, unknown>) => NextResponse.json({ error, ...extra }, { status });

/** Re-plans one day of a trip and returns the updated itinerary (budget recomputed). */
export async function POST(req: NextRequest) {
  const input = await readJson(req, body);
  if ("error" in input) return input.error;
  const { itinerary, day, request } = input.data;
  if (tooLarge(input.data)) return fail(413, "That trip is too large to edit.");
  if (!itinerary.days.some((d) => d.day === day)) return fail(400, `Day ${day} isn't part of this trip.`);

  const who = (await currentUserId()) ?? clientIp(req.headers);
  const limit = await rateLimit(`replan:${who}`, LIMIT, 60 * 60 * 1000);
  if (!limit.ok) return fail(429, `You've changed ${LIMIT} days this hour. Try again in ${Math.ceil(limit.retryAfter / 60)} min.`, { retryAfter: limit.retryAfter });

  try {
    const trip = withTripDefaults(input.data.trip as Partial<TripFormValues>);
    const result = await replanDay(trip, itinerary, day, request, { signal: req.signal });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AIError) {
      console.error(`[replan] ${err.kind}: ${err.message}`);
      if (err.kind === "aborted") return fail(499, "Cancelled.");
      return fail(err.kind === "quota" ? 429 : 502, err.kind === "config" ? "The trip planner isn't configured correctly." : err.message);
    }
    console.error("[replan] unexpected", err);
    return fail(500, "Something went wrong while changing this day. Please try again.");
  }
}
