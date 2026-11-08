"use client";
import { useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";
function subscribe(callback: () => void) {
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  window.addEventListener("leadrescue-motion", callback);
  return () => {
    media.removeEventListener("change", callback);
    window.removeEventListener("leadrescue-motion", callback);
  };
}
function snapshot() {
  return (
    document.documentElement.dataset.motion === "off" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
function devicePreference() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}
export function MotionToggle() {
  const paused = useReducedMotion();
  const deviceReduced = useSyncExternalStore(
    subscribe,
    devicePreference,
    () => false,
  );
  const label = deviceReduced
    ? "Animations disabled by device preference"
    : paused
      ? "Enable animations"
      : "Pause animations";
  return (
    <button
      className="icon-button motion-toggle"
      aria-label={label}
      title={label}
      disabled={deviceReduced}
      onClick={() => {
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const value = paused ? "on" : "off";
        document.documentElement.dataset.motion = value;
        try {
          localStorage.setItem("leadrescue-motion", value);
        } catch {}
        window.dispatchEvent(new Event("leadrescue-motion"));
      }}
    >
      {paused ? <Play size={16} /> : <Pause size={16} />}
    </button>
  );
}
