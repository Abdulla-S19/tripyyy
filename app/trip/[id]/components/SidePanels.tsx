"use client";

import { Check, Lightbulb, Luggage, Star } from "lucide-react";
import { useState } from "react";
import { money } from "@/lib/trip-view";
import { cn } from "@/lib/utils";
import type { RentalSuggestion } from "@/types/itinerary";

export function RentalsPanel({ rentals, currency }: { rentals: RentalSuggestion[]; currency: string }) {
  if (rentals.length === 0) return null;
  return (
    <section className="glass print-avoid-break rounded-3xl p-6" aria-labelledby="rentals-title">
      <p id="rentals-title" className="eyebrow text-[0.65rem]">Well-reviewed rentals</p>
      <ul className="mt-4 space-y-2.5">
        {[...rentals]
          .sort((a, b) => b.rating - a.rating)
          .map((r) => (
            <li key={r.name + r.provider} className="rounded-2xl border border-hairline bg-ink/40 p-3.5 transition-colors hover:border-gold/30">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sand">{r.name}</p>
                  <p className="text-xs text-slate">
                    {r.provider} · {r.category} · {r.seats} seats
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="flex items-center justify-end gap-1 text-xs text-gold">
                    <Star className="size-3 fill-gold" /> {r.rating.toFixed(1)}
                  </p>
                  <p className="font-mono text-xs text-sand">{money(r.pricePerDay, currency)}/day</p>
                </div>
              </div>
              {r.why && <p className="mt-2 text-xs leading-relaxed text-slate">{r.why}</p>}
            </li>
          ))}
      </ul>
    </section>
  );
}

export function TipsPanel({ tips }: { tips: string[] }) {
  if (tips.length === 0) return null;
  return (
    <section className="glass print-avoid-break rounded-3xl p-6" aria-labelledby="tips-title">
      <p id="tips-title" className="eyebrow flex items-center gap-2 text-[0.65rem]">
        <Lightbulb className="size-3.5" /> Good to know
      </p>
      <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate">
        {tips.map((t) => (
          <li key={t} className="flex gap-2.5">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-gold" aria-hidden />
            {t}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PackingPanel({ items, tripId }: { items: string[]; tripId: string }) {
  const key = `tripyyy-packing-${tripId}`;
  // Only mounted client-side (the trip view waits for local storage), so reading here is safe.
  const [checked, setChecked] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "[]") as string[];
    } catch {
      return [];
    }
  });

  if (items.length === 0) return null;

  const toggle = (item: string) => {
    setChecked((c) => {
      const next = c.includes(item) ? c.filter((x) => x !== item) : [...c, item];
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <section className="glass print-avoid-break rounded-3xl p-6" aria-labelledby="packing-title">
      <div className="flex items-center justify-between">
        <p id="packing-title" className="eyebrow flex items-center gap-2 text-[0.65rem]">
          <Luggage className="size-3.5" /> Packing list
        </p>
        <span className="font-mono text-xs text-slate">
          {checked.filter((c) => items.includes(c)).length}/{items.length}
        </span>
      </div>
      <ul className="mt-4 space-y-1">
        {items.map((item) => {
          const on = checked.includes(item);
          return (
            <li key={item}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(item)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm transition-colors hover:bg-surface-2/60 focus-visible:outline-2 focus-visible:outline-gold"
              >
                <span className={cn("grid size-4.5 shrink-0 place-items-center rounded-md border transition-colors", on ? "border-gold bg-gold text-on-gold" : "border-slate/50")}>
                  {on && <Check className="size-3" />}
                </span>
                <span className={cn("transition-colors", on ? "text-slate line-through" : "text-sand")}>{item}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
