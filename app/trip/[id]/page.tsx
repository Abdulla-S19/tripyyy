import type { Metadata } from "next";
import { TripView } from "./TripView";

export const metadata: Metadata = { title: "Your trip — TRIPYYY" };

export default async function TripPage({ params }: PageProps<"/trip/[id]">) {
  const { id } = await params;
  return (
    <main className="flex flex-1 flex-col">
      <TripView id={id} />
    </main>
  );
}
