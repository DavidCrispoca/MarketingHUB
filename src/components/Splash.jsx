import { useI18n } from "../i18n/index.jsx";
import "../features/auth/access.css";

export default function Splash() {
  const { t } = useI18n();

  return (
    <div className="access">
      <div className="access__panel access__panel--notice">
        <span className="access__mark access__mark--pulse" aria-hidden="true" />
        <p className="access__subtitle" role="status">
          {t("state.loading")}
        </p>
      </div>
    </div>
  );
}
