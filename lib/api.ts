import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { currentUserId } from "./auth";
import { getDb } from "./db";

export const fail = (status: number, error: string, extra?: Record<string, unknown>) =>
  NextResponse.json({ error, ...extra }, { status });

/** Guards for cloud routes: database configured and (optionally) a signed-in user. */
export async function cloudUser(): Promise<{ userId: string } | { error: NextResponse }> {
  if (!getDb()) return { error: fail(503, "Saving to an account isn't set up on this server yet.") };
  const userId = await currentUserId();
  if (!userId) return { error: fail(401, "Sign in to save trips to your account.") };
  return { userId };
}

export async function readJson<S extends z.ZodType>(req: Request, schema: S): Promise<{ data: z.infer<S> } | { error: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: fail(400, "Send the request as JSON.") };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { error: fail(400, "That trip data isn't valid.", { issues: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`) }) };
  }
  return { data: parsed.data };
}
