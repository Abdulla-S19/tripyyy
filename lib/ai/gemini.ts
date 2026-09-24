import "server-only";
import { ApiError, GoogleGenAI, ThinkingLevel } from "@google/genai";
import { buildTripPrompt, SYSTEM_PROMPT } from "./prompt";
import { itineraryJsonSchema } from "./schema";
import { AIError, withFeedback, type ModelCaller } from "./types";

const THINKING: Record<string, ThinkingLevel> = {
  minimal: ThinkingLevel.MINIMAL,
  low: ThinkingLevel.LOW,
  medium: ThinkingLevel.MEDIUM,
  high: ThinkingLevel.HIGH,
};

let client: GoogleGenAI | undefined;
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) throw new AIError("GEMINI_API_KEY is not set", "config");
  return (client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));
};

/** Streams one Gemini model. Fallback between models lives in chain.ts. */
export const callGemini: ModelCaller = async (model, trip, opts) => {
  let text = "";
  try {
    const stream = await getClient().models.generateContentStream({
      model,
      contents: withFeedback(opts.task?.prompt ?? buildTripPrompt(trip, opts.context), opts.feedback),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: opts.task?.jsonSchema ?? itineraryJsonSchema,
        temperature: 0.6,
        // Gemini 3 "thinks" before writing; on busy days a full think can take minutes. The prompt is
        // explicit enough that low thinking plans just as well and starts streaming far sooner.
        thinkingConfig: { thinkingLevel: THINKING[process.env.GEMINI_THINKING?.toLowerCase() ?? "low"] ?? ThinkingLevel.LOW },
        abortSignal: opts.signal,
      },
    });
    for await (const chunk of stream) {
      const delta = chunk.text;
      if (!delta) continue;
      text += delta;
      opts.onText?.(delta);
    }
  } catch (err) {
    throw toAIError(err, opts.signal);
  }
  if (!text) throw new AIError("Gemini returned an empty response", "upstream");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AIError("Gemini returned malformed JSON", "invalid");
  }
};

function toAIError(err: unknown, signal?: AbortSignal): AIError {
  if (err instanceof AIError) return err;
  if (signal?.aborted) return new AIError("Generation was stopped", "aborted");
  if (err instanceof ApiError) {
    if (err.status === 429) return new AIError("Gemini's rate limit was reached", "quota", 429);
    if (err.status === 401 || err.status === 403) return new AIError(`Gemini rejected the API key (${err.status})`, "config", err.status);
    if (err.status === 400) return new AIError(`Gemini rejected the request (400): ${err.message.slice(0, 160)}`, "invalid", 400);
    // 404 = model retired or unavailable to this key; 5xx = overloaded or down.
    return new AIError(`Gemini is unavailable (${err.status})`, "upstream", err.status);
  }
  return new AIError(err instanceof Error ? err.message : String(err), "upstream");
}
