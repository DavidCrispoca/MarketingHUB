import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../features/auth/AuthProvider.jsx";

// The name is identity for the audit trail, never a permission.
export default function SessionMenu() {
  const { t } = useI18n();
  const { grant, signOut } = useAuth();

  if (!grant) return null;

  return (
    <div className="session">
      <span className="session__name">{grant.holder_name}</span>
      <button className="btn btn--quiet session__out" type="button" onClick={signOut}>
        {t("session.signOut")}
      </button>
    </div>
  );
}
