import { ImageResponse } from "next/og";
import { OgCard } from "@/lib/og-card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TRIPYYY — every road, already planned";

export default function Image() {
  return new ImageResponse(
    <OgCard kicker="AI trip planner for India" title="Every road, already planned." route={["Trivandrum", "Kozhikode", "Ooty"]} meta="Buses, trains, food stops and budget — hour by hour" />,
    size
  );
}
