-- Verifies that the brand manual (colors, fonts, logos, guidelines) and the
-- brand-assets bucket stay isolated between access codes.
--
-- Runs live against the project, but every block is inside a transaction that
-- is rolled back at the end, so nothing is committed.

begin;

-- ---------------------------------------------------------------------------
-- Setup, as the owner
-- ---------------------------------------------------------------------------

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

insert into public.brand_colors (brand_id, name, hex, role) values
  ('aaaaaaaa-1111-4000-8000-00000000000a', 'Rojo A', '#FF0000', 'primary'),
  ('bbbbbbbb-1111-4000-8000-00000000000b', 'Azul B', '#0000FF', 'primary');

insert into public.brand_fonts (brand_id, family, role) values
  ('aaaaaaaa-1111-4000-8000-00000000000a', 'Fuente A', 'title'),
  ('bbbbbbbb-1111-4000-8000-00000000000b', 'Fuente B', 'title');

insert into public.brand_logos (brand_id, variant) values
  ('aaaaaaaa-1111-4000-8000-00000000000a', 'Principal A'),
  ('bbbbbbbb-1111-4000-8000-00000000000b', 'Principal B');

insert into public.brand_guidelines (brand_id, section, title, body_md) values
  ('aaaaaaaa-1111-4000-8000-00000000000a', 'voz', 'Voz A', 'Texto A'),
  ('bbbbbbbb-1111-4000-8000-00000000000b', 'voz', 'Voz B', 'Texto B');

insert into storage.objects (bucket_id, name) values
  ('brand-assets', 'aaaaaaaa-1111-4000-8000-00000000000a/logo-a.svg'),
  ('brand-assets', 'bbbbbbbb-1111-4000-8000-00000000000b/logo-b.svg');

-- ---------------------------------------------------------------------------
-- Persona A
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
set local role authenticated;

do $$
declare
  v int;
begin
  select count(*) into v from public.brand_colors;
  if v <> 1 then raise exception 'A sees % brand_colors, expected 1', v; end if;

  select count(*) into v from public.brand_fonts;
  if v <> 1 then raise exception 'A sees % brand_fonts, expected 1', v; end if;

  select count(*) into v from public.brand_logos;
  if v <> 1 then raise exception 'A sees % brand_logos, expected 1', v; end if;

  select count(*) into v from public.brand_guidelines;
  if v <> 1 then raise exception 'A sees % brand_guidelines, expected 1', v; end if;

  if exists (select 1 from public.brand_colors where name = 'Azul B') then
    raise exception 'A can read a color from another brand';
  end if;
  if exists (select 1 from public.brand_guidelines where title = 'Voz B') then
    raise exception 'A can read a guideline from another brand';
  end if;

  select count(*) into v from storage.objects;
  if v <> 1 then raise exception 'A sees % storage objects, expected 1', v; end if;
  if exists (select 1 from storage.objects where name like 'bbbbbbbb%') then
    raise exception 'A can read a file from another brand';
  end if;

  -- Writing under another brand must be rejected by the with-check clause.
  begin
    insert into public.brand_colors (brand_id, name, hex)
    values ('bbbbbbbb-1111-4000-8000-00000000000b', 'Intruso', '#00FF00');
    raise exception 'A could create a color under another brand';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into storage.objects (bucket_id, name)
    values ('brand-assets', 'bbbbbbbb-1111-4000-8000-00000000000b/intruso.svg');
    raise exception 'A could upload a file under another brand';
  exception
    when insufficient_privilege then null;
  end;

  -- A valid insert under its own brand still works.
  insert into public.brand_colors (brand_id, name, hex)
  values ('aaaaaaaa-1111-4000-8000-00000000000a', 'Verde A', '#00FF00');
end;
$$;

reset role;

-- ---------------------------------------------------------------------------
-- Persona B
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
set local role authenticated;

do $$
declare
  v int;
begin
  select count(*) into v from public.brand_colors;
  if v <> 1 then raise exception 'B sees % brand_colors, expected 1 (saw the extra A row?)', v; end if;

  if not exists (select 1 from public.brand_colors where name = 'Azul B') then
    raise exception 'B cannot see its own color';
  end if;
  if exists (select 1 from public.brand_colors where name = 'Verde A') then
    raise exception 'B can read a color created by A inside another brand';
  end if;

  select count(*) into v from storage.objects;
  if v <> 1 then raise exception 'B sees % storage objects, expected 1', v; end if;
  if exists (select 1 from storage.objects where name like 'aaaaaaaa%') then
    raise exception 'B can read a file from another brand';
  end if;
end;
$$;

reset role;

rollback;
