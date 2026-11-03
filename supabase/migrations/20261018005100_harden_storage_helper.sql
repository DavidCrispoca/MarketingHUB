-- The Storage advisor flags a mutable search_path on helpers. This one only
-- calls storage.foldername, which is already qualified, so it can run with an
-- empty search_path and stop resolving anything through the session default.
create or replace function private.storage_brand_id(object_name text) returns uuid
language sql
stable
set search_path = ''
as $$
  select case
    when (storage.foldername(object_name))[1]
      ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      then ((storage.foldername(object_name))[1])::uuid
  end;
$$;
