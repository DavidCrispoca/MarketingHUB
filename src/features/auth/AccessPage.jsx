import { useState } from "react";
import { useI18n } from "../../i18n/index.jsx";
import ThemeSwitcher from "../../components/ThemeSwitcher.jsx";
import { useAuth } from "./AuthProvider.jsx";
import "./access.css";

export default function AccessPage() {
  const { t } = useI18n();
  const { redeem } = useAuth();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [reason, setReason] = useState(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = name.trim().length >= 2 && code.trim().length >= 6 && !busy;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setReason(null);
    const result = await redeem(name.trim(), code.trim());
    setBusy(false);
    if (!result.ok) setReason(result.reason);
  }

  return (
    <div className="access">
      <section className="access__panel" aria-labelledby="access-title">
        <header className="access__head">
          <span className="access__mark" aria-hidden="true" />
          <div>
            <p className="label-caps">{t("app.name")}</p>
            <h1 id="access-title">{t("access.title")}</h1>
          </div>
        </header>

        <p className="access__subtitle">{t("access.subtitle")}</p>

        <form className="access__form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span className="field__label">{t("access.name")}</span>
            <input
              className="field__input"
              type="text"
              name="name"
              autoComplete="name"
              placeholder={t("access.name.placeholder")}
              maxLength={40}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">{t("access.code")}</span>
            <input
              className="field__input field__input--code"
              type="text"
              name="code"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder={t("access.code.placeholder")}
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
            />
          </label>

          {reason ? (
            <p className="access__error" role="alert">
              {t(`access.error.${reason}`)}
            </p>
          ) : null}

          <button className="btn btn--primary" type="submit" disabled={!canSubmit}>
            {busy ? t("access.submitting") : t("access.submit")}
          </button>
        </form>

        <p className="access__hint">{t("access.hint")}</p>
      </section>

      <div className="access__theme">
        <ThemeSwitcher />
      </div>
    </div>
  );
}
