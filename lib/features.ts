import "server-only";

/**
 * Which optional services are configured. Every Phase 5 feature switches on only when its
 * credentials exist, so the app keeps working locally with just an AI key.
 */
export function features() {
  const env = process.env;
  const cloud = !!env.DATABASE_URL;
  const google = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  const email = !!(env.RESEND_API_KEY && env.EMAIL_FROM);
  const auth = cloud && !!env.NEXTAUTH_SECRET && (google || email);
  return {
    cloud,
    auth,
    google: auth && google,
    email: auth && email,
    redis: !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
  };
}

export type Features = ReturnType<typeof features>;
export type PublicFeatures = Pick<Features, "cloud" | "auth" | "google" | "email">;

export const publicFeatures = (): PublicFeatures => {
  const f = features();
  return { cloud: f.cloud, auth: f.auth, google: f.google, email: f.email };
};
