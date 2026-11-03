import { useI18n } from "../i18n/index.jsx";
import { useTheme } from "../app/theme.jsx";
import "./ThemeSwitcher.css";

const MODES = ["system", "light", "dark"];

export default function ThemeSwitcher() {
  const { t } = useI18n();
  const { mode, setMode } = useTheme();

  return (
    <div className="theme-switch" role="group" aria-label={t("theme.label")}>
      {MODES.map((value) => (
        <button
          key={value}
          type="button"
          className="theme-switch__btn"
          aria-pressed={mode === value}
          onClick={() => setMode(value)}
        >
          {t(`theme.${value}`)}
        </button>
      ))}
    </div>
  );
}
