# Supabase release cleanup

The mobile runtime uses Supabase only for:

- Authentication
- `public.saved_itineraries`
- `public.analytics_events`
- the `delete-account` Edge Function

The travel catalog and itinerary generation are bundled in the app. The old
catalog tables and the `city-info` / `generate-itinerary` Edge Functions are no
longer runtime dependencies.

## Safe sequence

1. Run `001_audit.sql` in the Supabase SQL Editor and save the result.
2. Confirm that every public web deployment uses the current bundled-catalog build. An older deployed client may still depend on the legacy tables.
3. Run `002_archive_legacy_catalog.sql`.
4. Test sign-up, sign-in, itinerary synchronization, analytics consent and
   account deletion.
5. Delete the `city-info` and `generate-itinerary` Edge Functions from the
   Supabase dashboard. Keep `delete-account`.
6. Keep the archive for at least one release cycle. Use
   `003_restore_legacy_catalog.sql` if a dependency was missed.
7. Only after the production release is stable, drop the
   `legacy_catalog_backup` schema manually.

Saved SQL Editor queries can be deleted at any time. They are editor documents
and are not database objects.
