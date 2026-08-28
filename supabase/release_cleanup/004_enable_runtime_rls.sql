-- Security hardening for the only two Wayra runtime tables.
-- Safe to run repeatedly: policies are dropped and recreated explicitly.

begin;

alter table public.saved_itineraries enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists saved_itineraries_select_own on public.saved_itineraries;
drop policy if exists saved_itineraries_insert_own on public.saved_itineraries;
drop policy if exists saved_itineraries_update_own on public.saved_itineraries;
drop policy if exists saved_itineraries_delete_own on public.saved_itineraries;

create policy saved_itineraries_select_own
  on public.saved_itineraries
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy saved_itineraries_insert_own
  on public.saved_itineraries
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy saved_itineraries_update_own
  on public.saved_itineraries
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy saved_itineraries_delete_own
  on public.saved_itineraries
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists analytics_events_insert on public.analytics_events;
drop policy if exists analytics_events_select_own on public.analytics_events;

create policy analytics_events_insert
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (user_id is null or auth.uid() = user_id);

create policy analytics_events_select_own
  on public.analytics_events
  for select
  to authenticated
  using (auth.uid() = user_id);

commit;

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
