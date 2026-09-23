"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BedDouble, Bus, Camera, TrainFront, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Reveal, SectionHeading } from "./Section";

type Kind = "transport" | "food" | "place" | "stay";
type Entry = { time: string; kind: Kind; title: string; detail: string; cost: string; icon?: LucideIcon };

const kindStyle: Record<Kind, { label: string; icon: LucideIcon; tone: string }> = {
  transport: { label: "Transport", icon: Bus, tone: "text-dusk border-dusk/40 bg-dusk/10" },
  food: { label: "Food", icon: UtensilsCrossed, tone: "text-gold border-gold/40 bg-gold/10" },
  place: { label: "Place", icon: Camera, tone: "text-jade border-jade/40 bg-jade/10" },
  stay: { label: "Stay", icon: BedDouble, tone: "text-slate border-slate/40 bg-slate/10" },
};

const days: { tab: string; title: string; entries: Entry[] }[] = [
  {
    tab: "Fri",
    title: "Trivandrum → Kozhikode",
    entries: [
      { time: "06:30", kind: "transport", icon: TrainFront, title: "Train to Kozhikode", detail: "Chair car, window seats together · 8h 50m", cost: "₹395" },
      { time: "09:30", kind: "food", title: "Breakfast on board", detail: "Appam and egg curry from the pantry car", cost: "₹90" },
      { time: "15:20", kind: "stay", title: "Check in near Beach Road", detail: "2 rooms · 4.3★ · 6 min walk to the beach", cost: "₹700" },
      { time: "16:30", kind: "place", title: "Kozhikode Beach & old lighthouse", detail: "Sunset walk · about 1h 30m", cost: "Free" },
      { time: "19:30", kind: "food", title: "Dinner at Paragon", detail: "Malabar chicken biryani · book a table after 7", cost: "₹420" },
    ],
  },
  {
    tab: "Sat",
    title: "Kozhikode → Ooty",
    entries: [
      { time: "07:00", kind: "transport", title: "KSRTC bus to Ooty", detail: "Via Nilambur and Gudalur ghat · 6h 10m", cost: "₹310" },
      { time: "10:15", kind: "food", title: "Tea stop at Nadukani", detail: "Chai and pazhampori with a valley view", cost: "₹60" },
      { time: "13:30", kind: "stay", title: "Check in at Charing Cross", detail: "Heritage cottage · 2 nights · 4.5★", cost: "₹1,600" },
      { time: "15:00", kind: "place", title: "Government Botanical Garden", detail: "Terraced gardens · about 2h", cost: "₹50" },
      { time: "17:30", kind: "place", title: "Ooty Lake boating", detail: "Pedal boat for four · 30 min", cost: "₹120" },
      { time: "20:00", kind: "food", title: "Nilgiri thali dinner", detail: "Near Charing Cross · vegetarian", cost: "₹280" },
    ],
  },
  {
    tab: "Sun",
    title: "Ooty & Coonoor",
    entries: [
      { time: "07:15", kind: "transport", icon: TrainFront, title: "Nilgiri toy train to Coonoor", detail: "Heritage steam line · 1h 20m · book early", cost: "₹235" },
      { time: "09:00", kind: "place", title: "Sim's Park", detail: "Walk the upper trails · about 1h 30m", cost: "₹40" },
      { time: "12:30", kind: "food", title: "Lunch in Coonoor town", detail: "Bakery lunch and Nilgiri tea tasting", cost: "₹350" },
      { time: "14:30", kind: "transport", title: "Local bus back to Ooty", detail: "1h 10m", cost: "₹40" },
      { time: "16:30", kind: "place", title: "Doddabetta Peak", detail: "Highest point in the Nilgiris · sunset", cost: "₹60" },
    ],
  },
];

const budget = [
  { label: "Transport", value: 1480, color: "bg-dusk" },
  { label: "Stays", value: 2300, color: "bg-slate" },
  { label: "Food", value: 2450, color: "bg-gold" },
  { label: "Places", value: 620, color: "bg-jade" },
];
const total = budget.reduce((a, b) => a + b.value, 0);
const perPersonBudget = 8000;
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export function SamplePlan() {
  const [active, setActive] = useState(0);
  const day = days[active];

  return (
    <section id="sample" className="relative scroll-mt-24 border-y border-hairline bg-deep py-28 md:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_20%_0%,rgba(59,111,212,0.10),transparent),radial-gradient(40%_40%_at_90%_100%,rgba(223,175,85,0.08),transparent)]"
      />
      <div className="relative mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Sample plan"
          title={
            <>
              Not a list of places. <span className="italic text-gold">A plan you can follow.</span>
            </>
          }
          lead="Every hour of the trip is accounted for — the bus you need to catch, where to eat when you get off, and what's worth seeing before dark."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Reveal className="glass rounded-3xl p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-slate">Day {active + 1} of 3</p>
                <p className="mt-1 font-display text-2xl text-sand">{day.title}</p>
              </div>
              <div role="tablist" aria-label="Trip days" className="flex rounded-full border border-hairline bg-ink/50 p-1">
                {days.map((d, i) => (
                  <button
                    key={d.tab}
                    id={`day-tab-${i}`}
                    role="tab"
                    aria-selected={active === i}
                    aria-controls="day-panel"
                    onClick={() => setActive(i)}
                    className={cn(
                      "relative rounded-full px-4 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-gold",
                      active === i ? "text-on-gold" : "text-slate hover:text-sand"
                    )}
                  >
                    {active === i && (
                      <motion.span
                        layoutId="day-pill"
                        className="absolute inset-0 rounded-full bg-gold shadow-glow-gold"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative font-medium">{d.tab}</span>
                  </button>
                ))}
              </div>
            </div>

            <div id="day-panel" role="tabpanel" aria-labelledby={`day-tab-${active}`} className="relative mt-7">
              <AnimatePresence mode="wait">
                <motion.ol
                  key={active}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                  variants={{ show: { transition: { staggerChildren: 0.07 } } }}
                  className="relative space-y-3"
                >
                  <span aria-hidden className="absolute bottom-4 left-[4.75rem] top-4 w-px bg-hairline sm:left-[5.5rem]" />
                  {day.entries.map((e) => {
                    const k = kindStyle[e.kind];
                    const Icon = e.icon ?? k.icon;
                    return (
                      <motion.li
                        key={e.time + e.title}
                        variants={{
                          hidden: { opacity: 0, x: -12 },
                          show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
                        }}
                        className="group relative flex items-center gap-3 sm:gap-4"
                      >
                        <span className="w-12 shrink-0 text-right font-mono text-sm text-sand tabular-nums sm:w-14">{e.time}</span>
                        <span className={cn("relative z-10 grid size-8 shrink-0 place-items-center rounded-full border", k.tone)}>
                          <Icon className="size-3.5" />
                        </span>
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-4 rounded-2xl border border-transparent px-3 py-2.5 transition-all duration-300 group-hover:border-hairline group-hover:bg-surface-2/60">
                          <div className="min-w-0">
                            <p className="font-medium text-sand">{e.title}</p>
                            <p className="text-sm text-slate">{e.detail}</p>
                          </div>
                          <span className="shrink-0 font-mono text-sm text-gold-soft tabular-nums">{e.cost}</span>
                        </div>
                      </motion.li>
                    );
                  })}
                </motion.ol>
              </AnimatePresence>
            </div>
            <p className="mt-6 text-xs text-slate">Sample data for illustration · prices are per person.</p>
          </Reveal>

          <Reveal delay={0.15} className="glass flex flex-col rounded-3xl p-6">
            <p className="eyebrow text-[0.65rem]">Budget per person</p>
            <p className="mt-3 font-mono text-4xl text-sand tabular-nums">{inr(total)}</p>
            <p className="mt-1 text-sm text-slate">of {inr(perPersonBudget)} planned</p>
            <p className="mt-1 text-xs text-slate/80">Whole trip, incl. Monday&apos;s return and every meal.</p>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-ink/70">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-gold-soft to-gold"
                initial={{ width: 0 }}
                whileInView={{ width: `${(total / perPersonBudget) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              />
            </div>

            <ul className="mt-7 space-y-4">
              {budget.map((b, i) => (
                <li key={b.label}>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate">
                      <span className={cn("size-2 rounded-full", b.color)} />
                      {b.label}
                    </span>
                    <span className="font-mono text-sand tabular-nums">{inr(b.value)}</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/70">
                    <motion.div
                      className={cn("h-full rounded-full", b.color)}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(b.value / total) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.12 }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-7 rounded-2xl bg-jade/10 px-4 py-3 text-sm text-jade lg:mt-auto">
              {inr(perPersonBudget - total)} left for shopping and surprises.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
