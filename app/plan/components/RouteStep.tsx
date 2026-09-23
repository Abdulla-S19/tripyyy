"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpDown, Flag, Navigation, Plus, X } from "lucide-react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import type { TripFormValues } from "@/lib/trip-schema";
import { CityCombobox } from "./CityCombobox";
import { FieldError, Stepper, Toggle } from "./fields";
import { SideTrips } from "./SideTrips";
import { StepHeader } from "./StepHeader";

function Dot({ tone }: { tone: "start" | "stop" | "end" }) {
  return (
    <span
      aria-hidden
      className={
        "relative z-10 mt-[2.6rem] grid size-4 shrink-0 place-items-center rounded-full border-2 " +
        (tone === "end"
          ? "border-gold bg-gold shadow-glow-gold"
          : tone === "start"
            ? "border-sand bg-ink"
            : "border-gold/70 bg-ink")
      }
    />
  );
}

export function RouteStep() {
  const { control, setValue, getValues, formState } = useFormContext<TripFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "waypoints" });
  const [origin, destination, hasStops, waypoints] = useWatch({
    control,
    name: ["origin", "destination", "hasStops", "waypoints"],
  });
  const errors = formState.errors;

  const swap = () => {
    const { origin: o, destination: d } = getValues();
    setValue("origin", d, { shouldDirty: true });
    setValue("destination", o, { shouldDirty: true });
  };

  const toggleStops = (on: boolean) => {
    setValue("hasStops", on, { shouldDirty: true });
    if (on && fields.length === 0) append({ city: "", nights: 1 });
  };

  const taken = [origin, destination, ...waypoints.map((w) => w.city)].filter(Boolean);

  return (
    <div>
      <StepHeader
        eyebrow="Step 1 · Route"
        title="Where does this journey go?"
        lead="Your start, your destination, and any place you'd like to spend a night on the way."
      />

      <div className="relative mt-8">
        <span aria-hidden className="absolute bottom-10 left-[7px] top-10 w-0.5 bg-[repeating-linear-gradient(to_bottom,var(--gold)_0_4px,transparent_4px_10px)] opacity-50" />

        <div className="flex gap-4">
          <Dot tone="start" />
          <div className="flex-1 space-y-2">
            <label htmlFor="origin" className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate">
              Starting from
            </label>
            <Controller
              control={control}
              name="origin"
              render={({ field, fieldState }) => (
                <CityCombobox
                  id="origin"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="e.g. Trivandrum"
                  exclude={[destination]}
                  invalid={!!fieldState.error}
                  errorId="origin-error"
                  icon={<Navigation className="size-4" />}
                />
              )}
            />
            <FieldError id="origin-error" message={errors.origin?.message} />
          </div>
        </div>

        <AnimatePresence initial={false}>
          {hasStops && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-5">
                <AnimatePresence initial={false}>
                  {fields.map((f, i) => (
                    <motion.div
                      key={f.id}
                      layout
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16, transition: { duration: 0.2 } }}
                      className="flex gap-4"
                    >
                      <Dot tone="stop" />
                      <div className="flex-1 space-y-2">
                        <label htmlFor={`waypoints.${i}.city`} className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold/80">
                          Stop {i + 1}
                        </label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <div className="flex-1">
                            <Controller
                              control={control}
                              name={`waypoints.${i}.city`}
                              render={({ field, fieldState }) => (
                                <CityCombobox
                                  id={`waypoints.${i}.city`}
                                  value={field.value}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  placeholder="e.g. Kozhikode"
                                  exclude={taken.filter((t) => t !== field.value)}
                                  invalid={!!fieldState.error}
                                />
                              )}
                            />
                          </div>
                          <div className="flex gap-2">
                            <div className="w-40">
                              <Controller
                                control={control}
                                name={`waypoints.${i}.nights`}
                                render={({ field }) => (
                                  <Stepper
                                    id={`waypoints.${i}.nights`}
                                    value={field.value}
                                    onChange={field.onChange}
                                    min={0}
                                    max={14}
                                    label="nights"
                                    suffix={field.value === 1 ? "night" : "nights"}
                                  />
                                )}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                remove(i);
                                if (fields.length === 1) setValue("hasStops", false);
                              }}
                              aria-label={`Remove stop ${i + 1}`}
                              className="grid size-12 shrink-0 place-items-center rounded-xl border border-hairline text-slate transition-colors hover:border-destructive/50 hover:text-destructive focus-visible:outline-2 focus-visible:outline-gold"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                        </div>
                        <FieldError message={errors.waypoints?.[i]?.city?.message} />
                        {waypoints[i]?.nights === 0 && (
                          <p className="text-xs text-slate">Passing through — we&apos;ll plan a meal or a short visit here.</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {fields.length < 5 && (
                  <div className="flex gap-4 pl-8">
                    <button
                      type="button"
                      onClick={() => append({ city: "", nights: 1 })}
                      className="flex items-center gap-2 rounded-full border border-dashed border-gold/40 px-4 py-2 text-sm text-gold transition-all hover:border-gold hover:bg-gold/10 hover:shadow-glow-gold focus-visible:outline-2 focus-visible:outline-gold"
                    >
                      <Plus className="size-4" /> Add another stop
                    </button>
                  </div>
                )}
                <div className="pl-8">
                  <FieldError message={errors.waypoints?.root?.message ?? errors.waypoints?.message} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5 flex gap-4">
          <Dot tone="end" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="destination" className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate">
                Going to
              </label>
              <button
                type="button"
                onClick={swap}
                className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-slate transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
              >
                <ArrowUpDown className="size-3.5" /> Swap
              </button>
            </div>
            <Controller
              control={control}
              name="destination"
              render={({ field, fieldState }) => (
                <CityCombobox
                  id="destination"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="e.g. Ooty"
                  exclude={[origin]}
                  invalid={!!fieldState.error}
                  errorId="destination-error"
                  icon={<Flag className="size-4 text-gold" />}
                />
              )}
            />
            <FieldError id="destination-error" message={errors.destination?.message} />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Toggle
          id="hasStops"
          checked={hasStops}
          onChange={toggleStops}
          label="Stopovers on the way"
          description="Spend a night or a few hours somewhere between start and destination."
        />
      </div>

      <div className="mt-4">
        <Controller
          control={control}
          name="sideTrips"
          render={({ field }) => <SideTrips destination={destination} value={field.value ?? []} onChange={field.onChange} />}
        />
      </div>
    </div>
  );
}
