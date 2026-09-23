"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { BUDGET_CATEGORIES, dayLabel, dayTotal, money } from "@/lib/trip-view";
import { cn } from "@/lib/utils";
import type { Itinerary } from "@/types/itinerary";

export function BudgetPanel({ itinerary, budget, currency, travellers }: { itinerary: Itinerary; budget: number; currency: string; travellers: number }) {
  const b = itinerary.budget;
  const total = b.totalPerPerson;
  const over = total > budget;
  const parts = BUDGET_CATEGORIES.map((c) => ({ ...c, value: b[c.key] })).filter((p) => p.value > 0);
  const scale = Math.max(total, budget);

  return (
    <section className="glass print-avoid-break rounded-3xl p-6" aria-labelledby="budget-title">
      <p id="budget-title" className="eyebrow text-[0.65rem]">Budget per person</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-mono text-4xl text-sand tabular-nums">{money(total, currency)}</p>
        <p className="pb-1 text-right text-xs text-slate">
          Group total
          <span className="block font-mono text-sm text-sand">{money(total * travellers, currency)}</span>
        </p>
      </div>

      {/* Parts of the whole, scaled against the planned budget. */}
      <div className="relative mt-5">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink/70" role="img" aria-label={`Spend split: ${parts.map((p) => `${p.label} ${money(p.value, currency)}`).join(", ")}`}>
          {parts.map((p, i) => (
            <motion.span
              key={p.key}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ background: p.color, marginRight: i < parts.length - 1 ? 2 : 0 }}
              initial={{ width: 0 }}
              animate={{ width: `${(p.value / scale) * 100}%` }}
              transition={{ duration: 1, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}
        </div>
        <span
          aria-hidden
          className="absolute -top-1.5 h-6 w-0.5 rounded-full bg-sand"
          style={{ left: `calc(${(budget / scale) * 100}% - 1px)` }}
        />
        <p className="mt-2 text-right font-mono text-[11px] text-slate">Budget {money(budget, currency)}</p>
      </div>

      <ul className="mt-4 space-y-2.5 text-sm">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate">
              <span className="size-2.5 rounded-sm" style={{ background: p.color }} aria-hidden />
              {p.label}
            </span>
            <span className="font-mono text-sand tabular-nums">
              {money(p.value, currency)} <span className="text-xs text-slate">{Math.round((p.value / total) * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>

      <p className={cn("mt-5 flex gap-2 rounded-2xl px-4 py-3 text-sm", over ? "bg-destructive/10 text-destructive" : "bg-jade/10 text-jade")}>
        {over ? <AlertTriangle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
        <span>
          <span className="font-medium">{over ? `${money(total - budget, currency)} over budget.` : `${money(budget - total, currency)} under budget.`}</span>{" "}
          {b.note}
        </span>
      </p>

      <DaySpend itinerary={itinerary} currency={currency} />
    </section>
  );
}

function DaySpend({ itinerary, currency }: { itinerary: Itinerary; currency: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const totals = itinerary.days.map(dayTotal);
  const max = Math.max(...totals, 1);
  const H = 96;

  return (
    <div className="mt-7">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate">Spend by day</p>
      <div className="relative mt-3" onMouseLeave={() => setHover(null)}>
        <div className="flex items-end gap-1.5 border-b border-hairline" style={{ height: H }}>
          {totals.map((t, i) => (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`Day ${i + 1}: ${money(t, currency)}`}
              className="group relative flex h-full flex-1 items-end focus-visible:outline-none"
            >
              <motion.span
                className={cn("block w-full rounded-t-[4px] transition-colors", hover === i ? "bg-gold-soft" : "bg-gold/70")}
                initial={{ height: 0 }}
                whileInView={{ height: `${(t / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              />
            </button>
          ))}
        </div>
        <div className="mt-1.5 flex gap-1.5">
          {totals.map((_, i) => (
            <span key={i} className={cn("flex-1 text-center font-mono text-[10px]", hover === i ? "text-sand" : "text-slate")}>
              D{i + 1}
            </span>
          ))}
        </div>
        {hover !== null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-hairline bg-surface-2 px-2.5 py-1.5 text-xs shadow-card"
            style={{ left: `${((hover + 0.5) / totals.length) * 100}%` }}
          >
            <p className="text-slate">Day {hover + 1} · {dayLabel(itinerary.days[hover].date)}</p>
            <p className="font-mono text-sand">{money(totals[hover], currency)}</p>
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>Spend per person by day</caption>
        <tbody>
          {totals.map((t, i) => (
            <tr key={i}>
              <th scope="row">Day {i + 1}</th>
              <td>{money(t, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
