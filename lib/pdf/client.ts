"use client";

import { createElement } from "react";
import type { TripFormValues } from "@/lib/trip-schema";
import { fileSlug } from "@/lib/trip-view";
import type { Itinerary } from "@/types/itinerary";

/**
 * Builds the trip PDF in the browser. The PDF library (~500 KB) is loaded on first use only,
 * so it never slows down the trip page itself.
 */
export async function buildTripPdf(trip: TripFormValues, itinerary: Itinerary, link?: string): Promise<File> {
  const [{ pdf }, { TripPdf, registerPdfFonts }] = await Promise.all([import("@react-pdf/renderer"), import("./TripPdf")]);
  registerPdfFonts(`${window.location.origin}/fonts/pdf/`);
  // pdf()'s typing wants a <Document> element; TripPdf renders one.
  const blob = await pdf(createElement(TripPdf, { trip, itinerary, link }) as Parameters<typeof pdf>[0]).toBlob();
  return new File([blob], `${fileSlug(itinerary.title)}.pdf`, { type: "application/pdf" });
}

/** True where the system share sheet accepts files (Android, iOS, Windows/macOS Chrome, Edge, Safari). */
export function canShareFiles() {
  try {
    return typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [new File([""], "trip.pdf", { type: "application/pdf" })] });
  } catch {
    return false;
  }
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
