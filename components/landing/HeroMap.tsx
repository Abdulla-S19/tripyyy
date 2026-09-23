"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bus, Camera, Moon, MountainSnow, Tent, TrainFront, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Stop = { city: string; lat: number; lng: number; time: string; note: string; icon: LucideIcon };
type SampleRoute = { name: string; meta: string; stops: Stop[] };

const ROUTES: SampleRoute[] = [
  {
    name: "Kerala to the Nilgiris",
    meta: "4 travellers · 3 days · ₹6,850 pp",
    stops: [
      { city: "Trivandrum", lat: 8.52, lng: 76.94, time: "Fri 06:30", note: "Train north along the coast", icon: TrainFront },
      { city: "Kozhikode", lat: 11.26, lng: 75.78, time: "Fri 19:30", note: "Biryani at Paragon", icon: UtensilsCrossed },
      { city: "Ooty", lat: 11.41, lng: 76.7, time: "Sat 07:00", note: "Bus up the Gudalur ghat", icon: Bus },
    ],
  },
  {
    name: "Desert cities of Rajasthan",
    meta: "2 travellers · 5 days · ₹14,200 pp",
    stops: [
      { city: "Jaipur", lat: 26.91, lng: 75.79, time: "Mon 08:00", note: "Amber Fort at opening", icon: Camera },
      { city: "Jodhpur", lat: 26.24, lng: 73.02, time: "Wed 17:30", note: "Mehrangarh at sunset", icon: MountainSnow },
      { city: "Jaisalmer", lat: 26.92, lng: 70.91, time: "Thu 19:00", note: "Dinner at a dunes camp", icon: Tent },
    ],
  },
  {
    name: "Delhi to the Himalaya",
    meta: "5 friends · 6 days · ₹11,500 pp",
    stops: [
      { city: "Delhi", lat: 28.61, lng: 77.21, time: "Fri 21:30", note: "Overnight Volvo north", icon: Moon },
      { city: "Shimla", lat: 31.1, lng: 77.17, time: "Sat 10:00", note: "Toy train to Barog", icon: TrainFront },
      { city: "Manali", lat: 32.24, lng: 77.19, time: "Mon 09:00", note: "Solang valley morning", icon: MountainSnow },
    ],
  },
];

const W = 560;
const H = 620;
// The route is drawn in the left part of the frame; stop cards stack in a column on the right,
// joined to their pins by leader lines, like annotations on a survey map.
const ROUTE_LEFT = 70;
const ROUTE_RIGHT = W * 0.5;
const CARD_COL = 0.57; // card column starts at this fraction of the frame width
const PAD_TOP = 165; // leaves room for the "Planning live" header
const PAD_BOTTOM = 120;
const DRAW = 2.8; // seconds to draw a route
const CYCLE = 9000;

function project(route: SampleRoute) {
  const lats = route.stops.map((s) => s.lat);
  const lngs = route.stops.map((s) => s.lng);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const spanX = Math.max(maxLng - minLng, 0.6);
  const spanY = Math.max(maxLat - minLat, 0.6);
  const s = Math.min((ROUTE_RIGHT - ROUTE_LEFT) / spanX, (H - PAD_TOP - PAD_BOTTOM) / spanY);
  const cx = (minLng + maxLng) / 2;
  const cy = (minLat + maxLat) / 2;
  const midX = (ROUTE_LEFT + ROUTE_RIGHT) / 2;
  const midY = PAD_TOP + (H - PAD_TOP - PAD_BOTTOM) / 2;
  const toXY = (lat: number, lng: number) => ({ x: midX + (lng - cx) * s, y: midY - (lat - cy) * s });
  const points = route.stops.map((st) => toXY(st.lat, st.lng));

  // Degree graticule covering the frame.
  const lngAt = (x: number) => cx + (x - midX) / s;
  const latAt = (y: number) => cy - (y - midY) / s;
  const step = (W / s > 6 ? 2 : 1);
  const meridians: { x: number; label: string }[] = [];
  for (let g = Math.ceil(lngAt(0) / step) * step; g <= lngAt(W); g += step) meridians.push({ x: toXY(cy, g).x, label: `${g}°E` });
  const parallels: { y: number; label: string }[] = [];
  for (let g = Math.ceil(latAt(H) / step) * step; g <= latAt(0); g += step) parallels.push({ y: toXY(g, cx).y, label: `${g}°N` });

  return { points, meridians, parallels };
}

/**
 * Card centres: start at each pin, then push apart so neighbouring cards never overlap.
 * `gap` and `minY` are in viewBox units and depend on the rendered size (cards don't scale with the frame).
 */
function cardYs(points: { y: number }[], gap: number, minY: number) {
  const order = points.map((p, i) => ({ i, y: p.y })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < order.length; k++) {
    if (order[k].y - order[k - 1].y < gap) order[k].y = order[k - 1].y + gap;
  }
  // Re-centre the stack around the pins' mean, then keep the whole stack inside the frame.
  const shift = points.reduce((s, p) => s + p.y, 0) / points.length - order.reduce((s, o) => s + o.y, 0) / order.length;
  let top = order[0].y + shift;
  const span = order[order.length - 1].y - order[0].y;
  top = Math.min(Math.max(top, minY), H - 140 - span);
  const ys: number[] = [];
  for (const o of order) ys[o.i] = top + (o.y - order[0].y);
  return ys;
}

/** Smooth Catmull-Rom curve through the stops, as an SVG path. */
function curve(pts: { x: number; y: number }[]) {
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 5, y: p1.y + (p2.y - p0.y) / 5 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 5, y: p2.y - (p3.y - p1.y) / 5 };
    // A gentle sideways bow so straight hops still read as a road, not a ruler line.
    const bow = (i % 2 ? -1 : 1) * 26;
    d += ` C${c1.x + bow} ${c1.y} ${c2.x + bow} ${c2.y} ${p2.x} ${p2.y}`;
  }
  return d;
}

export function HeroMap() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const route = ROUTES[index];
  const { points, meridians, parallels } = useMemo(() => project(route), [route]);
  const d = useMemo(() => curve(points), [points]);
  // Rendered frame width → how many viewBox units one CSS pixel is, so card spacing matches real card height.
  const [boxW, setBoxW] = useState(512);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBoxW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const unitsPerPx = W / boxW;
  const compact = boxW < 440;
  const gap = ((compact ? 50 : 70) + 10) * unitsPerPx;
  const minY = (compact ? 104 : 118) * unitsPerPx;
  const ys = useMemo(() => cardYs(points, gap, minY), [points, gap, minY]);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % ROUTES.length), CYCLE);
    return () => clearInterval(t);
  }, [reduce]);

  return (
    <div ref={boxRef} className="relative mx-auto aspect-[56/62] w-full max-w-[34rem]">
      {/* Frame chrome: corner ticks and the live badge. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[2rem] border border-hairline bg-[radial-gradient(80%_70%_at_50%_45%,var(--frame-a),var(--frame-b)_70%,transparent)]" />
      {["left-3 top-3 border-l border-t", "right-3 top-3 border-r border-t", "left-3 bottom-3 border-l border-b", "right-3 bottom-3 border-r border-b"].map((c) => (
        <span key={c} aria-hidden className={cn("absolute size-4 border-gold/50", c)} />
      ))}

      <div className="absolute left-5 right-5 top-5 z-20 flex items-start justify-between gap-3 sm:left-6 sm:right-6 sm:top-6">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-gold">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-gold/70" />
              <span className="relative size-2 rounded-full bg-gold" />
            </span>
            Planning live
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={route.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.45 }}
              className="mt-1.5 truncate font-display text-xl text-sand sm:text-2xl"
            >
              {route.name}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex shrink-0 gap-1.5 pt-1" role="tablist" aria-label="Sample routes">
          {ROUTES.map((r, i) => (
            <button
              key={r.name}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={r.name}
              onClick={() => setIndex(i)}
              className={cn("h-1.5 rounded-full transition-all duration-500", i === index ? "w-6 bg-gold" : "w-1.5 bg-sand/25 hover:bg-sand/50")}
            />
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="road" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="var(--sand)" />
            <stop offset="1" stopColor="#dfaf55" />
          </linearGradient>
          <clipPath id="frame">
            <rect x="0" y="0" width={W} height={H} rx="32" />
          </clipPath>
        </defs>

        <g clipPath="url(#frame)">
          <AnimatePresence>
            <motion.g key={`grid-${index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
              {meridians.map((m) => (
                <g key={m.label}>
                  <line x1={m.x} x2={m.x} y1={0} y2={H} stroke="var(--sand)" strokeOpacity="0.06" strokeDasharray="2 6" />
                  <text x={m.x + 4} y={H - 16} fill="var(--slate)" fillOpacity="0.7" fontSize="10" fontFamily="var(--font-jetbrains)">
                    {m.label}
                  </text>
                </g>
              ))}
              {parallels.filter((p) => p.y > 130 && p.y < H - 40).map((p) => (
                <g key={p.label}>
                  <line x1={0} x2={W} y1={p.y} y2={p.y} stroke="var(--sand)" strokeOpacity="0.06" strokeDasharray="2 6" />
                  <text x={16} y={p.y - 5} fill="var(--slate)" fillOpacity="0.7" fontSize="10" fontFamily="var(--font-jetbrains)">
                    {p.label}
                  </text>
                </g>
              ))}
            </motion.g>
          </AnimatePresence>
        </g>

        <AnimatePresence>
          <motion.g key={`route-${index}`} exit={{ opacity: 0, transition: { duration: 0.5 } }}>
            <path id={`hero-road-${index}`} d={d} fill="none" stroke="var(--sand)" strokeOpacity="0.1" strokeWidth="2" strokeDasharray="1 7" strokeLinecap="round" />
            <motion.path
              d={d}
              fill="none"
              stroke="#dfaf55"
              strokeOpacity="0.35"
              strokeWidth="10"
              strokeLinecap="round"
              style={{ filter: "blur(6px)" }}
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: DRAW, ease: [0.45, 0, 0.25, 1] }}
            />
            <motion.path
              d={d}
              fill="none"
              stroke="url(#road)"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: DRAW, ease: [0.45, 0, 0.25, 1] }}
            />
            {!reduce && (
              <circle r="5" fill="var(--pin-hi)" style={{ filter: "drop-shadow(0 0 8px #dfaf55)" }}>
                <animateMotion dur={`${DRAW}s`} fill="freeze" keySplines="0.45 0 0.25 1" keyTimes="0;1" calcMode="spline">
                  <mpath href={`#hero-road-${index}`} />
                </animateMotion>
              </circle>
            )}
            {points.map((p, i) => {
              // Leader: short horizontal run from the pin, then a slanted run into the card column.
              const colX = W * CARD_COL - 4;
              const elbowX = p.x + (colX - p.x) * 0.45;
              return (
                <motion.path
                  key={`lead-${i}`}
                  d={`M${p.x + 8} ${p.y} L${elbowX} ${p.y} L${colX} ${ys[i]}`}
                  fill="none"
                  stroke="#dfaf55"
                  strokeOpacity="0.45"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: reduce ? 0 : (i / (points.length - 1)) * DRAW, duration: 0.5 }}
                />
              );
            })}
            {points.map((p, i) => {
              const last = i === points.length - 1;
              const delay = reduce ? 0 : (i / (points.length - 1)) * DRAW;
              return (
                <motion.g key={i} initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay, duration: 0.45, type: "spring", stiffness: 260, damping: 16 }} style={{ transformOrigin: `${p.x}px ${p.y}px` }}>
                  <circle cx={p.x} cy={p.y} r="16" fill="#dfaf55" fillOpacity="0.12" />
                  <circle cx={p.x} cy={p.y} r={last ? 7 : 5.5} fill={last ? "#dfaf55" : "var(--deep)"} stroke={last ? "var(--pin-hi)" : "var(--sand)"} strokeWidth="2" />
                </motion.g>
              );
            })}
          </motion.g>
        </AnimatePresence>
      </svg>

      {/* Itinerary cards anchored to each stop. */}
      <AnimatePresence>
        <motion.div key={`cards-${index}`} className="absolute inset-0" exit={{ opacity: 0, transition: { duration: 0.4 } }}>
          {route.stops.map((s, i) => {
            const Icon = s.icon;
            const delay = reduce ? 0 : (i / (route.stops.length - 1)) * DRAW + 0.15;
            return (
              <motion.div
                key={s.city}
                initial={{ opacity: 0, x: -12, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute z-10 -translate-y-1/2"
                style={{ left: `${CARD_COL * 100}%`, width: `${(0.965 - CARD_COL) * 100}%`, top: `${(ys[i] / H) * 100}%` }}
              >
                <div className={cn("glass flex items-start gap-2.5 rounded-2xl shadow-card", compact ? "px-2.5 py-1.5" : "px-3 py-2.5")}>
                  <span
                    className={cn(
                      "mt-0.5 hidden size-7 shrink-0 place-items-center rounded-lg min-[420px]:grid",
                      i === route.stops.length - 1 ? "bg-gold text-on-gold" : "border border-gold/35 bg-ink/60 text-gold"
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[10px] leading-tight text-gold/80">{s.time}</span>
                    <span className="block truncate text-sm font-medium text-sand">{s.city}</span>
                    {!compact && <span className="block truncate text-xs text-slate">{s.note}</span>}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-6 left-6 right-6 z-20 flex items-center justify-between gap-3">
        <AnimatePresence mode="wait">
          <motion.p
            key={route.meta}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: reduce ? 0 : DRAW, duration: 0.5 }}
            className="rounded-full border border-gold/30 bg-ink/70 px-3 py-1.5 font-mono text-[11px] text-gold-soft backdrop-blur"
          >
            {route.meta}
          </motion.p>
        </AnimatePresence>
        <span aria-hidden className="flex flex-col items-center font-display text-sm italic text-gold/80">
          <svg width="12" height="16" viewBox="0 0 12 16">
            <path d="M6 0 L11 16 L6 12 L1 16 Z" fill="#dfaf55" fillOpacity="0.85" />
          </svg>
          N
        </span>
      </div>
    </div>
  );
}
