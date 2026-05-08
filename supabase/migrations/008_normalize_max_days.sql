-- ============================================================
-- WAYRA - Normalize max selectable days
-- ============================================================

UPDATE public.city_info
SET
    max_days_iconico = 5,
    max_days_esploratore = 7
WHERE city IN (
    SELECT DISTINCT city
    FROM public.attractions
    WHERE is_food_spot = FALSE
);
