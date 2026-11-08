"use client";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "../motion-toggle";
export function AnimatedNumber({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduced) {
      node.textContent = String(value);
      return;
    }
    const started = performance.now();
    let frame = 0;
    function tick(now: number) {
      const progress = Math.min((now - started) / 650, 1);
      if (node)
        node.textContent = String(
          Math.round(value * (1 - Math.pow(1 - progress, 3))),
        );
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);
  return (
    <>
      <span className="stat-number" ref={ref} aria-hidden="true">
        {value}
      </span>
      <span className="sr-only">{value}</span>
    </>
  );
}
