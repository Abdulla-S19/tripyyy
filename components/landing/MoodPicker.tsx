"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Compass,
  Heart,
  Landmark,
  MountainSnow,
  Music,
  PawPrint,
  Sun,
  Users,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { Reveal, SectionHeading } from "./Section";

type Mood = { id: string; label: string; icon: LucideIcon; adds: string };

const moods: Mood[] = [
  { id: "adventure", label: "Adventure", icon: Compass, adds: "Morning trek to Avalanche Lake with a forest guide" },
  { id: "mountain", label: "Mountain", icon: MountainSnow, adds: "Sunrise at Doddabetta before the tour buses arrive" },
  { id: "food", label: "Food Trail", icon: UtensilsCrossed, adds: "Homemade chocolate crawl and a Badaga meal" },
  { id: "cultural", label: "Cultural", icon: Landmark, adds: "Toda village visit and St. Stephen's Church, 1829" },
  { id: "romantic", label: "Romantic", icon: Heart, adds: "Candle-lit dinner at a colonial bungalow" },
  { id: "family", label: "Family", icon: Users, adds: "Toy train ride and the Thread Garden for the kids" },
  { id: "wildlife", label: "Wildlife", icon: PawPrint, adds: "Evening jeep safari through Mudumalai on the way in" },
  { id: "spiritual", label: "Spiritual", icon: Sun, adds: "Quiet hour at the Ooty Mariamman temple" },
  { id: "beach", label: "Beach", icon: Waves, adds: "Kozhikode beach sunset on the stopover night" },
  { id: "nightlife", label: "Nightlife", icon: Music, adds: "Live music evening at a Charing Cross café" },
];

export function MoodPicker() {
  const [selected, setSelected] = useState<string[]>(["mountain", "food"]);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; mood: string }[]>([]);
  const rippleId = useRef(0);

  const toggle = (id: string, e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    rippleId.current += 1;
    const ripple = { id: rippleId.current, x: e.clientX - rect.left, y: e.clientY - rect.top, mood: id };
    setRipples((r) => [...r, ripple]);
    setTimeout(() => setRipples((r) => r.filter((x) => x.id !== ripple.id)), 650);
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const picked = moods.filter((m) => selected.includes(m.id));

  return (
    <section id="moods" className="relative mx-auto max-w-6xl scroll-mt-24 px-5 py-28 md:py-36">
      <div className="grid gap-14 lg:grid-cols-2 lg:items-start">
        <div>
          <SectionHeading
            eyebrow="Trip mood"
            title={
              <>
                Same destination. <span className="italic text-gold">Your kind of trip.</span>
              </>
            }
            lead="Pick as many moods as you like. The plan changes with them — try it for a weekend in Ooty."
          />

          <Reveal delay={0.1} className="mt-10 flex flex-wrap gap-2.5">
            {moods.map((m) => {
              const on = selected.includes(m.id);
              const Icon = m.icon;
              return (
                <motion.button
                  key={m.id}
                  id={`mood-${m.id}`}
                  type="button"
                  aria-pressed={on}
                  onClick={(e) => toggle(m.id, e)}
                  whileTap={{ scale: 0.94 }}
                  className={cn(
                    "relative flex items-center gap-2 overflow-hidden rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                    on
                      ? "border-gold/70 bg-gold/15 text-gold-soft shadow-glow-gold"
                      : "border-hairline bg-surface/60 text-slate hover:border-gold/30 hover:text-sand"
                  )}
                >
                  <Icon className={cn("size-4 transition-transform duration-300", on && "scale-110")} />
                  {m.label}
                  {ripples
                    .filter((r) => r.mood === m.id)
                    .map((r) => (
                      <motion.span
                        key={r.id}
                        aria-hidden
                        className="pointer-events-none absolute size-10 rounded-full bg-gold/40"
                        style={{ left: r.x - 20, top: r.y - 20 }}
                        initial={{ scale: 0, opacity: 0.7 }}
                        animate={{ scale: 5, opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    ))}
                </motion.button>
              );
            })}
          </Reveal>
        </div>

        <Reveal delay={0.2} className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:mt-24">
          <div aria-hidden className="absolute -right-16 -top-16 size-48 rounded-full bg-gold/10 blur-3xl" />
          <p className="font-mono text-xs text-slate">Ooty · 2 nights</p>
          <p className="mt-1 font-display text-2xl text-sand">What your plan adds</p>

          <ul className="mt-6 min-h-48 space-y-2.5" aria-live="polite">
            <AnimatePresence initial={false} mode="popLayout">
              {picked.length === 0 && (
                <motion.li
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-dashed border-hairline px-4 py-6 text-center text-sm text-slate"
                >
                  Pick a mood to see how the plan changes.
                </motion.li>
              )}
              {picked.map((m) => {
                const Icon = m.icon;
                return (
                  <motion.li
                    layout
                    key={m.id}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="flex items-start gap-3 rounded-2xl border border-hairline bg-ink/40 px-4 py-3"
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-gold" />
                    <div>
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-gold/80">{m.label}</p>
                      <p className="text-sm text-sand">{m.adds}</p>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
