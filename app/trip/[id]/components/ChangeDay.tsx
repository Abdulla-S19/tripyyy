"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, Undo2, WandSparkles, X } from "lucide-react";
import { useState } from "react";

const IDEAS = ["More adventure", "Slower pace", "Cheaper", "Different food spots", "Start later", "More culture"];

export type ReplanState = { busy: boolean; error: string | null; changed: boolean };

/**
 * "Change this day": the traveller says what to change and only this day is re-planned.
 * The rest of the trip, its journeys and its places stay as they are.
 */
export function ChangeDay({
  dayNo,
  state,
  locked,
  onSubmit,
  onUndo,
  onDismiss,
}: {
  dayNo: number;
  state: ReplanState;
  /** Another day is being changed right now. */
  locked: boolean;
  onSubmit: (request: string) => void;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const reset = (then: () => void) => () => {
    setOpen(false);
    setText("");
    then();
  };
  const addIdea = (idea: string) => setText((t) => (t.trim() ? `${t.trim().replace(/[.,]$/, "")}, ${idea.toLowerCase()}` : idea));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.busy) return;
    onSubmit(text);
  };

  if (state.changed && !state.busy) {
    return (
      <div role="status" className="mx-2 mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-jade/30 bg-jade/10 px-3 py-2 text-sm text-sand sm:mx-4">
        <WandSparkles className="size-4 text-jade" aria-hidden />
        <span className="flex-1">Day {dayNo} has a new plan. The rest of the trip is unchanged.</span>
        <button type="button" onClick={reset(onUndo)} className="flex items-center gap-1 text-xs font-medium text-gold-soft hover:text-gold">
          <Undo2 className="size-3.5" /> Undo
        </button>
        <button type="button" onClick={reset(onDismiss)} aria-label="Dismiss" className="text-slate hover:text-sand">
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-2 mt-4 print:hidden sm:mx-4">
      {!open && !state.busy ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={locked}
          className="flex items-center gap-2 rounded-full border border-gold/30 bg-gold/[0.07] px-3.5 py-1.5 text-xs font-medium text-gold-soft transition hover:border-gold/60 hover:shadow-glow-gold disabled:opacity-50"
        >
          <WandSparkles className="size-3.5" /> Change this day
        </button>
      ) : (
        <form onSubmit={submit} className="rounded-2xl border border-gold/25 bg-surface/70 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={`replan-${dayNo}`} className="text-sm font-medium text-sand">
              What should change on Day {dayNo}?
            </label>
            {!state.busy && (
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-slate hover:text-sand">
                <X className="size-4" />
              </button>
            )}
          </div>
          <textarea
            id={`replan-${dayNo}`}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 300))}
            disabled={state.busy}
            rows={2}
            placeholder="e.g. add a trek in the morning, skip museums, cheaper lunch… or leave empty for a fresh take"
            className="mt-2 w-full resize-none rounded-xl border border-hairline bg-ink/40 px-3 py-2 text-sm text-sand placeholder:text-slate/60 focus:border-gold/50 focus:outline-none disabled:opacity-60"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {IDEAS.map((idea) => (
              <button
                key={idea}
                type="button"
                disabled={state.busy}
                onClick={() => addIdea(idea)}
                className="rounded-full border border-hairline px-2.5 py-1 text-[11px] text-slate transition-colors hover:border-gold/40 hover:text-sand disabled:opacity-50"
              >
                + {idea}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={state.busy || locked}
              className="flex h-9 items-center gap-2 rounded-full bg-gradient-to-b from-btn-a to-btn-b px-4 text-sm font-semibold text-on-btn disabled:opacity-70"
            >
              {state.busy ? <LoaderCircle className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
              {state.busy ? `Re-planning Day ${dayNo}…` : `Re-plan Day ${dayNo}`}
            </button>
            <p className="text-[11px] text-slate/80">
              {state.busy ? "Usually 20–40 seconds. Other days stay as they are." : "Only this day changes. No places from other days are repeated."}
            </p>
          </div>
          <AnimatePresence>
            {state.error && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} role="alert" className="mt-2 text-xs text-destructive">
                {state.error}
              </motion.p>
            )}
          </AnimatePresence>
        </form>
      )}
    </div>
  );
}
