import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { itinerarySchema } from "@/types/itinerary";
import { buildTripPrompt, SYSTEM_PROMPT } from "./prompt";
import { AIError, withFeedback, type ModelCaller } from "./types";

let client: OpenAI | undefined;
const getClient = () => {
  if (!process.env.OPENAI_API_KEY) throw new AIError("OPENAI_API_KEY is not set", "config");
  return (client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0 }));
};

/** Streams one OpenAI model with strict structured output. Fallback lives in chain.ts. */
export const callOpenAI: ModelCaller = async (model, trip, opts) => {
  try {
    const stream = getClient().responses.stream(
      {
        model,
        instructions: SYSTEM_PROMPT,
        input: withFeedback(buildTripPrompt(trip), opts.feedback),
        text: { format: zodTextFormat(itinerarySchema, "itinerary") },
        temperature: 0.6,
      },
      { signal: opts.signal }
    );
    stream.on("response.output_text.delta", (e) => opts.onText?.(e.delta));
    const res = await stream.finalResponse();
    if (!res.output_parsed) throw new AIError("OpenAI returned no itinerary", "invalid");
    return res.output_parsed;
  } catch (err) {
    if (err instanceof AIError) throw err;
    if (opts.signal?.aborted) throw new AIError("Generation was stopped", "aborted");
    if (err instanceof OpenAI.APIError) {
      if (err.status === 429) throw new AIError("OpenAI rate or spend limit reached", "quota", 429);
      if (err.status === 401 || err.status === 403) throw new AIError("OpenAI rejected the API key", "config", err.status);
      throw new AIError(`OpenAI is unavailable (${err.status})`, "upstream", err.status);
    }
    throw new AIError(err instanceof Error ? err.message : String(err), "upstream");
  }
};
