import { useEffect, useMemo, useRef, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { useOutletContext } from "react-router-dom";
import { formatInTimeZone } from "date-fns-tz";
import { useI18n } from "../../i18n/index.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import {
  buildMonthlyReport,
  currentMonthKey,
  dayLabel,
  formatNumber,
  formatPercent,
  monthLabel,
  percentChange,
  shiftMonthKey,
  useReports,
  useSaveReport,
  ZONE,
} from "./useReports.js";
import MonthlyReportPdf from "./MonthlyReportPdf.jsx";
import "./reports.css";

const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

const KIND_LABEL = {
  campana: "Campaña",
  evento: "Evento",
  lanzamiento: "Lanzamiento",
  prensa: "Prensa",
  otro: "Otro",
};

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function Sparkline({ rows, color }) {
  const values = rows.map((row) => Number(row.followers) || 0);
  if (values.length < 2) return null;
  const width = 260;
  const height = 54;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - 4 - ((value - min) / span) * (height - 10);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className="reports__spark" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

export default function ReportsPage() {
  const { t } = useI18n();
  const brand = useOutletContext();
  const { grant } = useAuth();
  const { data, isPending, isError, refetch } = useReports(brand.id);
  const saveReport = useSaveReport(brand.id);
  const [month, setMonth] = useState("");
  const [notes, setNotes] = useState("");
  const [busyMonth, setBusyMonth] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const notesMonthRef = useRef(null);

  const months = useMemo(() => {
    if (!data) return [];
    const set = new Set();
    for (const row of data.daily) set.add(row.metric_date.slice(0, 7));
    for (const post of data.posts) {
      if (post.published_at) {
        set.add(formatInTimeZone(new Date(post.published_at), ZONE, "yyyy-MM"));
      }
    }
    for (const report of data.reports) set.add(report.period_start.slice(0, 7));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [data]);

  const defaultMonth = useMemo(() => {
    const previous = shiftMonthKey(currentMonthKey(), -1);
    return months.includes(previous) ? previous : (months[0] ?? currentMonthKey());
  }, [months]);

  const activeMonth = month || defaultMonth;
  const report = useMemo(
    () => (data ? buildMonthlyReport(data, brand, activeMonth) : null),
    [data, brand, activeMonth],
  );

  // Load the saved notes once per selected period, so a refetch after saving
  // does not overwrite what the person is writing.
  useEffect(() => {
    if (!data || notesMonthRef.current === activeMonth) return;
    notesMonthRef.current = activeMonth;
    const saved = data.reports.find((row) => row.period_start.slice(0, 7) === activeMonth);
    setNotes(saved?.notes ?? "");
  }, [activeMonth, data]);

  async function generate({ report: target = report, notes: text = notes } = {}) {
    if (!target) return;
    setBusyMonth(target.monthKey);
    setError("");
    setNotice("");
    try {
      const document = <MonthlyReportPdf report={{ ...target, notes: text }} />;
      const blob = await pdf(document).toBlob();
      download(blob, `reporte-${brand.slug}-${target.monthKey}.pdf`);

      const existing = data.reports.find(
        (row) => row.period_start.slice(0, 7) === target.monthKey,
      );
      try {
        await saveReport.mutateAsync({
          id: existing?.id,
          values: {
            title: `${t("reports.history.titlePrefix")} ${capitalize(monthLabel(target.monthKey))}`,
            period_start: target.period.start,
            period_end: target.period.end,
            generated_by: grant?.holder_name ?? "",
            notes: text,
            config: {
              source: data.accounts.find((row) => row.id === target.account?.id)?.status ?? "demo",
              month: target.monthKey,
            },
          },
        });
        setNotice(t("reports.saved"));
      } catch {
        setNotice(t("reports.savedDownloadOnly"));
      }
    } catch (cause) {
      setError(cause?.message || t("reports.error"));
    } finally {
      setBusyMonth("");
    }
  }

  if (isPending) return <p className="state" role="status">{t("state.loading")}</p>;
  if (isError) {
    return (
      <div className="state" role="alert">
        <p>{t("state.error")}</p>
        <button className="btn btn--ghost" type="button" onClick={() => refetch()}>
          {t("state.retry")}
        </button>
      </div>
    );
  }

  const primary = report.palette.primary;
  const accent = report.palette.accent;
  const followersDelta = report.followersOpening ? report.net / report.followersOpening : null;
  const isDemo = data.accounts.some((account) => account.status === "demo");

  return (
    <section className="reports">
      <header className="reports__head">
        <div>
          <p className="label-caps">{t("reports.label")}</p>
          <h2>{t("reports.title")}</h2>
          <p>{t("reports.lead")}</p>
        </div>
        <div className="reports__actions">
          <label className="reports__month">
            <span>{t("reports.period")}</span>
            <select
              value={activeMonth}
              onChange={(event) => {
                setMonth(event.target.value);
                setError("");
                setNotice("");
              }}
            >
              {months.map((value) => (
                <option key={value} value={value}>
                  {capitalize(monthLabel(value))}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn btn--primary"
            type="button"
            disabled={Boolean(busyMonth) || !report.posts}
            onClick={() => generate()}
          >
            {busyMonth ? t("reports.generating") : t("reports.download")}
          </button>
        </div>
      </header>

      {isDemo ? (
        <p className="reports__demo" title={t("reports.demo.title")}>
          {t("reports.demo")}
        </p>
      ) : null}

      {error ? <p className="reports__error" role="alert">{error}</p> : null}
      {notice ? <p className="reports__notice" role="status">{notice}</p> : null}

      <section className="reports__hero" style={{ "--report-primary": primary, "--report-accent": accent }}>
        <div className="reports__hero-main">
          <span>{t("reports.kpi.followers")}</span>
          <strong>{formatNumber(report.followersClosing)}</strong>
          <small>
            {report.net >= 0 ? "+" : ""}
            {formatNumber(report.net)} {t("reports.kpi.netSuffix")} · {formatPercent(followersDelta)}
          </small>
          <Sparkline rows={report.daily} color={primary} />
        </div>
        <div className="reports__hero-rows">
          <div>
            <span>{t("reports.kpi.gained")}</span>
            <strong>{formatNumber(report.gained)}</strong>
          </div>
          <div>
            <span>{t("reports.kpi.lost")}</span>
            <strong>{formatNumber(report.lost)}</strong>
          </div>
          <div>
            <span>{t("reports.kpi.posts")}</span>
            <strong>{formatNumber(report.posts)}</strong>
          </div>
        </div>
      </section>

      <div className="reports__kpis">
        <article>
          <span>{t("reports.kpi.reach")}</span>
          <strong>{formatNumber(report.reach)}</strong>
          <small>
            {formatPercent(percentChange(report.reach, report.previous.reach))} {t("reports.vsPrevious")}
          </small>
        </article>
        <article>
          <span>{t("reports.kpi.views")}</span>
          <strong>{formatNumber(report.views)}</strong>
          <small>
            {formatPercent(percentChange(report.views, report.previous.views))} {t("reports.vsPrevious")}
          </small>
        </article>
        <article>
          <span>{t("reports.kpi.interactions")}</span>
          <strong>{formatNumber(report.interactions)}</strong>
          <small>
            {formatPercent(percentChange(report.interactions, report.previous.interactions))}{" "}
            {t("reports.vsPrevious")}
          </small>
        </article>
        <article>
          <span>{t("reports.kpi.profileViews")}</span>
          <strong>{formatNumber(report.profileViews)}</strong>
          <small>
            {formatPercent(percentChange(report.profileViews, report.previous.profileViews))}{" "}
            {t("reports.vsPrevious")}
          </small>
        </article>
      </div>

      <div className="reports__grid">
        <section className="reports__panel">
          <header>
            <h3>{t("reports.evolution")}</h3>
            <span>
              {formatNumber(report.followersOpening)} → {formatNumber(report.followersClosing)}
            </span>
          </header>
          {report.daily.length > 1 ? (
            <div
              className="reports__chart"
              role="img"
              aria-label={t("reports.evolution.aria")}
              style={{ "--report-accent": primary }}
            >
              {report.daily.map((row) => {
                const peak = Math.max(...report.daily.map((item) => Number(item.followers) || 0));
                const floor = Math.min(...report.daily.map((item) => Number(item.followers) || 0));
                const span = peak - floor || 1;
                const height = 18 + ((Number(row.followers) - floor) / span) * 82;
                return (
                  <div className="reports__chart-col" key={row.metric_date} title={`${row.metric_date}: ${row.followers}`}>
                    <div className="reports__chart-bar" style={{ height: `${height}%` }} />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="reports__empty">{t("reports.evolution.empty")}</p>
          )}
          <p className="reports__coverage">
            {t("reports.coverage", {
              start: dayLabel(report.coverage.start, { day: "numeric", month: "short" }),
              end: dayLabel(report.coverage.end, { day: "numeric", month: "short" }),
              days: report.coverage.days,
              total: report.period.days,
            })}
            {report.complete ? "" : ` ${t("reports.coverage.partial")}`}
          </p>
        </section>

        <section className="reports__panel">
          <header>
            <h3>{t("reports.activity")}</h3>
            <span>{report.events.length + report.campaigns.length}</span>
          </header>
          {report.events.length ? (
            <ul className="reports__events">
              {report.events.map((event) => (
                <li key={event.id}>
                  <time dateTime={event.event_date}>{dayLabel(event.event_date)}</time>
                  <div>
                    <strong>{event.title}</strong>
                    <span>{KIND_LABEL[event.kind] ?? event.kind}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="reports__empty">{t("reports.activity.empty")}</p>
          )}
          {report.campaigns.length ? (
            <div className="reports__campaigns">
              {report.campaigns.map((campaign) => (
                <span key={campaign.id} style={{ "--campaign-color": campaign.color || accent }}>
                  {campaign.name}
                </span>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <section className="reports__panel">
        <header>
          <h3>{t("reports.topPosts")}</h3>
          <span>{t("reports.topPosts.hint")}</span>
        </header>
        {report.topPosts.length ? (
          <div className="reports__table" role="table" aria-label={t("reports.topPosts")}>
            <div className="reports__table-head" role="row">
              <span role="columnheader">{t("reports.table.date")}</span>
              <span role="columnheader">{t("reports.table.type")}</span>
              <span role="columnheader">{t("reports.table.caption")}</span>
              <span role="columnheader">{t("reports.table.reach")}</span>
              <span role="columnheader">{t("reports.table.interactions")}</span>
              <span role="columnheader">{t("reports.table.rate")}</span>
            </div>
            {report.topPosts.map((post) => (
              <div className="reports__table-row" role="row" key={post.id}>
                <span role="cell">{dayLabel(post.day)}</span>
                <span role="cell" className="reports__type">
                  {post.media_product_type || post.media_type || "POST"}
                </span>
                <span role="cell" className="reports__caption">
                  {post.caption || t("reports.table.noCaption")}
                </span>
                <span role="cell">{formatNumber(post.reach)}</span>
                <span role="cell">{formatNumber(post.interactions)}</span>
                <span role="cell">{formatPercent(post.engagementRate)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="reports__empty">{t("reports.topPosts.empty")}</p>
        )}
      </section>

      <section className="reports__panel reports__notes">
        <header>
          <h3>{t("reports.notes")}</h3>
          <span>{t("reports.notes.hint")}</span>
        </header>
        <textarea
          rows={5}
          maxLength={4000}
          value={notes}
          placeholder={t("reports.notes.placeholder")}
          onChange={(event) => setNotes(event.target.value)}
        />
        <div className="reports__notes-actions">
          <span>{t("reports.notes.count", { count: notes.length })}</span>
          <button
            className="btn btn--ghost"
            type="button"
            disabled={Boolean(busyMonth) || !report.posts}
            onClick={() => generate()}
          >
            {busyMonth ? t("reports.generating") : t("reports.downloadWithNotes")}
          </button>
        </div>
      </section>

      <section className="reports__panel">
        <header>
          <h3>{t("reports.history")}</h3>
          <span>{t("reports.history.hint")}</span>
        </header>
        {data.reports.length ? (
          <ul className="reports__history">
            {data.reports.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{capitalize(monthLabel(item.period_start.slice(0, 7)))}</strong>
                  <span>
                    {dayLabel(item.period_start)} – {dayLabel(item.period_end)}
                    {item.generated_by ? ` · ${item.generated_by}` : ""}
                  </span>
                  {item.notes ? <p>{item.notes}</p> : null}
                </div>
                <button
                  className="btn btn--ghost"
                  type="button"
                  disabled={Boolean(busyMonth)}
                  onClick={() =>
                    generate({
                      report: buildMonthlyReport(data, brand, item.period_start.slice(0, 7)),
                      notes: item.notes,
                    })
                  }
                >
                  {busyMonth === item.period_start.slice(0, 7)
                    ? t("reports.generating")
                    : t("reports.history.download")}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="reports__empty">{t("reports.history.empty")}</p>
        )}
      </section>
    </section>
  );
}
