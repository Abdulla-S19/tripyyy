import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { cloudUser, fail, readJson } from "@/lib/api";
import { requireDb } from "@/lib/db";
import { findOwnedTrip, tooLarge, toRecord } from "@/lib/trips-server";
import { itinerarySchema } from "@/types/itinerary";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const u = await cloudUser();
  if ("error" in u) return u.error;
  const trip = await findOwnedTrip((await params).id, u.userId);
  if (!trip) return fail(404, "Trip not found.");
  return NextResponse.json({ trip: toRecord(trip) });
}

/** Saves an edited itinerary (e.g. after re-planning one day). Share links show the change at once. */
export async function PATCH(req: Request, { params }: Ctx) {
  const u = await cloudUser();
  if ("error" in u) return u.error;
  const input = await readJson(req, z.object({ itinerary: itinerarySchema }));
  if ("error" in input) return input.error;
  if (tooLarge(input.data)) return fail(413, "That trip is too large to save.");
  const { itinerary } = input.data;
  const { count } = await requireDb().trip.updateMany({
    where: { id: (await params).id, userId: u.userId },
    data: {
      itinerary: itinerary as unknown as Prisma.InputJsonValue,
      title: itinerary.title.slice(0, 160),
      days: itinerary.days.length,
      startDate: itinerary.days[0]?.date ?? "",
    },
  });
  if (!count) return fail(404, "Trip not found.");
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const u = await cloudUser();
  if ("error" in u) return u.error;
  const { count } = await requireDb().trip.deleteMany({ where: { id: (await params).id, userId: u.userId } });
  if (!count) return fail(404, "Trip not found.");
  return new NextResponse(null, { status: 204 });
}
