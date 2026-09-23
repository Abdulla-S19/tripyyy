import "server-only";
import { createTransport } from "nodemailer";
import type { SendVerificationRequestParams } from "next-auth/providers/email";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Branded magic-link email. Table layout + inline styles so it renders in Gmail, Outlook and Apple Mail. */
export function signInEmail(url: string, host: string) {
  const u = esc(url);
  const h = esc(host);
  const subject = "Your TRIPYYY sign-in link";
  const text = `Sign in to TRIPYYY\n\nOpen this link to sign in (it works once and expires in 24 hours):\n${url}\n\nIf you didn't ask for this, you can ignore this email.\n\n— TRIPYYY · ${host}`;
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#070a12;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">Tap the button to sign in. The link works once and expires in 24 hours.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070a12;">
  <tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
      <tr><td style="padding:0 4px 24px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;letter-spacing:4px;color:#f5f1e8;">
        TRIPY<span style="color:#dfaf55;">YY</span>
      </td></tr>
      <tr><td style="background:#101722;border:1px solid #1f2a3a;border-radius:20px;padding:36px 32px;">
        <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#dfaf55;">Sign in</p>
        <h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;font-weight:400;color:#f5f1e8;">Your next road is <em style="color:#f0cf8a;">waiting</em>.</h1>
        <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#9299a8;">Tap the button to sign in to TRIPYYY. Your trips will be kept in your account and open on any device.</p>
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:999px;background:#dfaf55;">
          <a href="${u}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#070a12;text-decoration:none;border-radius:999px;">Sign in to TRIPYYY &rarr;</a>
        </td></tr></table>
        <p style="margin:28px 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#9299a8;">Button not working? Paste this link into your browser:</p>
        <p style="margin:0;font-family:'Courier New',monospace;font-size:12px;line-height:1.5;word-break:break-all;"><a href="${u}" style="color:#f0cf8a;text-decoration:underline;">${u}</a></p>
      </td></tr>
      <tr><td style="padding:20px 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#646b7a;">
        The link works once and expires in 24 hours. If you didn't ask to sign in, you can ignore this email.<br>Sent by TRIPYYY · ${h}
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
  return { subject, text, html };
}

export async function sendVerificationRequest({ identifier, url, provider }: SendVerificationRequestParams) {
  const { host } = new URL(url);
  const { subject, text, html } = signInEmail(url, host);
  const result = await createTransport(provider.server).sendMail({ to: identifier, from: provider.from, subject, text, html });
  const failed = [...(result.rejected ?? []), ...(result.pending ?? [])].filter(Boolean);
  if (failed.length) throw new Error(`Sign-in email could not be sent to ${failed.join(", ")}`);
}
