# Prima build Android

## 1. Collegamento Expo

Il progetto e gia collegato all'account `lucagiulio799` con project ID:

`35fadf8a-85b3-430d-86b7-01f6adf9f8c5`

Non eseguire nuovamente `eas init`. Se EAS richiede l'accesso, usare soltanto
`npx eas-cli@latest login`.

## 2. Variabili di produzione

Configurare nel progetto EAS le stesse chiavi presenti in `.env.production`, senza commetterne i valori su Git:

```powershell
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --visibility sensitive
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SENTRY_DSN --visibility sensitive
```

La chiave anonima Supabase e pubblicabile per natura, ma va comunque gestita centralmente; la sicurezza dei dati dipende dalle policy RLS del database.

In Supabase, aprire **Authentication > URL Configuration** e aggiungere alla redirect allow list:

- `viaggio-ai://auth-callback`
- `viaggio-ai://reset-password`

Questi deep link sono necessari rispettivamente per l'accesso Google e per il recupero password nell'app installata.

## 3. Controllo locale

```powershell
npm ci
npm run release:check
```

## 4. APK per prova interna

```powershell
$env:npm_config_offline="false"
npx eas-cli@latest build --platform android --profile preview
```

Il profilo `preview` crea un APK installabile direttamente su un telefono o emulatore Android.

## 5. Bundle Play Store

Dopo il test dell'APK:

```powershell
$env:npm_config_offline="false"
npx eas-cli@latest build --platform android --profile production
```

Il profilo `production` crea l'AAB da caricare in Play Console e incrementa automaticamente il `versionCode`.

## 6. Primo caricamento

In Play Console creare l'app con ID `com.wayra.app`, aprire **Test > Test interno**, creare una release e caricare l'AAB. Il primo caricamento manuale e il metodo piu semplice; l'automazione con EAS Submit puo essere configurata dopo.
