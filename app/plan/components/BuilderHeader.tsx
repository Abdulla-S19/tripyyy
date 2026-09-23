"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CloudCheck, FolderOpen, House, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { UserMenu } from "@/components/auth/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/landing/Logo";
import { useItineraryStore } from "@/store/itinerary-store";
import { useTripStore } from "@/store/trip-store";

export function BuilderHeader({ ready }: { ready: boolean }) {
  const draft = useTripStore((s) => s.draft);
  const tripCount = useItineraryStore((s) => Object.keys(s.trips).length);
  const [saving, setSaving] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (!ready) return;
    if (first.current) {
      first.current = false;
      return;
    }
    // Only flip on the change itself; the effect below turns the indicator back off.
    const t = setTimeout(() => setSaving(false), 700);
    queueMicrotask(() => setSaving(true));
    return () => clearTimeout(t);
  }, [draft, ready]);

  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
      <Link href="/" aria-label="TRIPYYY home">
        <Logo />
      </Link>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-slate sm:flex" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {saving ? (
              <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                <LoaderCircle className="size-3.5 animate-spin text-gold" /> Saving…
              </motion.span>
            ) : (
              <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                <CloudCheck className="size-3.5 text-jade" /> Draft saved
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <Link
          href="/trips"
          className="flex h-9 items-center gap-2 rounded-full border border-hairline bg-surface/60 px-3.5 text-sm text-sand transition-all hover:border-gold/50 hover:text-gold-soft focus-visible:outline-2 focus-visible:outline-gold"
        >
          <FolderOpen className="size-4" />
          My trips
          {tripCount > 0 && (
            <span className="grid min-w-5 place-items-center rounded-full bg-gold px-1.5 font-mono text-[10px] font-semibold text-on-gold">{tripCount}</span>
          )}
        </Link>
        <ThemeToggle />
        <UserMenu />
        <Link
          href="/"
          aria-label="Back to home — your draft is kept"
          title="Home (your draft is kept)"
          className="grid size-9 place-items-center rounded-full text-slate transition-colors hover:bg-surface-2 hover:text-sand focus-visible:outline-2 focus-visible:outline-gold"
        >
          <House className="size-4" />
        </Link>
      </div>
    </header>
  );
}
