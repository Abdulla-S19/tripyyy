"use client";

import { motion } from "framer-motion";
import { Car, Link2, Map as MapIcon, Star, Wallet } from "lucide-react";
import { FeatureMap } from "./FeatureMap";
import { Reveal, SectionHeading } from "./Section";

const rentals = [
  { name: "Maruti Ertiga", meta: "7 seats · manual · AC", rating: "4.6", price: "₹2,400" },
  { name: "Toyota Innova Crysta", meta: "7 seats · automatic · AC", rating: "4.8", price: "₹3,800" },
];


export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl scroll-mt-24 px-5 pb-28 md:pb-36">
      <SectionHeading
        eyebrow="Features"
        title={
          <>
            Everything a trip needs, <span className="italic text-gold">in one place.</span>
          </>
        }
      />

      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
        <Reveal className="glass group relative overflow-hidden rounded-3xl p-6 md:col-span-2 lg:row-span-2">
          <FeatureTitle icon={MapIcon} title="Your route on a live map" body="Every stop, stay and meal pinned in order, with the road drawn between them." />
          <FeatureMap />
        </Reveal>

        <Reveal delay={0.1} className="glass rounded-3xl p-6">
          <FeatureTitle icon={Car} title="Rentals worth driving" body="Driving yourself? We shortlist cars with the best reviews near your start." />
          <ul className="mt-5 space-y-2">
            {rentals.map((r) => (
              <li key={r.name} className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-ink/40 px-3 py-2.5 transition-colors hover:border-gold/30">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-sand">{r.name}</p>
                  <p className="text-xs text-slate">{r.meta}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="flex items-center justify-end gap-1 text-xs text-gold">
                    <Star className="size-3 fill-gold" /> {r.rating}
                  </p>
                  <p className="font-mono text-xs text-sand">{r.price}/day</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.2} className="glass rounded-3xl p-6">
          <FeatureTitle icon={Wallet} title="A budget that adds up" body="Transport, stays, food and entry fees — split per person, checked against what you set." />
          <div className="mt-5 flex items-center gap-4">
            <BudgetRing percent={86} />
            <div>
              <p className="font-mono text-xl text-sand">₹6,850</p>
              <p className="text-sm text-slate">of ₹8,000 per person</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.3} className="glass rounded-3xl p-6 md:col-span-2 lg:col-span-3">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <FeatureTitle icon={Link2} title="Share it with the group" body="Send one link. Everyone sees the same plan, the same timings and their share of the cost." />
            <div className="flex items-center gap-3 self-start rounded-full border border-hairline bg-ink/50 py-1.5 pl-1.5 pr-4 md:self-auto">
              <div className="flex -space-x-2">
                {["A", "R", "S", "M"].map((c, i) => (
                  <span
                    key={c}
                    className="grid size-8 place-items-center rounded-full border-2 border-ink text-xs font-semibold text-on-btn"
                    style={{ background: ["#dfaf55", "#4bae8a", "#3b6fd4", "#f0cf8a"][i] }}
                  >
                    {c}
                  </span>
                ))}
              </div>
              <span className="font-mono text-xs text-slate">tripyyy.app/share/k3Nf9…</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FeatureTitle({ icon: Icon, title, body }: { icon: typeof MapIcon; title: string; body: string }) {
  return (
    <div className="max-w-md">
      <span className="grid size-10 place-items-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
        <Icon className="size-4.5" />
      </span>
      <h3 className="mt-4 font-display text-xl text-sand">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate">{body}</p>
    </div>
  );
}

function BudgetRing({ percent }: { percent: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" aria-hidden className="-rotate-90">
      <circle cx="34" cy="34" r={r} fill="none" stroke="var(--hairline)" strokeWidth="6" />
      <motion.circle
        cx="34"
        cy="34"
        r={r}
        fill="none"
        stroke="#dfaf55"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        whileInView={{ strokeDashoffset: c * (1 - percent / 100) }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
