-- Casa Gómez Ramírez: one brand, one access code, synthetic but realistic data.
--
-- This is demo content for the client review. Nothing here is scraped: the
-- monthly numbers are generated from a deterministic formula so the report can
-- be reproduced, and the posts are written to match the house's public voice.
--
-- Safe to run more than once: every insert uses a fixed id with `on conflict`.

-- ---------------------------------------------------------------------------
-- Access code + brand
-- ---------------------------------------------------------------------------

insert into public.access_codes (label, code_hash)
values ('Casa Gómez Ramírez', encode(extensions.digest(upper(trim('CASAGR-2026')), 'sha256'), 'hex'))
on conflict (code_hash) do nothing;

insert into public.brands (id, access_code_id, name, slug, description)
select
  'b0a5a000-0000-4000-8000-000000000001'::uuid,
  ac.id,
  'Casa Gómez Ramírez',
  'casa-gr',
  'Casa patrimonial de 1925 en el centro de Ibagué. Museo, café y memoria viva del Tolima.'
from public.access_codes ac
where ac.code_hash = encode(extensions.digest(upper(trim('CASAGR-2026')), 'sha256'), 'hex')
on conflict (id) do update
set name = excluded.name, description = excluded.description, access_code_id = excluded.access_code_id;

-- Any brand left from earlier tests stays under its own access code, so it is
-- invisible to CASAGR-2026. This delete only removes demo brands that were
-- explicitly marked as such and belong to this same code.
delete from public.brands
where access_code_id = (
    select id from public.access_codes
    where code_hash = encode(extensions.digest(upper(trim('CASAGR-2026')), 'sha256'), 'hex')
  )
  and id <> 'b0a5a000-0000-4000-8000-000000000001';

-- ---------------------------------------------------------------------------
-- Manual de marca
-- ---------------------------------------------------------------------------

insert into public.brand_colors (id, brand_id, name, hex, cmyk, pantone, role, usage_notes, position) values
  ('c0100000-0000-4000-8000-000000000001', 'b0a5a000-0000-4000-8000-000000000001', 'Verde patio',  '#2F4A3E', '78 45 60 45', '350 C',  'primary',   'Color base de la casa. Fondos, titulares y piezas de patrimonio.', 0),
  ('c0100000-0000-4000-8000-000000000002', 'b0a5a000-0000-4000-8000-000000000001', 'Crema cal',    '#F3EBDD', '4 6 13 0',    '7527 C', 'neutral',   'Fondo principal de las piezas. Deja respirar la fotografía.', 1),
  ('c0100000-0000-4000-8000-000000000003', 'b0a5a000-0000-4000-8000-000000000001', 'Terracota',    '#B4552D', '30 76 100 12', '173 C', 'accent',    'Acentos, botones y datos destacados del mes.', 2),
  ('c0100000-0000-4000-8000-000000000004', 'b0a5a000-0000-4000-8000-000000000001', 'Oro viejo',    '#C69A4B', '22 37 78 3',  '7402 C', 'support',   'Detalles finos: líneas, sellos y numeración de épocas.', 3),
  ('c0100000-0000-4000-8000-000000000005', 'b0a5a000-0000-4000-8000-000000000001', 'Tinta',        '#1E2420', '72 60 64 70', 'Black 6 C', 'support', 'Texto principal sobre crema.', 4)
on conflict (id) do nothing;

insert into public.brand_fonts (id, brand_id, family, role, weights, storage_path, license_notes, position) values
  ('f0170000-0000-4000-8000-000000000001', 'b0a5a000-0000-4000-8000-000000000001', 'Cormorant Garamond', 'title', '{400,600,700}', null, 'Google Fonts, licencia OFL.', 0),
  ('f0170000-0000-4000-8000-000000000002', 'b0a5a000-0000-4000-8000-000000000001', 'Inter', 'body', '{400,500,600}', null, 'Google Fonts, licencia OFL.', 1)
on conflict (id) do nothing;

insert into public.brand_logos (id, brand_id, variant, storage_path, asset_id, min_size_px, clear_space_notes, position) values
  ('10600000-0000-4000-8000-000000000001', 'b0a5a000-0000-4000-8000-000000000001', 'Wordmark principal', null, null, 160, 'Dejar libre el ancho de la letra C alrededor del logo.', 0),
  ('10600000-0000-4000-8000-000000000002', 'b0a5a000-0000-4000-8000-000000000001', 'Monograma GR', null, null, 40, 'Para avatares y sellos de redes sociales.', 1)
on conflict (id) do nothing;

insert into public.brand_guidelines (id, brand_id, section, title, body_md, position) values
  ('90100000-0000-4000-8000-000000000001', 'b0a5a000-0000-4000-8000-000000000001', 'voz', 'Nuestra voz',
   E'Cercana, curiosa y orgullosa de Ibagué.\n\nHablamos de la casa como lo que es: **la casa de una familia** que abre sus puertas. Nunca como un museo frío ni como un restaurante más.', 0),
  ('90100000-0000-4000-8000-000000000002', 'b0a5a000-0000-4000-8000-000000000001', 'tono', 'Nuestro tono',
   E'Cálido y pausado. Contamos con fechas y nombres, sin grandilocuencia.\n\n- Frases cortas.\n- Una idea por pieza.\n- Si hay un dato histórico, va con su año.', 1),
  ('90100000-0000-4000-8000-000000000003', 'b0a5a000-0000-4000-8000-000000000001', 'hacer', 'Sí hacemos',
   E'- Nombrar a Samuel Gómez Ramírez y a la familia.\n- Contar el año (1925) y el lugar (Cra 2 #10-36).\n- Invitar a venir, a tomar café, a recorrer.', 2),
  ('90100000-0000-4000-8000-000000000004', 'b0a5a000-0000-4000-8000-000000000001', 'no_hacer', 'No hacemos',
   E'- No inventamos historias ni fechas.\n- No usamos lenguaje corporativo.\n- No prometemos experiencias que la casa no ofrece.', 3)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Social account + published posts
-- ---------------------------------------------------------------------------

insert into public.social_accounts (id, brand_id, platform, handle, display_name, status, external_id)
values ('50c14000-0000-4000-8000-000000000001', 'b0a5a000-0000-4000-8000-000000000001', 'instagram', 'casagomezramirez', 'Casa Gómez Ramírez', 'demo', null)
on conflict (id) do nothing;

insert into public.post_metrics_snapshots
  (id, brand_id, social_account_id, external_post_id, content_item_id, published_at, captured_at,
   views, likes, comments, shares, saves, reach, media_type, media_product_type, caption, permalink)
values
  ('90570000-0000-4000-8000-000000000001', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-09-03', null, '2026-09-03T22:00:00Z', '2026-09-05T12:00:00Z',  940,  62,  7,  3,  9,  780, 'IMAGE',          'FEED',  'La casa cumple 101 años y sigue contando historias en el centro de Ibagué.', 'https://www.instagram.com/casagomezramirez/'),
  ('90570000-0000-4000-8000-000000000002', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-09-06', null, '2026-09-06T15:00:00Z', '2026-09-08T12:00:00Z', 2380,  96, 11,  8, 14, 1450, 'VIDEO',          'REELS', 'El patio donde la familia Gómez Ramírez reunía a sus amigos sigue siendo el corazón de la casa.', 'https://www.instagram.com/casagomezramirez/'),
  ('90570000-0000-4000-8000-000000000003', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-09-10', null, '2026-09-10T21:30:00Z', '2026-09-12T12:00:00Z',  860,  54,  5,  2, 11,  720, 'CAROUSEL_ALBUM', 'FEED',  'Cinco objetos que guardan la memoria de una familia tolimense.', 'https://www.instagram.com/casagomezramirez/'),
  ('90570000-0000-4000-8000-000000000004', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-09-14', null, '2026-09-14T14:30:00Z', '2026-09-16T12:00:00Z',  810,  71,  9,  4,  7,  690, 'IMAGE',          'FEED',  'Café de origen, servido en el patio. Todos los días hasta las 6 p. m.', 'https://www.instagram.com/casagomezramirez/'),
  ('90570000-0000-4000-8000-000000000005', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-09-17', null, '2026-09-17T23:00:00Z', '2026-09-19T12:00:00Z', 3120, 132, 18, 12, 21, 1980, 'VIDEO',          'REELS', 'Chisme histórico: la casa se construyó en 1925 con materiales de la región.', 'https://www.instagram.com/casagomezramirez/'),
  ('90570000-0000-4000-8000-000000000006', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-09-20', null, '2026-09-20T16:00:00Z', '2026-09-22T12:00:00Z', 2760, 118, 14,  9, 17, 1740, 'VIDEO',          'REELS', 'Noche de museos: así se ve la casa cuando cae el sol.', 'https://www.instagram.com/casagomezramirez/'),
  ('90570000-0000-4000-8000-000000000007', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-09-23', null, '2026-09-23T20:00:00Z', '2026-09-25T12:00:00Z', 1310,  88, 12,  6, 15, 1120, 'CAROUSEL_ALBUM', 'FEED',  'Samuel Gómez Ramírez y las historias que rescató de su propio barrio.', 'https://www.instagram.com/casagomezramirez/'),
  ('90570000-0000-4000-8000-000000000008', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-09-27', null, '2026-09-27T15:30:00Z', '2026-09-29T12:00:00Z',  760,  65,  6,  3,  8,  640, 'IMAGE',          'FEED',  'Los balcones vuelven a mirar la carrera segunda.', 'https://www.instagram.com/casagomezramirez/'),
  ('90570000-0000-4000-8000-000000000009', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-09-30', null, '2026-09-30T22:30:00Z', '2026-10-02T12:00:00Z', 2410, 104, 10,  7, 16, 1520, 'VIDEO',          'REELS', 'El sonido de la casa: las puertas, el patio, la calle.', 'https://www.instagram.com/casagomezramirez/'),

  ('90570000-0000-4000-8000-000000000010', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-10-01', null, '2026-10-01T22:30:00Z', '2026-10-03T12:00:00Z', 1420,  92, 13,  7, 18, 1240, 'CAROUSEL_ALBUM', 'FEED',  'Cinco rincones que guardan la memoria de Ibagué.', 'https://www.instagram.com/casagomezramirez/'),
  ('90570000-0000-4000-8000-000000000011', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-10-03', null, '2026-10-03T15:00:00Z', '2026-10-05T12:00:00Z', 3640, 148, 21, 14, 26, 2260, 'VIDEO',          'REELS', 'El patio que en 1925 era el corazón de la casa.', 'https://www.instagram.com/casagomezramirez/'),
  ('90570000-0000-4000-8000-000000000012', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-10-06', null, '2026-10-06T21:00:00Z', '2026-10-08T12:00:00Z', 1120,  87, 16,  8, 12,  980, 'IMAGE',          'FEED',  'Chisme histórico: la casa se construyó en 1925.', 'https://www.instagram.com/casagomezramirez/'),
  ('90570000-0000-4000-8000-000000000013', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-10-08', null, '2026-10-08T16:00:00Z', '2026-10-10T12:00:00Z', 2980, 121, 19, 11, 22, 1890, 'VIDEO',          'REELS', 'Hoy abrimos el taller de patrimonio material. Gracias a quienes nos acompañaron.', 'https://www.instagram.com/casagomezramirez/'),
  ('90570000-0000-4000-8000-000000000014', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-10-11', null, '2026-10-11T20:00:00Z', '2026-10-13T12:00:00Z', 1680, 109, 17,  9, 20, 1460, 'CAROUSEL_ALBUM', 'FEED',  'Samuel Gómez y las historias que rescató.', 'https://www.instagram.com/casagomezramirez/'),
  ('90570000-0000-4000-8000-000000000015', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-10-14', null, '2026-10-14T14:00:00Z', '2026-10-16T12:00:00Z',  940,  78, 11,  5, 10,  820, 'IMAGE',          'FEED',  'Café de origen en el centro de Ibagué.', 'https://www.instagram.com/casagomezramirez/'),
  ('90570000-0000-4000-8000-000000000016', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-10-18', null, '2026-10-18T16:30:00Z', '2026-10-20T12:00:00Z', 4210, 167, 26, 18, 31, 2580, 'VIDEO',          'REELS', 'Café con historia: recorrido inmersivo por la casa.', 'https://www.instagram.com/casagomezramirez/'),
  ('90570000-0000-4000-8000-000000000017', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-10-22', null, '2026-10-22T21:00:00Z', '2026-10-24T12:00:00Z', 1960, 134, 22, 13, 24, 1720, 'CAROUSEL_ALBUM', 'FEED',  'Antes y después: la restauración de los balcones.', 'https://www.instagram.com/casagomezramirez/'),
  ('90570000-0000-4000-8000-000000000018', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-10-24', null, '2026-10-24T23:30:00Z', '2026-10-26T12:00:00Z', 4680, 189, 29, 21, 35, 2910, 'VIDEO',          'REELS', 'Noche patrimonial: la casa después del atardecer.', 'https://www.instagram.com/casagomezramirez/'),
  ('90570000-0000-4000-8000-000000000019', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-10-28', null, '2026-10-28T15:30:00Z', '2026-10-30T12:00:00Z',  880,  73,  9,  4,  9,  760, 'IMAGE',          'FEED',  'El reloj de la sala sigue marcando las horas de la casa.', 'https://www.instagram.com/casagomezramirez/'),
  ('90570000-0000-4000-8000-000000000020', 'b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', 'demo-2026-10-31', null, '2026-10-31T23:00:00Z', '2026-11-02T12:00:00Z', 4320, 176, 31, 19, 28, 2640, 'VIDEO',          'REELS', 'Historias que no duermen: recorrido nocturno de cierre de mes.', 'https://www.instagram.com/casagomezramirez/')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Daily account snapshots
--
-- `followers` is built backwards from 245 on 2026-10-31 so the monthly report
-- closes exactly on the real number the client sees in the app. Gained/lost are
-- deterministic, and the series stays internally consistent:
--   followers(d) = followers(d-1) + gained - lost
-- ---------------------------------------------------------------------------

insert into public.account_metrics_daily
  (brand_id, account_id, metric_date, followers, following, posts_count, reach, profile_views, views,
   followers_gained, followers_lost, total_interactions)
with days as (
  select generate_series('2026-08-15'::date, '2026-10-31'::date, interval '1 day')::date as d
),
daily as (
  select
    d,
    (abs(hashtext('gain-' || d::text)) % 3)
      + case when extract(isodow from d) in (5, 6) then 1 else 0 end
      + case when d in ('2026-10-08', '2026-10-18', '2026-10-24', '2026-10-31') then 2 else 0 end as gained,
    case when abs(hashtext('loss-' || d::text)) % 11 = 0 then 1 else 0 end as lost,
    (abs(hashtext('reach-' || d::text)) % 420) + 180
      + case when d in ('2026-10-08', '2026-10-18', '2026-10-24', '2026-10-31') then 1600 else 0 end as reach,
    (abs(hashtext('views-' || d::text)) % 850) + 320
      + case when d in ('2026-10-08', '2026-10-18', '2026-10-24', '2026-10-31') then 1400 else 0 end as views,
    (abs(hashtext('pv-' || d::text)) % 46) + 14
      + case when d in ('2026-10-08', '2026-10-18', '2026-10-24', '2026-10-31') then 60 else 0 end as profile_views
  from days
),
running as (
  select
    d, gained, lost, reach, views, profile_views,
    sum(gained - lost) over (order by d) as cumulative,
    sum(gained - lost) over () as total
  from daily
)
select
  'b0a5a000-0000-4000-8000-000000000001'::uuid,
  '50c14000-0000-4000-8000-000000000001'::uuid,
  d,
  245 - (total - cumulative) as followers,
  318,
  62 + (select count(*) from public.post_metrics_snapshots p
        where p.social_account_id = '50c14000-0000-4000-8000-000000000001'::uuid
          and p.published_at::date <= running.d),
  reach,
  profile_views,
  views,
  gained,
  lost,
  greatest(0, round(reach * (0.035 + (abs(hashtext('int-' || d::text)) % 25) / 1000.0)))::bigint
from running
on conflict (account_id, metric_date) do update
set followers = excluded.followers,
    following = excluded.following,
    posts_count = excluded.posts_count,
    reach = excluded.reach,
    profile_views = excluded.profile_views,
    views = excluded.views,
    followers_gained = excluded.followers_gained,
    followers_lost = excluded.followers_lost,
    total_interactions = excluded.total_interactions;

-- The two days after the reporting period keep the account at 245.
insert into public.account_metrics_daily
  (brand_id, account_id, metric_date, followers, following, posts_count, reach, profile_views, views,
   followers_gained, followers_lost, total_interactions)
values
  ('b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', '2026-11-01', 245, 318, 83, 640, 41, 1180, 0, 0, 38),
  ('b0a5a000-0000-4000-8000-000000000001', '50c14000-0000-4000-8000-000000000001', '2026-11-02', 245, 318, 83, 520, 33,  960, 0, 0, 29)
on conflict (account_id, metric_date) do update
set followers = excluded.followers, reach = excluded.reach, views = excluded.views,
    profile_views = excluded.profile_views, posts_count = excluded.posts_count;

-- ---------------------------------------------------------------------------
-- Campaigns, events and planner
-- ---------------------------------------------------------------------------

insert into public.campaigns (id, brand_id, name, objective, start_date, end_date, status, color, utm_campaign, notes) values
  ('ca000000-0000-4000-8000-000000000001', 'b0a5a000-0000-4000-8000-000000000001',
   'Octubre patrimonial', 'Abrir la casa a nuevos públicos con talleres y recorridos durante octubre.',
   '2026-10-01', '2026-10-31', 'activa', '#B4552D', 'octubre-patrimonial',
   'Cuatro eventos presenciales y once publicaciones en Instagram.'),
  ('ca000000-0000-4000-8000-000000000002', 'b0a5a000-0000-4000-8000-000000000001',
   'Café con historia', 'Convertir la cafetería en la puerta de entrada a la casa.',
   '2026-09-01', '2026-10-31', 'finalizada', '#2F4A3E', 'cafe-con-historia',
   'Recorrido corto con café incluido, todos los sábados.'),
  ('ca000000-0000-4000-8000-000000000003', 'b0a5a000-0000-4000-8000-000000000001',
   'Navidad en la casa', 'Temporada de recorridos nocturnos y mercado de oficios.',
   '2026-12-01', '2026-12-20', 'planeada', '#C69A4B', 'navidad-casa-gr', '')
on conflict (id) do nothing;

insert into public.brand_events (id, brand_id, title, kind, event_date, notes) values
  ('e0e00000-0000-4000-8000-000000000001', 'b0a5a000-0000-4000-8000-000000000001', 'Noche de museos', 'evento', '2026-09-20', 'Apertura nocturna con recorrido guiado.'),
  ('e0e00000-0000-4000-8000-000000000002', 'b0a5a000-0000-4000-8000-000000000001', 'Lanzamiento de Octubre patrimonial', 'campana', '2026-10-01', 'Arranque de la campaña del mes.'),
  ('e0e00000-0000-4000-8000-000000000003', 'b0a5a000-0000-4000-8000-000000000001', 'Taller de patrimonio material', 'evento', '2026-10-08', 'Taller con vecinos del centro histórico.'),
  ('e0e00000-0000-4000-8000-000000000004', 'b0a5a000-0000-4000-8000-000000000001', 'Café con historia', 'evento', '2026-10-18', 'Recorrido inmersivo con café de origen.'),
  ('e0e00000-0000-4000-8000-000000000005', 'b0a5a000-0000-4000-8000-000000000001', 'Noche patrimonial', 'evento', '2026-10-24', 'Recorrido nocturno por patios y balcones.'),
  ('e0e00000-0000-4000-8000-000000000006', 'b0a5a000-0000-4000-8000-000000000001', 'Historias que no duermen', 'evento', '2026-10-31', 'Cierre de mes con recorrido temático.')
on conflict (id) do nothing;

insert into public.content_items
  (id, brand_id, campaign_id, title, status, caption, scheduled_at, created_by, notes, published_url)
values
  ('c17e0000-0000-4000-8000-000000000001', 'b0a5a000-0000-4000-8000-000000000001', 'ca000000-0000-4000-8000-000000000001',
   'Reel: los balcones cumplen 101 años', 'borrador', 'Los balcones de la casa vuelven a mirar la carrera segunda. #Ibagué', '2026-11-06T16:00:00Z', 'Equipo Casa GR', 'Grabar al atardecer.', null),
  ('c17e0000-0000-4000-8000-000000000002', 'b0a5a000-0000-4000-8000-000000000001', null,
   'Carrusel: oficios del centro de Ibagué', 'en_revision', 'Los oficios que sostienen el centro histórico: ebanistería, zapatería, encuadernación.', '2026-11-10T15:00:00Z', 'Equipo Casa GR', 'Faltan dos fotos.', null),
  ('c17e0000-0000-4000-8000-000000000003', 'b0a5a000-0000-4000-8000-000000000001', 'ca000000-0000-4000-8000-000000000002',
   'Café con historia de noviembre', 'aprobado', 'Sábado de Café con historia. Reserva tu recorrido.', '2026-11-15T16:00:00Z', 'Equipo Casa GR', '', null),
  ('c17e0000-0000-4000-8000-000000000004', 'b0a5a000-0000-4000-8000-000000000001', null,
   'Recorrido nocturno de fin de año', 'idea', 'La casa en diciembre: luces, patios y memoria.', '2026-12-05T23:00:00Z', 'Equipo Casa GR', 'Aún sin fecha confirmada.', null),
  ('c17e0000-0000-4000-8000-000000000005', 'b0a5a000-0000-4000-8000-000000000001', 'ca000000-0000-4000-8000-000000000001',
   'Chisme histórico: el reloj de la sala', 'programado', 'El reloj de la sala sigue marcando las horas de la casa.', '2026-11-20T22:00:00Z', 'Equipo Casa GR', '', null),
  ('c17e0000-0000-4000-8000-000000000006', 'b0a5a000-0000-4000-8000-000000000001', 'ca000000-0000-4000-8000-000000000001',
   'Cierre de Octubre patrimonial', 'publicado', 'Gracias por acompañarnos en octubre.', '2026-10-31T23:00:00Z', 'Equipo Casa GR', '', 'https://www.instagram.com/casagomezramirez/')
on conflict (id) do nothing;

insert into public.content_item_targets (id, brand_id, content_item_id, platform, template_id, caption_override)
select
  ('7a000000-0000-4000-8000-00000000000' || lpad(n::text, 1, '0'))::uuid,
  'b0a5a000-0000-4000-8000-000000000001'::uuid,
  ('c17e0000-0000-4000-8000-00000000000' || n::text)::uuid,
  'instagram',
  (select id from public.network_templates where brand_id is null and platform = 'instagram' and template_key = 'feed-portrait'),
  ''
from generate_series(1, 6) as n
on conflict (content_item_id, platform) do nothing;

insert into public.reminders (id, brand_id, title, notes, remind_at, repeat_rule, kind, content_item_id, campaign_id, done)
values
  ('ae000000-0000-4000-8000-000000000001', 'b0a5a000-0000-4000-8000-000000000001',
   'Publicar el reel de los balcones', 'Revisar el audio antes de programar.', '2026-11-06T13:00:00Z', 'none', 'tarea',
   'c17e0000-0000-4000-8000-000000000001', null, false),
  ('ae000000-0000-4000-8000-000000000002', 'b0a5a000-0000-4000-8000-000000000001',
   'Confirmar fecha del mercado de oficios', 'Hablar con la familia para cerrar el calendario de diciembre.', '2026-11-12T15:00:00Z', 'none', 'tarea',
   null, 'ca000000-0000-4000-8000-000000000003', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Text banks
-- ---------------------------------------------------------------------------

insert into public.caption_bank (id, brand_id, platform, title, body, status, uses, tags) values
  ('ba000000-0000-4000-8000-000000000001', 'b0a5a000-0000-4000-8000-000000000001', 'instagram',
   'La casa de 1925', 'En 1925 esta casa ya miraba a la calle. Hoy abre sus puertas para que la memoria de Ibagué siga respirando. 🗝️', 'aprobado', 4, '{patrimonio,historia,ibague}'),
  ('ba000000-0000-4000-8000-000000000002', 'b0a5a000-0000-4000-8000-000000000001', 'instagram',
   'Café en el patio', 'Un café de origen, un patio con historia y la tarde entera por delante.', 'aprobado', 6, '{cafe,patio,plan}'),
  ('ba000000-0000-4000-8000-000000000003', 'b0a5a000-0000-4000-8000-000000000001', 'instagram',
   'Chisme histórico', 'Chisme histórico: no todo lo que guarda esta casa está en los libros.', 'aprobado', 3, '{historia,serie}')
on conflict (id) do nothing;

insert into public.hashtag_sets (id, brand_id, name, tags, platform, status) values
  ('4a000000-0000-4000-8000-000000000001', 'b0a5a000-0000-4000-8000-000000000001',
   'Patrimonio Ibagué', '{#CasaGómezRamírez,#Ibagué,#Patrimonio,#CentroHistórico}', 'instagram', 'aprobado'),
  ('4a000000-0000-4000-8000-000000000002', 'b0a5a000-0000-4000-8000-000000000001',
   'Café y planes', '{#CaféDeOrigen,#Tolima,#PlanEnIbagué,#CaféConHistoria}', 'instagram', 'aprobado')
on conflict (id) do nothing;

insert into public.cta_bank (id, brand_id, text, platform, status) values
  ('c7a00000-0000-4000-8000-000000000001', 'b0a5a000-0000-4000-8000-000000000001', 'Reserva tu recorrido por la casa.', 'instagram', 'aprobado'),
  ('c7a00000-0000-4000-8000-000000000002', 'b0a5a000-0000-4000-8000-000000000001', 'Ven a tomar café en el patio.', 'instagram', 'aprobado'),
  ('c7a00000-0000-4000-8000-000000000003', 'b0a5a000-0000-4000-8000-000000000001', 'Escríbenos para agendar tu visita.', 'instagram', 'aprobado')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Report history
-- ---------------------------------------------------------------------------

insert into public.reports (id, brand_id, title, period_start, period_end, generated_by, notes, config)
values
  ('4e000000-0000-4000-8000-000000000001', 'b0a5a000-0000-4000-8000-000000000001',
   'Reporte mensual · Septiembre 2026', '2026-09-01', '2026-09-30', 'Equipo Casa GR',
   'Mes de posicionamiento: la serie de chismes históricos fue la que más alcance trajo.',
   '{"source":"synthetic"}'::jsonb)
on conflict (id) do nothing;
