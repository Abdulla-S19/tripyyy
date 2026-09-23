"use client";

import { TripDocument } from "@/app/trip/[id]/TripView";
import type { SavedTrip } from "@/store/itinerary-store";

export function SharedTrip({ record }: { record: SavedTrip }) {
  return <TripDocument saved={record} mode="shared" />;
}
