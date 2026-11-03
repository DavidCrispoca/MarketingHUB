import { useState } from "react";
import { useI18n } from "../../i18n/index.jsx";
import ManualBlock from "./ManualBlock.jsx";
import { COLOR_ROLES, nextPosition, useManualActions } from "./useManual.js";

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const EMPTY_COLOR = {
  name: "",
  hex: "#C800DF",
  cmyk: "",
  pantone: "",
  role: "primary",
  usage_notes: "",
};

// Clicking the hex copies it, which is what the team needs most of the time.
function CopyHex({ hex }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // The clipboard can be blocked; the hex stays readable on screen anyway.
    }
  }

  return (
    <button
      className="swatch__copy"
      type="button"
      onClick={copy}
      aria-label={t("manual.colors.copy", { hex })}
    >
      {copied ? t("manual.colors.copied") : hex}
    </button>
  );
}

export default function ColorsSection({ brandId, colors }) {
  const { t } = useI18n();
  const { saveColor, removeColor, reorderColor } = useManualActions(brandId);

  const [draft, setDraft] = useState(null);
  const [failed, setFailed] = useState(false);

  const busy = saveColor.isPending || removeColor.isPending || reorderColor.isPending;

  function openCreate() {
    setFailed(false);
    setDraft({ ...EMPTY_COLOR });
  }

  function openEdit(color) {
    setFailed(false);
    setDraft({
      id: color.id,
      name: color.name,
      hex: color.hex.toUpperCase(),
      cmyk: color.cmyk ?? "",
      pantone: color.pantone ?? "",
      role: color.role,
      usage_notes: color.usage_notes ?? "",
    });
  }

  function update(patch) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  const hex = draft ? draft.hex.trim().toUpperCase() : "";
  const canSubmit =
    Boolean(draft) && draft.name.trim().length > 0 && HEX_PATTERN.test(hex) && !busy;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setFailed(false);
    const payload = {
      name: draft.name.trim(),
      hex,
      role: draft.role,
      cmyk: draft.cmyk.trim() || null,
      pantone: draft.pantone.trim() || null,
      usage_notes: draft.usage_notes.trim() || null,
    };

    try {
      if (draft.id) {
        await saveColor.mutateAsync({ id: draft.id, ...payload });
      } else {
        await saveColor.mutateAsync({ ...payload, position: nextPosition(colors) });
      }
      setDraft(null);
    } catch {
      setFailed(true);
    }
  }

  async function handleDelete(color) {
    if (!window.confirm(t("manual.delete.confirm", { name: color.name }))) return;
    try {
      await removeColor.mutateAsync(color.id);
    } catch {
      setFailed(true);
    }
  }

  return (
    <ManualBlock
      title={t("manual.colors.title")}
      count={colors.length}
      action={
        <button
          className="btn btn--ghost"
          type="button"
          onClick={() => (draft ? setDraft(null) : openCreate())}
        >
          {draft ? t("manual.cancel") : t("manual.colors.add")}
        </button>
      }
    >
      {failed ? (
        <p className="m-error" role="alert">
          {t("manual.colors.error")}
        </p>
      ) : null}

      {draft ? (
        <form className="m-form" onSubmit={handleSubmit} noValidate>
          <div className="m-form__row">
            <label className="field">
              <span className="field__label">{t("manual.colors.name")}</span>
              <input
                className="field__input"
                type="text"
                maxLength={60}
                placeholder={t("manual.colors.name.placeholder")}
                value={draft.name}
                onChange={(event) => update({ name: event.target.value })}
              />
            </label>

            <label className="field">
              <span className="field__label">{t("manual.colors.role")}</span>
              <select
                className="field__input"
                value={draft.role}
                onChange={(event) => update({ role: event.target.value })}
              >
                {COLOR_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {t(`manual.colors.role.${role}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="m-form__row">
            <label className="field">
              <span className="field__label">{t("manual.colors.picker")}</span>
              <input
                className="field__color"
                type="color"
                value={HEX_PATTERN.test(draft.hex) ? draft.hex : "#000000"}
                onChange={(event) => update({ hex: event.target.value.toUpperCase() })}
              />
            </label>

            <label className="field">
              <span className="field__label">{t("manual.colors.hex")}</span>
              <input
                className="field__input field__input--mono"
                type="text"
                maxLength={7}
                placeholder="#C800DF"
                value={draft.hex}
                onChange={(event) => update({ hex: event.target.value })}
              />
            </label>
          </div>

          <div className="m-form__row">
            <label className="field">
              <span className="field__label">{t("manual.colors.cmyk")}</span>
              <input
                className="field__input"
                type="text"
                maxLength={40}
                placeholder="0, 100, 0, 12"
                value={draft.cmyk}
                onChange={(event) => update({ cmyk: event.target.value })}
              />
            </label>

            <label className="field">
              <span className="field__label">{t("manual.colors.pantone")}</span>
              <input
                className="field__input"
                type="text"
                maxLength={40}
                placeholder="PMS 246 C"
                value={draft.pantone}
                onChange={(event) => update({ pantone: event.target.value })}
              />
            </label>
          </div>

          <label className="field">
            <span className="field__label">{t("manual.colors.notes")}</span>
            <textarea
              className="field__input field__textarea"
              rows={2}
              maxLength={400}
              placeholder={t("manual.colors.notes.placeholder")}
              value={draft.usage_notes}
              onChange={(event) => update({ usage_notes: event.target.value })}
            />
          </label>

          <div className="m-form__actions">
            <button className="btn btn--ghost" type="button" onClick={() => setDraft(null)}>
              {t("manual.cancel")}
            </button>
            <button className="btn btn--primary" type="submit" disabled={!canSubmit}>
              {saveColor.isPending ? t("manual.saving") : t("manual.save")}
            </button>
          </div>
        </form>
      ) : null}

      {colors.length === 0 ? (
        <p className="m-empty">{t("manual.colors.empty")}</p>
      ) : (
        <ul className="m-grid m-grid--tiles">
          {colors.map((color, index) => (
            <li key={color.id} className="swatch">
              <span
                className="swatch__chip"
                style={{ background: color.hex }}
                aria-hidden="true"
              />

              <div className="swatch__body">
                <h3 className="swatch__name">{color.name}</h3>
                <CopyHex hex={color.hex} />
                <p className="swatch__values">
                  {t(`manual.colors.role.${color.role}`)} · rgb({color.r}, {color.g}, {color.b})
                </p>
                {color.cmyk ? <p className="swatch__values">CMYK {color.cmyk}</p> : null}
                {color.pantone ? <p className="swatch__values">Pantone {color.pantone}</p> : null}
                {color.usage_notes ? <p className="swatch__notes">{color.usage_notes}</p> : null}
              </div>

              <div className="swatch__tools">
                <button
                  className="icon-btn"
                  type="button"
                  aria-label={t("manual.moveUp")}
                  disabled={index === 0 || busy}
                  onClick={() =>
                    reorderColor.mutate({ rows: colors, id: color.id, direction: "up" })
                  }
                >
                  ↑
                </button>
                <button
                  className="icon-btn"
                  type="button"
                  aria-label={t("manual.moveDown")}
                  disabled={index === colors.length - 1 || busy}
                  onClick={() =>
                    reorderColor.mutate({ rows: colors, id: color.id, direction: "down" })
                  }
                >
                  ↓
                </button>
                <button
                  className="icon-btn"
                  type="button"
                  aria-label={t("manual.edit")}
                  onClick={() => openEdit(color)}
                >
                  ✎
                </button>
                <button
                  className="icon-btn icon-btn--danger"
                  type="button"
                  aria-label={t("manual.delete")}
                  onClick={() => handleDelete(color)}
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
