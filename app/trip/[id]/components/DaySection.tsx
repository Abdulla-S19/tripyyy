"use client";

import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ChevronDown, MapPin } from "lucide-react";
import { useRef } from "react";
import { dayLabel, dayTotal, money, toFocus, type MapFocus } from "@/lib/trip-view";
import { cn } from "@/lib/utils";
import type { DayWeather } from "@/lib/weather";
import type { ItineraryDay } from "@/types/itinerary";
import { ChangeDay, type ReplanState } from "./ChangeDay";
import { WeatherBadge, WeatherNote } from "./DayWeather";
import { TimelineItem } from "./TimelineItem";

/** Present only on the owner's view: shared pages are read-only. */
export type DayChange = {
  state: ReplanState;
  locked: boolean;
  onSubmit: (request: string) => void;
  onUndo: () => void;
  onDismiss: () => void;
};

export function DaySection({
  day,
  currency,
  open,
  onToggle,
  onFocus,
  active,
  weather,
  change,
}: {
  day: ItineraryDay;
  currency: string;
  open: boolean;
  onToggle: () => void;
  onFocus: (f: MapFocus) => void;
  active: boolean;
  weather?: DayWeather;
  change?: DayChange;
}) {
  const bodyId = `day-${day.day}-body`;

  return (
    <section id={`day-${day.day}`} data-day={day.day} className="scroll-mt-28" aria-labelledby={`day-${day.day}-title`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        className={cn(
          "group flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all duration-300 focus-visible:outline-2 focus-visible:outline-gold sm:px-5",
          active ? "border-gold/40 bg-gold/[0.06]" : "border-hairline bg-surface/60 hover:border-sand/15"
        )}
      >
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-2xl border text-center transition-colors",
            active ? "border-gold bg-gold text-on-gold shadow-glow-gold" : "border-gold/30 bg-ink text-gold"
          )}
        >
          <span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.14em] opacity-80">Day</span>
            <span className="block font-display text-lg leading-none">{day.day}</span>
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-xs text-slate">{dayLabel(day.date, { weekday: "long", day: "numeric", month: "long" })}</span>
          <span id={`day-${day.day}-title`} className="mt-0.5 block truncate font-display text-xl text-sand sm:text-2xl">
            {day.title}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate">
            <MapPin className="size-3 shrink-0" /> <span className="truncate">Night in {day.city} · {day.items.length} stops</span>
            {weather && (
              <>
                <span aria-hidden>·</span>
                <WeatherBadge w={weather} />
              </>
            )}
          </span>
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-xs text-slate">Day spend</span>
          <span className="block font-mono text-sand tabular-nums">{money(dayTotal(day), currency)}</span>
        </span>
        <ChevronDown className={cn("size-5 shrink-0 text-slate transition-transform duration-300 print:hidden", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={bodyId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            {weather && <WeatherNote w={weather} />}
            {day.summary && <p className="px-2 pt-4 text-sm text-slate sm:px-4">{day.summary}</p>}
            {change && <ChangeDay dayNo={day.day} {...change} />}
            <div aria-busy={change?.state.busy || undefined} className={cn("transition-opacity duration-300", change?.state.busy && "pointer-events-none opacity-40")}>
              <DayTimeline day={day} currency={currency} onFocus={onFocus} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function DayTimeline({ day, currency, onFocus }: { day: ItineraryDay; currency: string; onFocus: (f: MapFocus) => void }) {
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 75%", "end 60%"] });
  const line = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const rail = "absolute bottom-6 left-[calc(3rem+0.75rem+1rem)] top-8 w-px sm:left-[calc(3.5rem+1rem+1rem+0.5rem)]";

  return (
    <ol ref={listRef} className="relative space-y-3 px-0 pb-2 pt-5 sm:px-2">
      <span aria-hidden className={cn(rail, "bg-hairline")} />
      <motion.span
        aria-hidden
        style={{ scaleY: line }}
        className={cn(rail, "origin-top bg-gradient-to-b from-gold via-gold/70 to-gold/20 shadow-[0_0_8px_rgba(223,175,85,0.6)] print:hidden")}
      />
      {day.items.map((item, i) => (
        <TimelineItem key={`${item.time}-${i}`} item={item} index={i} currency={currency} onShowOnMap={() => onFocus(toFocus(item, `${day.day}-${i}`))} />
      ))}
    </ol>
  );
}
