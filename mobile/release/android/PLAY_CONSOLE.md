# Urveya - scheda Google Play

Stato: documentazione pronta; build e operazioni Play Console ancora da eseguire.

Documenti da usare durante la compilazione:

- `STORE_LISTING.md`: testi localizzati della scheda.
- `DATA_SAFETY.md`: risposte Sicurezza dei dati.
- `REVIEW_AND_RATING.md`: accesso app, pubblicita, pubblico e rating.
- `SCREENSHOTS.md`: piano per gli asset grafici.

## Identita

- Nome app: `Urveya`
- ID applicazione: `com.urveya.app`
- Categoria proposta: `Viaggi e informazioni locali`
- Email di contatto: `wayrapp01@gmail.com`
- Privacy policy: `https://urveya-legal.onrender.com/privacy`
- Eliminazione account: `https://urveya-legal.onrender.com/delete-account`

Il nome definitivo e `Urveya`. La ricerca preliminare non ha rilevato marchi
identici nel settore travel/software; prima del deposito resta consigliata una
verifica professionale di somiglianza. Il dominio e la casella email definitivi
devono ancora essere acquistati e configurati.

L'ID applicazione non deve piu cambiare dopo la creazione dell'app in Play Console.

## Testi italiani

### Descrizione breve

Itinerari personalizzati, mappe e consigli di viaggio anche offline.

### Descrizione completa

Urveya ti aiuta a organizzare un viaggio coerente con il tuo ritmo.

Scegli la citta, la durata e l'intensita del viaggio: Urveya distribuisce le attrazioni nei diversi giorni, limita gli spostamenti a piedi e crea un percorso ordinato. Dalla mappa puoi consultare e modificare l'ordine delle tappe.

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
- Feature graphic pronta: `release/android/assets/feature-graphic-1024x500.png`.
- Screenshot telefono: almeno 2; obiettivo 6 schermate a 1080x1920.

Sequenza screenshot proposta:

1. Scelta della citta e impostazioni del viaggio.
2. Itinerario giornaliero generato.
3. Mappa delle tappe.
4. Alloggi e mappa dei quartieri.
5. Cucina e ristoranti consigliati.
6. Valigia smart.

## Dichiarazioni Play Console

- Pubblicita: `No`, finche non viene integrato un SDK pubblicitario.
- Accesso app: indicare che l'account e facoltativo; fornire un account di test solo se la revisione deve verificare la sincronizzazione.
- Pubblico di destinazione: adulti/general audience, non progettata specificamente per bambini.
- Posizione: approssimativa e precisa, usata solo durante la ricerca volontaria di luoghi vicini; non in background.
- Account: email e identificativo utente quando l'utente sceglie di registrarsi.
- Contenuti utente: itinerari sincronizzati soltanto per utenti autenticati.
- Diagnostica e crash log: non raccolti nella prima release.
- Analytics di utilizzo: non presenti nella release.

Le risposte definitive della sezione Sicurezza dei dati devono essere ricontrollate sul bundle di produzione e sugli SDK effettivamente configurati.

## Blocchi prima della pubblicazione

- EAS e gia collegato al progetto Expo.
- Pubblicare e verificare privacy, termini, supporto ed eliminazione account.
- Confermare una casella email realmente monitorata.
- Generare AAB e caricarlo nel test interno.
- Completare rating contenuti, sicurezza dati, accesso app, pubblico e dichiarazione pubblicita.
- Eseguire test su installazione pulita, offline, permesso posizione e cancellazione account.
