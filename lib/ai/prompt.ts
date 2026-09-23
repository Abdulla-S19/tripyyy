import { LEG_MODES, MOODS, RENTAL_CARS, TRANSPORT_MODES, currencyOf } from "@/lib/trip-options";
import { addDays, tripLegs, tripNights, type TripFormValues } from "@/lib/trip-schema";

export const SYSTEM_PROMPT = `You are TRIPYYY, an expert Indian travel planner who knows buses, trains, roads, food and local customs across India.
You turn a traveller's brief into a complete, realistic, hour-by-hour itinerary.

Rules:
- Plan every day from wake-up to night: transport, check-in/check-out, breakfast, lunch, snacks, dinner, sights and rest. 5–9 items per day.
- Day 1 starts at the given departure time from the starting city. The final day ends when the traveller arrives at their end point.
- Travel legs must be realistic: real journey durations, sensible departure times, real operators (KSRTC, TNSTC, KSRTC Swift, IRCTC trains, IndiGo, etc.).
  Only name a specific train or bus service if you are confident it runs on that route; otherwise describe it generically (e.g. "Express train, chair car"). Never invent train numbers.
  Put "verify timings on IRCTC / redBus / the operator site" style advice in bookingTip.
- Food: name real, well-known local places when confident; otherwise describe the kind of place and dish. Suggest regional dishes. Give up to 3 alternatives.
- Respect the moods — they decide which places and activities you choose.
- Respect the budget: costPerPerson is per person in the trip currency. Stays are per person per night (room cost divided by occupants). Keep the trip total at or under the budget where possible; if impossible, say so in budget.note.
- Children change pacing: shorter sightseeing blocks, earlier dinners.
- Times are 24-hour HH:MM and strictly increase within a day. Overnight journeys end on the next day's first item.
- Every rupee must sit on an item: rental car hire, fuel and tolls go on transport items as the per-person share. The budget totals are recomputed from item costs.
- For rental cars, fill "rentals" with 3–5 well-reviewed options available near the start city (provider, seats, price per day, rating). Otherwise return an empty array.
- Give accurate lat/lng (decimal degrees, WGS84) for every day's city and every item with a physical place; use 0 only when truly unknown.
- Use empty strings or 0 for fields that do not apply. Output only JSON that matches the schema.`;

const moodLabel = (id: string) => MOODS.find((m) => m.id === id)?.label ?? id;

/** Concrete booking classes per travel style, so "budget" never quietly becomes 3AC and a 4-star hotel. */
const STYLE_RULES: Record<string, string> = {
  budget: `BUDGET FRIENDLY — the cheapest sensible option every time.
  - Trains: Sleeper (SL) for overnight, Second Sitting (2S) or general for day trips. Never 3AC/2AC/1AC or chair car unless no cheaper class exists.
  - Buses: KSRTC/state ordinary, fast passenger or non-AC; AC sleeper only if it is the only overnight option.
  - Stays: hostels, dormitories, budget lodges or simple homestays, about ₹400–1,200 per person per night. No 3-star or above.
  - Food: local messes, darshinis, thattukadas, street food and meals-thalis; one modest sit-down meal a day at most.
  - Local transport: city buses, shared autos and walking first; autos and bike taxis for short hops; avoid private cabs.
  - Sights: favour free or low-entry places; skip paid add-ons unless they are the reason to visit.`,
  balanced: `BALANCED — comfortable but careful with money.
  - Trains: 3AC for overnight, chair car (CC) for day trains; Sleeper is fine for short hops.
  - Buses: AC seater/sleeper (KSRTC Swift, Airavat, reputed private operators).
  - Stays: clean 2–3 star hotels or well-reviewed homestays.
  - Food: popular local restaurants and a couple of well-known places; street food where it's famous.
  - Local transport: autos and app cabs.`,
  premium: `PREMIUM — comfort first, time matters.
  - Trains: 2AC or Executive Chair Car; take a flight when it saves half a day or more.
  - Road: private cab or AC Volvo for long legs; cab transfers to and from stations.
  - Stays: 4-star hotels, boutique stays or premium resorts.
  - Food: the best-rated restaurants and signature dining experiences.`,
  luxury: `LUXURY — the finest option at every step.
  - Transport: flights where available, 1AC otherwise, private chauffeured car for road legs.
  - Stays: 5-star, heritage palaces or luxury resorts with views.
  - Food: fine dining, chef's tables and signature experiences; private guided tours.`,
};

/** Where the rental is collected and returned; a different drop city means a one-way hire. */
function rentalHandover(trip: TripFormValues) {
  const pickup = trip.rental.pickup?.trim();
  const drop = trip.rental.dropoff?.trim();
  const from = pickup ? `Pick the car up in ${pickup}` : "Pick the car up at the start of the first rental leg";
  if (drop === "suggest") {
    return `${from}. Choose the best city to drop it off: a one-way drop is worth it when it avoids driving back (e.g. drop in Coimbatore and take the train home instead of returning to the pickup city). Explain the choice, include the one-way drop fee, and plan the onward journey from the drop city.`;
  }
  if (drop && drop.toLowerCase() !== (pickup || "").toLowerCase()) {
    return `${from} and drop it off in ${drop} (one-way hire: include the drop fee on a transport item). After the drop, plan the rest of the journey from ${drop} by the best public transport or cab.`;
  }
  return `${from} and return it to the same place.`;
}

export function buildTripPrompt(trip: TripFormValues) {
  const legs = tripLegs(trip);
  const nights = tripNights(trip);
  const currency = currencyOf(trip.currency);
  const stops = trip.hasStops ? trip.waypoints : [];
  const totalDays = nights.total + 1;
  const endDate = addDays(trip.departDate, nights.total);
  const travellers = trip.adults + trip.children;

  const MODE_BRIEF: Record<string, string> = {
    local: `No private vehicle. Use trains or buses for the long legs, then pick the best last-mile option for each hop by distance and group size: Uber/Ola/Rapido bike taxis for a solo traveller and short hops, autos for short hops, app cabs (Uber/Ola) for longer hops, luggage or groups. Name the app and give the fare estimate on each hop.`,
    own: `The travellers drive their own ${trip.ownVehicle === "bike" ? "motorbike" : "car"} for every leg — plan realistic driving times, fuel and toll costs (per person share), rest/food stops every 2–3 hours, and parking at stays. No rentals.`,
    rental: `Rental car, ${trip.rental.driveType === "self" ? "self-drive" : "with a hired driver (include driver bata and their night stay)"}${
      trip.rental.carId ? `, preferred car: ${RENTAL_CARS.find((c) => c.id === trip.rental.carId)?.name}` : ", suggest the best car for the group"
    }. ${rentalHandover(trip)} Use local autos/cabs only for short hops.`,
    bike: `Rented motorbikes for the road legs; plan fuel, helmets and rest stops.`,
  };
  const modeLabel = (id: string) => (MODE_BRIEF[id] ? LEG_MODES.find((m) => m.id === id)?.label + ` (${MODE_BRIEF[id]})` : LEG_MODES.find((m) => m.id === id)?.label);

  const transport =
    trip.transport === "mix"
      ? legs.map((l, i) => `  - ${l.from} → ${l.to}: ${modeLabel(trip.legModes[i]) ?? "best option"}`).join("\n")
      : (MODE_BRIEF[trip.transport] ??
        `${TRANSPORT_MODES.find((m) => m.id === trip.transport)?.label} for the main legs; autos, cabs and local buses for short hops.`);

  const returnTo = trip.returnTo.trim() || trip.origin;
  const returnRule =
    trip.tripType !== "round"
      ? "Trip type: one way"
      : `Trip type: round trip, returning to ${returnTo} on ${trip.returnDate}` +
        (trip.returnBy
          ? `. The travellers must ARRIVE in ${returnTo} by ${trip.returnBy} on ${trip.returnDate}, and no need to be earlier than about an hour before that. Work backwards from ${trip.returnBy}: choose the return departure so arrival lands just before it, and fill the morning of the last day with sightseeing, food and check-out before leaving.`
          : `. Arrival time back is flexible; pick the most comfortable return departure.`);

  const moods = [...trip.moods.map(moodLabel), ...(trip.customMoods ?? [])];

  const stayPlan = [
    ...stops.map((s) => `  - ${s.city}: ${s.nights === 0 ? "pass through (meal or short visit, no overnight)" : `${s.nights} night(s)`}`),
    `  - ${trip.destination}: ${nights.destinationNights} night(s)`,
  ].join("\n");

  return `Plan this trip.

Route (in order): ${[trip.origin, ...stops.map((s) => s.city), trip.destination].join(" → ")}
Legs:
${legs.map((l, i) => `  ${i + 1}. ${l.from} → ${l.to}${l.kind === "return" ? " (return journey)" : ""}`).join("\n")}
Overnight stays:
${stayPlan}${
    trip.sideTrips?.length
      ? `
Must-see places near ${trip.destination}: ${trip.sideTrips.join(", ")}.
  These are NOT overnight stops. Visit each one as a day trip or half-day excursion from the ${trip.destination} base,
  grouping nearby places on the same outing and ordering them to minimise driving. Include the transport there and back.`
      : ""
  }

Departure: ${trip.departDate} at ${trip.departTime} from ${trip.origin}
${returnRule}
Dates covered: ${trip.departDate} to ${endDate} — exactly ${totalDays} day(s), numbered 1..${totalDays}.

Travellers: ${trip.adults} adult(s)${trip.children ? `, ${trip.children} child(ren) aged 2–12` : ""} (${travellers} total)
Moods: ${moods.join(", ")}${trip.customMoods?.length ? " (the last ones were written by the traveller — take them literally)" : ""}
Budget: ${currency.symbol}${trip.budget} per person for the whole trip (currency ${trip.currency})
Travel style: ${STYLE_RULES[trip.travelStyle ?? "balanced"]}
  Priority when style and budget disagree: never exceed the budget for a budget-friendly trip; for other styles stay as close to the style as the budget allows and explain any downgrade in budget.note.
Transport:
${transport.startsWith("  -") ? transport : `  ${transport}`}

Return the itinerary with currency "${trip.currency}".`;
}
