import { createContext, useContext, useEffect, useMemo, useState } from "react";

// The palette is still being defined, so the app follows the device theme.
// Light/dark overrides are intentionally disabled until those palettes are
// reviewed; the provider still exposes `useTheme()` for future use.
const ThemeContext = createContext(null);

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [resolved, setResolved] = useState(getSystemTheme);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(getSystemTheme());
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  const value = useMemo(() => ({ mode: "system", resolved }), [resolved]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside a ThemeProvider");
  return context;
}
