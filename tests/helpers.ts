import { addDays, defaultTrip, todayISO, type TripFormValues } from "@/lib/trip-schema";
import type { Itinerary, ItineraryItem } from "@/types/itinerary";

export function sampleTrip(overrides: Partial<TripFormValues> = {}): TripFormValues {
  const depart = addDays(todayISO(), 20);
  return {
    ...defaultTrip(),
    origin: "Trivandrum",
    destination: "Ooty",
    departDate: depart,
    returnDate: addDays(depart, 3),
    moods: ["mountain"],
    ...overrides,
  };
}

export const item = (p: Partial<ItineraryItem> & Pick<ItineraryItem, "time" | "kind" | "title">): ItineraryItem => ({
  endTime: "",
  detail: "",
  location: "",
  lat: 0,
  lng: 0,
  costPerPerson: 0,
  mode: "",
  operator: "",
  from: "",
  to: "",
  bookingTip: "",
  alternatives: [],
  ...p,
});

export function sampleItinerary(): Itinerary {
  return {
    title: "Test trip",
    summary: "A test.",
    currency: "INR",
    days: [
      {
        day: 1,
        date: "2026-10-14",
        city: "Kozhikode",
        lat: 11.26,
        lng: 75.78,
        title: "Trivandrum → Kozhikode",
        summary: "Travel day.",
        items: [
          item({ time: "19:30", kind: "food", title: "Dinner", costPerPerson: 300 }),
          item({ time: "06:30", kind: "transport", title: "Train, north", mode: "train", costPerPerson: 600, endTime: "15:20" }),
          item({ time: "16:00", kind: "stay", title: "Check in; hotel, sea view", costPerPerson: 700 }),
        ],
      },
      {
        day: 2,
        date: "2026-10-15",
        city: "Ooty",
        lat: 11.41,
        lng: 76.7,
        title: "Kozhikode → Ooty",
        summary: "Up the ghat.",
        items: [
          item({ time: "15:00", kind: "place", title: "Botanical Garden", costPerPerson: 50 }),
          item({ time: "17:30", kind: "activity", title: "Boating", costPerPerson: 120 }),
          item({ time: "21:00", kind: "free", title: "Stroll", costPerPerson: 30 }),
        ],
      },
    ],
    rentals: [],
    budget: { transport: 1, stays: 1, food: 1, activities: 1, other: 1, totalPerPerson: 99999, note: "" },
    tips: [],
    packing: [],
  };
}
