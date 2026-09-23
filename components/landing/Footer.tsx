import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-hairline px-5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-slate">Plan the whole journey, not just the destination.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate">
          <a href="#how" className="hover:text-sand">How it works</a>
          <a href="#sample" className="hover:text-sand">Sample plan</a>
          <a href="#features" className="hover:text-sand">Features</a>
          <Link href="/plan" className="text-gold hover:text-gold-soft">Plan a trip</Link>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-6xl font-mono text-xs text-slate/70">© 2026 TRIPYYY</p>
    </footer>
  );
}
