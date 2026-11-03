import {
  Document,
  Page,
  Path,
  Polyline,
  StyleSheet,
  Svg,
  Text,
  View,
  Line,
} from "@react-pdf/renderer";
import {
  dateRangeLabel,
  dayLabel,
  formatNumber,
  formatPercent,
  percentChange,
} from "./useReports.js";

const KIND_LABEL = {
  campana: "Campaña",
  evento: "Evento",
  lanzamiento: "Lanzamiento",
  prensa: "Prensa",
  otro: "Otro",
};

const STATUS_LABEL = {
  planeada: "Planeada",
  activa: "Activa",
  finalizada: "Finalizada",
};

const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

const styles = StyleSheet.create({
  page: {
    paddingTop: 46,
    paddingHorizontal: 44,
    paddingBottom: 62,
    backgroundColor: "#FFFDFA",
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#28212D",
  },
  cover: {
    paddingTop: 44,
    paddingHorizontal: 44,
    paddingBottom: 44,
    justifyContent: "space-between",
  },
  coverTop: { flexDirection: "row", alignItems: "center" },
  mark: {
    width: 46,
    height: 46,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  markText: { fontFamily: "Times-Roman", fontSize: 19, letterSpacing: 1.5 },
  brandName: { fontFamily: "Times-Roman", fontSize: 16 },
  brandHandle: { fontSize: 8, letterSpacing: 1.6, marginTop: 2, color: "#625967" },
  coverBody: { marginTop: 90 },
  eyebrow: { fontSize: 8, letterSpacing: 2.4, marginBottom: 16, color: "#625967" },
  coverTitle: { fontFamily: "Times-Roman", fontSize: 46, lineHeight: 1.05 },
  coverRange: { fontSize: 12, marginTop: 14, color: "#28212D" },
  rule: { width: 64, height: 3, marginTop: 22, marginBottom: 20 },
  coverMeta: { flexDirection: "row", marginTop: 4 },
  coverMetaBlock: { marginRight: 44 },
  coverMetaLabel: { fontSize: 7, letterSpacing: 1.4, color: "#786E7E", marginBottom: 4 },
  coverMetaValue: { fontSize: 11 },
  coverFoot: { borderTopWidth: 0.6, borderTopColor: "#CFC5D4", paddingTop: 16 },
  coverIntro: { fontSize: 10, lineHeight: 1.5, color: "#625967", maxWidth: 400 },
  badge: {
    alignSelf: "flex-start",
    marginTop: 18,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 3,
    borderWidth: 0.8,
  },
  badgeText: { fontSize: 7, letterSpacing: 1.6 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 0.8,
    borderBottomColor: "#CFC5D4",
    paddingBottom: 10,
    marginBottom: 20,
  },
  headerTitle: { fontFamily: "Times-Roman", fontSize: 20 },
  headerSub: { fontSize: 8, letterSpacing: 1.2, marginTop: 4, color: "#625967" },
  headerRight: { fontSize: 8, color: "#625967", textAlign: "right" },

  sectionTitle: { fontFamily: "Times-Roman", fontSize: 15, marginBottom: 4 },
  sectionHint: { fontSize: 8, color: "#786E7E", marginBottom: 10 },

  kpiGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  kpi: {
    width: "33.333%",
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  kpiInner: {
    borderWidth: 0.7,
    borderColor: "#E2DCE4",
    borderRadius: 6,
    padding: 10,
    minHeight: 64,
  },
  kpiLabel: { fontSize: 7, letterSpacing: 1.1, color: "#786E7E", marginBottom: 6 },
  kpiValue: { fontFamily: "Times-Roman", fontSize: 21 },
  kpiHint: { fontSize: 7.5, marginTop: 3, color: "#625967" },

  panel: {
    borderWidth: 0.7,
    borderColor: "#E2DCE4",
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  panelHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  panelTitle: { fontFamily: "Times-Roman", fontSize: 12 },
  panelNote: { fontSize: 7, color: "#786E7E" },

  bars: { flexDirection: "row", alignItems: "flex-end", height: 76, marginTop: 4 },
  barSlot: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  bar: { width: 18, borderTopLeftRadius: 2, borderTopRightRadius: 2, minHeight: 2 },
  barLabel: { fontSize: 6, marginTop: 4, color: "#786E7E" },

  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 0.8,
    borderBottomColor: "#CFC5D4",
    paddingBottom: 5,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2DCE4",
    paddingVertical: 7,
    alignItems: "flex-start",
  },
  colDate: { width: 42, fontSize: 7.5, color: "#625967" },
  colType: { width: 48, fontSize: 7, letterSpacing: 0.4, color: "#625967" },
  colCaption: { flex: 1, paddingRight: 8 },
  captionText: { fontSize: 8, lineHeight: 1.35 },
  colNumber: { width: 50, textAlign: "right", fontSize: 8 },
  colRate: { width: 42, textAlign: "right", fontSize: 8 },
  tableHeadText: { fontSize: 6.5, letterSpacing: 1, color: "#786E7E" },

  eventRow: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2DCE4",
  },
  eventDate: { width: 54, fontSize: 7.5, color: "#625967" },
  eventBody: { flex: 1 },
  eventTitle: { fontSize: 9 },
  eventNotes: { fontSize: 7.5, color: "#786E7E", marginTop: 2, lineHeight: 1.35 },
  kindTag: { fontSize: 6.5, letterSpacing: 0.8, marginLeft: 6 },

  notesBox: {
    borderLeftWidth: 2,
    paddingLeft: 10,
    paddingVertical: 2,
    marginTop: 6,
  },
  notesText: { fontSize: 8.5, lineHeight: 1.55 },
  empty: { fontSize: 8, color: "#786E7E", paddingVertical: 8 },

  footer: {
    position: "absolute",
    bottom: 26,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#E2DCE4",
    paddingTop: 7,
  },
  footerText: { fontSize: 6.5, color: "#786E7E", letterSpacing: 0.3 },
});

function Delta({ value, suffix = "" }) {
  if (value === null || value === undefined) return <Text style={styles.kpiHint}>Sin mes anterior</Text>;
  return (
    <Text style={styles.kpiHint}>
      {formatPercent(value)} {suffix}
    </Text>
  );
}

function FollowerChart({ daily, color, pale }) {
  const width = 470;
  const height = 104;
  const values = daily.map((row) => Number(row.followers) || 0);
  if (values.length < 2) {
    return <Text style={styles.empty}>Sin suficientes días para dibujar la evolución.</Text>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - 8 - ((value - min) / span) * (height - 22);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `M0,${height} L${points.join(" L")} L${width},${height} Z`;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke="#E2DCE4" strokeWidth="0.7" />
      <Path d={area} fill={pale} />
      <Polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth="1.6" />
    </Svg>
  );
}

function WeeklyReach({ daily, color }) {
  const buckets = [];
  for (let index = 0; index < daily.length; index += 7) {
    const week = daily.slice(index, index + 7);
    buckets.push({
      label: `${index + 1}–${index + week.length}`,
      reach: week.reduce((total, row) => total + (Number(row.reach) || 0), 0),
    });
  }
  const peak = Math.max(1, ...buckets.map((bucket) => bucket.reach));
  return (
    <View style={styles.bars}>
      {buckets.map((bucket) => (
        <View style={styles.barSlot} key={bucket.label}>
          <Text style={styles.panelNote}>{formatNumber(bucket.reach)}</Text>
          <View
            style={[
              styles.bar,
              { height: Math.max(3, (bucket.reach / peak) * 52), backgroundColor: color },
            ]}
          />
          <Text style={styles.barLabel}>días {bucket.label}</Text>
        </View>
      ))}
    </View>
  );
}

function Footer({ report }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        {report.brand.name} · Datos de demostración, no provienen de la API de Meta
      </Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

function Header({ report }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>{report.brand.name}</Text>
        <Text style={styles.headerSub}>
          INFORME DE INSTAGRAM · {capitalize(report.label).toUpperCase()}
        </Text>
      </View>
      <View>
        <Text style={styles.headerRight}>@{report.account?.handle ?? "sin cuenta"}</Text>
        <Text style={styles.headerRight}>{report.coverage.start} → {report.coverage.end}</Text>
      </View>
    </View>
  );
}

export default function MonthlyReportPdf({ report }) {
  const { palette } = report;
  const primary = palette.primary;
  const accent = palette.accent;
  const pale = `${primary}22`;
  const followersDelta = report.followersOpening
    ? report.net / report.followersOpening
    : null;
  const typeSummary = Object.entries(report.mediaTypes ?? {})
    .map(([key, count]) => `${count} ${key.toLowerCase()}`)
    .join(" · ");

  return (
    <Document
      title={`Reporte mensual · ${capitalize(report.label)} · ${report.brand.name}`}
      author="MarketingHUB"
      subject={`Reporte de Instagram de ${report.brand.name}`}
      creator="MarketingHUB"
      producer="MarketingHUB"
    >
      <Page size="A4" style={[styles.page, styles.cover]}>
        <View style={styles.coverTop}>
          <View style={[styles.mark, { borderColor: primary }]}>
            <Text style={[styles.markText, { color: primary }]}>GR</Text>
          </View>
          <View>
            <Text style={[styles.brandName, { color: primary }]}>{report.brand.name}</Text>
            <Text style={styles.brandHandle}>@{(report.account?.handle ?? "casagomezramirez").toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.coverBody}>
          <Text style={[styles.eyebrow, { color: accent }]}>REPORTE MENSUAL DE INSTAGRAM</Text>
          <Text style={[styles.coverTitle, { color: primary }]}>{capitalize(report.label)}</Text>
          <View style={[styles.rule, { backgroundColor: accent }]} />
          <Text style={styles.coverRange}>{dateRangeLabel(report.period.start, report.period.end)}</Text>

          <View style={[styles.coverMeta, { marginTop: 26 }]}>
            <View style={styles.coverMetaBlock}>
              <Text style={styles.coverMetaLabel}>SEGUIDORES AL CIERRE</Text>
              <Text style={styles.coverMetaValue}>{formatNumber(report.followersClosing)}</Text>
            </View>
            <View style={styles.coverMetaBlock}>
              <Text style={styles.coverMetaLabel}>CRECIMIENTO DEL MES</Text>
              <Text style={styles.coverMetaValue}>
                {report.net > 0 ? "+" : ""}
                {formatNumber(report.net)}
              </Text>
            </View>
            <View style={styles.coverMetaBlock}>
              <Text style={styles.coverMetaLabel}>PUBLICACIONES</Text>
              <Text style={styles.coverMetaValue}>{formatNumber(report.posts)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.coverFoot}>
          <Text style={styles.coverIntro}>{report.brand.description}</Text>
          <View style={[styles.badge, { borderColor: accent }]}>
            <Text style={[styles.badgeText, { color: accent }]}>
              DATOS DE DEMOSTRACIÓN · PENDIENTE CONEXIÓN CON META
            </Text>
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Header report={report} />

        <Text style={styles.sectionTitle}>Resumen del mes</Text>
        <Text style={styles.sectionHint}>
          Comparado con {capitalize(report.previousLabel)}.
        </Text>

        <View style={styles.kpiGrid}>
          <View style={styles.kpi}>
            <View style={styles.kpiInner}>
              <Text style={styles.kpiLabel}>SEGUIDORES</Text>
              <Text style={[styles.kpiValue, { color: primary }]}>
                {formatNumber(report.followersClosing)}
              </Text>
              <Text style={styles.kpiHint}>
                {report.net >= 0 ? "+" : ""}
                {formatNumber(report.net)} en el mes ({formatPercent(followersDelta)})
              </Text>
            </View>
          </View>
          <View style={styles.kpi}>
            <View style={styles.kpiInner}>
              <Text style={styles.kpiLabel}>GANADOS / PERDIDOS</Text>
              <Text style={[styles.kpiValue, { color: primary }]}>
                {formatNumber(report.gained)} / {formatNumber(report.lost)}
              </Text>
              <Text style={styles.kpiHint}>Neto {report.net >= 0 ? "+" : ""}{formatNumber(report.net)}</Text>
            </View>
          </View>
          <View style={styles.kpi}>
            <View style={styles.kpiInner}>
              <Text style={styles.kpiLabel}>ALCANCE</Text>
              <Text style={[styles.kpiValue, { color: primary }]}>{formatNumber(report.reach)}</Text>
              <Delta value={percentChange(report.reach, report.previous.reach)} suffix="vs. mes anterior" />
            </View>
          </View>
          <View style={styles.kpi}>
            <View style={styles.kpiInner}>
              <Text style={styles.kpiLabel}>REPRODUCCIONES</Text>
              <Text style={[styles.kpiValue, { color: primary }]}>{formatNumber(report.views)}</Text>
              <Delta value={percentChange(report.views, report.previous.views)} suffix="vs. mes anterior" />
            </View>
          </View>
          <View style={styles.kpi}>
            <View style={styles.kpiInner}>
              <Text style={styles.kpiLabel}>PUBLICACIONES</Text>
              <Text style={[styles.kpiValue, { color: primary }]}>{formatNumber(report.posts)}</Text>
              <Text style={styles.kpiHint}>{typeSummary || "Sin publicaciones registradas"}</Text>
            </View>
          </View>
          <View style={styles.kpi}>
            <View style={styles.kpiInner}>
              <Text style={styles.kpiLabel}>INTERACCIONES</Text>
              <Text style={[styles.kpiValue, { color: primary }]}>{formatNumber(report.interactions)}</Text>
              <Delta value={percentChange(report.interactions, report.previous.interactions)} suffix="vs. mes anterior" />
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Evolución de seguidores</Text>
            <Text style={styles.panelNote}>
              {formatNumber(report.followersOpening)} → {formatNumber(report.followersClosing)}
            </Text>
          </View>
          <FollowerChart daily={report.daily} color={primary} pale={pale} />
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Alcance por semana</Text>
            <Text style={styles.panelNote}>Total del periodo: {formatNumber(report.reach)}</Text>
          </View>
          <WeeklyReach daily={report.daily} color={accent} />
        </View>

        <Text style={styles.panelNote}>
          Cobertura de datos: {dateRangeLabel(report.coverage.start, report.coverage.end)} ·{" "}
          {report.coverage.days} de {report.period.days} días con métricas.
          {report.complete ? "" : " Los días sin dato no se rellenan con cifras inventadas."}
        </Text>

        <Footer report={report} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Header report={report} />
        <Text style={styles.sectionTitle}>Publicaciones con más interacción</Text>
        <Text style={styles.sectionHint}>
          Ordenadas por me gusta, comentarios, compartidos y guardados. La tasa se calcula sobre el alcance.
        </Text>

        <View style={styles.tableHead}>
          <Text style={[styles.colDate, styles.tableHeadText]}>FECHA</Text>
          <Text style={[styles.colType, styles.tableHeadText]}>TIPO</Text>
          <Text style={[styles.colCaption, styles.tableHeadText]}>PUBLICACIÓN</Text>
          <Text style={[styles.colNumber, styles.tableHeadText]}>ALCANCE</Text>
          <Text style={[styles.colNumber, styles.tableHeadText]}>INTERACC.</Text>
          <Text style={[styles.colRate, styles.tableHeadText]}>TASA</Text>
        </View>

        {report.topPosts.length ? (
          report.topPosts.map((post) => (
            <View style={styles.tableRow} key={post.id} wrap={false}>
              <Text style={styles.colDate}>{dayLabel(post.day)}</Text>
              <Text style={styles.colType}>
                {post.media_product_type || post.media_type || "POST"}
              </Text>
              <View style={styles.colCaption}>
                <Text style={styles.captionText} numberOfLines={2}>
                  {post.caption || "Sin texto"}
                </Text>
              </View>
              <Text style={styles.colNumber}>{formatNumber(post.reach)}</Text>
              <Text style={styles.colNumber}>{formatNumber(post.interactions)}</Text>
              <Text style={styles.colRate}>{formatPercent(post.engagementRate)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No hay publicaciones registradas en este periodo.</Text>
        )}

        <View style={{ marginTop: 18 }}>
          <Text style={styles.sectionTitle}>Actividad del mes</Text>
          <Text style={styles.sectionHint}>
            Eventos, campañas y acciones que explican los cambios del periodo.
          </Text>

          {report.events.length ? (
            report.events.map((event) => (
              <View style={styles.eventRow} key={event.id} wrap={false}>
                <Text style={styles.eventDate}>{dayLabel(event.event_date)}</Text>
                <View style={styles.eventBody}>
                  <Text style={styles.eventTitle}>
                    {event.title}
                    <Text style={[styles.kindTag, { color: accent }]}>
                      {"  "}
                      {(KIND_LABEL[event.kind] ?? event.kind).toUpperCase()}
                    </Text>
                  </Text>
                  {event.notes ? <Text style={styles.eventNotes}>{event.notes}</Text> : null}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No hay eventos registrados en este periodo.</Text>
          )}
        </View>

        <Footer report={report} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Header report={report} />
        <Text style={styles.sectionTitle}>Campañas del periodo</Text>
        <Text style={styles.sectionHint}>Campañas que estuvieron activas durante el mes.</Text>

        {report.campaigns.length ? (
          report.campaigns.map((campaign) => (
            <View style={styles.eventRow} key={campaign.id} wrap={false}>
              <View style={[styles.eventDate, { paddingTop: 2 }]}>
                <View style={{ width: 18, height: 3, borderRadius: 2, backgroundColor: campaign.color || accent }} />
              </View>
              <View style={styles.eventBody}>
                <Text style={styles.eventTitle}>
                  {campaign.name}
                  <Text style={[styles.kindTag, { color: accent }]}>
                    {"  "}
                    {(STATUS_LABEL[campaign.status] ?? campaign.status).toUpperCase()}
                  </Text>
                </Text>
                <Text style={styles.eventNotes}>
                  {campaign.start_date ? dayLabel(campaign.start_date, { day: "numeric", month: "long" }) : "Sin inicio"}
                  {" → "}
                  {campaign.end_date ? dayLabel(campaign.end_date, { day: "numeric", month: "long", year: "numeric" }) : "Sin cierre"}
                </Text>
                {campaign.objective ? <Text style={styles.eventNotes}>{campaign.objective}</Text> : null}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No hay campañas activas en este periodo.</Text>
        )}

        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Lectura del mes</Text>
          <Text style={styles.sectionHint}>
            Notas del equipo que acompañan la entrega del reporte.
          </Text>
          <View style={[styles.notesBox, { borderLeftColor: accent }]}>
            <Text style={styles.notesText}>
              {report.notes?.trim() || "Sin notas para este periodo."}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 22 }}>
          <Text style={styles.sectionTitle}>Cómo se calcula</Text>
          <Text style={styles.eventNotes}>
            Seguidores: último dato diario del periodo. Ganados y perdidos: suma de las variaciones
            diarias. Alcance e interacciones: suma de los datos diarios. La tasa de interacción se
            calcula como interacciones sobre alcance de cada publicación.
          </Text>
          <Text style={[styles.eventNotes, { marginTop: 6 }]}>
            Mientras no exista una conexión autorizada con la API de Instagram, todas las cifras de
            este documento son datos de demostración. Al conectar la cuenta, el reporte imprimirá
            únicamente el rango realmente devuelto por Meta.
          </Text>
        </View>

        <Footer report={report} />
      </Page>
    </Document>
  );
}
