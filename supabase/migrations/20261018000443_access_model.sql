-- Access model: a code is the credential. There are no roles.
-- Every row that belongs to a brand is visible only to the code that owns it.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.access_codes (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  code_hash text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

-- One grant per authenticated user (anonymous session). Several people may
-- share the same code, so the holder name is stored per person, not per code.
create table public.access_grants (
  user_id uuid primary key references auth.users (id) on delete cascade,
  access_code_id uuid not null references public.access_codes (id) on delete cascade,
  holder_name text not null,
  created_at timestamptz not null default now(),
  constraint holder_name_length check (char_length(holder_name) between 2 and 40)
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  access_code_id uuid not null references public.access_codes (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_name_length check (char_length(name) between 1 and 80),
  constraint brands_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  unique (access_code_id, slug)
);

create index brands_access_code_id_idx on public.brands (access_code_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- The access code of the current session, or null when not redeemed yet.
create function public.current_access_code_id() returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select access_code_id from public.access_grants where user_id = auth.uid();
$$;

-- Can the current session see this brand?
create function public.has_access(b uuid) returns boolean
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

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.access_codes enable row level security;
alter table public.access_grants enable row level security;
alter table public.brands enable row level security;

-- access_codes: no policies on purpose. Only server-side code (service role)
-- reads or writes codes, so a client can never list them.

create policy access_grants_select_own on public.access_grants
  for select to authenticated
  using (user_id = auth.uid());

create policy brands_select on public.brands
  for select to authenticated
  using (access_code_id = public.current_access_code_id());

create policy brands_insert on public.brands
  for insert to authenticated
  with check (access_code_id = public.current_access_code_id());

create policy brands_update on public.brands
  for update to authenticated
  using (access_code_id = public.current_access_code_id())
  with check (access_code_id = public.current_access_code_id());

create policy brands_delete on public.brands
  for delete to authenticated
  using (access_code_id = public.current_access_code_id());

-- ---------------------------------------------------------------------------
-- Code management — owner only (SQL editor / service role)
-- ---------------------------------------------------------------------------

create function public.create_access_code(p_label text, p_code text) returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  if char_length(trim(p_label)) = 0 then
    raise exception 'label is required';
  end if;
  if char_length(trim(p_code)) < 6 then
    raise exception 'code must have at least 6 characters';
  end if;

  insert into public.access_codes (label, code_hash)
  values (trim(p_label), encode(digest(upper(trim(p_code)), 'sha256'), 'hex'))
  returning id into v_id;

  return v_id;
end;
$$;

create function public.revoke_access_code(p_id uuid) returns void
language sql
security definer
set search_path = public
as $$
  update public.access_codes set active = false where id = p_id;
$$;

-- Codes must be created by the owner, never by an authenticated app session.
revoke all on function public.create_access_code(text, text) from public, anon, authenticated;
revoke all on function public.revoke_access_code(uuid) from public, anon, authenticated;

grant execute on function public.current_access_code_id() to authenticated;
grant execute on function public.has_access(uuid) to authenticated;
