"use client";

import { ArrowRight, Flag, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CityCombobox } from "@/app/plan/components/CityCombobox";
import { Button } from "@/components/ui/button";
import { withTripDefaults } from "@/lib/trip-schema";
import { useTripStore } from "@/store/trip-store";

/** From → To quick start: pre-fills the trip builder and opens it on the route step. */
export function HeroSearch() {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const start = async (e: FormEvent) => {
    e.preventDefault();
    await useTripStore.persist.rehydrate();
    const { draft } = useTripStore.getState();
    useTripStore.setState({
      draft: withTripDefaults({ ...draft, origin: from.trim() || draft.origin, destination: to.trim() || draft.destination }),
      step: 0,
    });
    router.push("/plan");
  };

  return (
    <form onSubmit={start} className="glass flex flex-col gap-2 rounded-3xl p-2 shadow-card sm:flex-row sm:items-center sm:rounded-full">
      <div className="min-w-0 flex-1 [&_input]:h-12 [&_input]:rounded-full [&_input]:border-transparent [&_input]:bg-ink/50">
        <label htmlFor="hero-from" className="sr-only">
          Starting from
        </label>
        <CityCombobox id="hero-from" value={from} onChange={setFrom} placeholder="Where from?" exclude={[to]} icon={<Navigation className="size-4" />} />
      </div>
      <ArrowRight aria-hidden className="mx-auto hidden size-4 shrink-0 text-gold/70 sm:block" />
      <div className="min-w-0 flex-1 [&_input]:h-12 [&_input]:rounded-full [&_input]:border-transparent [&_input]:bg-ink/50">
        <label htmlFor="hero-to" className="sr-only">
          Going to
        </label>
        <CityCombobox id="hero-to" value={to} onChange={setTo} placeholder="Where to?" exclude={[from]} icon={<Flag className="size-4 text-gold" />} />
      </div>
      <Button type="submit" size="xl" className="shrink-0">
        Plan it <ArrowRight />
      </Button>
    </form>
  );
}
