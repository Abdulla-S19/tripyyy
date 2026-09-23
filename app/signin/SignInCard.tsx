"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Cloud, Link2, LoaderCircle, Mail, MonitorSmartphone } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { Logo } from "@/components/landing/Logo";
import { Topography } from "@/components/landing/Topography";
import type { PublicFeatures } from "@/components/providers/AppProviders";
import { Button } from "@/components/ui/button";

const PERKS = [
  { icon: Cloud, text: "Every plan saved to your account" },
  { icon: MonitorSmartphone, text: "Open your trips on any phone or laptop" },
  { icon: Link2, text: "Share links you can switch off any time" },
];

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

export function SignInCard({ features, next, checkEmail, error }: { features: PublicFeatures; next: string; checkEmail: boolean; error: string | null }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);

  const emailSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy("email");
    await signIn("email", { email: email.trim(), callbackUrl: next });
  };

  return (
    <div className="relative isolate grid flex-1 place-items-center overflow-hidden px-5 py-16">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_50%_20%,var(--tint-1)_0%,var(--ink)_75%)]">
        <Topography className="h-full w-full opacity-80 [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass w-full max-w-md rounded-3xl p-7 shadow-card sm:p-9"
      >
        <Link href="/" aria-label="TRIPYYY home" className="inline-block">
          <Logo />
        </Link>

        {!features.auth ? (
          <>
            <h1 className="mt-7 font-display text-3xl text-sand">Accounts are coming soon</h1>
            <p className="mt-2 text-slate">Sign-in isn&apos;t set up on this server yet. Your trips are still saved in this browser.</p>
            <Link href="/trips" className="mt-7 inline-flex items-center gap-1.5 text-sm text-gold hover:text-gold-soft">
              <ArrowLeft className="size-4" /> Back to my trips
            </Link>
          </>
        ) : checkEmail ? (
          <>
            <span className="mt-7 grid size-12 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold shadow-glow-gold">
              <Mail className="size-5" />
            </span>
            <h1 className="mt-5 font-display text-3xl text-sand">Check your email</h1>
            <p className="mt-2 text-slate">We sent you a sign-in link. It works once and expires in 24 hours. You can close this tab.</p>
          </>
        ) : (
          <>
            <h1 className="mt-7 font-display text-3xl text-sand">Keep your trips everywhere</h1>
            <ul className="mt-4 space-y-2">
              {PERKS.map((p) => (
                <li key={p.text} className="flex items-center gap-2.5 text-sm text-slate">
                  <p.icon className="size-4 shrink-0 text-gold" /> {p.text}
                </li>
              ))}
            </ul>

            {error && <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

            <div className="mt-7 space-y-3">
              {features.google && (
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => {
                    setBusy("google");
                    signIn("google", { callbackUrl: next });
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-hairline-strong bg-white text-sm font-semibold text-[#1f1f1f] transition hover:bg-[#f6f6f6] disabled:opacity-70"
                >
                  {busy === "google" ? <LoaderCircle className="size-4 animate-spin" /> : <GoogleMark />}
                  Continue with Google
                </button>
              )}

              {features.google && features.email && (
                <div className="flex items-center gap-3 py-1 text-xs text-slate">
                  <span className="h-px flex-1 bg-hairline" /> or <span className="h-px flex-1 bg-hairline" />
                </div>
              )}

              {features.email && (
                <form onSubmit={emailSignIn} className="space-y-3">
                  <label htmlFor="signin-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="signin-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-full border border-hairline bg-ink/60 px-5 text-sand outline-none transition placeholder:text-slate/60 focus:border-gold/60 focus:shadow-[0_0_0_4px_rgba(223,175,85,0.12)]"
                  />
                  <Button type="submit" size="xl" className="w-full" disabled={!!busy}>
                    {busy === "email" ? <LoaderCircle className="animate-spin" /> : <Mail />} Email me a sign-in link
                  </Button>
                </form>
              )}
            </div>

            <p className="mt-6 text-xs leading-relaxed text-slate/80">
              No password needed. Trips you planned in this browser can be moved into your account after you sign in.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
