import { ImageResponse } from "next/og";
import { getDb } from "@/lib/db";
import { findSharedTrip, toRecord } from "@/lib/trips-server";
import { OgCard } from "@/lib/og-card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A trip planned with TRIPYYY";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const trip = getDb() ? await findSharedTrip(token) : null;
  if (!trip) return new ImageResponse(<OgCard title="Every road, already planned." kicker="TRIPYYY" />, size);
  const r = toRecord(trip);
  const route = [r.trip.origin, ...(r.trip.hasStops ? r.trip.waypoints.map((w) => w.city) : []), r.trip.destination];
  return new ImageResponse(
    <OgCard
      kicker="Shared itinerary"
      title={r.itinerary.title}
      route={route}
      meta={`${r.itinerary.days.length} days · ${r.trip.adults + r.trip.children} travelling`}
    />,
    size
  );
}
