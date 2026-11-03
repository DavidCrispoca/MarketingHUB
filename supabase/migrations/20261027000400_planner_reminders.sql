create function private.current_holder_name() returns text
language sql stable security definer set search_path = ''
as $$ select holder_name from public.access_grants where user_id = (select auth.uid()) $$;
revoke all on function private.current_holder_name() from public, anon;
grant execute on function private.current_holder_name() to authenticated;

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  title text not null,
  status text not null default 'idea',
  caption text not null default '',
  scheduled_at timestamptz,
  created_by text not null default private.current_holder_name(),
  notes text not null default '',
  published_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_items_status check (status in ('idea','borrador','en_revision','aprobado','programado','publicado')),
  constraint content_items_title_length check (char_length(title) between 1 and 180),
  constraint content_items_caption_length check (char_length(caption) <= 2200),
  constraint content_items_creator_length check (char_length(created_by) between 2 and 40)
);
alter table public.content_items add constraint content_items_id_brand_unique unique (id, brand_id);
alter table public.content_items add constraint content_items_campaign_brand_fk foreign key (campaign_id, brand_id) references public.campaigns(id, brand_id) on delete set null (campaign_id);

create table public.content_item_targets (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  platform text not null,
  template_id uuid references public.network_templates(id) on delete set null,
  caption_override text not null default '',
  external_post_id text,
  constraint content_item_targets_platform check (platform in ('instagram','tiktok')),
  unique(content_item_id, platform)
);
alter table public.content_item_targets add constraint content_item_targets_item_brand_fk foreign key (content_item_id, brand_id) references public.content_items(id, brand_id) on delete cascade;

create table public.content_item_assets (
  brand_id uuid not null references public.brands(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  asset_id uuid not null references public.media_assets(id) on delete cascade,
  position int not null default 0,
  primary key(content_item_id, asset_id)
);
alter table public.content_item_assets add constraint content_item_assets_item_brand_fk foreign key (content_item_id, brand_id) references public.content_items(id, brand_id) on delete cascade;
alter table public.content_item_assets add constraint content_item_assets_asset_brand_fk foreign key (asset_id, brand_id) references public.media_assets(id, brand_id) on delete cascade;

create table public.content_status_history (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by text not null,
  comment text not null default '',
  created_at timestamptz not null default now()
);
alter table public.content_status_history add constraint content_status_history_item_brand_fk foreign key (content_item_id, brand_id) references public.content_items(id, brand_id) on delete cascade;

create table public.content_comments (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint content_comments_author_length check (char_length(author_name) between 2 and 40),
  constraint content_comments_body_length check (char_length(body) between 1 and 4000)
);
alter table public.content_comments add constraint content_comments_item_brand_fk foreign key (content_item_id, brand_id) references public.content_items(id, brand_id) on delete cascade;

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  title text not null,
  notes text not null default '',
  remind_at timestamptz not null,
  repeat_rule text not null default 'none',
  kind text not null default 'tarea',
  content_item_id uuid references public.content_items(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  asset_id uuid references public.media_assets(id) on delete set null,
  done boolean not null default false,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint reminders_repeat_rule check (repeat_rule in ('none','weekly','monthly','yearly')),
  constraint reminders_kind check (kind in ('fecha_clave','tarea','licencia')),
  constraint reminders_title_length check (char_length(title) between 1 and 180)
);
alter table public.reminders add constraint reminders_item_brand_fk foreign key (content_item_id, brand_id) references public.content_items(id, brand_id) on delete set null (content_item_id);
alter table public.reminders add constraint reminders_campaign_brand_fk foreign key (campaign_id, brand_id) references public.campaigns(id, brand_id) on delete set null (campaign_id);
alter table public.reminders add constraint reminders_asset_brand_fk foreign key (asset_id, brand_id) references public.media_assets(id, brand_id) on delete set null (asset_id);

do $$
declare table_name text;
begin
  foreach table_name in array array['content_items','content_item_targets','content_item_assets','content_status_history','content_comments','reminders'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy %I on public.%I for all to authenticated using ((select private.has_access(brand_id))) with check ((select private.has_access(brand_id)))', table_name || '_brand_access', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, delete on table public.%I to authenticated', table_name);
    if table_name not in ('content_status_history') then
      execute format('grant update on table public.%I to authenticated', table_name);
    end if;
  end loop;
end $$;
revoke insert, update, delete on public.content_status_history from authenticated;
revoke insert, update on public.content_items from authenticated;
grant insert (brand_id, campaign_id, title, caption, scheduled_at, notes, published_url) on public.content_items to authenticated;
grant update (campaign_id, title, caption, scheduled_at, notes, published_url, updated_at) on public.content_items to authenticated;

create function public.transition_content_item(p_item_id uuid, p_to_status text, p_comment text default '') returns public.content_items
language plpgsql security definer set search_path = ''
as $$
declare current_row public.content_items; holder text; previous_status text; allowed boolean := false;
begin
  holder := private.current_holder_name();
  if holder is null then raise exception 'access code required'; end if;
  select * into current_row from public.content_items where id = p_item_id for update;
  if current_row.id is null or not private.has_access(current_row.brand_id) then raise exception 'content item not found'; end if;
  previous_status := current_row.status;
  allowed := case current_row.status
    when 'idea' then p_to_status = 'borrador'
    when 'borrador' then p_to_status in ('idea','en_revision')
    when 'en_revision' then p_to_status in ('borrador','aprobado')
    when 'aprobado' then p_to_status in ('en_revision','programado')
    when 'programado' then p_to_status in ('aprobado','publicado')
    else false end;
  if not allowed then raise exception 'invalid status transition'; end if;
  if char_length(coalesce(p_comment,'')) > 1000 then raise exception 'comment too long'; end if;
  update public.content_items set status = p_to_status, updated_at = now() where id = p_item_id returning * into current_row;
  insert into public.content_status_history (brand_id, content_item_id, from_status, to_status, changed_by, comment)
    values (current_row.brand_id, p_item_id, previous_status, p_to_status, holder, coalesce(p_comment,''));
  return current_row;
end;
$$;
revoke all on function public.transition_content_item(uuid,text,text) from public, anon;
grant execute on function public.transition_content_item(uuid,text,text) to authenticated;
