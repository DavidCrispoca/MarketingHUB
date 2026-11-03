-- Verifies the core promise of the access model: a code only ever sees the
-- brands created under it. Nothing here is committed — every block runs
-- inside a transaction that is rolled back, so it is safe to run live.
--
-- Run with: psql "$DATABASE_URL" -f supabase/tests/access_isolation.sql

-- ---------------------------------------------------------------------------
-- Persona A
-- ---------------------------------------------------------------------------
begin;

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'holder-a@test.local', now(), now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'holder-b@test.local', now(), now());

insert into public.access_codes (id, label, code_hash) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', 'Prueba A',
   encode(extensions.digest('TEST-CODE-A', 'sha256'), 'hex')),
  ('bbbbbbbb-0000-4000-8000-00000000000b', 'Prueba B',
   encode(extensions.digest('TEST-CODE-B', 'sha256'), 'hex'));

insert into public.access_grants (user_id, access_code_id, holder_name) values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0000-4000-8000-00000000000a', 'Persona A'),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-0000-4000-8000-00000000000b', 'Persona B');

insert into public.brands (id, access_code_id, name, slug) values
  ('aaaaaaaa-1111-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-00000000000a', 'Marca A', 'marca-a'),
  ('bbbbbbbb-1111-4000-8000-00000000000b', 'bbbbbbbb-0000-4000-8000-00000000000b', 'Marca B', 'marca-b');

-- Impersonate the session exactly the way auth.uid() reads it.
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
set local role authenticated;

do $$
declare
  v_visible int;
begin
  select count(*) into v_visible from public.brands;
  if v_visible <> 1 then
    raise exception 'A should see 1 brand, saw %', v_visible;
  end if;

  if exists (select 1 from public.brands where slug = 'marca-b') then
    raise exception 'A can read a brand that belongs to another code';
  end if;

  select count(*) into v_visible from public.access_grants;
  if v_visible <> 1 then
    raise exception 'A should only read its own grant, saw %', v_visible;
  end if;

  begin
    insert into public.brands (access_code_id, name, slug)
    values ('bbbbbbbb-0000-4000-8000-00000000000b', 'Intrusa', 'intrusa');
    raise exception 'A could create a brand under another code';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform 1 from public.access_codes;
    raise exception 'A can read the access codes table';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;
rollback;

-- ---------------------------------------------------------------------------
-- Persona B
-- ---------------------------------------------------------------------------
begin;

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'holder-a@test.local', now(), now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'holder-b@test.local', now(), now());

insert into public.access_codes (id, label, code_hash) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', 'Prueba A',
   encode(extensions.digest('TEST-CODE-A', 'sha256'), 'hex')),
  ('bbbbbbbb-0000-4000-8000-00000000000b', 'Prueba B',
   encode(extensions.digest('TEST-CODE-B', 'sha256'), 'hex'));

insert into public.access_grants (user_id, access_code_id, holder_name) values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0000-4000-8000-00000000000a', 'Persona A'),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-0000-4000-8000-00000000000b', 'Persona B');

insert into public.brands (id, access_code_id, name, slug) values
  ('aaaaaaaa-1111-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-00000000000a', 'Marca A', 'marca-a'),
  ('bbbbbbbb-1111-4000-8000-00000000000b', 'bbbbbbbb-0000-4000-8000-00000000000b', 'Marca B', 'marca-b');

select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
set local role authenticated;

do $$
declare
  v_visible int;
begin
  select count(*) into v_visible from public.brands;
  if v_visible <> 1 then
    raise exception 'B should see 1 brand, saw %', v_visible;
  end if;

  if exists (select 1 from public.brands where slug = 'marca-a') then
    raise exception 'B can read a brand that belongs to another code';
  end if;

  if not exists (select 1 from public.brands where slug = 'marca-b') then
    raise exception 'B cannot see its own brand';
  end if;
end;
$$;

reset role;
rollback;
