import { ArrowRight, Compass } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/landing/Logo";
import { Topography } from "@/components/landing/Topography";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Page not found — TRIPYYY" };

export default function NotFound() {
  return (
    <main className="relative isolate grid flex-1 place-items-center overflow-hidden px-5 py-20">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_50%_30%,var(--tint-1)_0%,var(--ink)_75%)]">
        <Topography className="h-full w-full [mask-image:radial-gradient(55%_55%_at_50%_45%,black,transparent)]" />
      </div>
      <div className="max-w-lg text-center">
        <Link href="/" aria-label="TRIPYYY home" className="inline-block">
          <Logo />
        </Link>
        <p className="mt-12 font-mono text-sm tracking-[0.3em] text-gold">404 · OFF THE MAP</p>
        <h1 className="mt-4 font-display text-[clamp(2.4rem,7vw,4rem)] font-semibold leading-[1.05] text-sand">
          This road isn&apos;t <span className="text-gold-gradient italic">on the map.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-slate">
          The page you&apos;re looking for doesn&apos;t exist, or a shared link was switched off by its owner.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/plan" className={buttonVariants({ size: "xl" })}>
            Plan a trip <ArrowRight />
          </Link>
          <Link href="/" className={buttonVariants({ size: "xl", variant: "glass" })}>
            <Compass /> Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
