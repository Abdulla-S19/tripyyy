import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import type { Prisma, Trip } from "@/generated/prisma/client";
import { withTripDefaults, type TripFormValues } from "@/lib/trip-schema";
import { itinerarySchema, type Itinerary } from "@/types/itinerary";
import { requireDb } from "./db";

/** Shape shared with the client store (store/itinerary-store.ts). */
export type TripRecord = {
  id: string;
  trip: TripFormValues;
  itinerary: Itinerary;
  provider: string;
  model: string;
  createdAt: string;
  shareToken?: string | null;
  cloud?: boolean;
};

// Saved trips keep the answers as given; the strict form rules (e.g. "date not in the past")
// only apply when planning, so an old trip must still be storable.
const tripInput = z.looseObject({ origin: z.string().min(1).max(60), destination: z.string().min(1).max(60) });

export const tripPayload = z.object({
  trip: tripInput,
  itinerary: itinerarySchema,
  provider: z.string().max(40).default("unknown"),
  model: z.string().max(80).default("unknown"),
});
export type TripPayload = z.infer<typeof tripPayload>;

const MAX_BYTES = 300_000;
export const tooLarge = (p: unknown) => JSON.stringify(p).length > MAX_BYTES;

export const newToken = (bytes = 16) => randomBytes(bytes).toString("base64url");
export const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");

export function toRecord(t: Trip): TripRecord {
  return {
    id: t.id,
    trip: withTripDefaults(t.input as unknown as TripFormValues),
    itinerary: t.itinerary as unknown as Itinerary,
    provider: t.provider,
    model: t.model,
    createdAt: t.createdAt.toISOString(),
    shareToken: t.shareToken,
    cloud: true,
  };
}

function columns(p: TripPayload) {
  const days = p.itinerary.days;
  return {
    title: p.itinerary.title.slice(0, 160),
    origin: p.trip.origin,
    destination: p.trip.destination,
    startDate: days[0]?.date ?? "",
    days: days.length,
    input: p.trip as unknown as Prisma.InputJsonValue,
    itinerary: p.itinerary as unknown as Prisma.InputJsonValue,
    provider: p.provider,
    model: p.model,
  };
}

export async function createTrip(userId: string | null, p: TripPayload, extra: Partial<Pick<Trip, "shareToken" | "sharedAt" | "revokeHash">> = {}) {
  return requireDb().trip.create({ data: { ...columns(p), userId, ...extra } });
}

export const listTrips = (userId: string) =>
  requireDb().trip.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 200 });

export const findOwnedTrip = (id: string, userId: string) => requireDb().trip.findFirst({ where: { id, userId } });

export const findSharedTrip = (token: string) =>
  token.length > 10 && token.length < 64 ? requireDb().trip.findUnique({ where: { shareToken: token } }) : Promise.resolve(null);
