import { useI18n } from "../../i18n/index.jsx";
import { useAuth } from "./AuthProvider.jsx";
import "./access.css";

const COPY = {
  unconfigured: { title: "setup.title", body: "setup.body" },
  "auth-disabled": { title: "setup.authDisabled.title", body: "setup.authDisabled.body" },
  error: { title: "setup.error.title", body: "setup.error.body" },
};

// Shown before anyone can sign in: missing config or a project that still
// needs anonymous sign-ins turned on.
export default function SetupNotice({ reason }) {
  const { t } = useI18n();
  const { reload } = useAuth();
  const copy = COPY[reason] ?? COPY.error;

  return (
    <div className="access">
      <section className="access__panel access__panel--notice" role="alert">
        <span className="access__mark" aria-hidden="true" />
        <div>
          <p className="label-caps">{t("app.name")}</p>
          <h1>{t(copy.title)}</h1>
        </div>
        <p className="access__subtitle">{t(copy.body)}</p>

        {reason === "unconfigured" ? null : (
          <button className="btn btn--ghost" type="button" onClick={reload}>
            {t("state.retry")}
          </button>
        )}
      </section>
    </div>
  );
}
