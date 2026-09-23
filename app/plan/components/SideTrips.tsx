"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MapPinPlus, Plus, X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { nearbySuggestions } from "@/lib/nearby";
import { inputClass } from "./fields";

const MAX = 8;

/** Must-see places near the destination, planned as day trips from the base (not overnight stops). */
export function SideTrips({ destination, value, onChange }: { destination: string; value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const place = destination.trim() || "your destination";
  const suggestions = nearbySuggestions(destination, [...value, destination]).slice(0, 6);

  const add = (raw: string) => {
    const name = raw.trim().replace(/\s+/g, " ");
    if (name.length < 2) return setError("Type a place name");
    if (value.some((v) => v.toLowerCase() === name.toLowerCase())) return setError("Already added");
    if (value.length >= MAX) return setError(`Up to ${MAX} places`);
    onChange([...value, name.slice(0, 40)]);
    setText("");
    setError("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add(text);
    }
  };

  return (
    <section aria-labelledby="side-trips-label" className="rounded-2xl border border-hairline bg-ink/40 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
          <MapPinPlus className="size-4" />
        </span>
        <div className="min-w-0">
          <p id="side-trips-label" className="font-medium text-sand">
            Also want to see near {place}?
          </p>
          <p className="text-sm text-slate">Day trips from your base, not overnight stops. We&apos;ll fit them into the days there.</p>
        </div>
      </div>

      {value.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {value.map((v) => (
              <motion.li
                key={v}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="flex items-center gap-1.5 rounded-full border border-gold/60 bg-gold/15 py-1.5 pl-3.5 pr-1.5 text-sm text-gold-soft shadow-glow-gold"
              >
                {v}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((x) => x !== v))}
                  aria-label={`Remove ${v}`}
                  className="grid size-5 place-items-center rounded-full text-gold-soft/70 hover:bg-gold/20 hover:text-sand focus-visible:outline-2 focus-visible:outline-gold"
                >
                  <X className="size-3" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {value.length < MAX && (
        <div className="mt-4 flex gap-2">
          <label htmlFor="side-trip-input" className="sr-only">
            Place near {place}
          </label>
          <input
            id="side-trip-input"
            value={text}
            maxLength={40}
            onChange={(e) => {
              setText(e.target.value);
              setError("");
            }}
            onKeyDown={onKeyDown}
            placeholder={suggestions[0] ? `e.g. ${suggestions[0]}` : "A town, lake, viewpoint…"}
            className={inputClass(!!error)}
          />
          <button
            type="button"
            onClick={() => add(text)}
            aria-label="Add place"
            className="grid size-12 shrink-0 place-items-center rounded-xl border border-gold/40 text-gold transition-all hover:bg-gold/10 hover:shadow-glow-gold focus-visible:outline-2 focus-visible:outline-gold"
          >
            <Plus className="size-4" />
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      {suggestions.length > 0 && value.length < MAX && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-slate">Popular:</span>
          {suggestions.map((s) => (
            <motion.button
              key={s}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => add(s)}
              className="flex items-center gap-1 rounded-full border border-hairline px-3 py-1 text-xs text-slate transition-colors hover:border-gold/40 hover:text-gold-soft focus-visible:outline-2 focus-visible:outline-gold"
            >
              <Plus className="size-3" /> {s}
            </motion.button>
          ))}
        </div>
      )}
    </section>
  );
}
