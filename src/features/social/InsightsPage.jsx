import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { es as dateFnsEs } from "date-fns/locale";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { useOutletContext } from "react-router-dom";
import { useI18n } from "../../i18n/index.jsx";
import Section from "../../components/Section.jsx";
import { dailyMetricsSchema, postMetricsSchema, socialAccountSchema } from "../../lib/schemas.js";
import { useSocial, useSocialMutation, useDeleteSocialAccount } from "./useSocial.js";
import "./insights.css";

const ZONE = "America/Bogota";
const EMPTY_ACCOUNT = { platform: "instagram", handle: "", display_name: "" };
const EMPTY_DAILY = { account_id: "", date: format(new Date(), "yyyy-MM-dd"), followers: "", following: "", posts_count: "", reach: "", profile_views: "", views: "" };
const EMPTY_POST = { social_account_id: "", content_item_id: "", published: "", views: "", likes: "", comments: "", shares: "", saves: "", reach: "" };

export default function InsightsPage() {
  const { t } = useI18n(); const brand = useOutletContext();
  const { data, isPending, isError, refetch } = useSocial(brand.id);
  const save = useSocialMutation(brand.id); const remove = useDeleteSocialAccount(brand.id);
  const [accountForm, setAccountForm] = useState(EMPTY_ACCOUNT); const [dailyForm, setDailyForm] = useState(EMPTY_DAILY); const [postForm, setPostForm] = useState(EMPTY_POST);
  const [error, setError] = useState(""); const [range, setRange] = useState(30);
  const accounts = data?.accounts ?? []; const daily = data?.daily ?? []; const posts = data?.posts ?? []; const items = data?.items ?? [];
  const setForm = (setter) => (key, value) => setter((form) => ({ ...form, [key]: value }));
  const accountChange = setForm(setAccountForm), dailyChange = setForm(setDailyForm), postChange = setForm(setPostForm);
  const since = format(subDays(new Date(), range - 1), "yyyy-MM-dd");
  const filtered = daily.filter((row) => row.metric_date >= since);
  const latest = accounts.map((account) => ({ account, point: [...daily].filter((row) => row.account_id === account.id).sort((a,b) => b.metric_date.localeCompare(a.metric_date))[0] })).filter((entry) => entry.point);
  const totals = { followers: latest.reduce((sum, entry) => sum + entry.point.followers, 0), reach: filtered.reduce((sum, entry) => sum + entry.reach, 0), views: filtered.reduce((sum, entry) => sum + entry.views, 0), posts: posts.filter((post) => post.published_at && formatInTimeZone(new Date(post.published_at), ZONE, "yyyy-MM-dd") >= since).length };
  const chart = useMemo(() => filtered.slice(-14), [filtered]);
  const peak = Math.max(1, ...chart.map((row) => row.reach));
  const hours = {};
  for (const post of posts) if (post.published_at && post.reach > 0) {
    const hour = Number(formatInTimeZone(new Date(post.published_at), ZONE, "H"));
    const value = (post.likes + post.comments + post.shares + post.saves) / post.reach;
    (hours[hour] ??= []).push(value);
  }
  const bestHour = Object.entries(hours).map(([hour, values]) => ({ hour: Number(hour), score: values.reduce((sum, value) => sum + value, 0) / values.length, count: values.length })).sort((a,b) => b.score - a.score)[0];

  async function submitAccount(event) { event.preventDefault(); setError(""); const parsed = socialAccountSchema.safeParse(accountForm); if (!parsed.success) { setError(t("insights.validation")); return; } try { await save.mutateAsync({ table: "social_accounts", values: parsed.data }); setAccountForm(EMPTY_ACCOUNT); } catch (cause) { setError(cause.message || t("insights.error")); } }
  async function submitDaily(event) { event.preventDefault(); setError(""); try { const numeric = Object.fromEntries(Object.entries(dailyForm).filter(([key]) => !["account_id","date"].includes(key)).map(([key,value]) => [key, Number(value || 0)])); const parsed = dailyMetricsSchema.safeParse({ ...numeric, account_id: dailyForm.account_id, metric_date: dailyForm.date }); if (!parsed.success) { setError(t("insights.validation")); return; } await save.mutateAsync({ table: "account_metrics_daily", upsert: true, values: parsed.data }); setDailyForm({ ...EMPTY_DAILY, account_id: dailyForm.account_id, date: format(new Date(),"yyyy-MM-dd") }); } catch (cause) { setError(cause.message || t("insights.error")); } }
  async function submitPost(event) { event.preventDefault(); setError(""); try { const numeric = Object.fromEntries(Object.entries(postForm).filter(([key]) => !["social_account_id","content_item_id","published"].includes(key)).map(([key,value]) => [key, Number(value || 0)])); const parsed = postMetricsSchema.safeParse({ ...numeric, social_account_id: postForm.social_account_id, content_item_id: postForm.content_item_id || null, published_at: postForm.published ? fromZonedTime(postForm.published,ZONE).toISOString() : null }); if (!parsed.success) { setError(t("insights.validation")); return; } await save.mutateAsync({ table: "post_metrics_snapshots", values: parsed.data }); setPostForm({ ...EMPTY_POST, social_account_id: postForm.social_account_id }); } catch (cause) { setError(cause.message || t("insights.error")); } }

  if (isPending) return <p className="state">{t("state.loading")}</p>;
  if (isError) return <div className="state" role="alert"><p>{t("state.error")}</p><button className="btn btn--ghost" onClick={() => refetch()}>{t("state.retry")}</button></div>;

  return <section className="insights">
    <header className="insights__head"><div><p className="label-caps">{t("insights.label")}</p><h2>{t("insights.title")}</h2><p>{t("insights.lead")}</p></div><div className="insights__actions"><select aria-label={t("insights.range")} value={range} onChange={(event) => setRange(Number(event.target.value))}><option value="7">{t("insights.range7")}</option><option value="30">{t("insights.range30")}</option><option value="90">{t("insights.range90")}</option></select><button className="btn btn--ghost" onClick={() => window.print()}>{t("insights.print")}</button></div></header>
    {error && <p className="insights__error" role="alert">{error}</p>}
    <div className="insights__kpis">{[["followers",totals.followers],["reach",totals.reach],["views",totals.views],["posts",totals.posts]].map(([key,value]) => <article key={key}><span>{t(`insights.metric.${key}`)}</span><strong>{Intl.NumberFormat("es-CO").format(value)}</strong></article>)}</div>
    <Section
      eyebrow={t("insights.label")}
      title={t("insights.section.performance")}
      description={t("insights.section.performance.hint")}
      defaultOpen
    >
    <section className="insights__panel"><header><h3>{t("insights.performance")}</h3><span>{t("insights.lastDays", { days: range })}</span></header>{chart.length ? <div className="insights__chart" role="img" aria-label={t("insights.chartLabel")}>{chart.map((row) => <div className="insights__bar-wrap" key={`${row.account_id}-${row.metric_date}`} title={`${row.metric_date}: ${row.reach}`}><div className="insights__bar" style={{ height: `${Math.max(4, row.reach / peak * 100)}%` }} /><small>{format(new Date(`${row.metric_date}T12:00:00`), "d MMM", { locale: dateFnsEs })}</small></div>)}</div> : <p className="insights__empty">{t("insights.noMetrics")}</p>}</section>
    <section className="insights__panel"><header><h3>{t("insights.bestTime")}</h3></header>{bestHour ? <p>{t("insights.bestTime.result", { hour: String(bestHour.hour).padStart(2,"0"), count: bestHour.count, score: (bestHour.score * 100).toFixed(1) })}</p> : <p className="insights__empty">{t("insights.bestTime.empty")}</p>}</section>
    </Section>

    <Section
      eyebrow={t("insights.label")}
      title={t("insights.section.accounts")}
      description={t("insights.section.accounts.hint")}
    >
    <section className="insights__section"><h3>{t("insights.accounts")}</h3><div className="insights__accounts">{accounts.map((account) => <article key={account.id}><strong>{account.platform === "instagram" ? "Instagram" : "TikTok"} · @{account.handle}</strong><span>{account.display_name || t("insights.account.demo")}</span><button className="insights__delete" onClick={async () => { try { await remove.mutateAsync(account.id); } catch (cause) { setError(cause.message || t("insights.error")); } }}>{t("insights.account.delete")}</button></article>)}</div>
      <form className="insights__form" onSubmit={submitAccount}><h4>{t("insights.account.add")}</h4><label>{t("insights.platform")}<select value={accountForm.platform} onChange={(event) => accountChange("platform", event.target.value)}><option value="instagram">Instagram</option><option value="tiktok">TikTok</option></select></label><label>{t("insights.handle")}<input required maxLength={120} value={accountForm.handle} onChange={(event) => accountChange("handle",event.target.value.replace(/^@/,""))} /></label><label>{t("insights.displayName")}<input value={accountForm.display_name} onChange={(event) => accountChange("display_name",event.target.value)} /></label><button className="btn btn--primary" disabled={save.isPending}>{t("insights.account.createDemo")}</button></form>
    </section>
    </Section>

    <Section
      eyebrow={t("insights.label")}
      title={t("insights.section.register")}
      description={t("insights.section.register.hint")}
    >
    <div className="insights__forms"><form className="insights__form" onSubmit={submitDaily}><h3>{t("insights.addDaily")}</h3><label>{t("insights.account.select")}<select required value={dailyForm.account_id} onChange={(event) => dailyChange("account_id",event.target.value)}><option value="">—</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.platform} · @{account.handle}</option>)}</select></label><label>{t("insights.date")}<input type="date" required value={dailyForm.date} onChange={(event) => dailyChange("date",event.target.value)} /></label>{["followers","following","posts_count","reach","profile_views","views"].map((key) => <label key={key}>{t(`insights.metric.${key}`)}<input type="number" min="0" required value={dailyForm[key]} onChange={(event) => dailyChange(key,event.target.value)} /></label>)}<button className="btn btn--primary" disabled={save.isPending}>{t("insights.saveMetrics")}</button></form>
      <form className="insights__form" onSubmit={submitPost}><h3>{t("insights.addPost")}</h3><label>{t("insights.account.select")}<select required value={postForm.social_account_id} onChange={(event) => postChange("social_account_id",event.target.value)}><option value="">—</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.platform} · @{account.handle}</option>)}</select></label><label>{t("insights.linkPiece")}<select value={postForm.content_item_id} onChange={(event) => postChange("content_item_id",event.target.value)}><option value="">—</option>{items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>{t("insights.publishedAt")}<input type="datetime-local" value={postForm.published} onChange={(event) => postChange("published",event.target.value)} /></label>{["views","likes","comments","shares","saves","reach"].map((key) => <label key={key}>{t(`insights.postMetric.${key}`)}<input type="number" min="0" required value={postForm[key]} onChange={(event) => postChange(key,event.target.value)} /></label>)}<button className="btn btn--primary" disabled={save.isPending}>{t("insights.savePost")}</button></form></div>
    </Section>
    <p className="insights__note">{t("insights.demoNote")}</p>
  </section>;
}
