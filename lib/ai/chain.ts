import type { TripFormValues } from "@/lib/trip-schema";
import { AIError, type GenerateOptions, type ModelCaller, type ModelRef, type ProviderId } from "./types";

// ── Which models, in which order ───────────────────────────────────────────

// Flash-Lite is the last resort: less thorough, but usually free when the bigger models are overloaded.
const GEMINI_DEFAULTS = ["gemini-flash-latest", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-lite-latest"];
const OPENAI_DEFAULT = "gpt-4o-mini";
const PROVIDERS: ProviderId[] = ["gemini", "openai", "mock"];

type Env = Record<string, string | undefined>;

const hasKey = (p: ProviderId, env: Env) => (p === "gemini" ? !!env.GEMINI_API_KEY : p === "openai" ? !!env.OPENAI_API_KEY : true);

/**
 * The ordered fallback chain.
 * - AI_MODELS="gemini:gemini-flash-latest,gemini:gemini-3.6-flash,openai:gpt-4o-mini" sets it explicitly.
 * - Otherwise AI_PROVIDER picks who goes first and the other provider (if its key exists) backs it up.
 * Entries whose provider has no API key are skipped.
 */
export function modelChain(env: Env = process.env): ModelRef[] {
  let chain: ModelRef[];
  if (env.AI_MODELS?.trim()) {
    chain = env.AI_MODELS.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((entry) => {
        const [provider, ...rest] = entry.split(":");
        const model = rest.join(":").trim();
        if (!PROVIDERS.includes(provider as ProviderId) || !model) throw new AIError(`AI_MODELS entry "${entry}" should look like "gemini:gemini-3.6-flash"`, "config");
        return { provider: provider as ProviderId, model };
      });
  } else {
    const gemini = [...new Set([env.GEMINI_MODEL, ...GEMINI_DEFAULTS].filter(Boolean) as string[])].map((model) => ({ provider: "gemini" as const, model }));
    const openai = [{ provider: "openai" as const, model: env.OPENAI_MODEL || OPENAI_DEFAULT }];
    const first = (env.AI_PROVIDER || "gemini").toLowerCase();
    if (first === "mock") chain = [{ provider: "mock", model: "mock" }];
    else if (first === "openai") chain = [...openai, ...gemini];
    else if (first === "gemini") chain = [...gemini, ...openai];
    else throw new AIError(`Unknown AI_PROVIDER "${first}" — use gemini, openai or mock`, "config");
  }
  const usable = chain.filter((m) => hasKey(m.provider, env));
  if (!usable.length) throw new AIError("No AI model is configured — add GEMINI_API_KEY or OPENAI_API_KEY", "config");
  return usable;
}

// ── Cool-down: models that just failed go to the back of the queue for a while ──

const cooldown = new Map<string, number>();
const COOLDOWN_MS: Partial<Record<AIError["kind"], number>> = { quota: 120_000, upstream: 60_000, timeout: 60_000 };
const refKey = (m: ModelRef) => `${m.provider}:${m.model}`;

export function orderByHealth(chain: ModelRef[], now = Date.now()): ModelRef[] {
  const healthy = chain.filter((m) => (cooldown.get(refKey(m)) ?? 0) <= now);
  const cooling = chain.filter((m) => (cooldown.get(refKey(m)) ?? 0) > now);
  return [...healthy, ...cooling]; // cooling models still run as a last resort
}

export const resetCooldowns = () => cooldown.clear();

// ── Running the chain ───────────────────────────────────────────────────────

export type ChainOptions = GenerateOptions & {
  /** Output streamed so far is void because we're switching to the next model. */
  onFallback?: (from: ModelRef, to: ModelRef, reason: AIError) => void;
  firstTokenMs?: number;
  idleMs?: number;
  /** Wait before retrying the same model after a momentary overload (ms). */
  retryDelayMs?: number;
};

/** "High demand" spikes usually clear within seconds, so a 5xx gets one quick retry on the same model. */
const isTransient = (e: AIError) => e.kind === "upstream" && (e.status ?? 0) >= 500;

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => (clearTimeout(t), resolve()), { once: true });
  });

export type ChainResult = { data: unknown; ref: ModelRef; attempts: { ref: ModelRef; error: string }[] };

export async function runChain(
  chain: ModelRef[],
  callers: Record<ProviderId, ModelCaller>,
  trip: TripFormValues,
  opts: ChainOptions = {}
): Promise<ChainResult> {
  // Thinking models can take a while before the first token, especially under load; be patient there
  // and stricter once text is flowing.
  const firstTokenMs = opts.firstTokenMs ?? 120_000;
  const idleMs = opts.idleMs ?? 45_000;
  const retryDelayMs = opts.retryDelayMs ?? 2_500;
  const ordered = orderByHealth(chain);
  const attempts: ChainResult["attempts"] = [];
  const errors: AIError[] = [];

  const attemptOnce = async (ref: ModelRef): Promise<{ data: unknown } | { err: AIError; streamed: boolean }> => {
    // Per-attempt controller: aborts on user cancel, or when the model goes quiet for too long.
    const ctl = new AbortController();
    const onParentAbort = () => ctl.abort();
    opts.signal?.addEventListener("abort", onParentAbort, { once: true });
    let stalled = false;
    let streamed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const arm = (ms: number) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        stalled = true;
        ctl.abort();
      }, ms);
    };
    arm(firstTokenMs);
    try {
      const data = await callers[ref.provider](ref.model, trip, {
        feedback: opts.feedback,
        task: opts.task,
        context: opts.context,
        signal: ctl.signal,
        onText: (d) => {
          streamed = true;
          arm(idleMs);
          opts.onText?.(d);
        },
      });
      return { data };
    } catch (raw) {
      if (opts.signal?.aborted) throw new AIError("Generation was stopped", "aborted");
      const err = stalled
        ? new AIError(`${ref.model} stopped responding`, "timeout")
        : raw instanceof AIError
          ? raw
          : new AIError(raw instanceof Error ? raw.message : String(raw), "upstream");
      return { err, streamed };
    } finally {
      clearTimeout(timer);
      opts.signal?.removeEventListener("abort", onParentAbort);
    }
  };

  for (let i = 0; i < ordered.length; i++) {
    const ref = ordered[i];
    for (let tryNo = 1; tryNo <= 2; tryNo++) {
      if (opts.signal?.aborted) throw new AIError("Generation was stopped", "aborted");
      const r = await attemptOnce(ref);
      if ("data" in r) {
        cooldown.delete(refKey(ref));
        return { data: r.data, ref, attempts };
      }
      const { err, streamed } = r;
      attempts.push({ ref, error: `${err.kind}: ${err.message}` });
      // A brief overload before any output: pause and ask the same model again once.
      if (tryNo === 1 && !streamed && isTransient(err)) {
        console.warn(`[ai] ${refKey(ref)} is busy (${err.message}), retrying in ${retryDelayMs}ms`);
        await wait(retryDelayMs, opts.signal);
        continue;
      }
      errors.push(err);
      const pause = COOLDOWN_MS[err.kind];
      if (pause) cooldown.set(refKey(ref), Date.now() + pause);
      const next = ordered[i + 1];
      console.warn(`[ai] ${refKey(ref)} failed (${err.kind}: ${err.message})${next ? `, falling back to ${refKey(next)}` : ""}`);
      if (next) opts.onFallback?.(ref, next, err);
      break;
    }
  }

  throw summarise(errors);
}

function summarise(errors: AIError[]): AIError {
  if (errors.every((e) => e.kind === "config")) return new AIError("The AI keys were rejected. Check GEMINI_API_KEY / OPENAI_API_KEY.", "config");
  if (errors.every((e) => e.kind === "quota" || e.kind === "config")) return new AIError("Every AI planner has hit its limit for now. Try again in a few minutes.", "quota");
  if (errors.every((e) => e.kind === "invalid")) return new AIError("The AI kept returning plans we couldn't read. Please try again.", "invalid");
  return new AIError("All our AI planners are busy right now. Try again in a minute.", "upstream");
}
