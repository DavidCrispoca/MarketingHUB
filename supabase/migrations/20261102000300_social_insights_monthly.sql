-- Monthly per-network insights.
--
-- Daily snapshots answer "how did followers move day by day". A monthly report
-- also needs figures that the networks only expose aggregated per month:
-- audience demographics, traffic sources, top searches and peak hours. Keeping
-- one row per account and month avoids dozens of sparse columns and lets the
-- report compare a month with the one before it without guessing.

create table public.social_insights_monthly (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  account_id uuid not null references public.social_accounts(id) on delete cascade,
  period_start date not null,
  followers bigint not null default 0,
  followers_gained bigint not null default 0,
  followers_lost bigint not null default 0,
  reach bigint not null default 0,
  views bigint not null default 0,
  non_follower_views bigint not null default 0,
  profile_views bigint not null default 0,
  link_clicks bigint not null default 0,
  interactions bigint not null default 0,
  posts_count bigint not null default 0,
  audience jsonb not null default '{}'::jsonb,
  traffic jsonb not null default '{}'::jsonb,
  top_searches text[] not null default '{}',
  best_hours text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint social_insights_first_of_month check (extract(day from period_start) = 1),
  constraint social_insights_nonnegative check (
    followers >= 0 and followers_gained >= 0 and followers_lost >= 0
    and reach >= 0 and views >= 0 and non_follower_views >= 0
    and profile_views >= 0 and link_clicks >= 0 and interactions >= 0 and posts_count >= 0
  ),
  constraint social_insights_searches_length check (char_length(array_to_string(top_searches, ' ')) <= 600),
  constraint social_insights_hours_length check (char_length(array_to_string(best_hours, ' ')) <= 400),
  constraint social_insights_account_period_unique unique (account_id, period_start)
);

create index social_insights_brand_period_idx on public.social_insights_monthly (brand_id, period_start desc);

alter table public.social_insights_monthly enable row level security;
create policy social_insights_brand_access on public.social_insights_monthly
  for all to authenticated
  using ((select private.has_access(brand_id)))
  with check ((select private.has_access(brand_id)));

revoke all on table public.social_insights_monthly from anon, authenticated;
grant select, insert, update, delete on table public.social_insights_monthly to authenticated;

-- The report needs to know whether a number came from a real connection or from
-- the demo seed, and the PDF prints a different disclaimer for each case.
comment on table public.social_insights_monthly is
  'Per account and month metrics that the networks only expose aggregated (demographics, traffic sources, searches, peak hours).';
