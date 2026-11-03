import { useState } from "react";
import { useI18n } from "../../i18n/index.jsx";
import ManualBlock from "./ManualBlock.jsx";
import Markdown from "./Markdown.jsx";
import { GUIDELINE_SECTIONS, nextPosition, useManualActions } from "./useManual.js";

const EMPTY_GUIDELINE = { section: "voz", title: "", body_md: "" };

export default function GuidelinesSection({ brandId, guidelines }) {
  const { t } = useI18n();
  const { saveGuideline, removeGuideline, reorderGuideline } = useManualActions(brandId);

  const [draft, setDraft] = useState(null);
  const [failed, setFailed] = useState(false);

  const busy = saveGuideline.isPending || removeGuideline.isPending || reorderGuideline.isPending;

  function closeForm() {
    setDraft(null);
    setFailed(false);
  }

  function openCreate() {
    setFailed(false);
    setDraft({ ...EMPTY_GUIDELINE });
  }

  function openEdit(guideline) {
    setFailed(false);
    setDraft({
      id: guideline.id,
      section: guideline.section,
      title: guideline.title,
      body_md: guideline.body_md ?? "",
    });
  }

  function update(patch) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  const canSubmit = Boolean(draft) && draft.title.trim().length > 0 && !busy;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setFailed(false);
    const payload = {
      section: draft.section,
      title: draft.title.trim(),
      body_md: draft.body_md,
    };

    try {
      if (draft.id) {
        await saveGuideline.mutateAsync({ id: draft.id, ...payload });
      } else {
        await saveGuideline.mutateAsync({ ...payload, position: nextPosition(guidelines) });
      }
      closeForm();
    } catch {
      setFailed(true);
    }
  }

  async function handleDelete(guideline) {
    if (!window.confirm(t("manual.delete.confirm", { name: guideline.title }))) return;
    try {
      await removeGuideline.mutateAsync(guideline.id);
    } catch {
      setFailed(true);
    }
  }

  return (
    <ManualBlock
      title={t("manual.guidelines.title")}
      description={t("manual.guidelines.hint")}
      count={guidelines.length}
      action={
        <button
          className="btn btn--ghost"
          type="button"
          onClick={() => (draft ? closeForm() : openCreate())}
        >
          {draft ? t("manual.cancel") : t("manual.guidelines.add")}
        </button>
      }
    >
      {failed ? (
        <p className="m-error" role="alert">
          {t("manual.guidelines.error")}
        </p>
      ) : null}

      {draft ? (
        <form className="m-form" onSubmit={handleSubmit} noValidate>
          <div className="m-form__row">
            <label className="field">
              <span className="field__label">{t("manual.guidelines.section")}</span>
              <select
                className="field__input"
                value={draft.section}
                onChange={(event) => update({ section: event.target.value })}
              >
                {GUIDELINE_SECTIONS.map((section) => (
                  <option key={section} value={section}>
                    {t(`manual.guidelines.section.${section}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">{t("manual.guidelines.heading")}</span>
              <input
                className="field__input"
                type="text"
                maxLength={120}
                placeholder={t("manual.guidelines.heading.placeholder")}
                value={draft.title}
                onChange={(event) => update({ title: event.target.value })}
              />
            </label>
          </div>

          <label className="field">
            <span className="field__label">{t("manual.guidelines.body")}</span>
            <textarea
              className="field__input field__textarea field__textarea--tall"
              rows={8}
              maxLength={8000}
              placeholder={t("manual.guidelines.body.placeholder")}
              value={draft.body_md}
              onChange={(event) => update({ body_md: event.target.value })}
            />
            <span className="field__hint">{t("manual.guidelines.markdownHint")}</span>
          </label>

          {draft.body_md.trim() ? (
            <div className="m-form__preview">
              <p className="label-caps">{t("manual.preview")}</p>
              <Markdown>{draft.body_md}</Markdown>
            </div>
          ) : null}

          <div className="m-form__actions">
            <button className="btn btn--ghost" type="button" onClick={closeForm}>
              {t("manual.cancel")}
            </button>
            <button className="btn btn--primary" type="submit" disabled={!canSubmit}>
              {saveGuideline.isPending ? t("manual.saving") : t("manual.save")}
            </button>
          </div>
        </form>
      ) : null}

      {guidelines.length === 0 ? (
        <p className="m-empty">{t("manual.guidelines.empty")}</p>
      ) : (
        <ul className="m-grid">
          {guidelines.map((guideline, index) => (
            <li key={guideline.id} className="m-card">
              <div className="m-card__head">
                <h3 className="m-card__title">{guideline.title}</h3>
                <span className="label-caps">
                  {t(`manual.guidelines.section.${guideline.section}`)}
                </span>
              </div>

              <Markdown>{guideline.body_md}</Markdown>

              <div className="m-card__tools">
                <button className="icon-btn" type="button" aria-label={t("manual.moveUp")} disabled={index === 0 || reorderGuideline.isPending} onClick={() => reorderGuideline.mutate({ rows: guidelines, id: guideline.id, direction: "up" })}>↑</button>
                <button className="icon-btn" type="button" aria-label={t("manual.moveDown")} disabled={index === guidelines.length - 1 || reorderGuideline.isPending} onClick={() => reorderGuideline.mutate({ rows: guidelines, id: guideline.id, direction: "down" })}>↓</button>
                <button
                  className="icon-btn"
                  type="button"
                  aria-label={t("manual.edit")}
                  onClick={() => openEdit(guideline)}
                >
                  ✎
                </button>
                <button
                  className="icon-btn icon-btn--danger"
                  type="button"
                  aria-label={t("manual.delete")}
                  onClick={() => handleDelete(guideline)}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ManualBlock>
  );
}
