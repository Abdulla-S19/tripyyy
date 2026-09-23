"use client";

import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowDown, Clock, MapPin, Wallet } from "lucide-react";
import { useRef, type PointerEvent } from "react";
import { HeroMap } from "./HeroMap";
import { HeroSearch } from "./HeroSearch";
import { Topography } from "./Topography";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // Scroll parallax: content lifts and fades, the survey map beneath moves slower.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const contentY = useTransform(progress, [0, 1], [0, reduce ? 0 : -110]);
  // Fade late, so on tall phone layouts the map is still visible when scrolled into view.
  const contentOpacity = useTransform(progress, [0.5, 0.95], [1, 0]);
  const topoY = useTransform(progress, [0, 1], [0, reduce ? 0 : 140]);
  const mapY = useTransform(progress, [0, 1], [0, reduce ? 0 : -60]);

  // Pointer parallax: contours drift against the cursor, the map tilts toward it.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const topoX = useTransform(sx, [-0.5, 0.5], [22, -22]);
  const topoShiftY = useTransform(sy, [-0.5, 0.5], [16, -16]);
  const tiltY = useTransform(sx, [-0.5, 0.5], [-5, 5]);
  const tiltX = useTransform(sy, [-0.5, 0.5], [4, -4]);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <section
      ref={ref}
      onPointerMove={onMove}
      className="relative isolate z-10 bg-[radial-gradient(90%_70%_at_75%_30%,var(--tint-2)_0%,var(--tint-3)_55%,var(--ink)_100%)]"
    >
      {/* Background layers clip here so the city dropdowns in the search can overflow the section. */}
      <div aria-hidden className="grain pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div style={{ x: topoX, y: topoY }} className="absolute -inset-10">
          <motion.div style={{ y: topoShiftY }} className="h-full w-full">
            <Topography className="h-full w-full [mask-image:radial-gradient(75%_70%_at_65%_45%,black_35%,transparent_85%)]" />
          </motion.div>
        </motion.div>
        <div className="absolute right-[8%] top-[18%] size-[34rem] rounded-full bg-gold/[0.06] blur-[110px]" />
        <div className="absolute -left-40 bottom-0 size-[30rem] rounded-full bg-dusk/10 blur-[120px]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
      </div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-32 md:pt-40 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:pb-32"
      >
        <div className="relative z-10">
          <motion.p
            className="eyebrow mb-6 flex items-center gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.15 }}
          >
            <span className="h-px w-8 bg-gold/60" />
            AI trip planner for India
          </motion.p>

          <h1 className="font-display text-[clamp(2.9rem,7vw,5.4rem)] font-semibold leading-[0.98] tracking-tight text-sand">
            {["Every", "road,"].map((word, i) => (
              <span key={word} className="mr-[0.25em] inline-block overflow-hidden pb-1 align-bottom">
                <motion.span className="inline-block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ duration: 0.9, ease, delay: 0.25 + i * 0.1 }}>
                  {word}
                </motion.span>
              </span>
            ))}
            <br />
            <span className="inline-block overflow-hidden pb-2 align-bottom">
              <motion.span className="text-gold-gradient inline-block italic" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ duration: 0.9, ease, delay: 0.5 }}>
                already planned.
              </motion.span>
            </span>
          </h1>

          <motion.p
            className="mt-7 max-w-[33rem] text-lg leading-relaxed text-slate"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.75 }}
          >
            Say where you start and where you&apos;re headed. TRIPYYY plans the whole journey hour by hour: the bus to
            catch, where to eat when you get off, what to see, and what it costs per person.
          </motion.p>

          <motion.div className="mt-9 max-w-[36rem]" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.9 }}>
            <HeroSearch />
          </motion.div>

          <motion.div
            className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.15 }}
          >
            <span className="flex items-center gap-2">
              <Clock className="size-4 text-gold" /> Hour-by-hour
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="size-4 text-gold" /> Stopovers on the way
            </span>
            <span className="flex items-center gap-2">
              <Wallet className="size-4 text-gold" /> Budget per person
            </span>
            <a href="#sample" className="group flex items-center gap-1.5 text-gold-soft transition-colors hover:text-gold">
              See a full sample plan <ArrowDown className="size-3.5 transition-transform group-hover:translate-y-0.5" />
            </a>
          </motion.div>
        </div>

        <motion.div
          style={{ y: mapY }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease, delay: 0.35 }}
          className="relative [perspective:1400px]"
        >
          <motion.div style={{ rotateY: tiltY, rotateX: tiltX, transformStyle: "preserve-3d" }}>
            <HeroMap />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
