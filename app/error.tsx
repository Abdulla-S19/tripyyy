"use client";

import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="grid flex-1 place-items-center px-5 py-20">
      <div className="glass max-w-md rounded-3xl p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-destructive/40 bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </span>
        <h1 className="mt-5 font-display text-3xl text-sand">Something went off course</h1>
        <p className="mt-2 text-slate">This page hit an unexpected error. Your saved trips are safe. Try again, or head back home.</p>
        {error.digest && <p className="mt-3 font-mono text-xs text-slate/70">Reference: {error.digest}</p>}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button size="xl" onClick={reset}>
            <RotateCcw /> Try again
          </Button>
          <Link href="/" className={buttonVariants({ size: "xl", variant: "glass" })}>
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
