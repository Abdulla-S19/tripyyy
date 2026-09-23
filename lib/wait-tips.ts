import type { TripFormValues } from "./trip-schema";

type Tag =
  | "any"
  | "train"
  | "bus"
  | "flight"
  | "drive"
  | "bike"
  | "local"
  | "hills"
  | "beach"
  | "spiritual"
  | "wildlife"
  | "food"
  | "family"
  | "budget"
  | "night";

export type WaitTip = { text: string; tags: Tag[] };

/** Practical tips shown while a plan is generating, picked to match the trip. */
export const WAIT_TIPS: WaitTip[] = [
  // Everyone
  { tags: ["any"], text: "Keep a printed or digital ID handy: it's checked on trains, at hotel check-in and at many monuments." },
  { tags: ["any"], text: "Save your tickets and hotel confirmations offline. Signal drops on ghat roads and in forests." },
  { tags: ["any"], text: "UPI works almost everywhere, but carry some cash for tea stalls, autos, temple lockers and parking." },
  { tags: ["any"], text: "Start early. Most sights are quieter and cooler before 10 am." },
  { tags: ["any"], text: "Share your live location with someone at home for long road legs and late arrivals." },
  { tags: ["any"], text: "Carry a power bank. Navigation, UPI and photos drain a phone by afternoon." },
  { tags: ["any"], text: "Many monuments close one day a week, often Monday. Check before you go." },
  { tags: ["any"], text: "Keep a small first-aid pouch: plasters, ORS, antacid, motion-sickness tablets and your regular medicines." },
  { tags: ["any"], text: "Refill a bottle instead of buying plastic. Many stations and cafés have RO water." },
  { tags: ["any"], text: "Dress modestly for temples, mosques and churches: cover shoulders and knees, and remove footwear where asked." },
  { tags: ["any"], text: "Monsoon (June to September) brings landslides on hill roads. Keep a buffer in your plan." },
  { tags: ["any"], text: "Save 112, India's single emergency number, and your hotel's number in your phone." },
  { tags: ["any"], text: "Ask before photographing people, especially in villages and at religious ceremonies." },

  // Trains
  { tags: ["train"], text: "Book Indian Railways tickets as early as possible. Popular trains fill up weeks ahead." },
  { tags: ["train"], text: "Missed the booking? Tatkal tickets open one day before travel: 10 am for AC classes, 11 am for sleeper." },
  { tags: ["train"], text: "Check your PNR status the morning you travel. Waitlisted tickets can confirm at the last minute." },
  { tags: ["train"], text: "Reach the station 30 minutes early. Platforms can change, and big stations take time to cross." },
  { tags: ["train"], text: "Carry a light shawl for overnight AC trains. The coaches get cold after midnight." },
  { tags: ["train"], text: "Keep bags chained under the berth on overnight trains. Small locks cost ₹50 at most stations." },
  { tags: ["train"], text: "Order hot meals to your seat through IRCTC eCatering at major stops." },

  // Buses
  { tags: ["bus"], text: "Book KSRTC and state buses on their official apps. The seat map shows exactly where you'll sit." },
  { tags: ["bus"], text: "On ghat roads, pick a front seat or a window on the valley side, and take motion-sickness tablets early." },
  { tags: ["bus"], text: "Overnight buses stop for food around 11 pm. Keep snacks and water in case the stop is short." },
  { tags: ["bus"], text: "Note the bus number plate and the conductor's number from your ticket SMS for late boardings." },

  // Flights
  { tags: ["flight"], text: "Domestic flights allow one cabin bag of about 7 kg. Pack liquids under 100 ml in a clear pouch." },
  { tags: ["flight"], text: "Use DigiYatra for faster airport entry at supported airports. Set it up in the app before the day." },
  { tags: ["flight"], text: "Web check-in opens 48 hours before most domestic flights, and window seats go fast." },

  // Own car or rental
  { tags: ["drive"], text: "Recharge your FASTag before the trip. Tolls paid without it cost more, up to double in cash." },
  { tags: ["drive"], text: "Ghat roads are slow. Plan on about 30 km an hour through the hills, and use low gear going downhill." },
  { tags: ["drive"], text: "Fill up before hill stretches and forest routes. Fuel stations can be 60 km or more apart." },
  { tags: ["drive"], text: "Some forest checkposts close at night, such as Bandipur, Mudumalai and Muthanga. Time your crossing." },
  { tags: ["drive"], text: "Rental cars: photograph every scratch at pickup and note the fuel level. It saves arguments later." },
  { tags: ["drive"], text: "Carry your licence and RC (or rental papers). Police checks are common near state borders." },

  // Bikes
  { tags: ["bike"], text: "Wear a proper full-face helmet. Hill roads have gravel on hairpin bends after rain." },
  { tags: ["bike"], text: "Pack a rain cover for your bag and ride slowly through mist. Visibility can drop within minutes." },

  // No vehicle: public transport plus apps
  { tags: ["local"], text: "Rapido and Uber bike taxis are the cheapest way to cover a few kilometres solo." },
  { tags: ["local"], text: "In small towns, app cabs can be scarce. Ask your stay for a trusted auto driver's number." },
  { tags: ["local"], text: "Prepaid auto counters at big stations stop overcharging late at night." },
  { tags: ["local"], text: "Agree on the fare before an auto ride, or ask the driver to use the meter." },

  // Places
  { tags: ["hills"], text: "Hill stations get cold after sunset, even in summer. Pack a light jacket." },
  { tags: ["hills"], text: "Book toy-train seats weeks ahead. The Nilgiri and Darjeeling lines sell out fast." },
  { tags: ["hills"], text: "Mist rolls in by afternoon in the hills. See viewpoints in the morning for clear views." },
  { tags: ["beach"], text: "Swim only at flagged beaches with lifeguards. Currents on Indian coasts can be strong, especially in monsoon." },
  { tags: ["beach"], text: "Carry reef-safe sunscreen and a cap. Coastal sun burns faster than it feels." },
  { tags: ["spiritual"], text: "Big temples have dress codes and bag rules. Keep a dhoti or dupatta and use the cloakroom." },
  { tags: ["spiritual"], text: "Darshan queues are shortest at opening time. Many temples also sell special-entry tickets." },
  { tags: ["wildlife"], text: "Book forest safaris on the official portal. Morning slots have the best sightings." },
  { tags: ["wildlife"], text: "Wear earthy colours on safari, and never feed or call out to animals." },

  // People and style
  { tags: ["food"], text: "Eat where locals queue. High turnover means fresh food, especially at street stalls." },
  { tags: ["food"], text: "Ask for less spice with a smile: kam teekha in the north, erivu kurachu in Kerala." },
  { tags: ["family"], text: "Carry snacks, wet wipes and a change of clothes for kids on long journeys." },
  { tags: ["family"], text: "Children under 5 travel free on Indian Railways without a berth. Book one if you want the space." },
  { tags: ["budget"], text: "Government tourism lodges (KTDC, TTDC and others) are clean, central and often cheaper than private hotels." },
  { tags: ["budget"], text: "Unreserved (general) tickets can be bought in the UTS app, with no queue at the counter." },
  { tags: ["budget"], text: "Thali lunches are the best-value meal in India: filling, fresh and usually unlimited." },
  { tags: ["night"], text: "Arriving late? Tell your stay your arrival time so check-in stays open." },
];

/** Tips matching the trip first, shuffled, then general ones. */
export function pickTips(trip: TripFormValues, max = 14): string[] {
  const tags = new Set<Tag>(["any"]);
  const modes = trip.transport === "mix" ? trip.legModes : [trip.transport];
  for (const m of modes) {
    if (m === "train") tags.add("train");
    if (m === "bus") tags.add("bus");
    if (m === "flight") tags.add("flight");
    if (m === "rental" || m === "own") tags.add("drive");
    if (m === "bike" || (m === "own" && trip.ownVehicle === "bike")) tags.add("bike");
    if (m === "local") for (const t of ["local", "train", "bus"] as const) tags.add(t);
  }
  const moods = new Set<string>(trip.moods);
  const custom = (trip.customMoods ?? []).join(" ").toLowerCase();
  if (moods.has("mountain") || moods.has("adventure") || /hill|trek|tea|mountain/.test(custom)) tags.add("hills");
  if (moods.has("beach") || /beach|sea|coast/.test(custom)) tags.add("beach");
  if (moods.has("spiritual") || /temple|pilgrim/.test(custom)) tags.add("spiritual");
  if (moods.has("wildlife") || /safari|forest|wildlife/.test(custom)) tags.add("wildlife");
  if (moods.has("food") || /food|biryani|street/.test(custom)) tags.add("food");
  if (moods.has("family") || trip.children > 0) tags.add("family");
  if (trip.travelStyle === "budget") tags.add("budget");
  const [h] = (trip.departTime || "12:00").split(":").map(Number);
  if (h >= 18 || h < 5) tags.add("night");

  const shuffle = <T,>(a: T[]) => a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map(([, v]) => v);
  const specific = shuffle(WAIT_TIPS.filter((t) => !t.tags.includes("any") && t.tags.some((g) => tags.has(g))));
  const general = shuffle(WAIT_TIPS.filter((t) => t.tags.includes("any")));
  // Interleave two trip-specific tips per general one so the most relevant advice comes first.
  const out: string[] = [];
  while (out.length < max && (specific.length || general.length)) {
    for (let k = 0; k < 2 && specific.length; k++) out.push(specific.shift()!.text);
    if (general.length) out.push(general.shift()!.text);
  }
  return out.slice(0, max);
}
