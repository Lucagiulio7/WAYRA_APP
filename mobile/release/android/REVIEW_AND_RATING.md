# Urveya - accesso app, revisione e classificazione

## Richiesta di recensione nell'app

La richiesta non deve comparire all'avvio o dopo il primo itinerario. La regola
locale predisposta in `services/reviewEligibility.ts` rende l'utente idoneo dopo
due risultati positivi, per esempio il salvataggio di due viaggi o il salvataggio
e la condivisione di un PDF. Ogni versione dell'app puo tentare la richiesta una
sola volta; il sistema operativo decide comunque se mostrare il dialogo.

Per collegare il prompt nativo alla prossima build serve installare il modulo
compatibile con Expo SDK 54:

```powershell
npx expo install expo-store-review
```

Poi la chiamata va eseguita soltanto dopo un'azione conclusa con successo, usando
`StoreReview.isAvailableAsync()` e `StoreReview.requestReview()`. Non mostrare un
popup preliminare che chieda se l'utente e soddisfatto e non subordinare funzioni
dell'app alla recensione.

## Accesso app

L'account non e necessario per utilizzare le funzioni principali. Il revisore
puo selezionare una citta, generare o creare manualmente un itinerario,
consultare contenuti, mappe e valigia senza effettuare l'accesso.

Testo suggerito per il revisore:

`Urveya can be reviewed without signing in. Account creation is optional and is only used to synchronize saved itineraries across devices. Location permission is requested only after the user explicitly selects the nearby restaurant feature; denying it does not block the itinerary or destination restaurant results.`

Se Google richiede di verificare anche la sincronizzazione, creare prima un
account di test dedicato e inserire le credenziali nella sezione Accesso app.
Non salvare le credenziali in questo repository.

## Pubblicita

- L'app contiene pubblicita: `No`.
- Non e presente alcun SDK pubblicitario.

Aggiornare questa risposta prima di integrare banner o interstitial.

## Pubblico di destinazione

- Scelta proposta: `18 anni e oltre`.
- L'app non e progettata specificamente per bambini.
- Non sono presenti contenuti o meccaniche rivolti ai minori.

## Classificazione contenuti - bozza

Le domande possono cambiare in base al questionario IARC mostrato dalla Play
Console. Per la release corrente le risposte previste sono:

- Violenza: `No`.
- Contenuti sessuali o nudita: `No`.
- Linguaggio volgare: `No`.
- Sostanze controllate: `No`.
- Gioco d'azzardo: `No`.
- Acquisti digitali: `No`.
- Interazione pubblica tra utenti: `No`.
- Condivisione pubblica di contenuti utente: `No`.
- Posizione condivisa pubblicamente: `No`.
- Accesso web senza restrizioni: `No`; l'app apre collegamenti esterni mirati a mappe, biglietti, ristoranti e informazioni di viaggio.

## Note revisore

- La generazione automatica usa pacchetti locali inclusi nell'app.
- Internet non e necessario per consultare il catalogo e gli itinerari locali.
- Le mappe online e i collegamenti esterni richiedono internet.
- Il permesso posizione e facoltativo e viene richiesto durante un'azione utente.
- La cancellazione account si trova nelle Impostazioni.
- Lingue disponibili: italiano, inglese, francese e spagnolo.
