import { NextResponse, type NextRequest } from "next/server";
import { AIError, generateItinerary } from "@/lib/ai";
import type { GenerationEvent } from "@/lib/generation-events";
import { currentUserId } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { tripNights, tripSchema, withTripDefaults, type TripFormValues } from "@/lib/trip-schema";
import { weatherNotes } from "@/lib/weather-context";

export const runtime = "nodejs";
// One generation takes ~50–80s; allow room for a model fallback and the validation retry.
export const maxDuration = 300;

const MAX_DAYS = 14;
const LIMIT = Number(process.env.GENERATE_LIMIT_PER_HOUR || 5);

const fail = (status: number, error: string, extra?: Record<string, unknown>) =>
  NextResponse.json({ error, ...extra }, { status });

function publicMessage(err: unknown) {
  if (err instanceof AIError) {
    console.error(`[generate] ${err.kind}: ${err.message}`);
    return err.kind === "config" ? "The trip planner isn't configured correctly. Check the server logs." : err.message;
  }
  console.error("[generate] unexpected", err);
  return "Something went wrong while planning. Please try again.";
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "Send the trip as JSON.");
  }

  const parsed = tripSchema.safeParse(body && typeof body === "object" ? withTripDefaults(body as Partial<TripFormValues>) : body);
  if (!parsed.success) {
    return fail(400, "Some trip details need fixing.", {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  const expectedDays = tripNights(parsed.data).total + 1;
  if (expectedDays > MAX_DAYS) return fail(400, `TRIPYYY plans trips of up to ${MAX_DAYS} days for now — this one is ${expectedDays}.`);

  // Signed-in users are limited per account, guests per IP.
  const who = (await currentUserId()) ?? clientIp(req.headers);
  const limit = await rateLimit(`generate:${who}`, LIMIT, 60 * 60 * 1000);
  if (!limit.ok) {
    return fail(429, `You've planned ${LIMIT} trips this hour. Try again in ${Math.ceil(limit.retryAfter / 60)} min.`, {
      retryAfter: limit.retryAfter,
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: GenerationEvent) => {
        if (!req.signal.aborted) controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      };
      send({ type: "start", expectedDays });
      try {
        const weather = await weatherNotes(parsed.data).catch(() => []);
        const result = await generateItinerary(parsed.data, {
          signal: req.signal,
          context: { weather },
          onDay: (day) => send({ type: "day", day }),
          onRetry: (reason) => send({ type: "retry", reason }),
        });
        send({ type: "done", ...result });
      } catch (err) {
        if (!req.signal.aborted) send({ type: "error", message: publicMessage(err) });
      } finally {
        try {
          controller.close();
        } catch {
          // client already disconnected
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
