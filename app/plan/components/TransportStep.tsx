"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bike, Car, CarFront, Check, KeyRound, Sparkles, Star, TrainFront, UserRound } from "lucide-react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { LEG_MODES, RENTAL_CARS, TRANSPORT_MODES, formatMoney, type LegModeId } from "@/lib/trip-options";
import { tripLegs, type TripFormValues } from "@/lib/trip-schema";
import { cn } from "@/lib/utils";
import { FieldError, Segmented } from "./fields";
import { RentalHandover } from "./RentalHandover";
import { StepHeader } from "./StepHeader";

const LOCAL_CHAIN = [
  { icon: TrainFront, title: "Long legs", body: "Train or bus between cities: the cheapest and most reliable option." },
  { icon: Bike, title: "Short hops", body: "Rapido or Uber bike taxis and autos for a few kilometres." },
  { icon: Car, title: "Longer hops", body: "Uber or Ola cabs when it's far, late, or you have luggage." },
];

const reveal = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

export function TransportStep() {
  const { control, setValue, formState } = useFormContext<TripFormValues>();
  const values = useWatch({ control }) as TripFormValues;
  const { transport, rental, legModes, adults, children } = values;
  const ownVehicle = values.ownVehicle ?? "car";
  const travellers = adults + children;
  const legs = tripLegs(values);
  const cars = RENTAL_CARS.filter((c) => c.seats >= travellers).sort((a, b) => b.rating - a.rating);
  const tooMany = cars.length === 0;
  const errors = formState.errors;

  const setLegMode = (i: number, mode: LegModeId) => {
    const next = legs.map((_, j) => (j === i ? mode : (legModes[j] ?? "")));
    setValue("legModes", next, { shouldDirty: true, shouldValidate: formState.isSubmitted || !!errors.legModes });
  };

  return (
    <div>
      <StepHeader
        eyebrow="Step 4 · Transport"
        title="How do you like to travel?"
        lead="Pick what you'll mostly rely on. We'll still suggest autos, cabs and local buses for short hops."
      />

      <Controller
        control={control}
        name="transport"
        render={({ field }) => (
          <div role="radiogroup" aria-label="Main mode of transport" className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TRANSPORT_MODES.map((m) => {
              const on = field.value === m.id;
              const Icon = m.icon;
              return (
                <motion.button
                  key={m.id}
                  id={`transport-${m.id}`}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => field.onChange(m.id)}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border p-4 text-left transition-[border-color,background-color,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-gold",
                    on ? "border-gold/60 bg-gold/[0.08] shadow-glow-gold" : "border-hairline bg-ink/40 hover:border-sand/20"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-xl border transition-colors",
                      on ? "border-gold bg-gold text-on-gold" : "border-hairline bg-surface-2 text-slate group-hover:text-gold"
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-medium text-sand">{m.label}</span>
                    <span className="block text-xs leading-snug text-slate">{m.hint}</span>
                  </span>
                  {on && (
                    <motion.span
                      layoutId="transport-check"
                      className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-gold text-on-gold"
                    >
                      <Check className="size-3" />
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      />

      <AnimatePresence initial={false} mode="wait">
        {transport === "rental" && (
          <motion.section key="rental" {...reveal} className="overflow-hidden" aria-label="Rental car options">
            <div className="space-y-5 pt-8">
              <Segmented
                name="Driving"
                value={rental.driveType}
                onChange={(v) => setValue("rental.driveType", v, { shouldDirty: true })}
                options={[
                  { value: "self", label: "I'll drive", icon: KeyRound },
                  { value: "driver", label: "With a driver", icon: UserRound },
                ]}
              />
              <RentalHandover />
              <div className="flex items-baseline justify-between">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate">Top-rated for {travellers} {travellers === 1 ? "person" : "people"}</p>
                <span className="text-xs text-slate/80">Sample prices · per day</span>
              </div>
              {tooMany ? (
                <p className="rounded-2xl border border-hairline bg-ink/40 p-4 text-sm text-slate">
                  No single car seats {travellers}. We&apos;ll plan two vehicles or a coach instead.
                </p>
              ) : (
                <div role="radiogroup" aria-label="Rental car" className="space-y-2.5">
                  <CarOption
                    selected={rental.carId === ""}
                    onSelect={() => setValue("rental.carId", "", { shouldDirty: true })}
                    title="Let TRIPYYY choose"
                    meta="We'll pick the best-reviewed car for your route and group"
                    icon={<Sparkles className="size-4" />}
                  />
                  {cars.map((car, i) => (
                    <motion.div key={car.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                      <CarOption
                        selected={rental.carId === car.id}
                        onSelect={() => setValue("rental.carId", car.id, { shouldDirty: true })}
                        title={car.name}
                        meta={`${car.category} · ${car.seats} seats · ${car.transmission} · ${car.features.join(" · ")}`}
                        rating={car.rating}
                        reviews={car.reviews}
                        price={formatMoney(car.pricePerDay + (rental.driveType === "driver" ? 800 : 0), "INR")}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}

        {transport === "local" && (
          <motion.section key="local" {...reveal} className="overflow-hidden" aria-label="How we plan without a vehicle">
            <div className="pt-8">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate">How we&apos;ll get you there</p>
              <ol className="mt-4 grid gap-3 sm:grid-cols-3">
                {LOCAL_CHAIN.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.li
                      key={s.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="relative rounded-2xl border border-hairline bg-ink/40 p-4"
                    >
                      <span className="grid size-9 place-items-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
                        <Icon className="size-4" />
                      </span>
                      <p className="mt-3 font-medium text-sand">{s.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate">{s.body}</p>
                      {i < LOCAL_CHAIN.length - 1 && (
                        <ArrowRight aria-hidden className="absolute -right-3 top-1/2 z-10 hidden size-5 -translate-y-1/2 rounded-full bg-ink p-0.5 text-gold sm:block" />
                      )}
                    </motion.li>
                  );
                })}
              </ol>
              <p className="mt-3 text-xs text-slate">
                {travellers === 1 ? "Travelling solo, so bike taxis are used for short hops." : `With ${travellers} people, autos and cabs are usually cheaper than bike taxis.`}
              </p>
            </div>
          </motion.section>
        )}

        {transport === "own" && (
          <motion.section key="own" {...reveal} className="overflow-hidden" aria-label="Your vehicle">
            <div className="space-y-4 pt-8">
              <Segmented
                name="Your vehicle"
                value={ownVehicle}
                onChange={(v) => setValue("ownVehicle", v, { shouldDirty: true })}
                options={[
                  { value: "car", label: "My car", icon: CarFront },
                  { value: "bike", label: "My bike", icon: Bike },
                ]}
              />
              <p className="rounded-2xl border border-hairline bg-ink/40 p-4 text-sm leading-relaxed text-slate">
                We&apos;ll plan realistic driving times, fuel and toll costs split per person, a break every 2–3 hours, and stays with parking.
              </p>
            </div>
          </motion.section>
        )}

        {transport === "mix" && (
          <motion.section key="mix" {...reveal} className="overflow-hidden" aria-label="Transport for each leg">
            <div className="space-y-3 pt-8">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate">Each leg of the journey</p>
              {legs.map((leg, i) => (
                <div key={`${leg.from}-${leg.to}-${i}`} className="rounded-2xl border border-hairline bg-ink/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm text-sand">
                      <span className="font-mono text-xs text-slate">{leg.kind === "return" ? "Return" : `Leg ${i + 1}`}</span>
                      {leg.from} <ArrowRight className="size-3.5 text-gold" /> {leg.to}
                    </p>
                    <div role="radiogroup" aria-label={`Transport from ${leg.from} to ${leg.to}`} className="flex gap-1">
                      {LEG_MODES.map((m) => {
                        const on = legModes[i] === m.id;
                        const Icon = m.icon;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            aria-label={m.label}
                            title={m.label}
                            onClick={() => setLegMode(i, m.id)}
                            className={cn(
                              "grid size-9 place-items-center rounded-lg border transition-all focus-visible:outline-2 focus-visible:outline-gold",
                              on ? "border-gold bg-gold text-on-gold shadow-glow-gold" : "border-hairline text-slate hover:text-sand"
                            )}
                          >
                            <Icon className="size-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <FieldError message={errors.legModes?.[i]?.message} />
                </div>
              ))}
              <AnimatePresence initial={false}>
                {legModes.includes("rental") && (
                  <motion.div key="mix-rental" {...reveal} className="overflow-hidden">
                    <p className="pb-2 pt-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate">Rental car</p>
                    <RentalHandover />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function CarOption({
  selected,
  onSelect,
  title,
  meta,
  icon,
  rating,
  reviews,
  price,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  meta: string;
  icon?: React.ReactNode;
  rating?: number;
  reviews?: number;
  price?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-all duration-300 focus-visible:outline-2 focus-visible:outline-gold",
        selected ? "border-gold/60 bg-gold/[0.08] shadow-glow-gold" : "border-hairline bg-ink/40 hover:border-sand/20"
      )}
    >
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
          selected ? "border-gold bg-gold text-on-gold" : "border-slate/50"
        )}
      >
        {selected && <Check className="size-3" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-medium text-sand">
          {icon && <span className="text-gold">{icon}</span>}
          {title}
        </span>
        <span className="block truncate text-xs text-slate">{meta}</span>
      </span>
      {rating !== undefined && (
        <span className="shrink-0 text-right">
          <span className="flex items-center justify-end gap-1 text-xs text-gold">
            <Star className="size-3 fill-gold" /> {rating.toFixed(1)}
            <span className="text-slate">({reviews?.toLocaleString("en-IN")})</span>
          </span>
          <span className="font-mono text-sm text-sand">{price}</span>
        </span>
      )}
    </button>
  );
}
