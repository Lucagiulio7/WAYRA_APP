# Local city catalog

`cityRegistry.ts` is the only client file to edit when adding a city. It controls Home search, country grouping, city labels, and the city icon.

The city ID must exactly match `CITY_ID` in `backend/database/cities/<city>.py`. Put every localized display name in `labels`, for example `{ it: "...", en: "...", fr: "...", es: "..." }`. Missing labels fall back to English and then Italian.

## Runtime architecture

The published app bundles the complete travel catalog for all cities:

- attractions and food spots;
- practical information, neighborhoods, cuisine and culture;
- localized content;
- precomputed itinerary plans for every experience, duration and walking mode.

Itinerary generation and manual creation do not require Render, Supabase, or an internet connection. Saved itineraries are written to AsyncStorage first. When the user is signed in, Supabase only adds optional account synchronization.

Internet is intentionally used for map tiles and map libraries, Google Maps and store links, authentication, optional synchronization, and consented analytics. A map can therefore be unavailable offline without blocking the itinerary itself.

## Rebuilding packages

After editing city content or translations, rebuild the Expo packages from the project root:

```powershell
backend\venv\Scripts\python.exe backend\scripts\build_mobile_city_packages.py
```

If practical information or neighborhoods are still maintained remotely, refresh their versioned snapshot first:

```powershell
backend\venv\Scripts\python.exe backend\scripts\export_supabase_city_snapshot.py
backend\venv\Scripts\python.exe backend\scripts\build_mobile_city_packages.py
```

Then validate the mobile project:

```powershell
cd mobile
npm run content:audit
npm run typecheck
npm test -- --runInBand
npx expo start -c
```

`npm run content:audit` checks all bundled cities without changing their data. It validates counts, IDs, coordinates, four-language coverage, visible-text encoding, links, itinerary plans, and alignment with the city, activity, neighborhood, and transit registries. The latest reports are written to:

- `backend/reports/content_validation/content_validation_latest.md` for editorial review;
- `backend/reports/content_validation/content_validation_latest.json` for automation.

To inspect one city or optionally verify links online:

```powershell
node scripts/run-content-audit.js --city roma --fail-on none
node scripts/run-content-audit.js --check-links --fail-on none
```

The release command runs the deterministic audit automatically. Structural errors stop the release, while editorial warnings remain visible in the report:

```powershell
npm run release:check
```
