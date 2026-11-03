import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useI18n } from "../../i18n/index.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useBrands, useCreateBrand } from "./useBrands.js";
import "./brands.css";

export default function BrandsPage() {
  const { t } = useI18n();
  const { grant } = useAuth();
  const { data: brands = [], isPending, isError, refetch } = useBrands();
  const createBrand = useCreateBrand();

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [failed, setFailed] = useState(false);

  const canSubmit = name.trim().length >= 1 && !createBrand.isPending;

  async function handleCreate(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setFailed(false);
    try {
      await createBrand.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        accessCodeId: grant.access_code_id,
      });
      setName("");
      setDescription("");
      setFormOpen(false);
    } catch {
      setFailed(true);
    }
  }

  // Temporary single-brand workspace: everyone who redeems the code lands
  // directly on the only brand, and the list cannot grow by accident.
  if (!isPending && !isError && brands.length === 1) {
    return <Navigate to={`/m/${brands[0].slug}`} replace />;
  }

  return (
    <section className="brands">
      <header className="brands__head">
        <div>
          <p className="label-caps">{t("app.name")}</p>
          <h1>{t("brands.title")}</h1>
          <p className="brands__lead">{t("brands.subtitle")}</p>
        </div>

        {brands.length ? null : (
          <button
            className="btn btn--ghost"
            type="button"
            onClick={() => setFormOpen((open) => !open)}
          >
            {formOpen ? t("brands.cancel") : t("brands.new")}
          </button>
        )}
      </header>

      {formOpen ? (
        <form className="brands__form" onSubmit={handleCreate} noValidate>
          <label className="field">
            <span className="field__label">{t("brands.name")}</span>
            <input
              className="field__input"
              type="text"
              name="brand-name"
              maxLength={80}
              placeholder={t("brands.name.placeholder")}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">{t("brands.description")}</span>
            <input
              className="field__input"
              type="text"
              name="brand-description"
              maxLength={200}
              placeholder={t("brands.description.placeholder")}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          {failed ? (
            <p className="brands__error" role="alert">
              {t("brands.error")}
            </p>
          ) : null}

          <div className="brands__form-actions">
            <button className="btn btn--primary" type="submit" disabled={!canSubmit}>
              {createBrand.isPending ? t("brands.creating") : t("brands.create")}
            </button>
          </div>
        </form>
      ) : null}

      {isPending ? (
        <p className="state" role="status">
          {t("state.loading")}
        </p>
      ) : isError ? (
        <div className="state" role="alert">
          <p>{t("state.error")}</p>
          <button className="btn btn--ghost" type="button" onClick={() => refetch()}>
            {t("state.retry")}
          </button>
        </div>
      ) : brands.length === 0 ? (
        <p className="brands__empty">{t("brands.empty")}</p>
      ) : (
        <ul className="brands__grid">
          {brands.map((brand) => (
            <li key={brand.id} className="brands__card">
              <div className="brands__card-body">
                <h2 className="brands__card-name">{brand.name}</h2>
                {brand.description ? (
                  <p className="brands__card-desc">{brand.description}</p>
                ) : null}
                <p className="label-caps brands__card-date">
                  {t("brands.since", {
                    date: format(new Date(brand.created_at), "d MMM yyyy", { locale: es }),
                  })}
                </p>
              </div>
              <Link className="btn btn--ghost" to={`/m/${brand.slug}`}>
                {t("brands.open")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
