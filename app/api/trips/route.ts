import { NextResponse } from "next/server";
import { cloudUser, fail, readJson } from "@/lib/api";
import { createTrip, listTrips, toRecord, tooLarge, tripPayload } from "@/lib/trips-server";

export const runtime = "nodejs";

/** The signed-in user's saved trips, newest first. */
export async function GET() {
  const u = await cloudUser();
  if ("error" in u) return u.error;
  const trips = await listTrips(u.userId);
  return NextResponse.json({ trips: trips.map(toRecord) });
}

/** Save a freshly generated trip to the signed-in user's account. */
export async function POST(req: Request) {
  const u = await cloudUser();
  if ("error" in u) return u.error;
  const body = await readJson(req, tripPayload);
  if ("error" in body) return body.error;
  if (tooLarge(body.data)) return fail(413, "That trip is too large to save.");
  const trip = await createTrip(u.userId, body.data);
  return NextResponse.json({ trip: toRecord(trip) }, { status: 201 });
}
