# ViaggioAI

App mobile per la generazione di itinerari di viaggio personalizzati con AI.

---

## Struttura progetto

```
APP_VIAGGIO_2/
├── backend/          # FastAPI + SQLite + Claude AI
└── mobile/           # Expo React Native (Expo Go)
```

---

## Setup Backend

```bash
cd backend

# 1. Copia e configura le variabili d'ambiente
cp .env.example .env
# → Apri .env e inserisci la tua ANTHROPIC_API_KEY

# 2. Crea virtualenv e installa dipendenze
python -m venv venv
source venv/Scripts/activate   # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt

# 3. Avvia il server (popola automaticamente il DB al primo avvio)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Il server sarà disponibile su `http://localhost:8000`  
Docs interattive: `http://localhost:8000/docs`

---

## Setup Mobile (Expo Go)

```bash
cd mobile

npm install

# Trova il tuo IP locale:
# Windows: ipconfig → "Indirizzo IPv4"
# Mac/Linux: ifconfig | grep inet

# Modifica mobile/constants/api.ts con il tuo IP:
# export const API_BASE_URL = "http://TUO_IP:8000";

npx expo start
```

Scansiona il QR code con l'app **Expo Go** sul telefono.  
Assicurati che il telefono sia sulla **stessa rete WiFi** del PC.

---

## API Endpoints

| Metodo | Path | Descrizione |
|--------|------|-------------|
| `GET` | `/api/health` | Healthcheck |
| `GET` | `/api/attractions?city=roma&level=1` | Lista attrazioni |
| `GET` | `/api/foods?city=roma` | Lista piatti tipici |
| `POST` | `/api/itinerary/generate` | Genera itinerario |

### Esempio richiesta itinerario

```json
POST /api/itinerary/generate
{
  "city": "roma",
  "num_days": 3,
  "level": 2
}
```

Per mix di livelli:
```json
{
  "city": "roma",
  "num_days": 4,
  "level": [1, 2, 3]
}
```

### Esempio risposta

```json
{
  "success": true,
  "data": {
    "city": "roma",
    "num_days": 3,
    "level": 2,
    "days": [
      {
        "day_number": 1,
        "narrative": "Comincia il tuo viaggio nel cuore pulsante di Roma...",
        "attractions": [
          {
            "id": 1,
            "name": "Colosseo",
            "description": "L'anfiteatro più grande mai costruito...",
            "wiki_snippet": "Il Colosseo è un anfiteatro situato nel centro di Roma...",
            "category_level": 1,
            "latitude": 41.8902,
            "longitude": 12.4922,
            "estimated_visit_time": 120,
            "tags": ["storia", "archeologia", "architettura"]
          }
        ]
      }
    ],
    "foods": [
      {
        "id": 1,
        "name": "Cacio e Pepe",
        "description": "Il piatto simbolo di Roma...",
        "ingredients": ["tonnarelli", "pecorino romano", "pepe nero"],
        "city": "roma"
      }
    ]
  }
}
```

---

## Architettura

```
backend/
├── main.py                    # FastAPI entry point + CORS
├── database/
│   ├── db.py                  # SQLAlchemy engine + session
│   ├── models.py              # Attraction, Food models
│   └── seed_data.py           # 23 attrazioni Roma + 8 piatti
├── routers/
│   ├── itinerary.py           # POST /api/itinerary/generate
│   └── attractions.py         # GET /api/attractions, /foods, /health
├── agents/
│   └── itinerary_agent.py     # Claude AI agent (claude-sonnet-4-6)
└── services/
    ├── clustering.py          # Algoritmo di clustering geografico
    └── wikipedia.py           # Wikipedia API + cache LRU

mobile/
├── app/
│   ├── _layout.tsx            # Root layout (Expo Router)
│   ├── index.tsx              # Home: selezione parametri
│   └── itinerary.tsx          # Itinerario + cucina locale
├── components/
│   ├── DayCard.tsx            # Card giornata collassabile
│   ├── AttractionCard.tsx     # Card attrazione con Wikipedia snippet
│   └── FoodCard.tsx           # Card piatto tipico
├── hooks/
│   └── useItinerary.ts        # Hook per chiamate API
├── types/index.ts             # TypeScript interfaces
└── constants/api.ts           # URL backend (⚠️ configurare IP)
```

---

## Algoritmo itinerario

1. **Selezione attrazioni** — filtra per città e livello, bilancia il numero per giorno
2. **Clustering geografico** — suddivide le attrazioni in fasce latitudinali (N→S)
3. **Ottimizzazione intra-giornaliera** — nearest-neighbour greedy per minimizzare spostamenti
4. **Limite temporale** — max 7 ore di attività per giorno (~420 min)
5. **Narrativa AI** — Claude scrive una presentazione poetica per ogni giorno
6. **Snippet Wikipedia** — estratti automatici in italiano con cache LRU

---

## Scalabilità futura

- Aggiungere nuove città: inserire righe in `seed_data.py` con `city="napoli"` ecc.
- Rating utenti: aggiungere tabella `ratings(user_id, attraction_id, score)`
- Interessi/budget: estendere `ItineraryRequest` con campi opzionali
- PostgreSQL: cambiare `DATABASE_URL` in `.env` (nessuna modifica al codice)
