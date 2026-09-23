import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { defaultTrip, type TripFormValues } from "@/lib/trip-schema";

export const STEPS = ["Route", "Schedule", "People & vibe", "Transport", "Review"] as const;

type TripStore = {
  draft: TripFormValues;
  step: number;
  furthestStep: number;
  setDraft: (draft: TripFormValues) => void;
  goTo: (step: number) => void;
  reset: () => void;
};

export const useTripStore = create<TripStore>()(
  persist(
    (set) => ({
      draft: defaultTrip(),
      step: 0,
      furthestStep: 0,
      setDraft: (draft) => set({ draft }),
      goTo: (step) => set((s) => ({ step, furthestStep: Math.max(s.furthestStep, step) })),
      reset: () => set({ draft: defaultTrip(), step: 0, furthestStep: 0 }),
    }),
    {
      name: "tripyyy-builder",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ draft, step, furthestStep }) => ({ draft, step, furthestStep }),
    }
  )
);
