# Prima build Android

## 1. Collegamento Expo

Il progetto e gia collegato all'account `lucagiulio799` con project ID:

`35fadf8a-85b3-430d-86b7-01f6adf9f8c5`

Il progetto EAS mantiene per ora lo slug tecnico `viaggio-ai`. Il nome mostrato
nell'app e negli store e `Urveya`; lo slug non e visibile agli utenti e resta
invariato per non interrompere il collegamento al project ID esistente.

Non eseguire nuovamente `eas init`. Se EAS richiede l'accesso, usare soltanto
`npx eas-cli@latest login`.

## 2. Variabili di produzione

### Pagine legali pubbliche

Il Blueprint `render.yaml` include il sito statico gratuito `urveya-legal`,
pubblicato su:

- `https://urveya-legal.onrender.com/privacy`
- `https://urveya-legal.onrender.com/terms`
- `https://urveya-legal.onrender.com/delete-account`
- `https://urveya-legal.onrender.com/support`

L'host Render e definitivo per la prima release. Il dominio personalizzato puo
essere aggiunto in seguito senza modificare il contenuto delle pagine.

### Supabase

Configurare nel progetto EAS le stesse chiavi presenti in `.env.production`, senza commetterne i valori su Git:

```powershell
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --visibility sensitive
```

La chiave anonima Supabase e pubblicabile per natura, ma va comunque gestita centralmente; la sicurezza dei dati dipende dalle policy RLS del database.

La prima release non include Sentry e non raccoglie crash log o diagnostica.
Non configurare `EXPO_PUBLIC_SENTRY_DSN`.

Prima della build applicare in Supabase:

```text
backend/database/supabase_runtime_security.sql
```

Poi verificare che RLS risulti attiva su `saved_itineraries`.

In Supabase, aprire **Authentication > URL Configuration** e aggiungere alla redirect allow list:

- `urveya://auth-callback`
- `urveya://reset-password`

Tenere temporaneamente anche i precedenti redirect `viaggio-ai://...` finche le
vecchie build di prova sono installate; potranno essere rimossi dopo aver
verificato accesso e recupero password nella prima build Urveya.

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

Dopo aver scaricato l'APK dalla pagina EAS, installarlo nell'emulatore gia
configurato con:

```powershell
.\release\android\install-preview.ps1 -ApkPath "$HOME\Downloads\nome-build.apk"
```

Lo script trova automaticamente Android SDK, avvia `Pixel_8`, attende il boot,
installa l'APK e apre Urveya. Non e necessario aggiungere `adb` al PATH.

## 5. Bundle Play Store

Dopo il test dell'APK:

```powershell
$env:npm_config_offline="false"
npx eas-cli@latest build --platform android --profile production
```

Il profilo `production` crea l'AAB da caricare in Play Console e incrementa automaticamente il `versionCode`.

## 6. Primo caricamento

In Play Console creare l'app con ID `com.urveya.app`, aprire **Test > Test interno**, creare una release e caricare l'AAB. Il primo caricamento manuale e il metodo piu semplice; l'automazione con EAS Submit puo essere configurata dopo.
