"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "./theme-boot";

export type ThemePref = "dark" | "light" | "system";
export type Theme = "dark" | "light";

const readPref = (): ThemePref => {
  try {
    const p = localStorage.getItem(THEME_KEY);
    return p === "light" || p === "system" ? p : "dark";
  } catch {
    return "dark";
  }
};

const resolve = (p: ThemePref): Theme =>
  p === "system" ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : p;

function apply(p: ThemePref) {
  const t = resolve(p);
  const r = document.documentElement;
  r.dataset.theme = t;
  r.classList.toggle("dark", t === "dark");
}

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function setThemePref(p: ThemePref) {
  try {
    localStorage.setItem(THEME_KEY, p);
  } catch {
    // storage blocked: the choice still applies for this visit
  }
  apply(p);
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  // Follow the OS setting live while "System" is selected.
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  const onOs = () => {
    if (readPref() === "system") {
      apply("system");
      emit();
    }
  };
  mq.addEventListener("change", onOs);
  // Other tabs changing the theme.
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY) {
      apply(readPref());
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    mq.removeEventListener("change", onOs);
    window.removeEventListener("storage", onStorage);
  };
}

export const useThemePref = () => useSyncExternalStore(subscribe, readPref, () => "dark" as ThemePref);

/** The theme actually showing ("system" resolved). Server render assumes dark. */
export const useTheme = () =>
  useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.theme === "light" ? "light" : "dark") as Theme,
    () => "dark" as Theme
  );
