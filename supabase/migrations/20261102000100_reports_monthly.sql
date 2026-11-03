-- Monthly reporting for a brand.
--
-- The dashboard already stores account and post snapshots. A monthly report
-- needs three extra pieces of information that the snapshots did not keep:
--   1. how many followers were gained and lost on each day,
--   2. which kind of media each post was, plus its caption and permalink,
--   3. the events and campaigns that happened during the month.
--
-- Everything here follows the same access model as the rest of the schema:
-- one policy per table, `private.has_access(brand_id)` on every row.

-- ---------------------------------------------------------------------------
-- Snapshot columns used by the report
-- ---------------------------------------------------------------------------

alter table public.account_metrics_daily
  add column if not exists followers_gained bigint not null default 0,
  add column if not exists followers_lost bigint not null default 0,
  add column if not exists total_interactions bigint not null default 0;

alter table public.account_metrics_daily
  add constraint account_metrics_growth_nonnegative
  check (followers_gained >= 0 and followers_lost >= 0 and total_interactions >= 0);

alter table public.post_metrics_snapshots
  add column if not exists media_type text,
  add column if not exists media_product_type text,
  add column if not exists caption text,
  add column if not exists permalink text;

alter table public.post_metrics_snapshots
  add constraint post_metrics_media_type_length
  check (media_type is null or char_length(media_type) <= 40);

alter table public.post_metrics_snapshots
  add constraint post_metrics_media_product_type_length
  check (media_product_type is null or char_length(media_product_type) <= 40);

alter table public.post_metrics_snapshots
  add constraint post_metrics_caption_length
  check (caption is null or char_length(caption) <= 2200);

alter table public.post_metrics_snapshots
  add constraint post_metrics_permalink_length
  check (permalink is null or char_length(permalink) <= 500);

-- ---------------------------------------------------------------------------
-- Events: the human context a report needs ("what happened this month?")
-- ---------------------------------------------------------------------------

create table public.brand_events (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  title text not null,
  kind text not null default 'evento',
  event_date date not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint brand_events_title_length check (char_length(title) between 1 and 140),
  constraint brand_events_notes_length check (char_length(notes) <= 2000),
  constraint brand_events_kind check (kind in ('campana', 'evento', 'lanzamiento', 'prensa', 'otro'))
);

create index brand_events_brand_date_idx on public.brand_events (brand_id, event_date desc);

alter table public.brand_events enable row level security;
create policy brand_events_brand_access on public.brand_events
  for all to authenticated
  using ((select private.has_access(brand_id)))
  with check ((select private.has_access(brand_id)));

revoke all on table public.brand_events from anon, authenticated;
grant select, insert, update, delete on table public.brand_events to authenticated;

-- ---------------------------------------------------------------------------
-- Reports: a small history of what was generated, and the notes used.
-- The PDF itself is generated in the browser; `config` keeps the inputs so a
-- report can be regenerated with the same conclusions.
-- ---------------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  title text not null,
  period_start date not null,
  period_end date not null,
  generated_by text not null default '',
  notes text not null default '',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint reports_title_length check (char_length(title) between 1 and 160),
  constraint reports_notes_length check (char_length(notes) <= 4000),
  constraint reports_period_order check (period_end >= period_start)
);

create index reports_brand_period_idx on public.reports (brand_id, period_start desc);

alter table public.reports enable row level security;
create policy reports_brand_access on public.reports
  for all to authenticated
  using ((select private.has_access(brand_id)))
  with check ((select private.has_access(brand_id)));

revoke all on table public.reports from anon, authenticated;
grant select, insert, update, delete on table public.reports to authenticated;
