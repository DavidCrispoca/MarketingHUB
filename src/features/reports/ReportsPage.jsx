import { useEffect, useMemo, useRef, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { useOutletContext } from "react-router-dom";
import { formatInTimeZone } from "date-fns-tz";
import Section from "../../components/Section.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import {
  buildMonthlyReport,
  currentMonthKey,
  dayLabel,
  formatNumber,
  formatPercent,
  formatShare,
  monthLabel,
  PLATFORM_COLOR,
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

function Delta({ value, label }) {
  if (value === null || value === undefined) return <small>{label ? `${label} · ` : ""}sin mes anterior</small>;
  return (
    <small className={value >= 0 ? "is-up" : "is-down"}>
      {formatPercent(value)} {label}
    </small>
  );
}

function NetworkKpis({ network }) {
  return (
    <div className="reports__kpis">
      <article>
        <span>{network.label} · visualizaciones</span>
        <strong>{formatNumber(network.views)}</strong>
        <Delta value={network.delta?.views} label="vs. mes anterior" />
      </article>
      <article>
        <span>Alcance</span>
        <strong>{formatNumber(network.reach)}</strong>
        <Delta value={network.delta?.reach} label="vs. mes anterior" />
      </article>
      <article>
        <span>Interacciones</span>
        <strong>{formatNumber(network.interactions)}</strong>
        <Delta value={network.delta?.interactions} label="vs. mes anterior" />
      </article>
      <article>
        <span>Seguidores nuevos</span>
        <strong>+{formatNumber(network.followersGained)}</strong>
        <small>
          {formatNumber(network.followersLost)} perdidos · cierre {formatNumber(network.followers)}
        </small>
      </article>
      <article>
        <span>Visitas al perfil</span>
        <strong>{formatNumber(network.profileViews)}</strong>
        <Delta value={network.delta?.profileViews} label="vs. mes anterior" />
      </article>
      <article>
        <span>Clics al enlace</span>
        <strong>{formatNumber(network.linkClicks)}</strong>
        <small>{formatNumber(network.posts)} publicaciones</small>
      </article>
    </div>
  );
}

function PostsTable({ posts }) {
  const { t } = useI18n();
  if (!posts.length) return <p className="reports__empty">{t("reports.topPosts.empty")}</p>;
  return (
    <div className="reports__table" role="table" aria-label={t("reports.topPosts")}>
      <div className="reports__table-head" role="row">
        <span role="columnheader">{t("reports.table.date")}</span>
        <span role="columnheader">{t("reports.table.network")}</span>
        <span role="columnheader">{t("reports.table.type")}</span>
        <span role="columnheader">{t("reports.table.caption")}</span>
        <span role="columnheader">{t("reports.table.views")}</span>
        <span role="columnheader">{t("reports.table.interactions")}</span>
        <span role="columnheader">{t("reports.table.rate")}</span>
      </div>
      {posts.map((post) => (
        <div className="reports__table-row" role="row" key={`${post.platform}-${post.id}`}>
          <span role="cell">{dayLabel(post.day)}</span>
          <span role="cell">
            <span
              className="reports__badge"
              style={{ "--network-color": PLATFORM_COLOR[post.platform] ?? "var(--color-primary)" }}
            >
              {post.platform === "instagram" ? "IG" : "TT"}
            </span>
          </span>
          <span role="cell" className="reports__type">{post.type}</span>
          <span role="cell" className="reports__caption">{post.caption || t("reports.table.noCaption")}</span>
          <span role="cell">{formatNumber(post.views)}</span>
          <span role="cell">{formatNumber(post.interactions)}</span>
          <span role="cell">{formatPercent(post.engagementRate)}</span>
        </div>
      ))}
    </div>
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
    for (const row of data.insights) set.add(String(row.period_start).slice(0, 7));
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
      const document = (
        <MonthlyReportPdf report={{ ...target, notes: text, preparedBy: grant?.holder_name ?? "" }} />
      );
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
              source: target.isDemo ? "demo" : "connected",
              month: target.monthKey,
              networks: target.networks.map((network) => network.platform),
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

  const { instagram, tiktok, instagramDaily } = report;
  const peak = instagramDaily.length
    ? Math.max(...instagramDaily.map((row) => Number(row.followers) || 0))
    : 0;
  const floor = instagramDaily.length
    ? Math.min(...instagramDaily.map((row) => Number(row.followers) || 0))
    : 0;

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
            disabled={Boolean(busyMonth) || !report.networks.length}
            onClick={() => generate()}
          >
            {busyMonth ? t("reports.generating") : t("reports.download")}
          </button>
        </div>
      </header>

      {report.isDemo ? (
        <p className="reports__demo" title={t("reports.demo.title")}>
          {t("reports.demo")}
        </p>
      ) : null}

      {error ? <p className="reports__error" role="alert">{error}</p> : null}
      {notice ? <p className="reports__notice" role="status">{notice}</p> : null}

      <div className="reports__networks">
        {report.networks.map((network) => (
          <article
            className="reports__network"
            key={network.platform}
            style={{ "--network-color": PLATFORM_COLOR[network.platform] ?? "var(--color-primary)" }}
          >
            <header>
              <span className="reports__badge">{network.label}</span>
              <span>@{network.handle}</span>
            </header>
            <div className="reports__network-followers">
              <strong>{formatNumber(network.followers)}</strong>
              <span>{t("reports.kpi.followers")}</span>
            </div>
            <Delta value={network.delta?.followers} label={t("reports.vsPrevious")} />
            <ul>
              <li>
                <span>{t("reports.kpi.gained")}</span>
                <strong>+{formatNumber(network.followersGained)}</strong>
              </li>
              <li>
                <span>{t("reports.kpi.views")}</span>
                <strong>{formatNumber(network.views)}</strong>
              </li>
              <li>
                <span>{t("reports.kpi.interactions")}</span>
                <strong>{formatNumber(network.interactions)}</strong>
              </li>
            </ul>
            {network.platform === "instagram" && instagramDaily.length > 1 ? (
              <Sparkline rows={instagramDaily} color="var(--network-color)" />
            ) : null}
          </article>
        ))}

        <article className="reports__network reports__network--total">
          <header>
            <span className="reports__badge">{t("reports.total")}</span>
            <span>{capitalize(monthLabel(activeMonth))}</span>
          </header>
          <div className="reports__network-followers">
            <strong>{formatNumber(report.totalViews)}</strong>
            <span>{t("reports.kpi.views")}</span>
          </div>
          <ul>
            <li>
              <span>{t("reports.total.followers")}</span>
              <strong>+{formatNumber(report.totalFollowersGained)}</strong>
            </li>
            <li>
              <span>{t("reports.kpi.interactions")}</span>
              <strong>{formatNumber(report.totalInteractions)}</strong>
            </li>
            <li>
              <span>{t("reports.kpi.posts")}</span>
              <strong>{formatNumber(report.totalPosts)}</strong>
            </li>
          </ul>
        </article>
      </div>

      {instagram ? (
        <Section
          eyebrow={t("reports.networkEyebrow")}
          title={t("reports.instagram.title")}
          description={t("reports.instagram.hint")}
        >
          <NetworkKpis network={instagram} />

          <div className="reports__grid">
            <section className="reports__panel">
              <header>
                <h3>{t("reports.evolution")}</h3>
                <span>
                  {formatNumber(instagram.previous?.followers)} → {formatNumber(instagram.followers)}
                </span>
              </header>
              {instagramDaily.length > 1 ? (
                <div
                  className="reports__chart"
                  role="img"
                  aria-label={t("reports.evolution.aria")}
                  style={{ "--report-accent": PLATFORM_COLOR.instagram }}
                >
                  {instagramDaily.map((row) => {
                    const span = peak - floor || 1;
                    const height = 18 + ((Number(row.followers) - floor) / span) * 82;
                    return (
                      <div
                        className="reports__chart-col"
                        key={row.metric_date}
                        title={`${row.metric_date}: ${row.followers}`}
                      >
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
              </p>
            </section>

            <section className="reports__panel">
              <header>
                <h3>{t("reports.byType")}</h3>
                <span>{t("reports.byType.hint")}</span>
              </header>
              {instagram.byType.length ? (
                <ul className="reports__bars">
                  {instagram.byType.map((row) => {
                    const max = Math.max(...instagram.byType.map((item) => item.interactions), 1);
                    return (
                      <li key={row.label}>
                        <span>{row.label} · {row.count}</span>
                        <div className="reports__bar-track">
                          <div
                            className="reports__bar-fill"
                            style={{ width: `${Math.max(2, (row.interactions / max) * 100)}%` }}
                          />
                        </div>
                        <strong>{formatNumber(row.interactions)}</strong>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="reports__empty">{t("reports.byType.empty")}</p>
              )}
            </section>
          </div>

          <section className="reports__panel">
            <header>
              <h3>{t("reports.demography")}</h3>
              <span>{t("reports.demography.hint")}</span>
            </header>
            <div className="reports__demography">
              <div>
                <span>{t("reports.demography.gender")}</span>
                <strong>
                  {formatShare(instagram.audience?.female)} / {formatShare(instagram.audience?.male)}
                </strong>
                <small>{t("reports.demography.genderHint")}</small>
              </div>
              <div>
                <span>{t("reports.demography.local")}</span>
                <strong>{formatShare(instagram.audience?.local)}</strong>
                <small>{instagram.audience?.country ?? "Colombia"}</small>
              </div>
              <div className="reports__demography-ages">
                <span>{t("reports.demography.ages")}</span>
                {(instagram.audience?.ages ?? []).map((row) => (
                  <div key={row.label}>
                    <small>{row.label}</small>
                    <div className="reports__bar-track">
                      <div className="reports__bar-fill" style={{ width: `${row.share * 100}%` }} />
                    </div>
                    <strong>{formatShare(row.share)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Section>
      ) : null}

      {tiktok ? (
        <Section
          eyebrow={t("reports.networkEyebrow")}
          title={t("reports.tiktok.title")}
          description={t("reports.tiktok.hint")}
        >
          <NetworkKpis network={tiktok} />

          <div className="reports__grid">
            <section className="reports__panel">
              <header>
                <h3>{t("reports.tiktok.traffic")}</h3>
                <span>{formatShare(tiktok.traffic?.for_you)}</span>
              </header>
              <ul className="reports__source-list">
                {[
                  ["for_you", t("reports.tiktok.forYou")],
                  ["profile", t("reports.tiktok.profile")],
                  ["search", t("reports.tiktok.search")],
                ].map(([key, label]) => (
                  <li key={key}>
                    <span>{label}</span>
                    <div className="reports__bar-track">
                      <div className="reports__bar-fill" style={{ width: `${(tiktok.traffic?.[key] ?? 0) * 100}%` }} />
                    </div>
                    <strong>{formatShare(tiktok.traffic?.[key])}</strong>
                  </li>
                ))}
              </ul>
            </section>

            <section className="reports__panel">
              <header>
                <h3>{t("reports.tiktok.hours")}</h3>
                <span>{t("reports.tiktok.hours.hint")}</span>
              </header>
              {tiktok.bestHours.length ? (
                <ul className="reports__chips">
                  {tiktok.bestHours.map((hour) => <li key={hour}>{hour}</li>)}
                </ul>
              ) : (
                <p className="reports__empty">{t("reports.tiktok.hours.empty")}</p>
              )}
            </section>
          </div>

          <section className="reports__panel">
            <header>
              <h3>{t("reports.tiktok.searches")}</h3>
              <span>{t("reports.tiktok.searches.hint")}</span>
            </header>
            {tiktok.topSearches.length ? (
              <ul className="reports__chips">
                {tiktok.topSearches.map((term) => <li key={term}>“{term}”</li>)}
              </ul>
            ) : (
              <p className="reports__empty">{t("reports.tiktok.searches.empty")}</p>
            )}
          </section>
        </Section>
      ) : null}

      <Section
        eyebrow={t("reports.contentEyebrow")}
        title={t("reports.topPosts")}
        description={t("reports.topPosts.hint")}
      >
        <PostsTable posts={report.topPosts} />
      </Section>

      <Section
        eyebrow={t("reports.activityEyebrow")}
        title={t("reports.activity")}
        description={t("reports.activity.hint")}
      >
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
              <span key={campaign.id} style={{ "--campaign-color": campaign.color || "var(--color-primary)" }}>
                {campaign.name}
              </span>
            ))}
          </div>
        ) : null}
      </Section>

      <Section
        eyebrow={t("reports.notesEyebrow")}
        title={t("reports.notes")}
        description={t("reports.notes.hint")}
      >
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
            disabled={Boolean(busyMonth) || !report.networks.length}
            onClick={() => generate()}
          >
            {busyMonth ? t("reports.generating") : t("reports.downloadWithNotes")}
          </button>
        </div>
      </Section>

      <Section
        eyebrow={t("reports.historyEyebrow")}
        title={t("reports.history")}
        description={t("reports.history.hint")}
      >
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
      </Section>
    </section>
  );
}
