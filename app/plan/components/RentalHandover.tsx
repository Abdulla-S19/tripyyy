"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Flag, Info, KeyRound, Repeat, Sparkles, Split } from "lucide-react";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { tripLegs, type TripFormValues } from "@/lib/trip-schema";
import { CityCombobox } from "./CityCombobox";
import { Segmented } from "./fields";

type DropMode = "same" | "other" | "suggest";

/** Where the rental car is collected and returned. A different drop city saves the drive back. */
export function RentalHandover() {
  const { control, setValue } = useFormContext<TripFormValues>();
  const v = useWatch({ control }) as TripFormValues;
  const rental = v.rental;
  const legs = tripLegs(v);
  // Default pickup: where the first rental leg starts (the origin unless the trip mixes modes).
  const firstRental = v.transport === "mix" ? legs.find((_, i) => v.legModes[i] === "rental") : legs[0];
  const defaultPickup = firstRental?.from || v.origin || "your start";
  const pickupCity = rental.pickup?.trim() || defaultPickup;
  const drop = rental.dropoff ?? "";
  // "Elsewhere" has no city yet when first chosen, so remember the choice locally until one is typed.
  const [choosingOther, setChoosingOther] = useState(false);
  const mode: DropMode =
    drop === "suggest" ? "suggest" : choosingOther || (drop && drop.toLowerCase() !== pickupCity.toLowerCase()) ? "other" : "same";

  const set = (patch: Partial<TripFormValues["rental"]>) => setValue("rental", { ...rental, ...patch }, { shouldDirty: true });

  const setMode = (m: DropMode) => {
    setChoosingOther(m === "other");
    if (m === "same") set({ dropoff: "" });
    if (m === "suggest") set({ dropoff: "suggest" });
    if (m === "other") set({ dropoff: drop && drop !== "suggest" ? drop : "" });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-hairline bg-ink/40 p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="rental-pickup" className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate">
            Pick up in
          </label>
          <CityCombobox
            id="rental-pickup"
            value={rental.pickup ?? ""}
            onChange={(c) => set({ pickup: c })}
            placeholder={`${defaultPickup} (default)`}
            icon={<KeyRound className="size-4" />}
          />
        </div>
        <div className="space-y-2">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate">Drop off</p>
          <Segmented
            name="Drop off"
            value={mode}
            onChange={setMode}
            options={[
              { value: "same", label: "Same", icon: Repeat },
              { value: "other", label: "Elsewhere", icon: Split },
              { value: "suggest", label: "Suggest", icon: Sparkles },
            ]}
          />
        </div>
      </div>

      <AnimatePresence initial={false} mode="wait">
        {mode === "other" && (
          <motion.div key="other" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="space-y-2 pt-1">
              <label htmlFor="rental-dropoff" className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate">
                Drop off in
              </label>
              <CityCombobox
                id="rental-dropoff"
                value={drop === "suggest" ? "" : drop}
                onChange={(c) => set({ dropoff: c })}
                placeholder="e.g. Coimbatore"
                exclude={[pickupCity]}
                icon={<Flag className="size-4 text-gold" />}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="flex gap-2 text-xs leading-relaxed text-slate">
        <Info className="mt-0.5 size-3.5 shrink-0 text-gold" />
        {mode === "same"
          ? `You'll return the car in ${pickupCity}.`
          : mode === "suggest"
            ? "We'll pick the drop city that saves the most driving, for example leaving the car in Coimbatore and taking the train home."
            : `One-way drops usually cost ₹1,500–4,000 extra, and are often worth it to skip the drive back. We'll plan the journey on from ${drop || "there"}.`}
      </p>
    </div>
  );
}
