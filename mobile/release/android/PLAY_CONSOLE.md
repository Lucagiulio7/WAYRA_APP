# Wayra - scheda Google Play

Stato: bozza pronta per il primo caricamento interno.

## Identita

- Nome app: `Wayra`
- ID applicazione: `com.wayra.app`
- Categoria proposta: `Viaggi e informazioni locali`
- Email di contatto da confermare: `privacy@wayra.app`
- Privacy policy da pubblicare: `https://wayra.app/privacy`
- Eliminazione account da pubblicare: `https://wayra.app/delete-account`

L'ID applicazione non deve piu cambiare dopo la creazione dell'app in Play Console.

## Testi italiani

### Descrizione breve

Itinerari personalizzati, mappe e consigli di viaggio anche offline.

### Descrizione completa

Wayra ti aiuta a organizzare un viaggio coerente con il tuo ritmo.

Scegli la citta, la durata e l'intensita del viaggio: Wayra distribuisce le attrazioni nei diversi giorni, limita gli spostamenti a piedi e crea un percorso ordinato. Puoi anche costruire l'itinerario manualmente, consultare la mappa e modificare l'ordine delle tappe.

Per ogni destinazione trovi inoltre:

- quartieri consigliati per alloggiare, con pro e contro;
- piatti tipici e ristoranti associati;
- cultura e informazioni pratiche;
- collegamenti a mappe e biglietti quando disponibili;
- salvataggio ed esportazione dell'itinerario in PDF;
- contenuti disponibili in italiano, inglese, francese e spagnolo.

Le informazioni principali e gli itinerari predefiniti restano consultabili anche senza connessione. Alcune funzioni, come mappe esterne, posizione, autenticazione e sincronizzazione, richiedono internet. La posizione viene richiesta solo quando scegli di cercare ristoranti nelle vicinanze.

## Materiale grafico

- Icona Play Store: esportare `public/icon.png` a 512x512 PNG.
- Feature graphic: da creare in formato 1024x500 PNG o JPG.
- Screenshot telefono: almeno 2; obiettivo 6 schermate a 1080x1920.

Sequenza screenshot proposta:

1. Scelta della citta e impostazioni del viaggio.
2. Itinerario giornaliero generato.
3. Mappa delle tappe.
4. Creazione manuale dell'itinerario.
5. Alloggi e mappa dei quartieri.
6. Cucina e ristoranti consigliati.

## Dichiarazioni Play Console

- Pubblicita: `No`, finche non viene integrato un SDK pubblicitario.
- Accesso app: indicare che l'account e facoltativo; fornire un account di test solo se la revisione deve verificare la sincronizzazione.
- Pubblico di destinazione: adulti/general audience, non progettata specificamente per bambini.
- Posizione: approssimativa e precisa, usata solo durante la ricerca volontaria di luoghi vicini; non in background.
- Account: email e identificativo utente quando l'utente sceglie di registrarsi.
- Contenuti utente: itinerari sincronizzati soltanto per utenti autenticati.
- Diagnostica: crash e prestazioni se Sentry e configurato.
- Analytics: facoltativi e disattivati finche l'utente non presta il consenso.

Le risposte definitive della sezione Sicurezza dei dati devono essere ricontrollate sul bundle di produzione e sugli SDK effettivamente configurati.

## Blocchi prima della pubblicazione

- Collegare EAS e generare `extra.eas.projectId`.
- Pubblicare e verificare privacy, termini, supporto ed eliminazione account.
- Confermare una casella email realmente monitorata.
- Generare AAB e caricarlo nel test interno.
- Completare rating contenuti, sicurezza dati, accesso app, pubblico e dichiarazione pubblicita.
- Eseguire test su installazione pulita, offline, permesso posizione e cancellazione account.
