import "server-only";
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { createTransport } from "nodemailer";
import { createElement } from "react";
import { registerPdfFonts, TripPdf } from "@/lib/pdf/TripPdf";
import type { TripFormValues } from "@/lib/trip-schema";
import { fileSlug } from "@/lib/trip-view";
import type { Itinerary } from "@/types/itinerary";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function renderTripPdf(trip: TripFormValues, itinerary: Itinerary, link?: string) {
  registerPdfFonts(join(process.cwd(), "public", "fonts", "pdf") + "/");
  // renderToBuffer's typing wants a <Document> element; TripPdf renders one.
  return renderToBuffer(createElement(TripPdf, { trip, itinerary, link }) as Parameters<typeof renderToBuffer>[0]);
}

type Send = {
  to: string[];
  sender: { name: string | null; email: string | null };
  note: string;
  trip: TripFormValues;
  itinerary: Itinerary;
  link?: string;
};

/** Emails the trip PDF as an attachment through Resend's SMTP relay. Replies go to the sender. */
export async function emailTripPdf({ to, sender, note, trip, itinerary: it, link }: Send) {
  const pdf = await renderTripPdf(trip, it, link);
  const who = sender.name || sender.email || "Someone";
  const subject = `${who} shared a trip plan: ${it.title}`;
  const days = `${trip.origin} → ${trip.destination} · ${it.days.length} day${it.days.length === 1 ? "" : "s"}`;

  const text = [
    `${who} shared a trip plan with you.`,
    "",
    it.title,
    days,
    note ? `\n"${note}"\n` : "",
    "The full day-by-day plan is attached as a PDF.",
    link ? `Live plan with map: ${link}` : "",
    "",
    "— Planned with TRIPYYY",
  ].join("\n");

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#070a12;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070a12;"><tr><td align="center" style="padding:36px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
  <tr><td style="padding:0 4px 20px;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;letter-spacing:4px;color:#f5f1e8;">TRIPY<span style="color:#dfaf55;">YY</span></td></tr>
  <tr><td style="background:#101722;border:1px solid #1f2a3a;border-radius:20px;padding:32px;">
    <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#dfaf55;">${esc(who)} shared a trip</p>
    <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:400;color:#f5f1e8;">${esc(it.title)}</h1>
    <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#9299a8;">${esc(days)}</p>
    ${note ? `<p style="margin:0 0 20px;padding:14px 16px;border-left:3px solid #dfaf55;background:#16202f;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#f5f1e8;">${esc(note).replace(/\n/g, "<br>")}</p>` : ""}
    <p style="margin:0 0 ${link ? 24 : 0}px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#c4c9d3;">The full day-by-day plan (timings, places, food stops and budget) is attached as a PDF.</p>
    ${link ? `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:999px;background:#dfaf55;"><a href="${esc(link)}" target="_blank" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#070a12;text-decoration:none;border-radius:999px;">Open the live plan &rarr;</a></td></tr></table>` : ""}
  </td></tr>
  <tr><td style="padding:18px 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#646b7a;">Sent from TRIPYYY on behalf of ${esc(who)}. Reply to this email to answer them directly.</td></tr>
</table></td></tr></table></body></html>`;

  const transport = createTransport({ host: "smtp.resend.com", port: 465, secure: true, auth: { user: "resend", pass: process.env.RESEND_API_KEY! } });
  await transport.sendMail({
    from: process.env.EMAIL_FROM!,
    to,
    replyTo: sender.email ?? undefined,
    subject,
    text,
    html,
    attachments: [{ filename: `${fileSlug(it.title)}.pdf`, content: pdf, contentType: "application/pdf" }],
  });
}
