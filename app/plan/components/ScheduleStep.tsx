"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock, Moon, Repeat, Sunrise, Sun, Sunset, Undo2 } from "lucide-react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { addDays, todayISO, tripNights, type TripFormValues } from "@/lib/trip-schema";
import { cn } from "@/lib/utils";
import { CityCombobox } from "./CityCombobox";
import { Field, Segmented, Stepper, inputClass } from "./fields";
import { StepHeader } from "./StepHeader";

const presets = [
  { time: "05:30", label: "Dawn", icon: Sunrise },
  { time: "09:00", label: "Morning", icon: Sun },
  { time: "16:00", label: "Evening", icon: Sunset },
  { time: "21:30", label: "Overnight", icon: Moon },
];

const RETURN_PRESETS = [
  { time: "16:00", label: "Afternoon", icon: Sun },
  { time: "19:30", label: "Evening", icon: Sunset },
  { time: "22:30", label: "Late night", icon: Moon },
  { time: "", label: "Flexible", icon: Clock },
];

const longDate = (iso: string) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "—";

export function ScheduleStep() {
  const { control, register, setValue, formState } = useFormContext<TripFormValues>();
  const values = useWatch({ control }) as TripFormValues;
  const { departDate, departTime, tripType, returnDate, origin, destination } = values;
  const returnTo = values.returnTo ?? "";
  const returnBy = values.returnBy ?? "";
  const errors = formState.errors;
  const nights = tripNights(values);
  const today = todayISO();

  const setTripType = (t: TripFormValues["tripType"]) => {
    setValue("tripType", t, { shouldDirty: true });
    if (t === "round" && (!returnDate || returnDate < departDate)) {
      setValue("returnDate", addDays(departDate, Math.max(nights.stopNights + 2, 1)));
    }
  };

  return (
    <div>
      <StepHeader
        eyebrow="Step 2 · Schedule"
        title="When do you set off?"
        lead={`We'll time every bus, train and meal from the moment you leave ${origin || "home"}.`}
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field label="Departure date" htmlFor="departDate" error={errors.departDate?.message} hint={longDate(departDate)}>
          <input
            id="departDate"
            type="date"
            min={today}
            {...register("departDate")}
            className={inputClass(!!errors.departDate)}
          />
        </Field>
        <Field label="Leaving at" htmlFor="departTime" error={errors.departTime?.message}>
          <input id="departTime" type="time" {...register("departTime")} className={cn(inputClass(!!errors.departTime), "font-mono")} />
        </Field>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((p) => {
          const on = departTime === p.time;
          const Icon = p.icon;
          return (
            <button
              key={p.time}
              type="button"
              onClick={() => setValue("departTime", p.time, { shouldDirty: true })}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all focus-visible:outline-2 focus-visible:outline-gold",
                on ? "border-gold/60 bg-gold/10 text-gold-soft" : "border-hairline text-slate hover:text-sand"
              )}
            >
              <Icon className="size-3.5" />
              {p.label} <span className="font-mono opacity-70">{p.time}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 space-y-2">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate">Trip type</p>
        <Segmented
          name="Trip type"
          value={tripType}
          onChange={setTripType}
          options={[
            { value: "round", label: "Round trip", icon: Repeat },
            { value: "one-way", label: "One way", icon: ArrowRight },
          ]}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {tripType === "round" ? (
          <motion.div
            key="round"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="mt-5 grid gap-5 sm:grid-cols-2"
          >
            <Field label="Coming back on" htmlFor="returnDate" error={errors.returnDate?.message} hint={longDate(returnDate)}>
              <input
                id="returnDate"
                type="date"
                min={departDate || today}
                {...register("returnDate")}
                className={inputClass(!!errors.returnDate)}
              />
            </Field>
            <Field label="Returning to" htmlFor="returnTo" hint={<span className="flex items-center gap-1"><Undo2 className="size-3" /> blank = {origin || "start"}</span>}>
              <Controller
                control={control}
                name="returnTo"
                render={({ field }) => (
                  <CityCombobox
                    id="returnTo"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder={origin ? `${origin} (same as start)` : "Same as start"}
                    exclude={[destination]}
                  />
                )}
              />
            </Field>
            <Field
              className="sm:col-span-2"
              label={`Reach ${returnTo.trim() || origin || "home"} by`}
              htmlFor="returnBy"
              error={errors.returnBy?.message}
              hint="We time the journey back so you arrive just before this"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  id="returnBy"
                  type="time"
                  {...register("returnBy")}
                  className={cn(inputClass(!!errors.returnBy), "font-mono sm:w-44", !returnBy && "text-slate")}
                />
                <div className="flex flex-wrap gap-2">
                  {RETURN_PRESETS.map((p) => {
                    const on = returnBy === p.time;
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setValue("returnBy", p.time, { shouldDirty: true, shouldValidate: !!errors.returnBy })}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all focus-visible:outline-2 focus-visible:outline-gold",
                          on ? "border-gold/60 bg-gold/10 text-gold-soft" : "border-hairline text-slate hover:text-sand"
                        )}
                      >
                        <Icon className="size-3.5" />
                        {p.label} {p.time && <span className="font-mono opacity-70">{p.time}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Field>
          </motion.div>
        ) : (
          <motion.div
            key="oneway"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="mt-5 max-w-xs"
          >
            <Field label={`Nights in ${destination || "destination"}`} htmlFor="stayNights">
              <Controller
                control={control}
                name="stayNights"
                render={({ field }) => (
                  <Stepper id="stayNights" value={field.value} onChange={field.onChange} min={0} max={30} label="nights" suffix="nights" />
                )}
              />
            </Field>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-hairline bg-ink/40 px-5 py-4">
        <Stat label="Total" value={nights.total} unit="nights" />
        {nights.stopNights > 0 && <Stat label="On the way" value={nights.stopNights} unit="nights" />}
        <Stat label={`In ${destination || "destination"}`} value={nights.destinationNights} unit="nights" highlight />
      </motion.div>
    </div>
  );
}

function Stat({ label, value, unit, highlight }: { label: string; value: number; unit: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate">{label}</p>
      <p className={cn("font-mono text-lg tabular-nums", highlight ? "text-gold" : "text-sand")}>
        {value} <span className="text-xs text-slate">{value === 1 ? unit.replace(/s$/, "") : unit}</span>
      </p>
    </div>
  );
}
