import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { TripFormValues } from "@/lib/trip-schema";
import type { Itinerary } from "@/types/itinerary";

export type SavedTrip = {
  id: string;
  trip: TripFormValues;
  itinerary: Itinerary;
  provider: string;
  model: string;
  createdAt: string;
  /** Saved in the signed-in user's account (id is then the database id). */
  cloud?: boolean;
  /** Public read-only link token, if sharing is on. */
  shareToken?: string | null;
  /** Guest share links only: the secret that lets this device stop sharing. */
  revokeKey?: string;
};

type ItineraryStore = {
  trips: Record<string, SavedTrip>;
  save: (t: SavedTrip) => void;
  update: (id: string, patch: Partial<SavedTrip>) => void;
  remove: (id: string) => void;
  /** Swap a browser-only trip for its account copy (after import). */
  replace: (oldId: string, t: SavedTrip) => void;
  /** Merge the account's trips in, keeping local-only fields like revoke keys. */
  mergeCloud: (list: SavedTrip[]) => void;
};

// Browser copy of trips: all of a guest's trips, plus a cache of the signed-in user's account.
export const useItineraryStore = create<ItineraryStore>()(
  persist(
    (set) => ({
      trips: {},
      save: (t) => set((s) => ({ trips: { ...s.trips, [t.id]: t } })),
      update: (id, patch) => set((s) => (s.trips[id] ? { trips: { ...s.trips, [id]: { ...s.trips[id], ...patch } } } : s)),
      remove: (id) =>
        set((s) => {
          const next = { ...s.trips };
          delete next[id];
          return { trips: next };
        }),
      replace: (oldId, t) =>
        set((s) => {
          const next = { ...s.trips };
          delete next[oldId];
          next[t.id] = t;
          return { trips: next };
        }),
      mergeCloud: (list) =>
        set((s) => {
          const next = { ...s.trips };
          for (const t of list) next[t.id] = { ...next[t.id], ...t };
          return { trips: next };
        }),
    }),
    { name: "tripyyy-itineraries", version: 1, storage: createJSONStorage(() => localStorage), skipHydration: true }
  )
);

export function useItineraryHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    Promise.resolve(useItineraryStore.persist.rehydrate()).then(() => setHydrated(true));
  }, []);
  return hydrated;
}
