import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";

type Ctx = { params: Promise<{ nextauth: string[] }> };

async function handler(req: NextRequest, ctx: Ctx) {
  const opts = authOptions();
  if (!opts) return NextResponse.json({ error: "Sign-in isn't configured on this server." }, { status: 404 });
  // next-auth v4 reads params synchronously; Next 16 passes them as a promise.
  return NextAuth(req, { params: await ctx.params }, opts);
}

export { handler as GET, handler as POST };
