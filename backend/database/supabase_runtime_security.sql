-- Urveya runtime data security.
-- Safe to run more than once in the Supabase SQL Editor.

alter table if exists public.saved_itineraries enable row level security;
alter table if exists public.analytics_events enable row level security;

drop policy if exists "Users can read own itineraries" on public.saved_itineraries;
drop policy if exists "Users can insert own itineraries" on public.saved_itineraries;
drop policy if exists "Users can update own itineraries" on public.saved_itineraries;
drop policy if exists "Users can delete own itineraries" on public.saved_itineraries;

create policy "Users can read own itineraries"
on public.saved_itineraries
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own itineraries"
on public.saved_itineraries
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own itineraries"
on public.saved_itineraries
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own itineraries"
on public.saved_itineraries
for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.saved_itineraries from anon;
grant select, insert, update, delete on table public.saved_itineraries to authenticated;

-- Analytics is not used by the release app. Keep the legacy table inaccessible;
-- the service-role account-deletion function can still remove historical rows.
drop policy if exists "analytics_events_insert" on public.analytics_events;
drop policy if exists "analytics_events_select_own" on public.analytics_events;
drop policy if exists analytics_events_insert on public.analytics_events;
drop policy if exists analytics_events_select_own on public.analytics_events;
revoke all on table public.analytics_events from anon, authenticated;
