create table public.media_comments (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  asset_id uuid not null references public.media_assets(id) on delete cascade,
  parent_id uuid references public.media_comments(id) on delete cascade,
  author_name text not null,
  body text not null,
  pos_x numeric(8,7),
  pos_y numeric(8,7),
  video_time_seconds numeric(10,2),
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  constraint media_comments_author_length check (char_length(author_name) between 2 and 40),
  constraint media_comments_body_length check (char_length(body) between 1 and 4000),
  constraint media_comments_pin_range check (
    (pos_x is null and pos_y is null) or
    (pos_x between 0 and 1 and pos_y between 0 and 1)
  ),
  constraint media_comments_time_nonnegative check (video_time_seconds is null or video_time_seconds >= 0)
);
alter table public.media_comments add constraint media_comments_asset_brand_fk foreign key (asset_id, brand_id) references public.media_assets(id, brand_id) on delete cascade;
alter table public.media_comments add constraint media_comments_id_brand_asset_unique unique (id, brand_id, asset_id);
alter table public.media_comments add constraint media_comments_parent_thread_fk foreign key (parent_id, brand_id, asset_id) references public.media_comments(id, brand_id, asset_id) on delete cascade;

create index media_comments_asset_created_idx on public.media_comments(asset_id, created_at);
alter table public.media_comments enable row level security;
create policy media_comments_brand_access on public.media_comments
  for all to authenticated
  using ((select private.has_access(brand_id)))
  with check ((select private.has_access(brand_id)));
revoke all on table public.media_comments from anon, authenticated;
grant select, insert, update, delete on table public.media_comments to authenticated;
