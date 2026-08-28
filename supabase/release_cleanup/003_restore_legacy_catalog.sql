-- Emergency rollback for 002_archive_legacy_catalog.sql.

begin;

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
    if to_regclass(format('legacy_catalog_backup.%I', table_name)) is not null then
      if to_regclass(format('public.%I', table_name)) is not null then
        raise exception 'Public table public.% already exists', table_name;
      end if;

      execute format(
        'alter table legacy_catalog_backup.%I set schema public',
        table_name
      );
    end if;
  end loop;
end $$;

commit;
