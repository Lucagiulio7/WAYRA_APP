# Adding a content language

The app and API use the same language code and the same `translations` contract.

## Client interface

1. Create `mobile/i18n/translations/<code>.ts` implementing `TranslationSet`.
2. Import it and add one entry to `LANGUAGE_REGISTRY` in `mobile/i18n/index.ts`.

The language immediately appears in Settings. Shared interface copy comes from the new `TranslationSet`; missing content data falls back to English and then Italian.

## City content

Create `backend/database/translations/<code>.json`. The backend discovers it automatically, so routers and city modules do not need changes.

```json
{
  "attractions": {
    "roma": {
      "Colosseo": { "name": "...", "description": "..." }
    }
  },
  "foods": {
    "roma": {
      "Carbonara": { "name": "...", "description": "...", "ingredients": ["..."] }
    }
  },
  "culture_facts": {
    "roma": {
      "sort:0": { "title": "...", "body": "..." }
    }
  },
  "city_info": {
    "roma": { "currency": "...", "language": "...", "quick_tips": ["..."] }
  },
  "neighborhoods": {
    "roma": {
      "Trastevere": { "name": "...", "description": "..." }
    }
  }
}
```

Files must be UTF-8 JSON. Use canonical Italian names as stable keys. Run:

```powershell
cd backend
python scripts/validate_content.py --language <code> --strict-translations
```
