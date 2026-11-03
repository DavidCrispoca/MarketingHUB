import { createContext, useContext, useMemo } from "react";
import es from "./es.json";

const DICTS = { es };
const DEFAULT_LOCALE = "es";

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const value = useMemo(() => {
    const dict = DICTS[DEFAULT_LOCALE];
    // Supports simple placeholders: t("key", { name: "Café" }) with "{name}".
    const t = (key, params) => {
      const template = dict[key] ?? key;
      if (!params) return template;
      return template.replace(/\{(\w+)\}/g, (match, token) =>
        params[token] === undefined ? match : String(params[token]),
      );
    };
    return { locale: DEFAULT_LOCALE, t };
  }, []);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside an I18nProvider");
  return context;
}
