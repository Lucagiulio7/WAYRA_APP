# Pubblicazione Android Urveya

## Stato tecnico richiesto

Prima di creare la build Play Store:

- `npm run typecheck` deve passare dentro `mobile`;
- `npm run release:check` deve completarsi senza errori;
- `npm exec expo-doctor` deve passare tutti i controlli;
- catalogo, contenuti e generazione devono funzionare dalla build Android anche offline;
- le credenziali Supabase pubbliche devono essere configurate solo se si mantiene la sincronizzazione facoltativa degli itinerari salvati;
- privacy, supporto, termini e cancellazione account devono essere pubblicati su URL HTTPS definitivi.

## Architettura di produzione

Urveya non richiede FastAPI o Render per catalogo e generazione: i pacchetti delle
citta e gli itinerari sono inclusi nell'app. Render non deve quindi essere
considerato un requisito della release.

Supabase resta opzionale per autenticazione e sincronizzazione tra dispositivi.
Prima della release:

1. applica `backend/database/supabase_runtime_security.sql`;
2. verifica che la RLS sia attiva su `saved_itineraries`;
3. configura i redirect `urveya://auth-callback` e `urveya://reset-password`;
4. verifica login, sincronizzazione e cancellazione account da una build installata;
5. non inserire mai service-role key o password database nell'app.

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
