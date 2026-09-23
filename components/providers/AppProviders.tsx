"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { createContext, useContext, type ReactNode } from "react";

export type PublicFeatures = { cloud: boolean; auth: boolean; google: boolean; email: boolean };
export type AuthUser = { id: string; name?: string | null; email?: string | null; image?: string | null };
type AuthState = { status: "disabled" | "loading" | "authenticated" | "unauthenticated"; user: AuthUser | null };

const FeaturesContext = createContext<PublicFeatures>({ cloud: false, auth: false, google: false, email: false });
const AuthContext = createContext<AuthState>({ status: "disabled", user: null });

export const useFeatures = () => useContext(FeaturesContext);
/** Signed-in user, or status "disabled" when sign-in isn't configured on the server. */
export const useAuth = () => useContext(AuthContext);

function AuthBridge({ children }: { children: ReactNode }) {
  const { data, status } = useSession();
  const user = (data?.user as AuthUser | undefined) ?? null;
  return <AuthContext.Provider value={{ status, user: status === "authenticated" ? user : null }}>{children}</AuthContext.Provider>;
}

export function AppProviders({ features, children }: { features: PublicFeatures; children: ReactNode }) {
  return (
    <FeaturesContext.Provider value={features}>
      {features.auth ? (
        // Only mount NextAuth's client when the server has sign-in configured, so /api/auth isn't polled for nothing.
        <SessionProvider refetchOnWindowFocus={false}>
          <AuthBridge>{children}</AuthBridge>
        </SessionProvider>
      ) : (
        children
      )}
    </FeaturesContext.Provider>
  );
}
