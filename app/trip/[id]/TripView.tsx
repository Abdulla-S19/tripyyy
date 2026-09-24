"use client";

import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, ChevronsDownUp, ChevronsUpDown, MapPinned, Moon, Plus, Users, Wallet } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { BackToTop } from "@/components/BackToTop";
import { Logo } from "@/components/landing/Logo";
import { buttonVariants } from "@/components/ui/button";
import { MOODS, customMoodIcon, travelStyleOf } from "@/lib/trip-options";
import { dayLabel, routeStops, type MapFocus } from "@/lib/trip-view";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/auth/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/components/providers/AppProviders";
import { cloud } from "@/lib/cloud-client";
import { replanDay } from "@/lib/generate-client";
import type { Itinerary } from "@/types/itinerary";
import { useItineraryHydrated, useItineraryStore, type SavedTrip } from "@/store/itinerary-store";
import { BudgetPanel } from "./components/BudgetPanel";
import { DaySection } from "./components/DaySection";
import { PrintItinerary } from "./components/PrintItinerary";
import { PackingPanel, RentalsPanel, TipsPanel } from "./components/SidePanels";
import { TripActions } from "./components/TripActions";
import { TripSkeleton } from "./components/TripSkeleton";
import { useTripWeather } from "./components/useTripWeather";

const TripMap = dynamic(() => import("./components/TripMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-3xl bg-surface-2/60" />,
});

const ease = [0.22, 1, 0.36, 1] as const;

const DESKTOP = "(min-width: 1024px)";
const isDesktop = () => window.matchMedia(DESKTOP).matches;
const subscribeDesktop = (cb: () => void) => {
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** Loads a trip from this browser, falling back to the signed-in user's account. */
export function TripView({ id }: { id: string }) {
  const hydrated = useItineraryHydrated();
  const saved = useItineraryStore((s) => s.trips[id]);
  const mergeCloud = useItineraryStore((s) => s.mergeCloud);
  const auth = useAuth();
  const [lookup, setLookup] = useState<"idle" | "loading" | "missing">("idle");

  const needsCloud = hydrated && !saved && auth.status !== "loading";
  useEffect(() => {
    if (!needsCloud || lookup !== "idle") return;
    if (!auth.user) {
      queueMicrotask(() => setLookup("missing"));
      return;
    }
    queueMicrotask(() => setLookup("loading"));
    cloud
      .get(id)
      .then((t) => mergeCloud([t]))
      .catch(() => setLookup("missing"));
  }, [needsCloud, lookup, auth.user, id, mergeCloud]);

  if (!hydrated || (!saved && lookup !== "missing")) return <TripSkeleton />;

  if (!saved) {
    const signedOut = auth.status === "unauthenticated";
    return (
      <div className="grid flex-1 place-items-center px-5 py-24">
        <div className="glass max-w-md rounded-3xl p-8 text-center">
          <h1 className="font-display text-3xl text-sand">Trip not found</h1>
          <p className="mt-3 text-slate">
            {signedOut
              ? "If you saved this trip to your account, sign in to open it here."
              : "Trips planned without an account are saved on the device that planned them."}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {signedOut && (
              <Link href={`/signin?next=${encodeURIComponent(`/trip/${id}`)}`} className={buttonVariants({ size: "xl" })}>
                Sign in
              </Link>
            )}
            <Link href="/plan" className={buttonVariants({ size: "xl", variant: signedOut ? "glass" : "default" })}>
              Plan a trip
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <TripDocument saved={saved} mode="owner" />;
}

/** The full itinerary view. "shared" is the read-only public page behind a share link. */
export function TripDocument({ saved, mode }: { saved: SavedTrip; mode: "owner" | "shared" }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [activeDay, setActiveDay] = useState(1);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const desktop = useSyncExternalStore(subscribeDesktop, isDesktop, () => false);
  const updateTrip = useItineraryStore((s) => s.update);
  // Changing one day: which day is busy, per-day errors, and the previous plan for Undo.
  const [busyDay, setBusyDay] = useState<number | null>(null);
  const [replanErrors, setReplanErrors] = useState<Record<number, string>>({});
  const [changed, setChanged] = useState<{ day: number; prev: Itinerary } | null>(null);

  const days = saved?.itinerary.days;
  const weather = useTripWeather(days);
  const stops = useMemo(() => (saved ? routeStops(saved.trip, saved.itinerary) : []), [saved]);
  const isOpen = (d: number) => open[d] ?? true;

  // The day nearest the top of the viewport drives the map and the day chips.
  useEffect(() => {
    if (!days) return;
    const els = days.map((d) => document.getElementById(`day-${d.day}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveDay(Number((visible[0].target as HTMLElement).dataset.day));
      },
      { rootMargin: "-30% 0px -55% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [days]);

  const { itinerary: it, trip, id } = saved;
  if (!days) return null;
  const travellers = trip.adults + trip.children;
  const moods = [
    ...MOODS.filter((m) => trip.moods.includes(m.id)).map((m) => ({ id: m.id, label: m.label, icon: m.icon })),
    ...(trip.customMoods ?? []).map((label) => ({ id: `custom-${label}`, label, icon: customMoodIcon(label) })),
  ];
  const allOpen = days.every((d) => isOpen(d.day));
  const currentDay = days.find((d) => d.day === activeDay) ?? days[0];

  const jumpTo = (d: number) => {
    setOpen((o) => ({ ...o, [d]: true }));
    requestAnimationFrame(() => document.getElementById(`day-${d}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const print = () => window.print();

  // Browser copy first; account trips also save to the server, so share links show the new day.
  const saveItinerary = (next: Itinerary) => {
    updateTrip(id, { itinerary: next });
    if (saved.cloud) cloud.updateItinerary(id, next).catch((e) => console.error("[replan] couldn't save to account", e));
  };

  const changeDay = async (dayNo: number, request: string) => {
    setBusyDay(dayNo);
    setReplanErrors((e) => ({ ...e, [dayNo]: "" }));
    try {
      const result = await replanDay(trip, it, dayNo, request);
      setChanged({ day: dayNo, prev: it });
      saveItinerary(result.itinerary);
    } catch (e) {
      setReplanErrors((errs) => ({ ...errs, [dayNo]: (e as Error).message }));
    } finally {
      setBusyDay(null);
    }
  };

  const undoChange = () => {
    if (!changed) return;
    saveItinerary(changed.prev);
    setChanged(null);
  };

  const showOnMap = (f: MapFocus) => {
    setFocus(f);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      document.getElementById("trip-map")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <>
    <PrintItinerary trip={trip} itinerary={it} stops={stops} />
    <BackToTop threshold={700} />
    <div className="relative isolate flex-1 overflow-x-clip print:hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem] bg-[radial-gradient(70%_60%_at_80%_0%,var(--tint-1)_0%,transparent_70%),radial-gradient(40%_40%_at_0%_20%,rgba(223,175,85,0.06),transparent)] print:hidden" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)] print:hidden">
        <Link href="/" aria-label="TRIPYYY home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <ThemeToggle />
          {mode === "shared" ? (
            <Link href="/plan" className={buttonVariants({ size: "lg", className: "h-10 rounded-full px-5" })}>
              Plan your own trip <ArrowRight />
            </Link>
          ) : (
            <>
              <Link href="/trips" className="rounded-full px-3 py-1.5 text-slate transition-colors hover:text-sand">
                My trips
              </Link>
              <Link href="/plan" className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-slate transition-colors hover:text-sand">
                <Plus className="size-4" /> New trip
              </Link>
              <UserMenu />
            </>
          )}
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-24 pt-12 print:pt-0">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
          <p className="eyebrow flex items-center gap-3">
            <span className="h-px w-8 bg-gold/60" />
            {mode === "shared" ? "Shared itinerary" : "Your itinerary"}
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-[clamp(2.4rem,5.8vw,4.4rem)] font-semibold leading-[1.02] tracking-tight text-sand">{it.title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate">{it.summary}</p>

          <ul className="mt-6 flex flex-wrap gap-2 text-sm">
            <Chip icon={<CalendarDays className="size-3.5" />}>
              {dayLabel(days[0].date)} – {dayLabel(days[days.length - 1].date)}
            </Chip>
            <Chip icon={<Moon className="size-3.5" />}>
              {days.length - 1} night{days.length === 2 ? "" : "s"}
            </Chip>
            <Chip icon={<Users className="size-3.5" />}>
              {travellers} travelling
            </Chip>
            <Chip icon={<Wallet className="size-3.5" />}>{travelStyleOf(trip.travelStyle).label}</Chip>
            {moods.map((m) => {
              const Icon = m.icon;
              return (
                <Chip key={m.id} icon={<Icon className="size-3.5" />} gold>
                  {m.label}
                </Chip>
              );
            })}
          </ul>

          <div className="mt-7">
            <TripActions saved={saved} mode={mode} onPrint={print} />
          </div>
        </motion.div>

        <motion.ol
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.4 } } }}
          className="mt-10 flex flex-wrap items-center gap-y-3"
          aria-label="Route"
        >
          {stops.map((s, i) => (
            <motion.li key={`${s.name}-${i}`} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className="flex items-center">
              <span
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm",
                  s.kind === "end" ? "border-gold/60 bg-gold/10 text-gold-soft" : "border-hairline bg-surface/60 text-sand"
                )}
              >
                {s.name}
                {s.kind === "stop" && (
                  <span className="ml-1.5 font-mono text-xs text-slate">
                    {trip.waypoints.find((w) => w.city === s.name)?.nights ?? 0}n
                  </span>
                )}
                {s.kind === "return" && <span className="ml-1.5 text-xs text-slate">home</span>}
              </span>
              {i < stops.length - 1 && <ArrowRight className="mx-2 size-3.5 text-gold/70" aria-hidden />}
            </motion.li>
          ))}
        </motion.ol>
        {(trip.sideTrips?.length ?? 0) > 0 && (
          <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-slate">
            <MapPinned className="size-4 text-gold" /> Day trips from {trip.destination}:
            {trip.sideTrips.map((p) => (
              <span key={p} className="rounded-full border border-gold/25 bg-gold/[0.07] px-2.5 py-0.5 text-xs text-gold-soft">
                {p}
              </span>
            ))}
          </p>
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_26rem]">
          {!desktop && (
            <div id="trip-map" className="h-[20rem] sm:h-[24rem] print:hidden">
              <TripMap stops={stops} day={currentDay} focus={focus} onFocus={setFocus} />
            </div>
          )}

          <div className="min-w-0">
            <div className="sticky top-[calc(env(safe-area-inset-top,0px)+12px)] z-20 mb-5 flex items-center gap-2 rounded-2xl border border-hairline bg-ink/80 p-1.5 backdrop-blur-xl print:hidden">
              <nav aria-label="Jump to day" className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
                {days.map((d) => (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => jumpTo(d.day)}
                    aria-current={d.day === activeDay ? "true" : undefined}
                    className={cn(
                      "relative shrink-0 rounded-xl px-3.5 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-gold",
                      d.day === activeDay ? "text-on-gold" : "text-slate hover:text-sand"
                    )}
                  >
                    {d.day === activeDay && (
                      <motion.span layoutId="active-day" className="absolute inset-0 rounded-xl bg-gold shadow-glow-gold" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                    )}
                    <span className="relative block text-xs font-semibold">Day {d.day}</span>
                    <span className="relative block font-mono text-[10px] opacity-80">{dayLabel(d.date, { day: "numeric", month: "short" })}</span>
                  </button>
                ))}
              </nav>
              <button
                type="button"
                onClick={() => setOpen(Object.fromEntries(days.map((d) => [d.day, !allOpen])))}
                className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-slate transition-colors hover:text-sand focus-visible:outline-2 focus-visible:outline-gold"
              >
                {allOpen ? <ChevronsDownUp className="size-4" /> : <ChevronsUpDown className="size-4" />}
                <span className="hidden sm:inline">{allOpen ? "Collapse all" : "Expand all"}</span>
              </button>
            </div>

            <div className="space-y-5">
              {days.map((d) => (
                <DaySection
                  key={d.day}
                  day={d}
                  currency={trip.currency}
                  open={isOpen(d.day)}
                  onToggle={() => setOpen((o) => ({ ...o, [d.day]: !isOpen(d.day) }))}
                  onFocus={showOnMap}
                  active={d.day === activeDay}
                  weather={weather[d.date]}
                  change={
                    mode === "owner"
                      ? {
                          state: { busy: busyDay === d.day, error: replanErrors[d.day] || null, changed: changed?.day === d.day },
                          locked: busyDay !== null && busyDay !== d.day,
                          onSubmit: (request) => void changeDay(d.day, request),
                          onUndo: undoChange,
                          onDismiss: () => setChanged(null),
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pb-2 lg:[scrollbar-width:thin]">
            {desktop && (
              <div className="print:hidden">
                <div className="h-[22rem]">
                  <TripMap stops={stops} day={currentDay} focus={focus} onFocus={setFocus} />
                </div>
                <p className="mt-2 flex items-center gap-1.5 px-1 text-xs text-slate">
                  <MapPinned className="size-3.5 text-gold" /> Showing Day {currentDay.day} · {currentDay.city}
                </p>
              </div>
            )}
            <BudgetPanel itinerary={it} budget={trip.budget} currency={trip.currency} travellers={travellers} />
            <RentalsPanel rentals={it.rentals} currency={trip.currency} />
            <TipsPanel tips={it.tips} />
            <PackingPanel items={it.packing} tripId={id} />
            <p className="px-2 text-xs leading-relaxed text-slate/70">
              AI-generated plan. Check timings, availability and prices with operators before booking.
            </p>
          </aside>
        </div>
      </div>
    </div>
    </>
  );
}

function Chip({ icon, children, gold }: { icon: React.ReactNode; children: React.ReactNode; gold?: boolean }) {
  return (
    <li
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5",
        gold ? "border-gold/30 bg-gold/10 text-gold-soft" : "border-hairline bg-surface/60 text-sand"
      )}
    >
      <span className={gold ? "text-gold" : "text-slate"}>{icon}</span>
      {children}
    </li>
  );
}
