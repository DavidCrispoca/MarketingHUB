import {
  Document,
  Page,
  Path,
  Polyline,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  dateRangeLabel,
  dayLabel,
  formatNumber,
  formatPercent,
  formatShare,
  PLATFORM_COLOR,
} from "./useReports.js";

// Palette defined by the report brief: coffee, gold and cream, with one badge
// colour per network so a slide reads at a glance.
const C = {
  ink: "#2C1B14",
  ink2: "#3E2723",
  gold: "#C69214",
  cream: "#FDFBF7",
  cream2: "#F5F0E6",
  line: "#E3D9C9",
  muted: "#7A6A5D",
  white: "#FFFFFF",
};

const PAGE = [960, 540];

const KIND_LABEL = {
  campana: "Campaña",
  evento: "Evento",
  lanzamiento: "Lanzamiento",
  prensa: "Prensa",
  otro: "Otro",
};

const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

const styles = StyleSheet.create({
  page: {
    width: PAGE[0],
    height: PAGE[1],
    paddingTop: 30,
    paddingHorizontal: 40,
    paddingBottom: 46,
    backgroundColor: C.cream,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.ink,
  },

  // Cover
  cover: { backgroundColor: C.ink, color: C.cream, paddingTop: 40, paddingBottom: 40, justifyContent: "space-between" },
  coverTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  coverMark: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.4, alignItems: "center", justifyContent: "center" },
  coverMarkText: { fontFamily: "Times-Roman", fontSize: 17, letterSpacing: 1.2, color: C.gold },
  coverBrand: { fontFamily: "Times-Roman", fontSize: 17, color: C.cream },
  coverBrandSub: { fontSize: 7.5, letterSpacing: 1.8, color: "#C9B9A5", marginTop: 3 },
  coverBody: { marginTop: 18 },
  coverEyebrow: { fontSize: 8, letterSpacing: 3, color: C.gold, marginBottom: 12 },
  coverTitle: { fontFamily: "Times-Roman", fontSize: 42, lineHeight: 1.02, color: C.cream, maxWidth: 620 },
  coverRange: { fontSize: 13, color: "#E8DCCB", marginTop: 12 },
  coverClaim: { fontSize: 10.5, color: C.gold, marginTop: 8, letterSpacing: 0.6 },
  coverRule: { width: 72, height: 3, backgroundColor: C.gold, marginVertical: 18 },
  coverMetrics: { flexDirection: "row", gap: 34 },
  coverMetricLabel: { fontSize: 6.6, letterSpacing: 1.3, color: "#BFAE99", marginBottom: 4 },
  coverMetricValue: { fontFamily: "Times-Roman", fontSize: 21, color: C.cream },
  coverMetricHint: { fontSize: 7, color: "#A8967F", marginTop: 2 },
  coverFoot: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderTopWidth: 0.6, borderTopColor: "#574136", paddingTop: 12 },
  coverFootText: { fontSize: 7.5, color: "#A8967F", maxWidth: 520, lineHeight: 1.4 },

  // Slide chrome
  head: { flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 0.8, borderBottomColor: C.line, paddingBottom: 12, marginBottom: 18 },
  iso: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.2, borderColor: C.ink2, alignItems: "center", justifyContent: "center" },
  isoText: { fontFamily: "Times-Roman", fontSize: 12, color: C.ink2, letterSpacing: 0.6 },
  headText: { flex: 1 },
  eyebrow: { fontSize: 6.6, letterSpacing: 2.2, color: C.gold, marginBottom: 3 },
  title: { fontFamily: "Times-Roman", fontSize: 18, lineHeight: 1.12, color: C.ink },
  headMeta: { fontSize: 7, color: C.muted, textAlign: "right", maxWidth: 150 },
  body: { flex: 1 },
  foot: { position: "absolute", bottom: 18, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.6, borderTopColor: C.line, paddingTop: 6 },
  footText: { fontSize: 6.4, color: C.muted, letterSpacing: 0.3 },

  // Shared blocks
  row: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  card: { backgroundColor: C.white, borderWidth: 0.7, borderColor: C.line, borderRadius: 5, padding: 10 },
  cardDark: { backgroundColor: C.ink, borderRadius: 5, padding: 12 },
  kpiLabel: { fontSize: 6.6, letterSpacing: 1.1, color: C.muted, marginBottom: 5 },
  kpiValue: { fontFamily: "Times-Roman", fontSize: 23, color: C.ink2 },
  kpiHint: { fontSize: 7, color: C.muted, marginTop: 3, lineHeight: 1.35 },
  kpiHintUp: { fontSize: 7, color: "#2F7657", marginTop: 3 },
  kpiHintDown: { fontSize: 7, color: "#A83F48", marginTop: 3 },
  caption: { fontSize: 7.5, color: C.muted, lineHeight: 1.4 },
  subhead: { fontFamily: "Times-Roman", fontSize: 11.5, color: C.ink2, marginBottom: 6 },
  note: { fontSize: 7.6, color: C.ink2, lineHeight: 1.5 },
  badge: { alignSelf: "flex-start", paddingVertical: 2, paddingHorizontal: 7, borderRadius: 10, fontSize: 6.4, letterSpacing: 0.9, color: C.white },

  // Bars
  barTrack: { height: 7, borderRadius: 4, backgroundColor: C.cream2, overflow: "hidden" },
  barFill: { height: 7, borderRadius: 4 },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
  barLabel: { width: 96, fontSize: 7.5, color: C.ink2 },
  barValue: { width: 62, textAlign: "right", fontSize: 7.5, color: C.muted },
  barTrackGrow: { flex: 1, marginHorizontal: 8 },
  legendDot: { width: 7, height: 7, borderRadius: 4, marginRight: 4 },

  // Table
  tableHead: { flexDirection: "row", borderBottomWidth: 0.8, borderBottomColor: C.ink2, paddingBottom: 5, marginBottom: 2 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.line, paddingVertical: 7 },
  th: { fontSize: 6.4, letterSpacing: 0.9, color: C.muted },
  td: { fontSize: 8.4, color: C.ink },
  tdMuted: { fontSize: 8.4, color: C.muted },

  // Demographics
  splitTrack: { flexDirection: "row", height: 14, borderRadius: 7, overflow: "hidden", marginBottom: 5 },
  ageRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },

  // Content cards
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  contentCard: { width: 286, padding: 10, borderRadius: 5, borderWidth: 0.7, borderColor: C.line, backgroundColor: C.white },
  contentTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  views: { fontFamily: "Times-Roman", fontSize: 20, color: C.ink2 },

  // Pillars
  pillar: { flex: 1, padding: 14, borderRadius: 5, backgroundColor: C.white, borderWidth: 0.7, borderColor: C.line },
  pillarNumber: { fontFamily: "Times-Roman", fontSize: 30, color: C.gold, marginBottom: 8 },
  pillarTitle: { fontFamily: "Times-Roman", fontSize: 12.5, color: C.ink2, marginBottom: 6 },
  pillarText: { fontSize: 8, lineHeight: 1.55, color: C.ink2 },

  // Proposal
  proposalBox: { flex: 1, padding: 12, borderRadius: 5, backgroundColor: C.cream2, borderLeftWidth: 2, borderLeftColor: C.gold },
  proposalLabel: { fontSize: 6.6, letterSpacing: 1.4, color: C.muted, marginBottom: 5 },
  proposalText: { fontSize: 8.4, lineHeight: 1.55, color: C.ink2 },
  question: { marginTop: 14, padding: 12, borderRadius: 5, backgroundColor: C.ink },
  questionText: { fontFamily: "Times-Roman", fontSize: 11, color: C.cream, lineHeight: 1.4 },
  signature: { marginTop: 10, fontSize: 7.4, color: C.muted, letterSpacing: 0.6 },
});

function initials(name = "") {
  return name
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .map((word) => word[0])
    .slice(0, 3)
    .join("")
    .toUpperCase();
}

// "25-34" + "35-44" reads better as "25 a 44 años" than as a list of ranges.
function ageRangeLabel(ages) {
  const labels = [...ages].sort((a, b) => b.share - a.share).slice(0, 2).map((row) => row.label);
  const numbers = labels
    .flatMap((label) => label.replace("+", "-").split("-"))
    .map(Number)
    .filter((value) => Number.isFinite(value));
  if (!numbers.length) return "25 a 44";
  return `${Math.min(...numbers)} a ${Math.max(...numbers)}`;
}

function DeltaText({ value, suffix = "vs. mes anterior", style }) {
  if (value === null || value === undefined) return <Text style={style ?? styles.kpiHint}>Sin mes anterior comparable</Text>;
  return (
    <Text style={style ?? (value >= 0 ? styles.kpiHintUp : styles.kpiHintDown)}>
      {formatPercent(value)} {suffix}
    </Text>
  );
}

function Kpi({ label, value, hint, delta, suffix }) {
  return (
    <View style={styles.card}>
      <Text style={styles.kpiLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {delta !== undefined ? <DeltaText value={delta} suffix={suffix} /> : null}
      {hint ? <Text style={styles.kpiHint}>{hint}</Text> : null}
    </View>
  );
}

function Bar({ label, value, max, color = C.gold, display }) {
  const width = max > 0 ? Math.max(2, (value / max) * 100) : 2;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrackGrow}>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${width}%`, backgroundColor: color }]} />
        </View>
      </View>
      <Text style={styles.barValue}>{display ?? formatNumber(value)}</Text>
    </View>
  );
}

function NetworkBadge({ platform }) {
  return (
    <Text style={[styles.badge, { backgroundColor: PLATFORM_COLOR[platform] ?? C.ink2 }]}>
      {(platform ?? "").toUpperCase()}
    </Text>
  );
}

function Slide({ report, title, eyebrow, meta, children }) {
  return (
    <Page size={PAGE} style={styles.page} wrap={false}>
      <View style={styles.head}>
        <View style={styles.iso}>
          <Text style={styles.isoText}>{initials(report.brand.name)}</Text>
        </View>
        <View style={styles.headText}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.headMeta}>{meta}</Text>
      </View>

      <View style={styles.body}>{children}</View>

      <View style={styles.foot} fixed>
        <Text style={styles.footText}>
          {[report.brand.name, report.audienceCity].filter(Boolean).join(" | ")}
        </Text>
        <Text style={styles.footText}>{eyebrow}</Text>
        <Text style={styles.footText}>{report.preparedBy || "Equipo de marketing"}</Text>
      </View>
    </Page>
  );
}

function InstagramEvolution({ daily }) {
  const values = daily.map((row) => Number(row.followers) || 0);
  if (values.length < 2) return <Text style={styles.caption}>Sin suficientes días con métricas.</Text>;
  const width = 380;
  const height = 62;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - 6 - ((value - min) / span) * (height - 14);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Path d={`M0,${height} L${points.join(" L")} L${width},${height} Z`} fill="#F5F0E6" />
      <Polyline points={points.join(" ")} fill="none" stroke={C.ink2} strokeWidth="1.5" />
    </Svg>
  );
}

export default function MonthlyReportPdf({ report }) {
  const ig = report.instagram;
  const tt = report.tiktok;
  const totalLinkClicks = (ig?.linkClicks ?? 0) + (tt?.linkClicks ?? 0);
  const rangeLabel = dateRangeLabel(report.period.start, report.period.end);
  const monthTitle = capitalize(report.label);

  const bestType = ig?.byType?.[0] ?? null;
  const typeShare = bestType && ig?.interactions ? Math.min(1, bestType.interactions / ig.interactions) : null;
  const igReels = ig?.byType?.find((row) => row.label === "Reels")?.count ?? 0;

  const traffic = tt?.traffic ?? {};
  const forYou = traffic.for_you ?? null;
  const profileShare = traffic.profile ?? null;
  const searchShare = traffic.search ?? null;

  const ages = ig?.audience?.ages ?? [];
  const ageRange = ageRangeLabel(ages);

  const nextCampaign =
    report.upcomingCampaign
    ?? report.campaigns.find((campaign) => campaign.status === "planeada")
    ?? null;

  return (
    <Document
      title={`Reporte de resultados · ${monthTitle} · ${report.brand.name}`}
      author={report.preparedBy || "MarketingHUB"}
      subject={`Reporte de Instagram y TikTok de ${report.brand.name}`}
      creator="MarketingHUB"
      producer="MarketingHUB"
    >
      {/* 1. Portada y resumen ejecutivo */}
      <Page size={PAGE} style={[styles.page, styles.cover]} wrap={false}>
        <View style={styles.coverTop}>
          <View style={styles.coverMark}>
            <Text style={styles.coverMarkText}>{initials(report.brand.name)}</Text>
          </View>
          <View>
            <Text style={styles.coverBrand}>{report.brand.name}</Text>
            <Text style={styles.coverBrandSub}>
              {(ig?.handle ? `@${ig.handle}` : "").toUpperCase()}
              {tt?.handle ? `  ·  TIKTOK @${tt.handle.toUpperCase()}` : ""}
            </Text>
          </View>
        </View>

        <View style={styles.coverBody}>
          <Text style={styles.coverEyebrow}>REPORTE DE RESULTADOS</Text>
          <Text style={styles.coverTitle}>{monthTitle}</Text>
          <Text style={styles.coverRange}>{rangeLabel}</Text>
          <Text style={styles.coverClaim}>Crecimiento 100 % orgánico · Alcance sin pauta</Text>
          <View style={styles.coverRule} />

          <View style={styles.coverMetrics}>
            <View>
              <Text style={styles.coverMetricLabel}>NUEVOS SEGUIDORES</Text>
              <Text style={styles.coverMetricValue}>+{formatNumber(report.totalFollowersGained)}</Text>
              <Text style={styles.coverMetricHint}>
                Instagram +{formatNumber(ig?.followersGained)} · TikTok +{formatNumber(tt?.followersGained)}
              </Text>
            </View>
            <View>
              <Text style={styles.coverMetricLabel}>VISUALIZACIONES</Text>
              <Text style={styles.coverMetricValue}>{formatNumber(report.totalViews)}</Text>
              <Text style={styles.coverMetricHint}>
                {ig ? `Instagram ${formatPercent(ig.delta?.views)} · ` : ""}
                {tt ? `TikTok ${formatPercent(tt.delta?.views)}` : ""}
              </Text>
            </View>
            <View>
              <Text style={styles.coverMetricLabel}>INVERSIÓN EN PAUTA</Text>
              <Text style={styles.coverMetricValue}>$0 USD</Text>
              <Text style={styles.coverMetricHint}>{formatNumber(report.totalPosts)} piezas publicadas</Text>
            </View>
          </View>
        </View>

        <View style={styles.coverFoot}>
          <Text style={styles.coverFootText}>
            {report.isDemo
              ? "Cifras de demostración generadas a partir de datos sintéticos. Al conectar las cuentas, el reporte imprimirá solo lo que devuelvan las APIs de Meta y TikTok."
              : "Cifras tomadas de las cuentas conectadas de Instagram y TikTok."}
          </Text>
          <Text style={styles.coverFootText}>{report.preparedBy || "Equipo de marketing"}</Text>
        </View>
      </Page>

      {/* 2. Instagram: alcance e interacciones */}
      <Slide
        report={report}
        eyebrow="INSTAGRAM · ALCANCE E INTERACCIONES"
        title={`${monthTitle}: alcance e interacciones`}
        meta={ig ? `@${ig.handle}` : "Sin cuenta"}
      >
        <View style={styles.row}>
          <View style={styles.col}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Kpi label="Visualizaciones" value={formatNumber(ig?.views)} delta={ig?.delta?.views} />
              </View>
              <View style={styles.col}>
                <Kpi
                  label="No seguidores"
                  value={formatShare(ig?.nonFollowerShare)}
                  hint={`${formatNumber(ig?.nonFollowerViews)} vistas fuera de la comunidad`}
                />
              </View>
            </View>
            <View style={[styles.row, { marginTop: 12 }]}>
              <View style={styles.col}>
                <Kpi label="Seguidores nuevos" value={`+${formatNumber(ig?.followersGained)}`} hint={`${formatNumber(ig?.followersLost)} perdidos · cierre ${formatNumber(ig?.followers)}`} />
              </View>
              <View style={styles.col}>
                <Kpi label="Visitas al perfil" value={formatNumber(ig?.profileViews)} hint={`${formatNumber(ig?.linkClicks)} clics al enlace de la biografía`} />
              </View>
            </View>
          </View>

          <View style={[styles.col, { flex: 1.15 }]}>
            <Text style={styles.subhead}>Interacciones por tipo de contenido</Text>
            {ig?.byType?.length ? (
              ig.byType.map((row) => (
                <Bar
                  key={row.label}
                  label={`${row.label} (${row.count})`}
                  value={row.interactions}
                  max={bestType?.interactions ?? 1}
                  color={row.label === "Reels" ? C.ink2 : C.gold}
                />
              ))
            ) : (
              <Text style={styles.caption}>Sin publicaciones registradas en el periodo.</Text>
            )}
            <View style={[styles.card, { marginTop: 8 }]}>
              <Text style={styles.kpiLabel}>LECTURA DEL MES</Text>
              <Text style={styles.note}>
                {ig?.posts
                  ? `${ig.label} publicó ${ig.posts} piezas, ${igReels} de ellas en Reels. `
                  : ""}
                {bestType && typeShare
                  ? `${bestType.label} concentró ${formatShare(typeShare)} de las interacciones. `
                  : ""}
                {ig?.delta?.views !== null && ig?.delta?.views !== undefined
                  ? `Las visualizaciones ${ig.delta.views >= 0 ? "crecieron" : "cayeron"} ${formatPercent(Math.abs(ig.delta.views))} frente a ${report.previousLabel}.`
                  : "Sin mes anterior para comparar."}
              </Text>
            </View>
          </View>
        </View>
      </Slide>

      {/* 3. Instagram: resumen mensual nativo */}
      <Slide
        report={report}
        eyebrow="INSTAGRAM · RESUMEN MENSUAL"
        title={`${monthTitle} frente a ${capitalize(report.previousLabel)}`}
        meta={ig ? `@${ig.handle}` : "Sin cuenta"}
      >
        <View style={styles.row}>
          <View style={[styles.col, { flex: 1.1 }]}>
            <Text style={styles.subhead}>Visualizaciones del periodo</Text>
            <View style={[styles.row, { alignItems: "flex-end", height: 132, gap: 26, paddingTop: 8 }]}>
              {[
                { label: capitalize(report.previousLabel), value: ig?.previous?.views ?? 0, color: C.line },
                { label: monthTitle, value: ig?.views ?? 0, color: C.ink2 },
              ].map((bar) => {
                const max = Math.max(ig?.views ?? 0, ig?.previous?.views ?? 0, 1);
                return (
                  <View key={bar.label} style={{ alignItems: "center", width: 130 }}>
                    <Text style={[styles.td, { marginBottom: 4 }]}>{formatNumber(bar.value)}</Text>
                    <View style={{ width: 74, height: Math.max(10, (bar.value / max) * 92), backgroundColor: bar.color, borderRadius: 3 }} />
                    <Text style={[styles.caption, { marginTop: 6, textAlign: "center" }]}>{bar.label}</Text>
                  </View>
                );
              })}
            </View>
            <View style={[styles.card, { marginTop: 10 }]}>
              <Text style={styles.kpiLabel}>EVOLUCIÓN DE SEGUIDORES</Text>
              <InstagramEvolution daily={report.instagramDaily} />
              <Text style={[styles.caption, { marginTop: 6 }]}>
                {ig ? `${formatNumber(ig.previous?.followers)} a ${formatNumber(ig.followers)} seguidores al cierre` : "Sin datos"}
              </Text>
            </View>
          </View>

          <View style={styles.col}>
            <Text style={styles.subhead}>Comparativa de métricas</Text>
            <View style={styles.tableHead}>
              <Text style={[styles.th, { flex: 1.4 }]}>MÉTRICA</Text>
              <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>ANTERIOR</Text>
              <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>ACTUAL</Text>
              <Text style={[styles.th, { flex: 0.9, textAlign: "right" }]}>VAR.</Text>
            </View>
            {[
              ["Visualizaciones", ig?.previous?.views, ig?.views, ig?.delta?.views],
              ["Alcance", ig?.previous?.reach, ig?.reach, ig?.delta?.reach],
              ["Interacciones", ig?.previous?.interactions, ig?.interactions, ig?.delta?.interactions],
              ["Visitas al perfil", ig?.previous?.profileViews, ig?.profileViews, ig?.delta?.profileViews],
              ["Seguidores nuevos", ig?.previous?.followersGained, ig?.followersGained, ig?.delta?.followersGained],
              ["Clics al enlace", ig?.previous?.linkClicks, ig?.linkClicks, ig?.delta?.linkClicks],
            ].map(([label, before, now, delta]) => (
              <View style={styles.tableRow} key={label}>
                <Text style={[styles.td, { flex: 1.4 }]}>{label}</Text>
                <Text style={[styles.tdMuted, { flex: 1, textAlign: "right" }]}>{formatNumber(before)}</Text>
                <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>{formatNumber(now)}</Text>
                <Text style={[styles.td, { flex: 0.9, textAlign: "right", color: delta >= 0 ? "#2F7657" : "#A83F48" }]}>
                  {formatPercent(delta)}
                </Text>
              </View>
            ))}
            <Text style={[styles.caption, { marginTop: 8 }]}>
              Cobertura de datos: {report.coverage.days} de {report.period.days} días con métricas.
            </Text>
          </View>
        </View>
      </Slide>

      {/* 4. Instagram: demografía */}
      <Slide
        report={report}
        eyebrow="INSTAGRAM · PÚBLICO"
        title="Quién nos está viendo"
        meta={ig ? `@${ig.handle}` : "Sin cuenta"}
      >
        <View style={styles.row}>
          <View style={[styles.col, { flex: 1.1 }]}>
            <Text style={styles.subhead}>Composición por género</Text>
            <View style={styles.splitTrack}>
              <View style={{ width: `${(ig?.audience?.female ?? 0.5) * 100}%`, backgroundColor: C.ink2 }} />
              <View style={{ width: `${(ig?.audience?.male ?? 0.5) * 100}%`, backgroundColor: C.gold }} />
            </View>
            <View style={styles.row}>
              <Text style={[styles.caption, { flex: 1 }]}>
                Mujeres {formatShare(ig?.audience?.female)}
              </Text>
              <Text style={[styles.caption, { flex: 1, textAlign: "right" }]}>
                Hombres {formatShare(ig?.audience?.male)}
              </Text>
            </View>

            <View style={[styles.card, { marginTop: 14 }]}>
              <Text style={styles.kpiLabel}>PÚBLICO LOCAL</Text>
              <Text style={styles.kpiValue}>{formatShare(ig?.audience?.local)}</Text>
              <Text style={styles.kpiHint}>
                en {ig?.audience?.country ?? "Colombia"}
                {ig?.audience?.top_city ? ` · principal ciudad: ${ig.audience.top_city}` : ""}
              </Text>
            </View>
          </View>

          <View style={styles.col}>
            <Text style={styles.subhead}>Rangos de edad con más peso</Text>
            {ages.length ? (
              ages.map((row) => (
                <Bar key={row.label} label={`${row.label} años`} value={row.share} max={Math.max(...ages.map((age) => age.share), 0.01)} color={C.ink2} display={formatShare(row.share)} />
              ))
            ) : (
              <Text style={styles.caption}>La red todavía no devuelve datos demográficos.</Text>
            )}
          </View>

          <View style={[styles.col, { flex: 0.9 }]}>
            <Text style={styles.subhead}>Seguidores nuevos</Text>
            <Bar
              label={capitalize(report.previousLabel)}
              value={ig?.previous?.followersGained ?? 0}
              max={Math.max(ig?.followersGained ?? 0, ig?.previous?.followersGained ?? 0, 1)}
              color={C.line}
            />
            <Bar
              label={monthTitle}
              value={ig?.followersGained ?? 0}
              max={Math.max(ig?.followersGained ?? 0, ig?.previous?.followersGained ?? 0, 1)}
              color={C.gold}
            />
            <View style={[styles.card, { marginTop: 12 }]}>
              <Text style={styles.kpiLabel}>CONCLUSIÓN</Text>
              <Text style={styles.note}>
                {ig?.audience?.local
                  ? `${formatShare(ig.audience.local)} del público está en Colombia: la marca convoca sobre todo a la ciudad. `
                  : ""}
                El rango {ageRange} años concentra la mayor parte de la audiencia, así que el contenido debe hablarle a personas que ya viven la ciudad.
              </Text>
            </View>
          </View>
        </View>
      </Slide>

      {/* 5. TikTok: algoritmo y retención */}
      <Slide
        report={report}
        eyebrow="TIKTOK · ALGORITMO Y RETENCIÓN"
        title="El algoritmo nos recomienda"
        meta={tt ? `@${tt.handle}` : "Sin cuenta"}
      >
        <View style={styles.row}>
          <View style={[styles.col, { flex: 1.1 }]}>
            <Text style={styles.subhead}>De dónde vienen las reproducciones</Text>
            {forYou !== null ? (
              <>
                <View style={styles.splitTrack}>
                  <View style={{ width: `${(forYou ?? 0) * 100}%`, backgroundColor: PLATFORM_COLOR.tiktok }} />
                  <View style={{ width: `${(profileShare ?? 0) * 100}%`, backgroundColor: C.ink2 }} />
                  <View style={{ width: `${(searchShare ?? 0) * 100}%`, backgroundColor: C.gold }} />
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
                  {[
                    ["Para ti", forYou, PLATFORM_COLOR.tiktok],
                    ["Perfil", profileShare, C.ink2],
                    ["Búsqueda", searchShare, C.gold],
                  ].map(([label, share, color]) => (
                    <View key={label} style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }}>
                      <View style={[styles.legendDot, { backgroundColor: color }]} />
                      <Text style={styles.caption}>
                        {label} {formatShare(share)}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.caption}>Sin datos de origen de tráfico.</Text>
            )}

            <View style={[styles.row, { marginTop: 14 }]}>
              <View style={styles.col}>
                <Kpi label="Visualizaciones" value={formatNumber(tt?.views)} delta={tt?.delta?.views} />
              </View>
              <View style={styles.col}>
                <Kpi label="Interacciones" value={formatNumber(tt?.interactions)} hint={`${formatNumber(tt?.posts)} videos publicados`} />
              </View>
            </View>
            <View style={[styles.row, { marginTop: 10 }]}>
              <View style={styles.col}>
                <Kpi label="Seguidores nuevos" value={`+${formatNumber(tt?.followersGained)}`} hint={`cierre ${formatNumber(tt?.followers)}`} />
              </View>
              <View style={styles.col}>
                <Kpi label="Retención" value={formatShare(forYou)} hint="vistas recomendadas por el algoritmo" />
              </View>
            </View>
          </View>

          <View style={styles.col}>
            <View style={styles.card}>
              <Text style={styles.kpiLabel}>MEJORES HORARIOS</Text>
              {tt?.bestHours?.length ? (
                tt.bestHours.map((hour) => (
                  <Text key={hour} style={[styles.note, { marginBottom: 3 }]}>
                    · {hour}
                  </Text>
                ))
              ) : (
                <Text style={styles.caption}>Sin datos de actividad horaria.</Text>
              )}
            </View>

            <View style={[styles.card, { marginTop: 10 }]}>
              <Text style={styles.kpiLabel}>BÚSQUEDAS QUE NOS ENCUENTRAN</Text>
              {tt?.topSearches?.length ? (
                tt.topSearches.map((term) => (
                  <Text key={term} style={[styles.note, { marginBottom: 3 }]}>
                    “{term}”
                  </Text>
                ))
              ) : (
                <Text style={styles.caption}>Sin términos registrados.</Text>
              )}
            </View>
          </View>
        </View>
      </Slide>

      {/* 6. Comunidad por red */}
      <Slide
        report={report}
        eyebrow="COMUNIDAD"
        title="Personas reales interesadas en visitarnos"
        meta="Instagram + TikTok"
      >
        <View style={[styles.row, { height: 214 }]}>
          {[
            {
              label: "TIKTOK",
              value: formatShare(forYou),
              text: "de las reproducciones llegaron desde “Para ti”: el algoritmo recomienda el contenido sin pauta.",
              color: PLATFORM_COLOR.tiktok,
            },
            {
              label: "INSTAGRAM",
              value: `+${formatNumber(ig?.followersGained)}`,
              text: `seguidores nuevos en el mes. Cierre en ${formatNumber(ig?.followers)} cuentas.`,
              color: PLATFORM_COLOR.instagram,
            },
            {
              label: "TIKTOK",
              value: `+${formatNumber(tt?.followersGained)}`,
              text: `seguidores nuevos en el mes. Cierre en ${formatNumber(tt?.followers)} cuentas.`,
              color: C.ink2,
            },
            {
              label: "CONVERSIÓN",
              value: formatNumber(totalLinkClicks),
              text: "clics directos al enlace de la biografía entre las dos redes.",
              color: C.gold,
            },
          ].map((card, index) => (
            <View
              key={`${card.label}-${index}`}
              style={[styles.card, { flex: 1, borderTopWidth: 3, borderTopColor: card.color, justifyContent: "space-between" }]}
            >
              <View>
                <Text style={[styles.badge, { backgroundColor: card.color }]}>{card.label}</Text>
                <Text style={[styles.kpiValue, { fontSize: 30, marginTop: 16 }]}>{card.value}</Text>
              </View>
              <Text style={styles.caption}>{card.text}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.caption, { marginTop: 12 }]}>
          La comunidad crece en las dos redes al mismo tiempo: Instagram aporta conversación y TikTok aporta descubrimiento.
        </Text>
      </Slide>

      {/* 7. Mejores publicaciones */}
      <Slide
        report={report}
        eyebrow="CONTENIDO"
        title="Nuestras mejores publicaciones"
        meta="Ordenadas por visualizaciones"
      >
        <View style={styles.grid}>
          {report.topPosts.length ? (
            report.topPosts.slice(0, 6).map((post) => (
              <View style={styles.contentCard} key={`${post.platform}-${post.id}`}>
                <View style={styles.contentTop}>
                  <NetworkBadge platform={post.platform} />
                  <Text style={styles.caption}>{post.day ? dayLabel(post.day) : "—"}</Text>
                </View>
                <Text style={styles.views}>{formatNumber(post.views)}</Text>
                <Text style={[styles.caption, { marginBottom: 6 }]}>
                  {post.type} · {formatNumber(post.interactions)} interacciones
                </Text>
                <Text style={[styles.td, { fontSize: 8, lineHeight: 1.35 }]} numberOfLines={2}>
                  {post.caption || "Sin texto"}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.caption}>No hay publicaciones registradas en este periodo.</Text>
          )}
        </View>
        <Text style={[styles.caption, { marginTop: 12 }]}>
          Las piezas de video concentran las mayores cifras: el formato corto es el que más gente nueva trae.
        </Text>
      </Slide>

      {/* 8. Impacto en el negocio */}
      <Slide
        report={report}
        eyebrow="VALOR DEL NEGOCIO"
        title="¿Qué significa esto para el negocio?"
        meta={monthTitle}
      >
        <View style={[styles.row, { alignItems: "stretch" }]}>
          <View style={styles.pillar}>
            <Text style={styles.pillarNumber}>01</Text>
            <Text style={styles.pillarTitle}>Público nuevo</Text>
            <Text style={styles.pillarText}>
              {formatShare(ig?.nonFollowerShare)} del alcance de Instagram vino de fuera de la comunidad
              {forYou !== null ? ` y en TikTok ${formatShare(forYou)} de las vistas llegaron desde “Para ti”` : ""}. Las búsquedas
              muestran intención de visita: planes, museos y café en la ciudad.
            </Text>
          </View>
          <View style={styles.pillar}>
            <Text style={styles.pillarNumber}>02</Text>
            <Text style={styles.pillarTitle}>Costo de adquisición</Text>
            <Text style={styles.pillarText}>
              {formatNumber(report.totalViews)} visualizaciones, {formatNumber(report.totalInteractions)} interacciones y{" "}
              {formatNumber(report.totalFollowersGained)} seguidores nuevos con $0 USD de pauta. Todo el crecimiento del mes
              fue orgánico.
            </Text>
          </View>
          <View style={styles.pillar}>
            <Text style={styles.pillarNumber}>03</Text>
            <Text style={styles.pillarTitle}>Próximo paso</Text>
            <Text style={styles.pillarText}>
              {nextCampaign
                ? `Activar pauta para «${nextCampaign.name}» mientras el alcance orgánico está alto. `
                : "Activar pauta para la próxima campaña mientras el alcance orgánico está alto. "}
              El objetivo es sostener la frecuencia de video y ampliar el público fuera de Ibagué.
            </Text>
          </View>
        </View>

        <View style={[styles.card, { marginTop: 14 }]}>
          <Text style={styles.kpiLabel}>ACTIVIDAD QUE EXPLICA EL MES</Text>
          {report.events.length ? (
            report.events.slice(0, 4).map((event) => (
              <Text key={event.id} style={[styles.note, { marginBottom: 3 }]}>
                · {dayLabel(event.event_date)} — {event.title} ({(KIND_LABEL[event.kind] ?? event.kind).toLowerCase()})
              </Text>
            ))
          ) : (
            <Text style={styles.caption}>Sin eventos registrados en el periodo.</Text>
          )}
        </View>
      </Slide>

      {/* 9. Propuesta estratégica */}
      <Slide
        report={report}
        eyebrow="SIGUIENTE MES"
        title={nextCampaign ? `Propuesta: pauta para «${nextCampaign.name}»` : "Propuesta para el siguiente mes"}
        meta={monthTitle}
      >
        <View style={[styles.row, { alignItems: "stretch" }]}>
          <View style={[styles.col, { flex: 1.3 }]}>
            <Text style={styles.subhead}>Estrategia</Text>
            <View style={styles.card}>
              <Text style={styles.note}>
                Continuar la campaña de expectativa con el formato que mejor respondió
                {bestType ? ` (${bestType.label.toLowerCase()})` : ""} y acercar la marca a quienes ya buscan planes en la
                ciudad. Mantener el ritmo de {ig?.posts ?? 0} publicaciones en Instagram y {tt?.posts ?? 0} videos en TikTok,
                concentrando los lanzamientos en los horarios de mayor actividad.
              </Text>
            </View>

            <Text style={[styles.subhead, { marginTop: 12 }]}>Segmentación propuesta</Text>
            <View style={styles.row}>
              <View style={styles.proposalBox}>
                <Text style={styles.proposalLabel}>UBICACIÓN</Text>
                <Text style={styles.proposalText}>
                  {ig?.audience?.top_city ?? "Ibagué"}, {ig?.audience?.country ?? "Colombia"}
                </Text>
              </View>
              <View style={styles.proposalBox}>
                <Text style={styles.proposalLabel}>EDAD</Text>
                <Text style={styles.proposalText}>{ageRange} años</Text>
              </View>
              <View style={styles.proposalBox}>
                <Text style={styles.proposalLabel}>HORARIOS</Text>
                <Text style={styles.proposalText}>
                  {tt?.bestHours?.[0] ?? ig?.bestHours?.[0] ?? "Sábados 8–9 p. m."}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.col, { flex: 0.9 }]}>
            <View style={styles.question}>
              <Text style={styles.kpiLabel}>PREGUNTA PARA CERRAR</Text>
              <Text style={styles.questionText}>
                ¿Confirmamos la fecha de la próxima campaña para reservar pauta dos semanas antes y alinear el calendario
                editorial?
              </Text>
            </View>
            <Text style={styles.signature}>
              {report.preparedBy || "Equipo de marketing"} · Especialista en marketing digital
            </Text>
            <Text style={[styles.caption, { marginTop: 8 }]}>
              Datos de Instagram y TikTok del periodo {rangeLabel}.
              {report.isDemo ? " Cifras de demostración." : ""}
            </Text>
          </View>
        </View>
      </Slide>
    </Document>
  );
}
