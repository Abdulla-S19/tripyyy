"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/auth/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "./Logo";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#sample", label: "Sample plan" },
  { href: "#moods", label: "Moods" },
  { href: "#features", label: "Features" },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)]"
    >
      <nav
        className={cn(
          "mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full px-3 pl-5 transition-all duration-500",
          scrolled ? "glass shadow-card" : "border border-transparent"
        )}
      >
        <Link href="/" aria-label="TRIPYYY home">
          <Logo />
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-full px-4 py-2 text-sm text-slate transition-colors hover:text-sand"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1">
          <Link href="/trips" className="hidden rounded-full px-4 py-2 text-sm text-slate transition-colors hover:text-sand sm:block">
            My trips
          </Link>
          <ThemeToggle />
          <UserMenu className="hidden sm:flex" />
          <Link href="/plan" className={cn(buttonVariants({ size: "lg" }), "ml-1 h-10 rounded-full px-5")}>
            Plan a trip
            <ArrowRight />
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}
