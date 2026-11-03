-- Brand media library. Objects remain private and are addressed only through
-- signed URLs after the asset row has passed brand RLS.

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  original_path text not null unique,
  thumb_path text,
  mime_type text not null,
  size_bytes bigint not null,
  width int,
  height int,
  duration_seconds numeric(10,2),
  status text not null default 'pendiente',
  folder text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_assets_name_length check (char_length(name) between 1 and 180),
  constraint media_assets_status check (status in ('pendiente', 'en_uso', 'usado', 'archivado')),
  constraint media_assets_size check (size_bytes > 0),
  constraint media_assets_dimensions check ((width is null or width > 0) and (height is null or height > 0)),
  constraint media_assets_duration check (duration_seconds is null or duration_seconds >= 0),
  constraint media_assets_paths check (
    original_path like brand_id::text || '/media/%'
    and (thumb_path is null or thumb_path like brand_id::text || '/thumbs/%')
  )
);
alter table public.media_assets add constraint media_assets_id_brand_unique unique (id, brand_id);

create index media_assets_brand_created_idx on public.media_assets (brand_id, created_at desc);
create index media_assets_brand_status_idx on public.media_assets (brand_id, status);
create index media_assets_tags_idx on public.media_assets using gin(tags);

alter table public.media_assets enable row level security;
create policy media_assets_brand_access on public.media_assets
  for all to authenticated
  using ((select private.has_access(brand_id)))
  with check ((select private.has_access(brand_id)));

revoke all on table public.media_assets from anon, authenticated;
grant select, insert, update, delete on table public.media_assets to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand-media', 'brand-media', false, 104857600,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm']
)
on conflict (id) do update set file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy brand_media_access on storage.objects
  for all to authenticated
  using (
    bucket_id = 'brand-media'
    and (select private.has_access(private.storage_brand_id(name)))
  )
  with check (
    bucket_id = 'brand-media'
    and (select private.has_access(private.storage_brand_id(name)))
  );
