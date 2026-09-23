import type { GenerationEvent } from "./generation-events";
import type { TripFormValues } from "./trip-schema";

/** POSTs the trip and yields each streamed event. Non-2xx responses become a single error event. */
export async function* streamGeneration(trip: TripFormValues, signal: AbortSignal): AsyncGenerator<GenerationEvent> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trip),
    signal,
  });

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    yield { type: "error", message: data.error ?? `The planner failed (${res.status}). Please try again.` };
    return;
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let finished = false;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      const event = JSON.parse(line) as GenerationEvent;
      if (event.type === "done" || event.type === "error") finished = true;
      yield event;
    }
  }
  if (!finished) yield { type: "error", message: "The connection closed before the plan was finished. Please try again." };
}
