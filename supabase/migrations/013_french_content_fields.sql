alter table public.attractions
  add column if not exists name_fr varchar(200),
  add column if not exists description_fr text;

alter table public.neighborhoods
  add column if not exists name_fr text,
  add column if not exists description_fr text;

alter table public.culture_facts
  add column if not exists title_fr varchar(200),
  add column if not exists body_fr text;

alter table public.city_info
  add column if not exists currency_fr text,
  add column if not exists language_fr text,
  add column if not exists english_note_fr text,
  add column if not exists water_fr text,
  add column if not exists tipping_fr text,
  add column if not exists quick_tips_fr text[] default '{}';
