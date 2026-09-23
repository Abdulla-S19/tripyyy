"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Check, ChevronRight, Lightbulb, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ItineraryDay } from "@/types/itinerary";

const WARMUP = ["Finding your route", "Timing buses and trains", "Choosing food stops", "Picking places for your mood"];

const ROUTE = "M30 150 C 110 60, 190 190, 270 110 S 420 40, 490 90";

export type GenerationState =
  | { status: "loading"; expectedDays: number; days: ItineraryDay[]; retrying: string | false }
  | { status: "done"; expectedDays: number; days: ItineraryDay[] }
  | { status: "error"; message: string };

export function GeneratingScreen({
  cities,
  tips,
  state,
  onCancel,
  onRetry,
  onBack,
}: {
  cities: string[];
  /** Tips picked for this trip (lib/wait-tips.ts), shown one at a time while the plan is written. */
  tips: string[];
  state: GenerationState;
  onCancel: () => void;
  onRetry: () => void;
  onBack: () => void;
}) {
  const reduce = useReducedMotion();
  const [warm, setWarm] = useState(0);
  const [tip, setTip] = useState(0);
  const loading = state.status === "loading";
  const days = state.status === "error" ? [] : state.days;
  const expected = state.status === "error" ? 1 : Math.max(state.expectedDays, 1);

  useEffect(() => {
    if (!loading) return;
    const a = setInterval(() => setWarm((s) => Math.min(s + 1, WARMUP.length - 1)), 4500);
    const b = setInterval(() => setTip((s) => (s + 1) % Math.max(tips.length, 1)), 7000);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [loading, tips.length]);

  // Settled progress (where we are) and a creep target the line drifts toward while the next day is being written.
  const milestone = (n: number) => 0.08 + (n / expected) * 0.88;
  const progress = state.status === "done" ? 1 : days.length === 0 ? 0.04 : milestone(days.length);
  const creepTarget = state.status === "done" ? 1 : days.length >= expected ? 0.98 : milestone(days.length + 0.85);
  const creepSeconds = days.length === 0 ? 32 : 13;
  const labels = cities.filter(Boolean).length > 1 ? cities.filter(Boolean) : ["Start", "Destination"];
  const pts = labels.map((_, i) => i / (labels.length - 1));
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);

  const headline =
    state.status === "done"
      ? "Your journey is ready."
      : state.status === "loading" && state.retrying && days.length === 0
        ? `${state.retrying}…`
        : days.length === 0
          ? `${WARMUP[warm]}…`
          : days.length >= expected
            ? "Adding budget and tips…"
            : `Planning day ${days.length + 1} of ${expected}…`;

  return (
    <div className="py-2 text-center" aria-live="polite">
      <div className="relative mx-auto max-w-lg">
        <svg viewBox="0 0 520 200" className="h-auto w-full" aria-hidden>
          <path
            id="gen-route"
            ref={(el) => {
              if (!el || points.length === pts.length) return;
              const len = el.getTotalLength();
              setPoints(pts.map((t) => {
                const p = el.getPointAtLength(t * len);
                return { x: p.x, y: p.y };
              }));
            }}
            d={ROUTE}
            fill="none"
            stroke="var(--hairline)"
            strokeWidth="2"
            strokeDasharray="2 8"
            strokeLinecap="round"
          />
          <motion.path
            d={ROUTE}
            fill="none"
            stroke="#dfaf55"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: state.status === "error" ? 0 : loading && !reduce ? creepTarget : progress }}
            transition={loading && !reduce ? { duration: creepSeconds, ease: [0.15, 0.5, 0.35, 1] } : { duration: 1, ease: "easeInOut" }}
            style={{ filter: "drop-shadow(0 0 6px rgba(223,175,85,0.8))" }}
          />
          {loading && !reduce && (
            <circle r="6" fill="#f0cf8a" style={{ filter: "drop-shadow(0 0 8px #dfaf55)" }}>
              <animateMotion dur="3.2s" repeatCount="indefinite">
                <mpath href="#gen-route" />
              </animateMotion>
            </circle>
          )}
          {points.map((pt, i) => {
            const reached = progress >= pts[i] - 0.001;
            const last = i === labels.length - 1;
            return (
              <g key={i}>
                <circle cx={pt.x} cy={pt.y} r={last ? 7 : 5} fill={reached ? (last ? "#dfaf55" : "var(--sand)") : "var(--surface-2)"} stroke={reached ? "#dfaf55" : "var(--hairline-strong)"} strokeWidth="2" style={{ transition: "fill .5s" }} />
                <text x={pt.x} y={pt.y + (pt.y > 120 ? 26 : -16)} textAnchor="middle" fill={reached ? "var(--sand)" : "var(--slate)"} fontSize="13" fontFamily="var(--font-inter)">
                  {labels[i].length > 14 ? labels[i].slice(0, 13) + "…" : labels[i]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <AnimatePresence mode="wait">
        {state.status === "error" ? (
          <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mx-auto mt-2 grid size-12 place-items-center rounded-full border border-destructive/40 bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <h1 className="mt-5 font-display text-2xl text-sand sm:text-3xl">We couldn&apos;t finish your plan</h1>
            <p className="mx-auto mt-2 max-w-md text-slate">{state.message}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button type="button" size="xl" onClick={onRetry}>
                <RotateCcw /> Try again
              </Button>
              <Button type="button" variant="glass" size="xl" onClick={onBack}>
                <ArrowLeft /> Back to review
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="eyebrow mt-2 tabular-nums">
              {state.status === "done" ? "Done" : `${Math.min(days.length, expected)} of ${expected} days planned`}
            </p>
            <div className="relative mt-3 h-10 overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.h1
                  key={headline}
                  initial={{ y: 28, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -28, opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="font-display text-2xl text-sand sm:text-3xl"
                >
                  {headline}
                </motion.h1>
              </AnimatePresence>
            </div>

            {/* grid-cols-1 = minmax(0,1fr): long truncated titles can't force the column wider than the card. */}
            <ol className="mx-auto mt-6 grid w-full max-w-md grid-cols-1 gap-2 text-left">
              {Array.from({ length: expected }, (_, i) => {
                const d = days[i];
                const current = loading && i === days.length;
                // Rail from this day's badge down to the next one: full once the next day exists, creeping while it's being written.
                const railFull = state.status === "done" || i + 1 < days.length;
                const railCreep = loading && !!d && i + 1 === days.length;
                return (
                  <li
                    key={i}
                    className={
                      "relative flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors duration-500 " +
                      (d ? "border-gold/25 bg-gold/[0.05]" : current ? "border-hairline bg-ink/40" : "border-hairline/60 bg-transparent")
                    }
                  >
                    <span
                      className={
                        "grid size-7 shrink-0 place-items-center rounded-full border font-mono text-xs " +
                        (d ? "border-gold bg-gold text-on-gold" : current ? "border-gold/60 text-gold" : "border-hairline text-slate/50")
                      }
                    >
                      {d ? <Check className="size-3.5" /> : i + 1}
                    </span>
                    {i < expected - 1 && (
                      <span aria-hidden className="absolute left-[1.875rem] top-[2.5rem] z-10 h-[calc(100%-1.25rem)] w-px -translate-x-1/2 bg-hairline">
                        <motion.span
                          className="absolute inset-0 origin-top bg-gradient-to-b from-gold to-gold/40 shadow-[0_0_6px_rgba(223,175,85,0.7)]"
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: railFull ? 1 : railCreep && !reduce ? 0.85 : 0 }}
                          transition={railCreep && !railFull ? { duration: creepSeconds, ease: [0.15, 0.5, 0.35, 1] } : { duration: 0.5, ease: "easeOut" }}
                        />
                      </span>
                    )}
                    <AnimatePresence mode="wait" initial={false}>
                      {d ? (
                        <motion.div key="d" className="min-w-0 flex-1" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
                          <p className="truncate text-sm font-medium text-sand">{d.title}</p>
                          <p className="truncate text-xs text-slate">
                            {d.items.length} stops · {d.items.find((x) => x.kind === "transport")?.title ?? d.summary}
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div key="s" className="flex-1 space-y-1.5" exit={{ opacity: 0 }}>
                          <span className={"block h-2.5 w-2/3 rounded-full " + (current ? "animate-pulse bg-surface-2" : "bg-surface-2/50")} />
                          <span className={"block h-2 w-1/3 rounded-full " + (current ? "animate-pulse bg-surface-2" : "bg-surface-2/50")} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ol>

            {loading && (
              <>
                <div className="mx-auto mt-6 flex min-h-12 max-w-md items-start gap-2.5 text-left text-sm text-slate">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-gold" />
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={tip}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.4 }}
                      className="flex-1"
                    >
                      {tips[tip % Math.max(tips.length, 1)]}
                    </motion.p>
                  </AnimatePresence>
                  {tips.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setTip((t) => (t + 1) % tips.length)}
                      aria-label="Next tip"
                      title="Next tip"
                      className="grid size-6 shrink-0 place-items-center rounded-full text-slate transition-colors hover:bg-surface-2 hover:text-gold"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onCancel}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-slate transition-colors hover:text-sand focus-visible:outline-2 focus-visible:outline-gold"
                >
                  <X className="size-4" /> Cancel
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
