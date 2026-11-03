import { useState } from "react";
import { useI18n } from "../../i18n/index.jsx";
import ManualBlock from "./ManualBlock.jsx";
import {
  LOGOS_FOLDER,
  LOGO_EXTENSIONS,
  MAX_FILE_BYTES,
  hasAllowedExtension,
  removeBrandFile,
  uploadBrandFile,
} from "./storage.js";
import { nextPosition, useManualActions } from "./useManual.js";

const EMPTY_LOGO = {
  variant: "",
  storage_path: null,
  asset_id: null,
  min_size_px: "",
  clear_space_notes: "",
};

export default function LogosSection({ brandId, logos, urls, assets, assetUrls }) {
  const { t } = useI18n();
  const { saveLogo, removeLogo, reorderLogo } = useManualActions(brandId);

  const [draft, setDraft] = useState(null);
  const [file, setFile] = useState(null);
  const [failed, setFailed] = useState(null);

  const busy = saveLogo.isPending || removeLogo.isPending || reorderLogo.isPending;

  function closeForm() {
    setDraft(null);
    setFile(null);
    setFailed(null);
  }

  function openCreate() {
    setFailed(null);
    setFile(null);
    setDraft({ ...EMPTY_LOGO });
  }

  function openEdit(logo) {
    setFailed(null);
    setFile(null);
    setDraft({
      id: logo.id,
      variant: logo.variant,
      storage_path: logo.storage_path,
      asset_id: logo.asset_id,
      min_size_px: logo.min_size_px == null ? "" : String(logo.min_size_px),
      clear_space_notes: logo.clear_space_notes ?? "",
    });
  }

  function update(patch) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function handleFile(event) {
    const picked = event.target.files?.[0] ?? null;

    if (picked && !hasAllowedExtension(picked.name, LOGO_EXTENSIONS)) {
      setFailed(t("manual.files.wrongType"));
      event.target.value = "";
      return;
    }
    if (picked && picked.size > MAX_FILE_BYTES) {
      setFailed(t("manual.files.tooBig"));
      event.target.value = "";
      return;
    }

    setFailed(null);
    setFile(picked);
    if (picked) update({ asset_id: null });
  }

  const minSize = draft ? Number.parseInt(draft.min_size_px, 10) : Number.NaN;
  const minSizeValid = !draft || draft.min_size_px.trim() === "" || (Number.isInteger(minSize) && minSize > 0);

  const canSubmit =
    Boolean(draft) &&
    draft.variant.trim().length > 0 &&
    minSizeValid &&
    // A logo without an image has nothing to show, so the file is required once.
    (Boolean(draft.storage_path) || Boolean(draft.asset_id) || Boolean(file)) &&
    !busy;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setFailed(null);
    let uploaded = null;

    try {
      let storagePath = draft.storage_path ?? null;
      if (draft.asset_id) storagePath = null;

      if (file) {
        uploaded = await uploadBrandFile(brandId, LOGOS_FOLDER, file);
        storagePath = uploaded;
      }

      const payload = {
        variant: draft.variant.trim(),
        storage_path: storagePath,
        asset_id: draft.asset_id || null,
        min_size_px: draft.min_size_px.trim() === "" ? null : minSize,
        clear_space_notes: draft.clear_space_notes.trim() || null,
      };

      if (draft.id) {
        await saveLogo.mutateAsync({ id: draft.id, ...payload });
        if ((uploaded || draft.asset_id) && draft.storage_path) {
          try {
            await removeBrandFile(draft.storage_path);
          } catch {
            // A leftover file is harmless: the bucket is private.
          }
        }
      } else {
        await saveLogo.mutateAsync({ ...payload, position: nextPosition(logos) });
      }

      closeForm();
    } catch {
      if (uploaded) {
        try {
          await removeBrandFile(uploaded);
        } catch {
          // Ignored on purpose: the row was never saved.
        }
      }
      setFailed(t("manual.logos.error"));
    }
  }

  async function handleDelete(logo) {
    if (!window.confirm(t("manual.delete.confirm", { name: logo.variant }))) return;
    try {
      await removeLogo.mutateAsync(logo.id);
      if (logo.storage_path) {
        try {
          await removeBrandFile(logo.storage_path);
        } catch {
          // Same as above: a private orphan file leaks nothing.
        }
      }
    } catch {
      setFailed(t("manual.logos.error"));
    }
  }

  return (
    <ManualBlock
      title={t("manual.logos.title")}
      description={t("manual.logos.hint")}
      count={logos.length}
      action={
        <button
          className="btn btn--ghost"
          type="button"
          onClick={() => (draft ? closeForm() : openCreate())}
        >
          {draft ? t("manual.cancel") : t("manual.logos.add")}
        </button>
      }
    >
      {failed ? (
        <p className="m-error" role="alert">
          {failed}
        </p>
      ) : null}

      {draft ? (
        <form className="m-form" onSubmit={handleSubmit} noValidate>
          <div className="m-form__row">
            <label className="field">
              <span className="field__label">{t("manual.logos.variant")}</span>
              <input
                className="field__input"
                type="text"
                maxLength={60}
                placeholder={t("manual.logos.variant.placeholder")}
                value={draft.variant}
                onChange={(event) => update({ variant: event.target.value })}
              />
            </label>

            <label className="field">
              <span className="field__label">{t("manual.logos.asset")}</span>
              <select className="field__input" value={draft.asset_id ?? ""} onChange={(event) => { update({ asset_id: event.target.value || null }); if (event.target.value) setFile(null); }}>
                <option value="">{t("manual.logos.asset.none")}</option>
                {assets.filter((asset) => asset.mime_type.startsWith("image/")).map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
              </select>
            </label>

            <label className="field">
              <span className="field__label">{t("manual.logos.minSize")}</span>
              <input
                className="field__input"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="24"
                value={draft.min_size_px}
                onChange={(event) => update({ min_size_px: event.target.value })}
              />
            </label>
          </div>

          <label className="field">
            <span className="field__label">{t("manual.logos.file")}</span>
            <input
              className="field__file"
              type="file"
              accept={LOGO_EXTENSIONS.join(",")}
              onChange={handleFile}
            />
            <span className="field__hint">
              {draft.storage_path
                ? t("manual.files.replaceHint")
                : t("manual.files.hint", { formats: LOGO_EXTENSIONS.join(" ") })}
            </span>
          </label>

          <label className="field">
            <span className="field__label">{t("manual.logos.clearSpace")}</span>
            <textarea
              className="field__input field__textarea"
              rows={2}
              maxLength={400}
              placeholder={t("manual.logos.clearSpace.placeholder")}
              value={draft.clear_space_notes}
              onChange={(event) => update({ clear_space_notes: event.target.value })}
            />
          </label>

          <div className="m-form__actions">
            <button className="btn btn--ghost" type="button" onClick={closeForm}>
              {t("manual.cancel")}
            </button>
            <button className="btn btn--primary" type="submit" disabled={!canSubmit}>
              {saveLogo.isPending ? t("manual.saving") : t("manual.save")}
            </button>
          </div>
        </form>
      ) : null}

      {logos.length === 0 ? (
        <p className="m-empty">{t("manual.logos.empty")}</p>
      ) : (
        <ul className="m-grid m-grid--tiles">
          {logos.map((logo, index) => {
            const url = logo.asset_id ? assetUrls[logo.asset_id] : logo.storage_path ? urls[logo.storage_path] : null;

            return (
              <li key={logo.id} className="m-card logo-card">
                <div className="logo-card__frame">
                  {url ? (
                    <img className="logo-card__image" src={url} alt={logo.variant} loading="lazy" />
                  ) : (
                    <p className="m-card__meta">{t("manual.logos.noFile")}</p>
                  )}
                </div>

                <div className="m-card__head">
                  <h3 className="m-card__title">{logo.variant}</h3>
                </div>

                {logo.min_size_px ? (
                  <p className="m-card__meta">
                    {t("manual.logos.minSizeValue", { px: logo.min_size_px })}
                  </p>
                ) : null}

                {logo.clear_space_notes ? (
                  <p className="m-card__notes">{logo.clear_space_notes}</p>
                ) : null}

                <div className="m-card__tools">
                  <button className="icon-btn" type="button" aria-label={t("manual.moveUp")} disabled={index === 0 || reorderLogo.isPending} onClick={() => reorderLogo.mutate({ rows: logos, id: logo.id, direction: "up" })}>↑</button>
                  <button className="icon-btn" type="button" aria-label={t("manual.moveDown")} disabled={index === logos.length - 1 || reorderLogo.isPending} onClick={() => reorderLogo.mutate({ rows: logos, id: logo.id, direction: "down" })}>↓</button>
                  <button
                    className="icon-btn"
                    type="button"
                    aria-label={t("manual.edit")}
                    onClick={() => openEdit(logo)}
                  >
                    ✎
                  </button>
                  <button
                    className="icon-btn icon-btn--danger"
                    type="button"
                    aria-label={t("manual.delete")}
                    onClick={() => handleDelete(logo)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ManualBlock>
  );
}
