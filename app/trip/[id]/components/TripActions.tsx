"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AtSign,
  BookmarkPlus,
  CalendarPlus,
  Check,
  ClipboardCopy,
  Copy,
  FileDown,
  FileText,
  Link2,
  LoaderCircle,
  Mail,
  MessageCircle,
  Pencil,
  Send,
  Share2,
  Unlink,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth, useFeatures } from "@/components/providers/AppProviders";
import { cloud, shareUrl } from "@/lib/cloud-client";
import { buildTripPdf, canShareFiles, downloadFile } from "@/lib/pdf/client";
import { withTripDefaults } from "@/lib/trip-schema";
import { buildIcs, fileSlug, shareText } from "@/lib/trip-view";
import { cn } from "@/lib/utils";
import { useItineraryStore, type SavedTrip } from "@/store/itinerary-store";
import { useTripStore } from "@/store/trip-store";

const btn =
  "flex h-10 items-center gap-2 rounded-full border border-hairline bg-surface/70 px-4 text-sm text-sand backdrop-blur transition-all hover:border-gold/50 hover:text-gold-soft hover:shadow-glow-gold focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-60";

export function TripActions({ saved, mode, onPrint }: { saved: SavedTrip; mode: "owner" | "shared"; onPrint: () => void }) {
  const router = useRouter();
  const features = useFeatures();
  const auth = useAuth();
  const update = useItineraryStore((s) => s.update);
  const save = useItineraryStore((s) => s.save);
  const [toast, setToast] = useState<string | null>(null);
  const [panel, setPanel] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const { itinerary, trip, id } = saved;

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  // Clipboard only: the OS share sheet (which on Windows often means Outlook) is its own "More apps" button.
  const shareAsText = async () => {
    const text = shareText(trip, itinerary);
    try {
      await navigator.clipboard.writeText(text);
      flash("Plan copied. Paste it into WhatsApp or email.");
    } catch {
      flash("Couldn't copy. Your browser blocked clipboard access.");
    }
  };

  const calendar = () => {
    const blob = new Blob([buildIcs(itinerary, id)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileSlug(itinerary.title)}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    flash("Calendar file downloaded. Open it to add every stop.");
  };

  // A real PDF file (not the print dialog), so it can be attached anywhere. Printing stays as the fallback.
  const downloadPdf = async () => {
    setPdfBusy(true);
    try {
      downloadFile(await buildTripPdf(trip, itinerary, saved.shareToken ? shareUrl(saved.shareToken) : undefined));
      flash("PDF downloaded.");
    } catch (err) {
      console.error("[pdf]", err);
      onPrint();
    } finally {
      setPdfBusy(false);
    }
  };

  const edit = () => {
    useTripStore.setState({ draft: withTripDefaults(trip), step: 4, furthestStep: 4 });
    router.push("/plan");
  };

  const saveCopy = async () => {
    let copy: SavedTrip = { id: crypto.randomUUID(), trip, itinerary, provider: saved.provider, model: saved.model, createdAt: new Date().toISOString() };
    if (auth.user) copy = await cloud.save(copy).catch(() => copy);
    await useItineraryStore.persist.rehydrate();
    save(copy);
    router.push(`/trip/${copy.id}`);
  };

  return (
    <div className="relative print:hidden">
      <div className="flex flex-wrap gap-2">
        {mode === "owner" ? (
          <button type="button" onClick={() => setPanel((p) => !p)} aria-expanded={panel} className={cn(btn, "border-gold/40 text-gold-soft")}>
            <Share2 className="size-4" /> Share plan
          </button>
        ) : (
          <button type="button" onClick={saveCopy} className={cn(btn, "border-gold/40 text-gold-soft")}>
            <BookmarkPlus className="size-4" /> Save a copy
          </button>
        )}
        <button type="button" onClick={calendar} className={btn}>
          <CalendarPlus className="size-4" /> Add to calendar
        </button>
        <button type="button" onClick={downloadPdf} disabled={pdfBusy} className={btn}>
          {pdfBusy ? <LoaderCircle className="size-4 animate-spin" /> : <FileDown className="size-4" />} Save as PDF
        </button>
        {mode === "owner" && (
          <button type="button" onClick={edit} className={btn}>
            <Pencil className="size-4" /> Edit trip
          </button>
        )}
      </div>

      <AnimatePresence>
        {panel && (
          <SharePanel
            saved={saved}
            links={features.cloud}
            canEmail={features.email && !!auth.user && !!saved.cloud}
            onClose={() => setPanel(false)} onText={shareAsText} onChange={(patch) => update(id, patch)} flash={flash} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.p
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+24px)] left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-gold/30 bg-surface-2 px-4 py-2.5 text-sm text-sand shadow-card"
          >
            <Check className="size-4 text-gold" /> {toast}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function SharePanel({
  saved,
  links,
  canEmail,
  onClose,
  onText,
  onChange,
  flash,
}: {
  saved: SavedTrip;
  /** Share links need the database; without it we share the plan as text. */
  links: boolean;
  /** Emailing the PDF needs Resend, a signed-in user and the trip saved in their account. */
  canEmail: boolean;
  onClose: () => void;
  onText: () => void;
  onChange: (patch: Partial<SavedTrip>) => void;
  flash: (m: string) => void;
}) {
  const [busy, setBusy] = useState<"create" | "stop" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const token = saved.shareToken;
  const url = token ? shareUrl(token) : "";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onClose();
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => window.addEventListener("mousedown", onClick), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
      clearTimeout(t);
    };
  }, [onClose]);

  const create = async () => {
    setBusy("create");
    setError(null);
    try {
      onChange(await cloud.share(saved));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const stop = async () => {
    setBusy("stop");
    setError(null);
    try {
      await cloud.unshare(saved);
      onChange({ shareToken: null, revokeKey: undefined });
      flash("Sharing stopped. The old link no longer works.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Couldn't copy. Select the link and copy it manually.");
    }
  };

  const canStop = saved.cloud || !!saved.revokeKey;

  // With a link, send the link; otherwise the plan itself, trimmed to what each app accepts in a URL.
  const title = saved.itinerary.title;
  const subject = `${title} — our trip plan`;
  const fullText = shareText(saved.trip, saved.itinerary);
  const message = (max: number) => {
    if (url) return `${subject}\n${saved.trip.origin} → ${saved.trip.destination} · ${saved.itinerary.days.length} days\n\n${url}`;
    return fullText.length <= max ? fullText : `${fullText.slice(0, max).replace(/\n[^\n]*$/, "")}\n…\n(Full plan planned with TRIPYYY)`;
  };
  const enc = encodeURIComponent;
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  const apps: { label: string; icon: typeof Share2; color?: string; hover: string; href?: string; onClick?: () => void }[] = [
    { label: "WhatsApp", icon: MessageCircle, color: "#25d366", hover: "hover:border-[#25d366]/50", href: `https://wa.me/?text=${enc(message(3500))}` },
    { label: "Gmail", icon: Mail, color: "#ea4335", hover: "hover:border-[#ea4335]/50", href: `https://mail.google.com/mail/?view=cm&fs=1&su=${enc(subject)}&body=${enc(message(6000))}` },
    url
      ? { label: "Telegram", icon: Send, color: "#2aabee", hover: "hover:border-[#2aabee]/50", href: `https://t.me/share/url?url=${enc(url)}&text=${enc(subject)}` }
      : { label: "Telegram", icon: Send, color: "#2aabee", hover: "hover:border-[#2aabee]/50", href: `https://t.me/share/url?url=${enc(message(3000))}` },
    { label: "Email app", icon: AtSign, color: "#dfaf55", hover: "hover:border-gold/50", href: `mailto:?subject=${enc(subject)}&body=${enc(message(1800))}` },
    { label: "Copy text", icon: ClipboardCopy, color: "var(--slate)", hover: "hover:border-sand/30", onClick: onText },
    ...(canNativeShare
      ? [{ label: "More apps", icon: Share2, color: "var(--slate)", hover: "hover:border-sand/30", onClick: () => navigator.share(url ? { title, url } : { title, text: fullText }).catch(() => {}) }]
      : []),
  ];

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-label="Share this trip"
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.15 } }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="absolute left-0 top-[calc(100%+10px)] z-40 w-[min(26rem,calc(100vw-2.5rem))] rounded-2xl border border-hairline bg-surface-2 p-5 shadow-[var(--shadow-pop)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg text-sand">Share this trip</p>
          <p className="mt-0.5 text-xs text-slate">
            {links ? "Anyone with the link can view the plan. They can't edit it." : "Send the full day-by-day plan to your group."}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-7 place-items-center rounded-full text-slate hover:bg-surface-2 hover:text-sand">
          <X className="size-4" />
        </button>
      </div>

      {links &&
        (token ? (
          <>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-hairline bg-ink/60 p-1.5 pl-3">
              <Link2 className="size-4 shrink-0 text-gold" />
              <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Share link" className="min-w-0 flex-1 bg-transparent font-mono text-xs text-sand outline-none" />
              <button type="button" onClick={copy} className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-gold px-3 text-xs font-semibold text-on-gold">
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            {canStop && (
              <button type="button" onClick={stop} disabled={!!busy} className="mt-2 flex items-center gap-1.5 text-xs text-slate transition-colors hover:text-destructive disabled:opacity-60">
                {busy === "stop" ? <LoaderCircle className="size-3.5 animate-spin" /> : <Unlink className="size-3.5" />} Stop sharing
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={create}
            disabled={!!busy}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-btn-a to-btn-b text-sm font-semibold text-on-btn transition hover:shadow-glow-gold disabled:opacity-70"
          >
            {busy === "create" ? <LoaderCircle className="size-4 animate-spin" /> : <Link2 className="size-4" />}
            Create share link
          </button>
        ))}

      <PdfShare saved={saved} url={url} subject={subject} canEmail={canEmail} flash={flash} />

      <p className="mt-5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate">
        {links && !token ? "Or send the plan as text" : url ? "Or send the link with" : "Or send it as text with"}
      </p>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {apps.map((a) => {
          const Icon = a.icon;
          const cls = cn(
            "flex flex-col items-center gap-1.5 rounded-xl border border-hairline bg-ink/40 px-2 py-2.5 text-xs text-sand transition-colors",
            a.hover
          );
          return a.href ? (
            <a key={a.label} href={a.href} target={a.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer" className={cls}>
              <Icon className="size-4" style={{ color: a.color }} />
              {a.label}
            </a>
          ) : (
            <button key={a.label} type="button" onClick={a.onClick} className={cls}>
              <Icon className="size-4" style={{ color: a.color }} />
              {a.label}
            </button>
          );
        })}
      </div>
      {!token && <p className="mt-2 text-[11px] text-slate/80">Long plans are shortened for WhatsApp and email. Copy text always has every stop.</p>}
      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
    </motion.div>
  );
}

type PdfState = { status: "building" } | { status: "ready"; file: File } | { status: "failed" };

/**
 * "Share PDF": the system share sheet with the PDF attached (WhatsApp, Gmail, Telegram…).
 * Browsers only open the share sheet straight after a tap, so the PDF is built as soon as the
 * panel opens and the tap shares a file that's already there.
 */
function PdfShare({ saved, url, subject, canEmail, flash }: { saved: SavedTrip; url: string; subject: string; canEmail: boolean; flash: (m: string) => void }) {
  const [pdf, setPdf] = useState<PdfState>({ status: "building" });
  const [needsTap, setNeedsTap] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [shareFiles] = useState(canShareFiles);
  const { trip, itinerary } = saved;

  useEffect(() => {
    let live = true;
    queueMicrotask(() => live && setPdf({ status: "building" }));
    buildTripPdf(trip, itinerary, url || undefined).then(
      (file) => live && setPdf({ status: "ready", file }),
      (err) => {
        console.error("[pdf]", err);
        if (live) setPdf({ status: "failed" });
      }
    );
    return () => {
      live = false;
    };
  }, [trip, itinerary, url]);

  const send = async () => {
    if (pdf.status !== "ready") return;
    if (!shareFiles) {
      downloadFile(pdf.file);
      flash("PDF downloaded. Attach it in WhatsApp or Gmail.");
      return;
    }
    try {
      await navigator.share({ files: [pdf.file], title: itinerary.title, text: url ? `${subject}\n${url}` : subject });
      setNeedsTap(false);
    } catch (err) {
      const name = (err as DOMException).name;
      if (name === "AbortError") return; // closed the share sheet
      if (name === "NotAllowedError") {
        setNeedsTap(true); // the tap "expired" before the share sheet could open
        return;
      }
      downloadFile(pdf.file);
      flash("Couldn't open sharing, so the PDF was downloaded instead.");
    }
  };

  const busy = pdf.status === "building";
  const label = needsTap ? "PDF ready. Tap to share" : shareFiles ? "Share PDF" : "Download PDF";
  const hint =
    pdf.status === "failed"
      ? "Couldn't build the PDF. Use Save as PDF instead."
      : shareFiles
        ? "Attaches the full plan to WhatsApp, Gmail, Telegram…"
        : "Then attach it in WhatsApp or Gmail. This browser can't attach files by itself.";

  return (
    <div className="mt-5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate">Send the PDF</p>
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={send}
          disabled={pdf.status !== "ready"}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 text-sm font-medium text-gold-soft transition hover:bg-gold/15 hover:shadow-glow-gold disabled:opacity-60"
        >
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <FileText className="size-4" />}
          {busy ? "Preparing PDF…" : label}
        </button>
        {canEmail && (
          <button
            type="button"
            onClick={() => setEmailOpen((o) => !o)}
            aria-expanded={emailOpen}
            className={cn(
              "flex h-11 items-center gap-2 rounded-xl border px-3.5 text-sm transition-colors",
              emailOpen ? "border-gold/50 text-gold-soft" : "border-hairline text-sand hover:border-gold/40"
            )}
          >
            <Mail className="size-4" /> Email it
          </button>
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-slate/80">{hint}</p>
      <AnimatePresence initial={false}>
        {emailOpen && (
          <EmailPdfForm
            tripId={saved.id}
            onSent={(n) => {
              setEmailOpen(false);
              flash(`PDF emailed to ${n} ${n === 1 ? "person" : "people"}.`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function EmailPdfForm({ tripId, onSent }: { tripId: string; onSent: (count: number) => void }) {
  const [to, setTo] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const list = [...new Set(to.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean))];
    const bad = list.find((x) => !EMAIL_RE.test(x));
    if (!list.length) return setError("Add at least one email address.");
    if (bad) return setError(`"${bad}" doesn't look like an email address.`);
    if (list.length > 5) return setError("Up to 5 people at a time.");
    setBusy(true);
    setError(null);
    try {
      await cloud.emailPdf(tripId, list, note);
      onSent(list.length);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const field =
    "h-10 w-full rounded-lg border border-hairline bg-surface px-3 text-sm text-sand placeholder:text-slate/60 focus:border-gold/50 focus:outline-none";

  return (
    <motion.form onSubmit={submit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
      <div className="mt-3 space-y-2 rounded-xl border border-hairline bg-ink/40 p-3">
        <input
          type="text"
          inputMode="email"
          aria-label="Email addresses"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="friend@example.com, another@example.com"
          className={field}
        />
        <input type="text" aria-label="Message (optional)" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Add a message (optional)" className={field} />
        <button
          type="submit"
          disabled={busy}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-btn-a to-btn-b text-sm font-semibold text-on-btn disabled:opacity-70"
        >
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
          {busy ? "Sending…" : "Send PDF"}
        </button>
        <p className="text-[11px] text-slate/80">Up to 5 people. Replies come back to your email.</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </motion.form>
  );
}
