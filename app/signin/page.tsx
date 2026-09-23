import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";
import { publicFeatures } from "@/lib/features";
import { SignInCard } from "./SignInCard";

export const metadata: Metadata = { title: "Sign in — TRIPYYY" };

const ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "That email is already linked to a different sign-in method. Use the one you signed up with.",
  EmailSignin: "We couldn't send the sign-in email. Check the address and try again.",
  Verification: "That sign-in link has expired or was already used. Request a new one.",
  AccessDenied: "Sign-in was cancelled.",
};

/** Only same-site paths are allowed as a post-sign-in destination. */
const safeNext = (next?: string) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/trips");

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : typeof sp.callbackUrl === "string" ? new URL(sp.callbackUrl, "http://x").pathname : undefined);
  if (await currentUserId()) redirect(next);

  const f = publicFeatures();
  const error = typeof sp.error === "string" ? (ERRORS[sp.error] ?? "Something went wrong while signing in. Please try again.") : null;

  return (
    <main className="flex flex-1 flex-col">
      <SignInCard features={f} next={next} checkEmail={sp.check === "email"} error={error} />
    </main>
  );
}
