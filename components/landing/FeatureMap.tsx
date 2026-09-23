"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bus, Flag, TrainFront, UtensilsCrossed } from "lucide-react";
import { Topography } from "./Topography";

// Equirectangular projection of south-west India (lng 74.3–78.5°E, lat 7.9–12.7°N).
const LNG0 = 74.3;
const LNG1 = 78.5;
const LAT0 = 7.9;
const LAT1 = 12.7;
const K = Math.cos((10.3 * Math.PI) / 180); // shrink longitudes at this latitude so shapes aren't stretched
const W = 420;
const H = Math.round((W * (LAT1 - LAT0)) / ((LNG1 - LNG0) * K));
const px = (lat: number, lng: number) => [((lng - LNG0) / (LNG1 - LNG0)) * W, ((LAT1 - lat) / (LAT1 - LAT0)) * H] as const;
const pathOf = (pts: [number, number][]) => pts.map(([la, ln], i) => `${i ? "L" : "M"}${px(la, ln).join(" ")}`).join(" ");

// Simplified west coast, north → south, then round the southern tip onto the east side.
const COAST: [number, number][] = [
  [12.9, 74.8], [12.5, 74.98], [12.1, 75.2], [11.87, 75.35], [11.5, 75.6], [11.25, 75.77], [10.95, 75.88],
  [10.52, 76.03], [10.1, 76.2], [9.95, 76.24], [9.49, 76.32], [9.1, 76.48], [8.88, 76.58], [8.5, 76.9],
  [8.25, 77.25], [8.08, 77.54], [8.2, 77.8], [8.8, 78.13], [9.3, 78.6],
];
const LAND = `${pathOf(COAST)} L${W + 20} ${px(9.3, 78.6)[1]} L${W + 20} -20 L${px(12.9, 74.8)[0]} -20 Z`;
const GHATS: [number, number][] = [
  [8.45, 77.25], [9.0, 77.2], [9.6, 77.1], [10.1, 77.05], [10.6, 76.85], [11.0, 76.75], [11.4, 76.7], [11.9, 76.1], [12.5, 75.7], [12.9, 75.55],
];

const CONTEXT = [
  { name: "Kochi", lat: 9.93, lng: 76.27 },
  { name: "Munnar", lat: 10.09, lng: 77.06 },
  { name: "Coimbatore", lat: 11.02, lng: 76.96 },
  { name: "Mysuru", lat: 12.3, lng: 76.64 },
  { name: "Madurai", lat: 9.93, lng: 78.12 },
];

const STOPS = [
  { name: "Trivandrum", lat: 8.52, lng: 76.94 },
  { name: "Kozhikode", lat: 11.26, lng: 75.78 },
  { name: "Ooty", lat: 11.41, lng: 76.7 },
];

const LEGS = [
  { from: "Trivandrum", to: "Kozhikode", km: 400, mode: "Train", time: "8h 50m", icon: TrainFront, when: "Fri 06:30" },
  { from: "Kozhikode", to: "Ooty", km: 170, mode: "KSRTC bus", time: "6h 10m", icon: Bus, when: "Sat 07:00" },
];

export function FeatureMap() {
  const reduce = useReducedMotion();
  const [a, b, c] = STOPS.map((s) => px(s.lat, s.lng));
  // Rail hugs the coast north; the bus climbs east into the Nilgiris.
  const road = `M${a[0]} ${a[1]} C${a[0] - 60} ${a[1] - 120}, ${b[0] + 10} ${b[1] + 150}, ${b[0]} ${b[1]} C${b[0] + 30} ${b[1] + 12}, ${c[0] - 45} ${c[1] + 22}, ${c[0]} ${c[1]}`;
  const draw = { initial: { pathLength: reduce ? 1 : 0 }, whileInView: { pathLength: 1 }, viewport: { once: true, amount: 0.4 } };

  return (
    <div className="mt-6 grid overflow-hidden rounded-2xl border border-hairline bg-ink md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className="relative">
        <Topography className="absolute inset-0 h-full w-full opacity-70 [mask-image:linear-gradient(to_left,black_60%,transparent)]" />
        <svg viewBox={`0 0 ${W} ${H}`} className="relative block h-auto w-full" role="img" aria-label="Map of the route from Trivandrum up the Kerala coast to Kozhikode, then east into the Nilgiris to Ooty">
          <defs>
            <linearGradient id="fm-sea" x1="0" x2="1">
              <stop offset="0" stopColor="var(--map-sea)" stopOpacity="0.85" />
              <stop offset="1" stopColor="var(--deep)" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="fm-land" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--map-land)" />
              <stop offset="1" stopColor="var(--deep)" />
            </linearGradient>
            <pattern id="fm-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0H0V30" fill="none" stroke="var(--hairline)" />
            </pattern>
          </defs>

          <rect width={W} height={H} fill="url(#fm-sea)" />
          <path d={LAND} fill="url(#fm-land)" fillOpacity="0.9" />
          <rect width={W} height={H} fill="url(#fm-grid)" />
          <path d={pathOf(COAST)} fill="none" stroke="#3b6fd4" strokeOpacity="0.55" strokeWidth="1.2" />
          <path d={pathOf(COAST)} fill="none" stroke="#3b6fd4" strokeOpacity="0.18" strokeWidth="6" style={{ filter: "blur(3px)" }} />

          <path d={pathOf(GHATS)} fill="none" stroke="#4bae8a" strokeOpacity="0.28" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "blur(5px)" }} />
          <path d={pathOf(GHATS)} fill="none" stroke="#4bae8a" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="1 4" />
          <text fill="#4bae8a" fillOpacity="0.7" fontSize="9" letterSpacing="3" fontFamily="var(--font-inter)" transform={`translate(${px(9.7, 77.25).join(" ")}) rotate(-80)`}>
            WESTERN GHATS
          </text>
          <text x={px(10.4, 74.55)[0]} y={px(10.4, 74.55)[1]} fill="var(--slate)" fillOpacity="0.7" fontSize="12" fontStyle="italic" fontFamily="var(--font-playfair)">
            Arabian Sea
          </text>

          {CONTEXT.map((t) => {
            const [x, y] = px(t.lat, t.lng);
            return (
              <g key={t.name}>
                <circle cx={x} cy={y} r="2" fill="var(--slate)" fillOpacity="0.6" />
                <text x={x + 5} y={y + 3} fill="var(--slate)" fillOpacity="0.55" fontSize="8.5" fontFamily="var(--font-inter)">
                  {t.name}
                </text>
              </g>
            );
          })}

          <motion.path d={road} fill="none" stroke="#dfaf55" strokeOpacity="0.35" strokeWidth="9" strokeLinecap="round" style={{ filter: "blur(5px)" }} {...draw} transition={{ duration: 2.4, ease: "easeInOut" }} />
          <motion.path d={road} fill="none" stroke="#f0cf8a" strokeWidth="2.4" strokeLinecap="round" {...draw} transition={{ duration: 2.4, ease: "easeInOut" }} />

          {STOPS.map((s, i) => {
            const [x, y] = px(s.lat, s.lng);
            const end = i === STOPS.length - 1;
            return (
              <motion.g
                key={s.name}
                initial={{ opacity: 0, scale: 0.4 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: reduce ? 0 : i * 1.1, type: "spring", stiffness: 260, damping: 16 }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              >
                <motion.circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill="#dfaf55"
                  animate={reduce ? undefined : { opacity: [0.3, 0], scale: [0.5, 1.6] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8 }}
                  style={{ transformOrigin: `${x}px ${y}px` }}
                />
                <circle cx={x} cy={y} r={end ? 6 : 5} fill={end ? "#dfaf55" : "var(--deep)"} stroke={end ? "var(--pin-hi)" : "var(--sand)"} strokeWidth="2" />
                <rect x={x + 10} y={y - 10} width={s.name.length * 6.4 + 14} height="20" rx="10" fill="var(--ink)" fillOpacity="0.8" stroke="var(--hairline-strong)" />
                <text x={x + 17} y={y + 4} fill="var(--sand)" fontSize="11" fontWeight="500" fontFamily="var(--font-inter)">
                  {s.name}
                </text>
              </motion.g>
            );
          })}

          <g fontFamily="var(--font-jetbrains)" fontSize="8.5" fill="var(--slate)" fillOpacity="0.6">
            {[75, 76, 77, 78].map((ln) => (
              <text key={ln} x={px(LAT0, ln)[0] + 3} y={H - 6}>
                {ln}°E
              </text>
            ))}
            {[9, 10, 11, 12].map((la) => (
              <text key={la} x={W - 30} y={px(la, LNG0)[1] - 3}>
                {la}°N
              </text>
            ))}
          </g>
        </svg>
      </div>

      <div className="flex flex-col border-t border-hairline p-5 md:border-l md:border-t-0">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-gold">Route · 3 days</p>
        <p className="mt-1 font-display text-xl text-sand">Trivandrum to Ooty</p>

        <ol className="relative mt-5 space-y-4">
          <span aria-hidden className="absolute bottom-3 left-[15px] top-3 w-px bg-gradient-to-b from-gold/60 to-gold/10" />
          {LEGS.map((leg, i) => {
            const Icon = leg.icon;
            return (
              <motion.li
                key={leg.to}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.9, duration: 0.5 }}
                className="relative flex gap-3"
              >
                <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border border-gold/40 bg-ink text-gold">
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-sand">
                    {leg.from} → {leg.to}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-slate">
                    {leg.when} · {leg.mode}
                  </p>
                  <div className="mt-1.5 flex gap-3 font-mono text-xs">
                    <span className="text-gold-soft">{leg.km} km</span>
                    <span className="text-sand/80">{leg.time}</span>
                  </div>
                </div>
              </motion.li>
            );
          })}
          <li className="relative flex gap-3">
            <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-gold text-on-gold shadow-glow-gold">
              <Flag className="size-3.5" />
            </span>
            <p className="pt-1.5 text-sm font-medium text-sand">Ooty · 2 nights</p>
          </li>
        </ol>

        <div className="mt-auto grid grid-cols-3 gap-2 pt-6 text-center">
          {[
            { v: "~570", u: "km" },
            { v: "2", u: "legs" },
            { v: "1", u: "stopover" },
          ].map((s) => (
            <div key={s.u} className="rounded-xl border border-hairline bg-surface/60 px-2 py-2.5">
              <p className="font-mono text-base text-sand tabular-nums">{s.v}</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate">{s.u}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate">
          <UtensilsCrossed className="size-3.5 text-gold" /> 5 meals and 5 sights pinned along the way
        </p>
      </div>
    </div>
  );
}
