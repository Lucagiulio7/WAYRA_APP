-- Reversible cleanup: move unused catalog tables out of the public API schema.
-- WARNING: deploy the current bundled-catalog web app before running this file.
-- Do not add CASCADE. If an unexpected database dependency exists, the whole
-- transaction must fail without moving anything.

begin;

create schema if not exists legacy_catalog_backup;
revoke all on schema legacy_catalog_backup from public, anon, authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'attractions',
    'foods',
    'culture_facts',
    'city_info',
    'neighborhoods'
  ]
  loop
    if to_regclass(format('public.%I', table_name)) is not null then
      if to_regclass(format('legacy_catalog_backup.%I', table_name)) is not null then
        raise exception 'Archive table legacy_catalog_backup.% already exists', table_name;
      end if;

      execute format(
        'alter table public.%I set schema legacy_catalog_backup',
        table_name
      );
    end if;
  end loop;
end $$;

commit;

-- Expected: only saved_itineraries and analytics_events remain in public from
-- Wayra's private runtime data model.
select table_schema, table_name
from information_schema.tables
where table_schema in ('public', 'legacy_catalog_backup')
  and table_name in (
    'attractions',
    'foods',
    'culture_facts',
    'city_info',
    'neighborhoods',
    'saved_itineraries',
    'analytics_events'
  )
order by table_schema, table_name;
