"use client";

import { useEffect, useRef, useState } from "react";

// Animates a number from its previous value to `value` whenever it changes.
export default function CountUpNumber({ value, className, duration = 700 }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    let frame;

    function step(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        prevRef.current = to;
      }
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}
