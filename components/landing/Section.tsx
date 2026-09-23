"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: string;
  className?: string;
}) {
  return (
    <Reveal className={cn("max-w-2xl", className)}>
      <p className="eyebrow mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-gold/60" />
        {eyebrow}
      </p>
      <h2 className="font-display text-[clamp(2.1rem,4.6vw,3.4rem)] font-semibold leading-[1.05] tracking-tight text-sand">
        {title}
      </h2>
      {lead && <p className="mt-5 text-lg leading-relaxed text-slate">{lead}</p>}
    </Reveal>
  );
}
