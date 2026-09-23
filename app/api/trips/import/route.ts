import { NextResponse } from "next/server";
import { z } from "zod";
import { cloudUser, fail, readJson } from "@/lib/api";
import { createTrip, toRecord, tooLarge, tripPayload } from "@/lib/trips-server";

export const runtime = "nodejs";

const body = z.object({
  trips: z.array(tripPayload.extend({ localId: z.string().max(80) })).min(1).max(50),
});

/** Moves trips planned while signed out (kept in the browser) into the user's account. */
export async function POST(req: Request) {
  const u = await cloudUser();
  if ("error" in u) return u.error;
  const parsed = await readJson(req, body);
  if ("error" in parsed) return parsed.error;
  if (parsed.data.trips.some(tooLarge)) return fail(413, "One of those trips is too large to save.");

  const saved = [];
  for (const { localId, ...payload } of parsed.data.trips) {
    saved.push({ localId, trip: toRecord(await createTrip(u.userId, payload)) });
  }
  return NextResponse.json({ saved }, { status: 201 });
}
