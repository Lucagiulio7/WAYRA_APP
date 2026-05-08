-- Normalize recommended app links to store searches.
-- Direct App Store / Play Store IDs are region-sensitive and several old IDs
-- now return 404. Store search URLs remain downloadable and resilient.

CREATE OR REPLACE FUNCTION public.store_search_url(app_name TEXT, platform TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN platform = 'ios' THEN
      'itms-apps://itunes.apple.com/search?term=' || replace(app_name, ' ', '%20') || '&media=software'
    ELSE
      'https://play.google.com/store/search?q=' || replace(app_name, ' ', '%20') || '&c=apps'
  END;
$$;

UPDATE city_info
SET transport_apps = COALESCE((
  SELECT jsonb_agg(
    jsonb_set(
      jsonb_set(app, '{ios_url}', to_jsonb(public.store_search_url(app->>'name', 'ios'))),
      '{android_url}', to_jsonb(public.store_search_url(app->>'name', 'android'))
    )
  )
  FROM jsonb_array_elements(transport_apps) AS app
), '[]'::jsonb);

UPDATE city_info
SET useful_apps = COALESCE((
  SELECT jsonb_agg(
    jsonb_set(
      jsonb_set(app, '{ios_url}', to_jsonb(public.store_search_url(app->>'name', 'ios'))),
      '{android_url}', to_jsonb(public.store_search_url(app->>'name', 'android'))
    )
  )
  FROM jsonb_array_elements(useful_apps) AS app
), '[]'::jsonb);

DROP FUNCTION public.store_search_url(TEXT, TEXT);
