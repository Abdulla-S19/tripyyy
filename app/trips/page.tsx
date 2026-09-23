import type { Metadata } from "next";
import { TripsList } from "./TripsList";

export const metadata: Metadata = { title: "My trips — TRIPYYY" };

export default function TripsPage() {
  return (
    <main className="flex flex-1 flex-col">
      <TripsList />
    </main>
  );
}
