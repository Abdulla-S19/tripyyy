"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Users, Wallet } from "lucide-react";
import { useWatch, useFormContext } from "react-hook-form";
import { MOODS, RENTAL_CARS, TRANSPORT_MODES, customMoodIcon, formatMoney, travelStyleOf } from "@/lib/trip-options";
import { tripNights, type TripFormValues } from "@/lib/trip-schema";

const shortDate = (iso: string) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";

export function TripTicket() {
  const { control } = useFormContext<TripFormValues>();
  const v = useWatch({ control }) as TripFormValues;
  const stops = v.hasStops ? v.waypoints.filter((w) => w.city.trim()) : [];
  const chain = [
    { city: v.origin || "Start", kind: "start" as const, nights: 0 },
    ...stops.map((w) => ({ city: w.city, kind: "stop" as const, nights: w.nights })),
    { city: v.destination || "Destination", kind: "end" as const, nights: tripNights(v).destinationNights },
  ];
  const nights = tripNights(v);
  const mode = TRANSPORT_MODES.find((m) => m.id === v.transport);
  const car = v.transport === "rental" ? RENTAL_CARS.find((c) => c.id === v.rental.carId) : undefined;
  const moods = [
    ...MOODS.filter((m) => v.moods.includes(m.id)).map((m) => ({ id: m.id, label: m.label, icon: m.icon })),
    ...(v.customMoods ?? []).map((label) => ({ id: `custom-${label}`, label, icon: customMoodIcon(label) })),
  ];
  const ModeIcon = mode?.icon;

  return (
    <aside aria-label="Trip summary" className="glass relative overflow-hidden rounded-3xl p-6 shadow-card">
      <div aria-hidden className="absolute -right-20 -top-20 size-56 rounded-full bg-gold/10 blur-3xl" />
      <p className="eyebrow text-[0.65rem]">Your trip so far</p>

      <ol className="relative mt-5 space-y-4">
        <span aria-hidden className="absolute bottom-2 left-[5px] top-2 w-px bg-gradient-to-b from-sand/40 via-gold/50 to-gold" />
        <AnimatePresence initial={false}>
          {chain.map((c, i) => (
            <motion.li
              key={`${c.kind}-${i}`}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="relative flex items-center justify-between gap-3 pl-6"
            >
              <span
                aria-hidden
                className={
                  "absolute left-0 size-[11px] rounded-full border-2 " +
                  (c.kind === "end" ? "border-gold bg-gold shadow-glow-gold" : c.kind === "start" ? "border-sand bg-ink" : "border-gold/70 bg-ink")
                }
              />
              <span className={"truncate " + (c.city === "Start" || c.city === "Destination" ? "text-slate/70" : "font-medium text-sand")}>
                {c.city}
              </span>
              {c.kind !== "start" && (
                <span className="shrink-0 font-mono text-xs text-slate">
                  {c.nights === 0 ? "pass" : `${c.nights}n`}
                </span>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>

      {(v.sideTrips?.length ?? 0) > 0 && (
        <p className="mt-3 pl-6 text-xs leading-relaxed text-slate">
          <span className="text-gold-soft/90">Day trips:</span> {v.sideTrips.join(" · ")}
        </p>
      )}

      <div className="my-5 flex items-center gap-2" aria-hidden>
        <span className="-ml-9 size-5 rounded-full bg-ink" />
        <span className="h-px flex-1 border-t border-dashed border-hairline" />
        <span className="-mr-9 size-5 rounded-full bg-ink" />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
        <Item icon={<CalendarDays className="size-3.5" />} label="Dates">
          {shortDate(v.departDate)} <span className="text-slate">{v.departTime}</span>
          {v.tripType === "round" && (
            <>
              {" "}
              → {shortDate(v.returnDate)}
              {v.returnBy && <span className="text-slate"> by {v.returnBy}</span>}
            </>
          )}
        </Item>
        <Item label="Nights">{nights.total}</Item>
        <Item icon={<Users className="size-3.5" />} label="Travellers">
          {v.adults} adult{v.adults === 1 ? "" : "s"}
          {v.children > 0 && `, ${v.children} kid${v.children === 1 ? "" : "s"}`}
        </Item>
        <Item icon={<Wallet className="size-3.5" />} label="Per person">
          {Number.isFinite(v.budget) ? formatMoney(v.budget, v.currency) : "—"}
          <span className="block text-xs font-normal text-gold-soft/80">{travelStyleOf(v.travelStyle).label}</span>
        </Item>
        <Item label="Transport" wide>
          <span className="flex items-center gap-2">
            {ModeIcon && <ModeIcon className="size-4 text-gold" />}
            {mode?.label}
            {car && <span className="truncate text-slate">· {car.name}</span>}
            {v.transport === "rental" && <span className="text-slate">· {v.rental.driveType === "self" ? "self-drive" : "with driver"}</span>}
            {v.transport === "own" && <span className="text-slate">· {v.ownVehicle === "bike" ? "my bike" : "my car"}</span>}
          </span>
        </Item>
      </dl>

      <div className="mt-5 flex min-h-8 flex-wrap gap-1.5">
        <AnimatePresence initial={false}>
          {moods.map((m) => {
            const Icon = m.icon;
            return (
              <motion.span
                key={m.id}
                layout
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs text-gold-soft"
              >
                <Icon className="size-3" />
                {m.label}
              </motion.span>
            );
          })}
        </AnimatePresence>
        {moods.length === 0 && <span className="text-xs text-slate/70">Moods will appear here</span>}
      </div>
    </aside>
  );
}

function Item({ label, icon, children, wide }: { label: string; icon?: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="flex items-center gap-1.5 text-xs text-slate">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-sand">{children}</dd>
    </div>
  );
}
