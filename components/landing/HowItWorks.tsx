"use client";

import { motion } from "framer-motion";
import { CalendarClock, Route, Sparkles, TrainFront } from "lucide-react";
import { SectionHeading } from "./Section";

const steps = [
  {
    icon: Route,
    title: "Route",
    body: "Start, destination, and any stopovers — like a night in Kozhikode on the way to Ooty.",
    sample: "Trivandrum → Kozhikode → Ooty",
  },
  {
    icon: CalendarClock,
    title: "Schedule",
    body: "When you leave, and whether you're coming back to the same place or somewhere else.",
    sample: "Fri 06:30 · return Mon",
  },
  {
    icon: Sparkles,
    title: "People & vibe",
    body: "How many are travelling, the mood of the trip, and what each person wants to spend.",
    sample: "4 adults · Mountain, Food · ₹8,000",
  },
  {
    icon: TrainFront,
    title: "Transport",
    body: "Bus, train, flight, bike or a rental car — with the best-reviewed rentals if you drive.",
    sample: "Train + KSRTC bus",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-6xl scroll-mt-24 px-5 py-28 md:py-36">
      <SectionHeading
        eyebrow="How it works"
        title={
          <>
            Four questions. <span className="italic text-gold">One complete journey.</span>
          </>
        }
        lead="Answer what you already know about your trip. TRIPYYY fills in everything else — timings, food, places and costs."
      />

      <div className="relative mt-16">
        <motion.div
          aria-hidden
          className="absolute left-0 right-0 top-6 hidden h-px origin-left bg-gradient-to-r from-gold/70 via-gold/30 to-transparent lg:block"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
        />
        <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.li
                key={s.title}
                className="group relative"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 * i }}
              >
                  <div className="flex items-center gap-4">
                    <span className="relative z-10 grid size-12 place-items-center rounded-full border border-gold/35 bg-deep text-gold transition-all duration-500 group-hover:border-gold group-hover:shadow-glow-gold">
                      <Icon className="size-5" />
                    </span>
                    <span className="font-mono text-xs text-slate">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-6 font-display text-2xl text-sand">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-slate">{s.body}</p>
                  <p className="mt-4 inline-block rounded-md border border-hairline bg-surface/60 px-2.5 py-1 font-mono text-xs text-gold-soft/90">
                    {s.sample}
                  </p>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
