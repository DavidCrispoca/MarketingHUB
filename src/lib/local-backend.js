const DATABASE_KEY = "marketinghub.local.database.v1";
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
const uuid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const DEMO_ART = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#f4c66a"/><stop offset="1" stop-color="#df704e"/></linearGradient></defs><rect width="1200" height="1500" fill="#f7eee1"/><circle cx="830" cy="510" r="360" fill="url(#g)"/><path d="M170 980c210-230 420-170 620-20s300 160 470-30v570H170z" fill="#30483a"/><text x="100" y="180" fill="#30483a" font-family="sans-serif" font-size="42" letter-spacing="10">CAFÉ DEL VALLE</text><text x="100" y="1270" fill="white" font-family="sans-serif" font-weight="700" font-size="82">Un origen</text><text x="100" y="1360" fill="white" font-family="sans-serif" font-size="82">que se disfruta.</text></svg>`;
const DEMO_STORY_ART = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><rect width="1080" height="1920" fill="#30483a"/><circle cx="540" cy="720" r="350" fill="#df704e"/><path d="M540 420c-165 165-205 280-124 360 54 54 117 32 124 28 7 4 70 26 124-28 81-80 41-195-124-360z" fill="#f7eee1"/><path d="M540 522c-62 105-68 202 0 283" fill="none" stroke="#30483a" stroke-width="22" stroke-linecap="round"/><text x="84" y="150" fill="#f7eee1" font-family="sans-serif" font-size="30" letter-spacing="9">CAFÉ DEL VALLE · HISTORIAS DE ORIGEN</text><text x="84" y="1260" fill="#f7eee1" font-family="Georgia,serif" font-size="98">Cada cosecha</text><text x="84" y="1380" fill="#f7eee1" font-family="Georgia,serif" font-size="98">tiene su ritmo.</text><path d="M84 1460h245" stroke="#df704e" stroke-width="8"/><text x="84" y="1540" fill="#f7eee1" font-family="sans-serif" font-size="35">Nariño, Colombia · Temporada 2026</text></svg>`;
const DEMO_CAROUSEL_ART = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500"><rect width="1200" height="1500" fill="#f7eee1"/><path d="M0 1060C270 860 460 1120 700 980s350-100 500-10v530H0z" fill="#30483a"/><circle cx="790" cy="570" r="260" fill="#df704e"/><circle cx="790" cy="570" r="190" fill="#f4c66a"/><path d="M790 410c-92 92-114 156-69 201 30 30 65 18 69 15 4 3 39 15 69-15 45-45 23-109-69-201z" fill="#30483a"/><path d="M790 470c-34 58-38 112 0 156" fill="none" stroke="#f7eee1" stroke-width="12" stroke-linecap="round"/><text x="82" y="140" fill="#30483a" font-family="sans-serif" font-size="30" letter-spacing="8">FICHA DE ORIGEN · LOTE 08</text><text x="82" y="1240" fill="#f7eee1" font-family="Georgia,serif" font-size="85">De la finca</text><text x="82" y="1340" fill="#f7eee1" font-family="Georgia,serif" font-size="85">a tu mesa.</text></svg>`;
const DEMO_WORDMARK = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360"><g fill="none" stroke="#30483a" stroke-width="12"><path d="M150 92c-88 96-88 176 0 176s88-80 0-176z"/><path d="M150 119v122"/><path d="M150 174c-35-29-52-55-51-82 35 9 58 40 51 82z"/></g><text x="290" y="177" fill="#30483a" font-family="Georgia,serif" font-size="94">Café del Valle</text><text x="300" y="244" fill="#6b756a" font-family="sans-serif" font-size="26" letter-spacing="11">ORIGEN · NARIÑO · COLOMBIA</text></svg>`;
const DEMO_MONOGRAM = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640"><rect x="32" y="32" width="576" height="576" rx="128" fill="#30483a"/><path d="M320 142c-132 144-132 264 0 264s132-120 0-264z" fill="#f7eee1"/><path d="M320 181v183" fill="none" stroke="#df704e" stroke-width="18" stroke-linecap="round"/><path d="M320 262c-50-42-74-79-72-118 51 14 85 58 72 118z" fill="#df704e"/></svg>`;
const DEMO_VISUALS = [
  { id: "c0000000-0000-4000-8000-000000000002", name: "01-ficha-lote-08.svg", artwork: DEMO_CAROUSEL_ART, folder: "Historias de origen", tags: ["origen", "carrusel", "Nariño"], width: 1200, height: 1500, date: -3 },
  { id: "c0000000-0000-4000-8000-000000000003", name: "02-historia-cosecha.svg", artwork: DEMO_STORY_ART, folder: "Historias de origen", tags: ["cosecha", "story", "temporada"], width: 1080, height: 1920, date: -2 },
  { id: "c0000000-0000-4000-8000-000000000004", name: "logo-wordmark.svg", artwork: DEMO_WORDMARK, folder: "Identidad visual", tags: ["logo", "identidad", "principal"], width: 1200, height: 360, date: -50 },
  { id: "c0000000-0000-4000-8000-000000000005", name: "logo-monograma.svg", artwork: DEMO_MONOGRAM, folder: "Identidad visual", tags: ["logo", "identidad", "símbolo"], width: 640, height: 640, date: -50 },
];
const demoVisualRow = (visual) => ({ id: visual.id, brand_id: BRAND_ID, name: visual.name, original_path: `${BRAND_ID}/media/${visual.id}.svg`, thumb_path: `${BRAND_ID}/thumbs/${visual.id}.svg`, mime_type: "image/svg+xml", size_bytes: new Blob([visual.artwork]).size, width: visual.width, height: visual.height, duration_seconds: null, status: "pendiente", folder: visual.folder, tags: visual.tags, created_at: iso(day(visual.date)), updated_at: iso(day(visual.date)) });

function makeSeed() {
  const brand = { id: BRAND_ID, access_code_id: WORKSPACE_ID, name: "Café del Valle", slug: "cafe-del-valle", description: "Café de origen, historias de finca y momentos para compartir.", created_at: iso(day(-60)), updated_at: iso(day(-2)) };
  const accountIg = "a0000000-0000-4000-8000-000000000001";
  const accountTt = "a0000000-0000-4000-8000-000000000002";
  const assetId = "c0000000-0000-4000-8000-000000000001";
  const items = [
    ["Idea", "idea", 3], ["Carrusel: del grano a la taza", "borrador", 1], ["Reel de cosecha", "en_revision", 2],
    ["Origen Nariño", "aprobado", 4], ["Lanzamiento temporada", "programado", 6], ["Ritual de la mañana", "publicado", -3],
  ].map(([title, status, offset], index) => ({ id: `d0000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`, brand_id: BRAND_ID, title, status, caption: `${title}: conoce el origen de nuestro café y acompáñanos en cada taza.`, scheduled_at: iso(day(offset)), campaign_id: "e0000000-0000-4000-8000-000000000001", notes: index === 2 ? "Revisar el cierre del video" : "", published_url: status === "publicado" ? "https://instagram.com/" : null, created_at: iso(day(-12 + index)), updated_at: iso(day(-1)) }));
  const daily = Array.from({ length: 14 }, (_, index) => {
    const metricDay = day(index - 13);
    return [accountIg, accountTt].map((account_id, network) => ({ id: `${account_id}-${metricDay.toISOString().slice(0, 10)}`, brand_id: BRAND_ID, account_id, metric_date: metricDay.toISOString().slice(0, 10), followers: 4280 + index * (network ? 11 : 17), following: 320, posts_count: 86 + Math.floor(index / 4), reach: 1100 + ((index * 337 + network * 251) % 1700), profile_views: 170 + ((index * 41) % 130), views: 1900 + ((index * 593 + network * 340) % 3200) }));
  }).flat();
  return {
    brands: [brand],
    brand_colors: [
      { id: uuid(), brand_id: BRAND_ID, name: "Verde finca", hex: "#30483A", role: "primary", position: 0, created_at: iso(day(-50)) },
      { id: uuid(), brand_id: BRAND_ID, name: "Crema", hex: "#F7EEE1", role: "neutral", position: 1, created_at: iso(day(-50)) },
      { id: uuid(), brand_id: BRAND_ID, name: "Cosecha", hex: "#DF704E", role: "accent", position: 2, created_at: iso(day(-50)) },
    ],
    brand_fonts: [{ id: uuid(), brand_id: BRAND_ID, family: "Jost", role: "body", weights: [400, 600, 700], position: 0, created_at: iso(day(-50)), storage_path: null }],
    brand_logos: [
      { id: "f0000000-0000-4000-8000-000000000001", brand_id: BRAND_ID, variant: "Wordmark principal", storage_path: null, asset_id: "c0000000-0000-4000-8000-000000000004", min_size_px: 150, clear_space_notes: "Usar sobre fondos claros y dejar aire alrededor.", position: 0, created_at: iso(day(-50)) },
      { id: "f0000000-0000-4000-8000-000000000002", brand_id: BRAND_ID, variant: "Isotipo", storage_path: null, asset_id: "c0000000-0000-4000-8000-000000000005", min_size_px: 28, clear_space_notes: "Para avatares, sellos y espacios cuadrados.", position: 1, created_at: iso(day(-50)) },
    ],
    brand_guidelines: [{ id: uuid(), brand_id: BRAND_ID, section: "voz", title: "Nuestra voz", body_md: "Cercana, curiosa y orgullosa de su origen.\n\n**Hablamos** de personas, territorio y sabor con calidez.", position: 0, created_at: iso(day(-45)) }, { id: uuid(), brand_id: BRAND_ID, section: "hacer", title: "Sí hacemos", body_md: "- Nombramos las fincas y a quienes cultivan.\n- Compartimos datos de origen claros.", position: 1, created_at: iso(day(-45)) }],
    media_assets: [{ id: assetId, brand_id: BRAND_ID, name: "campana-origen.svg", original_path: `${BRAND_ID}/media/demo-campana.svg`, thumb_path: `${BRAND_ID}/thumbs/demo-campana.svg`, mime_type: "image/svg+xml", size_bytes: new Blob([DEMO_ART]).size, width: 1200, height: 1500, duration_seconds: null, status: "en_uso", folder: "Campaña de origen", tags: ["origen", "café", "campaña"], created_at: iso(day(-4)), updated_at: iso(day(-1)) }, ...DEMO_VISUALS.map(demoVisualRow)],
    media_comments: [{ id: uuid(), brand_id: BRAND_ID, asset_id: assetId, author_name: "Valentina", body: "El tono del fondo funciona muy bien con la paleta.", parent_id: null, pos_x: 0.69, pos_y: 0.35, video_time_seconds: null, resolved: false, created_at: iso(day(-2)) }, { id: uuid(), brand_id: BRAND_ID, asset_id: assetId, author_name: "Mateo", body: "De acuerdo, lo dejamos así.", parent_id: null, pos_x: null, pos_y: null, video_time_seconds: null, resolved: true, created_at: iso(day(-1)) }],
    caption_bank: [{ id: uuid(), brand_id: BRAND_ID, title: "Desde la finca", body: "Cada taza guarda el cuidado de una finca y el carácter de nuestra tierra. ¿Ya probaste café de origen?", platform: "instagram", status: "aprobado", tags: ["origen", "marca"], created_at: iso(day(-9)) }, { id: uuid(), brand_id: BRAND_ID, title: "Pausa de café", body: "Haz una pausa. El café de hoy viene de muy cerca.", platform: "tiktok", status: "borrador", tags: ["rutina"], created_at: iso(day(-3)) }],
    hashtag_sets: [{ id: uuid(), brand_id: BRAND_ID, name: "Origen colombiano", tags: ["#CafeColombiano", "#CafeDeOrigen", "#Nariño"], platform: "instagram", status: "aprobado", created_at: iso(day(-8)) }],
    cta_bank: [{ id: uuid(), brand_id: BRAND_ID, text: "Descubre tu próximo café favorito", platform: "instagram", status: "aprobado", created_at: iso(day(-7)) }],
    network_templates: [
      { id: uuid(), brand_id: null, platform: "instagram", name: "Post vertical", width: 1080, height: 1350, max_caption: 2200, max_hashtags: 30, created_at: iso(day(-30)) },
      { id: uuid(), brand_id: null, platform: "instagram", name: "Reel", width: 1080, height: 1920, max_caption: 2200, max_hashtags: 30, created_at: iso(day(-30)) },
      { id: uuid(), brand_id: null, platform: "tiktok", name: "Video vertical", width: 1080, height: 1920, max_caption: 2200, max_hashtags: 10, created_at: iso(day(-30)) },
    ],
    campaigns: [{ id: "e0000000-0000-4000-8000-000000000001", brand_id: BRAND_ID, name: "Historias de origen", objective: "Dar a conocer a las fincas productoras", start_date: day(-8).toISOString().slice(0, 10), end_date: day(24).toISOString().slice(0, 10), status: "activa", color: "#DF704E", notes: "Temporada de cosecha", created_at: iso(day(-8)) }],
    content_items: items,
    content_item_targets: items.flatMap((item, index) => [{ id: uuid(), brand_id: BRAND_ID, content_item_id: item.id, platform: "instagram", template_id: null, caption_override: "" }, ...(index % 2 ? [{ id: uuid(), brand_id: BRAND_ID, content_item_id: item.id, platform: "tiktok", template_id: null, caption_override: "" }] : [])]),
    content_item_assets: [{ id: uuid(), brand_id: BRAND_ID, content_item_id: items[3].id, asset_id: assetId, position: 0 }],
    content_status_history: [{ id: uuid(), brand_id: BRAND_ID, content_item_id: items[2].id, from_status: "borrador", to_status: "en_revision", changed_by: "Valentina", comment: "Lista para revisión", created_at: iso(day(-2)) }],
    content_comments: [{ id: uuid(), brand_id: BRAND_ID, content_item_id: items[2].id, author_name: "Mateo", body: "¿Podemos mostrar la finca al inicio?", created_at: iso(day(-1)) }],
    reminders: [{ id: uuid(), brand_id: BRAND_ID, title: "Publicar historia de cosecha", notes: "Confirmar hora con el equipo", remind_at: iso(day(1)), repeat_rule: "none", kind: "tarea", done: false, created_at: iso(day(-2)) }],
    social_accounts: [{ id: accountIg, brand_id: BRAND_ID, platform: "instagram", handle: "cafedelvalle", display_name: "Café del Valle", status: "demo", created_at: iso(day(-30)) }, { id: accountTt, brand_id: BRAND_ID, platform: "tiktok", handle: "cafedelvalle.co", display_name: "Café del Valle", status: "demo", created_at: iso(day(-29)) }],
    account_metrics_daily: daily,
    post_metrics_snapshots: [0, 1, 2, 3].map((index) => ({ id: uuid(), brand_id: BRAND_ID, social_account_id: index % 2 ? accountTt : accountIg, content_item_id: items[5 - index].id, external_post_id: `demo-${index + 1}`, published_at: iso(new Date(day(-2 - index * 3).setHours(8 + index * 2))), captured_at: iso(day(-1)), views: 1900 + index * 500, likes: 110 + index * 31, comments: 8 + index * 2, shares: 12 + index * 4, saves: 18 + index * 5, reach: 1200 + index * 430 })),
  };
}

function readDatabase() {
  try { return JSON.parse(localStorage.getItem(DATABASE_KEY) || "null"); } catch { return null; }
}

export async function initializeLocalData() {
  let db = readDatabase();
  if (!db) { db = makeSeed(); localStorage.setItem(DATABASE_KEY, JSON.stringify(db)); }
  if (!db.local_demo_fixtures_version) {
    for (const visual of DEMO_VISUALS) if (!db.media_assets.some((asset) => asset.id === visual.id)) db.media_assets.push(demoVisualRow(visual));
    const logos = [
      { id: "f0000000-0000-4000-8000-000000000001", brand_id: BRAND_ID, variant: "Wordmark principal", storage_path: null, asset_id: "c0000000-0000-4000-8000-000000000004", min_size_px: 150, clear_space_notes: "Usar sobre fondos claros y dejar aire alrededor.", position: 0, created_at: iso(day(-50)) },
      { id: "f0000000-0000-4000-8000-000000000002", brand_id: BRAND_ID, variant: "Isotipo", storage_path: null, asset_id: "c0000000-0000-4000-8000-000000000005", min_size_px: 28, clear_space_notes: "Para avatares, sellos y espacios cuadrados.", position: 1, created_at: iso(day(-50)) },
    ];
    db.brand_logos ??= [];
    for (const logo of logos) if (!db.brand_logos.some((row) => row.id === logo.id)) db.brand_logos.push(logo);
    db.local_demo_fixtures_version = 1;
    saveDatabase(db);
  }
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
      const allowed = { idea: ["borrador"], borrador: ["idea", "en_revision"], en_revision: ["borrador", "aprobado"], aprobado: ["borrador", "programado"], programado: ["aprobado", "publicado"], publicado: [] };
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
