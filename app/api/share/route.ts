import { NextResponse } from "next/server";
import { fail, readJson } from "@/lib/api";
import { getDb } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createTrip, hashKey, newToken, tooLarge, tripPayload } from "@/lib/trips-server";

export const runtime = "nodejs";

/**
 * Share a trip without an account: stores an ownerless snapshot behind a random link.
 * The returned revokeKey stays on the guest's device and is the only way to delete it.
 */
export async function POST(req: Request) {
  if (!getDb()) return fail(503, "Share links aren't set up on this server yet.");
  const limit = await rateLimit(`share:${clientIp(req.headers)}`, 20, 60 * 60 * 1000);
  if (!limit.ok) return fail(429, "Too many share links this hour. Try again later.");

  const body = await readJson(req, tripPayload);
  if ("error" in body) return body.error;
  if (tooLarge(body.data)) return fail(413, "That trip is too large to share.");

  const shareToken = newToken();
  const revokeKey = newToken(24);
  await createTrip(null, body.data, { shareToken, sharedAt: new Date(), revokeHash: hashKey(revokeKey) });
  return NextResponse.json({ shareToken, revokeKey }, { status: 201 });
}
