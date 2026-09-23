export const THEME_KEY = "tripyyy-theme";

/**
 * Inlined into <head> by app/layout.tsx so the saved theme applies before first paint
 * (no dark flash for light-theme users). Plain string: it runs before any bundle loads.
 */
export const themeBootScript = `(() => {
  try {
    var p = localStorage.getItem("${THEME_KEY}") || "dark";
    var t = p === "system" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : p;
    var r = document.documentElement;
    r.dataset.theme = t;
    r.classList.toggle("dark", t === "dark");
  } catch (e) {}
})();`;
