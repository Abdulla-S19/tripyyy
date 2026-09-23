import "server-only";
import { findCity } from "@/lib/cities";
import { addDays, tripLegs, tripNights, type TripFormValues } from "@/lib/trip-schema";
import type { Itinerary, ItineraryItem } from "@/types/itinerary";
import { AIError, type ModelCaller } from "./types";

const item = (p: Partial<ItineraryItem> & Pick<ItineraryItem, "time" | "kind" | "title">): ItineraryItem => ({
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

const mode = (t: TripFormValues["transport"]): ItineraryItem["mode"] =>
  t === "rental" || t === "own" ? "car" : t === "mix" || t === "local" ? "bus" : t;

/** Offline stand-in used when AI_PROVIDER=mock — shaped like a real plan, clearly generic. */
function mockItinerary(trip: TripFormValues): Itinerary {
  const nights = tripNights(trip);
  const legs = tripLegs(trip);
  const scale = trip.currency === "INR" ? 1 : 0.012;
  const cost = (inr: number) => Math.round(inr * scale);
  const stops = trip.hasStops ? trip.waypoints.filter((w) => w.nights > 0) : [];
  const sleepCities = [...stops.flatMap((s) => Array(s.nights).fill(s.city) as string[]), ...Array(nights.destinationNights).fill(trip.destination)];

  const days = Array.from({ length: nights.total + 1 }, (_, i) => {
    const date = addDays(trip.departDate, i);
    const city = sleepCities[i] ?? (trip.tripType === "round" ? trip.returnTo || trip.origin : trip.destination);
    const prev = i === 0 ? trip.origin : sleepCities[i - 1];
    const travelling = prev !== city;
    const leg = legs.find((l) => l.from === prev && l.to === city);
    const start = i === 0 ? trip.departTime : "08:00";
    const items: ItineraryItem[] = [];
    if (travelling) {
      items.push(
        item({ time: start, kind: "transport", title: `${mode(trip.transport)} to ${city}`, mode: mode(trip.transport), from: prev, to: city, detail: `Travel from ${prev} to ${city}.`, costPerPerson: cost(450), bookingTip: "Sample data — generate with Gemini for real services." }),
        item({ time: "13:00", kind: "food", title: `Lunch on the way to ${city}`, detail: "A local meals place near the highway.", costPerPerson: cost(220) }),
        item({ time: "15:30", kind: "stay", title: `Check in, ${city}`, detail: "Centrally located stay.", location: city, costPerPerson: cost(900) })
      );
    } else {
      items.push(
        item({ time: "08:00", kind: "food", title: "Breakfast", location: city, costPerPerson: cost(150) }),
        item({ time: "09:30", kind: "place", title: `Morning sights in ${city}`, detail: "The best-known viewpoint and a short walk.", location: city, costPerPerson: cost(100) }),
        item({ time: "13:00", kind: "food", title: "Lunch", location: city, costPerPerson: cost(300) }),
        item({ time: "15:00", kind: "activity", title: "Afternoon experience", detail: `Chosen for: ${trip.moods.join(", ")}.`, location: city, costPerPerson: cost(250) })
      );
    }
    items.push(item({ time: "19:30", kind: "food", title: "Dinner", location: city, costPerPerson: cost(350) }));
    const where = findCity(city);
    return { day: i + 1, date, city, lat: where?.lat ?? 0, lng: where?.lng ?? 0, title: travelling ? `${prev} → ${city}` : `A day in ${city}`, summary: leg ? "Travel day." : "Exploring.", items };
  });

  return {
    title: `${trip.origin} to ${trip.destination} (sample)`,
    summary: "This is a sample plan from the offline mock provider. Set AI_PROVIDER=gemini for a real itinerary.",
    currency: trip.currency,
    days,
    rentals: [],
    budget: { transport: 0, stays: 0, food: 0, activities: 0, other: 0, totalPerPerson: 0, note: "" },
    tips: ["Sample tip: carry a light jacket for hill stations."],
    packing: ["ID proof", "Phone charger"],
  };
}

/** Offline stand-in. Model names starting with "fail" simulate an outage, for testing the fallback chain. */
export const callMock: ModelCaller = async (model, trip, opts) => {
  if (model.startsWith("fail")) throw new AIError(`Mock model ${model} is unavailable`, "upstream", 503);
  const it = mockItinerary(trip);
  const json = JSON.stringify(it);
  const size = Math.ceil(json.length / 40);
  for (let i = 0; i < json.length; i += size) {
    if (opts.signal?.aborted) throw new AIError("Generation was stopped", "aborted");
    await new Promise((r) => setTimeout(r, 120));
    opts.onText?.(json.slice(i, i + size));
  }
  return it;
};
