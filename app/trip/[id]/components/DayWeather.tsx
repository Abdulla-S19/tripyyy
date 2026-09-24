import { TriangleAlert } from "lucide-react";
import { describeWeather, weatherWarning, type DayWeather } from "@/lib/weather";

/** Compact "☁ 31° / 24° · 60%" for the day header. "Typical" means last year's weather on this date. */
export function WeatherBadge({ w }: { w: DayWeather }) {
  const { label, icon: Icon } = describeWeather(w.code);
  const typical = w.source === "typical";
  const title = `${typical ? "Typical for this date (last year): " : "Forecast: "}${label}, high ${w.max}°C, low ${w.min}°C${
    w.rainChance != null ? `, ${w.rainChance}% chance of rain` : w.rainMm ? `, ${w.rainMm} mm rain` : ""
  }`;
  return (
    <span title={title} aria-label={title} className="inline-flex items-center gap-1 whitespace-nowrap">
      <Icon className="size-3.5 text-gold" aria-hidden />
      <span className="font-mono tabular-nums text-sand/90">
        {w.max}°<span className="text-slate">/{w.min}°</span>
      </span>
      {w.rainChance != null && w.rainChance >= 30 && <span className="font-mono tabular-nums text-dusk">{w.rainChance}%</span>}
      {typical && <span className="text-slate/80">typical</span>}
    </span>
  );
}

export function WeatherNote({ w }: { w: DayWeather }) {
  const warning = weatherWarning(w);
  const { label } = describeWeather(w.code);
  if (!warning && w.source === "forecast") return null;
  return (
    <p className="mx-2 mt-4 flex items-start gap-2 rounded-xl border border-hairline bg-surface/60 px-3 py-2 text-xs text-slate sm:mx-4">
      {warning && <TriangleAlert className="mt-px size-3.5 shrink-0 text-gold" aria-hidden />}
      <span>
        {warning && <span className="text-sand">{warning} </span>}
        {w.source === "typical" && (
          <>
            Last year on this date: {label.toLowerCase()}, {w.max}°/{w.min}°C. The real forecast shows up about two weeks before the trip.
          </>
        )}
      </span>
    </p>
  );
}
