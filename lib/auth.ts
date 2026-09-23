import "server-only";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getServerSession, type NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { getDb } from "./db";
import { features } from "./features";
import { sendVerificationRequest } from "./signin-email";

let cached: NextAuthOptions | null | undefined;

/** NextAuth config, or null when sign-in isn't configured (no database, secret or provider). */
export function authOptions(): NextAuthOptions | null {
  if (cached !== undefined) return cached;
  const f = features();
  const db = getDb();
  if (!f.auth || !db) return (cached = null);

  const providers: NextAuthOptions["providers"] = [];
  if (f.google) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        allowDangerousEmailAccountLinking: true,
      })
    );
  }
  if (f.email) {
    // Resend's SMTP relay: username "resend", password = API key.
    providers.push(
      EmailProvider({
        server: { host: "smtp.resend.com", port: 465, secure: true, auth: { user: "resend", pass: process.env.RESEND_API_KEY! } },
        from: process.env.EMAIL_FROM!,
        maxAge: 24 * 60 * 60,
        sendVerificationRequest,
      })
    );
  }

  cached = {
    // @auth/prisma-adapter is the maintained adapter; its type differs slightly from v4's.
    adapter: PrismaAdapter(db) as Adapter,
    providers,
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
    pages: { signIn: "/signin", verifyRequest: "/signin?check=email", error: "/signin" },
    callbacks: {
      session: ({ session, user }) => ({ ...session, user: { ...session.user, id: user.id } }),
    },
  };
  return cached;
}

/** The signed-in user's id, or null (also null when auth isn't configured). */
export async function currentUserId(): Promise<string | null> {
  const opts = authOptions();
  if (!opts) return null;
  const session = await getServerSession(opts);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}
