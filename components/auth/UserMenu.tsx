"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FolderOpen, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AppProviders";
import { cn } from "@/lib/utils";
import { useItineraryStore } from "@/store/itinerary-store";

/** Sign-in link or avatar menu. Renders nothing when sign-in isn't configured on the server. */
export function UserMenu({ className }: { className?: string }) {
  const { status, user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (status === "disabled") return null;
  if (status === "loading") return <span className={cn("size-9 animate-pulse rounded-full bg-surface-2", className)} aria-hidden />;

  if (!user) {
    return (
      <Link
        href={`/signin?next=${encodeURIComponent(pathname || "/")}`}
        className={cn("flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm text-slate transition-colors hover:text-sand", className)}
      >
        <LogIn className="size-4" /> Sign in
      </Link>
    );
  }

  const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Account menu"
        className="grid size-9 place-items-center overflow-hidden rounded-full border border-gold/40 bg-gold/15 text-sm font-semibold text-gold-soft transition-shadow hover:shadow-glow-gold focus-visible:outline-2 focus-visible:outline-gold"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote avatar from the sign-in provider
          <img src={user.image} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
        ) : (
          initial
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 rounded-2xl border border-hairline bg-surface-2 p-1.5 shadow-[var(--shadow-pop)]"
          >
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-medium text-sand">{user.name || "Signed in"}</p>
              {user.email && <p className="truncate text-xs text-slate">{user.email}</p>}
            </div>
            <div className="my-1 h-px bg-hairline" />
            <Link href="/trips" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-sand hover:bg-surface-2">
              <FolderOpen className="size-4 text-slate" /> My trips
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                // Drop this account's cached trips so the next person on this browser can't see them.
                await useItineraryStore.persist.rehydrate();
                const { trips, remove } = useItineraryStore.getState();
                for (const t of Object.values(trips)) if (t.cloud) remove(t.id);
                await signOut({ callbackUrl: "/" });
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-sand hover:bg-surface-2"
            >
              <LogOut className="size-4 text-slate" /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
