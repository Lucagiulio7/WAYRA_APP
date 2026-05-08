-- ============================================================
-- WAYRA — Migration 003: tipo attrazione e link biglietti
-- ============================================================

ALTER TABLE public.attractions
  ADD COLUMN IF NOT EXISTS attraction_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS ticket_url      VARCHAR(500);
