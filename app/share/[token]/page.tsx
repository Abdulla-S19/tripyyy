import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getDb } from "@/lib/db";
import { findSharedTrip, toRecord } from "@/lib/trips-server";
import { SharedTrip } from "./SharedTrip";

export const dynamic = "force-dynamic";

const load = cache(async (token: string) => {
  if (!getDb()) return null;
  const trip = await findSharedTrip(token);
  return trip ? toRecord(trip) : null;
});

export async function generateMetadata({ params }: PageProps<"/share/[token]">): Promise<Metadata> {
  const record = await load((await params).token);
  if (!record) return { title: "Trip not found — TRIPYYY", robots: { index: false } };
  const it = record.itinerary;
  const description = `${record.trip.origin} → ${record.trip.destination} · ${it.days.length} days. ${it.summary}`.slice(0, 200);
  return {
    title: `${it.title} — TRIPYYY`,
    description,
    // Shared plans are private-ish: reachable by link, not listed by search engines.
    robots: { index: false, follow: false },
    openGraph: { title: it.title, description, type: "article" },
    twitter: { card: "summary_large_image", title: it.title, description },
  };
}

export default async function SharePage({ params }: PageProps<"/share/[token]">) {
  const record = await load((await params).token);
  if (!record) notFound();
  // Owner-only details never leave the server: no user id, and no revoke key exists on the record.
  return (
    <main className="flex flex-1 flex-col">
      <SharedTrip record={{ ...record, cloud: false, shareToken: null }} />
    </main>
  );
}
