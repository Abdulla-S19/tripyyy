import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { getDb } from "@/lib/db";
import { findSharedTrip, hashKey } from "@/lib/trips-server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ token: string }> };

/** Delete a guest's shared snapshot using the revoke key their browser kept. */
export async function DELETE(req: Request, { params }: Ctx) {
  const db = getDb();
  if (!db) return fail(503, "Share links aren't set up on this server yet.");
  const key = req.headers.get("x-revoke-key") ?? "";
  const trip = await findSharedTrip((await params).token);
  if (!trip || trip.userId || !trip.revokeHash || !key) return fail(404, "Share link not found.");

  const a = Buffer.from(trip.revokeHash, "hex");
  const b = Buffer.from(hashKey(key), "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return fail(403, "That key can't stop this share link.");

  await db.trip.delete({ where: { id: trip.id } });
  return new NextResponse(null, { status: 204 });
}
