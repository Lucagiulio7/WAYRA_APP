-- ============================================================
-- WAYRA — Migration 002: colonne inglese
-- ============================================================

ALTER TABLE public.attractions
  ADD COLUMN IF NOT EXISTS name_en        VARCHAR(200),
  ADD COLUMN IF NOT EXISTS description_en TEXT;

ALTER TABLE public.foods
  ADD COLUMN IF NOT EXISTS name_en        VARCHAR(200),
  ADD COLUMN IF NOT EXISTS description_en TEXT;

ALTER TABLE public.culture_facts
  ADD COLUMN IF NOT EXISTS title_en VARCHAR(200),
  ADD COLUMN IF NOT EXISTS body_en  TEXT;
