"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, X } from "lucide-react";
import { createElement, useRef, useState, type KeyboardEvent } from "react";
import { MOODS, customMoodIcon } from "@/lib/trip-options";

const MAX = 5;
const chip =
  "flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-300";

export function CustomMoods({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = () => {
    const label = text.trim().replace(/\s+/g, " ");
    if (label.length < 2) return setError("Type at least 2 letters");
    if (label.length > 24) return setError("Keep it under 24 letters");
    const taken = [...value, ...MOODS.map((m) => m.label)].some((m) => m.toLowerCase() === label.toLowerCase());
    if (taken) return setError("That mood is already there");
    onChange([...value, label]);
    setText("");
    setError("");
    if (value.length + 1 >= MAX) setEditing(false);
    else inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    } else if (e.key === "Escape") {
      setEditing(false);
      setText("");
      setError("");
    }
  };

  return (
    <>
      <AnimatePresence initial={false}>
        {value.map((label) => {
          const Icon = customMoodIcon(label);
          return (
            <motion.span
              key={label}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`${chip} border-gold/70 bg-gold/15 pr-2 text-gold-soft shadow-glow-gold`}
            >
              <Icon className="size-4" />
              {label}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== label))}
                aria-label={`Remove ${label}`}
                className="grid size-5 place-items-center rounded-full text-gold-soft/70 transition-colors hover:bg-gold/20 hover:text-sand focus-visible:outline-2 focus-visible:outline-gold"
              >
                <X className="size-3" />
              </button>
            </motion.span>
          );
        })}
      </AnimatePresence>

      {value.length < MAX &&
        (editing ? (
          <motion.span layout initial={{ opacity: 0, width: 120 }} animate={{ opacity: 1, width: "auto" }} className="flex flex-col">
            <span className={`${chip} border-gold/60 bg-ink/70 py-1.5 pl-4 pr-1.5 shadow-[0_0_0_4px_rgba(223,175,85,0.1)]`}>
              {createElement(customMoodIcon(text), { className: "size-4 shrink-0 text-gold" })}
              <input
                ref={inputRef}
                id="custom-mood"
                autoFocus
                value={text}
                maxLength={24}
                onChange={(e) => {
                  setText(e.target.value);
                  setError("");
                }}
                onKeyDown={onKeyDown}
                onBlur={() => !text.trim() && setEditing(false)}
                placeholder="e.g. Tea estates"
                aria-label="Your own mood"
                aria-invalid={!!error || undefined}
                className="w-36 bg-transparent text-sm text-sand outline-none placeholder:text-slate/60"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={add}
                aria-label="Add mood"
                className="grid size-7 place-items-center rounded-full bg-gold text-on-gold transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-gold"
              >
                <Check className="size-3.5" />
              </button>
            </span>
            {error && <span className="mt-1 pl-4 text-xs text-destructive">{error}</span>}
          </motion.span>
        ) : (
          <motion.button
            layout
            type="button"
            onClick={() => setEditing(true)}
            whileTap={{ scale: 0.93 }}
            className={`${chip} border-dashed border-gold/40 text-gold hover:border-gold hover:bg-gold/10 hover:shadow-glow-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold`}
          >
            <Plus className="size-4" />
            {value.length ? "Add another" : "Add your own"}
          </motion.button>
        ))}
    </>
  );
}
