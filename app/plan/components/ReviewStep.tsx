"use client";

import { ArrowRight, Pencil, RotateCcw, Sparkles } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { LEG_MODES, MOODS, RENTAL_CARS, TRANSPORT_MODES, formatMoney, travelStyleOf } from "@/lib/trip-options";
import { tripLegs, tripNights, type TripFormValues } from "@/lib/trip-schema";
import { StepHeader } from "./StepHeader";

const longDate = (iso: string) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "—";

export function ReviewStep({ onEdit, onStartOver }: { onEdit: (step: number) => void; onStartOver: () => void }) {
  const { control } = useFormContext<TripFormValues>();
  const v = useWatch({ control }) as TripFormValues;
  const nights = tripNights(v);
  const legs = tripLegs(v);
  const travellers = v.adults + v.children;
  const mode = TRANSPORT_MODES.find((m) => m.id === v.transport);
  const car = RENTAL_CARS.find((c) => c.id === v.rental.carId);
  const stops = v.hasStops ? v.waypoints : [];

  return (
        <div>
          <StepHeader eyebrow="Step 5 · Review" title="Does this look right?" lead="Check the details, then we'll build the full hour-by-hour plan." />

          <div className="mt-8 divide-y divide-hairline rounded-2xl border border-hairline bg-ink/40">
            <Section title="Route" onEdit={() => onEdit(0)}>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sand">
                {[v.origin, ...stops.map((s) => `${s.city} (${s.nights === 0 ? "pass through" : `${s.nights}n`})`), v.destination].map((c, i, arr) => (
                  <span key={i} className="flex items-center gap-2">
                    {c}
                    {i < arr.length - 1 && <ArrowRight className="size-3.5 text-gold" />}
                  </span>
                ))}
              </p>
            </Section>
            {(v.sideTrips?.length ?? 0) > 0 && (
              <Section title={`Day trips from ${v.destination}`} onEdit={() => onEdit(0)}>
                <p className="text-sand">{v.sideTrips.join(" · ")}</p>
              </Section>
            )}
            <Section title="Schedule" onEdit={() => onEdit(1)}>
              <p className="text-sand">
                Leave {longDate(v.departDate)} at <span className="font-mono">{v.departTime}</span>
              </p>
              <p className="text-sm text-slate">
                {v.tripType === "round"
                  ? `Back in ${v.returnTo.trim() || v.origin} on ${longDate(v.returnDate)}${v.returnBy ? ` by ${v.returnBy}` : ""} · ${nights.total} nights`
                  : `One way · ${nights.destinationNights} nights in ${v.destination}`}
              </p>
            </Section>
            <Section title="People & vibe" onEdit={() => onEdit(2)}>
              <p className="text-sand">
                {v.adults} adult{v.adults === 1 ? "" : "s"}
                {v.children > 0 && `, ${v.children} child${v.children === 1 ? "" : "ren"}`} · {formatMoney(v.budget, v.currency)} per person ·{" "}
                <span className="text-gold-soft">{travelStyleOf(v.travelStyle).label}</span>
              </p>
              <p className="text-sm text-slate">
                {[...MOODS.filter((m) => v.moods.includes(m.id)).map((m) => m.label), ...(v.customMoods ?? [])].join(" · ")}
              </p>
            </Section>
            <Section title="Transport" onEdit={() => onEdit(3)}>
              <p className="text-sand">
                {mode?.label}
                {v.transport === "rental" && ` · ${v.rental.driveType === "self" ? "self-drive" : "with a driver"} · ${car?.name ?? "TRIPYYY picks the car"}`}
                {v.transport === "own" && ` · ${v.ownVehicle === "bike" ? "my bike" : "my car"}`}
                {v.transport === "local" && " · trains or buses, then bike taxis, autos and cabs"}
              </p>
              {(v.transport === "rental" || (v.transport === "mix" && v.legModes.includes("rental"))) && (
                <p className="text-sm text-slate">
                  Car: pick up in {v.rental.pickup?.trim() || "the first rental stop"} ·{" "}
                  {v.rental.dropoff === "suggest" ? "TRIPYYY suggests the drop city" : v.rental.dropoff?.trim() ? `drop in ${v.rental.dropoff}` : "return to the same place"}
                </p>
              )}
              {v.transport === "mix" && (
                <ul className="mt-1 space-y-0.5 text-sm text-slate">
                  {legs.map((l, i) => (
                    <li key={i}>
                      {l.from} → {l.to}: <span className="text-sand">{LEG_MODES.find((m) => m.id === v.legModes[i])?.label ?? "—"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate">
            <p className="flex items-center gap-2">
              <Sparkles className="size-4 text-gold" />
              Group budget {formatMoney(v.budget * travellers, v.currency)} across {nights.total + 1} day{nights.total === 0 ? "" : "s"}.
            </p>
            <button
              type="button"
              onClick={onStartOver}
              className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-slate transition-colors hover:text-sand focus-visible:outline-2 focus-visible:outline-gold"
            >
              <RotateCcw className="size-3.5" /> Start over
            </button>
          </div>
        </div>
  );
}

function Section({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0 space-y-1">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate">{title}</p>
        {children}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-gold transition-colors hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-gold"
      >
        <Pencil className="size-3" /> Edit
      </button>
    </div>
  );
}
