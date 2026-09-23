import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Avatars from Google sign-in.
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
  // The emailed PDF reads its fonts from disk at runtime; serverless bundles only include files they're told about.
  outputFileTracingIncludes: {
    "/api/trips/[id]/email": ["./public/fonts/pdf/**"],
  },
};

// Source maps are uploaded to Sentry only when its build token is configured.
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
    })
  : nextConfig;
