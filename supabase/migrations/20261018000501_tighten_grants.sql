-- Supabase grants every privilege on new tables to anon/authenticated by
-- default. RLS is the gate, but TRUNCATE is not subject to RLS at all, so
-- each role should only hold what it actually needs.

-- Codes: never exposed to the app. Only the service role reads them.
revoke all on table public.access_codes from anon, authenticated;

-- Grants: a session reads its own row; redeem-code (service role) writes it.
revoke all on table public.access_grants from anon, authenticated;
grant select on table public.access_grants to authenticated;

-- Brands: the workspace itself.
revoke all on table public.brands from anon, authenticated;
grant select, insert, update, delete on table public.brands to authenticated;

-- Helpers: signed-in sessions only. Code management stays with the owner.
revoke all on function public.current_access_code_id() from public, anon;
revoke all on function public.has_access(uuid) from public, anon;
grant execute on function public.current_access_code_id() to authenticated;
grant execute on function public.has_access(uuid) to authenticated;
