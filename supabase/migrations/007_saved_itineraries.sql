-- ============================================================
-- WAYRA - Saved itineraries
-- ============================================================

CREATE TABLE IF NOT EXISTS public.saved_itineraries (
    id         TEXT PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    city       VARCHAR(100) NOT NULL,
    num_days   INTEGER NOT NULL,
    itinerary  JSONB NOT NULL,
    saved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_itineraries_user_saved_at
    ON public.saved_itineraries(user_id, saved_at DESC);

ALTER TABLE public.saved_itineraries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'saved_itineraries'
          AND policyname = 'saved_itineraries_select_own'
    ) THEN
        CREATE POLICY saved_itineraries_select_own
            ON public.saved_itineraries
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'saved_itineraries'
          AND policyname = 'saved_itineraries_insert_own'
    ) THEN
        CREATE POLICY saved_itineraries_insert_own
            ON public.saved_itineraries
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'saved_itineraries'
          AND policyname = 'saved_itineraries_update_own'
    ) THEN
        CREATE POLICY saved_itineraries_update_own
            ON public.saved_itineraries
            FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'saved_itineraries'
          AND policyname = 'saved_itineraries_delete_own'
    ) THEN
        CREATE POLICY saved_itineraries_delete_own
            ON public.saved_itineraries
            FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;
