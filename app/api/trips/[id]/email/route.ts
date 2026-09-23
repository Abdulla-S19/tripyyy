import { NextResponse } from "next/server";
import { z } from "zod";
import { cloudUser, fail, readJson } from "@/lib/api";
import { requireDb } from "@/lib/db";
import { features } from "@/lib/features";
import { rateLimit } from "@/lib/rate-limit";
import { emailTripPdf } from "@/lib/trip-email";
import { findOwnedTrip, toRecord } from "@/lib/trips-server";

export const runtime = "nodejs";
export const maxDuration = 30;

type Ctx = { params: Promise<{ id: string }> };

const body = z.object({
  to: z.array(z.email()).min(1).max(5),
  note: z.string().max(500).default(""),
});

/** Email one of the signed-in user's trips as a PDF attachment (up to 5 people at a time). */
export async function POST(req: Request, { params }: Ctx) {
  if (!features().email) return fail(503, "Email isn't set up on this server yet.");
  const u = await cloudUser();
  if ("error" in u) return u.error;
  const input = await readJson(req, body);
  if ("error" in input) return input.error;

  const limit = await rateLimit(`trip-email:${u.userId}`, 10, 60 * 60 * 1000);
  if (!limit.ok) return fail(429, "You've sent a lot of emails. Try again in a little while.", { retryAfter: limit.retryAfter });

  const row = await findOwnedTrip((await params).id, u.userId);
  if (!row) return fail(404, "Trip not found. Save it to your account first.");
  const trip = toRecord(row);
  const user = await requireDb().user.findUnique({ where: { id: u.userId }, select: { name: true, email: true } });
  const origin = process.env.NEXTAUTH_URL || new URL(req.url).origin;

  try {
    await emailTripPdf({
      to: [...new Set(input.data.to.map((e) => e.toLowerCase()))],
      sender: { name: user?.name ?? null, email: user?.email ?? null },
      note: input.data.note.trim(),
      trip: trip.trip,
      itinerary: trip.itinerary,
      link: trip.shareToken ? `${origin.replace(/\/$/, "")}/share/${trip.shareToken}` : undefined,
    });
  } catch (err) {
    const msg = (err as Error).message ?? "";
    console.error(`[trip-email] ${msg}`);
    // Resend's test sender (onboarding@resend.dev) only delivers to the Resend account's own address.
    if (/testing emails|verify a domain|own email/i.test(msg)) {
      return fail(503, "Email is in test mode: it can only go to the site owner's address until a sending domain is verified.");
    }
    return fail(502, "Couldn't send the email right now. Try again, or download the PDF instead.");
  }
  return NextResponse.json({ ok: true });
}
