# Urveya - piano screenshot Google Play

Gli screenshot devono provenire dalla build `preview` o `production`, non da
Expo Go. Usare un emulatore senza notifiche, con batteria e rete visibili e
interfaccia impostata in inglese per una presentazione internazionale coerente.

## Formato

- Orientamento: verticale.
- Dimensione finale: `1080x1920` PNG senza trasparenza.
- Quantita: 6 principali; 8 se tutte le schermate risultano pulite.
- Non mostrare email, coordinate personali, notifiche o dati di test.
- Non aggiungere cornici di telefoni o loghi di altri store.
- Gli elementi importanti devono restare lontani dai bordi.

Se il Pixel 8 produce immagini piu alte, impostare temporaneamente:

```powershell
adb shell wm size 1080x1920
adb shell wm density 420
```

Al termine ripristinare con:

```powershell
adb shell wm size reset
adb shell wm density reset
```

## Sequenza principale

1. `01-home.png`
   - Home con destinazione selezionata, Iconico/Esploratore, giorni e ritmo.
   - Citta consigliata: Rome o Paris, con tutti i testi dell'interfaccia in inglese.
2. `02-itinerario.png`
   - Itinerario generato con almeno due giornate e una giornata aperta.
   - Devono essere leggibili tappe, ore e distanza.
3. `03-mappa-itinerario.png`
   - Mappa con tappe, percorso e trasporti visibili ma non sovraccarichi.
4. `04-alloggi.png`
   - Mappa alloggi con poligoni dei quartieri e attrazioni iconiche.
5. `05-cucina.png`
   - Piatti tipici con icone diverse e un ristorante consigliato aperto.
6. `06-valigia-smart.png`
   - Checklist valigia adattata a durata, clima e tipo di viaggio.

## Screenshot aggiuntivi

7. `07-valigia-smart.png`
   - Lista generata con durata e tipologia di viaggio visibili.
8. `08-pdf.png`
   - Anteprima PDF a schermo intero con impaginazione pulita.

## Controllo prima del caricamento

- Nessun testo tagliato o sovrapposto.
- Nessuna parola italiana, francese o spagnola nell'interfaccia o nelle didascalie promozionali.
- Nessun indicatore di sviluppo, Metro o Expo Go.
- Nessun popup di errore o stato di caricamento.
- Contrasto leggibile sia sulle mappe sia sulle card.
- La prima immagine comunica subito che Urveya crea itinerari personalizzati.
- Le prime quattro immagini mostrano funzioni diverse e reali dell'app.

## Asset gia pronto

- Icona: `assets/icon-512.png` (`512x512`).
- Feature graphic: `assets/feature-graphic-1024x500.png` (`1024x500`).
