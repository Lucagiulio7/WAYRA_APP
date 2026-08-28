# Adding a city to Wayra

A city has two versioned registrations and does not require SQL to become usable.

## 1. Content

Copy `backend/database/cities/_template.py.example` to `<city_id>.py`, set `CITY_ID`, then fill `ATTRACTIONS`, `FOOD_SPOTS`, `FOODS_BY_CITY`, and `CULTURE_FACTS`. Backend discovery is automatic.

The API uses database rows when they exist and falls back to this versioned catalog when they do not. This lets a newly deployed city work before any optional database synchronization.

## 2. Home metadata

Add one entry to `mobile/data/cityRegistry.ts` with the same ID, country, localized names, and icon. Add the country once to `COUNTRY_REGISTRY` if it is new.

## 3. Optional information

Add practical information and neighborhood geometry to the static catalog source when available. Add translations to `backend/database/translations/<language>.json`.

## 4. Validate

From `backend` run:

```powershell
python scripts/validate_content.py
python scripts/validate_content.py --language fr --strict-translations
```

Then run `npm run typecheck` from `mobile` and exercise generation for the new city. Stable Italian names are translation keys; avoid changing them after release. Catalog IDs are deterministic, so no manual numeric ID allocation is needed.

Before a release, verify the external links from `mobile`:

```powershell
npm run links:audit
```

The command checks ticket sites, Maps searches, app stores, and legacy lodging links. It follows redirects, distinguishes anti-bot protection from broken pages, and caches stable results for seven days. The reports are written to `backend/reports/link_validation`. Use `npm run links:audit -- --refresh --fail-on broken` for a fresh blocking release check, or add `--city roma` to inspect one city.
