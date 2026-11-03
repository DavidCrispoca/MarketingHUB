create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  platform text not null,
  handle text not null,
  display_name text not null default '',
  avatar_url text,
  status text not null default 'demo',
  external_id text,
  created_at timestamptz not null default now(),
  constraint social_accounts_platform check (platform in ('instagram','tiktok')),
  constraint social_accounts_status check (status in ('demo','connected','expired','error')),
  constraint social_accounts_handle_length check (char_length(handle) between 1 and 120),
  unique(brand_id, platform)
);
alter table public.social_accounts add constraint social_accounts_id_brand_unique unique (id, brand_id);

create table public.social_tokens (
  account_id uuid primary key references public.social_accounts(id) on delete cascade,
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  expires_at timestamptz,
  scopes text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.account_metrics_daily (
  brand_id uuid not null references public.brands(id) on delete cascade,
  account_id uuid not null references public.social_accounts(id) on delete cascade,
  metric_date date not null,
  followers bigint not null default 0,
  following bigint not null default 0,
  posts_count bigint not null default 0,
  reach bigint not null default 0,
  profile_views bigint not null default 0,
  views bigint not null default 0,
  created_at timestamptz not null default now(),
  primary key(account_id, metric_date),
  constraint account_metrics_nonnegative check (followers >= 0 and following >= 0 and posts_count >= 0 and reach >= 0 and profile_views >= 0 and views >= 0)
);
alter table public.account_metrics_daily add constraint account_metrics_account_brand_fk foreign key (account_id, brand_id) references public.social_accounts(id, brand_id) on delete cascade;

create table public.post_metrics_snapshots (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  social_account_id uuid not null references public.social_accounts(id) on delete cascade,
  external_post_id text,
  content_item_id uuid references public.content_items(id) on delete set null,
  published_at timestamptz,
  captured_at timestamptz not null default now(),
  views bigint not null default 0,
  likes bigint not null default 0,
  comments bigint not null default 0,
  shares bigint not null default 0,
  saves bigint not null default 0,
  reach bigint not null default 0,
  constraint post_metrics_nonnegative check (views >= 0 and likes >= 0 and comments >= 0 and shares >= 0 and saves >= 0 and reach >= 0)
);
alter table public.post_metrics_snapshots add constraint post_metrics_account_brand_fk foreign key (social_account_id, brand_id) references public.social_accounts(id, brand_id) on delete cascade;
alter table public.post_metrics_snapshots add constraint post_metrics_item_brand_fk foreign key (content_item_id, brand_id) references public.content_items(id, brand_id) on delete set null (content_item_id);

alter table public.social_accounts enable row level security;
create policy social_accounts_brand_access on public.social_accounts for all to authenticated
  using ((select private.has_access(brand_id))) with check ((select private.has_access(brand_id)));
revoke all on table public.social_accounts from anon, authenticated;
grant select, delete on table public.social_accounts to authenticated;
grant insert (brand_id, platform, handle, display_name) on public.social_accounts to authenticated;
grant update (handle, display_name, avatar_url) on public.social_accounts to authenticated;

alter table public.social_tokens enable row level security;
revoke all on table public.social_tokens from public, anon, authenticated;

alter table public.account_metrics_daily enable row level security;
create policy account_metrics_brand_access on public.account_metrics_daily for all to authenticated
  using ((select private.has_access(brand_id))) with check ((select private.has_access(brand_id)));
revoke all on table public.account_metrics_daily from anon, authenticated;
grant select, insert, update, delete on table public.account_metrics_daily to authenticated;

alter table public.post_metrics_snapshots enable row level security;
create policy post_metrics_brand_access on public.post_metrics_snapshots for all to authenticated
  using ((select private.has_access(brand_id))) with check ((select private.has_access(brand_id)));
revoke all on table public.post_metrics_snapshots from anon, authenticated;
grant select, insert, update, delete on table public.post_metrics_snapshots to authenticated;

create index account_metrics_daily_brand_date_idx on public.account_metrics_daily(brand_id, metric_date desc);
create index post_metrics_brand_published_idx on public.post_metrics_snapshots(brand_id, published_at desc);
