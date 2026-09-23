import { z } from "zod";
import { itinerarySchema, type Itinerary, type ItemKind } from "@/types/itinerary";

const UNSUPPORTED = new Set(["$schema", "pattern", "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "minLength", "maxLength"]);

function strip(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(strip);
  if (!node || typeof node !== "object") return node;
  return Object.fromEntries(
    Object.entries(node as Record<string, unknown>)
      .filter(([k]) => !UNSUPPORTED.has(k))
      .map(([k, v]) => [k, strip(v)])
  );
}

/** JSON Schema for the model: structure and descriptions only; Zod enforces value rules afterwards. */
export const itineraryJsonSchema = strip(z.toJSONSchema(itinerarySchema, { target: "draft-7" })) as Record<string, unknown>;

const BUCKET: Record<ItemKind, keyof Omit<Itinerary["budget"], "totalPerPerson" | "note">> = {
  transport: "transport",
  stay: "stays",
  food: "food",
  place: "activities",
  activity: "activities",
  free: "other",
};

export function normalizeItinerary(it: Itinerary, budgetPerPerson: number): Itinerary {
  const days = [...it.days]
    .sort((a, b) => a.day - b.day)
    .map((d, i) => ({ ...d, day: i + 1, items: [...d.items].sort((a, b) => a.time.localeCompare(b.time)) }));

  const totals = { transport: 0, stays: 0, food: 0, activities: 0, other: 0 };
  for (const d of days) for (const item of d.items) totals[BUCKET[item.kind]] += Math.round(item.costPerPerson);
  const totalPerPerson = Object.values(totals).reduce((a, b) => a + b, 0);
  const diff = budgetPerPerson - totalPerPerson;

  return {
    ...it,
    days,
    budget: {
      ...totals,
      totalPerPerson,
      note: it.budget.note || (diff >= 0 ? "Comfortably within your budget." : "This plan runs over your budget."),
    },
  };
}
