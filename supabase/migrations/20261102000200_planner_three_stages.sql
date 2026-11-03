-- The board keeps three working stages: idea, borrador and programado.
--
-- `en_revision` and `aprobado` were retired from the board. Pieces sitting in
-- those stages are moved to `borrador` so nothing disappears from the planner,
-- and the transition function is narrowed to the new flow. `publicado` stays as
-- the terminal state and is shown in a collapsed list.

update public.content_items
   set status = 'borrador', updated_at = now()
 where status in ('en_revision', 'aprobado');

create or replace function public.transition_content_item(p_item_id uuid, p_to_status text, p_comment text default '') returns public.content_items
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
    when 'borrador' then p_to_status in ('idea','programado')
    when 'programado' then p_to_status in ('borrador','publicado')
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
