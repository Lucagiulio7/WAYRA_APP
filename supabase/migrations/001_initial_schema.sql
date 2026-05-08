-- ============================================================
-- WAYRA — Schema iniziale Supabase PostgreSQL
-- Migration: 001_initial_schema
-- ============================================================

-- ── Attractions (attrazioni turistiche + food spot) ─────────
CREATE TABLE IF NOT EXISTS public.attractions (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(200)     NOT NULL,
    description   TEXT,
    category_level INTEGER         NOT NULL,   -- 1=iconico, 2=ricercato, 3=nascosto
    block_id      INTEGER,                     -- cluster geografico
    zone          VARCHAR(50),
    latitude      DOUBLE PRECISION NOT NULL,
    longitude     DOUBLE PRECISION NOT NULL,
    estimated_visit_time INTEGER  DEFAULT 60,  -- minuti
    tags          JSONB            DEFAULT '[]'::jsonb,
    city          VARCHAR(100)     DEFAULT 'roma',
    is_food_spot  BOOLEAN          DEFAULT FALSE NOT NULL,
    food_type     VARCHAR(100),                -- 'ristorante','trattoria','street food','bar','bistrot'
    meal_type     VARCHAR(20),                 -- 'lunch','dinner','both'
    rating        DOUBLE PRECISION
);

-- ── Foods (piatti tradizionali per città) ───────────────────
CREATE TABLE IF NOT EXISTS public.foods (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    ingredients JSONB        DEFAULT '[]'::jsonb,
    city        VARCHAR(100) DEFAULT 'roma'
);

-- ── Culture facts (curiosità culturali per città) ───────────
CREATE TABLE IF NOT EXISTS public.culture_facts (
    id         BIGSERIAL PRIMARY KEY,
    city       VARCHAR(100) NOT NULL,
    icon       VARCHAR(20),
    title      VARCHAR(200),
    body       TEXT,
    sort_order INTEGER      DEFAULT 0
);

-- ── Indici per performance ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_attractions_city
    ON public.attractions(city);

CREATE INDEX IF NOT EXISTS idx_attractions_city_level
    ON public.attractions(city, category_level);

CREATE INDEX IF NOT EXISTS idx_attractions_food_spot
    ON public.attractions(city, is_food_spot);

CREATE INDEX IF NOT EXISTS idx_foods_city
    ON public.foods(city);

CREATE INDEX IF NOT EXISTS idx_culture_facts_city
    ON public.culture_facts(city);

-- ── RLS (Row Level Security) — lettura pubblica ─────────────
-- Le tabelle sono read-only dall'app, nessun dato sensibile.
ALTER TABLE public.attractions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.culture_facts  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lettura pubblica attractions"
    ON public.attractions FOR SELECT USING (true);

CREATE POLICY "Lettura pubblica foods"
    ON public.foods FOR SELECT USING (true);

CREATE POLICY "Lettura pubblica culture_facts"
    ON public.culture_facts FOR SELECT USING (true);
