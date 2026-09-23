"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { setThemePref, useTheme, useThemePref, type ThemePref } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePref; label: string; icon: LucideIcon }[] = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
];

/** Sun/moon button with a Dark / Light / System menu. */
export function ThemeToggle({ className }: { className?: string }) {
  const pref = useThemePref();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  const Icon = theme === "light" ? Sun : Moon;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Theme: ${pref}. Change theme`}
        aria-expanded={open}
        title="Theme"
        className="grid size-9 place-items-center rounded-full text-slate transition-colors hover:bg-surface-2 hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.25 }}
            className="grid place-items-center"
          >
            <Icon className="size-4" />
          </motion.span>
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-40 rounded-2xl border border-hairline bg-surface-2 p-1.5 shadow-[var(--shadow-pop)]"
          >
            {OPTIONS.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={pref === o.value}
                  onClick={() => {
                    setThemePref(o.value);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-sand hover:bg-surface"
                >
                  <o.icon className="size-4 text-slate" />
                  <span className="flex-1">{o.label}</span>
                  {pref === o.value && <Check className="size-3.5 text-gold" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
