-- Hardening pass over the access model:
--   1. The helper functions were reachable through /rest/v1/rpc because they
--      lived in the exposed `public` schema. They move to `private`, which
--      PostgREST does not expose, while RLS policies keep using them.
--   2. RLS policies now call the helpers through a sub-select, so Postgres
--      evaluates them once per query instead of once per row.
--   3. access_grants.access_code_id gets a covering index.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- The policies depend on the old functions, so they go first.
drop policy brands_select on public.brands;
drop policy brands_insert on public.brands;
drop policy brands_update on public.brands;
drop policy brands_delete on public.brands;

drop function public.current_access_code_id();
drop function public.has_access(uuid);

create function private.current_access_code_id() returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select access_code_id from public.access_grants where user_id = auth.uid();
$$;

create function private.has_access(b uuid) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.brands br
    join public.access_grants g on g.access_code_id = br.access_code_id
    where br.id = b and g.user_id = auth.uid()
  );
$$;

revoke all on function private.current_access_code_id() from public;
revoke all on function private.has_access(uuid) from public;
grant execute on function private.current_access_code_id() to authenticated;
grant execute on function private.has_access(uuid) to authenticated;

create policy brands_select on public.brands
  for select to authenticated
  using (access_code_id = (select private.current_access_code_id()));

create policy brands_insert on public.brands
  for insert to authenticated
  with check (access_code_id = (select private.current_access_code_id()));

create policy brands_update on public.brands
  for update to authenticated
  using (access_code_id = (select private.current_access_code_id()))
  with check (access_code_id = (select private.current_access_code_id()));

create policy brands_delete on public.brands
  for delete to authenticated
  using (access_code_id = (select private.current_access_code_id()));

-- access_grants is read by user_id (primary key) but the code side was unindexed.
create index if not exists access_grants_access_code_id_idx
  on public.access_grants (access_code_id);
