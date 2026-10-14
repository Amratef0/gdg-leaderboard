"use client";

import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";

// Swaps to a white-text variant automatically in dark mode
// (the colorful icon stays identical in both versions).
export default function Logo({ width = 170, height = 35, priority = false, className }) {
  const { theme } = useTheme();
  return (
    <Image
      src={theme === "dark" ? "/logo-dark.png" : "/logo.png"}
      alt="GDG on Campus CIC"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
