import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useI18n } from "../../i18n/index.jsx";
import Section from "../../components/Section.jsx";
import { campaignSchema, captionSchema, ctaSchema, hashtagSetSchema, templateSchema } from "../../lib/schemas.js";
import { useBankData, useBankDelete, useBankMutation } from "./useBanks.js";
import "./banks.css";

const TABS = ["captions", "hashtags", "ctas", "templates", "campaigns"];
const TABLES = { captions: "caption_bank", hashtags: "hashtag_sets", ctas: "cta_bank", campaigns: "campaigns", templates: "network_templates" };
const initialForm = { title: "", body: "", tags: "", platform: "", name: "", objective: "", text: "", start_date: "", end_date: "", template_key: "", width: "1080", height: "1920", max_caption: "2200", max_hashtags: "30", notes: "", color: "#5672E8" };

export default function BanksPage() {
  const { t } = useI18n();
  const brand = useOutletContext();
  const [tab, setTab] = useState("captions");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const { data, isPending, isError, refetch } = useBankData(brand.id);
  const save = useBankMutation(brand.id);
  const remove = useBankDelete(brand.id);
  const rows = data?.[TABLES[tab]] ?? [];
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event) {
    event.preventDefault(); setError("");
    let values;
    if (tab === "captions") values = { title: form.title.trim(), body: form.body.trim(), tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean), platform: form.platform || null };
    if (tab === "hashtags") values = { name: form.name.trim(), tags: form.tags.split(/[\s,]+/).map((tag) => tag.startsWith("#") ? tag : `#${tag}`).filter((tag) => tag.length > 1), platform: form.platform || null };
    if (tab === "ctas") values = { text: form.text.trim(), platform: form.platform || null };
    if (tab === "campaigns") values = { name: form.name.trim(), objective: form.objective.trim(), start_date: form.start_date || null, end_date: form.end_date || null, color: form.color, notes: form.notes.trim() };
    if (tab === "templates") values = { platform: form.platform, template_key: (form.template_key || form.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name: form.name.trim(), width: Number(form.width), height: Number(form.height), max_caption: Number(form.max_caption), max_hashtags: Number(form.max_hashtags), notes: form.notes.trim() };
    const schema = { captions: captionSchema, hashtags: hashtagSetSchema, ctas: ctaSchema, campaigns: campaignSchema, templates: templateSchema }[tab];
    const parsed = schema.safeParse(values);
    if (!parsed.success) { setError(t("banks.invalid")); return; }
    try {
      await save.mutateAsync({ table: TABLES[tab], values: parsed.data });
      setForm(initialForm);
    } catch (cause) { setError(cause.message || t("banks.error")); }
  }

  async function copyTemplate(template) {
    try { await save.mutateAsync({ table: "network_templates", values: { ...template, id: undefined, brand_id: brand.id } }); }
    catch (cause) { setError(cause.message || t("banks.error")); }
  }

  const tabNames = { captions: t("banks.tab.captions"), hashtags: t("banks.tab.hashtags"), ctas: t("banks.tab.ctas"), templates: t("banks.tab.templates"), campaigns: t("banks.tab.campaigns") };
  return <section className="banks">
    <header><p className="label-caps">{t("banks.label")}</p><h2>{t("banks.title")}</h2><p>{t("banks.lead")}</p></header>
    <nav className="banks__tabs" aria-label={t("banks.tabs.label")}>{TABS.map((key) => <button key={key} className={tab === key ? "is-active" : ""} onClick={() => { setTab(key); setError(""); }}>{tabNames[key]}</button>)}</nav>
    {error && <p className="banks__error" role="alert">{error}</p>}
    <Section
      eyebrow={t("banks.label")}
      title={t("banks.section.create")}
      description={t("banks.section.create.hint")}
    >
    {tab !== "templates" && <form className="banks__form" onSubmit={submit}>
      <h3>{t(`banks.form.${tab}`)}</h3>
      {(tab === "captions" || tab === "ctas") && <label>{t(tab === "captions" ? "banks.titleField" : "banks.ctaField")}<input required maxLength={tab === "captions" ? 120 : 300} value={tab === "captions" ? form.title : form.text} onChange={(event) => change(tab === "captions" ? "title" : "text", event.target.value)} /></label>}
      {tab === "captions" && <label>{t("banks.captionBody")}<textarea required maxLength={2200} value={form.body} onChange={(event) => change("body", event.target.value)} /></label>}
      {tab === "captions" && <label>{t("banks.tags")}<input value={form.tags} onChange={(event) => change("tags", event.target.value)} placeholder={t("banks.tags.placeholder")} /></label>}
      {tab === "hashtags" && <><label>{t("banks.name")}<input required value={form.name} onChange={(event) => change("name", event.target.value)} /></label><label>{t("banks.tags")}<input required value={form.tags} onChange={(event) => change("tags", event.target.value)} placeholder={t("banks.tags.hashtags")} /></label></>}
      {tab === "campaigns" && <><label>{t("banks.name")}<input required value={form.name} onChange={(event) => change("name", event.target.value)} /></label><label>{t("banks.objective")}<textarea value={form.objective} onChange={(event) => change("objective", event.target.value)} /></label><div className="banks__date-row"><label>{t("banks.start")}<input type="date" value={form.start_date} onChange={(event) => change("start_date", event.target.value)} /></label><label>{t("banks.end")}<input type="date" value={form.end_date} onChange={(event) => change("end_date", event.target.value)} /></label><label>{t("banks.color")}<input type="color" value={form.color} onChange={(event) => change("color", event.target.value)} /></label></div><label>{t("banks.notes")}<textarea value={form.notes} onChange={(event) => change("notes", event.target.value)} /></label></>}
      {(tab === "captions" || tab === "hashtags" || tab === "ctas") && <label>{t("banks.platform")}<select value={form.platform} onChange={(event) => change("platform", event.target.value)}><option value="">{t("banks.platform.any")}</option><option value="instagram">Instagram</option><option value="tiktok">TikTok</option></select></label>}
      <button className="btn btn--primary" disabled={save.isPending}>{t("banks.save")}</button>
    </form>}
    {tab === "templates" && <form className="banks__form" onSubmit={submit}><h3>{t("banks.form.templates")}</h3><label>{t("banks.platform")}<select required value={form.platform} onChange={(event) => change("platform", event.target.value)}><option value="">{t("banks.platform.choose")}</option><option value="instagram">Instagram</option><option value="tiktok">TikTok</option></select></label><label>{t("banks.name")}<input required value={form.name} onChange={(event) => change("name", event.target.value)} /></label><div className="banks__date-row">{[["width","banks.width"],["height","banks.height"],["max_caption","banks.maxCaption"],["max_hashtags","banks.maxHashtags"]].map(([key,label]) => <label key={key}>{t(label)}<input type="number" min="1" value={form[key]} onChange={(event) => change(key,event.target.value)} /></label>)}</div><label>{t("banks.notes")}<textarea value={form.notes} onChange={(event) => change("notes",event.target.value)} /></label><button className="btn btn--primary" disabled={save.isPending}>{t("banks.save")}</button></form>}
    </Section>
    <Section
      eyebrow={t("banks.label")}
      title={t("banks.section.list")}
      description={t("banks.section.list.hint")}
      defaultOpen
    >
    {isPending ? <p className="state">{t("state.loading")}</p> : isError ? <div className="state" role="alert"><p>{t("state.error")}</p><button className="btn btn--ghost" onClick={() => refetch()}>{t("state.retry")}</button></div> : <div className="banks__list">
      {rows.length === 0 && <p className="banks__empty">{t("banks.empty")}</p>}
      {rows.map((row) => <article className="banks__item" key={row.id}>
        {tab === "captions" && <><header><h3>{row.title}</h3><span>{row.platform || t("banks.platform.any")}</span></header><p>{row.body}</p><div className="banks__tags">{row.tags?.map((tag) => <span key={tag}>#{tag.replace(/^#/, "")}</span>)}</div><select aria-label={t("banks.status")} value={row.status} onChange={(event) => save.mutate({ table: TABLES[tab], id: row.id, values: { status: event.target.value } })}><option value="borrador">{t("banks.status.draft")}</option><option value="aprobado">{t("banks.status.approved")}</option><option value="retirado">{t("banks.status.retired")}</option></select></>}
        {tab === "hashtags" && <><header><h3>{row.name}</h3><span>{row.platform || t("banks.platform.any")}</span></header><p>{row.tags.join(" ")}</p><select aria-label={t("banks.status")} value={row.status} onChange={(event) => save.mutate({ table: TABLES[tab], id: row.id, values: { status: event.target.value } })}><option value="borrador">{t("banks.status.draft")}</option><option value="aprobado">{t("banks.status.approved")}</option><option value="retirado">{t("banks.status.retired")}</option></select></>}
        {tab === "ctas" && <><p>{row.text}</p><span>{row.platform || t("banks.platform.any")}</span><select aria-label={t("banks.status")} value={row.status} onChange={(event) => save.mutate({ table: TABLES[tab], id: row.id, values: { status: event.target.value } })}><option value="borrador">{t("banks.status.draft")}</option><option value="aprobado">{t("banks.status.approved")}</option><option value="retirado">{t("banks.status.retired")}</option></select></>}
        {tab === "campaigns" && <><header><h3><span className="banks__swatch" style={{ background: row.color }} />{row.name}</h3><select aria-label={t("banks.campaignStatus")} value={row.status} onChange={(event) => save.mutate({ table: TABLES[tab], id: row.id, values: { status: event.target.value } })}><option value="planeada">{t("banks.campaign.planned")}</option><option value="activa">{t("banks.campaign.active")}</option><option value="finalizada">{t("banks.campaign.finished")}</option></select></header><p>{row.objective}</p><p>{row.start_date || "—"} → {row.end_date || "—"}</p>{row.notes && <p>{row.notes}</p>}</>}
        {tab === "templates" && <><header><h3>{row.name}</h3><span>{row.platform === "instagram" ? "Instagram" : "TikTok"}{row.brand_id ? " · " + t("banks.template.custom") : " · " + t("banks.template.global")}</span></header><p>{row.width} × {row.height} px · {t("banks.maxCaption")}: {row.max_caption} · #{row.max_hashtags}</p>{row.notes && <p>{row.notes}</p>}{!row.brand_id && <button className="btn btn--ghost" onClick={() => void copyTemplate(row)}>{t("banks.template.copy")}</button>}</>}
        {row.status && tab !== "campaigns" && <span className="banks__status">{t(`banks.status.${row.status === "borrador" ? "draft" : row.status === "aprobado" ? "approved" : "retired"}`)}</span>}
        {tab !== "templates" || row.brand_id ? <button className="banks__delete" onClick={async () => { if (confirm(t("banks.delete.confirm", { name: row.name || row.title || row.text }))) { try { await remove.mutateAsync({ table: TABLES[tab], id: row.id }); } catch (cause) { setError(cause.message || t("banks.error")); } } }}>{t("banks.delete")}</button> : null}
      </article>)}
    </div>}
    </Section>
  </section>;
}
