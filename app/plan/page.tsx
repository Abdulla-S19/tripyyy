import type { Metadata } from "next";
import { TripBuilder } from "./components/TripBuilder";

export const metadata: Metadata = { title: "Plan a trip — TRIPYYY" };

export default function PlanPage() {
  return (
    <main className="flex flex-1 flex-col">
      <TripBuilder />
    </main>
  );
}
