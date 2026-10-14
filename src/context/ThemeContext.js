"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("gdg-lb-theme") : null;
    const initial = stored || "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
    setReady(true);
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("gdg-lb-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
