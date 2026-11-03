import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/index.jsx";

export default function NotFoundPage() {
  const { t } = useI18n();

  return (
    <div className="state">
      <h1>{t("notfound.title")}</h1>
      <p>{t("notfound.body")}</p>
      <Link className="btn btn--ghost" to="/">
        {t("notfound.back")}
      </Link>
    </div>
  );
}
