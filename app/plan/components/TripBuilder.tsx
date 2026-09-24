"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm, type FieldPath, type Resolver } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AppProviders";
import { cloud } from "@/lib/cloud-client";
import { streamGeneration } from "@/lib/generate-client";
import { pickTips } from "@/lib/wait-tips";
import { STEP_FIELDS, defaultTrip, stepSchemas, tripNights, tripSchema, withTripDefaults, type TripFormValues } from "@/lib/trip-schema";
import type { ItineraryDay } from "@/types/itinerary";
import { useItineraryStore } from "@/store/itinerary-store";
import { STEPS, useTripStore } from "@/store/trip-store";
import { BuilderHeader } from "./BuilderHeader";
import { GeneratingScreen, type GenerationState } from "./GeneratingScreen";
import { PeopleStep } from "./PeopleStep";
import { ReviewStep } from "./ReviewStep";
import { RouteStep } from "./RouteStep";
import { ScheduleStep } from "./ScheduleStep";
import { StepProgress } from "./StepProgress";
import { TransportStep } from "./TransportStep";
import { TripTicket } from "./TripTicket";

const LAST = STEPS.length - 1;

const routeCities = (v: TripFormValues) => [v.origin, ...(v.hasStops ? v.waypoints.map((w) => w.city) : []), v.destination];

export function TripBuilder() {
  const reduce = useReducedMotion();
  const router = useRouter();
  const { step, furthestStep, goTo, setDraft, reset } = useTripStore();
  const saveTrip = useItineraryStore((s) => s.save);
  const auth = useAuth();
  const [generation, setGeneration] = useState<GenerationState | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [tips, setTips] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [dir, setDir] = useState(1);
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const resolver: Resolver<TripFormValues> = (values, ctx, opts) => {
    const schema = (stepRef.current < LAST ? stepSchemas[stepRef.current] : tripSchema) as unknown as z.ZodType<TripFormValues, TripFormValues>;
    return zodResolver(schema)(values, ctx, opts);
  };

  const form = useForm<TripFormValues>({
    defaultValues: defaultTrip(),
    resolver,
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    let unsub: (() => void) | undefined;
    Promise.all([useTripStore.persist.rehydrate(), useItineraryStore.persist.rehydrate()]).then(() => {
      const s = useTripStore.getState();
      form.reset(withTripDefaults(s.draft));
      setReady(true);
      unsub = form.subscribe({
        formState: { values: true },
        callback: ({ values }) => setDraft(values),
      });
    });
    return () => unsub?.();
  }, [form, setDraft]);

  const move = (to: number) => {
    setDir(to > step ? 1 : -1);
    form.clearErrors();
    goTo(to);
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  // shouldFocus only reaches real inputs; chip groups like moods have nothing to focus, so the
  // error could sit below the fold. Bring the first problem on the step into view instead.
  // Error messages render a few frames after validation and then animate open. A smooth scroll
  // started while the page is still growing gets cancelled, so wait for both before scrolling.
  const revealFirstError = (framesLeft = 30) =>
    requestAnimationFrame(() => {
      const el = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]');
      if (!el) {
        if (framesLeft > 0) revealFirstError(framesLeft - 1);
        return;
      }
      setTimeout(() => {
        // The whole field (data-field), so its label (e.g. "Trip mood") and options come into view too.
        const r = (el.closest<HTMLElement>("[data-field]") ?? el).getBoundingClientRect();
        const header = 88;
        if (r.top >= header && r.bottom <= window.innerHeight) return;
        window.scrollTo({ top: Math.max(0, window.scrollY + r.top - header), behavior: reduce ? "auto" : "smooth" });
      }, 260);
    });

  const next = async () => {
    const ok = await form.trigger(STEP_FIELDS[step] as FieldPath<TripFormValues>[], { shouldFocus: true });
    if (ok) move(step + 1);
    else revealFirstError();
  };

  const requestPlan = async (trip: TripFormValues) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setTips(pickTips(trip));
    let expectedDays = tripNights(trip).total + 1;
    const days: ItineraryDay[] = [];
    setGeneration({ status: "loading", expectedDays, days: [], retrying: false });
    try {
      for await (const e of streamGeneration(trip, controller.signal)) {
        if (e.type === "start") {
          expectedDays = e.expectedDays;
          setGeneration({ status: "loading", expectedDays, days: [...days], retrying: false });
        } else if (e.type === "day") {
          days.push(e.day);
          setGeneration({ status: "loading", expectedDays, days: [...days], retrying: false });
        } else if (e.type === "retry") {
          days.length = 0;
          setGeneration({ status: "loading", expectedDays, days: [], retrying: e.reason });
        } else if (e.type === "error") {
          setGeneration({ status: "error", message: e.message });
        } else if (e.type === "done") {
          setGeneration({ status: "done", expectedDays, days: e.itinerary.days });
          let record = { id: crypto.randomUUID(), trip, itinerary: e.itinerary, provider: e.provider, model: e.model, createdAt: new Date().toISOString() };
          // Signed in: keep it in the account too. If that fails, the browser copy still works.
          if (auth.user) record = await cloud.save(record).catch(() => record);
          saveTrip(record);
          setTimeout(() => router.push(`/trip/${record.id}`), 700);
        }
      }
    } catch {
      if (controller.signal.aborted) return;
      setGeneration({ status: "error", message: "Couldn't reach the planner. Check your connection and try again." });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    setGeneration(null);
  };

  const generating = generation?.status === "loading";
  useEffect(() => {
    if (!generating) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [generating]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const generate = () =>
    form.handleSubmit(requestPlan, (errors) => {
      const bad = STEP_FIELDS.findIndex((fields) => fields.some((f) => f in errors));
      if (bad >= 0) {
        move(bad);
        setTimeout(() => void form.trigger(STEP_FIELDS[bad] as FieldPath<TripFormValues>[], { shouldFocus: true }).then(() => revealFirstError()), 450);
      }
    })();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < LAST) void next();
    else void generate();
  };

  const startOver = () => {
    reset();
    form.reset(defaultTrip());
    setDir(-1);
  };

  const Step = [RouteStep, ScheduleStep, PeopleStep, TransportStep][step];
  const offset = reduce ? 0 : 48;

  return (
    <FormProvider {...form}>
      <div className="relative isolate min-h-full flex-1 overflow-x-clip">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_80%_0%,var(--tint-1)_0%,transparent_70%),radial-gradient(50%_40%_at_0%_100%,rgba(223,175,85,0.07),transparent)]"
        />

        <BuilderHeader ready={ready} />

        <div className="mx-auto max-w-6xl px-5 pb-20 pt-10">
          <StepProgress step={step} furthest={furthestStep} onJump={move} />

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <form
              ref={formRef}
              onSubmit={onSubmit}
              noValidate
              className={"glass relative rounded-3xl p-5 shadow-card transition-opacity duration-500 sm:p-8 " + (ready ? "opacity-100" : "opacity-0")}
            >
              {generation ? (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                  <GeneratingScreen
                    cities={routeCities(form.getValues())}
                    tips={tips}
                    state={generation}
                    onCancel={cancel}
                    onRetry={() => void requestPlan(form.getValues())}
                    onBack={() => setGeneration(null)}
                  />
                </motion.div>
              ) : (
              <>
              <div className="relative">
                <AnimatePresence mode="wait" custom={dir} initial={false}>
                  <motion.div
                    key={step}
                    custom={dir}
                    variants={{
                      enter: (d: number) => ({ opacity: 0, x: d * offset, filter: "blur(4px)" }),
                      center: { opacity: 1, x: 0, filter: "blur(0px)" },
                      exit: (d: number) => ({ opacity: 0, x: d * -offset, filter: "blur(4px)" }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {step < LAST && Step ? (
                      <Step />
                    ) : (
                      <ReviewStep onEdit={move} onStartOver={startOver} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

                <div className="mt-10 flex items-center justify-between gap-3 border-t border-hairline pt-6">
                  {step > 0 ? (
                    <Button type="button" variant="ghost" size="xl" onClick={() => move(step - 1)} className="text-slate hover:bg-surface-2 hover:text-sand">
                      <ArrowLeft /> Back
                    </Button>
                  ) : (
                    <span className="font-mono text-xs text-slate">Takes about 2 minutes</span>
                  )}
                  <Button type="submit" size="xl" disabled={form.formState.isSubmitting}>
                    {step < LAST ? (
                      <>
                        Continue <ArrowRight />
                      </>
                    ) : (
                      <>
                        <Sparkles /> Generate my plan
                      </>
                    )}
                  </Button>
                </div>
              </>
              )}
            </form>

            <div className="hidden lg:sticky lg:top-8 lg:block">
              <TripTicket />
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
