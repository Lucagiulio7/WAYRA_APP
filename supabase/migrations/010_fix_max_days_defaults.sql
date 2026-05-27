-- ============================================================
-- WAYRA - Fix max_days columns: aggiunge le colonne se mancano
--         e corregge valori <= 1 rimasti dal default DB
-- ============================================================

-- Aggiunge le colonne con default corretti se non esistono già
ALTER TABLE public.city_info
  ADD COLUMN IF NOT EXISTS max_days_iconico     INT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS max_days_esploratore INT NOT NULL DEFAULT 7;

-- Corregge valori <= 1 che non sarebbero stati aggiornati dalla migrazione 008
UPDATE public.city_info
SET
    max_days_iconico     = 5,
    max_days_esploratore = 7
WHERE max_days_iconico <= 1
   OR max_days_esploratore <= 1;
