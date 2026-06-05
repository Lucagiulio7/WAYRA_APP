# Architettura Wayra

## Scelta corrente

Per la pubblicazione dell'app, Wayra usa questa architettura:

- App mobile/web Expo come client.
- Backend FastAPI pubblico come sorgente principale per la generazione degli itinerari.
- Supabase come database e sorgente dati strutturata per citta, attrazioni, alloggi, cucina, cultura e info utili.
- Supabase Edge Functions come opzione futura, non come backend principale finche non saranno riallineate alla logica FastAPI.

## Perche questa scelta

La logica piu aggiornata e testata della generazione itinerari vive nel backend FastAPI, soprattutto per:

- vincoli su giorni, km e intensita viaggio;
- distribuzione delle attrazioni;
- attrazioni imperdibili;
- ottimizzazione del percorso;
- differenza tra iconico ed esploratore;
- gestione dei dati specifici per citta.

Le Edge Functions Supabase esistono gia nel progetto, ma devono essere considerate potenzialmente non allineate al backend Python. Spostare subito la generazione su Supabase potrebbe reintrodurre bug gia corretti nel flusso FastAPI.

## Flusso runtime

In sviluppo con Expo Go:

1. L'app Expo deriva l'IP del PC da Metro.
2. La generazione itinerario chiama il backend locale FastAPI su porta 8000.
3. I dati citta possono essere letti da Supabase o dalle API locali, a seconda della sezione.

In produzione:

1. L'app Expo deve avere `EXPO_PUBLIC_API_BASE_URL` impostato su un URL HTTPS pubblico.
2. La generazione itinerario chiama:

   ```text
   <EXPO_PUBLIC_API_BASE_URL>/api/itinerary/generate
   ```

3. Il backend FastAPI pubblico puo leggere dati da Supabase/Postgres o da sorgenti interne, ma resta la sorgente autorevole per la generazione.

## Regola da ricordare

Prima della pubblicazione su Play Store o App Store, non basta che l'app funzioni in Expo Go: il backend deve essere raggiungibile da internet tramite HTTPS stabile.

`https://api.wayra.app` e un buon target finale, ma deve puntare a un backend FastAPI realmente deployato e funzionante.

## Deploy backend consigliato

Il repository include un `render.yaml` per pubblicare il backend FastAPI su Render.

Configurazione prevista:

- root directory: `backend`;
- build command: `pip install -r requirements.txt`;
- start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`;
- health check: `/api/health`;
- variabile `DATABASE_URL` impostata con la connection string PostgreSQL di Supabase;
- variabile `ANTHROPIC_API_KEY` impostata se si usano funzionalita AI;
- variabile `CORS_ORIGINS` da restringere ai domini reali quando web/app saranno pubblicati.

Per Expo/EAS production, `EXPO_PUBLIC_API_BASE_URL` deve puntare all'URL pubblico del servizio FastAPI.

## Evoluzione futura

Una migrazione completa a Supabase Edge Functions e possibile, ma va fatta solo dopo:

1. confronto tra `backend/services/itinerary_builder.py` e `supabase/functions/_shared/itinerary-builder.ts`;
2. porting della logica piu recente;
3. test di generazione su tutte le citta;
4. verifica che la risposta della Edge Function sia identica a quella attesa dall'app;
5. aggiornamento controllato del client per chiamare `SUPABASE_URL/functions/v1/generate-itinerary`.
