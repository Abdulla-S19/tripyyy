"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Replaces the root layout when it crashes, so it can't rely on fonts, providers or globals.css.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#070a12", color: "#f5f1e8", fontFamily: "system-ui, sans-serif", padding: 20 }}>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <p style={{ letterSpacing: "0.2em", fontSize: 12, color: "#dfaf55" }}>TRIPYYY</p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, margin: "12px 0 8px" }}>Something went off course</h1>
          <p style={{ color: "#9299a8", lineHeight: 1.6 }}>The app hit an unexpected error. Your saved trips are safe.</p>
          <button
            onClick={reset}
            style={{ marginTop: 24, height: 44, padding: "0 22px", borderRadius: 999, border: 0, background: "#dfaf55", color: "#070a12", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
