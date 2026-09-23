"use client";

import { motion } from "framer-motion";
import {
  BedDouble,
  Bike,
  Bus,
  Camera,
  Car,
  Coffee,
  Footprints,
  Info,
  MapPin,
  Plane,
  Ship,
  Sparkles,
  TrainFront,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { durationLabel, hasCoords, kindColor, money } from "@/lib/trip-view";
import { cn } from "@/lib/utils";
import type { ItemKind, ItineraryItem } from "@/types/itinerary";

const KIND_ICON: Record<ItemKind, LucideIcon> = {
  transport: Bus,
  food: UtensilsCrossed,
  place: Camera,
  activity: Sparkles,
  stay: BedDouble,
  free: Coffee,
};

const KIND_LABEL: Record<ItemKind, string> = {
  transport: "Transport",
  food: "Food",
  place: "Sightseeing",
  activity: "Activity",
  stay: "Stay",
  free: "Free time",
};

const MODE_ICON: Partial<Record<ItineraryItem["mode"], LucideIcon>> = {
  train: TrainFront,
  "toy-train": TrainFront,
  metro: TrainFront,
  flight: Plane,
  car: Car,
  cab: Car,
  auto: Car,
  bike: Bike,
  walk: Footprints,
  boat: Ship,
};

export function TimelineItem({
  item,
  currency,
  index,
  onShowOnMap,
}: {
  item: ItineraryItem;
  currency: string;
  index: number;
  onShowOnMap?: () => void;
}) {
  const Icon = (item.kind === "transport" && MODE_ICON[item.mode]) || KIND_ICON[item.kind];
  const color = kindColor(item.kind);
  const mappable = hasCoords(item) && onShowOnMap;
  const duration = durationLabel(item.time, item.endTime);

  return (
    <motion.li
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="print-avoid-break relative grid grid-cols-[3rem_2rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[3.5rem_2rem_minmax(0,1fr)] sm:gap-x-4"
    >
      <div className="pt-3.5 text-right font-mono text-sm leading-tight text-sand tabular-nums">
        {item.time}
        {item.endTime && <span className="block text-[11px] text-slate">{item.endTime}</span>}
      </div>
      <span
        className="relative z-10 mt-2.5 grid size-8 place-items-center rounded-full border bg-ink"
        style={{ borderColor: color, color, boxShadow: `0 0 0 4px var(--surface), 0 0 14px ${color}55` }}
      >
        <Icon className="size-3.5" />
      </span>

      <article
        className={cn(
          "group rounded-2xl border border-hairline bg-ink/40 p-4 transition-[border-color,background-color,box-shadow,transform] duration-300",
          "hover:-translate-y-0.5 hover:border-sand/15 hover:bg-surface-2/70 hover:shadow-card"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate">
              {KIND_LABEL[item.kind]}
              {duration && <span className="ml-2 font-mono normal-case tracking-normal text-slate/80">{duration}</span>}
            </p>
            <h4 className="mt-1 font-medium leading-snug text-sand">{item.title}</h4>
          </div>
          <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 font-mono text-xs text-sand tabular-nums">{money(item.costPerPerson, currency)}</span>
        </div>

        {item.kind === "transport" && (item.from || item.to) && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-hairline bg-ink/50 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-sand">{item.from || "—"}</p>
              <p className="font-mono text-xs text-slate">{item.time}</p>
            </div>
            <div className="flex flex-1 items-center gap-1.5" aria-hidden>
              <span className="size-1.5 rounded-full" style={{ background: color }} />
              <span className="h-px flex-1 border-t border-dashed" style={{ borderColor: `${color}88` }} />
              <Icon className="size-3.5" style={{ color }} />
              <span className="h-px flex-1 border-t border-dashed" style={{ borderColor: `${color}88` }} />
              <span className="size-1.5 rounded-full" style={{ background: color }} />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <p className="truncate text-sm text-sand">{item.to || "—"}</p>
              <p className="font-mono text-xs text-slate">{item.endTime || "—"}</p>
            </div>
          </div>
        )}

        {item.detail && <p className="mt-2.5 text-sm leading-relaxed text-slate">{item.detail}</p>}

        {(item.operator || item.location) && (
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate">
            {item.operator && <span className="text-sand/80">{item.operator}</span>}
            {item.location && item.kind !== "transport" && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" /> {item.location}
              </span>
            )}
          </p>
        )}

        {item.bookingTip && (
          <p className="mt-3 flex gap-2 rounded-xl bg-gold/[0.07] px-3 py-2 text-xs leading-relaxed text-gold-soft">
            <Info className="mt-0.5 size-3.5 shrink-0" /> {item.bookingTip}
          </p>
        )}

        {(item.alternatives.length > 0 || mappable) && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {item.alternatives.map((a) => (
              <span key={a} className="rounded-full border border-hairline px-2.5 py-1 text-xs text-slate">
                or {a}
              </span>
            ))}
            {mappable && (
              <button
                type="button"
                onClick={onShowOnMap}
                className="ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-gold transition-colors hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-gold print:hidden"
              >
                <MapPin className="size-3" /> Show on map
              </button>
            )}
          </div>
        )}
      </article>
    </motion.li>
  );
}
