import { NextResponse } from "next/server";
import { cloudUser, fail } from "@/lib/api";
import { requireDb } from "@/lib/db";
import { findOwnedTrip, newToken } from "@/lib/trips-server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** Turn on a public read-only link for one of the user's trips (idempotent). */
export async function POST(_req: Request, { params }: Ctx) {
  const u = await cloudUser();
  if ("error" in u) return u.error;
  const trip = await findOwnedTrip((await params).id, u.userId);
  if (!trip) return fail(404, "Trip not found.");
  if (trip.shareToken) return NextResponse.json({ shareToken: trip.shareToken });
  const updated = await requireDb().trip.update({ where: { id: trip.id }, data: { shareToken: newToken(), sharedAt: new Date() } });
  return NextResponse.json({ shareToken: updated.shareToken });
}

/** Stop sharing: the old link stops working immediately. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const u = await cloudUser();
  if ("error" in u) return u.error;
  const { count } = await requireDb().trip.updateMany({
    where: { id: (await params).id, userId: u.userId },
    data: { shareToken: null, sharedAt: null },
  });
  if (!count) return fail(404, "Trip not found.");
  return new NextResponse(null, { status: 204 });
}
