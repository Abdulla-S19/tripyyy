"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { STEPS } from "@/store/trip-store";
import { cn } from "@/lib/utils";

export function StepProgress({
  step,
  furthest,
  onJump,
}: {
  step: number;
  furthest: number;
  onJump: (i: number) => void;
}) {
  const pct = (step / (STEPS.length - 1)) * 100;
  return (
    <nav aria-label="Trip builder progress" className="relative">
      <div className="absolute left-4 right-4 top-4 h-px bg-hairline" aria-hidden />
      <motion.div
        aria-hidden
        className="absolute left-4 right-4 top-4 h-px origin-left bg-gradient-to-r from-gold-soft to-gold shadow-[0_0_12px_rgba(223,175,85,0.7)]"
        initial={false}
        animate={{ scaleX: pct / 100 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <ol className="relative flex justify-between">
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          const reachable = i <= furthest && !current;
          return (
            <li key={label} className="flex flex-col items-center gap-2">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onJump(i)}
                aria-current={current ? "step" : undefined}
                aria-label={`${label}${done ? " (done)" : ""}`}
                className={cn(
                  "relative grid size-8 place-items-center rounded-full border font-mono text-xs transition-all duration-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-default",
                  current && "border-gold bg-gold text-on-gold shadow-glow-gold",
                  done && "border-gold/60 bg-ink text-gold hover:bg-gold/15",
                  !current && !done && (reachable ? "border-gold/30 bg-ink text-sand hover:border-gold" : "border-hairline bg-ink text-slate/60")
                )}
              >
                {current && (
                  <motion.span
                    layoutId="step-halo"
                    aria-hidden
                    className="absolute -inset-1.5 rounded-full border border-gold/40"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                {done ? <Check className="size-3.5" /> : i + 1}
              </button>
              <span className={cn("hidden text-xs sm:block", current ? "text-sand" : "text-slate")}>{label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
