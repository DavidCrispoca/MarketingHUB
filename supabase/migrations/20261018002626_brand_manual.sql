-- Brand manual: the identity of a brand in one place.
--   colors     -> palette with hex/rgb/cmyk/pantone and usage notes
--   fonts      -> typography, with the woff2 file kept in Storage
--   logos      -> logo variants with minimum size and clear space
--   guidelines -> voice and tone, as markdown sections
--
-- There are no roles in this project: a session that can see the brand can
-- also edit its manual. RLS still keeps brands isolated from each other.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.brand_colors (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  name text not null,
  hex text not null,
  -- RGB is derived from hex, so the two can never disagree.
  r smallint generated always as ((('x' || substr(hex, 2, 2))::bit(8)::int)) stored,
  g smallint generated always as ((('x' || substr(hex, 4, 2))::bit(8)::int)) stored,
  b smallint generated always as ((('x' || substr(hex, 6, 2))::bit(8)::int)) stored,
  cmyk text,
  pantone text,
  role text not null default 'support',
  usage_notes text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint brand_colors_hex_format check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  constraint brand_colors_role check (role in ('primary', 'secondary', 'accent', 'neutral', 'support')),
  constraint brand_colors_name_length check (char_length(name) between 1 and 60),
  constraint brand_colors_usage_notes_length check (usage_notes is null or char_length(usage_notes) <= 400),
  constraint brand_colors_cmyk_length check (cmyk is null or char_length(cmyk) <= 40),
  constraint brand_colors_pantone_length check (pantone is null or char_length(pantone) <= 40)
);

create table public.brand_fonts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  family text not null,
  role text not null default 'body',
  weights int[] not null default '{}',
  storage_path text,
  license_notes text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint brand_fonts_role check (role in ('title', 'body', 'accent')),
  constraint brand_fonts_family_length check (char_length(family) between 1 and 80),
  constraint brand_fonts_license_notes_length check (license_notes is null or char_length(license_notes) <= 400)
);

create table public.brand_logos (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  variant text not null,
  storage_path text,
  min_size_px int,
  clear_space_notes text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint brand_logos_variant_length check (char_length(variant) between 1 and 60),
  constraint brand_logos_min_size check (min_size_px is null or min_size_px > 0),
  constraint brand_logos_clear_space_notes_length check (clear_space_notes is null or char_length(clear_space_notes) <= 400)
);

create table public.brand_guidelines (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  section text not null default 'otro',
  title text not null,
  body_md text not null default '',
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint brand_guidelines_section check (section in ('voz', 'tono', 'hacer', 'no_hacer', 'otro')),
  constraint brand_guidelines_title_length check (char_length(title) between 1 and 120),
  constraint brand_guidelines_body_length check (char_length(body_md) <= 8000)
);

create index brand_colors_brand_id_idx on public.brand_colors (brand_id);
create index brand_fonts_brand_id_idx on public.brand_fonts (brand_id);
create index brand_logos_brand_id_idx on public.brand_logos (brand_id);
create index brand_guidelines_brand_id_idx on public.brand_guidelines (brand_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.brand_colors enable row level security;
alter table public.brand_fonts enable row level security;
alter table public.brand_logos enable row level security;
alter table public.brand_guidelines enable row level security;

-- One policy per table: whoever can see the brand can read and write its
-- manual. `has_access` is evaluated once per query through the sub-select.
create policy brand_colors_access on public.brand_colors
  for all to authenticated
  using ((select private.has_access(brand_id)))
  with check ((select private.has_access(brand_id)));

create policy brand_fonts_access on public.brand_fonts
  for all to authenticated
  using ((select private.has_access(brand_id)))
  with check ((select private.has_access(brand_id)));

create policy brand_logos_access on public.brand_logos
  for all to authenticated
  using ((select private.has_access(brand_id)))
  with check ((select private.has_access(brand_id)));

create policy brand_guidelines_access on public.brand_guidelines
  for all to authenticated
  using ((select private.has_access(brand_id)))
  with check ((select private.has_access(brand_id)));

-- ---------------------------------------------------------------------------
-- Privileges — Supabase grants everything by default, TRUNCATE included.
-- ---------------------------------------------------------------------------

revoke all on table public.brand_colors from anon, authenticated;
revoke all on table public.brand_fonts from anon, authenticated;
revoke all on table public.brand_logos from anon, authenticated;
revoke all on table public.brand_guidelines from anon, authenticated;

grant select, insert, update, delete on table public.brand_colors to authenticated;
grant select, insert, update, delete on table public.brand_fonts to authenticated;
grant select, insert, update, delete on table public.brand_logos to authenticated;
grant select, insert, update, delete on table public.brand_guidelines to authenticated;
