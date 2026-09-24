import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  Sun,
  type LucideIcon,
} from "lucide-react";

// Trip-day weather from Open-Meteo (free, no key, CORS-enabled).
// Forecasts reach ~16 days ahead; further out we show the same dates last year as "typical".

export type WeatherSource = "forecast" | "typical";

export type DayWeather = {
  date: string;
  code: number;
  max: number;
  min: number;
  /** Chance of rain in % (forecast only). */
  rainChance: number | null;
  /** Rain in mm over the day. */
  rainMm: number;
  source: WeatherSource;
};

type Place = { date: string; lat: number; lng: number };

export const FORECAST_DAYS = 16;

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDaysIso = (date: string, n: number) => {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};

/** The same calendar day a year earlier (29 Feb → 28 Feb). */
export function lastYear(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const day = m === 2 && d === 29 ? 28 : d;
  return `${y - 1}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Forecast for the next 16 days, last year's weather beyond that, nothing for days already past. */
export function sourceFor(date: string, today: string): WeatherSource | null {
  if (date < today) return null;
  return date <= addDaysIso(today, FORECAST_DAYS - 1) ? "forecast" : "typical";
}

type Request = { url: string; source: WeatherSource; dates: { trip: string; query: string }[] };

/** One request per place and source; days in the same city share a call. */
export function weatherRequests(places: Place[], today: string): Request[] {
  const groups = new Map<string, Request>();
  for (const p of places) {
    const source = sourceFor(p.date, today);
    if (!source || (p.lat === 0 && p.lng === 0)) continue;
    const lat = p.lat.toFixed(2);
    const lng = p.lng.toFixed(2);
    const key = `${source}:${lat},${lng}`;
    const g = groups.get(key) ?? { url: "", source, dates: [] };
    g.dates.push({ trip: p.date, query: source === "typical" ? lastYear(p.date) : p.date });
    groups.set(key, g);
    const qs = g.dates.map((d) => d.query).sort();
    const range = `latitude=${lat}&longitude=${lng}&start_date=${qs[0]}&end_date=${qs[qs.length - 1]}&timezone=auto`;
    g.url =
      source === "forecast"
        ? `https://api.open-meteo.com/v1/forecast?${range}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum`
        : `https://archive-api.open-meteo.com/v1/archive?${range}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum`;
  }
  return [...groups.values()];
}

type Daily = {
  time: string[];
  weather_code: (number | null)[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  precipitation_sum?: (number | null)[];
  precipitation_probability_max?: (number | null)[];
};

const CACHE_MS = 3 * 60 * 60 * 1000;

async function getDaily(url: string, signal?: AbortSignal): Promise<Daily | null> {
  try {
    const hit = JSON.parse(sessionStorage.getItem(`wx:${url}`) ?? "null") as { at: number; daily: Daily } | null;
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.daily;
  } catch {
    // storage unavailable
  }
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const daily = ((await res.json()) as { daily?: Daily }).daily ?? null;
  if (daily) {
    try {
      sessionStorage.setItem(`wx:${url}`, JSON.stringify({ at: Date.now(), daily }));
    } catch {
      // storage full or blocked: fine without cache
    }
  }
  return daily;
}

/** Weather for each trip day, keyed by the trip date. Missing entries mean "no data". */
export async function tripWeather(places: Place[], signal?: AbortSignal): Promise<Record<string, DayWeather>> {
  const out: Record<string, DayWeather> = {};
  const today = iso(new Date(Date.now() - new Date().getTimezoneOffset() * 60_000));
  await Promise.all(
    weatherRequests(places, today).map(async (r) => {
      const daily = await getDaily(r.url, signal).catch(() => null);
      if (!daily) return;
      for (const { trip, query } of r.dates) {
        const i = daily.time.indexOf(query);
        const code = daily.weather_code[i];
        const max = daily.temperature_2m_max[i];
        const min = daily.temperature_2m_min[i];
        if (i < 0 || code == null || max == null || min == null) continue;
        out[trip] = {
          date: trip,
          code,
          max: Math.round(max),
          min: Math.round(min),
          rainChance: daily.precipitation_probability_max?.[i] ?? null,
          rainMm: Math.round((daily.precipitation_sum?.[i] ?? 0) * 10) / 10,
          source: r.source,
        };
      }
    })
  );
  return out;
}

/** WMO weather code → words and an icon. */
export function describeWeather(code: number): { label: string; icon: LucideIcon } {
  if (code === 0) return { label: "Clear", icon: Sun };
  if (code <= 2) return { label: "Partly cloudy", icon: CloudSun };
  if (code === 3) return { label: "Cloudy", icon: Cloud };
  if (code === 45 || code === 48) return { label: "Foggy", icon: CloudFog };
  if (code >= 51 && code <= 57) return { label: "Drizzle", icon: CloudDrizzle };
  if ((code >= 61 && code <= 67) || code === 80 || code === 81) return { label: code >= 65 || code === 81 ? "Heavy rain" : "Rain", icon: CloudRain };
  if (code === 82) return { label: "Violent showers", icon: CloudRainWind };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: "Snow", icon: CloudSnow };
  if (code >= 95) return { label: "Thunderstorms", icon: CloudLightning };
  return { label: "Mixed", icon: CloudSun };
}

/** A one-line heads-up when the weather should change the plan, else null. */
export function weatherWarning(w: DayWeather): string | null {
  const usually = w.source === "typical";
  if (w.code >= 95) return usually ? "Thunderstorms are common around this date. Keep outdoor plans flexible." : "Thunderstorms likely. Keep outdoor plans and boat rides flexible.";
  if ((w.rainChance ?? 0) >= 70 || w.rainMm >= 10 || w.code === 82 || w.code === 65 || w.code === 81)
    return usually ? "Often rainy around this date. Pack rain gear." : "Heavy rain likely. Carry an umbrella and keep indoor backups.";
  if (w.max >= 38) return "Very hot. Do outdoor sights early morning or after 4 pm, and drink plenty of water.";
  if (w.min <= 5) return "Cold night. Pack warm layers.";
  return null;
}
