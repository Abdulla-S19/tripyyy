// MapLibre 6 loads its web worker as a separate ES module that bundlers don't emit.
// Serve the installed version's worker (and the shared chunk it imports) from /public.
import { copyFileSync, mkdirSync } from "node:fs";

const out = new URL("../public/maplibre/", import.meta.url);
mkdirSync(out, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(new URL(`../node_modules/maplibre-gl/dist/${f}`, import.meta.url), new URL(f, out));
}
console.log("maplibre worker copied to public/maplibre");
