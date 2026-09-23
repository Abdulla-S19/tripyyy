"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Navigation } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal } from "./Section";

export function CallToAction() {
  return (
    <section className="relative px-5 pb-28 md:pb-36">
      <Reveal className="grain relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-gold/20 bg-[radial-gradient(90%_120%_at_50%_0%,var(--tint-4)_0%,var(--tint-5)_55%,var(--ink)_100%)] px-6 py-16 text-center sm:px-12 md:py-24">
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-gold to-transparent"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <p className="eyebrow">Your next trip</p>
        <h2 className="mx-auto mt-5 max-w-3xl font-display text-[clamp(2.3rem,5.6vw,4.2rem)] font-semibold leading-[1.02] tracking-tight text-sand">
          Where are you <span className="text-gold-gradient italic">going next?</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate">
          It takes about two minutes to answer the four questions. You&apos;ll watch your plan come together, day by day, about a minute later.
        </p>

        <div className="mx-auto mt-10 flex max-w-xl flex-col gap-2 rounded-3xl border border-hairline bg-ink/60 p-2 text-left sm:flex-row sm:items-center sm:rounded-full">
          <div className="flex flex-1 items-center gap-3 rounded-full px-4 py-2.5">
            <Navigation className="size-4 shrink-0 text-slate" />
            <div className="min-w-0">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-slate">From</p>
              <p className="truncate text-sm text-sand">Trivandrum</p>
            </div>
          </div>
          <span aria-hidden className="hidden h-8 w-px bg-hairline sm:block" />
          <div className="flex flex-1 items-center gap-3 rounded-full px-4 py-2.5">
            <MapPin className="size-4 shrink-0 text-gold" />
            <div className="min-w-0">
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-slate">To</p>
              <p className="truncate text-sm text-sand">Ooty</p>
            </div>
          </div>
          <Link href="/plan" className={cn(buttonVariants({ size: "xl" }), "shrink-0")}>
            Start planning
            <ArrowRight />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
