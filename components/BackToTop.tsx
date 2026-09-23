"use client";

import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useRef, useState } from "react";

const R = 21;
const C = 2 * Math.PI * R;

/** Floating bottom-right button: shows scroll progress as a gold ring and glides back to the top. */
export function BackToTop({ threshold = 500 }: { threshold?: number }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const progress = useMotionValue(0);
  const ring = useSpring(progress, { stiffness: 140, damping: 30 });
  const offset = useTransform(ring, (p) => C * (1 - p));
  const [visible, setVisible] = useState(false);
  const running = useRef<ReturnType<typeof animate> | null>(null);

  useMotionValueEvent(scrollY, "change", (y) => {
    setVisible(y > threshold);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.set(max > 0 ? Math.min(y / max, 1) : 0);
  });

  const toTop = () => {
    const from = window.scrollY;
    if (reduce) {
      window.scrollTo({ top: 0 });
      return;
    }
    running.current?.stop();
    // Longer pages get a slightly longer glide, capped so it never feels slow.
    const duration = Math.min(1.4, 0.55 + from / 6000);
    running.current = animate(from, 0, {
      duration,
      ease: [0.65, 0, 0.35, 1],
      // "instant" per frame: the page's CSS smooth-scroll would otherwise fight this animation.
      onUpdate: (v) => window.scrollTo({ top: v, behavior: "instant" }),
    });
    // Let the user take over by scrolling or touching mid-glide.
    const cancel = () => {
      running.current?.stop();
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
    };
    window.addEventListener("wheel", cancel, { passive: true, once: true });
    window.addEventListener("touchstart", cancel, { passive: true, once: true });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={toTop}
          aria-label="Back to top"
          title="Back to top"
          initial={{ opacity: 0, y: 16, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.8 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="group fixed bottom-[calc(env(safe-area-inset-bottom,0px)+20px)] right-5 z-40 grid size-12 place-items-center rounded-full border border-hairline bg-surface-2/85 text-sand shadow-card backdrop-blur-xl transition-[border-color,box-shadow,color] duration-300 hover:border-gold/50 hover:text-gold-soft hover:shadow-glow-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:right-8 sm:bottom-[calc(env(safe-area-inset-bottom,0px)+28px)] print:hidden"
        >
          <svg viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90" aria-hidden>
            <circle cx="24" cy="24" r={R} fill="none" stroke="var(--hairline)" strokeWidth="2" />
            <motion.circle
              cx="24"
              cy="24"
              r={R}
              fill="none"
              stroke="#dfaf55"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={C}
              style={{ strokeDashoffset: offset }}
            />
          </svg>
          <ArrowUp className="relative size-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
