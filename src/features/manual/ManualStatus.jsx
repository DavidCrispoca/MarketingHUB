import { useI18n } from "../../i18n/index.jsx";

// Shared loading / error block for the manual views.
export default function ManualStatus({ isPending, isError, refetch }) {
  const { t } = useI18n();

  if (isPending) {
    return (
      <p className="state" role="status">
        {t("state.loading")}
      </p>
    );
  }

  if (isError) {
    return (
      <div className="state" role="alert">
        <p>{t("manual.loadError")}</p>
        <button className="btn btn--ghost" type="button" onClick={() => refetch()}>
          {t("state.retry")}
        </button>
      </div>
    );
  }

  return null;
}
