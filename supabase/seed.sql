-- Demo access code for local development and the first live test.
-- Run with: supabase db seed   (or paste it into the SQL editor)
insert into public.access_codes (label, code_hash)
values (
  'Equipo de prueba',
  encode(extensions.digest(upper(trim('MHUB-2026-DEMO')), 'sha256'), 'hex')
)
on conflict (code_hash) do nothing;
