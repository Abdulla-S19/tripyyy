import { LEG_MODES, MOODS, RENTAL_CARS, TRANSPORT_MODES, currencyOf } from "@/lib/trip-options";
import { fixedJourneys } from "@/lib/replan";
import { calendarLines } from "@/lib/trip-calendar";
import { addDays, tripLegs, tripNights, type TripFormValues } from "@/lib/trip-schema";
import { dayTotal, money } from "@/lib/trip-view";
import type { Itinerary } from "@/types/itinerary";
import type { PromptContext } from "./types";

export const SYSTEM_PROMPT = `You are TRIPYYY, an expert Indian travel planner who knows buses, trains, roads, food and local customs across India.
You turn a traveller's brief into a complete, realistic, hour-by-hour itinerary.

Rules:
- Plan every day from wake-up to night: transport, check-in/check-out, breakfast, lunch, snacks, dinner, sights and rest. 6–12 items per day, counting the local hops below.
- Day 1 starts at the given departure time from the starting city. The final day ends when the traveller arrives at their end point.
- Travel legs must be realistic: real journey durations, sensible departure times, real operators (KSRTC, TNSTC, KSRTC Swift, IRCTC trains, IndiGo, etc.).
  Only name a specific train or bus service if you are confident it runs on that route; otherwise describe it generically (e.g. "Express train, chair car"). Never invent train numbers.
  Put "verify timings on IRCTC / redBus / the operator site" style advice in bookingTip.
- Food: name real, well-known local places when confident; otherwise describe the kind of place and dish. Suggest regional dishes. Give up to 3 alternatives.
- Getting between places: whenever two consecutive items in a day are more than a 10-minute walk apart, put a transport item between them for that hop:
  kind "transport", the right mode (walk, auto, cab, bus, metro, boat, bike…), operator = the app or service (Uber, Ola, Rapido, Namma Yatri, city bus, metro, ferry/water metro),
  from and to, time–endTime covering the realistic travel time, and the fare per person as costPerPerson. Match the hop to the travel style, group size and luggage.
  When the next place is within about a 10-minute walk, do not add an item; start that item's detail with "5 min walk from <previous place>." instead.
  Order each day's places to avoid back-and-forth across town.
- Moods decide the plan: choose the places and activities that best fit them (see "What the moods mean" in the brief). When several moods are chosen, weave all of them into every day where the location allows, rather than one mood per day.
- Pick the best of each kind: the most popular, well-reviewed and reputable place, experience or operator in that area, not a random one.
  Say in a few words in detail why it's worth it (e.g. "Kerala's longest zipline", "the oldest synagogue in the Commonwealth", "the go-to spot for …").
  Never invent star ratings or review counts. For adventure activities choose licensed, safety-certified operators, and flag seasonal closures (e.g. rafting in the monsoon) in bookingTip.
- Respect the budget: costPerPerson is per person in the trip currency. Stays are per person per night (room cost divided by occupants). Keep the trip total at or under the budget where possible; if impossible, say so in budget.note.
- Children change pacing: shorter sightseeing blocks, earlier dinners.
- Times are 24-hour HH:MM and strictly increase within a day. Overnight journeys end on the next day's first item.
- Every rupee must sit on an item: rental car hire, fuel and tolls go on transport items as the per-person share. The budget totals are recomputed from item costs.
- For rental cars, fill "rentals" with 3–5 well-reviewed options available near the start city (provider, seats, price per day, rating). Otherwise return an empty array.
- Give accurate lat/lng (decimal degrees, WGS84) for every day's city and every item with a physical place; use 0 only when truly unknown.
- "alerts" holds warnings the traveller must act on (road restrictions, traffic, closures, safety); otherwise an empty array.
- Use empty strings or 0 for fields that do not apply. Output only JSON that matches the schema.`;

const moodLabel = (id: string) => MOODS.find((m) => m.id === id)?.label ?? id;

/** What each mood should turn into on the ground, so the model doesn't guess from one word. */
const MOOD_BRIEF: Record<string, string> = {
  adventure: "treks, rafting, paragliding, ziplines, kayaking, off-road jeep safaris, caving, with licensed operators",
  mountain: "viewpoints, hill walks, tea/coffee estates, sunrise and sunset points, toy trains, cool-climate stays",
  food: "the dishes the region is known for, famous old eateries, street-food lanes, markets and a food walk",
  cultural: "heritage sites, forts, palaces, museums, historic quarters, living art forms and performances (e.g. Kathakali, Theyyam), craft villages",
  romantic: "sunset spots, scenic cafés, boat rides, quiet viewpoints, candle-lit dinners, stays with a view",
  family: "easy-paced sights, parks, zoos, aquariums, museums kids enjoy, safe beaches; fewer long walks",
  wildlife: "national parks, sanctuaries, jungle safaris at the right time of day, bird-watching, elephant camps that treat animals ethically",
  spiritual: "famous temples, churches, mosques and gurudwaras, ghats, ashrams, prayer and aarti timings, dress codes",
  beach: "the best beaches for swimming and sunsets, water sports, beach shacks, lighthouses",
  nightlife: "well-known bars, live music, night markets and late-night food streets",
  relaxing: "fewer items, slow mornings, spas or Ayurveda, lakeside or garden time, cafés; no rushed days",
  photography: "golden-hour viewpoints, colourful streets and markets, iconic landmarks at the best light",
  shopping: "famous markets and bazaars, local crafts, textiles, spices and what to bargain for",
};

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

const DRIVEN = new Set(["own", "rental", "bike"]);

/** Legs the travellers drive (or are driven), where the route is a choice, unlike a train or bus line. */
export function drivenLegs(trip: TripFormValues) {
  const legs = tripLegs(trip);
  if (trip.transport === "mix") return legs.filter((_, i) => DRIVEN.has(trip.legModes[i]));
  return DRIVEN.has(trip.transport) ? legs : [];
}

function roadRules(trip: TripFormValues) {
  const legs = drivenLegs(trip);
  if (!legs.length) return "";
  const which = trip.transport === "mix" ? ` (${legs.map((l) => `${l.from} → ${l.to}`).join(", ")})` : "";
  return `
Road trip rules for the driven legs${which}: the route is a choice, so plan it like an experienced local driver.
  - Choose the best route, not just the shortest: the fastest realistic drive on good roads (4-lane highways and expressways where they exist).
    Name it in the transport item's detail with distance and drive time, e.g. "Via NH544 (Walayar) and NH948 (Mettupalayam), 190 km, about 4h 30m".
  - Safety first: no ghat roads, forest stretches or unlit highways after dark (sunset is about 6–6:30 pm); climb and descend hills in daylight;
    avoid accident-prone and landslide-prone stretches, especially in the monsoon or when heavy rain is forecast; a rest or food stop every 2–2.5 hours.
    If the traveller's departure time would put a ghat or forest section after dark, the FIRST alert on that drive must say so and give the latest
    safe departure time (e.g. "Leave Bengaluru by 11 am to clear the Kallatti ghat before dark"), and "alternatives" must offer a safe overnight
    halt before the ghat (e.g. "Stop the night in Mysuru and drive up at 6 am").
  - Restrictions on the travel date: forest night-traffic bans (e.g. Bandipur–Mudumalai, 9 pm–6 am), e-pass rules (e.g. the Nilgiris, Kodaikanal),
    limits on large vehicles on hairpin roads, interstate permits and tax for rental cars, road closures. Only state rules you are confident about;
    for anything that changes often, tell the traveller to check before leaving.
    A closed road cannot be driven: never schedule a drive through a road at an hour it is closed. If the departure time makes it impossible to
    cross in time, stop for the night before it (e.g. in Mysuru or Gundlupet before Bandipur) and cross at opening time, even though that moves
    the first night away from the destination; explain it in alerts.
  - Traffic: use the trip calendar. Expect weekend and holiday rush on hill-station and beach roads, festival crowds (check these dates for Onam,
    Pongal, Diwali, Dussehra, Christmas–New Year, the Sabarimala season on the Pamba routes) and city rush hours (about 8–11 am and 5–9 pm).
    Time departures to beat them.
  - Put every road warning in that transport item's "alerts", short and specific, e.g. "Bandipur check post closed 9 pm–6 am: cross by 8:30 pm",
    "Weekend queues on the Ooty ghat after 10 am: leave by 7 am". Use "alternatives" for a real alternative route and why
    (e.g. "Via Gundlupet: shorter, but closed at night").`;
}

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

export function buildTripPrompt(trip: TripFormValues, context: PromptContext = {}) {
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
Trip calendar (for traffic, crowds and opening days):
${calendarLines(Array.from({ length: totalDays }, (_, i) => addDays(trip.departDate, i))).join("\n")}${
    context.weather?.length
      ? `
Weather on the trip dates (plan around it: indoor backups on rainy days, no ghat or forest drives in heavy rain):
${context.weather.join("\n")}`
      : ""
  }

Travellers: ${trip.adults} adult(s)${trip.children ? `, ${trip.children} child(ren) aged 2–12` : ""} (${travellers} total)
Moods: ${moods.join(", ")}${trip.customMoods?.length ? " (the last ones were written by the traveller — take them literally)" : ""}${
    trip.moods.length
      ? `
What the moods mean:
${trip.moods.map((id) => `  - ${moodLabel(id)}: ${MOOD_BRIEF[id] ?? "places and activities that match it"}`).join("\n")}`
      : ""
  }
Budget: ${currency.symbol}${trip.budget} per person for the whole trip (currency ${trip.currency})
Travel style: ${STYLE_RULES[trip.travelStyle ?? "balanced"]}
  Priority when style and budget disagree: never exceed the budget for a budget-friendly trip; for other styles stay as close to the style as the budget allows and explain any downgrade in budget.note.
Transport:
${transport.startsWith("  -") ? transport : `  ${transport}`}${roadRules(trip)}

Return the itinerary with currency "${trip.currency}".`;
}

/** Re-plan one day of an existing itinerary, keeping it joined up with the days around it. */
export function buildDayPrompt(trip: TripFormValues, it: Itinerary, dayNo: number, request: string, context: PromptContext = {}) {
  const day = it.days.find((d) => d.day === dayNo);
  if (!day) throw new Error(`Day ${dayNo} is not in this itinerary`);
  const others = it.days.filter((d) => d.day !== dayNo);
  const prev = it.days.find((d) => d.day === dayNo - 1);
  const next = it.days.find((d) => d.day === dayNo + 1);
  const last = day.items[day.items.length - 1];
  const endsAt = last ? last.to || last.location || day.city : day.city;
  const journeys = fixedJourneys(day);
  const used = others.flatMap((d) =>
    d.items.filter((i) => i.kind !== "transport" && i.kind !== "stay").map((i) => `  - Day ${d.day}: ${i.title}${i.location ? ` (${i.location})` : ""}`)
  );
  const stays = [...new Set(others.flatMap((d) => d.items.filter((i) => i.kind === "stay").map((i) => i.title)))];
  const dayCost = dayTotal(day);
  const left = trip.budget - others.reduce((n, d) => n + dayTotal(d), 0);
  const cost =
    left <= 0
      ? `The trip is already at or over its budget of ${money(trip.budget, trip.currency)} per person, so this day should cost no more than now (${money(dayCost, trip.currency)}).`
      : `This day now costs ${money(dayCost, trip.currency)} per person; with the rest of the trip, ${money(left, trip.currency)} per person is left for it. Stay around that unless the request asks for cheaper or more premium.`;

  return `Re-plan ONE day of an existing trip. Return only that day as a single day object matching the schema, not a whole itinerary.

The original trip brief, for context only (do not plan the other days again):
"""
${buildTripPrompt(trip, context)}
"""

The rest of the trip stays exactly as it is:
${others.map((d) => `  - Day ${d.day} (${d.date}): ${d.title}, night in ${d.city}`).join("\n")}

Day to re-plan: Day ${dayNo} (${day.date}), currently "${day.title}", night in ${day.city}.
Its current plan:
${day.items.map((i) => `  ${i.time}${i.endTime ? `–${i.endTime}` : ""} [${i.kind}] ${i.title}`).join("\n")}

What the traveller wants changed on this day: "${request.trim() || "Nothing specific. Give a fresh, clearly different take on this day."}"

Rules for the new Day ${dayNo}:
- Keep "day": ${dayNo} and "date": "${day.date}".
- ${prev ? `It starts where Day ${dayNo - 1} ended: the traveller woke up in ${prev.city}.` : `It starts at ${trip.departTime} from ${trip.origin}.`} ${
    next
      ? `It must end with the night in ${day.city}, because Day ${dayNo + 1} continues from there. Keep "city": "${day.city}".`
      : `It is the last day, so it must still end at ${endsAt}.`
  }
${journeys.length ? `- Keep these journeys and their timings unless the request asks to change them; the rest of the trip depends on them:\n${journeys.map((j) => `    ${j}`).join("\n")}\n` : ""}${
    stays.length ? `- Keep the same stay as the other nights (${stays.join("; ")}) unless the request is about where to stay.\n` : ""
  }- Do NOT repeat anything already planned on other days (sights, activities, restaurants, cafés, experiences):
${used.length ? used.join("\n") : "  (nothing yet)"}
  Pick different, well-reviewed options instead.
- Follow the travel style, moods and "getting between places" rules.
- Money: ${cost} Use realistic local prices. Only the overnight stay item carries the room cost; freshening up or checking out at the hotel costs 0.`;
}
