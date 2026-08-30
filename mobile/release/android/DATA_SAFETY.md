# Urveya - Sicurezza dei dati Google Play

Questa bozza descrive il comportamento della release corrente. Ricontrollare le
risposte sul bundle definitivo prima dell'invio.

## Risposte generali

- L'app raccoglie o condivide dati utente: `Si`.
- I dati sono cifrati durante il trasferimento: `Si` (HTTPS/TLS).
- L'utente puo richiedere la cancellazione: `Si`.
- Cancellazione dentro l'app: `Impostazioni > Elimina account`.
- URL cancellazione esterna: `https://wayra.app/delete-account`.
- Condivisione di dati per pubblicita o vendita: `No`.
- Pubblicita presenti nella release: `No`.

Supabase e il provider cartografico sono fornitori di
servizio. Non usare la risposta "condiviso" se operano esclusivamente per conto
di Urveya secondo i relativi contratti; ricontrollare comunque la definizione
mostrata dalla Play Console al momento della compilazione.

## Tipi di dati da dichiarare

### Posizione approssimativa e precisa

- Raccolta: `Si`, dichiarazione prudenziale per la ricerca volontaria nelle vicinanze e il caricamento cartografico.
- Condivisione: `No`.
- Obbligatoria: `No`, la funzione e facoltativa.
- Elaborazione temporanea: `Si`; Urveya non salva le coordinate nel database.
- Finalita: `Funzionalita dell'app`.

### Informazioni personali - Indirizzo email

- Raccolta: `Si`, solo se l'utente crea un account.
- Condivisione: `No`.
- Obbligatoria: `No`.
- Finalita: `Funzionalita dell'app` e `Gestione account`.
- Eliminazione: insieme all'account.

### Identificativi utente

- Raccolta: `Si`, solo per utenti autenticati.
- Condivisione: `No`.
- Obbligatoria: `No`.
- Finalita: `Funzionalita dell'app`, `Gestione account`.

### Contenuti generati dagli utenti - Altri contenuti

- Dato: itinerari salvati e relative scelte.
- Raccolta: `Si` solo quando un utente autenticato usa la sincronizzazione.
- Condivisione: `No`.
- Obbligatoria: `No`; senza account gli itinerari restano locali.
- Finalita: `Funzionalita dell'app`.
- Eliminazione: dalla lista salvati o tramite eliminazione account.

### Crash log e diagnostica

- Crash log: `No`.
- Diagnostica: `No`.
- La prima release non include un SDK di crash reporting attivo.

## Tipi non raccolti

- Nome, indirizzo fisico e numero di telefono.
- Informazioni finanziarie.
- Contatti.
- Foto, video, audio e file personali.
- Messaggi.
- Informazioni sanitarie, fitness o sensibili.
- Cronologia di navigazione e ricerca esterna.
- Identificativo pubblicitario.

## Controlli prima dell'invio

- Verificare che `privacy@wayra.app` sia monitorata.
- Verificare che l'URL di cancellazione sia pubblico e funzionante.
- Verificare RLS su `saved_itineraries`.
- Verificare che il bundle definitivo non includa SDK diagnostici aggiunti successivamente.
