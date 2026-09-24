"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Crown, Gem, Lightbulb, PiggyBank, Scale, type LucideIcon } from "lucide-react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { CURRENCIES, MOODS, TRAVEL_STYLES, currencyOf, formatMoney, travelStyleOf, type CurrencyId, type MoodId, type TravelStyleId } from "@/lib/trip-options";
import { tripNights, type TripFormValues } from "@/lib/trip-schema";
import { cn } from "@/lib/utils";
import { CustomMoods } from "./CustomMoods";
import { Field, FieldError, Stepper, inputClass } from "./fields";
import { StepHeader } from "./StepHeader";

const START_BUDGET: Record<CurrencyId, number> = { INR: 8000, USD: 150, EUR: 140, AED: 550 };

const STYLE_ICONS: Record<TravelStyleId, LucideIcon> = { budget: PiggyBank, balanced: Scale, premium: Gem, luxury: Crown };

export function PeopleStep() {
  const { control, setValue, formState, trigger } = useFormContext<TripFormValues>();
  const [adults, children, budget, currency, destination] = useWatch({
    control,
    name: ["adults", "children", "budget", "currency", "destination"],
  });
  const errors = formState.errors;
  const c = currencyOf(currency);
  const travellers = adults + children;

  // A nudge (never a block) when the budget can't really cover the chosen style. INR only: the thresholds are rupees.
  const all = useWatch({ control }) as TripFormValues;
  const style = travelStyleOf(all.travelStyle);
  const days = tripNights(all).total + 1;
  const perDay = Number.isFinite(budget) ? budget / days : 0;
  const cheaper = [...TRAVEL_STYLES].reverse().find((s) => perDay >= s.minPerDay * 0.7);
  const styleHint =
    currency === "INR" && style.id !== "budget" && perDay > 0 && perDay < style.minPerDay * 0.7
      ? `About ${formatMoney(Math.round(perDay), "INR")} a day each is tight for ${style.label}. We'll stay within your budget and note any downgrades${
          cheaper && cheaper.id !== style.id ? `, or pick ${cheaper.label} for a plan that fits comfortably` : ""
        }.`
      : null;
  const pct = Math.min(Math.max(((budget || 0) - c.min) / (c.max - c.min), 0), 1) * 100;

  return (
    <div>
      <StepHeader
        eyebrow="Step 3 · People & vibe"
        title="Who's coming, and what's the mood?"
        lead={`This shapes everything — the seats we book, the places we pick in ${destination || "your destination"}, and how far the money goes.`}
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field label="Adults" htmlFor="adults" hint="13+ years" error={errors.adults?.message}>
          <Controller
            control={control}
            name="adults"
            render={({ field }) => <Stepper id="adults" value={field.value} onChange={field.onChange} min={1} max={20} label="adults" />}
          />
        </Field>
        <Field label="Children" htmlFor="children" hint="2–12 years" error={errors.children?.message}>
          <Controller
            control={control}
            name="children"
            render={({ field }) => <Stepper id="children" value={field.value} onChange={field.onChange} min={0} max={10} label="children" />}
          />
        </Field>
      </div>

      <div data-field className="mt-9">
        <div className="flex items-baseline justify-between">
          <p id="moods-label" className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate">
            Trip mood
          </p>
          <span className="text-xs text-slate/80">Pick as many as you like, or add your own</span>
        </div>
        <Controller
          control={control}
          name="moods"
          render={({ field }) => (
            <div role="group" aria-labelledby="moods-label" className="mt-3 flex flex-wrap gap-2.5">
              {MOODS.map((m, i) => {
                const on = field.value.includes(m.id);
                const Icon = m.icon;
                const toggle = () => {
                  const next: MoodId[] = on ? field.value.filter((x) => x !== m.id) : [...field.value, m.id];
                  field.onChange(next);
                  if (errors.moods) void trigger("moods");
                };
                return (
                  <motion.button
                    key={m.id}
                    id={`mood-${m.id}`}
                    type="button"
                    aria-pressed={on}
                    onClick={toggle}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * i }}
                    whileTap={{ scale: 0.93 }}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                      on
                        ? "border-gold/70 bg-gold/15 text-gold-soft shadow-glow-gold"
                        : "border-hairline bg-ink/50 text-slate hover:border-gold/30 hover:text-sand"
                    )}
                  >
                    {on ? <Check className="size-4" /> : <Icon className="size-4" />}
                    {m.label}
                  </motion.button>
                );
              })}
              <Controller
                control={control}
                name="customMoods"
                render={({ field: custom }) => (
                  <CustomMoods
                    value={custom.value ?? []}
                    onChange={(v) => {
                      custom.onChange(v);
                      if (errors.moods) void trigger("moods");
                    }}
                  />
                )}
              />
            </div>
          )}
        />
        <div className="mt-2">
          <FieldError message={errors.moods?.message ?? errors.customMoods?.message} />
        </div>
      </div>

      <div className="mt-9">
        <div className="flex items-baseline justify-between">
          <p id="style-label" className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate">
            Travel style
          </p>
          <span className="text-xs text-slate/80">Decides train class, stays and food</span>
        </div>
        <Controller
          control={control}
          name="travelStyle"
          render={({ field }) => (
            <div role="radiogroup" aria-labelledby="style-label" className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {TRAVEL_STYLES.map((s, i) => {
                const on = (field.value ?? "balanced") === s.id;
                const Icon = STYLE_ICONS[s.id];
                return (
                  <motion.button
                    key={s.id}
                    id={`style-${s.id}`}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => field.onChange(s.id)}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative flex items-start gap-3 rounded-2xl border p-4 text-left transition-[border-color,background-color,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-gold",
                      on ? "border-gold/60 bg-gold/[0.08] shadow-glow-gold" : "border-hairline bg-ink/40 hover:border-sand/20"
                    )}
                  >
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl border transition-colors", on ? "border-gold bg-gold text-on-gold" : "border-hairline bg-surface-2 text-slate")}>
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-sand">{s.label}</span>
                        <span className="flex gap-0.5" aria-hidden>
                          {Array.from({ length: 4 }, (_, k) => (
                            <span key={k} className={cn("size-1 rounded-full", k <= i ? "bg-gold" : "bg-sand/15")} />
                          ))}
                        </span>
                      </span>
                      <span className="block text-xs text-gold-soft/80">{s.tagline}</span>
                      <span className="mt-1 block text-xs leading-snug text-slate">{s.detail}</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        />
        <AnimatePresence initial={false}>
          {styleHint && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex items-start gap-2 overflow-hidden rounded-xl bg-gold/[0.07] px-3.5 py-2.5 text-xs leading-relaxed text-gold-soft"
            >
              <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
              {styleHint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-9 rounded-2xl border border-hairline bg-ink/40 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <label htmlFor="budget" className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate">
              Budget per person
            </label>
            <div className="mt-2 flex items-center gap-2">
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <select
                    id="currency"
                    aria-label="Currency"
                    value={field.value}
                    onChange={(e) => {
                      const next = e.target.value as CurrencyId;
                      field.onChange(next);
                      setValue("budget", START_BUDGET[next], { shouldValidate: formState.isSubmitted });
                    }}
                    className={cn(inputClass(), "w-24 cursor-pointer px-3 font-mono")}
                  >
                    {CURRENCIES.map((cur) => (
                      <option key={cur.id} value={cur.id} className="bg-surface-2">
                        {cur.id}
                      </option>
                    ))}
                  </select>
                )}
              />
              <Controller
                control={control}
                name="budget"
                render={({ field, fieldState }) => (
                  <input
                    id="budget"
                    type="number"
                    inputMode="numeric"
                    min={c.min}
                    step={c.step}
                    value={Number.isFinite(field.value) ? field.value : ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? Number.NaN : e.target.valueAsNumber)}
                    onBlur={field.onBlur}
                    aria-invalid={!!fieldState.error || undefined}
                    className={cn(inputClass(!!fieldState.error), "w-40 font-mono text-lg")}
                  />
                )}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate">
              Group total · {travellers} {travellers === 1 ? "person" : "people"}
            </p>
            <motion.p key={budget * travellers} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="font-mono text-2xl text-gold tabular-nums">
              {Number.isFinite(budget) ? formatMoney(budget * travellers, currency) : "—"}
            </motion.p>
          </div>
        </div>

        <input
          id="budget-slider"
          type="range"
          aria-label="Budget per person slider"
          min={c.min}
          max={c.max}
          step={c.step}
          value={Math.min(Math.max(budget || c.min, c.min), c.max)}
          onChange={(e) =>
            setValue("budget", e.target.valueAsNumber, { shouldDirty: true, shouldValidate: formState.isSubmitted || !!errors.budget })
          }
          className="range-gold mt-6 w-full"
          style={{ ["--pct" as string]: `${pct}%` }}
        />
        <div className="mt-2 flex justify-between font-mono text-xs text-slate">
          <span>{formatMoney(c.min, currency)}</span>
          <span>{formatMoney(c.max, currency)}+</span>
        </div>
        <div className="mt-2">
          <FieldError message={errors.budget?.message} />
        </div>
      </div>
    </div>
  );
}
