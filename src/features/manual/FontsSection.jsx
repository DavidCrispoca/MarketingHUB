import { useState } from "react";
import { useI18n } from "../../i18n/index.jsx";
import ManualBlock from "./ManualBlock.jsx";
import { BrandFontStyles, fontFamilyAlias, fontWeights } from "./brandFonts.jsx";
import {
  FONTS_FOLDER,
  FONT_EXTENSIONS,
  MAX_FILE_BYTES,
  hasAllowedExtension,
  removeBrandFile,
  uploadBrandFile,
} from "./storage.js";
import { FONT_ROLES, nextPosition, useManualActions } from "./useManual.js";

const EMPTY_FONT = {
  family: "",
  role: "title",
  weights: "400, 700",
  license_notes: "",
  storage_path: null,
};

// "400, 700" -> [400, 700]. Anything outside 100-900 is dropped.
function parseWeights(value) {
  const parsed = String(value)
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map(Number)
    .filter((weight) => Number.isInteger(weight) && weight >= 100 && weight <= 900);

  return [...new Set(parsed)].sort((a, b) => a - b);
}

export default function FontsSection({ brandId, fonts, urls }) {
  const { t } = useI18n();
  const { saveFont, removeFont, reorderFont } = useManualActions(brandId);

  const [draft, setDraft] = useState(null);
  const [file, setFile] = useState(null);
  const [failed, setFailed] = useState(null);

  const busy = saveFont.isPending || removeFont.isPending || reorderFont.isPending;

  function closeForm() {
    setDraft(null);
    setFile(null);
    setFailed(null);
  }

  function openCreate() {
    setFailed(null);
    setFile(null);
    setDraft({ ...EMPTY_FONT });
  }

  function openEdit(font) {
    setFailed(null);
    setFile(null);
    setDraft({
      id: font.id,
      family: font.family,
      role: font.role,
      weights: fontWeights(font).join(", "),
      license_notes: font.license_notes ?? "",
      storage_path: font.storage_path,
    });
  }

  function update(patch) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function handleFile(event) {
    const picked = event.target.files?.[0] ?? null;

    if (picked && !hasAllowedExtension(picked.name, FONT_EXTENSIONS)) {
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
  }

  const canSubmit = Boolean(draft) && draft.family.trim().length > 0 && !busy;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setFailed(null);
    let uploaded = null;

    try {
      let storagePath = draft.storage_path ?? null;

      if (file) {
        uploaded = await uploadBrandFile(brandId, FONTS_FOLDER, file);
        storagePath = uploaded;
      }

      const payload = {
        family: draft.family.trim(),
        role: draft.role,
        weights: parseWeights(draft.weights),
        license_notes: draft.license_notes.trim() || null,
        storage_path: storagePath,
      };

      if (draft.id) {
        await saveFont.mutateAsync({ id: draft.id, ...payload });
        // The old file is unreachable once the row points somewhere else.
        if (uploaded && draft.storage_path) {
          try {
            await removeBrandFile(draft.storage_path);
          } catch {
            // A leftover file is harmless: the bucket is private.
          }
        }
      } else {
        await saveFont.mutateAsync({ ...payload, position: nextPosition(fonts) });
      }

      closeForm();
    } catch {
      // Do not leave behind a file nobody references.
      if (uploaded) {
        try {
          await removeBrandFile(uploaded);
        } catch {
          // Ignored on purpose: the row was never saved.
        }
      }
      setFailed(t("manual.fonts.error"));
    }
  }

  async function handleDelete(font) {
    if (!window.confirm(t("manual.delete.confirm", { name: font.family }))) return;
    try {
      await removeFont.mutateAsync(font.id);
      if (font.storage_path) {
        try {
          await removeBrandFile(font.storage_path);
        } catch {
          // Same as above: a private orphan file leaks nothing.
        }
      }
    } catch {
      setFailed(t("manual.fonts.error"));
    }
  }

  return (
    <ManualBlock
      title={t("manual.fonts.title")}
      description={t("manual.fonts.hint")}
      count={fonts.length}
      action={
        <button
          className="btn btn--ghost"
          type="button"
          onClick={() => (draft ? closeForm() : openCreate())}
        >
          {draft ? t("manual.cancel") : t("manual.fonts.add")}
        </button>
      }
    >
      <BrandFontStyles fonts={fonts} urls={urls} />

      {failed ? (
        <p className="m-error" role="alert">
          {failed}
        </p>
      ) : null}

      {draft ? (
        <form className="m-form" onSubmit={handleSubmit} noValidate>
          <div className="m-form__row">
            <label className="field">
              <span className="field__label">{t("manual.fonts.family")}</span>
              <input
                className="field__input"
                type="text"
                maxLength={80}
                placeholder={t("manual.fonts.family.placeholder")}
                value={draft.family}
                onChange={(event) => update({ family: event.target.value })}
              />
            </label>

            <label className="field">
              <span className="field__label">{t("manual.fonts.role")}</span>
              <select
                className="field__input"
                value={draft.role}
                onChange={(event) => update({ role: event.target.value })}
              >
                {FONT_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {t(`manual.fonts.role.${role}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span className="field__label">{t("manual.fonts.weights")}</span>
            <input
              className="field__input"
              type="text"
              maxLength={40}
              placeholder="400, 700"
              value={draft.weights}
              onChange={(event) => update({ weights: event.target.value })}
            />
          </label>

          <label className="field">
            <span className="field__label">{t("manual.fonts.file")}</span>
            <input
              className="field__file"
              type="file"
              accept={FONT_EXTENSIONS.join(",")}
              onChange={handleFile}
            />
            <span className="field__hint">
              {draft.storage_path
                ? t("manual.files.replaceHint")
                : t("manual.files.hint", { formats: FONT_EXTENSIONS.join(" ") })}
            </span>
          </label>

          <label className="field">
            <span className="field__label">{t("manual.fonts.license")}</span>
            <textarea
              className="field__input field__textarea"
              rows={2}
              maxLength={400}
              placeholder={t("manual.fonts.license.placeholder")}
              value={draft.license_notes}
              onChange={(event) => update({ license_notes: event.target.value })}
            />
          </label>

          <div className="m-form__actions">
            <button className="btn btn--ghost" type="button" onClick={closeForm}>
              {t("manual.cancel")}
            </button>
            <button className="btn btn--primary" type="submit" disabled={!canSubmit}>
              {saveFont.isPending ? t("manual.saving") : t("manual.save")}
            </button>
          </div>
        </form>
      ) : null}

      {fonts.length === 0 ? (
        <p className="m-empty">{t("manual.fonts.empty")}</p>
      ) : (
        <ul className="m-grid">
          {fonts.map((font, index) => {
            const weights = fontWeights(font);
            const family = fontFamilyAlias(font);
            const hasFile = Boolean(font.storage_path && urls[font.storage_path]);

            return (
              <li key={font.id} className="m-card font-card">
                <div className="m-card__head">
                  <h3 className="m-card__title">{font.family}</h3>
                  <span className="label-caps">{t(`manual.fonts.role.${font.role}`)}</span>
                </div>

                <p className="m-card__meta">
                  {weights.join(" · ")} ·{" "}
                  {hasFile ? t("manual.fonts.loaded") : t("manual.fonts.noFile")}
                </p>

                {weights.map((weight) => (
                  <p
                    key={weight}
                    className="font-card__sample"
                    style={{ fontFamily: `"${family}"`, fontWeight: weight }}
                  >
                    {t("manual.fonts.sample")}
                  </p>
                ))}

                {font.license_notes ? (
                  <p className="m-card__notes">{font.license_notes}</p>
                ) : null}

                <div className="m-card__tools">
                  <button className="icon-btn" type="button" aria-label={t("manual.moveUp")} disabled={index === 0 || reorderFont.isPending} onClick={() => reorderFont.mutate({ rows: fonts, id: font.id, direction: "up" })}>↑</button>
                  <button className="icon-btn" type="button" aria-label={t("manual.moveDown")} disabled={index === fonts.length - 1 || reorderFont.isPending} onClick={() => reorderFont.mutate({ rows: fonts, id: font.id, direction: "down" })}>↓</button>
                  <button
                    className="icon-btn"
                    type="button"
                    aria-label={t("manual.edit")}
                    onClick={() => openEdit(font)}
                  >
                    ✎
                  </button>
                  <button
                    className="icon-btn icon-btn--danger"
                    type="button"
                    aria-label={t("manual.delete")}
                    onClick={() => handleDelete(font)}
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
