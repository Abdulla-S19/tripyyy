import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { modelChain, orderByHealth, resetCooldowns, runChain } from "@/lib/ai/chain";
import { AIError, type ModelCaller, type ModelRef, type ProviderId } from "@/lib/ai/types";
import { sampleTrip } from "./helpers";

const trip = sampleTrip();
const names = (c: ModelRef[]) => c.map((m) => `${m.provider}:${m.model}`);

/** Fake providers: each model name maps to a behaviour. */
function fakeCallers(behaviour: Record<string, "ok" | "busy" | "quota" | "stall" | "partial-then-busy">, log: string[] = []) {
  const call: ModelCaller = async (model, _trip, opts) => {
    log.push(model);
    const b = behaviour[model] ?? "ok";
    if (b === "busy") throw new AIError(`${model} overloaded`, "upstream", 503);
    if (b === "quota") throw new AIError(`${model} rate limited`, "quota", 429);
    if (b === "partial-then-busy") {
      opts.onText?.('{"title":"half');
      throw new AIError(`${model} dropped mid-stream`, "upstream", 503);
    }
    if (b === "stall") {
      await new Promise((_, reject) => opts.signal?.addEventListener("abort", () => reject(new Error("aborted"))));
    }
    opts.onText?.('{"ok":true}');
    return { answeredBy: model };
  };
  return { gemini: call, openai: call, mock: call } satisfies Record<ProviderId, ModelCaller>;
}

describe("model chain configuration", () => {
  it("defaults to Gemini models, then OpenAI when its key exists", () => {
    const c = modelChain({ AI_PROVIDER: "gemini", GEMINI_API_KEY: "g", OPENAI_API_KEY: "o" });
    assert.deepEqual(names(c), [
      "gemini:gemini-flash-latest",
      "gemini:gemini-3.6-flash",
      "gemini:gemini-3.5-flash",
      "gemini:gemini-flash-lite-latest",
      "openai:gpt-4o-mini",
    ]);
  });

  it("puts OpenAI first in production and keeps Gemini as backup", () => {
    const c = modelChain({ AI_PROVIDER: "openai", GEMINI_API_KEY: "g", OPENAI_API_KEY: "o" });
    assert.deepEqual(names(c)[0], "openai:gpt-4o-mini");
    assert.equal(c.length, 5);
  });

  it("skips providers without an API key", () => {
    assert.deepEqual(names(modelChain({ AI_PROVIDER: "openai", GEMINI_API_KEY: "g" })), [
      "gemini:gemini-flash-latest",
      "gemini:gemini-3.6-flash",
      "gemini:gemini-3.5-flash",
      "gemini:gemini-flash-lite-latest",
    ]);
  });

  it("honours an explicit AI_MODELS order", () => {
    const c = modelChain({ AI_MODELS: "openai:gpt-4o-mini, gemini:gemini-3.5-flash", GEMINI_API_KEY: "g", OPENAI_API_KEY: "o" });
    assert.deepEqual(names(c), ["openai:gpt-4o-mini", "gemini:gemini-3.5-flash"]);
  });

  it("explains a malformed AI_MODELS entry", () => {
    assert.throws(() => modelChain({ AI_MODELS: "gemini-3.5-flash", GEMINI_API_KEY: "g" }), /should look like/);
  });

  it("fails clearly when no key is configured", () => {
    assert.throws(() => modelChain({ AI_PROVIDER: "gemini" }), /No AI model is configured/);
  });
});

describe("fallback", () => {
  beforeEach(resetCooldowns);
  const chain: ModelRef[] = [
    { provider: "gemini", model: "a" },
    { provider: "gemini", model: "b" },
    { provider: "openai", model: "c" },
  ];

  it("uses the first model when it's healthy", async () => {
    const r = await runChain(chain, fakeCallers({}), trip);
    assert.equal(r.ref.model, "a");
    assert.equal(r.attempts.length, 0);
  });

  it("retries a busy model once, then switches; rate limits switch straight away", async () => {
    const log: string[] = [];
    const r = await runChain(chain, fakeCallers({ a: "busy", b: "quota" }, log), trip, { retryDelayMs: 1 });
    assert.deepEqual(log, ["a", "a", "b", "c"]);
    assert.equal(r.ref.model, "c");
    assert.deepEqual(r.attempts.map((x) => x.error.split(":")[0]), ["upstream", "upstream", "quota"]);
  });

  it("succeeds on the quick retry when the overload clears", async () => {
    let calls = 0;
    const flaky: ModelCaller = async (model) => {
      calls++;
      if (model === "a" && calls === 1) throw new AIError("spike", "upstream", 503);
      return { answeredBy: model };
    };
    const r = await runChain(chain, { gemini: flaky, openai: flaky, mock: flaky }, trip, { retryDelayMs: 1 });
    assert.equal(r.ref.model, "a");
    assert.equal(calls, 2);
  });

  it("tells the caller to discard partial output when switching mid-stream", async () => {
    const fallbacks: string[] = [];
    const r = await runChain(chain, fakeCallers({ a: "partial-then-busy" }), trip, { onFallback: (from, to) => fallbacks.push(`${from.model}>${to.model}`) });
    assert.equal(r.ref.model, "b");
    assert.deepEqual(fallbacks, ["a>b"]);
  });

  it("gives up on a model that stays silent and moves on", async () => {
    const r = await runChain(chain, fakeCallers({ a: "stall" }), trip, { firstTokenMs: 50 });
    assert.equal(r.ref.model, "b");
    assert.match(r.attempts[0].error, /^timeout/);
  });

  it("sends a model that just failed to the back of the queue", async () => {
    await runChain(chain, fakeCallers({ a: "busy" }), trip, { retryDelayMs: 1 });
    assert.deepEqual(names(orderByHealth(chain)), ["gemini:b", "openai:c", "gemini:a"]);
  });

  it("stops immediately when the user cancels, without trying other models", async () => {
    const ctl = new AbortController();
    const log: string[] = [];
    const run = runChain(chain, fakeCallers({ a: "stall" }, log), trip, { signal: ctl.signal, firstTokenMs: 5_000 });
    setTimeout(() => ctl.abort(), 30);
    await assert.rejects(run, (e: AIError) => e.kind === "aborted");
    assert.deepEqual(log, ["a"]);
  });

  it("reports a clear error when every model fails", async () => {
    await assert.rejects(runChain(chain, fakeCallers({ a: "quota", b: "quota", c: "quota" }), trip), /Every AI planner has hit its limit/);
    resetCooldowns();
    await assert.rejects(runChain(chain, fakeCallers({ a: "busy", b: "quota", c: "busy" }), trip, { retryDelayMs: 1 }), /All our AI planners are busy/);
  });
});
