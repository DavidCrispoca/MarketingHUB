import { NavLink, Outlet } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import BrandSwitcher from "../components/BrandSwitcher.jsx";
import SessionMenu from "../components/SessionMenu.jsx";
import { isLocalMode } from "../lib/supabase.js";
import "./AppShell.css";

export default function AppShell() {
  const { t } = useI18n();

  return (
    <div className="shell">
      <header className="shell__topbar">
        <NavLink to="/" className="shell__brand">
          <span className="shell__mark" aria-hidden="true" />
          <span className="shell__name">{t("app.name")}</span>
        </NavLink>

        <div className="shell__actions">
          {isLocalMode && <span className="shell__local-badge" title={t("local.badge.title")}>{t("local.badge")}</span>}
          <BrandSwitcher />
          <SessionMenu />
        </div>
      </header>

      <main className="shell__main">
        <Outlet />
      </main>
    </div>
  );
}
