import type { SavedTrip } from "@/store/itinerary-store";

export class CloudError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new CloudError(data.error ?? `Request failed (${res.status})`, res.status);
  return data as T;
}

const payload = (t: SavedTrip) => ({ trip: t.trip, itinerary: t.itinerary, provider: t.provider, model: t.model });

export const cloud = {
  save: (t: SavedTrip) => call<{ trip: SavedTrip }>("/api/trips", { method: "POST", body: JSON.stringify(payload(t)) }).then((r) => r.trip),
  list: () => call<{ trips: SavedTrip[] }>("/api/trips").then((r) => r.trips),
  get: (id: string) => call<{ trip: SavedTrip }>(`/api/trips/${encodeURIComponent(id)}`).then((r) => r.trip),
  remove: (id: string) => call<void>(`/api/trips/${encodeURIComponent(id)}`, { method: "DELETE" }),
  import: (trips: SavedTrip[]) =>
    call<{ saved: { localId: string; trip: SavedTrip }[] }>("/api/trips/import", {
      method: "POST",
      body: JSON.stringify({ trips: trips.map((t) => ({ ...payload(t), localId: t.id })) }),
    }).then((r) => r.saved),

  /** Owned trips share in place; browser-only trips get an ownerless snapshot plus a revoke key. */
  share: async (t: SavedTrip): Promise<Pick<SavedTrip, "shareToken" | "revokeKey">> => {
    if (t.cloud) {
      const r = await call<{ shareToken: string }>(`/api/trips/${encodeURIComponent(t.id)}/share`, { method: "POST" });
      return { shareToken: r.shareToken };
    }
    return call<{ shareToken: string; revokeKey: string }>("/api/share", { method: "POST", body: JSON.stringify(payload(t)) });
  },
  unshare: (t: SavedTrip) =>
    t.cloud
      ? call<void>(`/api/trips/${encodeURIComponent(t.id)}/share`, { method: "DELETE" })
      : call<void>(`/api/share/${encodeURIComponent(t.shareToken ?? "")}`, { method: "DELETE", headers: { "x-revoke-key": t.revokeKey ?? "" } }),
  /** Emails the trip PDF (rendered on the server) to up to 5 people. Account trips only. */
  emailPdf: (id: string, to: string[], note: string) =>
    call<{ ok: true }>(`/api/trips/${encodeURIComponent(id)}/email`, { method: "POST", body: JSON.stringify({ to, note }) }),
};

export const shareUrl = (token: string) => `${window.location.origin}/share/${token}`;
