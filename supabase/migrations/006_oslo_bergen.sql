-- ============================================================
-- WAYRA — Migration 006: dati per Oslo e Bergen
-- Contiene: neighborhoods, food places, city_info
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- NEIGHBORHOODS
-- ════════════════════════════════════════════════════════════

INSERT INTO neighborhoods (city, name, name_en, description, description_en, vibe_tags, booking_url, sort_order) VALUES

-- ── Oslo ──────────────────────────────────────────────────────────────────────

('oslo', 'Grünerløkka', 'Grünerløkka',
 'Il quartiere più hipster e vitale di Oslo, pieno di locali indipendenti, caffè di qualità, vinili e street art. Molto frequentato dai locali, ottima vita notturna e mercato domenicale.',
 'Oslo''s most hipster and vibrant neighbourhood, full of independent venues, quality cafés, vinyl shops and street art. Very popular with locals, great nightlife and Sunday market.',
 ARRAY['vita notturna','locali','mercati','arte'],
 'https://www.booking.com/searchresults.html?ss=Grunerlosekka%2C+Oslo&lang=it', 1),

('oslo', 'Aker Brygge / Tjuvholmen', 'Aker Brygge / Tjuvholmen',
 'Il moderno waterfront di Oslo sul fiordo, con ristoranti di qualità, bar e il Museo Astrup Fearnley. Ideale per chi vuole stare vicino all''acqua con tutti i comfort.',
 'Oslo''s modern fjord waterfront, with quality restaurants, bars and the Astrup Fearnley Museum. Ideal for those wanting fjord proximity with all comforts.',
 ARRAY['lusso','gastronomia','vista panoramica','arte'],
 'https://www.booking.com/searchresults.html?ss=Aker+Brygge%2C+Oslo&lang=it', 2),

('oslo', 'Frogner', 'Frogner',
 'Elegante quartiere residenziale vicino al Vigeland Park. Atmosfera tranquilla, ottimi ristoranti e caffè, buona connessione con il centro. Ideale per famiglie e chi cerca quiete.',
 'Elegant residential neighbourhood near Vigeland Park. Quiet atmosphere, excellent restaurants and cafés, good connections to the centre. Ideal for families and those seeking calm.',
 ARRAY['tranquillo','famiglie','lusso','gastronomia'],
 'https://www.booking.com/searchresults.html?ss=Frogner%2C+Oslo&lang=it', 3),

('oslo', 'Sentrum (Centro)', 'Sentrum (Centre)',
 'Il centro di Oslo con Karl Johans gate, la stazione centrale e la Piazza del Palazzo Reale. Ottimi collegamenti con tram e metro, pratico per chi si muove molto.',
 'Oslo''s city centre with Karl Johans gate, the central station and the Royal Palace square. Excellent tram and metro connections, practical for those on the move.',
 ARRAY['metro','culturale','shopping','budget'],
 'https://www.booking.com/searchresults.html?ss=Sentrum%2C+Oslo&lang=it', 4),

-- ── Bergen ────────────────────────────────────────────────────────────────────

('bergen', 'Bryggen / Sentrum', 'Bryggen / Sentrum',
 'Il cuore storico di Bergen, patrimonio UNESCO. A pochi passi dalle case anseatiche di Bryggen, dal Mercato del Pesce e dal porto. Massima posizione turistica.',
 'Bergen''s historic heart, a UNESCO World Heritage site. Steps from the Bryggen Hanseatic wharf, the Fish Market and the harbour. Prime tourist location.',
 ARRAY['culturale','gastronomia','vista panoramica','lusso'],
 'https://www.booking.com/searchresults.html?ss=Bryggen%2C+Bergen&lang=it', 1),

('bergen', 'Nordnes', 'Nordnes',
 'Pittoresco quartiere sul promontorio che divide i due porti. Case in legno colorato, atmosfera autentica e tranquilla, vista meravigliosa sul porto. Molto apprezzato dai locali.',
 'A picturesque neighbourhood on the peninsula between the two harbours. Colourful wooden houses, authentic and quiet atmosphere, wonderful harbour views. Highly valued by locals.',
 ARRAY['tranquillo','vista panoramica','locali','culturale'],
 'https://www.booking.com/searchresults.html?ss=Nordnes%2C+Bergen&lang=it', 2),

('bergen', 'Møhlenpris', 'Møhlenpris',
 'Quartiere autentico e giovane al di là del porto, con caffè indipendenti, gallerie e atmosfera bohémien. Prezzi più accessibili e meno turismo rispetto al centro.',
 'An authentic and young neighbourhood beyond the harbour, with independent cafés, galleries and a bohemian atmosphere. More affordable prices and less tourism than the centre.',
 ARRAY['budget','locali','arte','università'],
 'https://www.booking.com/searchresults.html?ss=Mohlenpris%2C+Bergen&lang=it', 3),

('bergen', 'Fløen / Skansen', 'Fløen / Skansen',
 'Quartieri collinari sopra il centro, raggiungibili a piedi o con il funicolare Fløibanen. Case tradizionali in legno, viste spettacolari sulla città e sui fiordi. Molto tranquillo.',
 'Hillside neighbourhoods above the centre, reachable on foot or by the Fløibanen funicular. Traditional wooden houses, spectacular views over the city and fjords. Very peaceful.',
 ARRAY['tranquillo','vista panoramica','famiglie'],
 'https://www.booking.com/searchresults.html?ss=Floen%2C+Bergen&lang=it', 4);

-- ════════════════════════════════════════════════════════════
-- FOOD PLACES (ristoranti consigliati per piatto tipico)
-- ════════════════════════════════════════════════════════════

-- ── Oslo foods ────────────────────────────────────────────────────────────────

UPDATE public.foods SET places = '[
  {"name": "Engebret Cafe", "maps_link": "https://www.google.com/maps/search/Engebret+Cafe+Oslo"},
  {"name": "Dovrehallen", "maps_link": "https://www.google.com/maps/search/Dovrehallen+Oslo"}
]'::jsonb WHERE city = 'oslo' AND name = 'Farikal';

UPDATE public.foods SET places = '[
  {"name": "Kaffistova", "maps_link": "https://www.google.com/maps/search/Kaffistova+Oslo"},
  {"name": "Engebret Cafe", "maps_link": "https://www.google.com/maps/search/Engebret+Cafe+Oslo"}
]'::jsonb WHERE city = 'oslo' AND name = 'Kjottkaker';

UPDATE public.foods SET places = '[
  {"name": "Theatercafeen", "maps_link": "https://www.google.com/maps/search/Theatercafeen+Oslo"},
  {"name": "Fenaknoken", "maps_link": "https://www.google.com/maps/search/Fenaknoken+Oslo"}
]'::jsonb WHERE city = 'oslo' AND name = 'Rakfisk';

UPDATE public.foods SET places = '[
  {"name": "Fiskeriet Youngstorget", "maps_link": "https://www.google.com/maps/search/Fiskeriet+Youngstorget+Oslo"},
  {"name": "Engebret Cafe", "maps_link": "https://www.google.com/maps/search/Engebret+Cafe+Oslo"}
]'::jsonb WHERE city = 'oslo' AND name = 'Gravlaks';

UPDATE public.foods SET places = '[
  {"name": "Mathallen Oslo", "maps_link": "https://www.google.com/maps/search/Mathallen+Oslo"},
  {"name": "Engebret Cafe", "maps_link": "https://www.google.com/maps/search/Engebret+Cafe+Oslo"}
]'::jsonb WHERE city = 'oslo' AND name = 'Reinsdyrgryte';

UPDATE public.foods SET places = '[
  {"name": "Godt Brod Oslo", "maps_link": "https://www.google.com/maps/search/Godt+Brod+Oslo"},
  {"name": "Apent Bakeri", "maps_link": "https://www.google.com/maps/search/Apent+Bakeri+Oslo"}
]'::jsonb WHERE city = 'oslo' AND name = 'Skillingsbolle';

UPDATE public.foods SET places = '[
  {"name": "Kaffistova", "maps_link": "https://www.google.com/maps/search/Kaffistova+Oslo"},
  {"name": "Blom Konditori", "maps_link": "https://www.google.com/maps/search/Blom+Konditori+Oslo"}
]'::jsonb WHERE city = 'oslo' AND name = 'Waffle norvegese';

UPDATE public.foods SET places = '[
  {"name": "Mathallen Oslo", "maps_link": "https://www.google.com/maps/search/Mathallen+Oslo"},
  {"name": "Fenaknoken", "maps_link": "https://www.google.com/maps/search/Fenaknoken+Oslo"}
]'::jsonb WHERE city = 'oslo' AND name = 'Brunost';

-- ── Bergen foods ──────────────────────────────────────────────────────────────

UPDATE public.foods SET places = '[
  {"name": "Enhjorningen", "maps_link": "https://www.google.com/maps/search/Enhjorningen+Bergen"},
  {"name": "To Kokker", "maps_link": "https://www.google.com/maps/search/To+Kokker+Bergen"}
]'::jsonb WHERE city = 'bergen' AND name = 'Bergensk fiskesuppe';

UPDATE public.foods SET places = '[
  {"name": "Bryggen Tracteursted", "maps_link": "https://www.google.com/maps/search/Bryggen+Tracteursted+Bergen"},
  {"name": "Enhjorningen", "maps_link": "https://www.google.com/maps/search/Enhjorningen+Bergen"}
]'::jsonb WHERE city = 'bergen' AND name = 'Persetorsk';

UPDATE public.foods SET places = '[
  {"name": "Kafe Kippers", "maps_link": "https://www.google.com/maps/search/Kafe+Kippers+Bergen"},
  {"name": "Lysverket", "maps_link": "https://www.google.com/maps/search/Lysverket+Bergen"}
]'::jsonb WHERE city = 'bergen' AND name = 'Raspeballer';

UPDATE public.foods SET places = '[
  {"name": "Godt Brod Bergen", "maps_link": "https://www.google.com/maps/search/Godt+Brod+Bergen"},
  {"name": "Sostrene Hagelin", "maps_link": "https://www.google.com/maps/search/Sostrene+Hagelin+Bergen"}
]'::jsonb WHERE city = 'bergen' AND name = 'Skillingsboller';

UPDATE public.foods SET places = '[
  {"name": "Bryggeloftet og Stuene", "maps_link": "https://www.google.com/maps/search/Bryggeloftet+og+Stuene+Bergen"},
  {"name": "Enhjorningen", "maps_link": "https://www.google.com/maps/search/Enhjorningen+Bergen"}
]'::jsonb WHERE city = 'bergen' AND name = 'Pinnekjott';

UPDATE public.foods SET places = '[
  {"name": "Fisketorget Bergen", "maps_link": "https://www.google.com/maps/search/Fisketorget+Bergen"},
  {"name": "To Kokker", "maps_link": "https://www.google.com/maps/search/To+Kokker+Bergen"}
]'::jsonb WHERE city = 'bergen' AND name = 'Gravlaks';

UPDATE public.foods SET places = '[
  {"name": "Kafe Kippers", "maps_link": "https://www.google.com/maps/search/Kafe+Kippers+Bergen"},
  {"name": "Sostrene Hagelin", "maps_link": "https://www.google.com/maps/search/Sostrene+Hagelin+Bergen"}
]'::jsonb WHERE city = 'bergen' AND name = 'Svele';

UPDATE public.foods SET places = '[
  {"name": "Fisketorget Bergen", "maps_link": "https://www.google.com/maps/search/Fisketorget+Bergen"},
  {"name": "Det Lille Kaffekompaniet", "maps_link": "https://www.google.com/maps/search/Det+Lille+Kaffekompaniet+Bergen"}
]'::jsonb WHERE city = 'bergen' AND name = 'Brunost';

-- ════════════════════════════════════════════════════════════
-- CITY INFO (info pratiche viaggio)
-- ════════════════════════════════════════════════════════════

-- ── Oslo ──────────────────────────────────────────────────────────────────────
INSERT INTO city_info (
  city, currency, currency_en, language, language_en,
  english_level, english_note, english_note_en,
  timezone, emergency_numbers, voltage, water, water_en,
  tipping, tipping_en, transport_apps, useful_apps,
  quick_tips, quick_tips_en
) VALUES (
  'oslo',
  'Corona norvegese (kr / NOK)', 'Norwegian Krone (kr / NOK)',
  'Norvegese (Bokmal)', 'Norwegian (Bokmal)',
  'alto',
  'Praticamente tutti parlano inglese fluentemente, anche negli esercizi commerciali e sui mezzi pubblici.',
  'Virtually everyone speaks fluent English, including in shops and on public transport.',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[
    {"label": "Emergenze generali", "label_en": "General emergency", "number": "112"},
    {"label": "Polizia", "label_en": "Police", "number": "02800"},
    {"label": "Ambulanza", "label_en": "Ambulance", "number": "113"},
    {"label": "Vigili del fuoco", "label_en": "Fire brigade", "number": "110"}
  ]',
  '230V — presa tipo F (standard europeo)',
  'Potabile direttamente dal rubinetto, ottima qualita. Una delle migliori acque d''Europa.',
  'Safe and excellent quality from the tap. One of the best-tasting waters in Europe.',
  'Non obbligatoria, ma apprezzata. Nei ristoranti si arrotonda o si lascia il 10% per un servizio ottimo.',
  'Not mandatory but appreciated. At restaurants, rounding up or leaving 10% for great service is welcomed.',
  $$[
    {"name": "Ruter", "description": "App ufficiale per metro, tram, bus e traghetti di Oslo con biglietti integrati", "description_en": "Official app for Oslo metro, trams, buses and ferries with integrated tickets", "ios_url": "https://apps.apple.com/no/app/ruter/id694799270", "android_url": "https://play.google.com/store/apps/details?id=no.ruter.reise"},
    {"name": "Moovit", "description": "Pianificazione percorsi con orari in tempo reale", "description_en": "Route planning with real-time schedules", "ios_url": "https://apps.apple.com/app/moovit/id498477945", "android_url": "https://play.google.com/store/apps/details?id=com.tranzmate"},
    {"name": "Vy (NSB)", "description": "Treni regionali e intercity in tutta la Norvegia", "description_en": "Regional and intercity trains across Norway", "ios_url": "https://apps.apple.com/no/app/vy/id475845822", "android_url": "https://play.google.com/store/apps/details?id=no.vy.reise"}
  ]$$,
  $$[
    {"name": "Bolt", "description": "Taxi e scooter elettrici, molto usati a Oslo come alternativa ai mezzi", "description_en": "Taxis and electric scooters, widely used in Oslo as a transport alternative", "ios_url": "https://apps.apple.com/app/bolt-request-a-ride/id675033630", "android_url": "https://play.google.com/store/apps/details?id=ee.mtakso.client"},
    {"name": "Google Maps", "description": "Navigazione e ricerca luoghi con modalita offline", "description_en": "Navigation and offline place search", "ios_url": "https://apps.apple.com/app/google-maps/id585027354", "android_url": "https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}
  ]$$,
  ARRAY[
    'Oslo e una delle citta piu costose d''Europa: tieni un budget piu alto del solito, specialmente per cibo e alcol',
    'Compra i biglietti Ruter in anticipo sull''app: i controllori multano pesantemente chi non ha il titolo valido',
    'I traghetti del fiordo (Oslofjord) sono inclusi nei titoli di trasporto ordinari: usali per esplorare le isole',
    'Il Mercato di Mathallen e il posto migliore per assaggiare prodotti locali a prezzi ragionevoli',
    'In estate fa luce fino alle 23:00: porta una mascherina per dormire se sei sensibile alla luce'
  ],
  ARRAY[
    'Oslo is one of the most expensive cities in Europe — budget higher than usual, especially for food and alcohol',
    'Buy Ruter tickets in advance on the app: inspectors issue heavy fines for invalid tickets',
    'Oslofjord ferries are included in standard transport tickets — use them to explore the islands',
    'Mathallen Market is the best place to sample local products at reasonable prices',
    'In summer it stays light until 11 pm — bring a sleep mask if you are sensitive to light'
  ]
);

-- ── Bergen ────────────────────────────────────────────────────────────────────
INSERT INTO city_info (
  city, currency, currency_en, language, language_en,
  english_level, english_note, english_note_en,
  timezone, emergency_numbers, voltage, water, water_en,
  tipping, tipping_en, transport_apps, useful_apps,
  quick_tips, quick_tips_en
) VALUES (
  'bergen',
  'Corona norvegese (kr / NOK)', 'Norwegian Krone (kr / NOK)',
  'Norvegese (Bokmal)', 'Norwegian (Bokmal)',
  'alto',
  'Inglese parlato fluentemente da quasi tutti. Bergen e abituata ai turisti internazionali.',
  'English spoken fluently by almost everyone. Bergen is well accustomed to international visitors.',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[
    {"label": "Emergenze generali", "label_en": "General emergency", "number": "112"},
    {"label": "Polizia", "label_en": "Police", "number": "02800"},
    {"label": "Ambulanza", "label_en": "Ambulance", "number": "113"},
    {"label": "Vigili del fuoco", "label_en": "Fire brigade", "number": "110"}
  ]',
  '230V — presa tipo F (standard europeo)',
  'Potabile direttamente dal rubinetto, fresca e di ottima qualita.',
  'Safe and excellent quality directly from the tap, fresh and clean.',
  'Non obbligatoria. Nei ristoranti si arrotonda o si lascia il 10% per un servizio ottimo.',
  'Not mandatory. At restaurants, rounding up or leaving 10% for excellent service is appreciated.',
  $$[
    {"name": "Skyss", "description": "App ufficiale per bus e funicolare Flobanen di Bergen con biglietti digitali", "description_en": "Official app for Bergen buses and Flobanen funicular with digital tickets", "ios_url": "https://apps.apple.com/no/app/skyss/id897809311", "android_url": "https://play.google.com/store/apps/details?id=no.skyss.reise"},
    {"name": "Vy (NSB)", "description": "Treni per Oslo e altre citta norvegesi (la tratta Bergen-Oslo e spettacolare)", "description_en": "Trains to Oslo and other Norwegian cities (the Bergen-Oslo route is spectacular)", "ios_url": "https://apps.apple.com/no/app/vy/id475845822", "android_url": "https://play.google.com/store/apps/details?id=no.vy.reise"},
    {"name": "Moovit", "description": "Pianificazione percorsi multimodale", "description_en": "Multimodal route planning", "ios_url": "https://apps.apple.com/app/moovit/id498477945", "android_url": "https://play.google.com/store/apps/details?id=com.tranzmate"}
  ]$$,
  $$[
    {"name": "Bolt", "description": "Taxi e scooter elettrici disponibili anche a Bergen", "description_en": "Taxis and electric scooters available in Bergen too", "ios_url": "https://apps.apple.com/app/bolt-request-a-ride/id675033630", "android_url": "https://play.google.com/store/apps/details?id=ee.mtakso.client"},
    {"name": "Google Maps", "description": "Navigazione e ricerca luoghi", "description_en": "Navigation and place search", "ios_url": "https://apps.apple.com/app/google-maps/id585027354", "android_url": "https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}
  ]$$,
  ARRAY[
    'Bergen e la citta piu piovosa d''Europa: porta sempre un impermeabile anche d''estate, le previsioni cambiano in pochi minuti',
    'Il Flobanen (funicolare) vale assolutamente il biglietto: la vista dall''alto su fiordi e tetti e impagabile',
    'Il Fisketorget (Mercato del Pesce) e ottimo per assaggiare pesce fresco, ma e turistico: i prezzi sono alti',
    'La tratta ferroviaria Bergen-Oslo e una delle piu belle del mondo: se hai tempo, falla in treno',
    'Bergen e molto camminabile: il centro storico, Bryggen e Nordnes si esplorano benissimo a piedi'
  ],
  ARRAY[
    'Bergen is the rainiest city in Europe — always carry a waterproof jacket, even in summer, as weather changes in minutes',
    'The Flobanen funicular is absolutely worth the ticket — the view over the fjords and rooftops is priceless',
    'The Fisketorget Fish Market is great for fresh fish tastings but is touristy — prices are high',
    'The Bergen-Oslo railway is one of the most beautiful in the world — if you have time, take the train',
    'Bergen is very walkable: the historic centre, Bryggen and Nordnes are all excellent on foot'
  ]
);
