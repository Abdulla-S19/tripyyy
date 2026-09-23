import { NextResponse } from "next/server";
import { cloudUser, fail } from "@/lib/api";
import { requireDb } from "@/lib/db";
import { findOwnedTrip, toRecord } from "@/lib/trips-server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const u = await cloudUser();
  if ("error" in u) return u.error;
  const trip = await findOwnedTrip((await params).id, u.userId);
  if (!trip) return fail(404, "Trip not found.");
  return NextResponse.json({ trip: toRecord(trip) });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const u = await cloudUser();
  if ("error" in u) return u.error;
  const { count } = await requireDb().trip.deleteMany({ where: { id: (await params).id, userId: u.userId } });
  if (!count) return fail(404, "Trip not found.");
  return new NextResponse(null, { status: 204 });
}
