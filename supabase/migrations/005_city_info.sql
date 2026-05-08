-- ============================================================
-- WAYRA — Migration 005: tabella city_info (info pratiche viaggio)
-- ============================================================

CREATE TABLE IF NOT EXISTS city_info (
  id                SERIAL PRIMARY KEY,
  city              TEXT UNIQUE NOT NULL,
  currency          TEXT NOT NULL,
  currency_en       TEXT,
  language          TEXT NOT NULL,
  language_en       TEXT,
  english_level     TEXT NOT NULL DEFAULT 'medio',
  english_note      TEXT,
  english_note_en   TEXT,
  timezone          TEXT NOT NULL,
  emergency_numbers JSONB NOT NULL DEFAULT '[]',
  voltage           TEXT,
  water             TEXT,
  water_en          TEXT,
  tipping           TEXT,
  tipping_en        TEXT,
  transport_apps    JSONB NOT NULL DEFAULT '[]',
  useful_apps       JSONB NOT NULL DEFAULT '[]',
  quick_tips        TEXT[] DEFAULT '{}',
  quick_tips_en     TEXT[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_city_info_city ON city_info(city);

ALTER TABLE city_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "city_info_public_read" ON city_info FOR SELECT USING (true);

-- ── Roma ─────────────────────────────────────────────────────────────────────
INSERT INTO city_info (
  city, currency, currency_en, language, language_en,
  english_level, english_note, english_note_en,
  timezone, emergency_numbers, voltage, water, water_en,
  tipping, tipping_en, transport_apps, useful_apps,
  quick_tips, quick_tips_en
) VALUES (
  'roma',
  'Euro (€)', 'Euro (€)',
  'Italiano', 'Italian',
  'medio',
  'Diffuso nelle zone turistiche, meno nei quartieri locali',
  'Widely spoken in tourist areas, less so in local neighbourhoods',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[
    {"label": "Emergenze generali", "label_en": "General emergency", "number": "112"},
    {"label": "Ambulanza", "label_en": "Ambulance", "number": "118"},
    {"label": "Polizia", "label_en": "Police", "number": "113"},
    {"label": "Vigili del fuoco", "label_en": "Fire brigade", "number": "115"}
  ]',
  '230V — presa tipo F/L (standard europeo + italiana)',
  'Potabile dal rubinetto. I nasoni (fontanelle verdi) erogano acqua fresca gratuita ovunque in citta.',
  'Tap water is safe to drink. The nasoni (small green fountains) provide free fresh water throughout the city.',
  'Non obbligatoria. Al ristorante si arrotonda o si lascia 5-10% se il servizio e stato ottimo.',
  'Not mandatory. At restaurants, rounding up or leaving 5-10% for excellent service is appreciated.',
  $$[
    {"name": "Moovit", "description": "Pianifica percorsi su metro, bus e tram con orari in tempo reale", "description_en": "Plan metro, bus and tram routes with real-time schedules", "ios_url": "https://apps.apple.com/app/moovit/id498477945", "android_url": "https://play.google.com/store/apps/details?id=com.tranzmate"},
    {"name": "Roma Mobilita", "description": "App ufficiale ATAC per metro e bus di Roma", "description_en": "Official ATAC app for Rome metro and buses", "ios_url": "https://apps.apple.com/it/app/roma-mobilita/id1062913438", "android_url": "https://play.google.com/store/apps/details?id=it.atac.romamobilita"},
    {"name": "Trenitalia", "description": "Per treni regionali e gite fuori porta", "description_en": "For regional trains and day trips", "ios_url": "https://apps.apple.com/it/app/trenitalia/id522343829", "android_url": "https://play.google.com/store/apps/details?id=it.trenitalia"}
  ]$$,
  $$[
    {"name": "TheFork", "description": "Prenotazione ristoranti con sconti fino al 50%", "description_en": "Restaurant bookings with discounts up to 50%", "ios_url": "https://apps.apple.com/app/thefork/id535276978", "android_url": "https://play.google.com/store/apps/details?id=com.lafourchette.lafourchette"},
    {"name": "Google Maps", "description": "Navigazione e ricerca luoghi offline", "description_en": "Navigation and offline place search", "ios_url": "https://apps.apple.com/app/google-maps/id585027354", "android_url": "https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}
  ]$$,
  ARRAY[
    'Valida il biglietto PRIMA di salire su bus e tram: i controllori multano senza preavviso',
    'Il biglietto singolo dura 100 minuti e vale per una corsa metro + bus illimitati',
    'Evita i taxi non ufficiali fuori Termini: usa sempre taxi bianchi con tassametro o Uber',
    'Molti musei statali sono gratuiti la prima domenica del mese',
    $$Portare sempre acqua: le estati romane sono torride e l'ombra e scarsa$$
  ],
  ARRAY[
    'Validate your ticket BEFORE boarding buses and trams — inspectors fine without warning',
    'A single ticket lasts 100 minutes and covers one metro ride + unlimited buses',
    'Avoid unofficial taxis outside Termini station: use white official cabs with meters or Uber',
    'Many state museums are free on the first Sunday of every month',
    'Always carry water: Roman summers are scorching and shade is scarce'
  ]
);

-- ── Milano ────────────────────────────────────────────────────────────────────
INSERT INTO city_info (
  city, currency, currency_en, language, language_en,
  english_level, english_note, english_note_en,
  timezone, emergency_numbers, voltage, water, water_en,
  tipping, tipping_en, transport_apps, useful_apps,
  quick_tips, quick_tips_en
) VALUES (
  'milano',
  'Euro (€)', 'Euro (€)',
  'Italiano', 'Italian',
  'medio',
  'Buon livello nel centro e nelle zone di moda e design, meno diffuso nei quartieri periferici',
  'Good level in the centre and fashion/design districts, less common in outer neighbourhoods',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[
    {"label": "Emergenze generali", "label_en": "General emergency", "number": "112"},
    {"label": "Ambulanza", "label_en": "Ambulance", "number": "118"},
    {"label": "Polizia", "label_en": "Police", "number": "113"}
  ]',
  '230V — presa tipo F/L (standard europeo + italiana)',
  'Potabile e di buona qualita. Le fontanelle pubbliche sono sicure.',
  'Safe to drink and good quality. Public fountains are safe.',
  'Non obbligatoria. Al bar e al ristorante si arrotonda o si lascia 1-2€ al bancone.',
  'Not mandatory. At bars and restaurants, rounding up or leaving €1-2 at the counter is customary.',
  $$[
    {"name": "ATM Milano", "description": "App ufficiale per metro, tram e bus di Milano con orari in tempo reale", "description_en": "Official app for Milan metro, trams and buses with real-time schedules", "ios_url": "https://apps.apple.com/it/app/atm-milano/id635490946", "android_url": "https://play.google.com/store/apps/details?id=it.atm.app"},
    {"name": "Moovit", "description": "Pianificazione percorsi multimodale", "description_en": "Multimodal route planning", "ios_url": "https://apps.apple.com/app/moovit/id498477945", "android_url": "https://play.google.com/store/apps/details?id=com.tranzmate"},
    {"name": "BikeMi", "description": "Bike sharing ufficiale di Milano", "description_en": "Milan official bike-sharing service", "ios_url": "https://apps.apple.com/it/app/bikemi/id556577567", "android_url": "https://play.google.com/store/apps/details?id=com.cbw.bikemi"}
  ]$$,
  $$[
    {"name": "Satispay", "description": "Pagamenti digitali molto usati nei locali milanesi", "description_en": "Digital payments widely used in Milan venues", "ios_url": "https://apps.apple.com/it/app/satispay/id982085702", "android_url": "https://play.google.com/store/apps/details?id=com.satispay.customer"},
    {"name": "Google Maps", "description": "Navigazione e ricerca luoghi", "description_en": "Navigation and place search", "ios_url": "https://apps.apple.com/app/google-maps/id585027354", "android_url": "https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}
  ]$$,
  ARRAY[
    $$L'aperitivo milanese (dalle 18:00) include spesso un ricco buffet gratuito con la consumazione$$,
    'La domenica molte zone dello shopping (Quadrilatero della Moda) sono chiuse',
    'Il trasporto notturno (Notte) copre le principali linee ma con frequenza ridotta',
    'Valida sempre il biglietto: i controllori ATM sono molto presenti',
    'Per la Fashion Week e il Salone del Mobile i prezzi degli hotel triplicano: prenota mesi prima'
  ],
  ARRAY[
    $$Milan's aperitivo (from 6 pm) often includes a generous free buffet with your drink$$,
    'On Sundays many shopping areas (Quadrilatero della Moda) are closed',
    'Night transport covers main lines but with reduced frequency',
    'Always validate your ticket: ATM inspectors are very active',
    'During Fashion Week and Salone del Mobile hotel prices triple — book months in advance'
  ]
);

-- ── Barcellona ────────────────────────────────────────────────────────────────
INSERT INTO city_info (
  city, currency, currency_en, language, language_en,
  english_level, english_note, english_note_en,
  timezone, emergency_numbers, voltage, water, water_en,
  tipping, tipping_en, transport_apps, useful_apps,
  quick_tips, quick_tips_en
) VALUES (
  'barcellona',
  'Euro (€)', 'Euro (€)',
  'Catalano e Castigliano (Spagnolo)', 'Catalan and Castilian (Spanish)',
  'alto',
  'Ottimo nelle zone turistiche e tra i giovani. I segnali stradali sono in catalano.',
  'Excellent in tourist areas and among young people. Street signs are in Catalan.',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[
    {"label": "Emergenze generali", "label_en": "General emergency", "number": "112"},
    {"label": "Polizia Nazionale", "label_en": "National Police", "number": "091"},
    {"label": "Ambulanza", "label_en": "Ambulance", "number": "061"}
  ]',
  '230V — presa tipo F (standard europeo)',
  $$Tecnicamente potabile, ma il sapore di cloro e marcato. Molti locali consigliano l'acqua in bottiglia.$$,
  'Technically drinkable, but the chlorine taste is strong. Many locals recommend bottled water.',
  'Non obbligatoria ma apprezzata. Al ristorante si lascia il 5-10%, al bar si arrotonda.',
  'Not mandatory but appreciated. Leave 5-10% at restaurants, round up at bars.',
  $$[
    {"name": "TMB App", "description": "App ufficiale per metro e bus di Barcellona con mappe e orari", "description_en": "Official app for Barcelona metro and buses with maps and timetables", "ios_url": "https://apps.apple.com/app/tmb-app/id1076566093", "android_url": "https://play.google.com/store/apps/details?id=cat.tmb.appandroid"},
    {"name": "Moovit", "description": "Pianificazione percorsi e orari in tempo reale", "description_en": "Route planning and real-time schedules", "ios_url": "https://apps.apple.com/app/moovit/id498477945", "android_url": "https://play.google.com/store/apps/details?id=com.tranzmate"},
    {"name": "Bicing", "description": "Bike sharing pubblico di Barcellona (richiede abbonamento mensile)", "description_en": "Barcelona public bike-sharing (requires monthly subscription)", "ios_url": "https://apps.apple.com/es/app/bicing/id1475440734", "android_url": "https://play.google.com/store/apps/details?id=com.bsmsa.bicing"}
  ]$$,
  $$[
    {"name": "Cabify", "description": "Alternativa locale a Uber per taxi e NCC", "description_en": "Local alternative to Uber for taxis and private hire", "ios_url": "https://apps.apple.com/app/cabify/id476087442", "android_url": "https://play.google.com/store/apps/details?id=com.cabify.rider"},
    {"name": "Google Maps", "description": "Navigazione con modalita trasporto pubblico integrata", "description_en": "Navigation with integrated public transport mode", "ios_url": "https://apps.apple.com/app/google-maps/id585027354", "android_url": "https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}
  ]$$,
  ARRAY[
    'La T-Casual (10 viaggi) e la tessera piu conveniente per chi resta pochi giorni',
    'Attenzione ai borseggiatori sulle Ramblas e sulla metro: tieni lo zaino davanti',
    'I ristoranti aprono tardi: pranzo dalle 14:00, cena dalle 21:00. Presentarsi prima significa trovare il locale vuoto',
    'La spiaggia e raggiungibile con la metro linea 4 (gialla) fino a Barceloneta',
    'Uber non e disponibile: usa Cabify o i taxi ufficiali (con tassametro)'
  ],
  ARRAY[
    'The T-Casual (10 trips) is the most convenient card for short stays',
    'Watch out for pickpockets on Las Ramblas and the metro — keep your bag in front of you',
    'Restaurants open late: lunch from 2 pm, dinner from 9 pm. Arriving earlier means an empty restaurant',
    'The beach is reachable by metro line 4 (yellow) to Barceloneta',
    'Uber is not available — use Cabify or official taxis (with meter)'
  ]
);

-- ── Parigi ────────────────────────────────────────────────────────────────────
INSERT INTO city_info (
  city, currency, currency_en, language, language_en,
  english_level, english_note, english_note_en,
  timezone, emergency_numbers, voltage, water, water_en,
  tipping, tipping_en, transport_apps, useful_apps,
  quick_tips, quick_tips_en
) VALUES (
  'parigi',
  'Euro (€)', 'Euro (€)',
  'Francese', 'French',
  'medio',
  'Nelle zone turistiche si, ma i parigini apprezzano molto un tentativo in francese (anche solo Bonjour!)',
  'English is spoken in tourist areas, but Parisians greatly appreciate even a brief attempt in French (even just Bonjour!)',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[
    {"label": "Emergenze generali", "label_en": "General emergency", "number": "112"},
    {"label": "SAMU (ambulanza)", "label_en": "SAMU (ambulance)", "number": "15"},
    {"label": "Polizia", "label_en": "Police", "number": "17"},
    {"label": "Pompieri", "label_en": "Fire brigade", "number": "18"}
  ]',
  '230V — presa tipo E (standard francese/europeo)',
  'Potabile e di ottima qualita. Esistono fontanelle pubbliche gratuite in tutta la citta (mappa su Eau de Paris).',
  'Safe to drink and excellent quality. Free public fountains are available across the city (map on Eau de Paris website).',
  'Non obbligatoria: il servizio e incluso nel prezzo per legge. Si lascia 1-2€ al bar, 5-10% al ristorante per soddisfazione.',
  $$Not mandatory: service charge is included by law. Leave €1-2 at cafes, 5-10% at restaurants if you're happy with the service.$$,
  $$[
    {"name": "RATP", "description": "App ufficiale per metro, RER, bus e tram parigini con orari in tempo reale", "description_en": "Official app for Paris metro, RER, buses and trams with real-time info", "ios_url": "https://apps.apple.com/app/ratp/id507107090", "android_url": "https://play.google.com/store/apps/details?id=com.fabernovel.ratp"},
    {"name": "Citymapper", "description": "Pianificazione percorsi avanzata con tutte le modalita di trasporto", "description_en": "Advanced route planning covering all transport modes", "ios_url": "https://apps.apple.com/app/citymapper/id469463298", "android_url": "https://play.google.com/store/apps/details?id=com.citymapper.app.release"},
    {"name": "Velib Metropole", "description": "Bike sharing con oltre 1.400 stazioni in citta", "description_en": "Bike-sharing with over 1,400 stations across the city", "ios_url": "https://apps.apple.com/fr/app/velib-metropole/id1360768361", "android_url": "https://play.google.com/store/apps/details?id=com.massmob.velib"}
  ]$$,
  $$[
    {"name": "Ile-de-France Mobilites", "description": "Acquisto biglietti Navigo e abbonamenti ufficiali", "description_en": "Buy Navigo tickets and official transport passes", "ios_url": "https://apps.apple.com/fr/app/ile-de-france-mobilites/id1440799600", "android_url": "https://play.google.com/store/apps/details?id=fr.iledefrance.mobilites.journey"},
    {"name": "Google Maps", "description": "Navigazione e ricerca luoghi con modalita offline", "description_en": "Navigation and offline place search", "ios_url": "https://apps.apple.com/app/google-maps/id585027354", "android_url": "https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}
  ]$$,
  ARRAY[
    'Inizia sempre con Bonjour Madame/Monsieur: i parigini rispondono molto meglio',
    'Il Navigo Easy (ricaricabile) e piu conveniente dei biglietti singoli se fai piu di 2 corse al giorno',
    'Molti musei (Louvre, Orsay) esauriscono i biglietti online settimane prima: prenota sempre in anticipo',
    'Le brasserie e i bistrot servono cibo anche fuori dagli orari canonici: utile se arrivi tardi',
    'Le zone periferiche (oltre il Peripherique) hanno poca connessione metro: pianifica bene gli spostamenti'
  ],
  ARRAY[
    'Always start with Bonjour Madame/Monsieur — Parisians respond much better',
    'The Navigo Easy (rechargeable card) is cheaper than single tickets if you take more than 2 trips a day',
    'Major museums (Louvre, Orsay) sell out online weeks ahead — always book in advance',
    'Brasseries and bistros serve food outside standard meal times — handy if you arrive late',
    'Outer districts (beyond the Peripherique) have limited metro access — plan journeys carefully'
  ]
);

-- ── Londra ────────────────────────────────────────────────────────────────────
INSERT INTO city_info (
  city, currency, currency_en, language, language_en,
  english_level, english_note, english_note_en,
  timezone, emergency_numbers, voltage, water, water_en,
  tipping, tipping_en, transport_apps, useful_apps,
  quick_tips, quick_tips_en
) VALUES (
  'londra',
  'Sterlina britannica (£)', 'British Pound (£)',
  'Inglese', 'English',
  'alto',
  'E la lingua ufficiale. Molti quartieri sono pero molto multiculturali.',
  'English is the official language. Many neighbourhoods are however highly multicultural.',
  'GMT (UTC+0) — ora legale BST (UTC+1)',
  '[
    {"label": "Emergenze generali", "label_en": "General emergency", "number": "999"},
    {"label": "Emergenze (alternativo)", "label_en": "Emergency (alternative)", "number": "112"},
    {"label": "Polizia non urgente", "label_en": "Non-emergency police", "number": "101"}
  ]',
  $$230V — presa tipo G (UK, 3 pin rettangolari). Serve adattatore dall'Europa!$$,
  $$Potabile e di ottima qualita. L'acqua londinese e una delle migliori d'Europa.$$,
  'Safe to drink and excellent quality. London tap water is among the best in Europe.',
  'Al ristorante il 10-15% e prassi consolidata, spesso gia incluso come "service charge". Controlla prima di aggiungere la mancia.',
  $$In restaurants, 10-15% is standard practice, often already included as a "service charge". Check before adding extra.$$,
  $$[
    {"name": "TfL Go", "description": "App ufficiale Transport for London per tube, bus, Elizabeth line e Overground", "description_en": "Official Transport for London app for tube, buses, Elizabeth line and Overground", "ios_url": "https://apps.apple.com/app/tfl-go/id1489085913", "android_url": "https://play.google.com/store/apps/details?id=uk.gov.tfl.tflgo"},
    {"name": "Citymapper", "description": "Il migliore per Londra: pianifica percorsi combinando tube, bus, bici e monopattini", "description_en": "The best for London: plans routes combining tube, bus, bike and scooters", "ios_url": "https://apps.apple.com/app/citymapper/id469463298", "android_url": "https://play.google.com/store/apps/details?id=com.citymapper.app.release"}
  ]$$,
  $$[
    {"name": "Uber", "description": "Taxi e NCC ampiamente disponibili e affidabili a Londra", "description_en": "Widely available and reliable taxis and private hire in London", "ios_url": "https://apps.apple.com/app/uber/id368677368", "android_url": "https://play.google.com/store/apps/details?id=com.ubercab"},
    {"name": "Bolt", "description": "Alternativa economica a Uber per gli spostamenti in citta", "description_en": "Budget alternative to Uber for city journeys", "ios_url": "https://apps.apple.com/app/bolt-request-a-ride/id675033630", "android_url": "https://play.google.com/store/apps/details?id=ee.mtakso.client"}
  ]$$,
  ARRAY[
    'Usa una contactless card (carta di credito/debito) direttamente sui tornelli: e il modo piu conveniente per pagare i mezzi',
    $$La presa elettrica e diversa dall'Europa: porta sempre un adattatore tipo G$$,
    'La maggior parte dei grandi musei e gratuita: British Museum, National Gallery, V&A, Tate Modern',
    'Stai a sinistra sulle scale mobili della metro, passa a destra: e una regola sociale molto rispettata',
    'Le Oyster card e le contactless applicano automaticamente il price cap giornaliero: non pagherai mai piu del necessario'
  ],
  ARRAY[
    $$Use a contactless card directly on the barriers — it's the easiest and cheapest way to pay for transport$$,
    $$UK plug sockets are different from Europe — always bring a Type G adaptor$$,
    'Most major museums are free: British Museum, National Gallery, V&A, Tate Modern',
    'Stand on the right on escalators, walk on the left — this is a strongly observed social rule',
    $$Oyster cards and contactless payments automatically apply the daily price cap — you'll never overpay$$
  ]
);
