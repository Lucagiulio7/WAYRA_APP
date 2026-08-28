-- Read-only audit. This script does not modify the database.

select
  n.nspname as schema_name,
  c.relname as object_name,
  case c.relkind
    when 'r' then 'table'
    when 'v' then 'view'
    when 'm' then 'materialized view'
    else c.relkind::text
  end as object_type,
  pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
  coalesce(s.n_live_tup, 0) as estimated_rows
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_stat_user_tables s on s.relid = c.oid
where n.nspname in ('public', 'legacy_catalog_backup')
  and c.relname in (
    'attractions',
    'foods',
    'culture_facts',
    'city_info',
    'neighborhoods',
    'saved_itineraries',
    'analytics_events'
  )
order by n.nspname, c.relname;

select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('saved_itineraries', 'analytics_events')
order by tablename, policyname;

-- Read the table flags directly. row_security_active() is role-dependent and
-- returns false for the postgres owner used by the SQL Editor even when RLS is
-- enabled for anon/authenticated clients.
select
  n.nspname as table_schema,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  count(p.policyname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p
  on p.schemaname = n.nspname
 and p.tablename = c.relname
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in ('saved_itineraries', 'analytics_events')
group by n.nspname, c.relname, c.relrowsecurity, c.relforcerowsecurity
order by c.relname;
