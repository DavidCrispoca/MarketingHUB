const DATABASE_KEY = "marketinghub.local.database.v3";
const FILE_DATABASE = "marketinghub-local-files";
const FILE_STORE = "objects";
const WORKSPACE_ID = "local-marketinghub-workspace";
const BRAND_ID = "b0000000-0000-4000-8000-000000000001";
const iso = (date) => date.toISOString();
const day = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
};
const at = (date, hours = 12) => new Date(`${date}T${String(hours).padStart(2, "0")}:00:00Z`);
const uuid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// Deterministic pseudo-random so the local demo reproduces the same numbers
// every time the browser seeds the database.
const hash = (text) => {
  let value = 5381;
  for (let index = 0; index < text.length; index += 1) {
    value = ((value * 33) ^ text.charCodeAt(index)) >>> 0;
  }
  return value;
};

const DEMO_ART = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500"><rect width="1200" height="1500" fill="#F3EBDD"/><path d="M120 1500V780a320 320 0 0 1 640 0v720z" fill="#2F4A3E"/><path d="M280 1500V840a160 160 0 0 1 320 0v660z" fill="#F3EBDD"/><circle cx="930" cy="430" r="150" fill="#B4552D"/><circle cx="930" cy="430" r="96" fill="#C69A4B"/><text x="100" y="180" fill="#2F4A3E" font-family="Georgia,serif" font-size="46" letter-spacing="6">CASA GÓMEZ RAMÍREZ</text><text x="100" y="250" fill="#B4552D" font-family="sans-serif" font-size="26" letter-spacing="8">IBAGUÉ · DESDE 1925</text><text x="100" y="1310" fill="#F3EBDD" font-family="Georgia,serif" font-size="86">La memoria</text><text x="100" y="1400" fill="#F3EBDD" font-family="Georgia,serif" font-size="86">sigue abierta.</text></svg>`;
const DEMO_STORY_ART = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><rect width="1080" height="1920" fill="#2F4A3E"/><circle cx="540" cy="820" r="330" fill="#F3EBDD"/><circle cx="540" cy="820" r="150" fill="#B4552D"/><rect x="500" y="820" width="80" height="190" fill="#B4552D"/><text x="84" y="170" fill="#F3EBDD" font-family="sans-serif" font-size="30" letter-spacing="9">CASA GÓMEZ RAMÍREZ · IBAGUÉ</text><text x="84" y="1370" fill="#F3EBDD" font-family="Georgia,serif" font-size="96">Una casa</text><text x="84" y="1480" fill="#F3EBDD" font-family="Georgia,serif" font-size="96">que respira.</text><path d="M84 1560h240" stroke="#C69A4B" stroke-width="8"/><text x="84" y="1640" fill="#F3EBDD" font-family="sans-serif" font-size="34">Cra 2 #10-36 · Centro histórico</text></svg>`;
const DEMO_CAROUSEL_ART = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500"><rect width="1200" height="1500" fill="#F3EBDD"/><path d="M0 1080c230-190 420-60 620 60s360 160 580-40v400H0z" fill="#2F4A3E"/><rect x="760" y="300" width="300" height="420" rx="150" fill="#B4552D"/><rect x="820" y="380" width="180" height="260" rx="90" fill="#F3EBDD"/><text x="82" y="150" fill="#2F4A3E" font-family="sans-serif" font-size="30" letter-spacing="8">CINCO RINCONES · UN SOLO LUGAR</text><text x="82" y="1250" fill="#F3EBDD" font-family="Georgia,serif" font-size="84">Lo que guarda</text><text x="82" y="1350" fill="#F3EBDD" font-family="Georgia,serif" font-size="84">la casa.</text></svg>`;
const DEMO_WORDMARK = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360"><g fill="none" stroke="#2F4A3E" stroke-width="10"><rect x="96" y="76" width="180" height="200" rx="8"/><path d="M96 146h180M186 76v200"/></g><text x="330" y="180" fill="#2F4A3E" font-family="Georgia,serif" font-size="86">Casa Gómez Ramírez</text><text x="340" y="244" fill="#B4552D" font-family="sans-serif" font-size="24" letter-spacing="11">MEMORIA · CAFÉ · PATRIMONIO</text></svg>`;
const DEMO_MONOGRAM = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640"><rect x="32" y="32" width="576" height="576" rx="96" fill="#2F4A3E"/><rect x="150" y="150" width="340" height="340" rx="6" fill="none" stroke="#F3EBDD" stroke-width="12"/><path d="M150 320h340M320 150v340" stroke="#C69A4B" stroke-width="10"/><text x="320" y="392" text-anchor="middle" fill="#F3EBDD" font-family="Georgia,serif" font-size="150">GR</text></svg>`;
const DEMO_VISUALS = [
  { id: "c0000000-0000-4000-8000-000000000002", name: "01-cinco-rincones.svg", artwork: DEMO_CAROUSEL_ART, folder: "Patrimonio", tags: ["carrusel", "rincones", "memoria"], width: 1200, height: 1500, date: -3 },
  { id: "c0000000-0000-4000-8000-000000000003", name: "02-historia-casa.svg", artwork: DEMO_STORY_ART, folder: "Patrimonio", tags: ["story", "1925", "patrimonio"], width: 1080, height: 1920, date: -2 },
  { id: "c0000000-0000-4000-8000-000000000004", name: "logo-wordmark.svg", artwork: DEMO_WORDMARK, folder: "Identidad visual", tags: ["logo", "identidad", "principal"], width: 1200, height: 360, date: -50 },
  { id: "c0000000-0000-4000-8000-000000000005", name: "logo-monograma.svg", artwork: DEMO_MONOGRAM, folder: "Identidad visual", tags: ["logo", "identidad", "símbolo"], width: 640, height: 640, date: -50 },
];
const demoVisualRow = (visual) => ({ id: visual.id, brand_id: BRAND_ID, name: visual.name, original_path: `${BRAND_ID}/media/${visual.id}.svg`, thumb_path: `${BRAND_ID}/thumbs/${visual.id}.svg`, mime_type: "image/svg+xml", size_bytes: new Blob([visual.artwork]).size, width: visual.width, height: visual.height, duration_seconds: null, status: "pendiente", folder: visual.folder, tags: visual.tags, created_at: iso(day(visual.date)), updated_at: iso(day(visual.date)) });

const POSTS = [
  ["2026-09-03T22:00:00Z", "2026-09-05T12:00:00Z", 940, 62, 7, 3, 9, 780, "IMAGE", "FEED", "La casa cumple 101 años y sigue contando historias en el centro de Ibagué."],
  ["2026-09-06T15:00:00Z", "2026-09-08T12:00:00Z", 2380, 96, 11, 8, 14, 1450, "VIDEO", "REELS", "El patio donde la familia Gómez Ramírez reunía a sus amigos sigue siendo el corazón de la casa."],
  ["2026-09-10T21:30:00Z", "2026-09-12T12:00:00Z", 860, 54, 5, 2, 11, 720, "CAROUSEL_ALBUM", "FEED", "Cinco objetos que guardan la memoria de una familia tolimense."],
  ["2026-09-14T14:30:00Z", "2026-09-16T12:00:00Z", 810, 71, 9, 4, 7, 690, "IMAGE", "FEED", "Café de origen, servido en el patio. Todos los días hasta las 6 p. m."],
  ["2026-09-17T23:00:00Z", "2026-09-19T12:00:00Z", 3120, 132, 18, 12, 21, 1980, "VIDEO", "REELS", "Chisme histórico: la casa se construyó en 1925 con materiales de la región."],
  ["2026-09-20T16:00:00Z", "2026-09-22T12:00:00Z", 2760, 118, 14, 9, 17, 1740, "VIDEO", "REELS", "Noche de museos: así se ve la casa cuando cae el sol."],
  ["2026-09-23T20:00:00Z", "2026-09-25T12:00:00Z", 1310, 88, 12, 6, 15, 1120, "CAROUSEL_ALBUM", "FEED", "Samuel Gómez Ramírez y las historias que rescató de su propio barrio."],
  ["2026-09-27T15:30:00Z", "2026-09-29T12:00:00Z", 760, 65, 6, 3, 8, 640, "IMAGE", "FEED", "Los balcones vuelven a mirar la carrera segunda."],
  ["2026-09-30T22:30:00Z", "2026-10-02T12:00:00Z", 2410, 104, 10, 7, 16, 1520, "VIDEO", "REELS", "El sonido de la casa: las puertas, el patio, la calle."],
  ["2026-10-01T22:30:00Z", "2026-10-03T12:00:00Z", 1420, 92, 13, 7, 18, 1240, "CAROUSEL_ALBUM", "FEED", "Cinco rincones que guardan la memoria de Ibagué."],
  ["2026-10-03T15:00:00Z", "2026-10-05T12:00:00Z", 3640, 148, 21, 14, 26, 2260, "VIDEO", "REELS", "El patio que en 1925 era el corazón de la casa."],
  ["2026-10-06T21:00:00Z", "2026-10-08T12:00:00Z", 1120, 87, 16, 8, 12, 980, "IMAGE", "FEED", "Chisme histórico: la casa se construyó en 1925."],
  ["2026-10-08T16:00:00Z", "2026-10-10T12:00:00Z", 2980, 121, 19, 11, 22, 1890, "VIDEO", "REELS", "Hoy abrimos el taller de patrimonio material. Gracias a quienes nos acompañaron."],
  ["2026-10-11T20:00:00Z", "2026-10-13T12:00:00Z", 1680, 109, 17, 9, 20, 1460, "CAROUSEL_ALBUM", "FEED", "Samuel Gómez y las historias que rescató."],
  ["2026-10-14T14:00:00Z", "2026-10-16T12:00:00Z", 940, 78, 11, 5, 10, 820, "IMAGE", "FEED", "Café de origen en el centro de Ibagué."],
  ["2026-10-18T16:30:00Z", "2026-10-20T12:00:00Z", 4210, 167, 26, 18, 31, 2580, "VIDEO", "REELS", "Café con historia: recorrido inmersivo por la casa."],
  ["2026-10-22T21:00:00Z", "2026-10-24T12:00:00Z", 1960, 134, 22, 13, 24, 1720, "CAROUSEL_ALBUM", "FEED", "Antes y después: la restauración de los balcones."],
  ["2026-10-24T23:30:00Z", "2026-10-26T12:00:00Z", 4680, 189, 29, 21, 35, 2910, "VIDEO", "REELS", "Noche patrimonial: la casa después del atardecer."],
  ["2026-10-28T15:30:00Z", "2026-10-30T12:00:00Z", 880, 73, 9, 4, 9, 760, "IMAGE", "FEED", "El reloj de la sala sigue marcando las horas de la casa."],
  ["2026-10-31T23:00:00Z", "2026-11-02T12:00:00Z", 4320, 176, 31, 19, 28, 2640, "VIDEO", "REELS", "Historias que no duermen: recorrido nocturno de cierre de mes."],
];

// TikTok is a second account on purpose: the monthly report compares the two
// networks instead of treating Instagram as the whole story.
const TIKTOK_POSTS = [
  ["2026-09-04T23:30:00Z", 8700, "El patio de 1925 en quince segundos."],
  ["2026-09-08T22:00:00Z", 2900, "Tres objetos que no están en los libros de historia."],
  ["2026-09-11T23:00:00Z", 5200, "El sonido de la casa cuando cae la tarde."],
  ["2026-09-15T22:30:00Z", 4400, "Así se ve el balcón desde la carrera segunda."],
  ["2026-09-18T23:30:00Z", 3800, "Un café de origen servido en el patio."],
  ["2026-09-22T22:00:00Z", 6100, "Lo que encontraron restaurando la puerta principal."],
  ["2026-09-25T23:00:00Z", 2100, "El reloj de la sala sigue andando."],
  ["2026-09-28T22:30:00Z", 3400, "Preguntas que nos hacen todos los sábados."],
  ["2026-09-30T23:30:00Z", 4600, "Cierre de septiembre en la casa."],
  ["2026-10-02T23:00:00Z", 5200, "La casa cumple 101 años."],
  ["2026-10-04T22:30:00Z", 6400, "El patio que era el corazón de la familia."],
  ["2026-10-06T23:00:00Z", 8100, "Lo que guarda la sala de los espejos."],
  ["2026-10-08T22:00:00Z", 11300, "Taller de patrimonio: así lo vivimos."],
  ["2026-10-11T23:30:00Z", 7800, "Tres rincones que casi nadie ve."],
  ["2026-10-14T22:00:00Z", 9600, "El café que se toma en el patio."],
  ["2026-10-17T23:00:00Z", 13400, "Chisme histórico: la casa de 1925."],
  ["2026-10-20T22:30:00Z", 10700, "Antes y después de los balcones."],
  ["2026-10-23T23:30:00Z", 12900, "Noche patrimonial, sin filtros."],
  ["2026-10-26T22:00:00Z", 4600, "Los oficios del centro histórico."],
  ["2026-10-29T23:00:00Z", 3900, "Un minuto en el patio a las seis de la tarde."],
  ["2026-10-31T23:30:00Z", 2500, "Gracias por acompañarnos en octubre."],
];

const EVENTS = [
  ["e0e00000-0000-4000-8000-000000000001", "Noche de museos", "evento", "2026-09-20", "Apertura nocturna con recorrido guiado."],
  ["e0e00000-0000-4000-8000-000000000002", "Lanzamiento de Octubre patrimonial", "campana", "2026-10-01", "Arranque de la campaña del mes."],
  ["e0e00000-0000-4000-8000-000000000003", "Taller de patrimonio material", "evento", "2026-10-08", "Taller con vecinos del centro histórico."],
  ["e0e00000-0000-4000-8000-000000000004", "Café con historia", "evento", "2026-10-18", "Recorrido inmersivo con café de origen."],
  ["e0e00000-0000-4000-8000-000000000005", "Noche patrimonial", "evento", "2026-10-24", "Recorrido nocturno por patios y balcones."],
  ["e0e00000-0000-4000-8000-000000000006", "Historias que no duermen", "evento", "2026-10-31", "Cierre de mes con recorrido temático."],
];

const CAMPAIGNS = [
  ["ca000000-0000-4000-8000-000000000001", "Octubre patrimonial", "Abrir la casa a nuevos públicos con talleres y recorridos durante octubre.", "2026-10-01", "2026-10-31", "activa", "#B4552D", "octubre-patrimonial", "Cuatro eventos presenciales y once publicaciones en Instagram."],
  ["ca000000-0000-4000-8000-000000000002", "Café con historia", "Convertir la cafetería en la puerta de entrada a la casa.", "2026-09-01", "2026-10-31", "finalizada", "#2F4A3E", "cafe-con-historia", "Recorrido corto con café incluido, todos los sábados."],
  ["ca000000-0000-4000-8000-000000000003", "Navidad en la casa", "Temporada de recorridos nocturnos y mercado de oficios.", "2026-12-01", "2026-12-20", "planeada", "#C69A4B", "navidad-casa-gr", ""],
];

const ITEMS = [
  ["c17e0000-0000-4000-8000-000000000001", "Reel: los balcones cumplen 101 años", "borrador", "Los balcones de la casa vuelven a mirar la carrera segunda. #Ibagué", "2026-11-06T16:00:00Z", "Grabar al atardecer.", null],
  ["c17e0000-0000-4000-8000-000000000002", "Carrusel: oficios del centro de Ibagué", "borrador", "Los oficios que sostienen el centro histórico: ebanistería, zapatería, encuadernación.", "2026-11-10T15:00:00Z", "Faltan dos fotos.", null],
  ["c17e0000-0000-4000-8000-000000000003", "Café con historia de noviembre", "borrador", "Sábado de Café con historia. Reserva tu recorrido.", "2026-11-15T16:00:00Z", "", null],
  ["c17e0000-0000-4000-8000-000000000004", "Recorrido nocturno de fin de año", "idea", "La casa en diciembre: luces, patios y memoria.", "2026-12-05T23:00:00Z", "Aún sin fecha confirmada.", null],
  ["c17e0000-0000-4000-8000-000000000005", "Chisme histórico: el reloj de la sala", "programado", "El reloj de la sala sigue marcando las horas de la casa.", "2026-11-20T22:00:00Z", "", null],
  ["c17e0000-0000-4000-8000-000000000006", "Cierre de Octubre patrimonial", "publicado", "Gracias por acompañarnos en octubre.", "2026-10-31T23:00:00Z", "", "https://www.instagram.com/casagomezramirez/"],
];

const IG_AUDIENCE_SEP = {
  female: 0.548,
  male: 0.452,
  local: 0.921,
  country: "Colombia",
  top_city: "Ibagué",
  ages: [
    { label: "18-24", share: 0.131 },
    { label: "25-34", share: 0.398 },
    { label: "35-44", share: 0.284 },
    { label: "45-54", share: 0.121 },
    { label: "55+", share: 0.066 },
  ],
};

const IG_AUDIENCE_OCT = {
  female: 0.565,
  male: 0.435,
  local: 0.934,
  country: "Colombia",
  top_city: "Ibagué",
  ages: [
    { label: "18-24", share: 0.148 },
    { label: "25-34", share: 0.412 },
    { label: "35-44", share: 0.276 },
    { label: "45-54", share: 0.108 },
    { label: "55+", share: 0.056 },
  ],
};

const TIKTOK_AUDIENCE = {
  female: 0.612,
  male: 0.388,
  local: 0.887,
  country: "Colombia",
  top_city: "Ibagué",
  ages: [
    { label: "18-24", share: 0.284 },
    { label: "25-34", share: 0.446 },
    { label: "35-44", share: 0.196 },
    { label: "45-54", share: 0.061 },
    { label: "55+", share: 0.013 },
  ],
};

// Monthly totals derived from the daily snapshots keep the report and the chart
// in agreement instead of typing the same number twice.
function monthTotals(rows, monthKey) {
  const scoped = rows.filter((row) => row.metric_date.startsWith(monthKey));
  const sum = (field) => scoped.reduce((total, row) => total + (Number(row[field]) || 0), 0);
  return {
    followers: scoped.length ? Number(scoped.at(-1).followers) : 0,
    followers_gained: sum("followers_gained"),
    followers_lost: sum("followers_lost"),
    reach: sum("reach"),
    views: sum("views"),
    profile_views: sum("profile_views"),
    interactions: sum("total_interactions"),
  };
}

function tiktokTotals(posts, monthKey, { followers, gained, lost }) {
  const scoped = posts.filter((post) => post.published_at.startsWith(monthKey));
  const sum = (field) => scoped.reduce((total, post) => total + (Number(post[field]) || 0), 0);
  return {
    followers,
    followers_gained: gained,
    followers_lost: lost,
    reach: sum("reach"),
    views: sum("views"),
    profile_views: Math.round(sum("views") * 0.043),
    interactions: sum("likes") + sum("comments") + sum("shares") + sum("saves"),
    posts_count: scoped.length,
  };
}

function makeDaily(accountId, posts) {
  const rows = [];
  const start = new Date("2026-08-15T12:00:00Z");
  const end = new Date("2026-10-31T12:00:00Z");
  const series = [];
  const total = Math.round((end - start) / 86400000) + 1;

  for (let index = 0; index < total; index += 1) {
    const date = new Date(start.getTime() + index * 86400000);
    const key = date.toISOString().slice(0, 10);
    const weekday = date.getUTCDay();
    const weekend = weekday === 5 || weekday === 6 ? 1 : 0;
    const special = ["2026-10-08", "2026-10-18", "2026-10-24", "2026-10-31"].includes(key);
    const gained = (hash(`gain-${key}`) % 3) + weekend + (special ? 2 : 0);
    const lost = hash(`loss-${key}`) % 11 === 0 ? 1 : 0;
    const reach = 180 + (hash(`reach-${key}`) % 420) + (special ? 1600 : 0);
    const views = 320 + (hash(`views-${key}`) % 850) + (special ? 1400 : 0);
    const profileViews = 14 + (hash(`pv-${key}`) % 46) + (special ? 60 : 0);
    series.push({ key, gained, lost, reach, views, profileViews });
  }

  const net = series.reduce((totalNet, row) => totalNet + row.gained - row.lost, 0);
  let followers = 245 - net;

  for (const row of series) {
    followers += row.gained - row.lost;
    rows.push({
      id: `${accountId}-${row.key}`,
      brand_id: BRAND_ID,
      account_id: accountId,
      metric_date: row.key,
      followers,
      following: 318,
      posts_count:
        62 + posts.filter((post) => post.published_at.slice(0, 10) <= row.key).length,
      reach: row.reach,
      profile_views: row.profileViews,
      views: row.views,
      followers_gained: row.gained,
      followers_lost: row.lost,
      total_interactions: Math.round(
        row.reach * (0.035 + (hash(`int-${row.key}`) % 25) / 1000),
      ),
      created_at: iso(at(row.key)),
    });
  }

  for (const [date, reach, views, profileViews, interactions] of [
    ["2026-11-01", 640, 1180, 41, 38],
    ["2026-11-02", 520, 960, 33, 29],
  ]) {
    rows.push({
      id: `${accountId}-${date}`,
      brand_id: BRAND_ID,
      account_id: accountId,
      metric_date: date,
      followers: 245,
      following: 318,
      posts_count: 83,
      reach,
      profile_views: profileViews,
      views,
      followers_gained: 0,
      followers_lost: 0,
      total_interactions: interactions,
      created_at: iso(at(date)),
    });
  }

  return rows;
}

function makeSeed() {
  const brand = {
    id: BRAND_ID,
    access_code_id: WORKSPACE_ID,
    name: "Casa Gómez Ramírez",
    slug: "casa-gr",
    description: "Casa patrimonial de 1925 en el centro de Ibagué. Museo, café y memoria viva del Tolima.",
    created_at: iso(day(-90)),
    updated_at: iso(day(-2)),
  };
  const accountId = "50c14000-0000-4000-8000-000000000001";

  const posts = POSTS.map(
    ([published_at, captured_at, views, likes, comments, shares, saves, reach, media_type, media_product_type, caption], index) => ({
      id: `90570000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      brand_id: BRAND_ID,
      social_account_id: accountId,
      external_post_id: `demo-${published_at.slice(0, 10)}`,
      content_item_id: null,
      published_at,
      captured_at,
      views,
      likes,
      comments,
      shares,
      saves,
      reach,
      media_type,
      media_product_type,
      caption,
      permalink: "https://www.instagram.com/casagomezramirez/",
    }),
  );

  const tiktokAccountId = "50c14000-0000-4000-8000-000000000002";
  const tiktokPosts = TIKTOK_POSTS.map(([published_at, views, caption], index) => ({
    id: `90570000-0000-4000-8000-${String(index + 101).padStart(12, "0")}`,
    brand_id: BRAND_ID,
    social_account_id: tiktokAccountId,
    external_post_id: `demo-tiktok-${published_at.slice(0, 10)}`,
    content_item_id: null,
    published_at,
    captured_at: iso(day(-1)),
    views,
    likes: Math.round(views * 0.082),
    comments: Math.max(1, Math.round(views * 0.006)),
    shares: Math.round(views * 0.015),
    saves: Math.round(views * 0.008),
    reach: Math.round(views * 0.81),
    media_type: "VIDEO",
    media_product_type: "VIDEO",
    caption,
    permalink: "https://www.tiktok.com/@casagomezramirez",
  }));

  const dailyRows = makeDaily(accountId, posts);
  const igSeptember = monthTotals(dailyRows, "2026-09");
  const igOctober = monthTotals(dailyRows, "2026-10");
  const tiktokSeptember = tiktokTotals(tiktokPosts, "2026-09", { followers: 1356, gained: 120, lost: 8 });
  const tiktokOctober = tiktokTotals(tiktokPosts, "2026-10", { followers: 1870, gained: 540, lost: 26 });

  const insights = [
    {
      id: "9d000000-0000-4000-8000-000000000001",
      brand_id: BRAND_ID,
      account_id: accountId,
      period_start: "2026-09-01",
      ...igSeptember,
      posts_count: 9,
      non_follower_views: Math.round(igSeptember.views * 0.48),
      link_clicks: 24,
      audience: IG_AUDIENCE_SEP,
      traffic: {},
      top_searches: ["casa gómez ramírez", "café ibagué", "museos en ibagué"],
      best_hours: ["Sábados 6–8 p. m.", "Domingos 11 a. m.–1 p. m."],
      created_at: iso(day(-32)),
    },
    {
      id: "9d000000-0000-4000-8000-000000000002",
      brand_id: BRAND_ID,
      account_id: accountId,
      period_start: "2026-10-01",
      ...igOctober,
      posts_count: 11,
      non_follower_views: Math.round(igOctober.views * 0.61),
      link_clicks: 37,
      audience: IG_AUDIENCE_OCT,
      traffic: {},
      top_searches: ["casa gómez ramírez", "museos en ibagué", "planes en ibagué", "café de origen"],
      best_hours: ["Sábados 6–8 p. m.", "Domingos 11 a. m.–1 p. m."],
      created_at: iso(day(-1)),
    },
    {
      id: "9d000000-0000-4000-8000-000000000003",
      brand_id: BRAND_ID,
      account_id: tiktokAccountId,
      period_start: "2026-09-01",
      ...tiktokSeptember,
      non_follower_views: Math.round(tiktokSeptember.views * 0.71),
      link_clicks: 9,
      audience: TIKTOK_AUDIENCE,
      traffic: { for_you: 0.652, profile: 0.183, search: 0.165 },
      top_searches: ["casa gomez ramirez", "museo ibagué", "café ibagué"],
      best_hours: ["Sábados 8–9 p. m.", "Domingos 7–8 p. m."],
      created_at: iso(day(-32)),
    },
    {
      id: "9d000000-0000-4000-8000-000000000004",
      brand_id: BRAND_ID,
      account_id: tiktokAccountId,
      period_start: "2026-10-01",
      ...tiktokOctober,
      non_follower_views: Math.round(tiktokOctober.views * 0.78),
      link_clicks: 31,
      audience: TIKTOK_AUDIENCE,
      traffic: { for_you: 0.784, profile: 0.121, search: 0.095 },
      top_searches: ["casa gomez ramirez", "planes en ibagué", "museos en ibagué", "café de origen tolima", "qué hacer en ibagué"],
      best_hours: ["Sábados 8–9 p. m.", "Jueves 9–10 p. m.", "Domingos 7–8 p. m."],
      created_at: iso(day(-1)),
    },
  ];

  const items = ITEMS.map(([id, title, status, caption, scheduled_at, notes, published_url], index) => ({
    id,
    brand_id: BRAND_ID,
    campaign_id: index === 1 || index === 3 ? null : index === 2 ? "ca000000-0000-4000-8000-000000000002" : "ca000000-0000-4000-8000-000000000001",
    title,
    status,
    caption,
    scheduled_at,
    created_by: "Equipo Casa GR",
    notes,
    published_url,
    created_at: iso(day(-20 + index)),
    updated_at: iso(day(-1)),
  }));

  return {
    brands: [brand],
    brand_colors: [
      { id: "c0100000-0000-4000-8000-000000000001", brand_id: BRAND_ID, name: "Verde patio", hex: "#2F4A3E", cmyk: "78 45 60 45", pantone: "350 C", role: "primary", usage_notes: "Color base de la casa. Fondos, titulares y piezas de patrimonio.", position: 0, created_at: iso(day(-80)) },
      { id: "c0100000-0000-4000-8000-000000000002", brand_id: BRAND_ID, name: "Crema cal", hex: "#F3EBDD", cmyk: "4 6 13 0", pantone: "7527 C", role: "neutral", usage_notes: "Fondo principal de las piezas. Deja respirar la fotografía.", position: 1, created_at: iso(day(-80)) },
      { id: "c0100000-0000-4000-8000-000000000003", brand_id: BRAND_ID, name: "Terracota", hex: "#B4552D", cmyk: "30 76 100 12", pantone: "173 C", role: "accent", usage_notes: "Acentos, botones y datos destacados del mes.", position: 2, created_at: iso(day(-80)) },
      { id: "c0100000-0000-4000-8000-000000000004", brand_id: BRAND_ID, name: "Oro viejo", hex: "#C69A4B", cmyk: "22 37 78 3", pantone: "7402 C", role: "support", usage_notes: "Detalles finos: líneas, sellos y numeración de épocas.", position: 3, created_at: iso(day(-80)) },
      { id: "c0100000-0000-4000-8000-000000000005", brand_id: BRAND_ID, name: "Tinta", hex: "#1E2420", cmyk: "72 60 64 70", pantone: "Black 6 C", role: "support", usage_notes: "Texto principal sobre crema.", position: 4, created_at: iso(day(-80)) },
    ],
    brand_fonts: [
      { id: "f0170000-0000-4000-8000-000000000001", brand_id: BRAND_ID, family: "Cormorant Garamond", role: "title", weights: [400, 600, 700], storage_path: null, license_notes: "Google Fonts, licencia OFL.", position: 0, created_at: iso(day(-80)) },
      { id: "f0170000-0000-4000-8000-000000000002", brand_id: BRAND_ID, family: "Inter", role: "body", weights: [400, 500, 600], storage_path: null, license_notes: "Google Fonts, licencia OFL.", position: 1, created_at: iso(day(-80)) },
    ],
    brand_logos: [
      { id: "10600000-0000-4000-8000-000000000001", brand_id: BRAND_ID, variant: "Wordmark principal", storage_path: null, asset_id: "c0000000-0000-4000-8000-000000000004", min_size_px: 160, clear_space_notes: "Dejar libre el ancho de la letra C alrededor del logo.", position: 0, created_at: iso(day(-80)) },
      { id: "10600000-0000-4000-8000-000000000002", brand_id: BRAND_ID, variant: "Monograma GR", storage_path: null, asset_id: "c0000000-0000-4000-8000-000000000005", min_size_px: 40, clear_space_notes: "Para avatares y sellos de redes sociales.", position: 1, created_at: iso(day(-80)) },
    ],
    brand_guidelines: [
      { id: "90100000-0000-4000-8000-000000000001", brand_id: BRAND_ID, section: "voz", title: "Nuestra voz", body_md: "Cercana, curiosa y orgullosa de Ibagué.\n\nHablamos de la casa como lo que es: **la casa de una familia** que abre sus puertas. Nunca como un museo frío ni como un restaurante más.", position: 0, created_at: iso(day(-80)) },
      { id: "90100000-0000-4000-8000-000000000002", brand_id: BRAND_ID, section: "tono", title: "Nuestro tono", body_md: "Cálido y pausado. Contamos con fechas y nombres, sin grandilocuencia.\n\n- Frases cortas.\n- Una idea por pieza.\n- Si hay un dato histórico, va con su año.", position: 1, created_at: iso(day(-80)) },
      { id: "90100000-0000-4000-8000-000000000003", brand_id: BRAND_ID, section: "hacer", title: "Sí hacemos", body_md: "- Nombrar a Samuel Gómez Ramírez y a la familia.\n- Contar el año (1925) y el lugar (Cra 2 #10-36).\n- Invitar a venir, a tomar café, a recorrer.", position: 2, created_at: iso(day(-80)) },
      { id: "90100000-0000-4000-8000-000000000004", brand_id: BRAND_ID, section: "no_hacer", title: "No hacemos", body_md: "- No inventamos historias ni fechas.\n- No usamos lenguaje corporativo.\n- No prometemos experiencias que la casa no ofrece.", position: 3, created_at: iso(day(-80)) },
    ],
    media_assets: [
      { id: "c0000000-0000-4000-8000-000000000001", brand_id: BRAND_ID, name: "campana-octubre.svg", original_path: `${BRAND_ID}/media/demo-campana.svg`, thumb_path: `${BRAND_ID}/thumbs/demo-campana.svg`, mime_type: "image/svg+xml", size_bytes: new Blob([DEMO_ART]).size, width: 1200, height: 1500, duration_seconds: null, status: "en_uso", folder: "Octubre patrimonial", tags: ["campaña", "patrimonio", "octubre"], created_at: iso(day(-40)), updated_at: iso(day(-1)) },
      ...DEMO_VISUALS.map(demoVisualRow),
    ],
    media_comments: [
      { id: uuid(), brand_id: BRAND_ID, asset_id: "c0000000-0000-4000-8000-000000000001", author_name: "Equipo Casa GR", body: "La foto del patio funciona muy bien con la paleta.", parent_id: null, pos_x: 0.65, pos_y: 0.35, video_time_seconds: null, resolved: false, created_at: iso(day(-2)) },
    ],
    caption_bank: [
      { id: "ba000000-0000-4000-8000-000000000001", brand_id: BRAND_ID, platform: "instagram", title: "La casa de 1925", body: "En 1925 esta casa ya miraba a la calle. Hoy abre sus puertas para que la memoria de Ibagué siga respirando. 🗝️", status: "aprobado", uses: 4, tags: ["patrimonio", "historia", "ibague"], created_at: iso(day(-30)) },
      { id: "ba000000-0000-4000-8000-000000000002", brand_id: BRAND_ID, platform: "instagram", title: "Café en el patio", body: "Un café de origen, un patio con historia y la tarde entera por delante.", status: "aprobado", uses: 6, tags: ["cafe", "patio", "plan"], created_at: iso(day(-24)) },
      { id: "ba000000-0000-4000-8000-000000000003", brand_id: BRAND_ID, platform: "instagram", title: "Chisme histórico", body: "Chisme histórico: no todo lo que guarda esta casa está en los libros.", status: "aprobado", uses: 3, tags: ["historia", "serie"], created_at: iso(day(-18)) },
    ],
    hashtag_sets: [
      { id: "4a000000-0000-4000-8000-000000000001", brand_id: BRAND_ID, name: "Patrimonio Ibagué", tags: ["#CasaGómezRamírez", "#Ibagué", "#Patrimonio", "#CentroHistórico"], platform: "instagram", status: "aprobado", created_at: iso(day(-28)) },
      { id: "4a000000-0000-4000-8000-000000000002", brand_id: BRAND_ID, name: "Café y planes", tags: ["#CaféDeOrigen", "#Tolima", "#PlanEnIbagué", "#CaféConHistoria"], platform: "instagram", status: "aprobado", created_at: iso(day(-20)) },
    ],
    cta_bank: [
      { id: "c7a00000-0000-4000-8000-000000000001", brand_id: BRAND_ID, text: "Reserva tu recorrido por la casa.", platform: "instagram", status: "aprobado", created_at: iso(day(-26)) },
      { id: "c7a00000-0000-4000-8000-000000000002", brand_id: BRAND_ID, text: "Ven a tomar café en el patio.", platform: "instagram", status: "aprobado", created_at: iso(day(-22)) },
      { id: "c7a00000-0000-4000-8000-000000000003", brand_id: BRAND_ID, text: "Escríbenos para agendar tu visita.", platform: "instagram", status: "aprobado", created_at: iso(day(-14)) },
    ],
    network_templates: [
      { id: "7e000000-0000-4000-8000-000000000001", brand_id: null, platform: "instagram", template_key: "feed-square", name: "Publicación cuadrada", width: 1080, height: 1080, max_caption: 2200, max_hashtags: 30, notes: "Proporción 1:1", created_at: iso(day(-90)) },
      { id: "7e000000-0000-4000-8000-000000000002", brand_id: null, platform: "instagram", template_key: "feed-portrait", name: "Publicación vertical", width: 1080, height: 1350, max_caption: 2200, max_hashtags: 30, notes: "Proporción 4:5", created_at: iso(day(-90)) },
      { id: "7e000000-0000-4000-8000-000000000003", brand_id: null, platform: "instagram", template_key: "story", name: "Historia / Reel", width: 1080, height: 1920, max_caption: 2200, max_hashtags: 30, notes: "Proporción 9:16", created_at: iso(day(-90)) },
    ],
    campaigns: CAMPAIGNS.map(([id, name, objective, start_date, end_date, status, color, utm_campaign, notes]) => ({ id, brand_id: BRAND_ID, name, objective, start_date, end_date, status, color, utm_campaign, notes, created_at: iso(day(-30)) })),
    brand_events: EVENTS.map(([id, title, kind, event_date, notes]) => ({ id, brand_id: BRAND_ID, title, kind, event_date, notes, created_at: iso(day(-30)) })),
    content_items: items,
    content_item_targets: items.map((item, index) => ({
      id: `7a000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      brand_id: BRAND_ID,
      content_item_id: item.id,
      platform: "instagram",
      template_id: "7e000000-0000-4000-8000-000000000002",
      caption_override: "",
    })),
    content_item_assets: [{ brand_id: BRAND_ID, content_item_id: items[3].id, asset_id: "c0000000-0000-4000-8000-000000000001", position: 0 }],
    content_status_history: [{ id: uuid(), brand_id: BRAND_ID, content_item_id: items[1].id, from_status: "idea", to_status: "borrador", changed_by: "Equipo Casa GR", comment: "Lista para producción", created_at: iso(day(-2)) }],
    content_comments: [{ id: uuid(), brand_id: BRAND_ID, content_item_id: items[1].id, author_name: "Equipo Casa GR", body: "¿Podemos abrir con la foto del patio?", created_at: iso(day(-1)) }],
    reminders: [
      { id: "ae000000-0000-4000-8000-000000000001", brand_id: BRAND_ID, title: "Publicar el reel de los balcones", notes: "Revisar el audio antes de programar.", remind_at: "2026-11-06T13:00:00Z", repeat_rule: "none", kind: "tarea", content_item_id: items[0].id, campaign_id: null, done: false, created_at: iso(day(-3)) },
      { id: "ae000000-0000-4000-8000-000000000002", brand_id: BRAND_ID, title: "Confirmar fecha del mercado de oficios", notes: "Hablar con la familia para cerrar el calendario de diciembre.", remind_at: "2026-11-12T15:00:00Z", repeat_rule: "none", kind: "tarea", content_item_id: null, campaign_id: "ca000000-0000-4000-8000-000000000003", done: false, created_at: iso(day(-2)) },
    ],
    social_accounts: [
      { id: accountId, brand_id: BRAND_ID, platform: "instagram", handle: "casagomezramirez", display_name: "Casa Gómez Ramírez", status: "demo", external_id: null, created_at: iso(day(-90)) },
      { id: tiktokAccountId, brand_id: BRAND_ID, platform: "tiktok", handle: "casagomezramirez", display_name: "Casa Gómez Ramírez", status: "demo", external_id: null, created_at: iso(day(-90)) },
    ],
    social_insights_monthly: insights,
    account_metrics_daily: dailyRows,
    post_metrics_snapshots: [...posts, ...tiktokPosts],
    reports: [
      { id: "4e000000-0000-4000-8000-000000000001", brand_id: BRAND_ID, title: "Reporte mensual · Septiembre 2026", period_start: "2026-09-01", period_end: "2026-09-30", generated_by: "Equipo Casa GR", notes: "Mes de posicionamiento: la serie de chismes históricos fue la que más alcance trajo.", config: { source: "synthetic" }, created_at: iso(day(-32)) },
    ],
  };
}

function readDatabase() {
  try { return JSON.parse(localStorage.getItem(DATABASE_KEY) || "null"); } catch { return null; }
}

export async function initializeLocalData() {
  let db = readDatabase();
  if (!db) { db = makeSeed(); localStorage.setItem(DATABASE_KEY, JSON.stringify(db)); }
  await putFile(`${BRAND_ID}/media/demo-campana.svg`, new Blob([DEMO_ART], { type: "image/svg+xml" }));
  await putFile(`${BRAND_ID}/thumbs/demo-campana.svg`, new Blob([DEMO_ART], { type: "image/svg+xml" }));
  const activeVisualIds = new Set(db.media_assets.filter((asset) => asset.brand_id === BRAND_ID).map((asset) => asset.id));
  for (const visual of DEMO_VISUALS) if (activeVisualIds.has(visual.id)) {
    const blob = new Blob([visual.artwork], { type: "image/svg+xml" });
    await putFile(`${BRAND_ID}/media/${visual.id}.svg`, blob);
    await putFile(`${BRAND_ID}/thumbs/${visual.id}.svg`, blob);
  }
}

function database() {
  const value = readDatabase();
  if (!value) throw new Error("La base local aún no se inicializó.");
  return value;
}

function saveDatabase(value) { localStorage.setItem(DATABASE_KEY, JSON.stringify(value)); }

function openFileDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FILE_DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(FILE_STORE, { keyPath: "path" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putFile(path, blob) {
  const db = await openFileDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(FILE_STORE, "readwrite").objectStore(FILE_STORE).put({ path, blob, type: blob.type });
    request.onsuccess = () => { db.close(); resolve(); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

async function getFile(path) {
  const db = await openFileDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(FILE_STORE).objectStore(FILE_STORE).get(path);
    request.onsuccess = () => { db.close(); resolve(request.result ?? null); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

async function removeFiles(paths) {
  const db = await openFileDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readwrite");
    paths.forEach((path) => tx.objectStore(FILE_STORE).delete(path));
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

function project(row, columns) {
  if (!columns || columns === "*") return row;
  const keys = columns.split(",").map((value) => value.trim()).filter(Boolean);
  return Object.fromEntries(keys.filter((key) => Object.hasOwn(row, key)).map((key) => [key, row[key]]));
}

class LocalQuery {
  constructor(table) { this.table = table; this.action = "select"; this.columns = "*"; this.values = null; this.filters = []; this.orders = []; this.singleMode = null; }
  select(columns = "*") { this.columns = columns; return this; }
  insert(values) { this.action = "insert"; this.values = values; return this; }
  update(values) { this.action = "update"; this.values = values; return this; }
  delete() { this.action = "delete"; return this; }
  upsert(values) { this.action = "upsert"; this.values = values; return this; }
  eq(field, value) { this.filters.push((row) => row[field] === value); return this; }
  neq(field, value) { this.filters.push((row) => row[field] !== value); return this; }
  or(expression) {
    const alternatives = expression.split(",").map((part) => part.trim().split("."));
    this.filters.push((row) => alternatives.some(([field, operator, ...rest]) => operator === "is" ? row[field] == null : row[field] === rest.join(".")));
    return this;
  }
  order(field, options = {}) { this.orders.push([field, options.ascending !== false]); return this; }
  single() { this.singleMode = "single"; return this; }
  maybeSingle() { this.singleMode = "maybe"; return this; }
  then(resolve, reject) { return this.execute().then(resolve, reject); }
  async execute() {
    const db = database();
    const rows = db[this.table] ?? (db[this.table] = []);
    const matches = (row) => this.filters.every((filter) => filter(row));
    let changed = [];
    if (this.action === "select") changed = rows.filter(matches);
    if (this.action === "insert") {
      changed = (Array.isArray(this.values) ? this.values : [this.values]).map((row) => ({ id: uuid(), created_at: iso(new Date()), ...row }));
      rows.push(...changed);
    }
    if (this.action === "update") {
      changed = rows.filter(matches);
      changed.forEach((row) => Object.assign(row, this.values));
    }
    if (this.action === "delete") {
      changed = rows.filter(matches);
      db[this.table] = rows.filter((row) => !matches(row));
    }
    if (this.action === "upsert") {
      const values = Array.isArray(this.values) ? this.values : [this.values];
      changed = values.map((value) => {
        const existing = rows.find((row) => row.id === value.id || (value.account_id && row.account_id === value.account_id && row.metric_date === value.metric_date));
        if (existing) { Object.assign(existing, value); return existing; }
        const row = { id: uuid(), created_at: iso(new Date()), ...value };
        rows.push(row);
        return row;
      });
    }
    saveDatabase(db);
    let result = changed.map((row) => project(row, this.columns));
    for (const [field, ascending] of [...this.orders].reverse()) result.sort((a, b) => String(a[field] ?? "").localeCompare(String(b[field] ?? "")) * (ascending ? 1 : -1));
    if (this.singleMode === "single") return { data: result[0] ?? null, error: result.length === 1 ? null : new Error("Se esperaba exactamente una fila") };
    if (this.singleMode === "maybe") return { data: result[0] ?? null, error: result.length > 1 ? new Error("Se esperaba una fila como máximo") : null };
    return { data: this.action === "delete" ? null : result, error: null };
  }
}

function localStorageBucket() {
  return {
    async upload(path, file, options = {}) {
      const existing = await getFile(path);
      if (existing && !options.upsert) return { data: null, error: new Error("Ya existe un archivo con esa ruta") };
      await putFile(path, file);
      return { data: { path }, error: null };
    },
    async remove(paths) { await removeFiles(paths); return { data: paths.map((path) => ({ name: path })), error: null }; },
    async createSignedUrls(paths) {
      const data = await Promise.all(paths.map(async (path) => {
        const file = await getFile(path);
        return { path, signedUrl: file ? URL.createObjectURL(file.blob) : null, error: file ? null : "Archivo local no encontrado" };
      }));
      return { data, error: null };
    },
  };
}

export function createLocalClient() {
  return {
    isLocal: true,
    from: (table) => new LocalQuery(table),
    storage: { from: () => localStorageBucket() },
    auth: {
      async getSession() { return { data: { session: { user: { id: "local-user" }, access_token: "local-session" } }, error: null }; },
      async signInAnonymously() { return { data: { session: { user: { id: "local-user" }, access_token: "local-session" } }, error: null }; },
      async signOut() { return { error: null }; },
    },
    functions: { async invoke() { return { data: { ok: true }, error: null }; } },
    async rpc(name, args) {
      if (name !== "transition_content_item") return { data: null, error: new Error(`Función local desconocida: ${name}`) };
      const db = database();
      const item = db.content_items.find((row) => row.id === args.p_item_id);
      if (!item) return { data: null, error: new Error("La publicación no existe") };
      const allowed = { idea: ["borrador"], borrador: ["idea", "programado"], programado: ["borrador", "publicado"], publicado: [] };
      if (!allowed[item.status]?.includes(args.p_to_status)) return { data: null, error: new Error("Ese cambio de estado no está permitido") };
      const from_status = item.status;
      item.status = args.p_to_status;
      item.updated_at = iso(new Date());
      db.content_status_history.push({ id: uuid(), brand_id: item.brand_id, content_item_id: item.id, from_status, to_status: item.status, changed_by: localStorage.getItem("marketinghub.local.name") || "Equipo local", comment: args.p_comment || "", created_at: iso(new Date()) });
      saveDatabase(db);
      return { data: null, error: null };
    },
  };
}

export { BRAND_ID as LOCAL_DEMO_BRAND_ID };
