import { useEffect, useMemo, useState } from "react";
import { addDays, addMonths, addWeeks, addYears, endOfMonth, format, getDay, isSameMonth, isToday, startOfMonth, subMonths } from "date-fns";
import { es as dateFnsEs } from "date-fns/locale";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { useI18n } from "../../i18n/index.jsx";
import { contentSchema, reminderSchema } from "../../lib/schemas.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useAddContentComment, useCreateContent, useDeleteContent, useDeleteReminder, usePlanner, useSaveReminder, useTransitionContent, useUpdateContent } from "./usePlanner.js";
import "./planner.css";

const ZONE = "America/Bogota";
const EMPTY_ROWS = [];
const STATUSES = ["idea", "borrador", "programado"];
const NEXT_STATUS = { idea: ["borrador"], borrador: ["idea", "programado"], programado: ["borrador", "publicado"], publicado: [] };
const EMPTY_CONTENT = { title: "", caption: "", notes: "", scheduled: "", campaign_id: "", platforms: [], assets: [], templates: {}, caption_bank_id: "", hashtag_set_id: "", cta_id: "" };
const EMPTY_REMINDER = { title: "", notes: "", date: "", kind: "tarea", repeat_rule: "none", content_item_id: "", campaign_id: "", asset_id: "" };

const utcValue = (value) => value ? fromZonedTime(value, ZONE).toISOString() : null;

export default function PlannerPage() {
  const { t } = useI18n(); const brand = useOutletContext(); const { grant } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isPending, isError, refetch } = usePlanner(brand.id);
  const createContent = useCreateContent(brand.id); const transition = useTransitionContent(brand.id);
  const updateContent = useUpdateContent(brand.id); const deleteContent = useDeleteContent(brand.id);
  const addComment = useAddContentComment(brand.id);
  const saveReminder = useSaveReminder(brand.id); const deleteReminder = useDeleteReminder(brand.id);
  const [view, setView] = useState("board"); const [contentForm, setContentForm] = useState(EMPTY_CONTENT);
  const [reminderForm, setReminderForm] = useState(EMPTY_REMINDER); const [month, setMonth] = useState(startOfMonth(new Date()));
  const [error, setError] = useState(""); const [dragItem, setDragItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [contentFormOpen, setContentFormOpen] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(typeof Notification !== "undefined" && Notification.permission === "granted");
  const items = data?.items ?? EMPTY_ROWS; const assets = data?.assets ?? EMPTY_ROWS; const campaigns = data?.campaigns ?? EMPTY_ROWS; const reminders = data?.reminders ?? EMPTY_ROWS;
  const targets = data?.targets ?? []; const links = data?.links ?? [];
  const selectedHashtags = (data?.hashtags ?? []).find((row) => row.id === contentForm.hashtag_set_id);
  const selectedCta = (data?.ctas ?? []).find((row) => row.id === contentForm.cta_id);
  const captionPreview = [contentForm.caption.trim(), selectedHashtags?.tags.join(" "), selectedCta?.text].filter(Boolean).join("\n\n");
  const days = useMemo(() => { const first = startOfMonth(month); const offset = (getDay(first) + 6) % 7; const count = Math.ceil((offset + endOfMonth(month).getDate()) / 7) * 7; return Array.from({ length: count }, (_, index) => addDays(first, index - offset)); }, [month]);
  useEffect(() => {
    if (!notificationsEnabled || view !== "reminders" || typeof Notification === "undefined") return undefined;
    const check = () => {
      const now = Date.now();
      for (const reminder of reminders) {
        const due = new Date(reminder.remind_at).getTime(); const key = `${reminder.id}:${reminder.remind_at}`;
        if (!reminder.done && due <= now && due > now - 60_000 && !localStorage.getItem(`mhub-reminder-${key}`)) {
          new Notification(reminder.title, { body: reminder.notes || t("planner.reminderNotification") });
          localStorage.setItem(`mhub-reminder-${key}`, "1");
        }
      }
    };
    check(); const timer = window.setInterval(check, 30_000); return () => window.clearInterval(timer);
  }, [notificationsEnabled, view, reminders, t]);
  useEffect(() => {
    if (contentFormOpen && editingId) document.querySelector(".planner__form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [contentFormOpen, editingId]);
  useEffect(() => {
    if (searchParams.get("crear") !== "1") return;
    setEditingId(null);
    setContentFormOpen(true);
    setSearchParams((current) => { const next = new URLSearchParams(current); next.delete("crear"); return next; }, { replace: true });
  }, [searchParams, setSearchParams]);
  const itemPlatforms = (id) => targets.filter((target) => target.content_item_id === id).map((target) => target.platform);
  const itemAssets = (id) => links.filter((link) => link.content_item_id === id).map((link) => assets.find((asset) => asset.id === link.asset_id)).filter(Boolean);
  const changeContent = (key, value) => setContentForm((form) => ({ ...form, [key]: value }));
  const changeReminder = (key, value) => setReminderForm((form) => ({ ...form, [key]: value }));

  async function createPiece(event) {
    event.preventDefault(); setError("");
    try {
      const item = { title: contentForm.title.trim(), caption: captionPreview, notes: contentForm.notes, scheduled_at: utcValue(contentForm.scheduled), campaign_id: contentForm.campaign_id || null };
      const parsed = contentSchema.safeParse(item);
      if (!parsed.success) { setError(t("planner.validation")); return; }
      if (editingId) { await updateContent.mutateAsync({ id: editingId, ...parsed.data }); setEditingId(null); }
      else await createContent.mutateAsync({ item: parsed.data, platforms: contentForm.platforms.map((platform) => ({ platform, template_id: contentForm.templates[platform] || null })), assetIds: contentForm.assets });
      setContentForm(EMPTY_CONTENT);
      setContentFormOpen(false);
    } catch (cause) { setError(cause.message || t("planner.error")); }
  }

  async function createReminder(event) {
    event.preventDefault(); setError("");
    try {
      const values = { title: reminderForm.title.trim(), notes: reminderForm.notes.trim(), remind_at: utcValue(reminderForm.date), kind: reminderForm.kind, repeat_rule: reminderForm.repeat_rule, content_item_id: reminderForm.content_item_id || null, campaign_id: reminderForm.campaign_id || null, asset_id: reminderForm.asset_id || null };
      const parsed = reminderSchema.safeParse(values);
      if (!parsed.success) { setError(t("planner.validation")); return; }
      await saveReminder.mutateAsync(parsed.data);
      setReminderForm(EMPTY_REMINDER);
    } catch (cause) { setError(cause.message || t("planner.error")); }
  }

  async function moveItem(item, status) {
    if (!status || status === item.status) return;
    setError("");
    try { await transition.mutateAsync({ itemId: item.id, status }); }
    catch { setError(t("planner.transitionError")); }
  }

  function editItem(item) {
    setEditingId(item.id);
    setContentFormOpen(true);
    setContentForm({ ...EMPTY_CONTENT, title: item.title, caption: item.caption, notes: item.notes, scheduled: item.scheduled_at ? formatInTimeZone(new Date(item.scheduled_at), ZONE, "yyyy-MM-dd'T'HH:mm") : "", campaign_id: item.campaign_id || "" });
  }

  async function sendContentComment(event, itemId) {
    event.preventDefault(); const body = commentDrafts[itemId]?.trim(); if (!body) return;
    try { await addComment.mutateAsync({ content_item_id: itemId, author_name: grant?.holder_name || "Equipo", body }); setCommentDrafts((drafts) => ({ ...drafts, [itemId]: "" })); }
    catch (cause) { setError(cause.message || t("planner.error")); }
  }

  async function completeReminder(reminder) {
    let values = { id: reminder.id, done: !reminder.done };
    if (!reminder.done && reminder.repeat_rule !== "none") {
      const date = new Date(reminder.remind_at);
      const next = reminder.repeat_rule === "weekly" ? addWeeks(date, 1) : reminder.repeat_rule === "monthly" ? addMonths(date, 1) : addYears(date, 1);
      values = { id: reminder.id, done: false, remind_at: next.toISOString() };
    }
    try { await saveReminder.mutateAsync(values); } catch (cause) { setError(cause.message || t("planner.error")); }
  }

  function itemCard(item) {
    const photos = itemAssets(item.id); const linkedCampaign = campaigns.find((campaign) => campaign.id === item.campaign_id);
    const comments = (data?.comments ?? []).filter((comment) => comment.content_item_id === item.id);
    return <article className={`planner__card is-${item.status}`} key={item.id} draggable onDragStart={() => setDragItem(item)} onDragEnd={() => setDragItem(null)}>
      <header className="planner__card-head">
        <span className="planner__card-status">{t(`planner.status.${item.status}`)}</span>
        {item.scheduled_at && <time>{formatInTimeZone(new Date(item.scheduled_at), ZONE, "d MMM · HH:mm")}</time>}
      </header>
      <h4 className="planner__card-title">{item.title}</h4>
      {(item.caption || item.notes) && <p className="planner__card-copy">{item.caption || item.notes}</p>}
      {linkedCampaign && <span className="planner__campaign" style={{ borderColor: linkedCampaign.color }}>{linkedCampaign.name}</span>}
      <div className="planner__meta">{itemPlatforms(item.id).map((platform) => <span key={platform}>{platform === "instagram" ? "Instagram" : "TikTok"}</span>)}{photos.map((asset) => <span key={asset.id}>{asset.name}</span>)}</div>
      <label>{t("planner.changeStatus")}<select value={item.status} onChange={(event) => void moveItem(item, event.target.value)}>{[item.status, ...NEXT_STATUS[item.status]].map((value) => <option key={value} value={value}>{t(`planner.status.${value}`)}</option>)}</select></label>
      <details className="planner__comments"><summary>{t("planner.comments", { count: comments.length })}</summary>
        {comments.map((comment) => <div className="planner__comment" key={comment.id}><strong>{comment.author_name}</strong><p>{comment.body}</p></div>)}
        <form onSubmit={(event) => void sendContentComment(event,item.id)}><textarea aria-label={t("planner.writeComment")} maxLength={4000} value={commentDrafts[item.id] ?? ""} onChange={(event) => setCommentDrafts((drafts) => ({ ...drafts, [item.id]: event.target.value }))} /><button type="submit" disabled={addComment.isPending}>{t("planner.sendComment")}</button></form>
      </details>
      <footer><button onClick={() => editItem(item)}>{t("planner.edit")}</button><button className="planner__delete" onClick={async () => { if (confirm(t("planner.deletePiece.confirm", { name: item.title }))) { try { await deleteContent.mutateAsync(item.id); } catch (cause) { setError(cause.message || t("planner.error")); } } }}>{t("planner.deletePiece")}</button></footer>
    </article>;
  }

  const nav = <nav className="planner__views" aria-label={t("planner.views")}>
    {[["board", "planner.view.board"], ["calendar", "planner.view.calendar"], ["reminders", "planner.view.reminders"]].map(([key, label]) => <button key={key} className={view === key ? "is-active" : ""} onClick={() => setView(key)}>{t(label)}</button>)}
  </nav>;

  // The board keeps only the three working stages. Everything already published
  // is still reachable, but collapsed in its own list so it stops taking space.
  const published = items.filter((item) => item.status === "publicado");
  const board = <>
    <div className="planner__board">
      {STATUSES.map((status) => {
        const columnItems = items.filter((item) => item.status === status);
        return <section className={`planner__column is-${status}`} key={status} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragItem) void moveItem(dragItem, status); setDragItem(null); }}>
          <header className="planner__column-head">
            <h3>{t(`planner.status.${status}`)}<span>{columnItems.length}</span></h3>
            <p>{t(`planner.column.${status}.hint`)}</p>
          </header>
          {columnItems.length ? columnItems.map(itemCard) : <p className="planner__column-empty">{t("planner.column.empty")}</p>}
        </section>;
      })}
    </div>
    {published.length ? <details className="planner__published">
      <summary>{t("planner.published", { count: published.length })}</summary>
      <p className="planner__published-hint">{t("planner.published.hint")}</p>
      <ul>{published.map((item) => <li key={item.id}>
        <div><strong>{item.title}</strong><span>{item.scheduled_at ? formatInTimeZone(new Date(item.scheduled_at), ZONE, "d MMM yyyy · HH:mm") : t("planner.published.noDate")}</span></div>
        {item.published_url ? <a href={item.published_url} target="_blank" rel="noreferrer">{t("planner.published.open")}</a> : null}
      </li>)}</ul>
    </details> : null}
  </>;

  return <section className="planner">
    <header className="planner__head"><div><p className="label-caps">{t("planner.label")}</p><h2>{t("planner.title")}</h2><p>{t("planner.lead")}</p></div><div className="planner__head-actions">{nav}<button className="btn btn--primary" type="button" aria-expanded={contentFormOpen} aria-controls={contentFormOpen ? "planner-content-form" : undefined} onClick={() => { setContentFormOpen((open) => !open); if (contentFormOpen) { setEditingId(null); setContentForm(EMPTY_CONTENT); } }}>{t("planner.addPiece")}</button></div></header>
    {error && <p className="planner__error" role="alert">{error}</p>}
    {contentFormOpen && <form id="planner-content-form" className="planner__form" onSubmit={createPiece}>
      <div className="planner__form-heading"><h3>{t(editingId ? "planner.editPiece" : "planner.newPiece")}</h3>{editingId && <button type="button" className="planner__cancel-edit" onClick={() => { setEditingId(null); setContentForm(EMPTY_CONTENT); setContentFormOpen(false); }}>{t("planner.cancelEdit")}</button>}</div>
      <label>{t("planner.pieceTitle")}<input required maxLength={180} value={contentForm.title} onChange={(event) => changeContent("title", event.target.value)} /></label>

      {!editingId && <section className="planner__form-group planner__form-group--wide"><h4>{t("planner.savedContent")}</h4>
        <div className="planner__saved-picks">
          <div><p>{t("planner.captionBank")}</p>{(data?.captions ?? []).map((caption) => <button className={`planner__saved-pick${contentForm.caption_bank_id === caption.id ? " is-selected" : ""}`} type="button" aria-pressed={contentForm.caption_bank_id === caption.id} key={caption.id} onClick={() => setContentForm((form) => ({ ...form, caption_bank_id: form.caption_bank_id === caption.id ? "" : caption.id, caption: form.caption_bank_id === caption.id ? form.caption : caption.body }))}><strong>{caption.title}</strong><span>{caption.body}</span></button>)}{!data?.captions?.length && <small>{t("planner.savedEmpty")}</small>}</div>
          <div><p>{t("planner.hashtagSet")}</p><div className="planner__tag-picks">{(data?.hashtags ?? []).map((row) => <button className={`planner__tag-pick${contentForm.hashtag_set_id === row.id ? " is-selected" : ""}`} type="button" aria-pressed={contentForm.hashtag_set_id === row.id} key={row.id} onClick={() => changeContent("hashtag_set_id", contentForm.hashtag_set_id === row.id ? "" : row.id)}><strong>{row.name}</strong><span>{row.tags.slice(0, 6).join(" ")}</span></button>)}{!data?.hashtags?.length && <small>{t("planner.savedEmpty")}</small>}</div></div>
          <div><p>{t("planner.cta")}</p><div className="planner__tag-picks">{(data?.ctas ?? []).map((row) => <button className={`planner__tag-pick${contentForm.cta_id === row.id ? " is-selected" : ""}`} type="button" aria-pressed={contentForm.cta_id === row.id} key={row.id} onClick={() => changeContent("cta_id", contentForm.cta_id === row.id ? "" : row.id)}><span>{row.text}</span></button>)}{!data?.ctas?.length && <small>{t("planner.savedEmpty")}</small>}</div></div>
        </div>
      </section>}

      <label className="planner__caption-field">{t("planner.caption")}<textarea maxLength={2200} value={contentForm.caption} onChange={(event) => changeContent("caption", event.target.value)} /></label>
      {!editingId && <div className="planner__caption-preview planner__form-group--wide"><h4>{t("planner.captionPreview")}</h4><p>{captionPreview || t("planner.captionPreviewEmpty")}</p></div>}

      <section className="planner__form-group"><h4>{t("planner.publishDetails")}</h4>
        <div className="planner__row"><label>{t("planner.scheduled")}<input type="datetime-local" value={contentForm.scheduled} onChange={(event) => changeContent("scheduled", event.target.value)} /></label><label>{t("planner.campaign")}<select value={contentForm.campaign_id} onChange={(event) => changeContent("campaign_id", event.target.value)}><option value="">{t("planner.noCampaign")}</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label></div>
        {!editingId && <><fieldset><legend>{t("planner.platforms")}</legend>{["instagram","tiktok"].map((platform) => <label className="planner__check" key={platform}><input type="checkbox" checked={contentForm.platforms.includes(platform)} onChange={(event) => changeContent("platforms", event.target.checked ? [...contentForm.platforms, platform] : contentForm.platforms.filter((value) => value !== platform))} />{platform === "instagram" ? "Instagram" : "TikTok"}</label>)}</fieldset>
        <div className="planner__row">{contentForm.platforms.map((platform) => <label key={platform}>{t("planner.templateFor", { platform: platform === "instagram" ? "Instagram" : "TikTok" })}<select value={contentForm.templates[platform] ?? ""} onChange={(event) => changeContent("templates", { ...contentForm.templates, [platform]: event.target.value })}><option value="">{t("planner.noTemplate")}</option>{(data?.templates ?? []).filter((template) => template.platform === platform).map((template) => <option key={template.id} value={template.id}>{template.name} · {template.width}×{template.height}</option>)}</select></label>)}</div></>}
      </section>

      {!editingId && <section className="planner__form-group planner__form-group--wide"><h4>{t("planner.assets")}</h4><div className="planner__asset-picker">
        {assets.map((asset) => <label className={`planner__asset-choice${contentForm.assets.includes(asset.id) ? " is-selected" : ""}`} key={asset.id}>
          <input type="checkbox" checked={contentForm.assets.includes(asset.id)} onChange={(event) => changeContent("assets", event.target.checked ? [...contentForm.assets, asset.id] : contentForm.assets.filter((id) => id !== asset.id))} />
          {asset.preview_url ? <img src={asset.preview_url} alt="" loading="lazy" /> : <span aria-hidden="true">{asset.mime_type.startsWith("video/") ? "▶" : "▧"}</span>}
          <span className="planner__asset-name">{asset.name}</span>
        </label>)}
        {!assets.length && <Link className="planner__asset-empty" to={`/m/${brand.slug}/medios`}>{t("planner.noAssets")}</Link>}
        <Link className="planner__asset-add" to={`/m/${brand.slug}/medios`}>＋ {t("planner.addAssets")}</Link>
      </div></section>}

      <label className="planner__form-group planner__notes-field">{t("planner.notes")}<textarea value={contentForm.notes} onChange={(event) => changeContent("notes", event.target.value)} /></label>
      <div className="planner__form-submit planner__form-group--wide"><button className="btn btn--primary" disabled={createContent.isPending || updateContent.isPending}>{t(editingId ? "planner.saveEdit" : "planner.create")}</button></div>
    </form>}

    {isPending ? <p className="state">{t("state.loading")}</p> : isError ? <div className="state" role="alert"><p>{t("state.error")}</p><button className="btn btn--ghost" onClick={() => refetch()}>{t("state.retry")}</button></div> : view === "board" ? board : view === "calendar" ? <section className="planner__calendar">
      <header><button className="btn btn--ghost" onClick={() => setMonth(subMonths(month,1))}>{t("planner.previousMonth")}</button><h3>{format(month,"MMMM yyyy",{ locale: dateFnsEs })}</h3><button className="btn btn--ghost" onClick={() => setMonth(addMonths(month,1))}>{t("planner.nextMonth")}</button></header>
      <div className="planner__calendar-grid">{["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map((day) => <strong key={day}>{t(`planner.weekday.${day}`)}</strong>)}{days.map((day) => <div className={`planner__day${isSameMonth(day,month) ? "" : " is-outside"}${isToday(day) ? " is-today" : ""}`} key={day.toISOString()}><b>{format(day,"d")}</b>{items.filter((item) => item.scheduled_at && formatInTimeZone(new Date(item.scheduled_at), ZONE,"yyyy-MM-dd") === format(day,"yyyy-MM-dd")).map((item) => <span key={item.id} title={item.title}>{item.title}</span>)}</div>)}</div>
    </section> : <div className="planner__reminders">
      <div className="planner__notification"><p>{t("planner.notificationNote")}</p><button className="btn btn--ghost" onClick={async () => { if (typeof Notification === "undefined") { setError(t("planner.notificationUnavailable")); return; } const result = await Notification.requestPermission(); setNotificationsEnabled(result === "granted"); }}>{t(notificationsEnabled ? "planner.notificationsEnabled" : "planner.enableNotifications")}</button></div>
      <form className="planner__form" onSubmit={createReminder}><h3>{t("planner.newReminder")}</h3><label>{t("planner.reminderTitle")}<input required maxLength={180} value={reminderForm.title} onChange={(event) => changeReminder("title",event.target.value)} /></label><label>{t("planner.notes")}<textarea value={reminderForm.notes} onChange={(event) => changeReminder("notes",event.target.value)} /></label><div className="planner__row"><label>{t("planner.remindAt")}<input type="datetime-local" required value={reminderForm.date} onChange={(event) => changeReminder("date",event.target.value)} /></label><label>{t("planner.reminderKind")}<select value={reminderForm.kind} onChange={(event) => changeReminder("kind",event.target.value)}><option value="tarea">{t("planner.kind.task")}</option><option value="fecha_clave">{t("planner.kind.date")}</option><option value="licencia">{t("planner.kind.license")}</option></select></label><label>{t("planner.repeat")}<select value={reminderForm.repeat_rule} onChange={(event) => changeReminder("repeat_rule",event.target.value)}>{["none","weekly","monthly","yearly"].map((rule) => <option key={rule} value={rule}>{t(`planner.repeat.${rule}`)}</option>)}</select></label></div><div className="planner__row"><label>{t("planner.linkCampaign")}<select value={reminderForm.campaign_id} onChange={(event) => changeReminder("campaign_id",event.target.value)}><option value="">—</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label><label>{t("planner.linkPiece")}<select value={reminderForm.content_item_id} onChange={(event) => changeReminder("content_item_id",event.target.value)}><option value="">—</option>{items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>{t("planner.linkAsset")}<select value={reminderForm.asset_id} onChange={(event) => changeReminder("asset_id",event.target.value)}><option value="">—</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></label></div><button className="btn btn--primary" disabled={saveReminder.isPending}>{t("planner.createReminder")}</button></form>
      <div className="planner__reminder-list">{reminders.length === 0 && <p className="planner__empty">{t("planner.remindersEmpty")}</p>}{reminders.map((reminder) => <article className={`planner__reminder${reminder.done ? " is-done" : ""}`} key={reminder.id}><label><input type="checkbox" checked={reminder.done} onChange={() => void completeReminder(reminder)} /><span><strong>{reminder.title}</strong><time>{formatInTimeZone(new Date(reminder.remind_at), ZONE,"d MMM yyyy · HH:mm")}</time></span></label><p>{reminder.notes}</p><button className="planner__delete" onClick={async () => { try { await deleteReminder.mutateAsync(reminder.id); } catch (cause) { setError(cause.message || t("planner.error")); } }}>{t("planner.deleteReminder")}</button></article>)}</div>
    </div>}
    <p className="planner__footnote">{t("planner.timezone")}</p>
  </section>;
}
