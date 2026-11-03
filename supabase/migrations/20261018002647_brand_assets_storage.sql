-- Storage for brand identity files: fonts (woff2) and logos.
-- The bucket is private; the client only ever gets short-lived signed URLs,
-- so a session from another code can never open one of these files.

insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', false)
on conflict (id) do nothing;

-- Objects live under "<brand_id>/<file>". This resolves the first folder to a
-- brand id, and returns null instead of raising when it is not a uuid.
create function private.storage_brand_id(object_name text) returns uuid
language sql
stable
as $$
  select case
    when (storage.foldername(object_name))[1]
      ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      then ((storage.foldername(object_name))[1])::uuid
  end;
$$;

revoke all on function private.storage_brand_id(text) from public;
grant execute on function private.storage_brand_id(text) to authenticated;

-- Same rule as every other brand-owned table: access to the brand is access
-- to its files. A null brand id (bad path) makes `has_access` return false.
create policy brand_assets_access on storage.objects
  for all to authenticated
  using (
    bucket_id = 'brand-assets'
    and (select private.has_access(private.storage_brand_id(name)))
  )
  with check (
    bucket_id = 'brand-assets'
    and (select private.has_access(private.storage_brand_id(name)))
  );
