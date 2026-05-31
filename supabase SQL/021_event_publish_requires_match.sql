-- Enforce hierarchy guardrail:
-- event -> minimal 1 pertandingan (event_categories) before event can be published.

create or replace function public.ensure_event_has_match_before_publish()
returns trigger
language plpgsql
as $$
declare
  v_category_count integer;
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    select count(*)
    into v_category_count
    from public.event_categories
    where event_id = new.id;

    if coalesce(v_category_count, 0) < 1 then
      raise exception 'Event must have at least one pertandingan before publishing (event_id=%)', new.id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_events_require_match_before_publish on public.events;
create trigger trg_events_require_match_before_publish
before insert or update of status on public.events
for each row
execute procedure public.ensure_event_has_match_before_publish();
