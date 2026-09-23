"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useReducedMotion } from "framer-motion";
import { setWorkerUrl, type LngLatBoundsLike } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, NavigationControl, Popup, Source, type MapRef } from "react-map-gl/maplibre";
import { useTheme } from "@/lib/theme";
import { arc, hasCoords, kindColor, toFocus, type MapFocus, type RouteStop } from "@/lib/trip-view";
import type { ItineraryDay } from "@/types/itinerary";

// Free CARTO basemaps (no API key). Attribution is shown by the map's attribution control.
// MapLibre paints can't read CSS variables, so the route colours are spelled out per theme.
const LOOK = {
  dark: {
    style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    base: "#f5f1e8",
    glow: "#dfaf55",
    line: "#f0cf8a",
    glowOpacity: 0.35,
    baseOpacity: 0.12,
  },
  light: {
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    base: "#161b26",
    glow: "#dfaf55",
    line: "#9c6a14",
    glowOpacity: 0.45,
    baseOpacity: 0.25,
  },
} as const;

// Copied from node_modules by scripts/copy-maplibre-worker.mjs (predev/prebuild).
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export default function TripMap({
  stops,
  day,
  focus,
  onFocus,
}: {
  stops: RouteStop[];
  day?: ItineraryDay;
  focus: MapFocus | null;
  onFocus: (f: MapFocus | null) => void;
}) {
  const ref = useRef<MapRef>(null);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const reduce = useReducedMotion();
  const look = LOOK[useTheme()];

  const fullLine = useMemo(() => {
    const coords: [number, number][] = [];
    for (let i = 1; i < stops.length; i++) {
      const seg = arc([stops[i - 1].lng, stops[i - 1].lat], [stops[i].lng, stops[i].lat], 48, stops[i].kind === "return" ? -0.22 : 0.18);
      coords.push(...(i === 1 ? seg : seg.slice(1)));
    }
    return coords;
  }, [stops]);

  const dayPoints = useMemo(
    () => (day ? day.items.map((item, i) => ({ item, i })).filter(({ item }) => hasCoords(item)) : []),
    [day]
  );

  // Draw the route progressively once the style has loaded.
  useEffect(() => {
    if (!loaded || fullLine.length < 2 || reduce) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 2200, 1);
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loaded, fullLine, reduce]);

  // Frame the whole route, or the selected day's places.
  useEffect(() => {
    const map = ref.current;
    if (!map || !loaded) return;
    const pts: [number, number][] = dayPoints.length >= 2 ? dayPoints.map(({ item }) => [item.lng, item.lat]) : stops.map((s) => [s.lng, s.lat]);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.flyTo({ center: pts[0], zoom: 11, duration: 1200 });
      return;
    }
    const lngs = pts.map((p) => p[0]);
    const lats = pts.map((p) => p[1]);
    const bounds: LngLatBoundsLike = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
    // Extra top padding leaves room for the city labels drawn above each pin.
    map.fitBounds(bounds, { padding: { top: 80, bottom: 44, left: 48, right: 56 }, duration: 1200, maxZoom: 13 });
  }, [loaded, dayPoints, stops]);

  useEffect(() => {
    if (focus && loaded) ref.current?.flyTo({ center: [focus.lng, focus.lat], zoom: 14, duration: 1400, essential: true });
  }, [focus, loaded]);

  const drawn = fullLine.slice(0, Math.max(2, Math.ceil(fullLine.length * (reduce ? 1 : progress))));
  const start = stops[0];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-hairline bg-ink">
      <Map
        ref={ref}
        mapStyle={look.style}
        initialViewState={{ longitude: start?.lng ?? 78.9, latitude: start?.lat ?? 20.6, zoom: start ? 6 : 4 }}
        onLoad={() => setLoaded(true)}
        attributionControl={{ compact: true }}
        dragRotate={false}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" showCompass={false} />

        <Source id="route-base" type="geojson" data={{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: fullLine } }}>
          <Layer id="route-base" type="line" paint={{ "line-color": look.base, "line-opacity": look.baseOpacity, "line-width": 2, "line-dasharray": [1, 2] }} layout={{ "line-cap": "round" }} />
        </Source>
        <Source id="route" type="geojson" data={{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: drawn } }}>
          <Layer id="route-glow" type="line" paint={{ "line-color": look.glow, "line-opacity": look.glowOpacity, "line-width": 9, "line-blur": 6 }} layout={{ "line-cap": "round", "line-join": "round" }} />
          <Layer id="route-line" type="line" paint={{ "line-color": look.line, "line-width": 2.5 }} layout={{ "line-cap": "round", "line-join": "round" }} />
        </Source>

        {stops.map((s, i) =>
          s.kind === "return" && i === stops.length - 1 && stops[0].name === s.name ? null : (
            <Marker key={`${s.name}-${i}`} longitude={s.lng} latitude={s.lat} anchor="bottom">
              <button
                type="button"
                onClick={() => onFocus({ lat: s.lat, lng: s.lng, title: s.name, subtitle: s.kind === "start" ? "Start" : s.kind === "end" ? "Destination" : "Stop", key: `stop-${i}` })}
                className="group flex flex-col items-center"
                aria-label={`${s.name} on map`}
              >
                <span className="mb-1 rounded-full border border-hairline bg-ink/85 px-2 py-0.5 text-[11px] font-medium text-sand backdrop-blur transition-colors group-hover:border-gold/60">
                  {s.name}
                </span>
                <span
                  className={
                    "grid size-6 place-items-center rounded-full border-2 font-mono text-[10px] font-semibold " +
                    (s.kind === "end" ? "border-gold bg-gold text-on-gold shadow-[0_0_16px_rgba(223,175,85,0.8)]" : "border-sand bg-ink text-sand")
                  }
                >
                  {i + 1}
                </span>
              </button>
            </Marker>
          )
        )}

        {dayPoints.map(({ item, i }) => (
          <Marker key={`${day?.day}-${i}`} longitude={item.lng} latitude={item.lat} anchor="center">
            <button
              type="button"
              onClick={() => onFocus(toFocus(item, `${day?.day}-${i}`))}
              aria-label={`${item.title} on map`}
              className="block size-3.5 rounded-full border-2 border-ink transition-transform hover:scale-150"
              style={{ background: kindColor(item.kind), boxShadow: `0 0 10px ${kindColor(item.kind)}` }}
            />
          </Marker>
        ))}

        {focus && (
          <Popup longitude={focus.lng} latitude={focus.lat} anchor="bottom" offset={18} closeButton={false} onClose={() => onFocus(null)} className="tripyyy-popup">
            <p className="text-sm font-medium text-sand">{focus.title}</p>
            {focus.subtitle && <p className="text-xs text-slate">{focus.subtitle}</p>}
          </Popup>
        )}
      </Map>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-surface" aria-hidden />}
    </div>
  );
}
