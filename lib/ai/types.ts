import type { TripFormValues } from "@/lib/trip-schema";

export type ProviderId = "gemini" | "openai" | "mock";

/** One entry in the fallback chain, e.g. { provider: "gemini", model: "gemini-3.6-flash" }. */
export type ModelRef = { provider: ProviderId; model: string };

export type GenerateOptions = {
  feedback?: string;
  /** Called with each streamed text delta of the JSON response. */
  onText?: (delta: string) => void;
  signal?: AbortSignal;
};

/** Calls exactly one model and returns raw, unvalidated JSON; throws AIError on failure. */
export type ModelCaller = (model: string, trip: TripFormValues, opts: GenerateOptions) => Promise<unknown>;

export type AIErrorKind =
  | "quota" // rate limit or spend cap
  | "upstream" // provider down, overloaded or erroring
  | "timeout" // no output within the stall window
  | "config" // key missing or rejected
  | "invalid" // model answered with unusable JSON
  | "aborted"; // the user cancelled

export class AIError extends Error {
  constructor(
    message: string,
    public readonly kind: AIErrorKind,
    public readonly status?: number
  ) {
    super(message);
    this.name = "AIError";
  }
}

export const withFeedback = (prompt: string, feedback?: string) =>
  feedback ? `${prompt}\n\nYour previous answer was rejected: ${feedback}\nFix these problems.` : prompt;
