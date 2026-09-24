"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-field className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate">
          {label}
        </label>
        {hint && <span className="text-xs text-slate/80">{hint}</span>}
      </div>
      {children}
      <FieldError message={error} />
    </div>
  );
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          id={id}
          role="alert"
          initial={{ opacity: 0, height: 0, y: -4 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 overflow-hidden text-sm text-destructive"
        >
          <AlertCircle className="size-3.5 shrink-0" />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export const inputClass = (invalid?: boolean) =>
  cn(
    "h-12 w-full rounded-xl border bg-ink/60 px-4 text-sand placeholder:text-slate/60 outline-none transition-all duration-200 [color-scheme:dark]",
    "focus:border-gold/60 focus:bg-ink/80 focus:shadow-[0_0_0_4px_rgba(223,175,85,0.12)]",
    invalid ? "border-destructive/60" : "border-hairline hover:border-sand/20"
  );

export function Stepper({
  id,
  value,
  onChange,
  min,
  max,
  label,
  suffix,
}: {
  id: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  label: string;
  suffix?: string;
}) {
  const btn =
    "grid size-9 place-items-center rounded-lg text-slate transition-colors hover:bg-surface-2 hover:text-gold disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-gold";
  return (
    <div className="flex h-12 items-center justify-between gap-2 rounded-xl border border-hairline bg-ink/60 px-1.5">
      <button type="button" className={btn} aria-label={`Fewer ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
        <Minus className="size-4" />
      </button>
      <output id={id} aria-live="polite" className="min-w-10 text-center font-mono text-base text-sand tabular-nums">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            className="inline-block"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
        {suffix && <span className="ml-1 text-xs text-slate">{suffix}</span>}
      </output>
      <button type="button" className={btn} aria-label={`More ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export function Toggle({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all duration-300 focus-visible:outline-2 focus-visible:outline-gold",
        checked ? "border-gold/40 bg-gold/[0.07]" : "border-hairline bg-ink/40 hover:border-sand/20"
      )}
    >
      <span>
        <span className="block font-medium text-sand">{label}</span>
        {description && <span className="block text-sm text-slate">{description}</span>}
      </span>
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300", checked ? "bg-gold" : "bg-surface-2")}>
        <motion.span
          className={cn("absolute top-1 size-5 rounded-full shadow", checked ? "bg-ink" : "bg-slate")}
          animate={{ left: checked ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        />
      </span>
    </button>
  );
}

export function Segmented<T extends string>({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: typeof Minus }[];
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex rounded-xl border border-hairline bg-ink/60 p-1">
      {options.map((o) => {
        const on = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-gold",
              on ? "text-on-btn" : "text-slate hover:text-sand"
            )}
          >
            {on && (
              <motion.span
                layoutId={`seg-${name}`}
                className="absolute inset-0 rounded-lg bg-gradient-to-b from-btn-a to-btn-b shadow-glow-gold"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            {Icon && <Icon className="relative size-4" />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
