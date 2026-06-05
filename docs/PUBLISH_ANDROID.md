# Pubblicazione Android Wayra

## Stato tecnico richiesto

Prima di creare la build Play Store:

- `npm run typecheck` deve passare dentro `mobile`;
- `npm exec expo-doctor` deve passare 18/18;
- il backend FastAPI deve essere pubblico su HTTPS;
- `mobile/.env.production` deve avere `EXPO_PUBLIC_API_BASE_URL` impostato all'URL pubblico del backend;
- il backend pubblico deve rispondere su `/api/health`;
- la generazione itinerario deve funzionare dalla build Android, non solo da Expo Go.

## Deploy backend

Il backend consigliato e FastAPI pubblico con Supabase come database.

Passaggi consigliati su Render:

1. Collega il repository GitHub `Lucagiulio7/WAYRA_APP`.
2. Crea un servizio usando il file `render.yaml`.
3. Imposta le variabili:
   - `DATABASE_URL`: connection string PostgreSQL Supabase;
   - `ANTHROPIC_API_KEY`: chiave AI, se usata;
   - `SENTRY_DSN`: opzionale;
   - `CORS_ORIGINS`: `*` in test, poi dominio reale in produzione.
4. Verifica:

   ```text
   https://<backend-url>/api/health
   ```

5. Aggiorna `mobile/.env.production`:

   ```text
   EXPO_PUBLIC_API_BASE_URL=https://<backend-url>
   ```

## Test Android senza telefono fisico

Serve Android Studio con:

- Android SDK;
- Android Emulator;
- almeno un Virtual Device;
- `adb` disponibile nel PATH oppure tramite Android Studio.

Comandi utili dopo l'installazione:

```text
npx expo start --android
```

Oppure, per testare una build APK installabile:

```text
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

Il profilo `preview` produce un APK, utile per test interni. Il profilo `production` produce un AAB, necessario per Play Store.

## Build Play Store

Quando il test APK funziona:

```text
npx eas-cli build --platform android --profile production
```

Risultato atteso: file `.aab` da caricare su Google Play Console.

