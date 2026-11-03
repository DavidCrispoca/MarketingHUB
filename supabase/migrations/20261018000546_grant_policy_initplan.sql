-- Postgres evaluates bare auth.<function>() calls once per row inside a policy.
-- Wrapping the call in a sub-select turns it into a single InitPlan per query.
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

drop policy access_grants_select_own on public.access_grants;

create policy access_grants_select_own on public.access_grants
  for select to authenticated
  using (user_id = (select auth.uid()));
