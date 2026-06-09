create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  event text not null,
  anonymous_id text not null,
  user_id uuid null references auth.users(id) on delete set null,
  platform text null,
  properties jsonb not null default '{}'::jsonb
);

alter table public.analytics_events enable row level security;

drop policy if exists "analytics_events_insert" on public.analytics_events;
create policy "analytics_events_insert"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "analytics_events_select_own" on public.analytics_events;
create policy "analytics_events_select_own"
  on public.analytics_events
  for select
  to authenticated
  using (auth.uid() = user_id);

create index if not exists analytics_events_occurred_at_idx
  on public.analytics_events (occurred_at desc);

create index if not exists analytics_events_event_idx
  on public.analytics_events (event);

create index if not exists analytics_events_user_id_idx
  on public.analytics_events (user_id);

create index if not exists analytics_events_anonymous_id_idx
  on public.analytics_events (anonymous_id);
