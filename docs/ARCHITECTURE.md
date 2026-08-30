# Architettura Urveya

## Scelta corrente

Urveya adotta un'architettura local-first:

- Expo/React Native con la stessa base di codice per Android, iOS e web;
- pacchetti JSON locali per citta, attrazioni, alloggi, cucina, cultura e info utili;
- 36 combinazioni di itinerario precomputate per ogni citta;
- AsyncStorage e persistenza React Query per bozze, preferenze e uso offline;
- Supabase soltanto per autenticazione e sincronizzazione facoltativa degli itinerari salvati;
- servizi cartografici esterni per le mappe interattive e i collegamenti, con cache locale dei dati scaricabili.

Il runtime dell'app non dipende da FastAPI, Render o dalle vecchie tabelle
Supabase del catalogo. Il preflight di release impedisce che queste dipendenze
vengano reintrodotte accidentalmente.

## Flusso itinerario

1. L'utente sceglie citta, giorni, tipo di esperienza e ritmo.
2. L'app legge il pacchetto locale della citta.
3. Seleziona il piano locale corrispondente e applica normalizzazione e controlli
   su tappe, durata, musei e distanza.
4. L'utente puo modificare o creare manualmente il viaggio senza un backend.
5. Salvataggi, PDF e valigia restano locali; con account, i soli itinerari
   salvati possono essere sincronizzati tramite Supabase.

## Offline e rete

Catalogo, contenuti e generazione funzionano offline. Internet resta necessario
per mappe online, posizione corrente, link esterni, autenticazione e
sincronizzazione. Il download di una citta prepara in anticipo i dati
cartografici e di trasporto supportati, ma una vera mappa raster completamente
offline dipende dalle condizioni del provider cartografico.

## Sicurezza

- Nell'app possono essere incluse soltanto chiavi Supabase pubbliche/anon.
- Password database e service-role key non devono mai entrare nel bundle.
- La tabella `saved_itineraries` deve avere RLS attiva e limitare ogni utente ai
  propri record; lo script autorevole e `backend/database/supabase_runtime_security.sql`.
- Posizione, account e sincronizzazione sono facoltativi.
- Analytics di utilizzo non sono presenti nella release corrente.

## Aggiungere una citta

La sorgente viene mantenuta nei moduli di `backend/database/cities`; gli script
di build producono il pacchetto in `mobile/assets/cities`. Una nuova citta e
completa solo quando supera audit dei contenuti, traduzioni, collegamenti e tutte
le 36 combinazioni di itinerario. Il comando finale e:

```powershell
cd mobile
npm run release:check
```

## Servizi futuri

Un backend potra essere reintrodotto solo per funzioni realmente dinamiche o
pesanti. Le funzioni principali non devono perdere il fallback locale: in questo
modo l'app resta veloce, pubblicabile e utilizzabile anche se un servizio remoto
e temporaneamente indisponibile.
