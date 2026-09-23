"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { searchCities } from "@/lib/cities";
import { cn } from "@/lib/utils";
import { inputClass } from "./fields";

export function CityCombobox({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  exclude = [],
  invalid,
  errorId,
  icon,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder: string;
  exclude?: string[];
  invalid?: boolean;
  errorId?: string;
  icon?: ReactNode;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchCities(value, exclude), [value, exclude]);
  const exact = results.some((c) => c.name.toLowerCase() === value.trim().toLowerCase());
  const show = open && results.length > 0 && !(exact && results.length === 1);

  const pick = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && show) {
      e.preventDefault();
      pick(results[active].name);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate">
        {icon ?? <MapPin className="size-4" />}
      </span>
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={show ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={errorId}
        autoComplete="off"
        spellCheck={false}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          onBlur?.();
        }}
        onKeyDown={onKeyDown}
        className={cn(inputClass(invalid), "pl-11")}
      />
      <AnimatePresence>
        {show && (
          <motion.ul
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-72 origin-top overflow-auto rounded-xl border border-hairline bg-surface-2/95 p-1.5 shadow-card backdrop-blur-xl"
          >
            {results.map((c, i) => (
              <li
                key={c.name}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(c.name);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  i === active ? "bg-gold/12 text-sand" : "text-slate"
                )}
              >
                <span className="flex items-center gap-2.5">
                  <MapPin className={cn("size-3.5", i === active ? "text-gold" : "text-slate/60")} />
                  <span className="font-medium">{c.name}</span>
                </span>
                <span className="text-xs text-slate/80">{c.region}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
