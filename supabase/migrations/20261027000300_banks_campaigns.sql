create table public.network_templates (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete cascade,
  platform text not null,
  template_key text not null,
  name text not null,
  width int not null,
  height int not null,
  max_caption int not null,
  max_hashtags int not null default 30,
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint network_templates_platform check (platform in ('instagram','tiktok')),
  constraint network_templates_dimensions check (width > 0 and height > 0),
  constraint network_templates_limits check (max_caption > 0 and max_hashtags >= 0)
);
create unique index network_templates_unique_idx on public.network_templates (coalesce(brand_id, '00000000-0000-0000-0000-000000000000'::uuid), platform, template_key);
alter table public.network_templates enable row level security;
create policy network_templates_read on public.network_templates for select to authenticated
  using (brand_id is null or (select private.has_access(brand_id)));
create policy network_templates_write on public.network_templates for all to authenticated
  using (brand_id is not null and (select private.has_access(brand_id)))
  with check (brand_id is not null and (select private.has_access(brand_id)));
revoke all on table public.network_templates from anon, authenticated;
grant select, insert, update, delete on table public.network_templates to authenticated;

create table public.caption_bank (
  id uuid primary key default gen_random_uuid(), brand_id uuid not null references public.brands(id) on delete cascade,
  platform text, title text not null, body text not null, status text not null default 'borrador',
  uses int not null default 0, tags text[] not null default '{}', created_at timestamptz not null default now(),
  constraint caption_bank_platform check (platform is null or platform in ('instagram','tiktok')),
  constraint caption_bank_status check (status in ('borrador','aprobado','retirado')),
  constraint caption_bank_title_length check (char_length(title) between 1 and 120),
  constraint caption_bank_body_length check (char_length(body) between 1 and 2200)
);
create table public.hashtag_sets (
  id uuid primary key default gen_random_uuid(), brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null, tags text[] not null default '{}', platform text, status text not null default 'borrador',
  created_at timestamptz not null default now(),
  constraint hashtag_sets_platform check (platform is null or platform in ('instagram','tiktok')),
  constraint hashtag_sets_status check (status in ('borrador','aprobado','retirado')),
  constraint hashtag_sets_name_length check (char_length(name) between 1 and 120)
);
create table public.cta_bank (
  id uuid primary key default gen_random_uuid(), brand_id uuid not null references public.brands(id) on delete cascade,
  text text not null, platform text, status text not null default 'borrador', created_at timestamptz not null default now(),
  constraint cta_bank_platform check (platform is null or platform in ('instagram','tiktok')),
  constraint cta_bank_status check (status in ('borrador','aprobado','retirado')),
  constraint cta_bank_text_length check (char_length(text) between 1 and 300)
);
create table public.campaigns (
  id uuid primary key default gen_random_uuid(), brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null, objective text not null default '', start_date date, end_date date,
  status text not null default 'planeada', color text not null default '#5672E8', utm_campaign text not null default '', notes text not null default '',
  created_at timestamptz not null default now(),
  constraint campaigns_status check (status in ('planeada','activa','finalizada')),
  constraint campaigns_dates check (start_date is null or end_date is null or start_date <= end_date),
  constraint campaigns_name_length check (char_length(name) between 1 and 140)
);
alter table public.campaigns add constraint campaigns_id_brand_unique unique (id, brand_id);

create index caption_bank_brand_idx on public.caption_bank(brand_id, created_at desc);
create index hashtag_sets_brand_idx on public.hashtag_sets(brand_id, created_at desc);
create index cta_bank_brand_idx on public.cta_bank(brand_id, created_at desc);
create index campaigns_brand_idx on public.campaigns(brand_id, start_date);

do $$
declare table_name text;
begin
  foreach table_name in array array['caption_bank','hashtag_sets','cta_bank','campaigns'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy %I on public.%I for all to authenticated using ((select private.has_access(brand_id))) with check ((select private.has_access(brand_id)))', table_name || '_brand_access', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
  end loop;
end $$;

insert into public.network_templates (platform, template_key, name, width, height, max_caption, max_hashtags, notes) values
  ('instagram','feed-square','Publicación cuadrada',1080,1080,2200,30,'Proporción 1:1'),
  ('instagram','feed-portrait','Publicación vertical',1080,1350,2200,30,'Proporción 4:5'),
  ('instagram','story','Historia / Reel',1080,1920,2200,30,'Proporción 9:16; deja libres los bordes superior e inferior'),
  ('tiktok','video','Video vertical',1080,1920,2200,30,'Proporción 9:16; deja libre la zona de controles lateral')
on conflict do nothing;
