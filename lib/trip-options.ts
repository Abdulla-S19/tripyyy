import {
  Baby,
  Bike,
  BookOpen,
  Bus,
  Camera,
  Car,
  CarFront,
  Coffee,
  Compass,
  Dumbbell,
  Fish,
  Flower2,
  Footprints,
  Heart,
  Landmark,
  Leaf,
  MountainSnow,
  Music,
  Navigation,
  PawPrint,
  Plane,
  ShoppingBag,
  Shuffle,
  Snowflake,
  Sparkles,
  Sun,
  Tent,
  TrainFront,
  Users,
  UtensilsCrossed,
  Waves,
  Wine,
  type LucideIcon,
} from "lucide-react";

export const MOODS = [
  { id: "adventure", label: "Adventure", icon: Compass },
  { id: "mountain", label: "Mountain", icon: MountainSnow },
  { id: "food", label: "Food Trail", icon: UtensilsCrossed },
  { id: "cultural", label: "Cultural", icon: Landmark },
  { id: "romantic", label: "Romantic", icon: Heart },
  { id: "family", label: "Family", icon: Users },
  { id: "wildlife", label: "Wildlife", icon: PawPrint },
  { id: "spiritual", label: "Spiritual", icon: Sun },
  { id: "beach", label: "Beach", icon: Waves },
  { id: "nightlife", label: "Nightlife", icon: Music },
  { id: "relaxing", label: "Slow & relaxing", icon: Leaf },
  { id: "photography", label: "Photography", icon: Camera },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
] as const satisfies readonly { id: string; label: string; icon: LucideIcon }[];

export type MoodId = (typeof MOODS)[number]["id"];
export const MOOD_IDS = MOODS.map((m) => m.id) as [MoodId, ...MoodId[]];

const CUSTOM_MOOD_ICONS: [RegExp, LucideIcon][] = [
  [/trek|hik|walk|trail/i, Footprints],
  [/camp|tent|forest|jungle/i, Tent],
  [/photo|camera|insta/i, Camera],
  [/shop|market|bazaar/i, ShoppingBag],
  [/tea|coffee|cafe|plantation/i, Coffee],
  [/wine|bar|brew|drink/i, Wine],
  [/fish|scuba|snorkel|dive/i, Fish],
  [/snow|ski|winter/i, Snowflake],
  [/book|read|history|heritage|museum/i, BookOpen],
  [/garden|flower|nature|green/i, Flower2],
  [/yoga|gym|fit|spa|wellness|ayurved/i, Dumbbell],
  [/kid|baby|child/i, Baby],
  [/beach|sea|lake|river|boat|kayak/i, Waves],
  [/temple|church|mosque|pilgrim|spiritual/i, Landmark],
  [/food|eat|biryani|street|cuisine/i, UtensilsCrossed],
  [/bike|ride|cycl/i, Bike],
  [/music|party|club|dance/i, Music],
];

/** Picks a fitting icon for a mood the traveller typed themselves. */
export const customMoodIcon = (label: string): LucideIcon =>
  CUSTOM_MOOD_ICONS.find(([re]) => re.test(label))?.[1] ?? Sparkles;

export const TRAVEL_STYLES = [
  {
    id: "budget",
    label: "Budget friendly",
    tagline: "Stretch every rupee",
    detail: "Sleeper & 2S seats, KSRTC buses, hostels and local eateries",
    minPerDay: 900,
  },
  {
    id: "balanced",
    label: "Balanced",
    tagline: "Comfort without splurging",
    detail: "3AC & chair car, AC buses, 3-star stays, good restaurants",
    minPerDay: 2200,
  },
  {
    id: "premium",
    label: "Premium",
    tagline: "Treat yourself",
    detail: "2AC, flights when faster, 4-star hotels, cab transfers",
    minPerDay: 5000,
  },
  {
    id: "luxury",
    label: "Luxury",
    tagline: "The very best",
    detail: "1AC or flights, 5-star & heritage stays, private cars, fine dining",
    minPerDay: 11000,
  },
] as const;

export type TravelStyleId = (typeof TRAVEL_STYLES)[number]["id"];
export const TRAVEL_STYLE_IDS = TRAVEL_STYLES.map((s) => s.id) as [TravelStyleId, ...TravelStyleId[]];
export const travelStyleOf = (id: TravelStyleId | undefined) => TRAVEL_STYLES.find((s) => s.id === id) ?? TRAVEL_STYLES[1];

export const TRANSPORT_MODES = [
  { id: "train", label: "Train", icon: TrainFront, hint: "Scenic, cheap, book 2–4 weeks ahead" },
  { id: "bus", label: "Bus", icon: Bus, hint: "KSRTC, state and private sleepers" },
  { id: "flight", label: "Flight", icon: Plane, hint: "Fastest for long legs" },
  { id: "local", label: "No vehicle", icon: Navigation, hint: "Bus or train, then Uber, Rapido bikes or autos" },
  { id: "rental", label: "Rental car", icon: Car, hint: "Self-drive or with a driver" },
  { id: "own", label: "Own vehicle", icon: CarFront, hint: "Your car or bike — we plan fuel, tolls, parking" },
  { id: "bike", label: "Bike rental", icon: Bike, hint: "Rented motorbike for the open road" },
  { id: "mix", label: "Mix", icon: Shuffle, hint: "Choose a mode for each leg" },
] as const satisfies readonly { id: string; label: string; icon: LucideIcon; hint: string }[];

export type TransportId = (typeof TRANSPORT_MODES)[number]["id"];
export type LegModeId = Exclude<TransportId, "mix">;
export const TRANSPORT_IDS = TRANSPORT_MODES.map((t) => t.id) as [TransportId, ...TransportId[]];
export const LEG_MODES = TRANSPORT_MODES.filter((t) => t.id !== "mix");
export const LEG_MODE_IDS = LEG_MODES.map((t) => t.id) as [LegModeId, ...LegModeId[]];

export const CURRENCIES = [
  { id: "INR", symbol: "₹", min: 1000, max: 100000, step: 500 },
  { id: "USD", symbol: "$", min: 20, max: 1500, step: 10 },
  { id: "EUR", symbol: "€", min: 20, max: 1500, step: 10 },
  { id: "AED", symbol: "AED ", min: 50, max: 5000, step: 50 },
] as const;

export type CurrencyId = (typeof CURRENCIES)[number]["id"];
export const CURRENCY_IDS = CURRENCIES.map((c) => c.id) as [CurrencyId, ...CurrencyId[]];
export const currencyOf = (id: CurrencyId) => CURRENCIES.find((c) => c.id === id) ?? CURRENCIES[0];

export const formatMoney = (amount: number, currency: CurrencyId) =>
  currencyOf(currency).symbol + amount.toLocaleString(currency === "INR" ? "en-IN" : "en-US");

export type RentalCar = {
  id: string;
  name: string;
  category: string;
  seats: number;
  transmission: "Manual" | "Automatic";
  features: string[];
  rating: number;
  reviews: number;
  pricePerDay: number;
};

/** Sample fleet for the builder UI; Phase 3 replaces this with AI-sourced local rentals. */
export const RENTAL_CARS: RentalCar[] = [
  { id: "swift", name: "Maruti Swift", category: "Hatchback", seats: 4, transmission: "Manual", features: ["AC", "Great mileage"], rating: 4.4, reviews: 1820, pricePerDay: 1500 },
  { id: "dzire", name: "Maruti Dzire", category: "Sedan", seats: 4, transmission: "Automatic", features: ["AC", "Big boot"], rating: 4.5, reviews: 1340, pricePerDay: 1800 },
  { id: "creta", name: "Hyundai Creta", category: "SUV", seats: 5, transmission: "Automatic", features: ["AC", "High clearance", "Sunroof"], rating: 4.7, reviews: 960, pricePerDay: 2900 },
  { id: "ertiga", name: "Maruti Ertiga", category: "MUV", seats: 7, transmission: "Manual", features: ["AC", "3 rows"], rating: 4.6, reviews: 2110, pricePerDay: 2400 },
  { id: "innova", name: "Toyota Innova Crysta", category: "Premium MUV", seats: 7, transmission: "Automatic", features: ["AC", "Captain seats", "Ghat-road ready"], rating: 4.8, reviews: 2750, pricePerDay: 3800 },
  { id: "thar", name: "Mahindra Thar", category: "4x4", seats: 4, transmission: "Manual", features: ["4WD", "Off-road"], rating: 4.6, reviews: 640, pricePerDay: 3500 },
  { id: "tempo", name: "Force Traveller", category: "Tempo traveller", seats: 12, transmission: "Manual", features: ["AC", "Pushback seats", "Driver included"], rating: 4.5, reviews: 480, pricePerDay: 5200 },
];
