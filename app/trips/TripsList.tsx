"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, CalendarDays, Cloud, Compass, HardDrive, Link2, LoaderCircle, Plus, Trash, UploadCloud, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { UserMenu } from "@/components/auth/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/landing/Logo";
import { useAuth, useFeatures } from "@/components/providers/AppProviders";
import { CloudError, cloud } from "@/lib/cloud-client";
import { buttonVariants } from "@/components/ui/button";
import { MOODS, customMoodIcon } from "@/lib/trip-options";
import { dayLabel, money } from "@/lib/trip-view";
import { useItineraryHydrated, useItineraryStore, type SavedTrip } from "@/store/itinerary-store";

export function TripsList() {
  const hydrated = useItineraryHydrated();
  const trips = useItineraryStore((s) => s.trips);
  const { mergeCloud, remove, replace } = useItineraryStore.getState();
  const auth = useAuth();
  const features = useFeatures();
  const [sync, setSync] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const signedIn = !!auth.user;
  // Account trips cached in this browser are only shown to their signed-in owner.
  const list = Object.values(trips)
    .filter((t) => signedIn || !t.cloud)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const localOnly = list.filter((t) => !t.cloud);

  useEffect(() => {
    if (!hydrated || !signedIn || sync !== "idle") return;
    queueMicrotask(() => setSync("syncing"));
    cloud
      .list()
      .then((remote) => {
        const ids = new Set(remote.map((t) => t.id));
        for (const t of Object.values(useItineraryStore.getState().trips)) if (t.cloud && !ids.has(t.id)) remove(t.id);
        mergeCloud(remote);
        setSync("done");
      })
      .catch(() => setSync("error"));
  }, [hydrated, signedIn, sync, mergeCloud, remove]);

  const importAll = async () => {
    setImporting(true);
    setImportError(null);
    try {
      const saved = await cloud.import(localOnly);
      for (const { localId, trip } of saved) replace(localId, { ...trip, revokeKey: undefined });
    } catch (e) {
      setImportError((e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  const subtitle = !features.auth
    ? "Plans are saved in this browser."
    : signedIn
      ? "Trips in your account open on any device you sign in on."
      : "Plans are saved in this browser. Sign in to keep them on every device.";

  return (
    <div className="relative isolate flex-1 overflow-x-clip">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(70%_60%_at_80%_0%,var(--tint-1)_0%,transparent_70%)]" />
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
        <Link href="/" aria-label="TRIPYYY home">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
          <Link href="/plan" className={buttonVariants({ size: "lg", className: "h-10 rounded-full px-5" })}>
            <Plus /> Plan a trip
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-24 pt-14">
        <p className="eyebrow flex items-center gap-3">
          <span className="h-px w-8 bg-gold/60" />
          My trips
          {sync === "syncing" && <LoaderCircle className="size-3.5 animate-spin text-slate" aria-label="Syncing with your account" />}
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.2rem,5vw,3.4rem)] font-semibold leading-tight tracking-tight text-sand">
          {hydrated && list.length > 0 ? `${list.length} planned ${list.length === 1 ? "journey" : "journeys"}` : "Your planned journeys"}
        </h1>
        <p className="mt-3 max-w-xl text-slate">{subtitle}</p>
        {sync === "error" && <p className="mt-2 text-sm text-destructive">Couldn&apos;t load trips from your account. Showing the copies saved in this browser.</p>}

        {hydrated && features.auth && !signedIn && auth.status === "unauthenticated" && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/25 bg-gold/[0.06] px-5 py-4">
            <p className="flex items-center gap-2.5 text-sm text-sand">
              <Cloud className="size-4 text-gold" /> Sign in to keep your trips on every device and share them with a link.
            </p>
            <Link href="/signin?next=/trips" className="text-sm font-medium text-gold hover:text-gold-soft">
              Sign in →
            </Link>
          </div>
        )}

        {hydrated && signedIn && localOnly.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/25 bg-gold/[0.06] px-5 py-4">
            <p className="flex items-center gap-2.5 text-sm text-sand">
              <UploadCloud className="size-4 text-gold" />
              {localOnly.length} {localOnly.length === 1 ? "trip is" : "trips are"} only in this browser.
            </p>
            <button type="button" onClick={importAll} disabled={importing} className="flex items-center gap-1.5 text-sm font-medium text-gold hover:text-gold-soft disabled:opacity-60">
              {importing && <LoaderCircle className="size-4 animate-spin" />} Save {localOnly.length === 1 ? "it" : "them"} to my account →
            </button>
            {importError && <p className="w-full text-xs text-destructive">{importError}</p>}
          </div>
        )}

        {!hydrated ? (
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-52 animate-pulse rounded-3xl bg-surface-2/60" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="glass mt-10 flex flex-col items-center rounded-3xl px-6 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold shadow-glow-gold">
              <Compass className="size-6" />
            </span>
            <h2 className="mt-5 font-display text-2xl text-sand">No trips yet</h2>
            <p className="mt-2 max-w-sm text-slate">Answer four quick questions and TRIPYYY builds the whole journey, hour by hour.</p>
            <Link href="/plan" className={buttonVariants({ size: "xl", className: "mt-7" })}>
              Plan my first trip <ArrowRight />
            </Link>
          </div>
        ) : (
          <motion.ul layout className="mt-10 grid gap-4 md:grid-cols-2">
            <AnimatePresence initial={false}>
              {list.map((t, i) => (
                <TripCard key={t.id} t={t} index={i} showWhere={features.auth} />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>
    </div>
  );
}

function TripCard({ t, index, showWhere }: { t: SavedTrip; index: number; showWhere: boolean }) {
  const removeLocal = useItineraryStore((s) => s.remove);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: string) => {
    setError(null);
    if (t.cloud) {
      setDeleting(true);
      try {
        await cloud.remove(id);
      } catch (e) {
        // Already gone on the server is fine; anything else keeps the trip.
        if (!(e instanceof CloudError && e.status === 404)) {
          setError((e as Error).message);
          setDeleting(false);
          return;
        }
      }
    }
    removeLocal(id);
  };
  const it = t.itinerary;
  const days = it.days;
  const route = [t.trip.origin, ...(t.trip.hasStops ? t.trip.waypoints.map((w) => w.city) : []), t.trip.destination];
  const moods = [
    ...MOODS.filter((m) => t.trip.moods.includes(m.id)).map((m) => ({ label: m.label, icon: m.icon })),
    ...(t.trip.customMoods ?? []).map((label) => ({ label, icon: customMoodIcon(label) })),
  ].slice(0, 3);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="glass group relative flex flex-col rounded-3xl p-6 transition-shadow duration-300 hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate">
          {route.map((c, i) => (
            <span key={`${c}-${i}`} className="flex items-center gap-1.5">
              <span className={i === route.length - 1 ? "text-gold-soft" : "text-sand/80"}>{c}</span>
              {i < route.length - 1 && <ArrowRight className="size-3 text-gold/60" />}
            </span>
          ))}
        </p>
        <span className="flex shrink-0 items-center gap-1.5">
          {t.shareToken && (
            <span title="Shared with a link" className="grid size-6 place-items-center rounded-full bg-jade/15 text-jade">
              <Link2 className="size-3" />
            </span>
          )}
          {showWhere && (
            <span className="flex items-center gap-1 rounded-full border border-hairline px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-slate">
              {t.cloud ? <Cloud className="size-3 text-gold" /> : <HardDrive className="size-3" />}
              {t.cloud ? "Account" : "This device"}
            </span>
          )}
        </span>
      </div>
      <h2 className="mt-2 font-display text-2xl leading-snug text-sand">{it.title}</h2>
      <p className="mt-2 line-clamp-2 text-sm text-slate">{it.summary}</p>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <span className="flex items-center gap-1.5 text-sand">
          <CalendarDays className="size-3.5 text-slate" />
          {dayLabel(days[0].date)} · {days.length} day{days.length === 1 ? "" : "s"}
        </span>
        <span className="flex items-center gap-1.5 text-sand">
          <Users className="size-3.5 text-slate" />
          {t.trip.adults + t.trip.children}
        </span>
        <span className="font-mono text-gold-soft">{money(it.budget.totalPerPerson, t.trip.currency)}/person</span>
      </div>

      {moods.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {moods.map((m) => {
            const Icon = m.icon;
            return (
              <span key={m.label} className="flex items-center gap-1 rounded-full border border-gold/25 bg-gold/[0.07] px-2.5 py-1 text-xs text-gold-soft">
                <Icon className="size-3" /> {m.label}
              </span>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-hairline pt-4">
        <Link href={`/trip/${t.id}`} className="flex items-center gap-1.5 text-sm font-medium text-gold transition-colors hover:text-gold-soft">
          Open itinerary <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
        {confirm ? (
          <span className="flex items-center gap-2 text-xs">
            <span className="text-slate">Delete this trip?</span>
            <button
              type="button"
              onClick={() => remove(t.id)}
              disabled={deleting}
              className="flex items-center gap-1 rounded-full bg-destructive/15 px-3 py-1 text-destructive hover:bg-destructive/25 disabled:opacity-60"
            >
              {deleting && <LoaderCircle className="size-3 animate-spin" />} Delete
            </button>
            <button type="button" onClick={() => setConfirm(false)} className="rounded-full px-2 py-1 text-slate hover:text-sand">
              Keep
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            aria-label={`Delete ${it.title}`}
            className="grid size-8 place-items-center rounded-full text-slate transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-2 focus-visible:outline-gold"
          >
            <Trash className="size-4" />
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </motion.li>
  );
}
