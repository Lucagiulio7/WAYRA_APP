alter table public.foods
  add column if not exists name_fr varchar(200),
  add column if not exists description_fr text,
  add column if not exists ingredients_fr jsonb default '[]'::jsonb;
