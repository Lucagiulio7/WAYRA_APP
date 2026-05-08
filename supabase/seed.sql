-- ============================================================
-- WAYRA — seed.sql
-- File unico con tutti i dati delle città.
-- IDEMPOTENTE: può essere rieseguito senza duplicati.
--
-- Come aggiungere una città:
--   1. Aggiungi il blocco neighborhoods nella sezione NEIGHBORHOODS
--   2. Aggiungi gli UPDATE food places nella sezione FOOD PLACES
--   3. Aggiungi il blocco city_info nella sezione CITY INFO
--   4. Riesegui questo file su Supabase → SQL Editor
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- NEIGHBORHOODS
-- Cancella e reinserisce per le città gestite.
-- Aggiungere la città anche nell'elenco DELETE quando si inserisce.
-- ════════════════════════════════════════════════════════════

DELETE FROM neighborhoods WHERE city IN (
  'roma', 'milano', 'barcellona', 'parigi', 'londra',
  'oslo', 'bergen',
  'vienna', 'bruges', 'copenaghen', 'marsiglia', 'berlino'
);

INSERT INTO neighborhoods (city, name, name_en, description, description_en, vibe_tags, booking_url, sort_order) VALUES

-- ── Roma ──────────────────────────────────────────────────────────────────────
('roma', 'Trastevere', 'Trastevere',
 'Il quartiere più autentico e bohémien di Roma. Vicoli acciottolati, osterie storiche e una vivace vita notturna. Ideale per chi vuole vivere la Roma "vera" lontano dalle folle turistiche del centro.',
 'Rome''s most authentic and bohemian neighborhood. Cobblestone alleys, historic trattorias and vibrant nightlife. Perfect for experiencing the "real" Rome away from tourist crowds.',
 ARRAY['vita notturna','locali','gastronomia','culturale'],
 'https://www.booking.com/searchresults.html?ss=Trastevere%2C+Roma&lang=it', 1),

('roma', 'Centro Storico', 'Historic Center',
 'Al cuore di Roma, a pochi passi da tutti i principali monumenti. Costoso ma imbattibile per posizione. Ideale per chi vuole svegliarsi con la Fontana di Trevi a 5 minuti a piedi.',
 'At the heart of Rome, steps away from all major landmarks. Pricey but unbeatable for location. Ideal for waking up with the Trevi Fountain a 5-minute walk away.',
 ARRAY['lusso','culturale','arte','shopping'],
 'https://www.booking.com/searchresults.html?ss=Centro+Storico%2C+Roma&lang=it', 2),

('roma', 'Prati', 'Prati',
 'Elegante quartiere residenziale sul lato opposto del Tevere. Ottima connessione metro (linea A), tranquillo di notte e ricco di ristoranti di qualità. A due passi da Castel Sant''Angelo.',
 'Elegant residential neighborhood across the Tiber. Excellent metro connections (line A), quiet at night, full of quality restaurants. Steps from Castel Sant''Angelo.',
 ARRAY['tranquillo','metro','famiglie','gastronomia'],
 'https://www.booking.com/searchresults.html?ss=Prati%2C+Roma&lang=it', 3),

('roma', 'Testaccio', 'Testaccio',
 'Quartiere autentico e popolare, cuore della gastronomia romana. Qui si mangia la migliore cucina tradizionale della città. Molto frequentato dai locali, meno dai turisti.',
 'Authentic working-class neighborhood and the heart of Roman gastronomy. The best traditional cuisine in the city. Popular with locals, less so with tourists.',
 ARRAY['gastronomia','locali','mercati','budget'],
 'https://www.booking.com/searchresults.html?ss=Testaccio%2C+Roma&lang=it', 4),

('roma', 'Monti', 'Monti',
 'Il quartiere più hipster di Roma, a due passi dal Colosseo. Botteghe artigiane, cocktail bar, gallerie d''arte e atmosfera rilassata. Ottimo equilibrio tra posizione e prezzi.',
 'Rome''s hippest neighborhood, steps from the Colosseum. Artisan shops, cocktail bars, art galleries and a relaxed vibe. Great balance between location and prices.',
 ARRAY['vita notturna','arte','locali','culturale'],
 'https://www.booking.com/searchresults.html?ss=Monti%2C+Roma&lang=it', 5),

('roma', 'Esquilino / Termini', 'Esquilino / Termini',
 'Zona pratica e ben collegata, intorno alla stazione Termini. Prezzi accessibili e trasporti eccellenti. Ideale per chi si muove molto o vuole risparmiare sull''alloggio.',
 'Practical and well-connected area around Termini station. Affordable prices and excellent transport. Ideal for frequent travelers or those looking to save on accommodation.',
 ARRAY['metro','budget','università'],
 'https://www.booking.com/searchresults.html?ss=Esquilino%2C+Roma&lang=it', 6),

-- ── Milano ────────────────────────────────────────────────────────────────────
('milano', 'Brera', 'Brera',
 'Il quartiere degli artisti e delle gallerie, con strade eleganti e locali alla moda. Ottima posizione centrale, vicino al Duomo. Prezzi elevati ma atmosfera unica.',
 'The artists'' and galleries'' neighborhood, with elegant streets and trendy bars. Great central location, close to the Duomo. High prices but unique atmosphere.',
 ARRAY['arte','vita notturna','lusso','culturale'],
 'https://www.booking.com/searchresults.html?ss=Brera%2C+Milano&lang=it', 1),

('milano', 'Navigli', 'Navigli',
 'I canali navigabili di Milano, cuore della movida. Aperitivo lungo i canali, locali di ogni tipo, arte di strada. Ideale per chi vuole vivere la notte milanese.',
 'Milan''s navigable canals, the heart of Milan''s nightlife. Aperitivo along the canals, all kinds of bars, street art. Perfect for experiencing Milan after dark.',
 ARRAY['vita notturna','locali','arte','gastronomia'],
 'https://www.booking.com/searchresults.html?ss=Navigli%2C+Milano&lang=it', 2),

('milano', 'Porta Venezia', 'Porta Venezia',
 'Quartiere multiculturale e vivace, con una delle vie dello shopping più lunghe d''Europa (Corso Buenos Aires). Metro diretta, prezzi ragionevoli, ottima varietà di ristoranti.',
 'Multicultural and vibrant neighborhood with one of Europe''s longest shopping streets. Direct metro, reasonable prices, great variety of international restaurants.',
 ARRAY['shopping','metro','budget','gastronomia'],
 'https://www.booking.com/searchresults.html?ss=Porta+Venezia%2C+Milano&lang=it', 3),

('milano', 'Centrale / Repubblica', 'Centrale / Repubblica',
 'Zona intorno alla Stazione Centrale, pratica per chi arriva in treno. Ben collegata con tutta la città via metro. Buon rapporto qualità-prezzo per l''alloggio.',
 'Area around the Central Station, practical for train arrivals. Well connected to the whole city by metro. Good value for accommodation.',
 ARRAY['metro','budget','famiglie'],
 'https://www.booking.com/searchresults.html?ss=Stazione+Centrale%2C+Milano&lang=it', 4),

-- ── Barcellona ────────────────────────────────────────────────────────────────
('barcellona', 'El Born', 'El Born',
 'Quartiere medievale trasformato in hub creativo. Boutique, cocktail bar, gallerie d''arte e il Mercato di Santa Caterina. A pochi passi dalla Barceloneta e dal Gotico.',
 'Medieval neighborhood transformed into a creative hub. Boutiques, cocktail bars, art galleries and the Santa Caterina Market. Steps from Barceloneta and the Gothic Quarter.',
 ARRAY['vita notturna','arte','locali','culturale'],
 'https://www.booking.com/searchresults.html?ss=El+Born%2C+Barcellona&lang=it', 1),

('barcellona', 'Eixample', 'Eixample',
 'Il quartiere borghese progettato da Cerdà, con la sua caratteristica griglia. Qui si trova la Sagrada Família. Ottima connessione metro, ristoranti di qualità, atmosfera moderna.',
 'The bourgeois neighborhood designed by Cerdà, with its characteristic grid. Home to the Sagrada Família. Excellent metro connections, quality restaurants, modern atmosphere.',
 ARRAY['metro','lusso','shopping','gastronomia'],
 'https://www.booking.com/searchresults.html?ss=Eixample%2C+Barcellona&lang=it', 2),

('barcellona', 'Barceloneta', 'Barceloneta',
 'Il quartiere della spiaggia, ideale per chi non vuole rinunciare al mare. Molti chiringuitos e ristoranti di pesce. Può essere rumoroso in estate, ma l''esperienza è impagabile.',
 'The beach neighborhood, perfect for those who want sea access. Many chiringuitos and seafood restaurants. Can be noisy in summer, but the experience is priceless.',
 ARRAY['spiaggia','vita notturna','gastronomia'],
 'https://www.booking.com/searchresults.html?ss=Barceloneta%2C+Barcellona&lang=it', 3),

('barcellona', 'Gràcia', 'Gràcia',
 'Villaggio autonomo inglobato nella città, con piazze vivaci, mercati locali e atmosfera bohémien molto diversa dal centro turistico. Prezzi abbordabili e molta autenticità.',
 'Once-autonomous village absorbed by the city, with lively squares, local markets and a bohemian atmosphere very different from the tourist center. Affordable and authentic.',
 ARRAY['tranquillo','locali','mercati','università'],
 'https://www.booking.com/searchresults.html?ss=Gracia%2C+Barcellona&lang=it', 4),

-- ── Parigi ────────────────────────────────────────────────────────────────────
('parigi', 'Le Marais', 'Le Marais',
 'Il cuore storico e culturale di Parigi, con splendidi palazzi, musei di arte moderna e ottima vita notturna. Vivace, colorato e sempre pieno di vita.',
 'The historic and cultural heart of Paris, with splendid mansions, modern art museums and great nightlife. Vibrant, colorful and always full of life.',
 ARRAY['culturale','arte','vita notturna','locali'],
 'https://www.booking.com/searchresults.html?ss=Le+Marais%2C+Parigi&lang=it', 1),

('parigi', 'Saint-Germain-des-Prés', 'Saint-Germain-des-Prés',
 'Il quartiere letterario e intellettuale di Parigi, con caffè storici, boutique di lusso e atmosfera elegante. Vicino al Museo d''Orsay e al Jardin du Luxembourg.',
 'Paris''s literary and intellectual neighborhood, with historic cafés, luxury boutiques and an elegant atmosphere. Close to the Musée d''Orsay and Jardin du Luxembourg.',
 ARRAY['lusso','culturale','arte','gastronomia'],
 'https://www.booking.com/searchresults.html?ss=Saint-Germain-des-Pres%2C+Parigi&lang=it', 2),

('parigi', 'Montmartre', 'Montmartre',
 'Il leggendario quartiere degli artisti, con la Basilica del Sacré-Cœur e viste mozzafiato sulla città. Romantico e pittoresco di giorno, vivace la sera.',
 'The legendary artists'' neighborhood, with Sacré-Cœur Basilica and breathtaking city views. Romantic and picturesque by day, lively in the evening.',
 ARRAY['vista panoramica','arte','locali','culturale'],
 'https://www.booking.com/searchresults.html?ss=Montmartre%2C+Parigi&lang=it', 3),

('parigi', 'Bastille / Oberkampf', 'Bastille / Oberkampf',
 'Il quartiere più vivace di Parigi per la vita notturna. Bar, club, concerti e una gioventù locale che riempie le strade. Prezzi più accessibili rispetto al centro.',
 'Paris''s most vibrant neighborhood for nightlife. Bars, clubs, concerts and local youth filling the streets. More affordable prices than the center.',
 ARRAY['vita notturna','budget','locali','metro'],
 'https://www.booking.com/searchresults.html?ss=Bastille%2C+Parigi&lang=it', 4),

-- ── Londra ────────────────────────────────────────────────────────────────────
('londra', 'Shoreditch', 'Shoreditch',
 'La capitale creativa di Londra, con street art, mercati vintage e i migliori bar della città. L''area più trendy del momento, frequentata da artisti e giovani professionisti.',
 'London''s creative capital, with street art, vintage markets and the city''s best bars. The trendiest area right now, frequented by artists and young professionals.',
 ARRAY['arte','vita notturna','mercati','università'],
 'https://www.booking.com/searchresults.html?ss=Shoreditch%2C+Londra&lang=it', 1),

('londra', 'South Bank', 'South Bank',
 'Sulla riva sud del Tamigi, con la Tate Modern, Shakespeare''s Globe e Borough Market. Ottima posizione per i principali musei senza dover prendere la metro.',
 'On the south bank of the Thames, with Tate Modern, Shakespeare''s Globe and Borough Market. Great position to visit major museums without the tube.',
 ARRAY['culturale','arte','mercati','gastronomia'],
 'https://www.booking.com/searchresults.html?ss=South+Bank%2C+Londra&lang=it', 2),

('londra', 'Notting Hill', 'Notting Hill',
 'Elegante e pittoresco, con le celebri case colorate di Portobello Road e il suo mercato. Vicino ai musei di South Kensington. Ideale per famiglie e chi ama lo stile britannico.',
 'Elegant and picturesque, with the famous colorful houses of Portobello Road. Close to South Kensington museums. Ideal for families and those who love British style.',
 ARRAY['lusso','mercati','famiglie','culturale'],
 'https://www.booking.com/searchresults.html?ss=Notting+Hill%2C+Londra&lang=it', 3),

('londra', 'Covent Garden', 'Covent Garden',
 'Posizione centralissima, a pochi passi dal West End e dalla National Gallery. Molto turistico ma comodo per chi vuole essere vicino a tutto. Prezzi elevati.',
 'Very central location, steps from the West End and the National Gallery. Very touristy but convenient for those wanting to be close to everything. High prices.',
 ARRAY['shopping','culturale','metro','lusso'],
 'https://www.booking.com/searchresults.html?ss=Covent+Garden%2C+Londra&lang=it', 4),

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
 'https://www.booking.com/searchresults.html?ss=Floen%2C+Bergen&lang=it', 4),

-- ── Vienna ────────────────────────────────────────────────────────────────────
('vienna', 'Innere Stadt (1° distretto)', 'Innere Stadt (1st District)',
 'Il cuore storico di Vienna, patrimonio UNESCO. Stephansdom, Hofburg, Opera di Stato e Burgtheater raggiungibili a piedi. Prezzi elevati ma posizione imbattibile per chi vuole vivere la Vienna imperiale.',
 'Vienna''s historic heart, a UNESCO World Heritage site. Stephansdom, Hofburg, State Opera and Burgtheater all within walking distance. Expensive but unbeatable for experiencing imperial Vienna.',
 ARRAY['lusso','culturale','arte','shopping'],
 'https://www.booking.com/searchresults.html?ss=Innere+Stadt%2C+Wien&lang=it', 1),

('vienna', 'Naschmarkt / Mariahilf', 'Naschmarkt / Mariahilf',
 'Quartiere vivace intorno al famoso mercato Naschmarkt, pieno di ristoranti internazionali, bar e negozi di design. Ottima connessione metro U4. Prezzi piu accessibili rispetto al centro storico.',
 'Vibrant neighbourhood around the famous Naschmarkt, packed with international restaurants, bars and design shops. Excellent U4 metro connection. More affordable than the historic centre.',
 ARRAY['gastronomia','mercati','vita notturna','metro'],
 'https://www.booking.com/searchresults.html?ss=Mariahilf%2C+Wien&lang=it', 2),

('vienna', 'Leopoldstadt (2° distretto)', 'Leopoldstadt (2nd District)',
 'Quartiere in rapida evoluzione con il grande parco del Prater e la celebre Ruota Panoramica (Riesenrad). Molti nuovi locali e prezzi piu accessibili. Ideale per famiglie e chi cerca un''atmosfera autentica.',
 'Rapidly evolving neighbourhood with the vast Prater park and the iconic Giant Ferris Wheel. Many new venues and lower prices. Ideal for families and those seeking an authentic atmosphere.',
 ARRAY['famiglie','locali','budget','tranquillo'],
 'https://www.booking.com/searchresults.html?ss=Leopoldstadt%2C+Wien&lang=it', 3),

('vienna', 'Neubau (7° distretto)', 'Neubau (7th District)',
 'Il quartiere piu trendy di Vienna con gallerie d''arte, negozi vintage, librerie indipendenti e caffe di qualita. Meta dei creativi e dei giovani viennesi. Ottimo rapporto posizione-prezzo.',
 'Vienna''s trendiest district, with art galleries, vintage shops, independent bookshops and quality cafés. A hub for creatives and young Viennese. Great position-to-price ratio.',
 ARRAY['arte','vita notturna','locali','shopping'],
 'https://www.booking.com/searchresults.html?ss=Neubau%2C+Wien&lang=it', 4),

-- ── Bruges ────────────────────────────────────────────────────────────────────
('bruges', 'Historium / Markt', 'Historium / Markt',
 'Cuore medievale di Bruges, patrimonio UNESCO. La piazza principale con il campanile (Belfort), il Basilica del Sangue Sacro e i canali iconici sono tutti a pochi passi. Massima posizione turistica.',
 'Medieval heart of Bruges, a UNESCO World Heritage site. The main square with the Belfry, Basilica of the Holy Blood and iconic canals all within steps. Prime tourist location.',
 ARRAY['culturale','arte','lusso','shopping'],
 'https://www.booking.com/searchresults.html?ss=Markt%2C+Brugge&lang=it', 1),

('bruges', 'Begijnhof / Minnewater', 'Begijnhof / Minnewater',
 'Quartiere tranquillo e pittoresco attorno al Begijnhof (patrimonio UNESCO) e al Lago d''Amore. Case medievali, giardini curati e atmosfera quasi rurale. Ideale per chi cerca pace nel centro storico.',
 'Quiet and picturesque neighbourhood around the Begijnhof (UNESCO) and the Lake of Love. Medieval houses, manicured gardens and an almost rural atmosphere. Ideal for those seeking calm in the historic centre.',
 ARRAY['tranquillo','culturale','famiglie'],
 'https://www.booking.com/searchresults.html?ss=Begijnhof%2C+Brugge&lang=it', 2),

('bruges', 'Sint-Annakwartier', 'Sint-Annakwartier',
 'Quartiere autentico e meno turistico sul lato orientale del centro, con i celebri mulini a vento medievali e un''atmosfera piu locale. Passeggiate lungo i canali lontano dalla folla.',
 'Authentic and less touristy neighbourhood on the eastern side of the centre, with the famous medieval windmills and a more local feel. Canal walks away from the crowds.',
 ARRAY['tranquillo','locali','culturale'],
 'https://www.booking.com/searchresults.html?ss=Sint-Anna%2C+Brugge&lang=it', 3),

('bruges', 'Sint-Jakobsstraat / Zuid', 'Sint-Jakobsstraat / South',
 'La zona piu vivace di Bruges per ristoranti, bar e vita serale. Meno turistica del centro, frequentata soprattutto dai locali. Buona scelta di alloggi a prezzi ragionevoli rispetto al cuore medievale.',
 'The liveliest area of Bruges for restaurants, bars and evening life. Less touristy than the centre, mostly frequented by locals. Good choice of accommodation at reasonable prices.',
 ARRAY['vita notturna','gastronomia','locali'],
 'https://www.booking.com/searchresults.html?ss=Brugge+Zuid&lang=it', 4),

-- ── Copenaghen ────────────────────────────────────────────────────────────────
('copenaghen', 'Indre By (Centro storico)', 'Indre By (Historic Centre)',
 'Il cuore di Copenaghen con Stroget (la via pedonale piu lunga d''Europa), Nyhavn, il Palazzo di Amalienborg e i principali musei. Ottimi collegamenti metro. Prezzi elevati ma posizione ideale.',
 'The heart of Copenhagen with Stroget (Europe''s longest pedestrian street), Nyhavn, Amalienborg Palace and the main museums. Excellent metro connections. High prices but ideal location.',
 ARRAY['culturale','lusso','shopping','metro'],
 'https://www.booking.com/searchresults.html?ss=Indre+By%2C+Copenhagen&lang=it', 1),

('copenaghen', 'Nørrebro', 'Nørrebro',
 'Il quartiere multiculturale e hipster di Copenaghen, pieno di caffe indipendenti, negozi vintage e locali alla moda. Molto frequentato dagli studenti e dai giovani. Prezzi piu accessibili del centro.',
 'Copenhagen''s multicultural and hipster neighbourhood, packed with independent cafés, vintage shops and trendy bars. Very popular with students and young people. More affordable than the centre.',
 ARRAY['vita notturna','locali','mercati','università'],
 'https://www.booking.com/searchresults.html?ss=Norrebro%2C+Copenhagen&lang=it', 2),

('copenaghen', 'Vesterbro', 'Vesterbro',
 'Ex quartiere operaio trasformato nel centro della movida copenaghenese. Ottimi ristoranti, bar alla moda e il celebre Kodbyen (il distretto dei macellai) ora pieno di gallerie e cocktail bar.',
 'Former working-class neighbourhood transformed into Copenhagen''s nightlife centre. Excellent restaurants, trendy bars and the famous Kodbyen (meatpacking district) now full of galleries and cocktail bars.',
 ARRAY['vita notturna','locali','arte','gastronomia'],
 'https://www.booking.com/searchresults.html?ss=Vesterbro%2C+Copenhagen&lang=it', 3),

('copenaghen', 'Frederiksberg', 'Frederiksberg',
 'Elegante quartiere residenziale con il grande parco Frederiksberg Have e il Giardino Zoologico. Atmosfera tranquilla e borghese, ottimi ristoranti e caffe. Ideale per famiglie e chi cerca quiete.',
 'Elegant residential neighbourhood with the large Frederiksberg Have park and the Zoological Garden. Quiet and genteel atmosphere, excellent restaurants and cafés. Ideal for families seeking calm.',
 ARRAY['tranquillo','famiglie','lusso','gastronomia'],
 'https://www.booking.com/searchresults.html?ss=Frederiksberg%2C+Copenhagen&lang=it', 4),

-- ── Marsiglia ────────────────────────────────────────────────────────────────
('marsiglia', 'Le Panier', 'Le Panier',
 'Il quartiere piu antico di Marsiglia, su una collina sopra il Vieux-Port. Vicoli colorati, street art, botteghe artigiane e una comunita artistica vivace. Il lato autentico e bohemien della citta.',
 'The oldest neighbourhood in Marseille, on a hill above the Vieux-Port. Colourful alleys, street art, craft shops and a vibrant artistic community. The authentic, bohemian side of the city.',
 ARRAY['culturale','arte','locali','gastronomia'],
 'https://www.booking.com/searchresults.html?ss=Le+Panier%2C+Marseille&lang=it', 1),

('marsiglia', 'Vieux-Port (1° arr.)', 'Vieux-Port (1st District)',
 'Il porto vecchio di Marsiglia, cuore pulsante della citta. Ristoranti di pesce, mercato del mattino, MuCEM e accesso ai traghetti per le isole. Vivace di giorno e di sera, con ottimi collegamenti metro.',
 'Marseille''s old port, the beating heart of the city. Seafood restaurants, morning market, MuCEM and ferry access to the islands. Lively day and night, with excellent metro connections.',
 ARRAY['vita notturna','gastronomia','culturale','metro'],
 'https://www.booking.com/searchresults.html?ss=Vieux-Port%2C+Marseille&lang=it', 2),

('marsiglia', 'Endoume / Vallon des Auffes', 'Endoume / Vallon des Auffes',
 'Quartiere residenziale elegante e tranquillo vicino alla costa. Il Vallon des Auffes e un piccolo porto di pescatori incredibilmente pittoresco. Ottimi ristoranti di pesce con vista sul Mediterraneo.',
 'Quiet and elegant residential neighbourhood near the coast. The Vallon des Auffes is an incredibly picturesque small fishing harbour. Excellent seafood restaurants overlooking the Mediterranean.',
 ARRAY['tranquillo','gastronomia','vista panoramica'],
 'https://www.booking.com/searchresults.html?ss=Endoume%2C+Marseille&lang=it', 3),

('marsiglia', 'Cours Julien (6° arr.)', 'Cours Julien (6th District)',
 'Il quartiere alternativo di Marsiglia, pieno di street art, caffe, librerie e locali indipendenti. Atmosfera bohemien e giovanile, mercati delle pulci il fine settimana. Prezzi molto accessibili.',
 'Marseille''s alternative neighbourhood, full of street art, cafés, bookshops and independent venues. Bohemian and youthful atmosphere, flea markets at weekends. Very affordable prices.',
 ARRAY['vita notturna','arte','locali','università'],
 'https://www.booking.com/searchresults.html?ss=Cours+Julien%2C+Marseille&lang=it', 4),

-- ── Berlino ────────────────────────────────────────────────────────────────────
('berlino', 'Mitte', 'Mitte',
 'Il centro geografico e storico di Berlino, con Unter den Linden, Museumsinsel (UNESCO), Checkpoint Charlie e la Porta di Brandeburgo. Ottimi collegamenti metro e S-Bahn. Il quartiere piu iconico.',
 'The geographical and historic centre of Berlin, with Unter den Linden, Museumsinsel (UNESCO), Checkpoint Charlie and the Brandenburg Gate. Excellent metro and S-Bahn links. The most iconic neighbourhood.',
 ARRAY['culturale','lusso','shopping','metro'],
 'https://www.booking.com/searchresults.html?ss=Mitte%2C+Berlin&lang=it', 1),

('berlino', 'Prenzlauer Berg', 'Prenzlauer Berg',
 'Ex quartiere operaio dell''Est oggi tra i piu eleganti di Berlino. Famiglie giovani, caffe alla moda, mercati domenicali e parchi verdi. Atmosfera tranquilla di giorno, vivace la sera. Molto apprezzato dai locali.',
 'Former East Berlin working-class neighbourhood now one of the city''s most elegant. Young families, trendy cafés, Sunday markets and green parks. Calm by day, lively in the evening. Highly valued by locals.',
 ARRAY['locali','famiglie','vita notturna','mercati'],
 'https://www.booking.com/searchresults.html?ss=Prenzlauer+Berg%2C+Berlin&lang=it', 2),

('berlino', 'Kreuzberg', 'Kreuzberg',
 'Il quartiere piu multiculturale e alternativo di Berlino, con la piu grande comunita turca d''Europa. Street art, mercati etnici, club leggendari e una vita notturna che non finisce mai. Vibrante e autentico.',
 'Berlin''s most multicultural and alternative neighbourhood, home to Europe''s largest Turkish community. Street art, ethnic markets, legendary clubs and nightlife that never ends. Vibrant and authentic.',
 ARRAY['vita notturna','arte','locali','gastronomia'],
 'https://www.booking.com/searchresults.html?ss=Kreuzberg%2C+Berlin&lang=it', 3),

('berlino', 'Friedrichshain', 'Friedrichshain',
 'Quartiere dell''ex Berlino Est, oggi cuore della scena giovanile e clubbing berlinese. Prezzi piu bassi, atmosfera alternativa e il celebre East Side Gallery (il piu lungo tratto del Muro rimasto).',
 'Neighbourhood of former East Berlin, today the heart of Berlin''s youth and clubbing scene. Lower prices, alternative atmosphere and the famous East Side Gallery (the longest remaining stretch of the Wall).',
 ARRAY['vita notturna','budget','locali','arte'],
 'https://www.booking.com/searchresults.html?ss=Friedrichshain%2C+Berlin&lang=it', 4),

-- ── Monaco di Baviera ────────────────────────────────────────────────────────
('monaco_di_baviera', 'Altstadt / Maxvorstadt', 'Altstadt / Maxvorstadt',
 'Il centro storico di Monaco, con la Marienplatz, il Municipio Neogotico e il Frauendom. Maxvorstadt ospita il Museumsviertel con tre Pinakothek. Prezzi elevati ma posizione centrale imbattibile.',
 'Munich''s historic heart, with Marienplatz, the Neo-Gothic Town Hall and Frauendom. Maxvorstadt hosts the Museumsviertel with three Pinakothek galleries. High prices but an unbeatable central position.',
 ARRAY['culturale','lusso','arte','shopping'],
 'https://www.booking.com/searchresults.html?ss=Altstadt%2C+Munchen&lang=it', 1),

('monaco_di_baviera', 'Schwabing', 'Schwabing',
 'Il quartiere universitario e bohemien di Monaco, un tempo residenza di Kandinsky, Paul Klee e Thomas Mann. Caffe letterari, gallerie d''arte, negozi vintage e una vivace vita studentesca. Vicino all''Englischer Garten.',
 'Munich''s university and bohemian neighbourhood, once home to Kandinsky, Paul Klee and Thomas Mann. Literary cafés, art galleries, vintage shops and a vibrant student life. Close to the Englischer Garten.',
 ARRAY['vita notturna','arte','locali','università'],
 'https://www.booking.com/searchresults.html?ss=Schwabing%2C+Munchen&lang=it', 2),

('monaco_di_baviera', 'Glockenbachviertel', 'Glockenbachviertel',
 'Il quartiere piu trendy e cosmopolita di Monaco, pieno di ristoranti etnici, cocktail bar, design shop e una vivace scena culturale. Meno turistico di Altstadt, molto apprezzato dai locali under 35.',
 'Munich''s trendiest and most cosmopolitan neighbourhood, full of ethnic restaurants, cocktail bars, design shops and a vibrant cultural scene. Less touristy than Altstadt, very popular with locals under 35.',
 ARRAY['vita notturna','gastronomia','locali','arte'],
 'https://www.booking.com/searchresults.html?ss=Glockenbachviertel%2C+Munchen&lang=it', 3),

('monaco_di_baviera', 'Haidhausen / Au', 'Haidhausen / Au',
 'Quartiere autentico a est del centro, un tempo popolare oggi elegante con bei palazzi liberty. Ottimi ristoranti, mercati locali e birrerie tradizionali. Ottima connessione metro, prezzi piu ragionevoli del centro.',
 'Authentic neighbourhood east of the centre, once working class and today elegant with fine Art Nouveau buildings. Excellent restaurants, local markets and traditional beer halls. Good metro links, more reasonable prices.',
 ARRAY['gastronomia','locali','tranquillo','metro'],
 'https://www.booking.com/searchresults.html?ss=Haidhausen%2C+Munchen&lang=it', 4),

-- ── Francoforte ────────────────────────────────────────────────────────────────
('francoforte', 'Altstadt / Römerberg', 'Altstadt / Römerberg',
 'Il centro storico di Francoforte, con la celebre piazza del Römerberg e le case a graticcio ricostruite. A pochi passi dal Meno, dai musei e dalla Kaiserdom. Zona molto turistica ma di grande fascino.',
 'Frankfurt''s historic centre, with the famous Römerberg square and reconstructed half-timbered houses. Steps from the Main river, museums and the Kaiserdom. Very touristy but full of charm.',
 ARRAY['culturale','lusso','shopping','arte'],
 'https://www.booking.com/searchresults.html?ss=Altstadt%2C+Frankfurt&lang=it', 1),

('francoforte', 'Sachsenhausen', 'Sachsenhausen',
 'Il quartiere piu amato dai locali, sulla riva sud del Meno. Le storiche taverne di Apfelwein (sidro di mele), il Museumsufer con 15 musei affacciati sul fiume e i ristoranti tradizionali lo rendono imperdibile.',
 'The neighbourhood most loved by locals, on the south bank of the Main. Historic Apfelwein taverns, the Museumsufer with 15 riverside museums and traditional restaurants make it unmissable.',
 ARRAY['gastronomia','culturale','locali','vita notturna'],
 'https://www.booking.com/searchresults.html?ss=Sachsenhausen%2C+Frankfurt&lang=it', 2),

('francoforte', 'Bornheim', 'Bornheim',
 'Quartiere autentico e vivace con la sua piazza centrale (Bornheimer Mitte), mercato settimanale, ottimi caffe e ristoranti. Molto frequentato dai francofortesi, poco dai turisti. Prezzi accessibili.',
 'Authentic and lively neighbourhood with its central square, weekly market, excellent cafés and restaurants. Very popular with Frankfurt locals, less so with tourists. Affordable prices.',
 ARRAY['locali','mercati','gastronomia','tranquillo'],
 'https://www.booking.com/searchresults.html?ss=Bornheim%2C+Frankfurt&lang=it', 3),

('francoforte', 'Nordend', 'Nordend',
 'Trendy e cosmopolita, il Nordend e il quartiere piu giovane di Francoforte. Negozi indipendenti, caffe di qualita, bar e una scena gastronomica internazionale in rapida crescita. Ottima connessione U-Bahn.',
 'Trendy and cosmopolitan, Nordend is Frankfurt''s youngest neighbourhood. Independent shops, quality cafés, bars and a fast-growing international food scene. Excellent U-Bahn connections.',
 ARRAY['vita notturna','locali','gastronomia','università'],
 'https://www.booking.com/searchresults.html?ss=Nordend%2C+Frankfurt&lang=it', 4),

-- ── Atene ─────────────────────────────────────────────────────────────────────
('atene', 'Monastiraki / Plaka', 'Monastiraki / Plaka',
 'Il cuore turistico di Atene, ai piedi dell''Acropoli. Plaka e il quartiere neoclassico piu affascinante, con vicoli fioriti e taverne tradizionali. Monastiraki ospita il famoso mercato delle pulci domenicale.',
 'The tourist heart of Athens, at the foot of the Acropolis. Plaka is the most charming neoclassical neighbourhood, with flowered alleys and traditional tavernas. Monastiraki hosts the famous Sunday flea market.',
 ARRAY['culturale','gastronomia','shopping','arte'],
 'https://www.booking.com/searchresults.html?ss=Monastiraki%2C+Athens&lang=it', 1),

('atene', 'Kolonaki', 'Kolonaki',
 'Il quartiere elegante e borghese di Atene, sul versante del Licabetto. Boutique di lusso, ristoranti raffinati, gallerie d''arte e la migliore selezione di caffe della citta. Ideale per chi cerca comfort e stile.',
 'Athens'' elegant and upmarket neighbourhood, on the slopes of Lycabettus. Luxury boutiques, refined restaurants, art galleries and the city''s best café selection. Ideal for those seeking comfort and style.',
 ARRAY['lusso','arte','gastronomia','shopping'],
 'https://www.booking.com/searchresults.html?ss=Kolonaki%2C+Athens&lang=it', 2),

('atene', 'Psiri / Thissio', 'Psiri / Thissio',
 'Quartieri alternativi trasformati nel cuore della vita notturna ateniese. Street art, bar alla moda, ristoranti creativi e una gioventu locale vivace. Psiri e piu rumoroso, Thissio piu romantico con vista Acropoli.',
 'Alternative neighbourhoods transformed into the heart of Athenian nightlife. Street art, trendy bars, creative restaurants and a vibrant local youth scene. Psiri is livelier, Thissio more romantic with Acropolis views.',
 ARRAY['vita notturna','arte','locali','gastronomia'],
 'https://www.booking.com/searchresults.html?ss=Psiri%2C+Athens&lang=it', 3),

('atene', 'Koukaki / Makrygianni', 'Koukaki / Makrygianni',
 'Quartieri residenziali autentici e tranquilli a sud dell''Acropoli. In rapida trasformazione, con nuovi caffe hipster, hotel boutique e una scena gastronomica in crescita. Molto apprezzati dai viaggiatori lenti.',
 'Authentic and quiet residential neighbourhoods south of the Acropolis. Rapidly evolving, with new hipster cafés, boutique hotels and a growing food scene. Highly appreciated by slow travellers.',
 ARRAY['tranquillo','locali','gastronomia','culturale'],
 'https://www.booking.com/searchresults.html?ss=Koukaki%2C+Athens&lang=it', 4),

-- ── Dublino ────────────────────────────────────────────────────────────────────
('dublino', 'Temple Bar / City Centre', 'Temple Bar / City Centre',
 'Il cuore culturale e notturno di Dublino, con pub storici, gallerie d''arte, mercati e il celebre Grafton Street. Molto turistico ma immancabile per l''atmosfera. Prezzi elevati ma posizione centralissima.',
 'The cultural and nightlife heart of Dublin, with historic pubs, art galleries, markets and the famous Grafton Street. Very touristy but unmissable for the atmosphere. High prices but very central location.',
 ARRAY['vita notturna','culturale','mercati','shopping'],
 'https://www.booking.com/searchresults.html?ss=Temple+Bar%2C+Dublin&lang=it', 1),

('dublino', 'Portobello / Dublin 8', 'Portobello / Dublin 8',
 'Il quartiere piu trendy di Dublino, lungo il canale Grand Canal. Ottimi caffe speciality, ristoranti indipendenti, negozi vintage e una comunita artistica vivace. Molto frequentato dai locali, poco dai turisti.',
 'Dublin''s trendiest neighbourhood, along the Grand Canal. Excellent speciality cafés, independent restaurants, vintage shops and a vibrant artistic community. Very popular with locals, rarely touristy.',
 ARRAY['vita notturna','locali','arte','gastronomia'],
 'https://www.booking.com/searchresults.html?ss=Portobello%2C+Dublin&lang=it', 2),

('dublino', 'Ranelagh', 'Ranelagh',
 'Elegante villaggio urbano a sud del centro, con una delle migliori selezioni di ristoranti di Dublino. Atmosfera tranquilla e borghese, ottima connessione con il tram LUAS. Ideale per famiglie e soggiorni piu lunghi.',
 'Elegant urban village south of the centre, with one of Dublin''s best restaurant selections. Quiet and genteel atmosphere, excellent LUAS tram connections. Ideal for families and longer stays.',
 ARRAY['gastronomia','tranquillo','famiglie','lusso'],
 'https://www.booking.com/searchresults.html?ss=Ranelagh%2C+Dublin&lang=it', 3),

('dublino', 'Stoneybatter / Smithfield', 'Stoneybatter / Smithfield',
 'Quartiere emergente a nord del Liffey, con pub tradizionali, birrifici artigianali e una scena gastronomica in rapida crescita. Molto autentico, frequentato dai dublinesi. Prezzi piu accessibili del centro.',
 'Up-and-coming neighbourhood north of the Liffey, with traditional pubs, craft breweries and a fast-growing food scene. Highly authentic, popular with Dubliners. More affordable prices than the centre.',
 ARRAY['vita notturna','locali','budget','gastronomia'],
 'https://www.booking.com/searchresults.html?ss=Smithfield%2C+Dublin&lang=it', 4),

-- ── Venezia ────────────────────────────────────────────────────────────────────
('venezia', 'Dorsoduro', 'Dorsoduro',
 'Il sestiere piu autentico e artistico di Venezia, con l''Accademia, la Peggy Guggenheim Collection e le migliori ombre della citta. Meno affollato di San Marco, ideale per chi vuole vivere Venezia come un locale.',
 'Venice''s most authentic and artistic sestiere, home to the Accademia, Peggy Guggenheim Collection and the city''s best bacaro scene. Less crowded than San Marco, ideal for those wanting to experience Venice like a local.',
 ARRAY['arte','gastronomia','culturale','locali'],
 'https://www.booking.com/searchresults.html?ss=Dorsoduro%2C+Venice&lang=it', 1),

('venezia', 'Cannaregio', 'Cannaregio',
 'Il sestiere piu autentico e meno turistico di Venezia, con il Ghetto Ebraico (il piu antico d''Europa), mercati locali e campi dove i veneziani fanno ancora la vita quotidiana. Prezzi piu accessibili.',
 'Venice''s most authentic and least touristy sestiere, with the Jewish Ghetto (the oldest in Europe), local markets and campos where Venetians still go about their daily life. More affordable prices.',
 ARRAY['culturale','locali','tranquillo','budget'],
 'https://www.booking.com/searchresults.html?ss=Cannaregio%2C+Venice&lang=it', 2),

('venezia', 'Castello', 'Castello',
 'Il sestiere piu grande di Venezia, meno visitato dai turisti. Nasconde gemme come la Scuola di San Giorgio degli Schiavoni e le Biennale Gardens. Atmosfera autentica, prezzi piu ragionevoli di San Marco.',
 'Venice''s largest sestiere, less visited by tourists. Hides gems like the Scuola di San Giorgio degli Schiavoni and the Biennale Gardens. Authentic atmosphere, more reasonable prices than San Marco.',
 ARRAY['tranquillo','locali','culturale','arte'],
 'https://www.booking.com/searchresults.html?ss=Castello%2C+Venice&lang=it', 3),

('venezia', 'Giudecca', 'Giudecca',
 'Isola separata dal Canal della Giudecca, tranquilla e quasi priva di turisti. Viste mozzafiato su Venezia, hotel di lusso storici (Cipriani) e atmosfera da borgo marinaro. Collegata con il vaporetto in 5 minuti.',
 'Island separated by the Giudecca Canal, peaceful and almost tourist-free. Breathtaking views of Venice, historic luxury hotels (Cipriani) and a fishing village atmosphere. Connected by vaporetto in 5 minutes.',
 ARRAY['tranquillo','vista panoramica','lusso','famiglie'],
 'https://www.booking.com/searchresults.html?ss=Giudecca%2C+Venice&lang=it', 4),

-- ── Amsterdam ─────────────────────────────────────────────────────────────────
('amsterdam', 'Jordaan', 'Jordaan',
 'Il quartiere piu amato di Amsterdam: canali pittoreschi, case dal fronte stretto inclinate, mercati del sabato (Noordermarkt) e gallerie d''arte. Atmosfera autentica, prezzi elevati ma posizione e qualita della vita imbattibili.',
 'Amsterdam''s most beloved neighbourhood: picturesque canals, narrow tilting houses, Saturday markets (Noordermarkt) and art galleries. Authentic atmosphere, high prices but unbeatable location and quality of life.',
 ARRAY['locali','mercati','arte','gastronomia'],
 'https://www.booking.com/searchresults.html?ss=Jordaan%2C+Amsterdam&lang=it', 1),

('amsterdam', 'De Pijp', 'De Pijp',
 'Il quartiere giovane e multiculturale di Amsterdam, con il celebre Mercato Albert Cuyp (il piu grande mercato all''aperto del Benelux), ottimi ristoranti etnici e caffè specialty. Atmosfera bohemien, prezzi accessibili.',
 'Amsterdam''s young and multicultural neighbourhood, home to the famous Albert Cuyp Market (the largest outdoor market in the Benelux), excellent ethnic restaurants and speciality cafés. Bohemian atmosphere, affordable prices.',
 ARRAY['mercati','gastronomia','vita notturna','università'],
 'https://www.booking.com/searchresults.html?ss=De+Pijp%2C+Amsterdam&lang=it', 2),

('amsterdam', 'Grachtengordel (Canali)', 'Grachtengordel (Canal Ring)',
 'La cintura di canali patrimonio UNESCO, con i celebri Herengracht, Keizersgracht e Prinsengracht. Hotels boutique in case del Seicento, Anne Frank House e Westerkerk. Molto turistico ma iconicamente olandese.',
 'The UNESCO World Heritage canal belt, with the famous Herengracht, Keizersgracht and Prinsengracht. Boutique hotels in 17th-century houses, Anne Frank House and Westerkerk. Very touristy but iconically Dutch.',
 ARRAY['culturale','lusso','arte','shopping'],
 'https://www.booking.com/searchresults.html?ss=Grachtengordel%2C+Amsterdam&lang=it', 3),

('amsterdam', 'Oud-West', 'Oud-West',
 'Quartiere residenziale autentico e in rapida trasformazione, con caffe specialty, negozi indipendenti e una vita di quartiere vivace. Meno turistico del centro, ottima base per chi vuole vivere Amsterdam come un locale.',
 'Authentic and fast-evolving residential neighbourhood, with speciality cafés, independent shops and a lively local life. Less touristy than the centre, an excellent base for those wanting to experience Amsterdam like a local.',
 ARRAY['locali','gastronomia','tranquillo','vita notturna'],
 'https://www.booking.com/searchresults.html?ss=Oud-West%2C+Amsterdam&lang=it', 4),

-- ── Praga ─────────────────────────────────────────────────────────────────────
('praga', 'Staré Město (Città Vecchia)', 'Staré Město (Old Town)',
 'Il cuore medievale di Praga, con la celebre Piazza della Città Vecchia, l''Orologio Astronomico e chiese gotiche. Molto turistico ma assolutamente imperdibile per l''atmosfera unica. Prezzi elevati, posizione impareggiabile.',
 'Prague''s medieval heart, with the famous Old Town Square, the Astronomical Clock and Gothic churches. Very touristy but absolutely unmissable for the unique atmosphere. High prices, unbeatable location.',
 ARRAY['culturale','lusso','arte','shopping'],
 'https://www.booking.com/searchresults.html?ss=Stare+Mesto%2C+Prague&lang=it', 1),

('praga', 'Vinohrady', 'Vinohrady',
 'Elegante quartiere residenziale con splendidi palazzi Art Nouveau e Secessione. Ottima scelta di ristoranti, caffe e bar frequentati dai praghesi. Molto meno turistico del centro, ottima connessione metro.',
 'Elegant residential neighbourhood with splendid Art Nouveau and Secession buildings. Excellent choice of restaurants, cafés and bars popular with Praguers. Much less touristy than the centre, excellent metro connections.',
 ARRAY['gastronomia','locali','lusso','tranquillo'],
 'https://www.booking.com/searchresults.html?ss=Vinohrady%2C+Prague&lang=it', 2),

('praga', 'Žižkov', 'Žižkov',
 'Il quartiere piu autentico e alternativo di Praga, con il maggior numero di pub per abitante in Europa. Collina con il gigantesco monumento equestre di Žižka, torre della tv e una comunita artistica vivace. Prezzi molto accessibili.',
 'Prague''s most authentic and alternative neighbourhood, with the highest number of pubs per capita in Europe. Hill with the giant Žižka equestrian statue, TV tower and a vibrant artistic community. Very affordable prices.',
 ARRAY['vita notturna','locali','budget','arte'],
 'https://www.booking.com/searchresults.html?ss=Zizkov%2C+Prague&lang=it', 3),

('praga', 'Malá Strana (Piccolo Quartiere)', 'Malá Strana (Lesser Town)',
 'Il pittoresco quartiere ai piedi del Castello di Praga, con palazzi barocchi, giardini nascosti e il Ponte Carlo. Romanticamente bello di notte, tranquillo e meno affollato della Città Vecchia. Ideale per coppie.',
 'The picturesque neighbourhood at the foot of Prague Castle, with Baroque palaces, hidden gardens and Charles Bridge. Romantically beautiful at night, quieter and less crowded than the Old Town. Ideal for couples.',
 ARRAY['culturale','tranquillo','lusso','vista panoramica'],
 'https://www.booking.com/searchresults.html?ss=Mala+Strana%2C+Prague&lang=it', 4),

-- ── Budapest ──────────────────────────────────────────────────────────────────
('budapest', 'VII distretto / Erzsébetváros', '7th District / Erzsébetváros',
 'Il celebre Quartiere Ebraico di Budapest, con la Grande Sinagoga (la piu grande d''Europa), i ruin bar (Szimpla Kert) e una vivace vita notturna. Di giorno culturale, di sera il cuore della movida di Budapest.',
 'Budapest''s famous Jewish Quarter, home to the Great Synagogue (the largest in Europe), ruin bars (Szimpla Kert) and a vibrant nightlife. Cultural by day, the heart of Budapest nightlife by night.',
 ARRAY['vita notturna','culturale','arte','locali'],
 'https://www.booking.com/searchresults.html?ss=District+VII%2C+Budapest&lang=it', 1),

('budapest', 'Buda / I distretto (Castello)', 'Buda / 1st District (Castle)',
 'La parte collinare storica di Budapest, sul lato ovest del Danubio. Il Castello di Buda, il Bastione dei Pescatori e la Chiesa di Mattia dominano la citta. Tranquillo, elegante e panoramico. Patrimonio UNESCO.',
 'The historic hilly side of Budapest, on the west bank of the Danube. Buda Castle, Fisherman''s Bastion and Matthias Church dominate the city. Quiet, elegant and panoramic. UNESCO World Heritage.',
 ARRAY['culturale','tranquillo','lusso','vista panoramica'],
 'https://www.booking.com/searchresults.html?ss=Castle+District%2C+Budapest&lang=it', 2),

('budapest', 'V distretto / Belváros (Centro)', '5th District / Belváros (Centre)',
 'Il centro di Pest, con il Parlamento, la Basilica di Santo Stefano e il lungofiume sul Danubio. Ottima posizione, ottimi ristoranti e hotel. Molto turistico ma imbattibile per la posizione centrale.',
 'The centre of Pest, with the Parliament, St Stephen''s Basilica and the Danube promenade. Excellent location, restaurants and hotels. Very touristy but unbeatable for its central position.',
 ARRAY['culturale','lusso','shopping','metro'],
 'https://www.booking.com/searchresults.html?ss=District+V%2C+Budapest&lang=it', 3),

('budapest', 'VI distretto / Terézváros', '6th District / Terézváros',
 'Il quartiere borghese e elegante lungo il Viale Andrássy (patrimonio UNESCO), con l''Opera di Stato e la House of Terror. Atmosfera mitteleuropea, ottimi caffe e ristoranti. Meno caotico del centro.',
 'The elegant bourgeois neighbourhood along Andrássy Avenue (UNESCO), home to the State Opera and the House of Terror. Central European atmosphere, excellent cafés and restaurants. Less chaotic than the centre.',
 ARRAY['lusso','culturale','gastronomia','arte'],
 'https://www.booking.com/searchresults.html?ss=District+VI%2C+Budapest&lang=it', 4),

-- ── Lisbona ───────────────────────────────────────────────────────────────────
('lisbona', 'Alfama', 'Alfama',
 'Il quartiere piu antico e autentico di Lisbona, aggrappato alla collina sopra il Tago. Vicoli tortuosi, case azulejadas, fado nelle taverne e viste mozzafiato. Autentico ma in rapida trasformazione turistica.',
 'Lisbon''s oldest and most authentic neighbourhood, clinging to the hill above the Tagus. Winding alleys, azulejo-covered houses, fado in taverns and breathtaking views. Authentic but rapidly changing.',
 ARRAY['culturale','vista panoramica','gastronomia','locali'],
 'https://www.booking.com/searchresults.html?ss=Alfama%2C+Lisbon&lang=it', 1),

('lisbona', 'Chiado / Príncipe Real', 'Chiado / Príncipe Real',
 'Il quartiere piu elegante di Lisbona, con caffe storici (A Brasileira), librerie antiche, boutique di design e una piazza con mercato bio ogni sabato. Molto frequentato dai lisboeti colti e dagli expat. Prezzi elevati.',
 'Lisbon''s most elegant neighbourhood, with historic cafés (A Brasileira), antique bookshops, design boutiques and a Saturday organic market. Very popular with cultured Lisboetas and expats. High prices.',
 ARRAY['lusso','arte','shopping','gastronomia'],
 'https://www.booking.com/searchresults.html?ss=Chiado%2C+Lisbon&lang=it', 2),

('lisbona', 'Mouraria', 'Mouraria',
 'Il quartiere piu multiculturale di Lisbona, ai piedi del Castello. Autentico, popolare e in trasformazione: mercato coperto, ristoranti etnici, fado nelle stradine. Meno turistico di Alfama ma altrettanto affascinante.',
 'Lisbon''s most multicultural neighbourhood, at the foot of the Castle. Authentic, working-class and evolving: covered market, ethnic restaurants, fado in the lanes. Less touristy than Alfama but equally charming.',
 ARRAY['locali','culturale','mercati','gastronomia'],
 'https://www.booking.com/searchresults.html?ss=Mouraria%2C+Lisbon&lang=it', 3),

('lisbona', 'Bairro Alto', 'Bairro Alto',
 'Il quartiere della movida lisboeta: tranquillo di giorno con caffè e negozi vintage, esplode di vita notturna dal tramonto. Centinaia di bar concentrati in poche strade. Rumoroso ma dall''energia unica.',
 'Lisbon''s nightlife neighbourhood: calm by day with cafés and vintage shops, bursting with life from sunset onwards. Hundreds of bars packed into a few streets. Noisy but with a unique energy.',
 ARRAY['vita notturna','locali','arte','budget'],
 'https://www.booking.com/searchresults.html?ss=Bairro+Alto%2C+Lisbon&lang=it', 4);

-- ════════════════════════════════════════════════════════════
-- FOODS — Piatti tipici
-- Solo per città nuove aggiunte via seed.sql (DELETE + INSERT).
-- Le città originali (roma, milano, barcellona, parigi, londra,
-- oslo, bergen) hanno i piatti inseriti direttamente su Supabase.
-- NOTA: aggiunge la colonna ingredients_en se non esiste.
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.foods ADD COLUMN IF NOT EXISTS ingredients_en JSONB DEFAULT '[]'::jsonb;

DELETE FROM public.foods WHERE city IN (
  'vienna', 'bruges', 'copenaghen', 'marsiglia', 'berlino',
  'monaco_di_baviera', 'francoforte', 'atene', 'dublino', 'venezia',
  'amsterdam', 'praga', 'budapest', 'lisbona'
);

INSERT INTO public.foods (city, name, name_en, description, description_en, ingredients, ingredients_en, places) VALUES

-- ── Vienna ────────────────────────────────────────────────────────────────────
('vienna', 'Wiener Schnitzel', 'Wiener Schnitzel',
 'Cotoletta di vitello battuta sottile, impanata e fritta nel burro chiarificato fino a doratura. Piatto nazionale austriaco per eccellenza, servita con insalata di patate o mirtilli rossi.',
 $$Thinly pounded veal cutlet, breaded and pan-fried in clarified butter until golden. Austria's national dish, served with potato salad or lingonberries.$$,
 '["vitello","uova","pangrattato","burro chiarificato","limone","prezzemolo"]'::jsonb,
 '["veal","eggs","breadcrumbs","clarified butter","lemon","parsley"]'::jsonb,
 '[{"name":"Figlmüller Wollzeile","maps_link":"https://www.google.com/maps/search/Figlmuller+Wollzeile+Vienna"},{"name":"Gasthaus Pöschl","maps_link":"https://www.google.com/maps/search/Gasthaus+Poschl+Vienna"}]'::jsonb),

('vienna', 'Apfelstrudel', 'Apfelstrudel',
 'Strudel di mele speziato avvolto in pasta tirata a mano sottilissima. Servito caldo con panna montata fresca o gelato alla vaniglia, profumato di cannella e uvetta.',
 'Spiced apple filling in hand-stretched paper-thin pastry. Served warm with whipped cream or vanilla ice cream, fragrant with cinnamon and raisins.',
 '["mele renette","pasta strudel","cannella","uvetta","zucchero","burro","pangrattato"]'::jsonb,
 '["Renette apples","strudel pastry","cinnamon","raisins","sugar","butter","breadcrumbs"]'::jsonb,
 '[{"name":"Café Central","maps_link":"https://www.google.com/maps/search/Cafe+Central+Vienna"},{"name":"Café Landtmann","maps_link":"https://www.google.com/maps/search/Cafe+Landtmann+Vienna"}]'::jsonb),

('vienna', 'Sachertorte', 'Sachertorte',
 $$La torta al cioccolato piu celebre d'Austria. Due strati di biscuit al cacao, strato di marmellata di albicocche e glassa di cioccolato fondente lucida. Nata nel 1832 all'Hotel Sacher.$$,
 $$The most celebrated Austrian chocolate cake. Two layers of cocoa sponge, apricot jam layer and glossy dark chocolate glaze. Created in 1832 at Hotel Sacher.$$,
 '["cioccolato fondente","burro","uova","marmellata di albicocche","farina","zucchero"]'::jsonb,
 '["dark chocolate","butter","eggs","apricot jam","flour","sugar"]'::jsonb,
 '[{"name":"Café Sacher Wien","maps_link":"https://www.google.com/maps/search/Cafe+Sacher+Wien+Vienna"},{"name":"Konditorei Sluka","maps_link":"https://www.google.com/maps/search/Konditorei+Sluka+Vienna"}]'::jsonb),

('vienna', 'Tafelspitz', 'Tafelspitz',
 $$Bollito di manzo (punta di scamone) cotto lentamente in brodo aromatico con verdure. Servito con rafano grattugiato fresco e salsa di mele. Il piatto preferito dell'imperatore Francesco Giuseppe.$$,
 $$Slowly boiled beef rump in aromatic broth with vegetables. Served with freshly grated horseradish and apple sauce. Emperor Franz Joseph's favourite dish.$$,
 '["scamone di manzo","midollo osseo","carote","sedano rapa","rafano","mele","prezzemolo"]'::jsonb,
 '["beef rump","bone marrow","carrots","celeriac","horseradish","apples","parsley"]'::jsonb,
 '[{"name":"Plachutta Wollzeile","maps_link":"https://www.google.com/maps/search/Plachutta+Wollzeile+Vienna"},{"name":"Zum Wohl","maps_link":"https://www.google.com/maps/search/Zum+Wohl+Vienna"}]'::jsonb),

('vienna', 'Gulasch viennese', 'Viennese Goulash',
 'Spezzatino di manzo con paprika dolce e cipolla in abbondante sugo scuro, variante viennese del classico gulasch ungherese. Servito con pane di semola o Semmelknödel.',
 'Beef stew with sweet paprika and onion in a rich dark sauce, the Viennese take on classic Hungarian goulash. Served with semolina bread or Semmelknödel.',
 '["manzo","cipolla","paprika dolce","concentrato di pomodoro","maggiorana","cumino"]'::jsonb,
 '["beef","onion","sweet paprika","tomato paste","marjoram","caraway seeds"]'::jsonb,
 '[{"name":"Gasthaus Pöschl","maps_link":"https://www.google.com/maps/search/Gasthaus+Poschl+Vienna"},{"name":"Figlmüller Bäckerstraße","maps_link":"https://www.google.com/maps/search/Figlmuller+Backerstrasse+Vienna"}]'::jsonb),

('vienna', 'Kaiserschmarrn', 'Kaiserschmarrn',
 'Frittata dolce soffice fatta a pezzetti e caramellata con zucchero a velo, servita con uvetta e confettura di susine. Un dessert imperiale dalla storia legata a Francesco Giuseppe.',
 $$Fluffy sweet pancake shredded and caramelised with icing sugar, served with raisins and plum jam. An imperial dessert linked to Emperor Franz Joseph's story.$$,
 '["uova","farina","latte","uvetta","zucchero a velo","burro","panna"]'::jsonb,
 '["eggs","flour","milk","raisins","icing sugar","butter","cream"]'::jsonb,
 '[{"name":"Café Landtmann","maps_link":"https://www.google.com/maps/search/Cafe+Landtmann+Vienna"},{"name":"Restaurant Meixner","maps_link":"https://www.google.com/maps/search/Restaurant+Meixner+Vienna"}]'::jsonb),

('vienna', 'Leberkäse', 'Leberkäse',
 'Polpettone di manzo e maiale finemente macinati, cotto in forno fino a formare una crosta dorata. Servito a fette spesse su panino con senape dolce. Street food classico delle Würstelbuden viennesi.',
 'Finely ground beef and pork meatloaf, oven-baked until a golden crust forms. Sliced thick in a bread roll with sweet mustard. Classic street food at Vienna sausage stands.',
 '["manzo macinato","maiale","lardo","sale","spezie","senape dolce"]'::jsonb,
 '["minced beef","pork","lard","salt","spices","sweet mustard"]'::jsonb,
 '[{"name":"Würstelstand am Naschmarkt","maps_link":"https://www.google.com/maps/search/Wurstelstand+Naschmarkt+Vienna"},{"name":"Bitzinger Würstelstand","maps_link":"https://www.google.com/maps/search/Bitzinger+Wurstelstand+Vienna"}]'::jsonb),

('vienna', 'Kipferl', 'Kipferl',
 $$Le paste sfoglia e i dolci da colazione tipici delle Konditoreien viennesi. Il Kipferl a mezzaluna e l'antenato del croissant francese e il simbolo della pasticceria viennese nel mondo.$$,
 $$The pastries and breakfast sweets typical of Vienna's Konditoreien. The crescent-shaped Kipferl is the ancestor of the French croissant and the symbol of Viennese patisserie worldwide.$$,
 '["farina","burro","lievito","uova","zucchero","vaniglia","latte"]'::jsonb,
 '["flour","butter","yeast","eggs","sugar","vanilla","milk"]'::jsonb,
 '[{"name":"Café Hawelka","maps_link":"https://www.google.com/maps/search/Cafe+Hawelka+Vienna"},{"name":"Felber Bäckerei","maps_link":"https://www.google.com/maps/search/Felber+Backerei+Vienna"}]'::jsonb),

-- ── Bruges ────────────────────────────────────────────────────────────────────
('bruges', 'Moules-frites', 'Moules-frites',
 'Cozze fresche cotte al vapore nella birra bianca con sedano, cipolla e erbe aromatiche, servite con abbondanti patatine fritte croccanti. Il piatto piu iconico del Belgio.',
 'Fresh mussels steamed in white beer with celery, onion and herbs, served with generous crispy fries. Belgium''s most iconic dish.',
 '["cozze fresche","birra bianca","sedano","cipolla","burro","prezzemolo","alloro"]'::jsonb,
 '["fresh mussels","white beer","celery","onion","butter","parsley","bay leaf"]'::jsonb,
 '[{"name":"Restaurant Duc de Bourgogne","maps_link":"https://www.google.com/maps/search/Duc+de+Bourgogne+Bruges"},{"name":"De Garre","maps_link":"https://www.google.com/maps/search/De+Garre+Bruges"}]'::jsonb),

('bruges', 'Carbonnade flamande', 'Flemish Carbonnade',
 'Spezzatino di manzo cotto lentamente nella birra bruna belga con cipolle caramellate e pan di spezie. Piatto simbolo della cucina fiamminga, ricco e avvolgente.',
 'Beef stew slowly cooked in Belgian dark beer with caramelised onions and spiced bread. The signature dish of Flemish cuisine, rich and comforting.',
 '["manzo","birra bruna belga","cipolla","pan di spezie","timo","alloro","aceto"]'::jsonb,
 '["beef","Belgian dark beer","onion","spiced bread","thyme","bay leaf","vinegar"]'::jsonb,
 '[{"name":"De Halve Maan Brasserie","maps_link":"https://www.google.com/maps/search/De+Halve+Maan+Bruges"},{"name":"Restaurant Gruuthuse Hof","maps_link":"https://www.google.com/maps/search/Gruuthuse+Hof+Bruges"}]'::jsonb),

('bruges', 'Waterzooi', 'Waterzooi',
 'Zuppa cremosa originaria di Gand, preparata con pollo o pesce bianco, verdure di stagione e una base di panna e tuorli d''uovo. Il comfort food belga per eccellenza.',
 'Creamy stew from Ghent, made with chicken or white fish, seasonal vegetables and a cream and egg yolk base. The epitome of Belgian comfort food.',
 '["pollo o pesce bianco","panna","tuorli d''uovo","carote","porro","sedano","patate"]'::jsonb,
 '["chicken or white fish","cream","egg yolks","carrots","leek","celery","potatoes"]'::jsonb,
 '[{"name":"Restaurant De Gouden Koorde","maps_link":"https://www.google.com/maps/search/De+Gouden+Koorde+Bruges"},{"name":"Restaurant t Huidevettershuis","maps_link":"https://www.google.com/maps/search/Huidevettershuis+Bruges"}]'::jsonb),

('bruges', 'Gaufre de Liège', 'Liège Waffle',
 'La vera cialda belga: densa e caramellata con perle di zucchero di canna che si sciolgono in cottura. Da mangiare calda per strada. Molto diversa dalla gaufre di Bruxelles, piu ricca e profumata.',
 'The real Belgian waffle: dense and caramelised with brown sugar pearls that melt during cooking. Best eaten hot from a street stall. Very different from the Brussels waffle, richer and more fragrant.',
 '["farina","lievito","burro","uova","perle di zucchero di canna","vaniglia"]'::jsonb,
 '["flour","yeast","butter","eggs","pearl sugar","vanilla"]'::jsonb,
 '[{"name":"De Proeverie","maps_link":"https://www.google.com/maps/search/De+Proeverie+Bruges"},{"name":"Confiserie De Clerck","maps_link":"https://www.google.com/maps/search/Confiserie+De+Clerck+Bruges"}]'::jsonb),

('bruges', 'Friet belghe', 'Belgian Fries',
 'Le leggendarie patatine fritte belghe, cotte due volte nel grasso di bue per una croccantezza impareggiabile. Servite in un cartoccio con maionaise o una delle 20 salse disponibili. Una vera istituzione nazionale.',
 'Legendary Belgian fries, double-fried in beef fat for unrivalled crispiness. Served in a paper cone with mayonnaise or one of 20 available sauces. A true national institution.',
 '["patate Bintje","grasso di bue","sale","maionaise"]'::jsonb,
 '["Bintje potatoes","beef fat","salt","mayonnaise"]'::jsonb,
 '[{"name":"Frituur De Gouden Friet","maps_link":"https://www.google.com/maps/search/De+Gouden+Friet+Bruges"},{"name":"Frietmuseum Café","maps_link":"https://www.google.com/maps/search/Frietmuseum+Bruges"}]'::jsonb),

('bruges', 'Cioccolato belga', 'Belgian Chocolate',
 'Le praline artigianali di Bruges sono tra le piu celebrate al mondo. Gusci di cioccolato belga al latte o fondente ripieni di ganache, marzapane o creme esotiche. Da assaggiare nelle cioccolaterie artigianali.',
 $$Bruges handmade chocolates are among the world's most celebrated. Belgian milk or dark chocolate shells filled with ganaches, marzipan or exotic creams. Best sampled in artisan chocolatiers.$$,
 '["cioccolato belga","panna","burro di cacao","nocciole","marzapane"]'::jsonb,
 '["Belgian chocolate","cream","cocoa butter","hazelnuts","marzipan"]'::jsonb,
 '[{"name":"The Chocolate Line","maps_link":"https://www.google.com/maps/search/The+Chocolate+Line+Bruges"},{"name":"Dumon Chocolatier","maps_link":"https://www.google.com/maps/search/Dumon+Chocolatier+Bruges"}]'::jsonb),

('bruges', 'Speculoos', 'Speculoos',
 'Biscotti friabili speziati con cannella, chiodi di garofano, noce moscata e cardamomo. Tradizionalmente associati a San Nicola (6 dicembre) ma oggi disponibili tutto l''anno in ogni forma.',
 'Crispy spiced biscuits with cinnamon, cloves, nutmeg and cardamom. Traditionally linked to St Nicholas Day (6 December) but now available year-round in every form.',
 '["farina","zucchero di canna","burro","cannella","chiodi di garofano","cardamomo","noce moscata"]'::jsonb,
 '["flour","brown sugar","butter","cinnamon","cloves","cardamom","nutmeg"]'::jsonb,
 '[{"name":"Confiserie De Clerck","maps_link":"https://www.google.com/maps/search/Confiserie+De+Clerck+Bruges"},{"name":"The Chocolate Line","maps_link":"https://www.google.com/maps/search/The+Chocolate+Line+Bruges"}]'::jsonb),

('bruges', 'Stoemp', 'Stoemp',
 'Purea di patate cremosa mescolata con verdure di stagione (carote, porri, cavolo), servita con wurstel tradizionali o fette di lardo. Cucina casalinga belga per eccellenza.',
 'Creamy mashed potato mixed with seasonal vegetables (carrots, leeks, cabbage), served with traditional sausages or lard slices. The epitome of Belgian home cooking.',
 '["patate","carote","porri","cavolo","burro","wurstel belgi","lardo"]'::jsonb,
 '["potatoes","carrots","leeks","cabbage","butter","Belgian sausages","lard"]'::jsonb,
 '[{"name":"De Halve Maan Brasserie","maps_link":"https://www.google.com/maps/search/De+Halve+Maan+Bruges"},{"name":"Restaurant Gruuthuse Hof","maps_link":"https://www.google.com/maps/search/Gruuthuse+Hof+Bruges"}]'::jsonb),

-- ── Copenaghen ────────────────────────────────────────────────────────────────
('copenaghen', 'Smørrebrød', 'Smørrebrød',
 'Il pane di segale scuro danese spalmato di burro e ricoperto con guarnizioni elaborate: aringhe marinate, gamberi, uova sode, patate di fegato. Il pranzo danese per eccellenza.',
 'Danish dark rye bread spread with butter and topped with elaborate toppings: pickled herring, shrimp, hard-boiled eggs, liver pâté. The quintessential Danish lunch.',
 '["pane di segale","burro","aringhe marinate","gamberi","uova sode","cetrioli","aneto"]'::jsonb,
 '["rye bread","butter","pickled herring","shrimp","hard-boiled eggs","cucumber","dill"]'::jsonb,
 '[{"name":"Aamanns","maps_link":"https://www.google.com/maps/search/Aamanns+Copenhagen"},{"name":"Restaurant Schønnemann","maps_link":"https://www.google.com/maps/search/Restaurant+Schonnemann+Copenhagen"}]'::jsonb),

('copenaghen', 'Frikadeller', 'Frikadeller',
 'Polpette danesi piatte di maiale e manzo con cipolla e noce moscata, fritte nel burro fino a doratura. Servite con purea di patate e cavolo rosso marinato. Il comfort food danese per eccellenza.',
 'Flat Danish pork and beef patties with onion and nutmeg, pan-fried in butter until golden. Served with mashed potatoes and pickled red cabbage. The quintessential Danish comfort food.',
 '["maiale macinato","manzo","cipolla","noce moscata","farina","uova","latte"]'::jsonb,
 '["minced pork","beef","onion","nutmeg","flour","eggs","milk"]'::jsonb,
 '[{"name":"Café Nørreport","maps_link":"https://www.google.com/maps/search/Cafe+Norreport+Copenhagen"},{"name":"Restaurant Puk","maps_link":"https://www.google.com/maps/search/Restaurant+Puk+Copenhagen"}]'::jsonb),

('copenaghen', 'Stegt flæsk', 'Stegt Flæsk',
 'Pancetta di maiale arrostita in forno fino a diventare croccantissima, servita con salsa cremosa al prezzemolo e patate lesse. Il piatto nazionale piu amato dai danesi, votato in un sondaggio nazionale.',
 $$Pork belly roasted until incredibly crispy, served with creamy parsley sauce and boiled potatoes. Denmark's most beloved national dish, voted in a national poll.$$,
 '["pancetta di maiale","prezzemolo","panna","farina","burro","patate"]'::jsonb,
 '["pork belly","parsley","cream","flour","butter","potatoes"]'::jsonb,
 '[{"name":"Slotskøkkenet","maps_link":"https://www.google.com/maps/search/Slotskokkentet+Copenhagen"},{"name":"Restaurant Palægade","maps_link":"https://www.google.com/maps/search/Palaegade+Copenhagen"}]'::jsonb),

('copenaghen', 'Rød pølse', 'Red Hot Dog',
 'L''hotdog rosso danese, uno dei piu antichi street food nordici. Wurstel di maiale tinto di rosso naturale in un panino morbido con senape dolce, cipolla fritta croccante e ketchup.',
 'The Danish red hot dog, one of the oldest Nordic street foods. Red-dyed pork sausage in a soft bun with sweet mustard, crispy fried onion and ketchup.',
 '["wurstel di maiale","panino danese","senape dolce","cipolla fritta","ketchup"]'::jsonb,
 '["pork sausage","Danish bun","sweet mustard","crispy fried onion","ketchup"]'::jsonb,
 '[{"name":"John''s Hotdog Deli","maps_link":"https://www.google.com/maps/search/Johns+Hotdog+Deli+Copenhagen"},{"name":"Hviids Vinstue","maps_link":"https://www.google.com/maps/search/Hviids+Vinstue+Copenhagen"}]'::jsonb),

('copenaghen', 'Æbleskiver', 'Æbleskiver',
 'Frittelle sferiche cotte in una padella di ghisa speciale con cavita rotonde. Servite con zucchero a velo e marmellata di prugne. Tipiche del periodo di Avvento ma disponibili tutto l''anno nei mercatini.',
 'Spherical pancakes cooked in a special cast-iron pan with round cavities. Served with icing sugar and plum jam. Traditional during Advent but available year-round at market stalls.',
 '["farina","latte","uova","burro","cardamomo","lievito","zucchero a velo"]'::jsonb,
 '["flour","milk","eggs","butter","cardamom","baking powder","icing sugar"]'::jsonb,
 '[{"name":"Torvehallerne Market","maps_link":"https://www.google.com/maps/search/Torvehallerne+Copenhagen"},{"name":"Café Nørreport","maps_link":"https://www.google.com/maps/search/Cafe+Norreport+Copenhagen"}]'::jsonb),

('copenaghen', 'New Nordic', 'New Nordic',
 'La cucina nordica contemporanea di Copenaghen ha ridefinito la gastronomia mondiale. Ingredienti locali e stagionali, fermentazioni, erbe selvatiche e presentazioni minimaliste. Un''esperienza culinaria unica.',
 'Copenhagen''s contemporary Nordic cuisine has redefined world gastronomy. Local and seasonal ingredients, fermentations, foraged herbs and minimalist presentations. A unique culinary experience.',
 '["ingredienti di stagione","erbe selvatiche","fermentati","pesce nordico","alghe","funghi"]'::jsonb,
 '["seasonal ingredients","foraged herbs","fermented foods","Nordic fish","seaweed","mushrooms"]'::jsonb,
 '[{"name":"Noma","maps_link":"https://www.google.com/maps/search/Noma+Copenhagen"},{"name":"Geranium","maps_link":"https://www.google.com/maps/search/Geranium+Copenhagen"}]'::jsonb),

('copenaghen', 'Rugbrød', 'Rugbrød',
 'Il pane di segale scuro e denso danese. Fermentato naturalmente con lievito madre, ricco di fibre e dai sapori aciduli profondi. Base indispensabile dello smørrebrød e della dieta danese quotidiana.',
 $$Denmark's dark dense rye bread. Naturally fermented with sourdough, high in fibre with deep sour flavours. The indispensable base of smørrebrød and the everyday Danish diet.$$,
 '["farina di segale","lievito madre","semi di girasole","semi di lino","malto","sale"]'::jsonb,
 '["rye flour","sourdough starter","sunflower seeds","flax seeds","malt","salt"]'::jsonb,
 '[{"name":"Hart Bageri","maps_link":"https://www.google.com/maps/search/Hart+Bageri+Copenhagen"},{"name":"Juno the Bakery","maps_link":"https://www.google.com/maps/search/Juno+the+Bakery+Copenhagen"}]'::jsonb),

('copenaghen', 'Wienerbrød', 'Danish Pastry',
 'Le brioches sfogliate danesi (chiamate "pane viennese" in danese) sono il dolce da colazione piu famoso della Danimarca. Pasta laminata al burro con ripieni di cannella, marzapane o frutti di stagione.',
 'Danish flaky pastries (called "Vienna bread" in Danish) are Denmark''s most famous breakfast sweet. Butter-laminated pastry with cinnamon, marzipan or seasonal fruit fillings.',
 '["farina","burro","lievito","uova","zucchero","cannella","marzapane"]'::jsonb,
 '["flour","butter","yeast","eggs","sugar","cinnamon","marzipan"]'::jsonb,
 '[{"name":"Hart Bageri","maps_link":"https://www.google.com/maps/search/Hart+Bageri+Copenhagen"},{"name":"Meyers Bageri","maps_link":"https://www.google.com/maps/search/Meyers+Bageri+Copenhagen"}]'::jsonb),

-- ── Marsiglia ────────────────────────────────────────────────────────────────
('marsiglia', 'Bouillabaisse', 'Bouillabaisse',
 'La zuppa di pesce piu famosa al mondo, originaria di Marsiglia. Mix di pesci di scoglio (rascasse, grondin, san Pietro), crostacei e patate in un brodo allo zafferano, servita con rouille su pane tostato.',
 'The world''s most famous fish soup, originating in Marseille. Mixed rockfish (rascasse, gurnard, john dory), shellfish and potatoes in saffron broth, served with rouille on toasted bread.',
 '["pesci di scoglio","gamberi","vongole","zafferano","finocchio","pomodoro","rouille","pane"]'::jsonb,
 '["rockfish","prawns","clams","saffron","fennel","tomato","rouille","bread"]'::jsonb,
 '[{"name":"Chez Michel","maps_link":"https://www.google.com/maps/search/Chez+Michel+Marseille"},{"name":"Le Miramar","maps_link":"https://www.google.com/maps/search/Le+Miramar+Marseille"}]'::jsonb),

('marsiglia', 'Pieds et paquets', 'Pieds et paquets',
 'Trippa di agnello farcita con lardo, prezzemolo e aglio (i "pacchetti"), cotta lentamente con piedi di montone nel pomodoro per ore. Piatto emblematico e autentico della cucina marsigliese.',
 'Stuffed lamb tripe parcels with lard, parsley and garlic (the "packets"), slow-cooked for hours with sheep''s trotters in tomato. An emblematic and authentic Marseille dish.',
 '["trippa di agnello","piedi di montone","lardo","aglio","prezzemolo","pomodoro","cipolla"]'::jsonb,
 '["lamb tripe","sheep''s trotters","lard","garlic","parsley","tomato","onion"]'::jsonb,
 '[{"name":"Chez Loury","maps_link":"https://www.google.com/maps/search/Chez+Loury+Marseille"},{"name":"Le Souk","maps_link":"https://www.google.com/maps/search/Le+Souk+Marseille"}]'::jsonb),

('marsiglia', 'Navettes de Marseille', 'Marseille Navettes',
 $$Biscotti a forma di navicella aromatizzati al fiore d'arancio, prodotti ininterrottamente dal 1781 nel forno piu antico di Marsiglia. Si mangiano tradizionalmente durante la Candelora (2 febbraio).$$,
 'Boat-shaped biscuits flavoured with orange blossom, made uninterruptedly since 1781 in Marseille''s oldest bakery. Traditionally eaten during Candlemas (2 February).',
 '["farina","zucchero","fiore d''arancio","uova","burro","scorza di limone"]'::jsonb,
 '["flour","sugar","orange blossom","eggs","butter","lemon zest"]'::jsonb,
 '[{"name":"Four des Navettes","maps_link":"https://www.google.com/maps/search/Four+des+Navettes+Marseille"},{"name":"Maison Weibel","maps_link":"https://www.google.com/maps/search/Maison+Weibel+Marseille"}]'::jsonb),

('marsiglia', 'Pastis', 'Pastis',
 'Aperitivo anicetato a 45 gradi, diluito con acqua fredda che lo rende lattiginoso e fresco. Il simbolo assoluto di Marsiglia e di tutta la Provenza. Si beve sempre con ghiaccio e acqua molto fredda.',
 'Anise-flavoured aperitif at 45 degrees, diluted with cold water turning it milky and refreshing. The absolute symbol of Marseille and all of Provence. Always served with ice and very cold water.',
 '["anice stellato","alcol neutro","liquirizia","erbe provenzali","zucchero"]'::jsonb,
 '["star anise","neutral alcohol","liquorice","Provençal herbs","sugar"]'::jsonb,
 '[{"name":"Bar de la Marine","maps_link":"https://www.google.com/maps/search/Bar+de+la+Marine+Marseille"},{"name":"Le Bar de la Bonne Mere","maps_link":"https://www.google.com/maps/search/Bar+de+la+Bonne+Mere+Marseille"}]'::jsonb),

('marsiglia', 'Soupe de poisson', 'Fish Soup',
 'La versione filtrata e cremosa della bouillabaisse. Brodo di pesce denso e saporito, servito con piccoli crostini di pane, rouille all''aglio e gruyere grattugiato. Ideale come primo piatto.',
 'The filtered creamy version of bouillabaisse. A thick and flavourful fish broth, served with small croutons, garlic rouille and grated gruyère. Ideal as a starter.',
 '["pesci di scoglio","pomodoro","zafferano","aglio","cipolla","rouille","gruyere"]'::jsonb,
 '["rockfish","tomato","saffron","garlic","onion","rouille","gruyere"]'::jsonb,
 '[{"name":"Chez Fonfon","maps_link":"https://www.google.com/maps/search/Chez+Fonfon+Marseille"},{"name":"Le Miramar","maps_link":"https://www.google.com/maps/search/Le+Miramar+Marseille"}]'::jsonb),

('marsiglia', 'Chichi frégi', 'Chichi Frégi',
 'Lunghe frittelle di pasta lievitata, leggere e croccanti fuori, fritte nell''olio e ricoperte di zucchero semolato. Street food immancabile sul Vieux-Port e nelle feste popolari marsigliesi.',
 'Long fried leavened dough sticks, light and crispy outside, covered in caster sugar. An unmissable street food at the Vieux-Port and during Marseille''s popular festivals.',
 '["farina","lievito di birra","acqua","sale","olio di semi","zucchero semolato"]'::jsonb,
 '["flour","fresh yeast","water","salt","sunflower oil","caster sugar"]'::jsonb,
 '[{"name":"Friterie des Catalans","maps_link":"https://www.google.com/maps/search/Friterie+des+Catalans+Marseille"},{"name":"Vieux-Port market stalls","maps_link":"https://www.google.com/maps/search/Vieux+Port+Marseille"}]'::jsonb),

('marsiglia', 'Tapenade', 'Tapenade',
 $$Crema spalmabile provenzale di olive nere, capperi, acciughe e olio d'oliva extra vergine. Servita su fette di pane tostato come antipasto. Il termine deriva dalla parola provenzale "tapeno" (cappero).$$,
 $$Provençal spreadable paste of black olives, capers, anchovies and extra virgin olive oil. Served on toasted bread slices as an appetiser. The name derives from the Provençal word "tapeno" (caper).$$,
 '["olive nere","capperi","acciughe","olio d''oliva extra vergine","aglio","timo","limone"]'::jsonb,
 '["black olives","capers","anchovies","extra virgin olive oil","garlic","thyme","lemon"]'::jsonb,
 '[{"name":"Le Café des Épices","maps_link":"https://www.google.com/maps/search/Cafe+des+Epices+Marseille"},{"name":"La Cantinetta","maps_link":"https://www.google.com/maps/search/La+Cantinetta+Marseille"}]'::jsonb),

('marsiglia', 'Panisse', 'Panisse',
 'Crocchette o bastoncini di farina di ceci fritti, croccanti fuori e morbidi dentro. Street food tradizionale di Marsiglia e di tutta la Provenza, parente della farinata genovese. Servite calde con sale e pepe.',
 'Fried chickpea flour croquettes or sticks, crispy outside and soft inside. Traditional street food of Marseille and all of Provence, a relative of Genoese farinata. Served hot with salt and pepper.',
 '["farina di ceci","acqua","olio d''oliva","sale","pepe nero"]'::jsonb,
 '["chickpea flour","water","olive oil","salt","black pepper"]'::jsonb,
 '[{"name":"Chez Etienne","maps_link":"https://www.google.com/maps/search/Chez+Etienne+Marseille"},{"name":"La Mercerie","maps_link":"https://www.google.com/maps/search/La+Mercerie+Marseille"}]'::jsonb),

-- ── Berlino ────────────────────────────────────────────────────────────────────
('berlino', 'Currywurst', 'Currywurst',
 'Wurstel di maiale fritto a fette e ricoperto con abbondante salsa di ketchup speziata al curry in polvere. Inventato nel 1949 da Herta Heuwer a Berlino Ovest. Il fast food simbolo della citta.',
 'Sliced fried pork sausage covered with curried ketchup sauce. Invented in 1949 by Herta Heuwer in West Berlin. The city''s symbolic fast food.',
 '["wurstel di maiale","ketchup","curry in polvere","paprika","cipolla fritta"]'::jsonb,
 '["pork sausage","ketchup","curry powder","paprika","fried onion"]'::jsonb,
 '[{"name":"Curry 36","maps_link":"https://www.google.com/maps/search/Curry+36+Berlin"},{"name":"Konnopkes Imbiss","maps_link":"https://www.google.com/maps/search/Konnopkes+Imbiss+Berlin"}]'::jsonb),

('berlino', 'Döner Kebab berlinese', 'Berlin Döner Kebab',
 'Il kebab reinventato a Berlino: carne mista arrostita allo spiedo in pane pitta con cavolo, pomodoro, cipolla, salsa allo yogurt e feta. Berlino, con la piu grande comunita turca d''Europa, ha reso il kebab un cibo globalizzato.',
 'The kebab reinvented in Berlin: mixed meat roasted on a spit in pitta bread with cabbage, tomato, onion, yogurt sauce and feta. Berlin, home to Europe''s largest Turkish community, made the kebab a global food.',
 '["carne mista (manzo/pollo)","pane pitta","cavolo","pomodoro","feta","salsa allo yogurt","cipolla"]'::jsonb,
 '["mixed meat (beef/chicken)","pitta bread","cabbage","tomato","feta","yogurt sauce","onion"]'::jsonb,
 '[{"name":"Mustafas Gemüse Kebap","maps_link":"https://www.google.com/maps/search/Mustafas+Gemuse+Kebap+Berlin"},{"name":"Imren Grill","maps_link":"https://www.google.com/maps/search/Imren+Grill+Berlin"}]'::jsonb),

('berlino', 'Berliner Pfannkuchen', 'Berliner Doughnut',
 'Il celebre "Berliner", bombolone di pasta lievitata fritto nell''olio, farcito con marmellata di rosa canina o cioccolato e cosparso di zucchero a velo. Altrove in Germania si chiama semplicemente "Pfannkuchen".',
 'The celebrated "Berliner", a fried leavened dough doughnut filled with rose hip jam or chocolate and dusted with icing sugar. Elsewhere in Germany simply called "Pfannkuchen".',
 '["farina","lievito","uova","burro","latte","marmellata di rosa canina","zucchero a velo"]'::jsonb,
 '["flour","yeast","eggs","butter","milk","rose hip jam","icing sugar"]'::jsonb,
 '[{"name":"Bäckerei Siebert","maps_link":"https://www.google.com/maps/search/Backerei+Siebert+Berlin"},{"name":"Zeit für Brot","maps_link":"https://www.google.com/maps/search/Zeit+fur+Brot+Berlin"}]'::jsonb),

('berlino', 'Eisbein', 'Eisbein',
 'Stinco di maiale lesso o arrosto con cotenna croccante e carne tenera. Servito con crauti, purea di piselli spezzati e senape tedesca piccante. Piatto iconico della cucina prussiana e berlinese.',
 'Boiled or roasted pork knuckle with crispy skin and tender meat. Served with sauerkraut, split pea purée and spicy German mustard. The iconic dish of Prussian and Berlin cuisine.',
 '["stinco di maiale","crauti","purea di piselli","cumino","alloro","senape tedesca"]'::jsonb,
 '["pork knuckle","sauerkraut","pea puree","caraway seeds","bay leaf","German mustard"]'::jsonb,
 '[{"name":"Zum Paddenwirt","maps_link":"https://www.google.com/maps/search/Zum+Paddenwirt+Berlin"},{"name":"Henne","maps_link":"https://www.google.com/maps/search/Henne+Berlin"}]'::jsonb),

('berlino', 'Buletten', 'Buletten',
 'Le polpette berlinesi di manzo e maiale, piu piatte e speziate rispetto al classico hamburger, aromatizzate con cipolla e noce moscata. Si mangiano calde con senape o fredde come street food.',
 'Berlin beef and pork patties, flatter and more seasoned than a classic burger, flavoured with onion and nutmeg. Eaten hot with mustard or cold as street food.',
 '["manzo macinato","maiale","cipolla","noce moscata","uova","pangrattato","senape"]'::jsonb,
 '["minced beef","pork","onion","nutmeg","eggs","breadcrumbs","mustard"]'::jsonb,
 '[{"name":"Henne","maps_link":"https://www.google.com/maps/search/Henne+Berlin"},{"name":"Gaststätte Leydicke","maps_link":"https://www.google.com/maps/search/Gaststaette+Leydicke+Berlin"}]'::jsonb),

('berlino', 'Kasseler', 'Kasseler',
 'Costolette o lonza di maiale affumicate con legno di faggio e leggermente salate. Servite con crauti e purea di patate. Una specialita berlinese che nonostante il nome non ha nulla a che fare con la citta di Kassel.',
 'Pork chops or loin smoked over beech wood and lightly cured. Served with sauerkraut and mashed potatoes. A Berlin speciality that, despite its name, has nothing to do with the city of Kassel.',
 '["lonza di maiale","fumo di faggio","salgemma","crauti","patate","burro"]'::jsonb,
 '["pork loin","beech wood smoke","rock salt","sauerkraut","potatoes","butter"]'::jsonb,
 '[{"name":"Zur letzten Instanz","maps_link":"https://www.google.com/maps/search/Zur+letzten+Instanz+Berlin"},{"name":"Gaststätte Leydicke","maps_link":"https://www.google.com/maps/search/Gaststaette+Leydicke+Berlin"}]'::jsonb),

('berlino', 'Königsberger Klopse', 'Königsberger Klopse',
 'Polpette di vitello e acciughe in una salsa bianca cremosa e acidula con capperi e succo di limone. Ricetta di origine prussiana orientale. Piatto storico berlinese dal sapore delicato e insolito.',
 'Veal and anchovy meatballs in a creamy tangy white sauce with capers and lemon juice. A recipe from Eastern Prussia. A historic Berlin dish with a delicate and unusual flavour.',
 '["vitello macinato","acciughe","capperi","panna","limone","cipolla","uova"]'::jsonb,
 '["minced veal","anchovies","capers","cream","lemon","onion","eggs"]'::jsonb,
 '[{"name":"Marjellchen","maps_link":"https://www.google.com/maps/search/Marjellchen+Berlin"},{"name":"Zur letzten Instanz","maps_link":"https://www.google.com/maps/search/Zur+letzten+Instanz+Berlin"}]'::jsonb),

('berlino', 'Brezeln', 'Brezeln (Pretzels)',
 'I bretzel tedeschi, ciambelle a forma di nodo ricoperte di sale grosso, dalla crosta lucida e bruna grazie al bagno in soluzione di soda. Consumati come snack, con la birra o a colazione.',
 'German pretzels, knot-shaped dough rolls covered in coarse salt with a shiny brown crust from a lye bath. Eaten as a snack, with beer or at breakfast.',
 '["farina","lievito","soluzione di soda","sale grosso","burro","acqua"]'::jsonb,
 '["flour","yeast","lye solution","coarse salt","butter","water"]'::jsonb,
 '[{"name":"Zeit für Brot","maps_link":"https://www.google.com/maps/search/Zeit+fur+Brot+Berlin"},{"name":"Bäckerei Siebert","maps_link":"https://www.google.com/maps/search/Backerei+Siebert+Berlin"}]'::jsonb),

-- ── Monaco di Baviera ────────────────────────────────────────────────────────
('monaco_di_baviera', 'Weißwurst', 'Weißwurst',
 'Salsiccia bianca bavarese di vitello e lardo, aromatizzata con maggiorana e prezzemolo. Tradizionalmente mangiata solo la mattina, prima che suonino le campane di mezzogiorno, con senape dolce e bretzel.',
 $$Bavarian white veal and lard sausage, flavoured with marjoram and parsley. Traditionally eaten only in the morning, before the midday bells ring, with sweet mustard and a pretzel.$$,
 '["vitello","lardo","cipolla","prezzemolo","maggiorana","scorza di limone","ghiaccio"]'::jsonb,
 '["veal","lard","onion","parsley","marjoram","lemon zest","ice"]'::jsonb,
 '[{"name":"Hofbräuhaus","maps_link":"https://www.google.com/maps/search/Hofbrauhaus+Munich"},{"name":"Schneider Bräuhaus","maps_link":"https://www.google.com/maps/search/Schneider+Brauhaus+Munich"}]'::jsonb),

('monaco_di_baviera', 'Schweinshaxe', 'Schweinshaxe',
 'Stinco di maiale arrostito lentamente fino a ottenere una cotenna croccante e dorata e una carne tenera e succosa. Servito con crauti e Knödel (gnocchi di pane). Piatto iconico delle birrerie bavaresi.',
 'Pork knuckle slowly roasted until the skin is golden and crispy and the meat tender and juicy. Served with sauerkraut and Knödel (bread dumplings). The iconic dish of Bavarian beer halls.',
 '["stinco di maiale","cumino","aglio","sale grosso","birra scura","crauti"]'::jsonb,
 '["pork knuckle","caraway seeds","garlic","coarse salt","dark beer","sauerkraut"]'::jsonb,
 '[{"name":"Haxnbauer","maps_link":"https://www.google.com/maps/search/Haxnbauer+Munich"},{"name":"Augustiner Bräustuben","maps_link":"https://www.google.com/maps/search/Augustiner+Braustuben+Munich"}]'::jsonb),

('monaco_di_baviera', 'Obatzda', 'Obatzda',
 'Crema bavarese di formaggi misti: camembert stagionato mescolato con burro, cipolla, paprika e cumino. Il formaggio da birreria per eccellenza, servito con pretzel nei Biergarten sotto i castagni.',
 'Bavarian mixed cheese cream: aged camembert blended with butter, onion, paprika and caraway seeds. The ultimate beer garden cheese, served with pretzels at outdoor Biergarten under chestnut trees.',
 '["camembert stagionato","burro","cipolla","paprika","cumino","birra"]'::jsonb,
 '["aged camembert","butter","onion","paprika","caraway seeds","beer"]'::jsonb,
 '[{"name":"Viktualienmarkt Biergarten","maps_link":"https://www.google.com/maps/search/Viktualienmarkt+Biergarten+Munich"},{"name":"Augustiner Keller","maps_link":"https://www.google.com/maps/search/Augustiner+Keller+Munich"}]'::jsonb),

('monaco_di_baviera', 'Leberknödelsuppe', 'Liver Dumpling Soup',
 'Brodo di manzo limpido e dorato con uno o due grandi gnocchi di fegato (Leberknödel), aromatizzati con maggiorana, timo e aglio. Antipasto tradizionale di ogni menu bavarese autentico.',
 'Clear golden beef broth with one or two large liver dumplings (Leberknödel), flavoured with marjoram, thyme and garlic. The traditional starter on every authentic Bavarian menu.',
 '["fegato di manzo","pangrattato","uova","cipolla","maggiorana","timo","brodo di manzo"]'::jsonb,
 '["beef liver","breadcrumbs","eggs","onion","marjoram","thyme","beef broth"]'::jsonb,
 '[{"name":"Augustiner Bräustuben","maps_link":"https://www.google.com/maps/search/Augustiner+Braustuben+Munich"},{"name":"Zum Franziskaner","maps_link":"https://www.google.com/maps/search/Zum+Franziskaner+Munich"}]'::jsonb),

('monaco_di_baviera', 'Dampfnudeln', 'Dampfnudeln',
 'Soffici gnocchi dolci al vapore, cotti in un tegame coperto con latte e burro fino a formare una crosta dorata sul fondo. Serviti con salsa alla vaniglia, composta di prugne o zuppa di latte bavarese.',
 'Soft sweet dumplings steamed in a covered pan with milk and butter until a golden crust forms on the bottom. Served with vanilla sauce, plum compote or Bavarian milk soup.',
 '["farina","lievito","latte","burro","uova","zucchero","vaniglia","sale"]'::jsonb,
 '["flour","yeast","milk","butter","eggs","sugar","vanilla","salt"]'::jsonb,
 '[{"name":"Café Rischart","maps_link":"https://www.google.com/maps/search/Cafe+Rischart+Munich"},{"name":"Hofbräuhaus","maps_link":"https://www.google.com/maps/search/Hofbrauhaus+Munich"}]'::jsonb),

('monaco_di_baviera', 'Brathendl', 'Brathendl (Roast Chicken)',
 'Pollo intero arrostito allo spiedo con pelle croccante e carne succulenta, insaporito con erbe bavaresi. E uno dei piatti piu ordinati all''Oktoberfest e nelle Bierhalle monacensi. Servito con insalata di cavolo.',
 $$Whole chicken roasted on a spit with crispy skin and juicy meat, seasoned with Bavarian herbs. One of the most ordered dishes at Oktoberfest and Munich's beer halls. Served with coleslaw.$$,
 '["pollo intero","aglio","paprika","maggiorana","timo","sale","burro"]'::jsonb,
 '["whole chicken","garlic","paprika","marjoram","thyme","salt","butter"]'::jsonb,
 '[{"name":"Hofbräuhaus","maps_link":"https://www.google.com/maps/search/Hofbrauhaus+Munich"},{"name":"Hacker-Pschorr Bräuhaus","maps_link":"https://www.google.com/maps/search/Hacker-Pschorr+Munich"}]'::jsonb),

('monaco_di_baviera', 'Steckerlfisch', 'Steckerlfisch',
 'Pesce intero (spesso sgombro o aringhe) infilato su uno stecco di legno e arrostito lentamente sulla brace. Street food tradizionale dei mercati e dell''Oktoberfest. Croccante fuori, umido e saporito dentro.',
 'Whole fish (often mackerel or herring) skewered on a wooden stick and slowly grilled over charcoal. Traditional street food at markets and Oktoberfest. Crispy outside, moist and flavourful inside.',
 '["sgombro o aringa","aglio","erbe aromatiche","sale grosso","olio","spezie"]'::jsonb,
 '["mackerel or herring","garlic","herbs","coarse salt","oil","spices"]'::jsonb,
 '[{"name":"Viktualienmarkt","maps_link":"https://www.google.com/maps/search/Viktualienmarkt+Munich"},{"name":"Oktoberfest Fischbraterei","maps_link":"https://www.google.com/maps/search/Oktoberfest+Munich"}]'::jsonb),

('monaco_di_baviera', 'Brez''n con Obatzda', 'Pretzel with Obatzda',
 $$Il bretzel bavarese (Brez'n) e piu grande e morbido di quello degli altri Lander. Crosta lucida dal bagno in lisciva e cosparso di sale grosso. Abbinato all'Obatzda nei Biergarten, e l'aperitivo bavarese per eccellenza.$$,
 $$The Bavarian pretzel (Brez'n) is larger and softer than those from other German states. Shiny crust from a lye bath and dusted with coarse salt. Paired with Obatzda in beer gardens, it's the ultimate Bavarian appetiser.$$,
 '["farina","lievito","soluzione di lisciva","sale grosso","burro","bicarbonato"]'::jsonb,
 '["flour","yeast","lye solution","coarse salt","butter","baking soda"]'::jsonb,
 '[{"name":"Rischart Marienplatz","maps_link":"https://www.google.com/maps/search/Rischart+Marienplatz+Munich"},{"name":"Viktualienmarkt Biergarten","maps_link":"https://www.google.com/maps/search/Viktualienmarkt+Munich"}]'::jsonb),

-- ── Francoforte ────────────────────────────────────────────────────────────────
('francoforte', 'Grüne Soße', 'Green Sauce (Grüne Soße)',
 'Salsa fredda a base di yogurt, panna acida e sette erbe fresche obbligatorie (erba cipollina, prezzemolo, crescione, acetosa, borragine, pimpinella, dragoncello). Servita con uova sode e patate lesse. Il piatto piu amato dai francofortesi.',
 'Cold sauce based on yogurt, sour cream and seven mandatory fresh herbs (chives, parsley, watercress, sorrel, borage, burnet, tarragon). Served with hard-boiled eggs and boiled potatoes. The most beloved Frankfurt dish.',
 '["erba cipollina","prezzemolo","crescione","acetosa","borragine","pimpinella","dragoncello","yogurt","panna acida","uova"]'::jsonb,
 '["chives","parsley","watercress","sorrel","borage","salad burnet","tarragon","yogurt","sour cream","eggs"]'::jsonb,
 '[{"name":"Lorsbacher Thal","maps_link":"https://www.google.com/maps/search/Lorsbacher+Thal+Frankfurt"},{"name":"Wagner","maps_link":"https://www.google.com/maps/search/Restaurant+Wagner+Frankfurt"}]'::jsonb),

('francoforte', 'Handkäse mit Musik', 'Handkäse mit Musik',
 'Formaggio acido di latte vaccino dalla forma rotonda, marinato con cipolla cruda, aceto, olio e cumino. Il "Musik" e il suono della digestione, battuta tipica dei francofortesi. Si mangia rigorosamente nelle Apfelwein-Lokale.',
 'Round sour milk cheese marinated with raw onion, vinegar, oil and caraway seeds. The "Musik" is the sound of digestion — a classic Frankfurt joke. Eaten strictly in Apfelwein taverns.',
 '["formaggio acido","cipolla cruda","aceto","olio","cumino","erba cipollina"]'::jsonb,
 '["sour milk cheese","raw onion","vinegar","oil","caraway seeds","chives"]'::jsonb,
 '[{"name":"Zum Gemalten Haus","maps_link":"https://www.google.com/maps/search/Zum+Gemalten+Haus+Frankfurt"},{"name":"Dauth-Schneider","maps_link":"https://www.google.com/maps/search/Dauth-Schneider+Frankfurt"}]'::jsonb),

('francoforte', 'Apfelwein (Ebbelwoi)', 'Apfelwein (Ebbelwoi)',
 'Il sidro di mele aspro e frizzante di Francoforte, servito nel tradizionale boccale di ceramica grigia (Bembel) e bevuto con il Geripptes (bicchiere a coste). La bevanda identitaria della citta, prodotta localmente dal Medioevo.',
 'Frankfurt''s tart and sparkling apple cider, served in the traditional grey ceramic jug (Bembel) and drunk from the ribbed glass (Geripptes). The city''s identity drink, produced locally since the Middle Ages.',
 '["mele da sidro","lievito","acqua"]'::jsonb,
 '["cider apples","yeast","water"]'::jsonb,
 '[{"name":"Zum Gemalten Haus","maps_link":"https://www.google.com/maps/search/Zum+Gemalten+Haus+Frankfurt"},{"name":"Kanonensteppi","maps_link":"https://www.google.com/maps/search/Kanonensteppi+Frankfurt"}]'::jsonb),

('francoforte', 'Frankfurter Würstchen', 'Frankfurter Würstchen',
 'Le originali salsicce di Francoforte da cui deriva il termine "frankfurter" nel mondo. Sottili, lunghe, leggermente affumicate e dal budello naturale sottilissimo. Protette da IGP europea, servite rigorosamente a coppie.',
 'The original Frankfurt sausages from which the worldwide term "frankfurter" derives. Thin, long, lightly smoked with a very fine natural casing. Protected by European IGP, served strictly in pairs.',
 '["carne di maiale","budello naturale di pecora","fumo di faggio","sale","spezie"]'::jsonb,
 '["pork","natural sheep casing","beech smoke","salt","spices"]'::jsonb,
 '[{"name":"Frankfurt Hauptbahnhof kiosks","maps_link":"https://www.google.com/maps/search/Frankfurt+Hauptbahnhof"},{"name":"Kleinmarkthalle","maps_link":"https://www.google.com/maps/search/Kleinmarkthalle+Frankfurt"}]'::jsonb),

('francoforte', 'Rippchen mit Kraut', 'Rippchen mit Kraut',
 'Costolette di maiale marinate e affumicate (Kasseler), cotte lentamente con crauti e spezie. Piatto robusto e sostanzioso delle tradizionali taverne di Sachsenhausen. Accompagnato con purea di patate e senape.',
 'Marinated and smoked pork ribs (Kasseler), slowly cooked with sauerkraut and spices. A hearty dish from the traditional taverns of Sachsenhausen. Served with mashed potatoes and mustard.',
 '["costolette di maiale affumicate","crauti","cumino","alloro","cipolla","senape"]'::jsonb,
 '["smoked pork ribs","sauerkraut","caraway seeds","bay leaf","onion","mustard"]'::jsonb,
 '[{"name":"Wagner","maps_link":"https://www.google.com/maps/search/Restaurant+Wagner+Frankfurt"},{"name":"Lorsbacher Thal","maps_link":"https://www.google.com/maps/search/Lorsbacher+Thal+Frankfurt"}]'::jsonb),

('francoforte', 'Bethmännchen', 'Bethmännchen',
 'Dolcetti natalizi di marzapane con tre mezze mandorle premute sui lati, dal colore dorato e la superficie lucida. Creati nel 1838 dal cuoco di casa Bethmann. Oggi sono il dolce natalizio simbolo di Francoforte.',
 'Christmas marzipan sweets with three half almonds pressed onto the sides, golden in colour with a glossy surface. Created in 1838 by the Bethmann family cook. Today the symbolic Christmas sweet of Frankfurt.',
 '["marzapane","mandorle intere","albume d''uovo","zucchero","acqua di rose"]'::jsonb,
 '["marzipan","whole almonds","egg white","sugar","rose water"]'::jsonb,
 '[{"name":"Café Metropol","maps_link":"https://www.google.com/maps/search/Cafe+Metropol+Frankfurt"},{"name":"Kleinmarkthalle","maps_link":"https://www.google.com/maps/search/Kleinmarkthalle+Frankfurt"}]'::jsonb),

('francoforte', 'Frankfurter Kranz', 'Frankfurt Crown Cake',
 'Torta rotonda a forma di corona con tre strati di pasta biscuit, crema al burro pralinata, gelatina di albicocche e granella di nocciole caramellate. Il dolce da pasticceria simbolo di Francoforte dal 1735.',
 'Round crown-shaped cake with three layers of sponge, praline buttercream, apricot jam and caramelised hazelnut crumble. The symbolic Frankfurt pastry shop cake since 1735.',
 '["pasta biscuit","burro","pralina di nocciole","marmellata di albicocche","granella di nocciole","uova","farina"]'::jsonb,
 '["sponge cake","butter","hazelnut praline","apricot jam","hazelnut crumble","eggs","flour"]'::jsonb,
 '[{"name":"Café Metropol","maps_link":"https://www.google.com/maps/search/Cafe+Metropol+Frankfurt"},{"name":"Café Laumer","maps_link":"https://www.google.com/maps/search/Cafe+Laumer+Frankfurt"}]'::jsonb),

('francoforte', 'Spundekäs', 'Spundekäs',
 'Crema soffice di formaggio fresco (Frischkäse) mescolato con paprika dolce o piccante e condito con olio e cipolla. Antipasto tipico della Renania e dell''Assia, servito con pretzel come aperitivo nelle osterie.',
 'Soft cream of fresh cheese (Frischkäse) mixed with sweet or hot paprika and seasoned with oil and onion. A typical appetiser from the Rhine and Hesse region, served with pretzels in taverns.',
 '["formaggio fresco","paprika dolce","cipolla","olio","sale","erba cipollina"]'::jsonb,
 '["fresh cheese","sweet paprika","onion","oil","salt","chives"]'::jsonb,
 '[{"name":"Dauth-Schneider","maps_link":"https://www.google.com/maps/search/Dauth-Schneider+Frankfurt"},{"name":"Zum Gemalten Haus","maps_link":"https://www.google.com/maps/search/Zum+Gemalten+Haus+Frankfurt"}]'::jsonb),

-- ── Atene ─────────────────────────────────────────────────────────────────────
('atene', 'Moussaka', 'Moussaka',
 'Sformato a strati di melanzane fritte, carne macinata di agnello con pomodoro e spezie, e besciamella cremosa gratinata in forno. Il piatto nazionale greco per eccellenza, ricco e confortante.',
 'Baked dish layered with fried aubergine, minced lamb with tomato and spices, and creamy béchamel sauce browned in the oven. The quintessential Greek national dish, rich and comforting.',
 '["melanzane","agnello macinato","cipolla","pomodoro","cannella","chiodi di garofano","latte","farina","uova","parmigiano"]'::jsonb,
 '["aubergine","minced lamb","onion","tomato","cinnamon","cloves","milk","flour","eggs","parmesan"]'::jsonb,
 '[{"name":"Taverna Saita","maps_link":"https://www.google.com/maps/search/Taverna+Saita+Athens"},{"name":"Oinomageireio Rozalia","maps_link":"https://www.google.com/maps/search/Rozalia+Athens"}]'::jsonb),

('atene', 'Souvlaki', 'Souvlaki',
 'Spiedini di carne marinata (maiale o pollo) alla griglia su brace, serviti su pita con tzatziki, pomodoro e cipolla. Lo street food piu popolare della Grecia. A pochi centesimi in meno di un euro, e il pranzo dei locali.',
 'Grilled skewers of marinated meat (pork or chicken) over charcoal, served in pitta with tzatziki, tomato and onion. The most popular street food in Greece. At just a few euros, it is the locals'' everyday lunch.',
 '["maiale o pollo","limone","origano","olio d''oliva","aglio","pita","tzatziki","pomodoro"]'::jsonb,
 '["pork or chicken","lemon","oregano","olive oil","garlic","pitta","tzatziki","tomato"]'::jsonb,
 '[{"name":"Kostas","maps_link":"https://www.google.com/maps/search/Kostas+souvlaki+Athens"},{"name":"O Thanasis","maps_link":"https://www.google.com/maps/search/O+Thanasis+Athens"}]'::jsonb),

('atene', 'Spanakopita', 'Spanakopita',
 'Torta salata croccante di pasta phyllo a strati, farcita con spinaci freschi, feta, uova e erbe aromatiche. Si trova in ogni fornaio e taverna della Grecia. Ottima calda o a temperatura ambiente.',
 'Crispy layered phyllo pastry pie filled with fresh spinach, feta, eggs and aromatic herbs. Found in every Greek bakery and taverna. Excellent hot or at room temperature.',
 '["pasta phyllo","spinaci","feta","uova","erba cipollina","aneto","olio d''oliva","burro"]'::jsonb,
 '["phyllo pastry","spinach","feta","eggs","spring onion","dill","olive oil","butter"]'::jsonb,
 '[{"name":"Ariston","maps_link":"https://www.google.com/maps/search/Ariston+bakery+Athens"},{"name":"Krinos","maps_link":"https://www.google.com/maps/search/Krinos+Athens"}]'::jsonb),

('atene', 'Tzatziki', 'Tzatziki',
 'Salsa densa e fresca di yogurt greco intero, cetrioli grattugiati, aglio, olio d''oliva e aneto fresco. Accompagna praticamente ogni piatto della cucina greca, dai souvlaki alle verdure grigliate.',
 'Thick and fresh Greek yogurt dip with grated cucumber, garlic, olive oil and fresh dill. Accompanies virtually every dish in Greek cuisine, from souvlaki to grilled vegetables.',
 '["yogurt greco intero","cetrioli","aglio","olio d''oliva extra vergine","aneto","sale","aceto bianco"]'::jsonb,
 '["full-fat Greek yogurt","cucumber","garlic","extra virgin olive oil","dill","salt","white vinegar"]'::jsonb,
 '[{"name":"Diporto","maps_link":"https://www.google.com/maps/search/Diporto+Athens"},{"name":"Taverna tou Psara","maps_link":"https://www.google.com/maps/search/Taverna+tou+Psara+Athens"}]'::jsonb),

('atene', 'Taramasalata', 'Taramasalata',
 'Crema di colore rosa pallido a base di uova di carpa o merluzzo salate (tarama), pane raffermo, olio d''oliva, cipolla e succo di limone. Antipasto tradizionale greco servito con pane pita.',
 'Pale pink cream based on salted carp or cod roe (tarama), stale bread, olive oil, onion and lemon juice. Traditional Greek appetiser served with pitta bread.',
 '["uova di carpa o merluzzo salate","pane raffermo","olio d''oliva","cipolla","limone"]'::jsonb,
 '["salted carp or cod roe","stale bread","olive oil","onion","lemon"]'::jsonb,
 '[{"name":"Diporto","maps_link":"https://www.google.com/maps/search/Diporto+Athens"},{"name":"Karamanlidika tou Fani","maps_link":"https://www.google.com/maps/search/Karamanlidika+tou+Fani+Athens"}]'::jsonb),

('atene', 'Pastitsio', 'Pastitsio',
 'Il corrispettivo greco della lasagna: pasta tubolare lunga cotta in forno con ragù di agnello e pomodoro tra due strati di besciamella. Piatto familiare e festivo, piu consistente della moussaka.',
 $$Greece's equivalent of lasagne: long tubular pasta oven-baked with lamb and tomato ragù between two layers of béchamel sauce. A family and celebratory dish, more substantial than moussaka.$$,
 '["pasta tubolare (bucatini)","agnello macinato","pomodoro","cipolla","cannella","latte","farina","uova","formaggio"]'::jsonb,
 '["tubular pasta (bucatini)","minced lamb","tomato","onion","cinnamon","milk","flour","eggs","cheese"]'::jsonb,
 '[{"name":"Taverna Saita","maps_link":"https://www.google.com/maps/search/Taverna+Saita+Athens"},{"name":"Oinomageireio Rozalia","maps_link":"https://www.google.com/maps/search/Rozalia+Athens"}]'::jsonb),

('atene', 'Loukoumades', 'Loukoumades',
 'Frittelle sferiche di pasta lievitata fritta, leggere e gonfie, servite calde con miele d''acacia, cannella e sesamo. Il dolce da strada piu antico della Grecia, offerto agli atleti olimpici nell''antica Grecia.',
 $$Light and puffed spherical fried leavened dough balls, served hot with acacia honey, cinnamon and sesame. Greece's oldest street sweet, once offered to Olympic athletes in ancient Greece.$$,
 '["farina","lievito","acqua","miele","cannella","sesamo","olio di semi"]'::jsonb,
 '["flour","yeast","water","honey","cinnamon","sesame","vegetable oil"]'::jsonb,
 '[{"name":"Loukoumades","maps_link":"https://www.google.com/maps/search/Loukoumades+Monastiraki+Athens"},{"name":"Krinos","maps_link":"https://www.google.com/maps/search/Krinos+Athens"}]'::jsonb),

('atene', 'Galaktoboureko', 'Galaktoboureko',
 'Sfoglia croccante di pasta phyllo ripiena di crema pasticcera di semolino e imbevuta di sciroppo aromatizzato con scorza di limone e cannella. Il dessert da forno piu amato della tradizione greca.',
 'Crispy phyllo pastry filled with semolina custard cream and soaked in lemon-zest and cinnamon-flavoured syrup. The most beloved baked dessert in the Greek tradition.',
 '["pasta phyllo","semolino","latte","uova","zucchero","burro","scorza di limone","cannella"]'::jsonb,
 '["phyllo pastry","semolina","milk","eggs","sugar","butter","lemon zest","cinnamon"]'::jsonb,
 '[{"name":"Ariston","maps_link":"https://www.google.com/maps/search/Ariston+bakery+Athens"},{"name":"Stoa tou Vivliou","maps_link":"https://www.google.com/maps/search/Stoa+Vivliou+Athens"}]'::jsonb),

-- ── Dublino ────────────────────────────────────────────────────────────────────
('dublino', 'Irish Stew', 'Irish Stew',
 'Spezzatino di agnello (o montone) con patate, carote e cipolle in brodo semplice. Il piatto simbolo della cucina irlandese, nato tra i contadini dell''Ottocento. Semplice, sostanzioso e confortante nelle serate piovose.',
 'Lamb (or mutton) stew with potatoes, carrots and onions in a simple broth. The symbolic dish of Irish cuisine, born among 19th-century farmers. Simple, hearty and comforting on rainy evenings.',
 '["agnello o montone","patate","carote","cipolle","brodo","timo","prezzemolo","alloro"]'::jsonb,
 '["lamb or mutton","potatoes","carrots","onions","broth","thyme","parsley","bay leaf"]'::jsonb,
 '[{"name":"The Boxty House","maps_link":"https://www.google.com/maps/search/The+Boxty+House+Dublin"},{"name":"Gallagher''s Boxty House","maps_link":"https://www.google.com/maps/search/Gallaghers+Boxty+House+Dublin"}]'::jsonb),

('dublino', 'Full Irish Breakfast', 'Full Irish Breakfast',
 'La colazione completa irlandese: uova fritte o strapazzate, salsicce di maiale, bacon rashers, black pudding (sanguinaccio), white pudding, pomodori grigliati, fagioli e toast. Il carburante per una giornata intera.',
 'The full Irish breakfast: fried or scrambled eggs, pork sausages, bacon rashers, black pudding (blood sausage), white pudding, grilled tomatoes, baked beans and toast. Fuel for an entire day.',
 '["uova","salsicce di maiale","bacon rashers","black pudding","white pudding","fagioli","pomodori","toast"]'::jsonb,
 '["eggs","pork sausages","bacon rashers","black pudding","white pudding","baked beans","tomatoes","toast"]'::jsonb,
 '[{"name":"Bewley''s Café","maps_link":"https://www.google.com/maps/search/Bewleys+Cafe+Dublin"},{"name":"Burdock''s","maps_link":"https://www.google.com/maps/search/Burdocks+Dublin"}]'::jsonb),

('dublino', 'Dublin Coddle', 'Dublin Coddle',
 'Zuppa robusta tipica di Dublino: strati di salsicce di maiale, rashers di bacon, patate a fette e cipolle, cotti lentamente in brodo di maiale. Piatto povero nato tra i lavoratori dublinesi, amato da Jonathan Swift.',
 $$Hearty Dublin stew: layers of pork sausages, bacon rashers, sliced potatoes and onions, slowly cooked in pork broth. A poor dish born among Dublin's working class, loved by Jonathan Swift.$$,
 '["salsicce di maiale","rashers di bacon","patate","cipolle","brodo di maiale","prezzemolo","pepe"]'::jsonb,
 '["pork sausages","bacon rashers","potatoes","onions","pork broth","parsley","pepper"]'::jsonb,
 '[{"name":"The Old Storehouse","maps_link":"https://www.google.com/maps/search/The+Old+Storehouse+Dublin"},{"name":"Johnnie Fox''s","maps_link":"https://www.google.com/maps/search/Johnnie+Foxs+Dublin"}]'::jsonb),

('dublino', 'Colcannon', 'Colcannon',
 'Purea di patate soffice con cavolo riccio (o verza) tritato, burro abbondante e cipollotti. Piatto tradizionale dell''Halloween irlandese, dentro cui si nascondono monete portafortuna. Contorno immancabile nei pub.',
 'Soft mashed potato with chopped kale (or cabbage), generous butter and spring onions. Traditional Irish Halloween dish, inside which lucky coins are hidden. An unmissable side dish in pubs.',
 '["patate","cavolo riccio o verza","burro","cipollotti","latte","sale","pepe"]'::jsonb,
 '["potatoes","kale or cabbage","butter","spring onions","milk","salt","pepper"]'::jsonb,
 '[{"name":"The Boxty House","maps_link":"https://www.google.com/maps/search/The+Boxty+House+Dublin"},{"name":"The Old Storehouse","maps_link":"https://www.google.com/maps/search/The+Old+Storehouse+Dublin"}]'::jsonb),

('dublino', 'Boxty', 'Boxty',
 'Pancake tradizionale irlandese di patate grattugiate crude mischiate con purè di patate, farina e latticello. Fritto in padella fino a doratura. Tipico del nord dell''Irlanda ma popolare a Dublino come piatto simbolo.',
 'Traditional Irish potato pancake made with grated raw potato mixed with mashed potato, flour and buttermilk. Pan-fried until golden. Typical of northern Ireland but popular in Dublin as a symbolic dish.',
 '["patate grattugiate crude","puree di patate","farina","latticello","uova","sale","burro"]'::jsonb,
 '["raw grated potato","mashed potato","flour","buttermilk","eggs","salt","butter"]'::jsonb,
 '[{"name":"The Boxty House","maps_link":"https://www.google.com/maps/search/The+Boxty+House+Dublin"},{"name":"Gallagher''s Boxty House","maps_link":"https://www.google.com/maps/search/Gallaghers+Boxty+House+Dublin"}]'::jsonb),

('dublino', 'Soda Bread', 'Irish Soda Bread',
 'Pane tradizionale irlandese lievitato con bicarbonato di sodio e latticello, senza lievito di birra. Dal sapore leggermente acidulo e dalla crosta rustica. Base di quasi ogni colazione irlandese, ottimo con burro salato.',
 'Traditional Irish bread leavened with baking soda and buttermilk, without yeast. Slightly tangy with a rustic crust. The base of almost every Irish breakfast, excellent with salted butter.',
 '["farina integrale","bicarbonato di sodio","latticello","sale","fiocchi d''avena"]'::jsonb,
 '["wholemeal flour","baking soda","buttermilk","salt","oat flakes"]'::jsonb,
 '[{"name":"Bewley''s Café","maps_link":"https://www.google.com/maps/search/Bewleys+Cafe+Dublin"},{"name":"Brother Hubbard","maps_link":"https://www.google.com/maps/search/Brother+Hubbard+Dublin"}]'::jsonb),

('dublino', 'Irish Smoked Salmon', 'Irish Smoked Salmon',
 'Il salmone atlantico selvaggio irlandese affumicato a freddo su legno di quercia o faggio. Delicato, dalla consistenza setosa e dal sapore intenso. Servito sulla soda bread con crema di formaggio, capperi e cipollotti.',
 'Irish wild Atlantic salmon cold-smoked over oak or beech wood. Delicate, with a silky texture and intense flavour. Served on soda bread with cream cheese, capers and spring onions.',
 '["salmone atlantico selvaggio","fumo di quercia o faggio","sale","crema di formaggio","capperi","cipollotti"]'::jsonb,
 '["wild Atlantic salmon","oak or beech wood smoke","salt","cream cheese","capers","spring onions"]'::jsonb,
 '[{"name":"Catch of the Day","maps_link":"https://www.google.com/maps/search/Catch+of+the+Day+Dublin"},{"name":"Brasserie Sixty6","maps_link":"https://www.google.com/maps/search/Brasserie+Sixty6+Dublin"}]'::jsonb),

('dublino', 'Oysters & Guinness', 'Oysters & Guinness',
 'Le ostriche selvagge di Galway Bay abbinate a una pinta di Guinness fredda. L''abbinamento iconico della tradizione culinaria irlandese, celebrato ogni anno al Galway International Oyster Festival (settembre).',
 'Wild Galway Bay oysters paired with a cold pint of Guinness. The iconic pairing of Irish culinary tradition, celebrated every year at the Galway International Oyster Festival (September).',
 '["ostriche di Galway","Guinness Stout","limone","tabasco","pane integrale"]'::jsonb,
 '["Galway oysters","Guinness Stout","lemon","tabasco","brown bread"]'::jsonb,
 '[{"name":"The Shelbourne Bar","maps_link":"https://www.google.com/maps/search/Shelbourne+Bar+Dublin"},{"name":"Kehoe''s Pub","maps_link":"https://www.google.com/maps/search/Kehoes+Pub+Dublin"}]'::jsonb),

-- ── Venezia ────────────────────────────────────────────────────────────────────
('venezia', 'Sarde in saor', 'Sarde in saor',
 'Sardine fritte marinate con cipolla bianca caramellata nell''aceto bianco, uvetta e pinoli tostati. Piatto veneziano medievale con influenze arabe e bizantine, nato come metodo di conservazione del pesce.',
 'Fried sardines marinated with white onion caramelised in white vinegar, raisins and toasted pine nuts. A medieval Venetian dish with Arab and Byzantine influences, born as a fish preservation method.',
 '["sardine","cipolla bianca","aceto bianco","uvetta","pinoli","farina","olio","alloro"]'::jsonb,
 '["sardines","white onion","white vinegar","raisins","pine nuts","flour","oil","bay leaf"]'::jsonb,
 '[{"name":"Osteria alle Testiere","maps_link":"https://www.google.com/maps/search/Osteria+alle+Testiere+Venice"},{"name":"Antiche Carampane","maps_link":"https://www.google.com/maps/search/Antiche+Carampane+Venice"}]'::jsonb),

('venezia', 'Baccalà mantecato', 'Baccalà mantecato',
 'Stoccafisso (merluzzo norvegese essiccato) lessato e montato a mano con olio d''oliva fino a diventare una crema soffice e spumosa. Servito su crostini di polenta bianca abbrustolita. Il cicchetto piu celebre di Venezia.',
 'Dried Norwegian stockfish (cod) boiled and hand-whipped with olive oil until it becomes a soft, creamy mousse. Served on toasted white polenta crostini. The most celebrated Venetian cicchetto.',
 '["stoccafisso secco","olio d''oliva extra vergine","aglio","prezzemolo","polenta bianca","latte"]'::jsonb,
 '["dried stockfish","extra virgin olive oil","garlic","parsley","white polenta","milk"]'::jsonb,
 '[{"name":"All''Arco","maps_link":"https://www.google.com/maps/search/All+Arco+Venice"},{"name":"Cantina Do Mori","maps_link":"https://www.google.com/maps/search/Cantina+Do+Mori+Venice"}]'::jsonb),

('venezia', 'Risi e bisi', 'Risi e bisi',
 'Minestra densa e cremosa di riso e piselli freschi in brodo di pollo con pancetta e parmigiano. Ne troppo brodosa ne troppo asciutta ("all''onda"). Era il piatto servito al Doge per la festa di San Marco (25 aprile).',
 $$Dense and creamy soup of rice and fresh peas in chicken broth with pancetta and parmesan. Neither too soupy nor too dry ("all'onda"). It was the dish served to the Doge for the Feast of St Mark (25 April).$$,
 '["riso Vialone Nano","piselli freschi","pancetta","brodo di pollo","parmigiano","cipolla","burro","prezzemolo"]'::jsonb,
 '["Vialone Nano rice","fresh peas","pancetta","chicken broth","parmesan","onion","butter","parsley"]'::jsonb,
 '[{"name":"Trattoria da Romano","maps_link":"https://www.google.com/maps/search/Trattoria+da+Romano+Venice"},{"name":"Osteria alle Testiere","maps_link":"https://www.google.com/maps/search/Osteria+alle+Testiere+Venice"}]'::jsonb),

('venezia', 'Fegato alla veneziana', 'Fegato alla veneziana',
 'Fegato di vitello tagliato a fettine sottilissime, cotto velocemente in padella con cipolla bianca dolce e un filo di olio d''oliva. Servito con polenta bianca morbida. Uno dei piatti piu celebri della cucina veneta.',
 'Very thinly sliced veal liver, quickly pan-fried with sweet white onion and a drizzle of olive oil. Served with soft white polenta. One of the most celebrated dishes in Venetian cuisine.',
 '["fegato di vitello","cipolla bianca","olio d''oliva","prezzemolo","sale","pepe","polenta bianca"]'::jsonb,
 '["veal liver","white onion","olive oil","parsley","salt","pepper","white polenta"]'::jsonb,
 '[{"name":"Trattoria alla Madonna","maps_link":"https://www.google.com/maps/search/Trattoria+alla+Madonna+Venice"},{"name":"Osteria da Fiore","maps_link":"https://www.google.com/maps/search/Osteria+da+Fiore+Venice"}]'::jsonb),

('venezia', 'Cicchetti', 'Cicchetti',
 'I tapas veneziani: piccoli bocconi (baccala mantecato, polpette, capesante, nervetti) serviti su fettine di pane o polenta. Si mangiano in piedi al bancone dei bacari, innaffiati da un''ombra di vino bianco frizzante.',
 $$Venice's tapas: small bites (baccalà mantecato, meatballs, scallops, calf tendons) served on bread slices or polenta. Eaten standing at a bacaro counter, washed down with a glass of sparkling white wine.$$,
 '["baccala mantecato","polpette","capesante","nervetti","pane o polenta","vino bianco"]'::jsonb,
 '["baccala mantecato","meatballs","scallops","calf tendons","bread or polenta","white wine"]'::jsonb,
 '[{"name":"All''Arco","maps_link":"https://www.google.com/maps/search/All+Arco+Venice"},{"name":"Cantina Do Mori","maps_link":"https://www.google.com/maps/search/Cantina+Do+Mori+Venice"}]'::jsonb),

('venezia', 'Frittura mista di mare', 'Frittura mista di mare',
 'Calamari, gamberi, seppie, acciughe e piccoli pesci di laguna impanati leggermente e fritti in olio bollente. Leggera e croccante, senza la panatura pesante delle altre regioni. Piatto immancabile delle osterie veneziane.',
 'Squid, prawns, cuttlefish, anchovies and small lagoon fish lightly breaded and deep-fried in hot oil. Light and crispy, without the heavy coating of other regions. An unmissable dish in Venetian osterie.',
 '["calamari","gamberi","seppie","acciughe","pesci di laguna","farina","olio di semi","limone"]'::jsonb,
 '["squid","prawns","cuttlefish","anchovies","lagoon fish","flour","sunflower oil","lemon"]'::jsonb,
 '[{"name":"Antiche Carampane","maps_link":"https://www.google.com/maps/search/Antiche+Carampane+Venice"},{"name":"Trattoria alla Madonna","maps_link":"https://www.google.com/maps/search/Trattoria+alla+Madonna+Venice"}]'::jsonb),

('venezia', 'Moleche fritte', 'Moleche fritte',
 'Granchi di laguna catturati durante la muta primaverile (quando perdono il guscio), infarinati e fritti interi con uova. La delicatezza veneziana piu rara e stagionale: disponibile solo ad aprile-maggio e ottobre. Croccanti e dal sapore unico.',
 'Lagoon crabs caught during their spring moult (when they shed their shell), dipped in egg and flour and fried whole. Venice''s rarest and most seasonal delicacy: available only in April-May and October. Crispy with a unique flavour.',
 '["granchi moi (in muta)","uova","farina","olio di semi","sale"]'::jsonb,
 '["moulting lagoon crabs","eggs","flour","sunflower oil","salt"]'::jsonb,
 '[{"name":"All''Arco","maps_link":"https://www.google.com/maps/search/All+Arco+Venice"},{"name":"Osteria alle Testiere","maps_link":"https://www.google.com/maps/search/Osteria+alle+Testiere+Venice"}]'::jsonb),

('venezia', 'Bussolà buranello', 'Bussolà buranello',
 'Ciambella (bussolà) o biscotto secco (esìna) tipico dell''isola di Burano, aromatizzato con vaniglia e grappa veneziana. Friabile e poco dolce, perfetto inzuppato nel vino passito o nel caffè. La tradizione dolciaria veneziana piu antica.',
 'Ring cake (bussolà) or dry biscuit (esìna) typical of the island of Burano, flavoured with vanilla and Venetian grappa. Crumbly and not too sweet, perfect dipped in passito wine or coffee. The oldest Venetian pastry tradition.',
 '["farina","uova","burro","zucchero","vaniglia","grappa veneziana","lievito"]'::jsonb,
 '["flour","eggs","butter","sugar","vanilla","Venetian grappa","baking powder"]'::jsonb,
 '[{"name":"Pasticceria Palmisano","maps_link":"https://www.google.com/maps/search/Pasticceria+Palmisano+Burano+Venice"},{"name":"Al Gatto Nero","maps_link":"https://www.google.com/maps/search/Al+Gatto+Nero+Burano+Venice"}]'::jsonb),

-- ── Amsterdam ─────────────────────────────────────────────────────────────────
('amsterdam', 'Haring (Hollandse Nieuwe)', 'Hollandse Nieuwe Herring',
 'Aringa cruda maturata nel suo stesso grasso, filettata e consumata tenendola per la coda sopra la testa o su un panino (broodje haring) con cipolla cruda e cetriolini. Disponibile da maggio, e la tradizione gastronomica piu iconica dei Paesi Bassi.',
 'Raw herring matured in its own fat, filleted and eaten dangling it by the tail over the mouth or in a bread roll (broodje haring) with raw onion and gherkins. Available from May, it is the most iconic Dutch food tradition.',
 '["aringa fresca","cipolla cruda","cetriolini","pane bianco morbido"]'::jsonb,
 '["fresh herring","raw onion","gherkins","soft white bread roll"]'::jsonb,
 '[{"name":"Stubbe''s Haring","maps_link":"https://www.google.com/maps/search/Stubbes+Haring+Amsterdam"},{"name":"Volendammer Vishandel","maps_link":"https://www.google.com/maps/search/Volendammer+Vishandel+Amsterdam"}]'::jsonb),

('amsterdam', 'Stamppot', 'Stamppot',
 'Purea di patate olandese mescolata con verdure di stagione (cavolo riccio, carote, acetosa o crauti), servita con rookworst (salsiccia affumicata) e sughi di carne. Il comfort food olandese per eccellenza nelle serate fredde.',
 'Dutch mashed potato mixed with seasonal vegetables (kale, carrots, sorrel or sauerkraut), served with rookworst (smoked sausage) and meat gravy. The quintessential Dutch comfort food for cold evenings.',
 '["patate","cavolo riccio o carote","rookworst affumicata","burro","latte","sale"]'::jsonb,
 '["potatoes","kale or carrots","smoked rookworst sausage","butter","milk","salt"]'::jsonb,
 '[{"name":"Café de Jaren","maps_link":"https://www.google.com/maps/search/Cafe+de+Jaren+Amsterdam"},{"name":"Moeders","maps_link":"https://www.google.com/maps/search/Moeders+Amsterdam"}]'::jsonb),

('amsterdam', 'Bitterballen', 'Bitterballen',
 'Croccanti polpettine sferiche di ragù di manzo in besciamella, impanate e fritte fino a doratura. Immancabili nei brown cafés olandesi accompagnate dalla birra. Lo snack da aperitivo (borrelhapje) nazionale olandese per eccellenza.',
 $$Crispy spherical croquettes of beef ragù in béchamel, breaded and deep-fried until golden. Unmissable in Dutch brown cafés served with beer. The quintessential Dutch aperitif snack (borrelhapje).$$,
 '["manzo tritato","besciamella","pangrattato","uova","burro","noce moscata","prezzemolo"]'::jsonb,
 '["minced beef","bechamel sauce","breadcrumbs","eggs","butter","nutmeg","parsley"]'::jsonb,
 '[{"name":"Café t Smalle","maps_link":"https://www.google.com/maps/search/Cafe+t+Smalle+Amsterdam"},{"name":"Brouwerij t IJ","maps_link":"https://www.google.com/maps/search/Brouwerij+t+IJ+Amsterdam"}]'::jsonb),

('amsterdam', 'Stroopwafel', 'Stroopwafel',
 'Cialda sottile e croccante di waffle con ripieno di sciroppo di caramello morbido e speziato. Si mette sul bordo di una tazza calda per ammorbidire il ripieno. Inventata ad Haarlem nel 1810, e il biscotto piu famoso dei Paesi Bassi.',
 'Thin crispy waffle disc with a soft spiced caramel syrup filling. Placed on the rim of a hot mug to soften the filling. Invented in Haarlem in 1810, it is the most famous biscuit of the Netherlands.',
 '["farina","burro","zucchero","lievito","cannella","sciroppo di canna","uova"]'::jsonb,
 '["flour","butter","sugar","yeast","cinnamon","cane syrup","eggs"]'::jsonb,
 '[{"name":"Lanskroon","maps_link":"https://www.google.com/maps/search/Lanskroon+Amsterdam"},{"name":"Albert Cuyp Markt stroopwafel stalls","maps_link":"https://www.google.com/maps/search/Albert+Cuyp+Markt+Amsterdam"}]'::jsonb),

('amsterdam', 'Poffertjes', 'Poffertjes',
 'Mini pancake soffici e gonfi, cotti in una padella di ghisa speciale con tante piccole cavita. Serviti caldi con abbondante burro fuso e zucchero a velo. Street food tradizionale dei mercati e delle fiere olandesi.',
 'Small, soft and fluffy pancakes cooked in a special cast-iron pan with many small cavities. Served hot with generous melted butter and icing sugar. Traditional street food at Dutch markets and fairs.',
 '["farina di grano saraceno","lievito","latte","uova","burro","zucchero a velo"]'::jsonb,
 '["buckwheat flour","yeast","milk","eggs","butter","icing sugar"]'::jsonb,
 '[{"name":"Poffertjeskraam Noordermarkt","maps_link":"https://www.google.com/maps/search/Noordermarkt+Amsterdam"},{"name":"Pancakes! Amsterdam","maps_link":"https://www.google.com/maps/search/Pancakes+Amsterdam"}]'::jsonb),

('amsterdam', 'Erwtensoep (Snert)', 'Erwtensoep (Snert)',
 'Densa zuppa invernale di piselli spezzati con rookworst affumicata, porri, sedano rapa, carote e pancetta. Tanto densa che il cucchiaio deve reggersi da solo. Il piatto simbolo dell''inverno olandese, perfetto dopo una pedalata sotto la pioggia.',
 'Thick winter soup of split peas with smoked rookworst sausage, leeks, celeriac, carrots and bacon. So thick the spoon must stand upright on its own. The symbol of the Dutch winter, perfect after cycling in the rain.',
 '["piselli spezzati","rookworst affumicata","porri","sedano rapa","carote","pancetta","cipolla"]'::jsonb,
 '["split peas","smoked rookworst","leeks","celeriac","carrots","bacon","onion"]'::jsonb,
 '[{"name":"Moeders","maps_link":"https://www.google.com/maps/search/Moeders+Amsterdam"},{"name":"Café de Jaren","maps_link":"https://www.google.com/maps/search/Cafe+de+Jaren+Amsterdam"}]'::jsonb),

('amsterdam', 'Kaas olandese', 'Dutch Cheese',
 'I formaggi olandesi sono tra i piu esportati al mondo. Il Gouda giovane (mild) e dolce e morbido; quello stagionato (oud) e duro, saporito e cristallino. L''Edam ha la classica forma sferica e il rivestimento rosso. Da assaggiare ai mercati.',
 'Dutch cheeses are among the world''s most exported. Young Gouda (mild) is sweet and soft; aged Gouda (oud) is hard, flavourful and crystalline. Edam has the classic spherical shape and red rind. Best tasted at the markets.',
 '["latte pastorizzato","caglio","sale","spezie (cumino o chiodi di garofano per varianti)"]'::jsonb,
 '["pasteurised milk","rennet","salt","spices (caraway or cloves for variants)"]'::jsonb,
 '[{"name":"De Kaaskamer","maps_link":"https://www.google.com/maps/search/De+Kaaskamer+Amsterdam"},{"name":"Henri Willig","maps_link":"https://www.google.com/maps/search/Henri+Willig+Amsterdam"}]'::jsonb),

('amsterdam', 'Appeltaart', 'Dutch Apple Pie',
 'La torta di mele olandese: alta e robusta, con una crosta friabile e un ripieno denso di mele, uvetta, cannella e zucchero di canna. Completamente diversa da quella americana. Servita a temperatura ambiente con panna montata fresca.',
 'The Dutch apple cake: tall and sturdy, with a crumbly crust and a dense filling of apples, raisins, cinnamon and brown sugar. Completely different from the American version. Served at room temperature with fresh whipped cream.',
 '["mele Goudreinet","farina","burro","uvetta","cannella","zucchero di canna","limone"]'::jsonb,
 '["Goudreinet apples","flour","butter","raisins","cinnamon","brown sugar","lemon"]'::jsonb,
 '[{"name":"Winkel 43","maps_link":"https://www.google.com/maps/search/Winkel+43+Amsterdam"},{"name":"Café de Jaren","maps_link":"https://www.google.com/maps/search/Cafe+de+Jaren+Amsterdam"}]'::jsonb),

-- ── Praga ─────────────────────────────────────────────────────────────────────
('praga', 'Svíčková na smetaně', 'Svíčková na smetaně',
 'Filetto di manzo marinato e brasato lentamente in sugo di verdure con panna acida, servito con knedlíky (gnocchi di pane cechi), marmellata di mirtilli rossi e limone. Il piatto nazionale ceco per eccellenza, simbolo della cucina casalinga boema.',
 'Marinated beef sirloin slowly braised in vegetable cream sauce, served with knedlíky (Czech bread dumplings), cranberry jam and a lemon slice. The quintessential Czech national dish, a symbol of Bohemian home cooking.',
 '["filetto di manzo","carote","radice di prezzemolo","sedano","panna acida","cipolla","alloro","mirtilli rossi"]'::jsonb,
 '["beef sirloin","carrots","parsley root","celery","sour cream","onion","bay leaf","cranberries"]'::jsonb,
 '[{"name":"Lokál Dlouhááá","maps_link":"https://www.google.com/maps/search/Lokal+Dlouhaaa+Prague"},{"name":"Eska","maps_link":"https://www.google.com/maps/search/Eska+Prague"}]'::jsonb),

('praga', 'Vepřo knedlo zelo', 'Vepřo knedlo zelo',
 'La "santa trinita" della cucina ceca: arrosto di maiale (vepřo) con knedlíky (knedlo, gnocchi di pane) e crauti (zelo). Piatto immancabile in ogni hospoda (pub ceco) tradizionale. Sostanzioso e confortante.',
 'The "holy trinity" of Czech cuisine: roast pork (vepřo) with knedlíky (knedlo, bread dumplings) and sauerkraut (zelo). An unmissable dish in every traditional Czech hospoda (pub). Hearty and comforting.',
 '["spalla di maiale","crauti","knedlíky","cumino","aglio","sale","birra"]'::jsonb,
 '["pork shoulder","sauerkraut","knedlíky dumplings","caraway seeds","garlic","salt","beer"]'::jsonb,
 '[{"name":"Restaurace U Fleků","maps_link":"https://www.google.com/maps/search/Restaurace+U+Fleku+Prague"},{"name":"Lokál Dlouhááá","maps_link":"https://www.google.com/maps/search/Lokal+Dlouhaaa+Prague"}]'::jsonb),

('praga', 'Guláš ceco', 'Czech Guláš',
 'Il gulasch alla boema: spezzatino di manzo con paprika, cumino e cipolla in un sugo denso e scuro. Diverso da quello ungherese, si serve rigorosamente con knedlíky di pane (mai pasta) e una pinta di birra ceca.',
 'Bohemian-style goulash: beef stew with paprika, caraway seeds and onion in a thick dark sauce. Different from Hungarian goulash, always served strictly with bread knedlíky (never pasta) and a pint of Czech beer.',
 '["manzo","cipolla","paprika dolce","cumino","aglio","brodo di manzo","strutto","alloro"]'::jsonb,
 '["beef","onion","sweet paprika","caraway seeds","garlic","beef broth","lard","bay leaf"]'::jsonb,
 '[{"name":"Restaurace U Fleků","maps_link":"https://www.google.com/maps/search/Restaurace+U+Fleku+Prague"},{"name":"Hospůdka Na Hradbách","maps_link":"https://www.google.com/maps/search/Hospudka+Na+Hradbach+Prague"}]'::jsonb),

('praga', 'Knedlíky', 'Knedlíky (Czech Dumplings)',
 'Gli gnocchi di pane cechi: impasto a base di pane raffermo o farina, uova e lievito, cotto al vapore e tagliato a fette spesse. L''accompagnamento obbligatorio di quasi ogni piatto della cucina ceca tradizionale. Ne esistono varianti dolci e salate.',
 'Czech bread dumplings: dough made from stale bread or flour, eggs and yeast, steamed and sliced thick. The obligatory accompaniment to almost every traditional Czech dish. Savory and sweet variants exist.',
 '["farina o pane raffermo","uova","lievito","latte","sale","burro"]'::jsonb,
 '["flour or stale bread","eggs","yeast","milk","salt","butter"]'::jsonb,
 '[{"name":"Lokál Dlouhááá","maps_link":"https://www.google.com/maps/search/Lokal+Dlouhaaa+Prague"},{"name":"Mincovna","maps_link":"https://www.google.com/maps/search/Mincovna+Prague"}]'::jsonb),

('praga', 'Smažený sýr', 'Smažený sýr (Fried Cheese)',
 'Fetta di formaggio Eidam o Hermelín impanata e fritta nell''olio fino a doratura, servita con patatine fritte e salsa tartara. Il fast food ceco piu amato, disponibile in quasi ogni hospoda e ristorante del paese.',
 'A slice of Edam or Hermelín cheese breaded and deep-fried until golden, served with chips and tartare sauce. The most loved Czech fast food, available in almost every hospoda and restaurant in the country.',
 '["formaggio Eidam o Hermelín","pangrattato","uova","farina","olio","salsa tartara"]'::jsonb,
 '["Edam or Hermelín cheese","breadcrumbs","eggs","flour","oil","tartare sauce"]'::jsonb,
 '[{"name":"Nase Maso","maps_link":"https://www.google.com/maps/search/Nase+Maso+Prague"},{"name":"Lokál Dlouhááá","maps_link":"https://www.google.com/maps/search/Lokal+Dlouhaaa+Prague"}]'::jsonb),

('praga', 'Trdelník', 'Trdelník',
 'Ciambella di pasta lievitata avvolta su un cilindro di legno (trdlo), abbrustolita sulla brace e cosparsa di zucchero e cannella. Street food iconico della Città Vecchia di Praga, anche se la sua origine e controversa (alcuni ritengono sia una creazione turistica moderna).',
 'Leavened dough wrapped around a wooden cylinder (trdlo), roasted over charcoal and covered in sugar and cinnamon. Iconic street food in Prague''s Old Town, though its origin is debated — some consider it a modern tourist creation.',
 '["farina","lievito","latte","uova","burro","zucchero","cannella","noci tritate"]'::jsonb,
 '["flour","yeast","milk","eggs","butter","sugar","cinnamon","ground walnuts"]'::jsonb,
 '[{"name":"Good Food Coffee & Bakery","maps_link":"https://www.google.com/maps/search/Good+Food+Coffee+Bakery+Prague"},{"name":"bancarelle Piazza della Citta Vecchia","maps_link":"https://www.google.com/maps/search/Old+Town+Square+Prague"}]'::jsonb),

('praga', 'Bramboračka', 'Bramboračka (Potato Soup)',
 'Zuppa densa e rustica di patate con funghi secchi, aglio, maggiorana e panna acida. Tradizionalmente servita in una ciotola di pane casereccio scavato. Comfort food ceco per le serate fredde, immancabile nei ristoranti tradizionali.',
 'Thick rustic potato soup with dried mushrooms, garlic, marjoram and sour cream. Traditionally served in a hollowed-out homemade bread bowl. Czech comfort food for cold evenings, unmissable in traditional restaurants.',
 '["patate","funghi secchi","aglio","maggiorana","panna acida","cipolla","carote","brodo"]'::jsonb,
 '["potatoes","dried mushrooms","garlic","marjoram","sour cream","onion","carrots","broth"]'::jsonb,
 '[{"name":"Kantýna","maps_link":"https://www.google.com/maps/search/Kantyna+Prague"},{"name":"Eska","maps_link":"https://www.google.com/maps/search/Eska+Prague"}]'::jsonb),

('praga', 'Svařák (Vin brulé ceco)', 'Svařák (Czech Mulled Wine)',
 'Il vin brulé ceco aromatizzato con cannella, chiodi di garofano, anice stellato e scorza d''arancia. Immancabile nei celebri mercatini di Natale di Praga (tra i piu belli d''Europa). In estate si serve il variante freddo con idromele (medovina).',
 'Czech mulled wine flavoured with cinnamon, cloves, star anise and orange zest. Unmissable at Prague''s famous Christmas markets (among the most beautiful in Europe). In summer, the cold variant with mead (medovina) is served.',
 '["vino rosso","cannella","chiodi di garofano","anice stellato","scorza d''arancia","zucchero"]'::jsonb,
 '["red wine","cinnamon","cloves","star anise","orange zest","sugar"]'::jsonb,
 '[{"name":"Mercatino di Natale Piazza Venceslao","maps_link":"https://www.google.com/maps/search/Wenceslas+Square+Christmas+Market+Prague"},{"name":"Café Savoy","maps_link":"https://www.google.com/maps/search/Cafe+Savoy+Prague"}]'::jsonb),

-- ── Budapest ──────────────────────────────────────────────────────────────────
('budapest', 'Gulyás', 'Gulyás (Goulash)',
 'Il vero gulasch ungherese: non uno stufato ma una zuppa densa e rossa di manzo con paprika dolce, cipolla, patate, pomodoro e pasta csipetke pizzicata a mano. Piatto nazionale, cucinato nei caratteristici bogrács (caldaioni).',
 'The real Hungarian goulash: not a stew but a thick red beef soup with sweet paprika, onion, potatoes, tomato and hand-pinched csipetke pasta. The national dish, cooked in the characteristic bogrács cauldron.',
 '["manzo","paprika dolce","cipolla","patate","pomodoro","pasta csipetke","cumino","peperone"]'::jsonb,
 '["beef","sweet paprika","onion","potatoes","tomato","csipetke pasta","caraway seeds","pepper"]'::jsonb,
 '[{"name":"Paprika","maps_link":"https://www.google.com/maps/search/Paprika+restaurant+Budapest"},{"name":"Gundel","maps_link":"https://www.google.com/maps/search/Gundel+Budapest"}]'::jsonb),

('budapest', 'Lángos', 'Lángos',
 'Frittella di pasta lievitata fritta nell''olio bollente, servita con panna acida e formaggio grattugiato. Lo street food ungherese per eccellenza, immancabile ai mercati, alle fiere e alle terme. Croccante fuori, morbida dentro.',
 'Leavened dough fritter deep-fried in hot oil, served with sour cream and grated cheese. The quintessential Hungarian street food, unmissable at markets, fairs and the thermal baths. Crispy outside, soft inside.',
 '["farina","lievito","latte","uova","panna acida","formaggio grattugiato","aglio","sale"]'::jsonb,
 '["flour","yeast","milk","eggs","sour cream","grated cheese","garlic","salt"]'::jsonb,
 '[{"name":"Nagycsarnok (Mercato Centrale)","maps_link":"https://www.google.com/maps/search/Nagycsarnok+Budapest"},{"name":"Szimpla Kert","maps_link":"https://www.google.com/maps/search/Szimpla+Kert+Budapest"}]'::jsonb),

('budapest', 'Halászlé', 'Halászlé (Fisherman''s Soup)',
 'Zuppa di pesce piccante e intensa, ricchissima di paprika rossa macinata fresca. Preparata con carpa, pesce siluro o luccio pescati dal Danubio e dal Tibisco. Esistono due varianti: Baja (liscia) e Szeged (con pezzi interi).',
 'Spicy and intense fish soup, packed with freshly ground red paprika. Made with carp, catfish or pike from the Danube and Tisza rivers. Two variants exist: Baja style (smooth) and Szeged style (with whole pieces).',
 '["carpa o pesce siluro","paprika rossa fresca","cipolla","pomodoro","peperone","sale"]'::jsonb,
 '["carp or catfish","fresh red paprika","onion","tomato","pepper","salt"]'::jsonb,
 '[{"name":"Bajai Halászcsárda","maps_link":"https://www.google.com/maps/search/Bajai+Halaszcsarda+Budapest"},{"name":"Kárpátia","maps_link":"https://www.google.com/maps/search/Karpatia+Budapest"}]'::jsonb),

('budapest', 'Dobos torta', 'Dobos Torte',
 'La torta piu celebre d''Ungheria: sette strati sottili di pan di spagna alternati a crema al burro al cioccolato, ricoperti da un disco caramellato croccante diviso in spicchi. Inventata dal pasticcere József Dobos nel 1884 per la Fiera Nazionale.',
 $$Hungary's most celebrated cake: seven thin sponge layers alternating with chocolate buttercream, topped with a crispy caramel disc divided into slices. Invented by pastry chef József Dobos in 1884 for the National Fair.$$,
 '["pan di spagna","burro","cioccolato fondente","uova","zucchero","caramello"]'::jsonb,
 '["sponge cake","butter","dark chocolate","eggs","sugar","caramel"]'::jsonb,
 '[{"name":"Gerbeaud Cukrászda","maps_link":"https://www.google.com/maps/search/Gerbeaud+Budapest"},{"name":"Ruszwurm Cukrászda","maps_link":"https://www.google.com/maps/search/Ruszwurm+Budapest"}]'::jsonb),

('budapest', 'Töltött káposzta', 'Töltött káposzta (Stuffed Cabbage)',
 'Foglie di cavolo bianco marinate negli involtini con carne macinata di maiale e manzo, riso e paprika, cotte lentamente in brodo con panna acida. Piatto festivo ungherese per eccellenza, tipico del Natale e delle celebrazioni.',
 'Pickled white cabbage leaves rolled around a filling of minced pork and beef, rice and paprika, slow-cooked in broth with sour cream. The quintessential Hungarian festive dish, typical at Christmas and celebrations.',
 '["foglie di cavolo marinato","maiale e manzo macinati","riso","paprika","panna acida","cipolla","aglio"]'::jsonb,
 '["pickled cabbage leaves","minced pork and beef","rice","paprika","sour cream","onion","garlic"]'::jsonb,
 '[{"name":"Kárpátia","maps_link":"https://www.google.com/maps/search/Karpatia+Budapest"},{"name":"Gundel","maps_link":"https://www.google.com/maps/search/Gundel+Budapest"}]'::jsonb),

('budapest', 'Kürtőskalács', 'Kürtőskalács (Chimney Cake)',
 'Ciambella di pasta lievitata avvolta su un cilindro di legno (kürtő), abbrustolita lentamente sulla brace e cosparsa di zucchero, cannella, noci o mandorle. Dolce tradizionale dei Székelyföldi, servito caldo da staccare a spirale.',
 'Leavened dough wrapped around a wooden cylinder (kürtő), slowly roasted over charcoal and coated in sugar, cinnamon, walnuts or almonds. Traditional sweet from the Székely region, served hot and peeled off in a spiral.',
 '["farina","lievito","latte","uova","burro","zucchero","cannella","noci"]'::jsonb,
 '["flour","yeast","milk","eggs","butter","sugar","cinnamon","walnuts"]'::jsonb,
 '[{"name":"Molnár''s Kürtőskalács","maps_link":"https://www.google.com/maps/search/Molnar+Kurtoskalacs+Budapest"},{"name":"Fornetti","maps_link":"https://www.google.com/maps/search/Fornetti+Budapest"}]'::jsonb),

('budapest', 'Rétes', 'Rétes (Hungarian Strudel)',
 'Lo strudel ungherese: pasta tirata a mano sottilissima con ripieni dolci o salati (mele e cannella, ciliegie, ricotta con uvetta, semi di papavero e zucchero). Variante locale dell''Apfelstrudel austriaco, con tradizioni proprie.',
 'Hungarian strudel: paper-thin hand-stretched pastry with sweet or savoury fillings (apple and cinnamon, cherries, cottage cheese with raisins, poppy seeds and sugar). A local take on the Austrian Apfelstrudel, with its own traditions.',
 '["pasta tirata","mele o ciliegie o ricotta o semi di papavero","zucchero","cannella","uvetta","burro"]'::jsonb,
 '["stretched pastry","apple or cherries or cottage cheese or poppy seeds","sugar","cinnamon","raisins","butter"]'::jsonb,
 '[{"name":"Gerbeaud Cukrászda","maps_link":"https://www.google.com/maps/search/Gerbeaud+Budapest"},{"name":"Auguszt Cukrászda","maps_link":"https://www.google.com/maps/search/Auguszt+Budapest"}]'::jsonb),

('budapest', 'Pörkölt', 'Pörkölt',
 'Spezzatino ungherese di manzo, maiale o agnello con abbondante paprika dolce e cipolla in sugo denso e rosso. Spesso confuso con il gulasch (che e una zuppa), il pörkölt e piu simile a uno stufato asciutto. Servito con pasta o gnocchi.',
 'Hungarian stew of beef, pork or lamb with generous sweet paprika and onion in a thick red sauce. Often confused with goulash (which is a soup), pörkölt is closer to a dry stew. Served with pasta or dumplings.',
 '["manzo o maiale o agnello","paprika dolce","cipolla","aglio","pomodoro","strutto","sale"]'::jsonb,
 '["beef or pork or lamb","sweet paprika","onion","garlic","tomato","lard","salt"]'::jsonb,
 '[{"name":"Paprika","maps_link":"https://www.google.com/maps/search/Paprika+restaurant+Budapest"},{"name":"Kárpátia","maps_link":"https://www.google.com/maps/search/Karpatia+Budapest"}]'::jsonb),

-- ── Lisbona ───────────────────────────────────────────────────────────────────
('lisbona', 'Pastel de nata', 'Pastel de nata',
 'La celebre tartelletta di crema pasticcera portoghese: guscio di pasta sfoglia croccante e burroso con ripieno di crema alle uova caramellata in superficie. Nata nel 1837 dai monaci del Mosteiro dos Jeronimos. Si mangia calda con cannella.',
 'The celebrated Portuguese custard tart: a crispy buttery puff pastry shell with a caramelised egg custard filling. Born in 1837 from the monks of Mosteiro dos Jerónimos. Best eaten hot with cinnamon.',
 '["pasta sfoglia","uova","zucchero","latte","farina","scorza di limone","cannella","vaniglia"]'::jsonb,
 '["puff pastry","eggs","sugar","milk","flour","lemon zest","cinnamon","vanilla"]'::jsonb,
 '[{"name":"Pastéis de Belém","maps_link":"https://www.google.com/maps/search/Pasteis+de+Belem+Lisbon"},{"name":"Manteigaria","maps_link":"https://www.google.com/maps/search/Manteigaria+Lisbon"}]'::jsonb),

('lisbona', 'Bacalhau à Brás', 'Bacalhau à Brás',
 'Baccalà sfilacciato e saltato in padella con patate fritte a fiammifero sottilissime, uova strapazzate, cipolla, olive nere e prezzemolo. Una delle 365 ricette portoghesi del baccalà (una per ogni giorno dell''anno). Cremoso e saporito.',
 'Shredded salt cod sautéed with matchstick-thin fried potatoes, scrambled eggs, onion, black olives and parsley. One of Portugal''s 365 bacalhau recipes (one for each day of the year). Creamy and flavourful.',
 '["baccala dissalato","patate","uova","cipolla","olive nere","prezzemolo","olio d''oliva","aglio"]'::jsonb,
 '["desalted salt cod","potatoes","eggs","onion","black olives","parsley","olive oil","garlic"]'::jsonb,
 '[{"name":"Solar dos Presuntos","maps_link":"https://www.google.com/maps/search/Solar+dos+Presuntos+Lisbon"},{"name":"Zé da Mouraria","maps_link":"https://www.google.com/maps/search/Ze+da+Mouraria+Lisbon"}]'::jsonb),

('lisbona', 'Bifanas', 'Bifanas',
 'Panino con fettine sottili di lonza di maiale marinate nel vino bianco, aglio, paprika e spezie, cotte in padella e servite nel pane morbido con senape e salsa picante. Lo street food piu popolare di Lisbona, immancabile nei bar di quartiere.',
 'Bread roll filled with thin slices of pork loin marinated in white wine, garlic, paprika and spices, pan-fried and served in a soft roll with mustard and hot sauce. The most popular street food in Lisbon, unmissable in local bars.',
 '["lonza di maiale","vino bianco","aglio","paprika","pimento","pane morbido","senape","salsa picante"]'::jsonb,
 '["pork loin","white wine","garlic","paprika","pimento","soft roll","mustard","hot sauce"]'::jsonb,
 '[{"name":"Casa das Bifanas","maps_link":"https://www.google.com/maps/search/Casa+das+Bifanas+Lisbon"},{"name":"O Trevo","maps_link":"https://www.google.com/maps/search/O+Trevo+Lisbon"}]'::jsonb),

('lisbona', 'Caldo verde', 'Caldo verde',
 'Minestra nazionale portoghese di patate con cavolo nero (couve galega) tagliato in julienne finissima, chouriço affumicato e olio d''oliva. Povera e nutriente, e il piatto simbolo delle feste popolari e della cucina casalinga portoghese.',
 'Portugal''s national soup: potato broth with very finely julienned kale (couve galega), smoked chouriço and olive oil. Simple and nourishing, it is the symbolic dish of popular festivals and Portuguese home cooking.',
 '["patate","cavolo nero","chourico affumicato","olio d''oliva","cipolla","aglio","sale"]'::jsonb,
 '["potatoes","kale","smoked chourico","olive oil","onion","garlic","salt"]'::jsonb,
 '[{"name":"Tasca do Chico","maps_link":"https://www.google.com/maps/search/Tasca+do+Chico+Lisbon"},{"name":"A Cevicheria","maps_link":"https://www.google.com/maps/search/A+Cevicheria+Lisbon"}]'::jsonb),

('lisbona', 'Ginjinha', 'Ginjinha',
 'Liquore portoghese di ginja (amarena selvatica) con alcol, zucchero e cannella, maturato per mesi. Servito in un piccolo bicchierino di cioccolato fondente che si beve e poi si mangia. La bevanda piu iconica di Lisbona.',
 'Portuguese liqueur of ginja (wild sour cherry) with alcohol, sugar and cinnamon, matured for months. Served in a small dark chocolate cup that you drink from and then eat. The most iconic drink in Lisbon.',
 '["ginja (amarena selvatica)","alcol","zucchero","cannella","bicchierino di cioccolato"]'::jsonb,
 '["ginja (wild sour cherry)","alcohol","sugar","cinnamon","chocolate shot cup"]'::jsonb,
 '[{"name":"A Ginjinha","maps_link":"https://www.google.com/maps/search/A+Ginjinha+Lisbon"},{"name":"Ginjinha Sem Rival","maps_link":"https://www.google.com/maps/search/Ginjinha+Sem+Rival+Lisbon"}]'::jsonb),

('lisbona', 'Sardinhas assadas', 'Sardinhas assadas',
 'Sardine fresche dell''Oceano Atlantico grigliate sulla brace con semplice sale grosso. Il piatto simbolo della Festa de Santo Antonio (giugno), quando Alfama si riempie di grigliate all''aperto. Servite su pane di milho con peperonata.',
 'Fresh Atlantic Ocean sardines grilled over charcoal with simple coarse salt. The symbolic dish of the Festa de Santo António (June), when Alfama fills with open-air grills. Served on corn bread with roasted peppers.',
 '["sardine fresche atlantiche","sale grosso","pane di mais","peperonata","olio d''oliva"]'::jsonb,
 '["fresh Atlantic sardines","coarse salt","corn bread","roasted peppers","olive oil"]'::jsonb,
 '[{"name":"A Cozinha da Felicidade","maps_link":"https://www.google.com/maps/search/A+Cozinha+da+Felicidade+Lisbon"},{"name":"Cervejaria Ramiro","maps_link":"https://www.google.com/maps/search/Cervejaria+Ramiro+Lisbon"}]'::jsonb),

('lisbona', 'Arroz de marisco', 'Arroz de marisco',
 'Riso brodoso con gamberi, vongole, cozze, granchio e pesce in brodo di crostacei con pomodoro e coriandolo fresco. Ne asciutto ne risotto: un ibrido tipicamente portoghese. Il piatto di mare piu celebre della cucina lusitana.',
 'Soupy rice with prawns, clams, mussels, crab and fish in shellfish broth with tomato and fresh coriander. Neither dry nor risotto: a typically Portuguese hybrid. The most celebrated seafood dish of Lusitanian cuisine.',
 '["riso","gamberi","vongole","cozze","granchio","brodo di crostacei","pomodoro","coriandolo","vino bianco"]'::jsonb,
 '["rice","prawns","clams","mussels","crab","shellfish broth","tomato","coriander","white wine"]'::jsonb,
 '[{"name":"Cervejaria Ramiro","maps_link":"https://www.google.com/maps/search/Cervejaria+Ramiro+Lisbon"},{"name":"Sea Me","maps_link":"https://www.google.com/maps/search/Sea+Me+Lisbon"}]'::jsonb),

('lisbona', 'Francesinha', 'Francesinha',
 'Il sandwich di Porto (ma amatissimo anche a Lisbona): strati di carne (bistecca, linguiça, fiambre) e formaggio fuso, ricoperti da una salsa piccante di birra, pomodoro e peperoncino. Servito con patatine fritte. Enormemente calorico.',
 'The Porto sandwich (but beloved in Lisbon too): layers of meat (steak, linguiça, ham) and melted cheese, smothered in a spicy beer, tomato and chilli sauce. Served with chips. Enormously calorific.',
 '["bistecca","linguica","fiambre","formaggio fuso","salsa di birra","pomodoro","peperoncino","pane da toast"]'::jsonb,
 '["steak","linguica","ham","melted cheese","beer sauce","tomato","chilli","toast bread"]'::jsonb,
 '[{"name":"Santiago","maps_link":"https://www.google.com/maps/search/Santiago+francesinha+Lisbon"},{"name":"Tasca do Chico","maps_link":"https://www.google.com/maps/search/Tasca+do+Chico+Lisbon"}]'::jsonb);

-- ════════════════════════════════════════════════════════════
-- FOOD PLACES
-- UPDATE idempotenti: sicuri da rieseguire più volte.
-- (solo per città originali con foods già in Supabase)
-- Per le nuove città i places sono inclusi negli INSERT sopra.
-- ════════════════════════════════════════════════════════════

-- ── Roma ──────────────────────────────────────────────────────────────────────
UPDATE public.foods SET places = '[{"name":"Tonnarello","maps_link":"https://www.google.com/maps/search/Tonnarello+Trastevere+Roma"},{"name":"Da Enzo al 29","maps_link":"https://www.google.com/maps/search/Da+Enzo+al+29+Roma"}]'::jsonb WHERE city='roma' AND name='Cacio e Pepe';
UPDATE public.foods SET places = '[{"name":"Roscioli","maps_link":"https://www.google.com/maps/search/Roscioli+Roma"},{"name":"Grotte del Tevere","maps_link":"https://www.google.com/maps/search/Grotte+del+Tevere+Roma"}]'::jsonb WHERE city='roma' AND name='Carbonara';
UPDATE public.foods SET places = '[{"name":"Suppli Roma","maps_link":"https://www.google.com/maps/search/Suppli+Roma+Trastevere"},{"name":"I Suppli","maps_link":"https://www.google.com/maps/search/I+Suppli+Via+San+Francesco+a+Ripa+Roma"}]'::jsonb WHERE city='roma' AND name='Supplì al Telefono';
UPDATE public.foods SET places = '[{"name":"Da Bucatino","maps_link":"https://www.google.com/maps/search/Da+Bucatino+Testaccio+Roma"},{"name":"Osteria dell Antiquario","maps_link":"https://www.google.com/maps/search/Osteria+dell+Antiquario+Roma"}]'::jsonb WHERE city='roma' AND name='Amatriciana';
UPDATE public.foods SET places = '[{"name":"Flavio al Velavevodetto","maps_link":"https://www.google.com/maps/search/Flavio+al+Velavevodetto+Roma"},{"name":"Checchino dal 1887","maps_link":"https://www.google.com/maps/search/Checchino+dal+1887+Roma"}]'::jsonb WHERE city='roma' AND name='Coda alla Vaccinara';
UPDATE public.foods SET places = '[{"name":"Da Enzo al 29","maps_link":"https://www.google.com/maps/search/Da+Enzo+al+29+Roma"},{"name":"Filettaro a Santa Barbara","maps_link":"https://www.google.com/maps/search/Filettaro+a+Santa+Barbara+Roma"}]'::jsonb WHERE city='roma' AND name='Carciofo alla Romana e alla Giudia';
UPDATE public.foods SET places = '[{"name":"Pasticceria Regoli","maps_link":"https://www.google.com/maps/search/Pasticceria+Regoli+Roma"},{"name":"Bar San Calisto","maps_link":"https://www.google.com/maps/search/Bar+San+Calisto+Trastevere+Roma"}]'::jsonb WHERE city='roma' AND name='Maritozzo con la Panna';
UPDATE public.foods SET places = '[{"name":"Trattoria Morgana","maps_link":"https://www.google.com/maps/search/Trattoria+Morgana+Roma"},{"name":"Osteria dei Ponziani","maps_link":"https://www.google.com/maps/search/Osteria+dei+Ponziani+Roma"}]'::jsonb WHERE city='roma' AND name='Gricia';

-- ── Milano ────────────────────────────────────────────────────────────────────
UPDATE public.foods SET places = '[{"name":"Trattoria Milanese","maps_link":"https://www.google.com/maps/search/Trattoria+Milanese+Milano"},{"name":"Ratana","maps_link":"https://www.google.com/maps/search/Ratana+Milano"}]'::jsonb WHERE city='milano' AND name='Risotto alla milanese';
UPDATE public.foods SET places = '[{"name":"Trattoria del Nuovo Macello","maps_link":"https://www.google.com/maps/search/Trattoria+del+Nuovo+Macello+Milano"},{"name":"Al Matarel","maps_link":"https://www.google.com/maps/search/Al+Matarel+Milano"}]'::jsonb WHERE city='milano' AND name='Cotoletta alla milanese';
UPDATE public.foods SET places = '[{"name":"Osteria dell Acquabella","maps_link":"https://www.google.com/maps/search/Osteria+dell+Acquabella+Milano"},{"name":"Trattoria Milanese","maps_link":"https://www.google.com/maps/search/Trattoria+Milanese+Milano"}]'::jsonb WHERE city='milano' AND name='Ossobuco';
UPDATE public.foods SET places = '[{"name":"Marchesi 1824","maps_link":"https://www.google.com/maps/search/Marchesi+1824+Milano"},{"name":"Pasticceria Cova","maps_link":"https://www.google.com/maps/search/Pasticceria+Cova+Milano"}]'::jsonb WHERE city='milano' AND name='Panettone';
UPDATE public.foods SET places = '[{"name":"Trattoria Masuelli San Marco","maps_link":"https://www.google.com/maps/search/Trattoria+Masuelli+San+Marco+Milano"},{"name":"Osteria dell Acquabella","maps_link":"https://www.google.com/maps/search/Osteria+dell+Acquabella+Milano"}]'::jsonb WHERE city='milano' AND name='Mondeghili';
UPDATE public.foods SET places = '[{"name":"Antica Osteria del Sempione","maps_link":"https://www.google.com/maps/search/Antica+Osteria+del+Sempione+Milano"},{"name":"Trattoria Masuelli San Marco","maps_link":"https://www.google.com/maps/search/Trattoria+Masuelli+San+Marco+Milano"}]'::jsonb WHERE city='milano' AND name='Cassoeula';
UPDATE public.foods SET places = '[{"name":"Panificio Longoni","maps_link":"https://www.google.com/maps/search/Panificio+Longoni+Milano"},{"name":"Pasticceria Marchesi","maps_link":"https://www.google.com/maps/search/Pasticceria+Marchesi+Milano"}]'::jsonb WHERE city='milano' AND name='Michetta';
UPDATE public.foods SET places = '[{"name":"Bar Basso","maps_link":"https://www.google.com/maps/search/Bar+Basso+Milano"},{"name":"Nottingham Forest Bar","maps_link":"https://www.google.com/maps/search/Nottingham+Forest+Bar+Milano"}]'::jsonb WHERE city='milano' AND name='Campari Soda';

-- ── Barcellona ────────────────────────────────────────────────────────────────
UPDATE public.foods SET places = '[{"name":"Bar Calders","maps_link":"https://www.google.com/maps/search/Bar+Calders+Barcelona"},{"name":"La Pepita Gracia","maps_link":"https://www.google.com/maps/search/La+Pepita+Gracia+Barcelona"}]'::jsonb WHERE city='barcellona' AND name='Pa amb Tomàquet';
UPDATE public.foods SET places = '[{"name":"7 Portes","maps_link":"https://www.google.com/maps/search/7+Portes+Barcelona"},{"name":"La Mar Salada","maps_link":"https://www.google.com/maps/search/La+Mar+Salada+Barcelona"}]'::jsonb WHERE city='barcellona' AND name='Fideuà';
UPDATE public.foods SET places = '[{"name":"El Xampanyet","maps_link":"https://www.google.com/maps/search/El+Xampanyet+Barcelona"},{"name":"El Quim de la Boqueria","maps_link":"https://www.google.com/maps/search/El+Quim+de+la+Boqueria+Barcelona"}]'::jsonb WHERE city='barcellona' AND name='Croquetas de Jamón';
UPDATE public.foods SET places = '[{"name":"La Cova Fumada","maps_link":"https://www.google.com/maps/search/La+Cova+Fumada+Barcelona"},{"name":"Bar Leo","maps_link":"https://www.google.com/maps/search/Bar+Leo+Barceloneta+Barcelona"}]'::jsonb WHERE city='barcellona' AND name='Bombas de la Barceloneta';
UPDATE public.foods SET places = '[{"name":"Els Quatre Gats","maps_link":"https://www.google.com/maps/search/Els+Quatre+Gats+Barcelona"},{"name":"Hofmann Pastisseria","maps_link":"https://www.google.com/maps/search/Hofmann+Pastisseria+Barcelona"}]'::jsonb WHERE city='barcellona' AND name='Crema Catalana';
UPDATE public.foods SET places = '[{"name":"Bar Marsella","maps_link":"https://www.google.com/maps/search/Bar+Marsella+Barcelona"},{"name":"La Pepita Gracia","maps_link":"https://www.google.com/maps/search/La+Pepita+Gracia+Barcelona"}]'::jsonb WHERE city='barcellona' AND name='Escalivada';
UPDATE public.foods SET places = '[{"name":"Bar Tomas","maps_link":"https://www.google.com/maps/search/Bar+Tomas+Barcelona"},{"name":"El Xampanyet","maps_link":"https://www.google.com/maps/search/El+Xampanyet+Barcelona"}]'::jsonb WHERE city='barcellona' AND name='Patatas Bravas';
UPDATE public.foods SET places = '[{"name":"Forn de Sant Jaume","maps_link":"https://www.google.com/maps/search/Forn+de+Sant+Jaume+Barcelona"},{"name":"Federal Cafe","maps_link":"https://www.google.com/maps/search/Federal+Cafe+Barcelona"}]'::jsonb WHERE city='barcellona' AND name='Coca de Recapte';

-- ── Parigi ────────────────────────────────────────────────────────────────────
UPDATE public.foods SET places = '[{"name":"Du Pain et des Idees","maps_link":"https://www.google.com/maps/search/Du+Pain+et+des+Idees+Paris"},{"name":"Ble Sucre","maps_link":"https://www.google.com/maps/search/Ble+Sucre+Paris"}]'::jsonb WHERE city='parigi' AND name='Croissant au Beurre';
UPDATE public.foods SET places = '[{"name":"Au Relais de l Entrecote","maps_link":"https://www.google.com/maps/search/Relais+de+l+Entrecote+Paris"},{"name":"Bistrot Paul Bert","maps_link":"https://www.google.com/maps/search/Bistrot+Paul+Bert+Paris"}]'::jsonb WHERE city='parigi' AND name='Steak-Frites';
UPDATE public.foods SET places = '[{"name":"Au Pied de Cochon","maps_link":"https://www.google.com/maps/search/Au+Pied+de+Cochon+Paris"},{"name":"Chez L Ami Louis","maps_link":"https://www.google.com/maps/search/Chez+L+Ami+Louis+Paris"}]'::jsonb WHERE city='parigi' AND name='Soupe à l''Oignon';
UPDATE public.foods SET places = '[{"name":"Creperie de Josselin","maps_link":"https://www.google.com/maps/search/Creperie+de+Josselin+Paris"},{"name":"Breizh Cafe","maps_link":"https://www.google.com/maps/search/Breizh+Cafe+Paris"}]'::jsonb WHERE city='parigi' AND name='Crêpes Suzette';
UPDATE public.foods SET places = '[{"name":"Allard","maps_link":"https://www.google.com/maps/search/Allard+Paris"},{"name":"Au Pied de Cochon","maps_link":"https://www.google.com/maps/search/Au+Pied+de+Cochon+Paris"}]'::jsonb WHERE city='parigi' AND name='Escargots de Bourgogne';
UPDATE public.foods SET places = '[{"name":"Angelina Paris","maps_link":"https://www.google.com/maps/search/Angelina+Paris"},{"name":"Brasserie Lipp","maps_link":"https://www.google.com/maps/search/Brasserie+Lipp+Paris"}]'::jsonb WHERE city='parigi' AND name='Tarte Tatin';
UPDATE public.foods SET places = '[{"name":"Cafe de Flore","maps_link":"https://www.google.com/maps/search/Cafe+de+Flore+Paris"},{"name":"Le Procope","maps_link":"https://www.google.com/maps/search/Le+Procope+Paris"}]'::jsonb WHERE city='parigi' AND name='Croque-Monsieur';
UPDATE public.foods SET places = '[{"name":"Laduree Saint-Germain","maps_link":"https://www.google.com/maps/search/Laduree+Saint-Germain+Paris"},{"name":"Pierre Herme","maps_link":"https://www.google.com/maps/search/Pierre+Herme+Paris"}]'::jsonb WHERE city='parigi' AND name='Macaron Parisien';

-- ── Londra ────────────────────────────────────────────────────────────────────
UPDATE public.foods SET places = '[{"name":"The Golden Hind","maps_link":"https://www.google.com/maps/search/The+Golden+Hind+London"},{"name":"Rock and Sole Plaice","maps_link":"https://www.google.com/maps/search/Rock+and+Sole+Plaice+London"}]'::jsonb WHERE city='londra' AND name='Fish and Chips';
UPDATE public.foods SET places = '[{"name":"Regency Cafe","maps_link":"https://www.google.com/maps/search/Regency+Cafe+London"},{"name":"E. Pellicci","maps_link":"https://www.google.com/maps/search/E.+Pellicci+London"}]'::jsonb WHERE city='londra' AND name='Full English Breakfast';
UPDATE public.foods SET places = '[{"name":"The Anchor and Hope","maps_link":"https://www.google.com/maps/search/The+Anchor+and+Hope+London"},{"name":"Hawksmoor Seven Dials","maps_link":"https://www.google.com/maps/search/Hawksmoor+Seven+Dials+London"}]'::jsonb WHERE city='londra' AND name='Sunday Roast';
UPDATE public.foods SET places = '[{"name":"Dishoom Covent Garden","maps_link":"https://www.google.com/maps/search/Dishoom+Covent+Garden+London"},{"name":"Gymkhana","maps_link":"https://www.google.com/maps/search/Gymkhana+London"}]'::jsonb WHERE city='londra' AND name='Chicken Tikka Masala';
UPDATE public.foods SET places = '[{"name":"The Wolseley","maps_link":"https://www.google.com/maps/search/The+Wolseley+London"},{"name":"Sketch London","maps_link":"https://www.google.com/maps/search/Sketch+London"}]'::jsonb WHERE city='londra' AND name='Afternoon Tea';
UPDATE public.foods SET places = '[{"name":"M. Manze Bermondsey","maps_link":"https://www.google.com/maps/search/M.+Manze+Bermondsey+London"},{"name":"G. Kelly Pie and Mash","maps_link":"https://www.google.com/maps/search/G.+Kelly+Pie+and+Mash+London"}]'::jsonb WHERE city='londra' AND name='Pie and Mash';
UPDATE public.foods SET places = '[{"name":"Rules Restaurant","maps_link":"https://www.google.com/maps/search/Rules+Restaurant+London"},{"name":"The Ivy","maps_link":"https://www.google.com/maps/search/The+Ivy+London"}]'::jsonb WHERE city='londra' AND name='Eton Mess';
UPDATE public.foods SET places = '[{"name":"The Harwood Arms","maps_link":"https://www.google.com/maps/search/The+Harwood+Arms+London"},{"name":"Borough Market","maps_link":"https://www.google.com/maps/search/Borough+Market+London"}]'::jsonb WHERE city='londra' AND name='Scotch Egg';

-- ── Oslo ──────────────────────────────────────────────────────────────────────
UPDATE public.foods SET places = '[{"name":"Engebret Cafe","maps_link":"https://www.google.com/maps/search/Engebret+Cafe+Oslo"},{"name":"Dovrehallen","maps_link":"https://www.google.com/maps/search/Dovrehallen+Oslo"}]'::jsonb WHERE city='oslo' AND name='Farikal';
UPDATE public.foods SET places = '[{"name":"Kaffistova","maps_link":"https://www.google.com/maps/search/Kaffistova+Oslo"},{"name":"Engebret Cafe","maps_link":"https://www.google.com/maps/search/Engebret+Cafe+Oslo"}]'::jsonb WHERE city='oslo' AND name='Kjottkaker';
UPDATE public.foods SET places = '[{"name":"Theatercafeen","maps_link":"https://www.google.com/maps/search/Theatercafeen+Oslo"},{"name":"Fenaknoken","maps_link":"https://www.google.com/maps/search/Fenaknoken+Oslo"}]'::jsonb WHERE city='oslo' AND name='Rakfisk';
UPDATE public.foods SET places = '[{"name":"Fiskeriet Youngstorget","maps_link":"https://www.google.com/maps/search/Fiskeriet+Youngstorget+Oslo"},{"name":"Engebret Cafe","maps_link":"https://www.google.com/maps/search/Engebret+Cafe+Oslo"}]'::jsonb WHERE city='oslo' AND name='Gravlaks';
UPDATE public.foods SET places = '[{"name":"Mathallen Oslo","maps_link":"https://www.google.com/maps/search/Mathallen+Oslo"},{"name":"Engebret Cafe","maps_link":"https://www.google.com/maps/search/Engebret+Cafe+Oslo"}]'::jsonb WHERE city='oslo' AND name='Reinsdyrgryte';
UPDATE public.foods SET places = '[{"name":"Godt Brod Oslo","maps_link":"https://www.google.com/maps/search/Godt+Brod+Oslo"},{"name":"Apent Bakeri","maps_link":"https://www.google.com/maps/search/Apent+Bakeri+Oslo"}]'::jsonb WHERE city='oslo' AND name='Skillingsbolle';
UPDATE public.foods SET places = '[{"name":"Kaffistova","maps_link":"https://www.google.com/maps/search/Kaffistova+Oslo"},{"name":"Blom Konditori","maps_link":"https://www.google.com/maps/search/Blom+Konditori+Oslo"}]'::jsonb WHERE city='oslo' AND name='Waffle norvegese';
UPDATE public.foods SET places = '[{"name":"Mathallen Oslo","maps_link":"https://www.google.com/maps/search/Mathallen+Oslo"},{"name":"Fenaknoken","maps_link":"https://www.google.com/maps/search/Fenaknoken+Oslo"}]'::jsonb WHERE city='oslo' AND name='Brunost';

-- ── Bergen ────────────────────────────────────────────────────────────────────
UPDATE public.foods SET places = '[{"name":"Enhjorningen","maps_link":"https://www.google.com/maps/search/Enhjorningen+Bergen"},{"name":"To Kokker","maps_link":"https://www.google.com/maps/search/To+Kokker+Bergen"}]'::jsonb WHERE city='bergen' AND name='Bergensk fiskesuppe';
UPDATE public.foods SET places = '[{"name":"Bryggen Tracteursted","maps_link":"https://www.google.com/maps/search/Bryggen+Tracteursted+Bergen"},{"name":"Enhjorningen","maps_link":"https://www.google.com/maps/search/Enhjorningen+Bergen"}]'::jsonb WHERE city='bergen' AND name='Persetorsk';
UPDATE public.foods SET places = '[{"name":"Kafe Kippers","maps_link":"https://www.google.com/maps/search/Kafe+Kippers+Bergen"},{"name":"Lysverket","maps_link":"https://www.google.com/maps/search/Lysverket+Bergen"}]'::jsonb WHERE city='bergen' AND name='Raspeballer';
UPDATE public.foods SET places = '[{"name":"Godt Brod Bergen","maps_link":"https://www.google.com/maps/search/Godt+Brod+Bergen"},{"name":"Sostrene Hagelin","maps_link":"https://www.google.com/maps/search/Sostrene+Hagelin+Bergen"}]'::jsonb WHERE city='bergen' AND name='Skillingsboller';
UPDATE public.foods SET places = '[{"name":"Bryggeloftet og Stuene","maps_link":"https://www.google.com/maps/search/Bryggeloftet+og+Stuene+Bergen"},{"name":"Enhjorningen","maps_link":"https://www.google.com/maps/search/Enhjorningen+Bergen"}]'::jsonb WHERE city='bergen' AND name='Pinnekjott';
UPDATE public.foods SET places = '[{"name":"Fisketorget Bergen","maps_link":"https://www.google.com/maps/search/Fisketorget+Bergen"},{"name":"To Kokker","maps_link":"https://www.google.com/maps/search/To+Kokker+Bergen"}]'::jsonb WHERE city='bergen' AND name='Gravlaks';
UPDATE public.foods SET places = '[{"name":"Kafe Kippers","maps_link":"https://www.google.com/maps/search/Kafe+Kippers+Bergen"},{"name":"Sostrene Hagelin","maps_link":"https://www.google.com/maps/search/Sostrene+Hagelin+Bergen"}]'::jsonb WHERE city='bergen' AND name='Svele';
UPDATE public.foods SET places = '[{"name":"Fisketorget Bergen","maps_link":"https://www.google.com/maps/search/Fisketorget+Bergen"},{"name":"Det Lille Kaffekompaniet","maps_link":"https://www.google.com/maps/search/Det+Lille+Kaffekompaniet+Bergen"}]'::jsonb WHERE city='bergen' AND name='Brunost';

-- ════════════════════════════════════════════════════════════
-- CITY INFO
-- Cancella e reinserisce per le città gestite.
-- Aggiungere la città anche nell'elenco DELETE quando si inserisce.
-- ════════════════════════════════════════════════════════════

DELETE FROM city_info WHERE city IN (
  'roma', 'milano', 'barcellona', 'parigi', 'londra',
  'oslo', 'bergen',
  'vienna', 'bruges', 'copenaghen', 'marsiglia', 'berlino',
  'monaco_di_baviera', 'francoforte', 'atene', 'dublino', 'venezia',
  'amsterdam', 'praga', 'budapest', 'lisbona'
);

-- ── Roma ──────────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'roma', 'Euro (€)', 'Euro (€)', 'Italiano', 'Italian', 'medio',
  'Diffuso nelle zone turistiche, meno nei quartieri locali',
  'Widely spoken in tourist areas, less so in local neighbourhoods',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Ambulanza","label_en":"Ambulance","number":"118"},{"label":"Polizia","label_en":"Police","number":"113"},{"label":"Vigili del fuoco","label_en":"Fire brigade","number":"115"}]',
  '230V — presa tipo F/L (standard europeo + italiana)',
  'Potabile dal rubinetto. I nasoni (fontanelle verdi) erogano acqua fresca gratuita ovunque in citta.',
  'Tap water is safe to drink. The nasoni (small green fountains) provide free fresh water throughout the city.',
  'Non obbligatoria. Al ristorante si arrotonda o si lascia 5-10% se il servizio e stato ottimo.',
  'Not mandatory. At restaurants, rounding up or leaving 5-10% for excellent service is appreciated.',
  $$[{"name":"Moovit","description":"Pianifica percorsi su metro, bus e tram con orari in tempo reale","description_en":"Plan metro, bus and tram routes with real-time schedules","ios_url":"https://apps.apple.com/app/moovit/id498477945","android_url":"https://play.google.com/store/apps/details?id=com.tranzmate"},{"name":"Roma Mobilita","description":"App ufficiale ATAC per metro e bus di Roma","description_en":"Official ATAC app for Rome metro and buses","ios_url":"https://apps.apple.com/it/app/roma-mobilita/id1062913438","android_url":"https://play.google.com/store/apps/details?id=it.atac.romamobilita"},{"name":"Trenitalia","description":"Per treni regionali e gite fuori porta","description_en":"For regional trains and day trips","ios_url":"https://apps.apple.com/it/app/trenitalia/id522343829","android_url":"https://play.google.com/store/apps/details?id=it.trenitalia"}]$$,
  $$[{"name":"TheFork","description":"Prenotazione ristoranti con sconti fino al 50%","description_en":"Restaurant bookings with discounts up to 50%","ios_url":"https://apps.apple.com/app/thefork/id535276978","android_url":"https://play.google.com/store/apps/details?id=com.lafourchette.lafourchette"},{"name":"Google Maps","description":"Navigazione e ricerca luoghi offline","description_en":"Navigation and offline place search","ios_url":"https://apps.apple.com/app/google-maps/id585027354","android_url":"https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}]$$,
  ARRAY['Valida il biglietto PRIMA di salire su bus e tram: i controllori multano senza preavviso','Il biglietto singolo dura 100 minuti e vale per una corsa metro + bus illimitati','Evita i taxi non ufficiali fuori Termini: usa sempre taxi bianchi con tassametro o Uber','Molti musei statali sono gratuiti la prima domenica del mese',$$Portare sempre acqua: le estati romane sono torride e l'ombra e scarsa$$],
  ARRAY['Validate your ticket BEFORE boarding buses and trams — inspectors fine without warning','A single ticket lasts 100 minutes and covers one metro ride + unlimited buses','Avoid unofficial taxis outside Termini station: use white official cabs with meters or Uber','Many state museums are free on the first Sunday of every month','Always carry water: Roman summers are scorching and shade is scarce']
);

-- ── Milano ────────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'milano', 'Euro (€)', 'Euro (€)', 'Italiano', 'Italian', 'medio',
  'Buon livello nel centro e nelle zone di moda e design, meno diffuso nei quartieri periferici',
  'Good level in the centre and fashion/design districts, less common in outer neighbourhoods',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Ambulanza","label_en":"Ambulance","number":"118"},{"label":"Polizia","label_en":"Police","number":"113"}]',
  '230V — presa tipo F/L (standard europeo + italiana)',
  'Potabile e di buona qualita. Le fontanelle pubbliche sono sicure.',
  'Safe to drink and good quality. Public fountains are safe.',
  'Non obbligatoria. Al bar e al ristorante si arrotonda o si lascia 1-2€ al bancone.',
  'Not mandatory. At bars and restaurants, rounding up or leaving €1-2 at the counter is customary.',
  $$[{"name":"ATM Milano","description":"App ufficiale per metro, tram e bus di Milano con orari in tempo reale","description_en":"Official app for Milan metro, trams and buses with real-time schedules","ios_url":"https://apps.apple.com/it/app/atm-milano/id635490946","android_url":"https://play.google.com/store/apps/details?id=it.atm.app"},{"name":"Moovit","description":"Pianificazione percorsi multimodale","description_en":"Multimodal route planning","ios_url":"https://apps.apple.com/app/moovit/id498477945","android_url":"https://play.google.com/store/apps/details?id=com.tranzmate"},{"name":"BikeMi","description":"Bike sharing ufficiale di Milano","description_en":"Milan official bike-sharing service","ios_url":"https://apps.apple.com/it/app/bikemi/id556577567","android_url":"https://play.google.com/store/apps/details?id=com.cbw.bikemi"}]$$,
  $$[{"name":"Satispay","description":"Pagamenti digitali molto usati nei locali milanesi","description_en":"Digital payments widely used in Milan venues","ios_url":"https://apps.apple.com/it/app/satispay/id982085702","android_url":"https://play.google.com/store/apps/details?id=com.satispay.customer"},{"name":"Google Maps","description":"Navigazione e ricerca luoghi","description_en":"Navigation and place search","ios_url":"https://apps.apple.com/app/google-maps/id585027354","android_url":"https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}]$$,
  ARRAY[$$L'aperitivo milanese (dalle 18:00) include spesso un ricco buffet gratuito con la consumazione$$,'La domenica molte zone dello shopping (Quadrilatero della Moda) sono chiuse','Il trasporto notturno (Notte) copre le principali linee ma con frequenza ridotta','Valida sempre il biglietto: i controllori ATM sono molto presenti','Per la Fashion Week e il Salone del Mobile i prezzi degli hotel triplicano: prenota mesi prima'],
  ARRAY[$$Milan's aperitivo (from 6 pm) often includes a generous free buffet with your drink$$,'On Sundays many shopping areas (Quadrilatero della Moda) are closed','Night transport covers main lines but with reduced frequency','Always validate your ticket: ATM inspectors are very active','During Fashion Week and Salone del Mobile hotel prices triple — book months in advance']
);

-- ── Barcellona ────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'barcellona', 'Euro (€)', 'Euro (€)', 'Catalano e Castigliano (Spagnolo)', 'Catalan and Castilian (Spanish)', 'alto',
  'Ottimo nelle zone turistiche e tra i giovani. I segnali stradali sono in catalano.',
  'Excellent in tourist areas and among young people. Street signs are in Catalan.',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Polizia Nazionale","label_en":"National Police","number":"091"},{"label":"Ambulanza","label_en":"Ambulance","number":"061"}]',
  '230V — presa tipo F (standard europeo)',
  $$Tecnicamente potabile, ma il sapore di cloro e marcato. Molti locali consigliano l'acqua in bottiglia.$$,
  'Technically drinkable, but the chlorine taste is strong. Many locals recommend bottled water.',
  'Non obbligatoria ma apprezzata. Al ristorante si lascia il 5-10%, al bar si arrotonda.',
  'Not mandatory but appreciated. Leave 5-10% at restaurants, round up at bars.',
  $$[{"name":"TMB App","description":"App ufficiale per metro e bus di Barcellona con mappe e orari","description_en":"Official app for Barcelona metro and buses with maps and timetables","ios_url":"https://apps.apple.com/app/tmb-app/id1076566093","android_url":"https://play.google.com/store/apps/details?id=cat.tmb.appandroid"},{"name":"Moovit","description":"Pianificazione percorsi e orari in tempo reale","description_en":"Route planning and real-time schedules","ios_url":"https://apps.apple.com/app/moovit/id498477945","android_url":"https://play.google.com/store/apps/details?id=com.tranzmate"},{"name":"Bicing","description":"Bike sharing pubblico di Barcellona (richiede abbonamento mensile)","description_en":"Barcelona public bike-sharing (requires monthly subscription)","ios_url":"https://apps.apple.com/es/app/bicing/id1475440734","android_url":"https://play.google.com/store/apps/details?id=com.bsmsa.bicing"}]$$,
  $$[{"name":"Cabify","description":"Alternativa locale a Uber per taxi e NCC","description_en":"Local alternative to Uber for taxis and private hire","ios_url":"https://apps.apple.com/app/cabify/id476087442","android_url":"https://play.google.com/store/apps/details?id=com.cabify.rider"},{"name":"Google Maps","description":"Navigazione con modalita trasporto pubblico integrata","description_en":"Navigation with integrated public transport mode","ios_url":"https://apps.apple.com/app/google-maps/id585027354","android_url":"https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}]$$,
  ARRAY['La T-Casual (10 viaggi) e la tessera piu conveniente per chi resta pochi giorni','Attenzione ai borseggiatori sulle Ramblas e sulla metro: tieni lo zaino davanti','I ristoranti aprono tardi: pranzo dalle 14:00, cena dalle 21:00. Presentarsi prima significa trovare il locale vuoto','La spiaggia e raggiungibile con la metro linea 4 (gialla) fino a Barceloneta','Uber non e disponibile: usa Cabify o i taxi ufficiali (con tassametro)'],
  ARRAY['The T-Casual (10 trips) is the most convenient card for short stays','Watch out for pickpockets on Las Ramblas and the metro — keep your bag in front of you','Restaurants open late: lunch from 2 pm, dinner from 9 pm. Arriving earlier means an empty restaurant','The beach is reachable by metro line 4 (yellow) to Barceloneta','Uber is not available — use Cabify or official taxis (with meter)']
);

-- ── Parigi ────────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'parigi', 'Euro (€)', 'Euro (€)', 'Francese', 'French', 'medio',
  'Nelle zone turistiche si, ma i parigini apprezzano molto un tentativo in francese (anche solo Bonjour!)',
  'English is spoken in tourist areas, but Parisians greatly appreciate even a brief attempt in French (even just Bonjour!)',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"SAMU (ambulanza)","label_en":"SAMU (ambulance)","number":"15"},{"label":"Polizia","label_en":"Police","number":"17"},{"label":"Pompieri","label_en":"Fire brigade","number":"18"}]',
  '230V — presa tipo E (standard francese/europeo)',
  'Potabile e di ottima qualita. Esistono fontanelle pubbliche gratuite in tutta la citta (mappa su Eau de Paris).',
  'Safe to drink and excellent quality. Free public fountains are available across the city (map on Eau de Paris website).',
  'Non obbligatoria: il servizio e incluso nel prezzo per legge. Si lascia 1-2€ al bar, 5-10% al ristorante.',
  $$Not mandatory: service charge is included by law. Leave €1-2 at cafes, 5-10% at restaurants if you're happy with the service.$$,
  $$[{"name":"RATP","description":"App ufficiale per metro, RER, bus e tram parigini con orari in tempo reale","description_en":"Official app for Paris metro, RER, buses and trams with real-time info","ios_url":"https://apps.apple.com/app/ratp/id507107090","android_url":"https://play.google.com/store/apps/details?id=com.fabernovel.ratp"},{"name":"Citymapper","description":"Pianificazione percorsi avanzata con tutte le modalita di trasporto","description_en":"Advanced route planning covering all transport modes","ios_url":"https://apps.apple.com/app/citymapper/id469463298","android_url":"https://play.google.com/store/apps/details?id=com.citymapper.app.release"},{"name":"Velib Metropole","description":"Bike sharing con oltre 1.400 stazioni in citta","description_en":"Bike-sharing with over 1,400 stations across the city","ios_url":"https://apps.apple.com/fr/app/velib-metropole/id1360768361","android_url":"https://play.google.com/store/apps/details?id=com.massmob.velib"}]$$,
  $$[{"name":"Ile-de-France Mobilites","description":"Acquisto biglietti Navigo e abbonamenti ufficiali","description_en":"Buy Navigo tickets and official transport passes","ios_url":"https://apps.apple.com/fr/app/ile-de-france-mobilites/id1440799600","android_url":"https://play.google.com/store/apps/details?id=fr.iledefrance.mobilites.journey"},{"name":"Google Maps","description":"Navigazione e ricerca luoghi con modalita offline","description_en":"Navigation and offline place search","ios_url":"https://apps.apple.com/app/google-maps/id585027354","android_url":"https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}]$$,
  ARRAY['Inizia sempre con Bonjour Madame/Monsieur: i parigini rispondono molto meglio','Il Navigo Easy (ricaricabile) e piu conveniente dei biglietti singoli se fai piu di 2 corse al giorno','Molti musei (Louvre, Orsay) esauriscono i biglietti online settimane prima: prenota sempre in anticipo','Le brasserie e i bistrot servono cibo anche fuori dagli orari canonici: utile se arrivi tardi','Le zone periferiche (oltre il Peripherique) hanno poca connessione metro: pianifica bene gli spostamenti'],
  ARRAY['Always start with Bonjour Madame/Monsieur — Parisians respond much better','The Navigo Easy (rechargeable card) is cheaper than single tickets if you take more than 2 trips a day','Major museums (Louvre, Orsay) sell out online weeks ahead — always book in advance','Brasseries and bistros serve food outside standard meal times — handy if you arrive late','Outer districts (beyond the Peripherique) have limited metro access — plan journeys carefully']
);

-- ── Londra ────────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'londra', 'Sterlina britannica (£)', 'British Pound (£)', 'Inglese', 'English', 'alto',
  'E la lingua ufficiale. Molti quartieri sono pero molto multiculturali.',
  'English is the official language. Many neighbourhoods are however highly multicultural.',
  'GMT (UTC+0) — ora legale BST (UTC+1)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"999"},{"label":"Emergenze (alternativo)","label_en":"Emergency (alternative)","number":"112"},{"label":"Polizia non urgente","label_en":"Non-emergency police","number":"101"}]',
  $$230V — presa tipo G (UK, 3 pin rettangolari). Serve adattatore dall'Europa!$$,
  $$Potabile e di ottima qualita. L'acqua londinese e una delle migliori d'Europa.$$,
  'Safe to drink and excellent quality. London tap water is among the best in Europe.',
  'Al ristorante il 10-15% e prassi consolidata, spesso gia incluso come "service charge". Controlla prima.',
  $$In restaurants, 10-15% is standard practice, often already included as a "service charge". Check before adding extra.$$,
  $$[{"name":"TfL Go","description":"App ufficiale Transport for London per tube, bus, Elizabeth line e Overground","description_en":"Official Transport for London app for tube, buses, Elizabeth line and Overground","ios_url":"https://apps.apple.com/app/tfl-go/id1489085913","android_url":"https://play.google.com/store/apps/details?id=uk.gov.tfl.tflgo"},{"name":"Citymapper","description":"Il migliore per Londra: pianifica percorsi combinando tube, bus, bici e monopattini","description_en":"The best for London: plans routes combining tube, bus, bike and scooters","ios_url":"https://apps.apple.com/app/citymapper/id469463298","android_url":"https://play.google.com/store/apps/details?id=com.citymapper.app.release"}]$$,
  $$[{"name":"Uber","description":"Taxi e NCC ampiamente disponibili e affidabili a Londra","description_en":"Widely available and reliable taxis and private hire in London","ios_url":"https://apps.apple.com/app/uber/id368677368","android_url":"https://play.google.com/store/apps/details?id=com.ubercab"},{"name":"Bolt","description":"Alternativa economica a Uber per gli spostamenti in citta","description_en":"Budget alternative to Uber for city journeys","ios_url":"https://apps.apple.com/app/bolt-request-a-ride/id675033630","android_url":"https://play.google.com/store/apps/details?id=ee.mtakso.client"}]$$,
  ARRAY['Usa una contactless card direttamente sui tornelli: e il modo piu conveniente per pagare i mezzi',$$La presa elettrica e diversa dall'Europa: porta sempre un adattatore tipo G$$,'La maggior parte dei grandi musei e gratuita: British Museum, National Gallery, V&A, Tate Modern','Stai a sinistra sulle scale mobili della metro, passa a destra: e una regola sociale molto rispettata','Le Oyster card e le contactless applicano automaticamente il price cap giornaliero: non pagherai mai piu del necessario'],
  ARRAY[$$Use a contactless card directly on the barriers — it's the easiest and cheapest way to pay for transport$$,'UK plug sockets are different from Europe — always bring a Type G adaptor','Most major museums are free: British Museum, National Gallery, V&A, Tate Modern','Stand on the right on escalators, walk on the left — this is a strongly observed social rule',$$Oyster cards and contactless payments automatically apply the daily price cap — you'll never overpay$$]
);

-- ── Oslo ──────────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'oslo', 'Corona norvegese (kr / NOK)', 'Norwegian Krone (kr / NOK)', 'Norvegese (Bokmal)', 'Norwegian (Bokmal)', 'alto',
  'Praticamente tutti parlano inglese fluentemente, anche negli esercizi commerciali e sui mezzi pubblici.',
  'Virtually everyone speaks fluent English, including in shops and on public transport.',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Polizia","label_en":"Police","number":"02800"},{"label":"Ambulanza","label_en":"Ambulance","number":"113"},{"label":"Vigili del fuoco","label_en":"Fire brigade","number":"110"}]',
  '230V — presa tipo F (standard europeo)',
  $$Potabile direttamente dal rubinetto, ottima qualita. Una delle migliori acque d'Europa.$$,
  'Safe and excellent quality from the tap. One of the best-tasting waters in Europe.',
  'Non obbligatoria, ma apprezzata. Nei ristoranti si arrotonda o si lascia il 10% per un servizio ottimo.',
  'Not mandatory but appreciated. At restaurants, rounding up or leaving 10% for great service is welcomed.',
  $$[{"name":"Ruter","description":"App ufficiale per metro, tram, bus e traghetti di Oslo con biglietti integrati","description_en":"Official app for Oslo metro, trams, buses and ferries with integrated tickets","ios_url":"https://apps.apple.com/no/app/ruter/id694799270","android_url":"https://play.google.com/store/apps/details?id=no.ruter.reise"},{"name":"Moovit","description":"Pianificazione percorsi con orari in tempo reale","description_en":"Route planning with real-time schedules","ios_url":"https://apps.apple.com/app/moovit/id498477945","android_url":"https://play.google.com/store/apps/details?id=com.tranzmate"},{"name":"Vy (NSB)","description":"Treni regionali e intercity in tutta la Norvegia","description_en":"Regional and intercity trains across Norway","ios_url":"https://apps.apple.com/no/app/vy/id475845822","android_url":"https://play.google.com/store/apps/details?id=no.vy.reise"}]$$,
  $$[{"name":"Bolt","description":"Taxi e scooter elettrici, molto usati a Oslo come alternativa ai mezzi","description_en":"Taxis and electric scooters, widely used in Oslo as a transport alternative","ios_url":"https://apps.apple.com/app/bolt-request-a-ride/id675033630","android_url":"https://play.google.com/store/apps/details?id=ee.mtakso.client"},{"name":"Google Maps","description":"Navigazione e ricerca luoghi con modalita offline","description_en":"Navigation and offline place search","ios_url":"https://apps.apple.com/app/google-maps/id585027354","android_url":"https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}]$$,
  ARRAY[$$Oslo e una delle citta piu costose d'Europa: tieni un budget piu alto del solito, specialmente per cibo e alcol$$,'Compra i biglietti Ruter in anticipo sull app: i controllori multano pesantemente chi non ha il titolo valido','I traghetti del fiordo (Oslofjord) sono inclusi nei titoli di trasporto ordinari: usali per esplorare le isole','Il Mercato di Mathallen e il posto migliore per assaggiare prodotti locali a prezzi ragionevoli','In estate fa luce fino alle 23:00: porta una mascherina per dormire se sei sensibile alla luce'],
  ARRAY['Oslo is one of the most expensive cities in Europe — budget higher than usual, especially for food and alcohol','Buy Ruter tickets in advance on the app: inspectors issue heavy fines for invalid tickets','Oslofjord ferries are included in standard transport tickets — use them to explore the islands','Mathallen Market is the best place to sample local products at reasonable prices','In summer it stays light until 11 pm — bring a sleep mask if you are sensitive to light']
);

-- ── Bergen ────────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'bergen', 'Corona norvegese (kr / NOK)', 'Norwegian Krone (kr / NOK)', 'Norvegese (Bokmal)', 'Norwegian (Bokmal)', 'alto',
  'Inglese parlato fluentemente da quasi tutti. Bergen e abituata ai turisti internazionali.',
  'English spoken fluently by almost everyone. Bergen is well accustomed to international visitors.',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Polizia","label_en":"Police","number":"02800"},{"label":"Ambulanza","label_en":"Ambulance","number":"113"},{"label":"Vigili del fuoco","label_en":"Fire brigade","number":"110"}]',
  '230V — presa tipo F (standard europeo)',
  'Potabile direttamente dal rubinetto, fresca e di ottima qualita.',
  'Safe and excellent quality directly from the tap, fresh and clean.',
  'Non obbligatoria. Nei ristoranti si arrotonda o si lascia il 10% per un servizio ottimo.',
  'Not mandatory. At restaurants, rounding up or leaving 10% for excellent service is appreciated.',
  $$[{"name":"Skyss","description":"App ufficiale per bus e funicolare Flobanen di Bergen con biglietti digitali","description_en":"Official app for Bergen buses and Flobanen funicular with digital tickets","ios_url":"https://apps.apple.com/no/app/skyss/id897809311","android_url":"https://play.google.com/store/apps/details?id=no.skyss.reise"},{"name":"Vy (NSB)","description":"Treni per Oslo e altre citta norvegesi (la tratta Bergen-Oslo e spettacolare)","description_en":"Trains to Oslo and other Norwegian cities (the Bergen-Oslo route is spectacular)","ios_url":"https://apps.apple.com/no/app/vy/id475845822","android_url":"https://play.google.com/store/apps/details?id=no.vy.reise"},{"name":"Moovit","description":"Pianificazione percorsi multimodale","description_en":"Multimodal route planning","ios_url":"https://apps.apple.com/app/moovit/id498477945","android_url":"https://play.google.com/store/apps/details?id=com.tranzmate"}]$$,
  $$[{"name":"Bolt","description":"Taxi e scooter elettrici disponibili anche a Bergen","description_en":"Taxis and electric scooters available in Bergen too","ios_url":"https://apps.apple.com/app/bolt-request-a-ride/id675033630","android_url":"https://play.google.com/store/apps/details?id=ee.mtakso.client"},{"name":"Google Maps","description":"Navigazione e ricerca luoghi","description_en":"Navigation and place search","ios_url":"https://apps.apple.com/app/google-maps/id585027354","android_url":"https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}]$$,
  ARRAY[$$Bergen e la citta piu piovosa d'Europa: porta sempre un impermeabile anche d'estate, le previsioni cambiano in pochi minuti$$,'Il Flobanen (funicolare) vale assolutamente il biglietto: la vista su fiordi e tetti e impagabile','Il Fisketorget (Mercato del Pesce) e ottimo per assaggiare pesce fresco, ma i prezzi sono turistici','La tratta ferroviaria Bergen-Oslo e una delle piu belle del mondo: se hai tempo, falla in treno','Bergen e molto camminabile: il centro storico, Bryggen e Nordnes si esplorano benissimo a piedi'],
  ARRAY[$$Bergen is the rainiest city in Europe — always carry a waterproof jacket, even in summer, as weather changes in minutes$$,'The Flobanen funicular is absolutely worth the ticket — the view over the fjords and rooftops is priceless','The Fisketorget Fish Market is great for fresh fish tastings but prices are touristy and high','The Bergen-Oslo railway is one of the most beautiful in the world — if you have time, take the train','Bergen is very walkable: the historic centre, Bryggen and Nordnes are all excellent on foot']
);

-- ── Vienna ────────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'vienna', 'Euro (€)', 'Euro (€)', 'Tedesco', 'German', 'alto',
  'Ottimo livello in tutta la citta, specialmente nelle zone turistiche e tra i giovani viennesi.',
  'Excellent level throughout the city, especially in tourist areas and among young Viennese.',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Polizia","label_en":"Police","number":"133"},{"label":"Ambulanza","label_en":"Ambulance","number":"144"},{"label":"Vigili del fuoco","label_en":"Fire brigade","number":"122"}]',
  '230V — presa tipo F (standard europeo)',
  $$Potabile e di eccellente qualita. L'acqua del rubinetto di Vienna proviene dalle Alpi ed e considerata tra le migliori d'Europa.$$,
  $$Safe to drink and excellent quality. Vienna's tap water comes from the Alps and is considered among the best in Europe.$$,
  'Il 10% e la consuetudine generale. Si arrotonda il conto o si aggiunge circa il 10% per un servizio ottimo.',
  'Around 10% is standard practice. Round up the bill or add about 10% for excellent service.',
  $$[{"name":"Wiener Linien","description":"App ufficiale per metro (U-Bahn), tram e bus di Vienna con biglietti digitali integrati","description_en":"Official app for Vienna metro (U-Bahn), trams and buses with integrated digital tickets","ios_url":"https://apps.apple.com/at/app/wiener-linien/id370820118","android_url":"https://play.google.com/store/apps/details?id=at.wienerlinien.wienmobil"},{"name":"WienMobil","description":"App multimodale che integra mezzi pubblici, bici, car sharing e taxi in un unico pianificatore","description_en":"Multimodal app integrating public transport, bikes, car sharing and taxis in one planner","ios_url":"https://apps.apple.com/at/app/wienmobil/id1062535791","android_url":"https://play.google.com/store/apps/details?id=at.wienerlinien.wienmobil"},{"name":"ÖBB","description":"Treni regionali e nazionali austriaci, utile per gite fuori porta (Salisburgo, Innsbruck)","description_en":"Austrian regional and national trains, useful for day trips (Salzburg, Innsbruck)","ios_url":"https://apps.apple.com/at/app/obb/id1189060681","android_url":"https://play.google.com/store/apps/details?id=at.oebb.ts"}]$$,
  $$[{"name":"Uber","description":"Taxi e NCC disponibili e affidabili a Vienna","description_en":"Reliable taxis and private hire available in Vienna","ios_url":"https://apps.apple.com/app/uber/id368677368","android_url":"https://play.google.com/store/apps/details?id=com.ubercab"},{"name":"Google Maps","description":"Navigazione e ricerca luoghi con modalita offline","description_en":"Navigation and offline place search","ios_url":"https://apps.apple.com/app/google-maps/id585027354","android_url":"https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}]$$,
  ARRAY[$$La Vienna Card (24/48/72h) include metro illimitata e sconti in oltre 200 musei e attrazioni: vale quasi sempre la pena$$,$$I Kaffeehäuser storici sono patrimonio culturale UNESCO: siediti a leggere un giornale come fanno i viennesi, senza fretta$$,'Il Naschmarkt apre dal martedi al sabato: evita la domenica perche e chiuso','In estate prenota l''Opera di Stato con mesi di anticipo oppure acquista i biglietti in piedi (Stehplatze) il giorno stesso a 3€',$$Le fontanelle pubbliche (Trinkbrunnen) distribuiscono acqua di montagna gratuita in tutta la citta: approfitta$$],
  ARRAY[$$The Vienna Card (24/48/72h) includes unlimited metro and discounts at over 200 museums and attractions — almost always worth buying$$,$$Historic Kaffeehäuser are a UNESCO Cultural Heritage: sit down, read a newspaper like the Viennese do, and take your time$$,'The Naschmarkt runs Tuesday to Saturday — avoid Sundays as it is closed','In summer book the State Opera months in advance, or buy standing tickets (Stehplätze) the same day for €3',$$Public fountains (Trinkbrunnen) dispense free mountain water throughout the city — make the most of them$$]
);

-- ── Bruges ────────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'bruges', 'Euro (€)', 'Euro (€)', 'Olandese (fiammingo)', 'Dutch (Flemish)', 'alto',
  'Ottimo livello ovunque. I bruggiani parlano spesso tre o quattro lingue e sono abituati ai turisti internazionali.',
  'Excellent level everywhere. Bruges residents often speak three or four languages and are well used to international visitors.',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Polizia","label_en":"Police","number":"101"},{"label":"Ambulanza","label_en":"Ambulance","number":"100"},{"label":"Vigili del fuoco","label_en":"Fire brigade","number":"100"}]',
  '230V — presa tipo E (standard europeo, compatibile tipo F)',
  'Potabile e di buona qualita.',
  'Safe to drink and good quality.',
  'Non obbligatoria. Al ristorante si lascia il 10% per un servizio eccellente o si arrotonda il conto.',
  'Not mandatory. Leave 10% at restaurants for excellent service or simply round up the bill.',
  $$[{"name":"De Lijn","description":"Bus urbani e regionali nelle Fiandre, incluse le linee di Bruges","description_en":"Urban and regional buses in Flanders, including Bruges city lines","ios_url":"https://apps.apple.com/be/app/de-lijn/id455024390","android_url":"https://play.google.com/store/apps/details?id=be.delijn.android"},{"name":"NMBS/SNCB","description":"Treni belgi nazionali, ottimi per raggiungere Bruxelles e Gand","description_en":"Belgian national trains, excellent for reaching Brussels and Ghent","ios_url":"https://apps.apple.com/be/app/sncb-nmbs/id403064357","android_url":"https://play.google.com/store/apps/details?id=be.sncbnmbs.b2cmobile"}]$$,
  $$[{"name":"Uber","description":"Disponibile a Bruges per spostamenti rapidi","description_en":"Available in Bruges for quick trips","ios_url":"https://apps.apple.com/app/uber/id368677368","android_url":"https://play.google.com/store/apps/details?id=com.ubercab"},{"name":"Google Maps","description":"Navigazione e ricerca luoghi, ottimo per esplorare a piedi","description_en":"Navigation and place search, excellent for walking exploration","ios_url":"https://apps.apple.com/app/google-maps/id585027354","android_url":"https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}]$$,
  ARRAY['Bruges si esplora comodamente a piedi: il centro storico UNESCO e compatto e tutto raggiungibile in 20 minuti','Noleggia una bicicletta per esplorare i canali e la campagna intorno alla citta: e il modo migliore per vivere Bruges come un locale','Evita il centro nei weekend di luglio e agosto: e letteralmente sopraffatto dai turisti, preferisci i giorni feriali','Le migliori cioccolaterie si trovano lontano dalla Markt: esplora le vie laterali per prezzi e qualita migliori','I canal boat tours durano 30 minuti e offrono una prospettiva unica sul centro medievale: prenota in anticipo in alta stagione'],
  ARRAY['Bruges is best explored on foot: the UNESCO historic centre is compact and everything is reachable in 20 minutes','Rent a bicycle to explore the canals and surrounding countryside: the best way to experience Bruges like a local',$$Avoid the centre on July and August weekends — it's literally overrun with tourists; weekdays are far better$$,'The best chocolatiers are away from the Markt: explore the side streets for better prices and quality','Canal boat tours last 30 minutes and offer a unique perspective on the medieval centre — book ahead in peak season']
);

-- ── Copenaghen ────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'copenaghen', 'Corona danese (kr / DKK)', 'Danish Krone (kr / DKK)', 'Danese', 'Danish', 'alto',
  'Praticamente universale. I danesi parlano inglese con accento quasi perfetto, spesso meglio di molti madrelingua.',
  'Practically universal. Danes speak English with a near-perfect accent, often better than many native speakers.',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Polizia (non urgente)","label_en":"Police (non-urgent)","number":"114"},{"label":"Pronto soccorso (non urgente)","label_en":"Medical helpline (non-urgent)","number":"1813"}]',
  '230V — presa tipo F (standard europeo) o tipo K (danese, compatibile)',
  $$Potabile e di eccellente qualita. L'acqua del rubinetto di Copenaghen e tra le piu pure d'Europa.$$,
  $$Safe to drink and excellent quality. Copenhagen's tap water is among the purest in Europe.$$,
  'Non usuale in Danimarca. Il prezzo del menu include gia tutto: non c''e pressione sociale per lasciare la mancia.',
  'Not common in Denmark. Menu prices include everything — there is no social pressure to tip.',
  $$[{"name":"Rejseplanen","description":"App ufficiale per pianificare percorsi su metro, bus, treni e traghetti in Danimarca","description_en":"Official app for planning routes on metro, buses, trains and ferries across Denmark","ios_url":"https://apps.apple.com/dk/app/rejseplanen/id317545623","android_url":"https://play.google.com/store/apps/details?id=dk.rejseplanen.rejseplanen"},{"name":"DOT Tickets","description":"Biglietti digitali per mezzi pubblici di Copenaghen (metro, bus, treni regionali)","description_en":"Digital tickets for Copenhagen public transport (metro, buses, regional trains)","ios_url":"https://apps.apple.com/dk/app/dot-tickets/id1484830430","android_url":"https://play.google.com/store/apps/details?id=dk.movia.midttrafik.dot"}]$$,
  $$[{"name":"Donkey Republic","description":"Noleggio bici senza stazione in tutta Copenaghen: il modo migliore per muoversi come i locali","description_en":"Dockless bike rental across Copenhagen: the best way to get around like a local","ios_url":"https://apps.apple.com/app/donkey-republic/id931261924","android_url":"https://play.google.com/store/apps/details?id=com.donkeyrepublic.bike"},{"name":"Google Maps","description":"Navigazione con modalita bici e trasporto pubblico integrate","description_en":"Navigation with integrated cycling and public transport modes","ios_url":"https://apps.apple.com/app/google-maps/id585027354","android_url":"https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}]$$,
  ARRAY[$$La Copenhagen Card include metro, bus e treni regionali illimitati piu ingresso a oltre 90 attrazioni: conveniente da 2 giorni in su$$,'La moneta e la corona danese (DKK), non l''euro: verifica il tasso di cambio prima di prelevare','Copenaghen e la citta ciclistica per eccellenza: noleggia una bici e muoviti come i locali su piste dedicate sicure','I supermercati chiudono relativamente presto (20:00-22:00): organizza la spesa entro quella fascia oraria',$$Lo smørrebrød si mangia tradizionalmente a pranzo, non a cena: rispetta questa tradizione per l'esperienza piu autentica$$],
  ARRAY[$$The Copenhagen Card covers unlimited metro, buses and regional trains plus entry to over 90 attractions — great value from 2 days$$,'The currency is the Danish krone (DKK), not euros — check the exchange rate before withdrawing cash','Copenhagen is the ultimate cycling city: rent a bike and move like locals on safe dedicated lanes','Supermarkets close relatively early (8–10 pm) — plan your shopping within that window','Smørrebrød is traditionally a lunch dish, not dinner — follow this tradition for the most authentic experience']
);

-- ── Marsiglia ────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'marsiglia', 'Euro (€)', 'Euro (€)', 'Francese', 'French', 'medio',
  'Livello medio-basso rispetto ad altre grandi citta francesi. I marsigliesi sono orgogliosi della loro identita locale e del francese come lingua principale.',
  'Medium to low level compared to other major French cities. Marseillais are proud of their local identity and use French as their primary language.',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Polizia","label_en":"Police","number":"17"},{"label":"Ambulanza (SAMU)","label_en":"Ambulance (SAMU)","number":"15"},{"label":"Vigili del fuoco","label_en":"Fire brigade","number":"18"}]',
  '230V — presa tipo E (standard francese, compatibile tipo F)',
  'Tecnicamente potabile, ma il sapore puo variare. Molti marsigliesi preferiscono acqua in bottiglia.',
  'Technically drinkable, but the taste can vary. Many Marseillais prefer bottled water.',
  'Non obbligatoria. Al ristorante si lascia il 5-10% per un servizio eccellente.',
  'Not mandatory. Leave 5-10% at restaurants for excellent service.',
  $$[{"name":"RTM","description":"App ufficiale dei mezzi pubblici di Marsiglia: metro, tram, bus e biglietti integrati","description_en":"Official Marseille public transport app: metro, tram, buses and integrated tickets","ios_url":"https://apps.apple.com/fr/app/rtm/id1058985988","android_url":"https://play.google.com/store/apps/details?id=fr.marseilleprovence.rtm"},{"name":"SNCF Connect","description":"Treni regionali e intercity, ottimo per gite sulla Costa Azzurra (Nizza, Cannes)","description_en":"Regional and intercity trains, excellent for day trips to the Riviera (Nice, Cannes)","ios_url":"https://apps.apple.com/fr/app/sncf-connect/id343889987","android_url":"https://play.google.com/store/apps/details?id=com.vsct.vsc.nouvelleentite"}]$$,
  $$[{"name":"Cityscoot","description":"Scooter elettrici in condivisione, molto usati a Marsiglia per evitare il traffico","description_en":"Shared electric scooters, widely used in Marseille to avoid traffic","ios_url":"https://apps.apple.com/fr/app/cityscoot/id1010608453","android_url":"https://play.google.com/store/apps/details?id=fr.cityscoot.app"},{"name":"Google Maps","description":"Navigazione con trasporto pubblico integrato","description_en":"Navigation with integrated public transport","ios_url":"https://apps.apple.com/app/google-maps/id585027354","android_url":"https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}]$$,
  ARRAY[$$Marsiglia ha una reputazione esagerata per la sicurezza: le zone turistiche (Vieux-Port, Panier, Corniche) sono sicure; evita le periferie di notte$$,'Il Vieux-Port e il cuore della citta: inizia sempre da qui la tua esplorazione e torna per il tramonto','La bouillabaisse autentica costa tra 50 e 80 euro a persona: diffida delle versioni economiche, non sono originali','Il MuCEM (Museo delle Civilta d''Europa e del Mediterraneo) e uno dei piu belli di Francia: non perderlo','Il pastis si beve sempre diluito 5:1 con acqua fredda: mai liscio, e una regola non scritta'],
  ARRAY[$$Marseille's reputation for safety is exaggerated: tourist areas (Vieux-Port, Panier, Corniche) are safe — avoid outlying suburbs at night$$,'The Vieux-Port is the heart of the city: always start here and return for sunset','Authentic bouillabaisse costs €50–80 per person — be wary of cheap versions, they are not the real thing','The MuCEM (Museum of European and Mediterranean Civilisations) is one of the finest in France: do not miss it','Pastis is always drunk diluted 5:1 with cold water: never straight — this is an unwritten rule']
);

-- ── Berlino ────────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'berlino', 'Euro (€)', 'Euro (€)', 'Tedesco', 'German', 'alto',
  'Ottimo livello specialmente a Mitte, Prenzlauer Berg e Kreuzberg. I giovani berlinesi parlano inglese fluentemente.',
  'Excellent level especially in Mitte, Prenzlauer Berg and Kreuzberg. Young Berliners speak fluent English.',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Polizia","label_en":"Police","number":"110"},{"label":"Ambulanza","label_en":"Ambulance","number":"112"}]',
  '230V — presa tipo F (standard europeo)',
  'Potabile e di buona qualita. Leggermente calcarea ma sicura e gratuita al rubinetto.',
  'Safe and good quality. Slightly hard but safe and free from the tap.',
  '5-10% e la consuetudine standard. Si arrotonda o si comunica la cifra desiderata al cameriere al momento del pagamento.',
  '5-10% is standard practice. Round up or tell the waiter the amount you wish to pay when settling the bill.',
  $$[{"name":"BVG Jelbi","description":"App ufficiale per metro (U-Bahn), S-Bahn, tram, bus e monopattini di Berlino con biglietti digitali","description_en":"Official app for Berlin metro (U-Bahn), S-Bahn, trams, buses and scooters with digital tickets","ios_url":"https://apps.apple.com/de/app/bvg-jelbi/id1364536072","android_url":"https://play.google.com/store/apps/details?id=de.bvg.jelbi"},{"name":"DB Navigator","description":"Treni regionali e intercity tedeschi, ottimo per gite fuori porta (Dresda, Amburgo, Potsdam)","description_en":"German regional and intercity trains, excellent for day trips (Dresden, Hamburg, Potsdam)","ios_url":"https://apps.apple.com/de/app/db-navigator/id343555245","android_url":"https://play.google.com/store/apps/details?id=de.hafas.android.db"}]$$,
  $$[{"name":"Tier","description":"Monopattini e bici elettrici in condivisione, molto usati a Berlino per l'ultimo miglio","description_en":"Shared e-scooters and electric bikes, widely used in Berlin for last-mile transport","ios_url":"https://apps.apple.com/app/tier-e-scooter-sharing/id1436140272","android_url":"https://play.google.com/store/apps/details?id=com.tier.app"},{"name":"Bolt","description":"Taxi e monopattini, alternativa economica a Berlino","description_en":"Taxis and scooters, budget alternative in Berlin","ios_url":"https://apps.apple.com/app/bolt-request-a-ride/id675033630","android_url":"https://play.google.com/store/apps/details?id=ee.mtakso.client"}]$$,
  ARRAY[$$Il biglietto ABC copre le zone A, B e C incluso l'aeroporto BER: conveniente per chi arriva in aereo$$,'Berlino e enorme: usa U-Bahn e S-Bahn insieme per spostarti velocemente tra quartieri distanti','La maggior parte dei musei di Berlino e chiusa il lunedi: pianifica di conseguenza il tuo itinerario',$$I club berlinesi (Berghain, Sisyphos) aprono il venerdi sera e possono restare aperti fino al lunedi mattina: e normale$$,'I supermercati chiudono la domenica per legge tedesca: fai scorte di cibo e acqua il sabato sera'],
  ARRAY[$$The ABC ticket covers zones A, B and C including BER airport — worth buying if you arrive by plane$$,'Berlin is enormous: use the U-Bahn and S-Bahn together to move quickly between distant neighbourhoods','Most Berlin museums are closed on Mondays — plan your itinerary accordingly',$$Berlin clubs (Berghain, Sisyphos) open Friday evening and can stay open until Monday morning — this is perfectly normal$$,'Supermarkets are closed on Sundays by German law — stock up on food and water on Saturday evening']
);

-- ── Monaco di Baviera ────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'monaco_di_baviera', 'Euro (€)', 'Euro (€)', 'Tedesco (dialetto bavarese)', 'German (Bavarian dialect)', 'alto',
  'Ottimo livello in centro e tra i giovani. Nelle zone residenziali e tra gli anziani il dialetto bavarese puo rendere la comunicazione piu difficile.',
  'Excellent level in the centre and among young people. In residential areas and among older residents, the Bavarian dialect can make communication harder.',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Polizia","label_en":"Police","number":"110"},{"label":"Ambulanza","label_en":"Ambulance","number":"112"}]',
  '230V — presa tipo F (standard europeo)',
  'Potabile e di ottima qualita. Proveniente dalle Alpi bavaresi, e considerata tra le piu pure della Germania.',
  'Safe to drink and excellent quality. Sourced from the Bavarian Alps, it is considered among the purest in Germany.',
  '5-10% e la consuetudine standard nei ristoranti. Si arrotonda o si lascia il 10% per un servizio ottimo.',
  '5-10% is standard at restaurants. Round up or leave 10% for excellent service.',
  $$[{"name":"MVV","description":"App ufficiale per metro (U-Bahn), S-Bahn, tram e bus di Monaco con biglietti digitali integrati","description_en":"Official app for Munich metro (U-Bahn), S-Bahn, trams and buses with integrated digital tickets","ios_url":"https://apps.apple.com/de/app/mvv-app/id992717481","android_url":"https://play.google.com/store/apps/details?id=de.mvv.app"},{"name":"DB Navigator","description":"Treni regionali e intercity, utile per gite fuori porta (Salisburgo, Innsbruck, Norimberga)","description_en":"Regional and intercity trains, useful for day trips (Salzburg, Innsbruck, Nuremberg)","ios_url":"https://apps.apple.com/de/app/db-navigator/id343555245","android_url":"https://play.google.com/store/apps/details?id=de.hafas.android.db"}]$$,
  $$[{"name":"Uber","description":"Taxi e NCC disponibili e affidabili a Monaco","description_en":"Reliable taxis and private hire available in Munich","ios_url":"https://apps.apple.com/app/uber/id368677368","android_url":"https://play.google.com/store/apps/details?id=com.ubercab"},{"name":"Google Maps","description":"Navigazione e ricerca luoghi con modalita offline","description_en":"Navigation and offline place search","ios_url":"https://apps.apple.com/app/google-maps/id585027354","android_url":"https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}]$$,
  ARRAY[$$L'Oktoberfest dura 16-18 giorni tra fine settembre e inizio ottobre: i prezzi degli hotel triplicano, prenota almeno un anno prima$$,'I Biergarten bavaresi chiudono quando piove: la cultura del Biergarten e outdoor, porta sempre un piano B','Il Museum Quarter (Museumsviertel) con le tre Pinakothek e chiuso il lunedi: pianifica di conseguenza','Il biglietto giornaliero Tageskarte MVV e molto conveniente per chi visita piu zone della citta in un giorno','I supermercati chiudono la domenica per legge: fai scorte il sabato sera'],
  ARRAY[$$Oktoberfest runs for 16–18 days in late September and early October: hotel prices triple — book at least a year ahead$$,$$Bavarian beer gardens close when it rains — the Biergarten culture is outdoor only, so always have a backup plan$$,'The Museum Quarter (Museumsviertel) with the three Pinakothek galleries is closed on Mondays — plan accordingly','The MVV Tageskarte (day ticket) is very good value if you are visiting multiple areas of the city in one day','Supermarkets are closed on Sundays by law — stock up on Saturday evening']
);

-- ── Francoforte ────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'francoforte', 'Euro (€)', 'Euro (€)', 'Tedesco', 'German', 'alto',
  'Ottimo livello in tutta la citta, specialmente nel distretto finanziario e in centro. Francoforte e una delle citta piu internazionali d''Europa.',
  'Excellent level throughout the city, especially in the financial district and the centre. Frankfurt is one of the most international cities in Europe.',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Polizia","label_en":"Police","number":"110"},{"label":"Ambulanza","label_en":"Ambulance","number":"112"}]',
  '230V — presa tipo F (standard europeo)',
  'Potabile e di ottima qualita. Direttamente dal rubinetto ovunque in citta.',
  'Safe to drink and excellent quality. Directly from the tap anywhere in the city.',
  '5-10% e la consuetudine standard. Si arrotonda o si lascia il 10% per un servizio ottimo.',
  '5-10% is the standard practice. Round up or leave 10% for excellent service.',
  $$[{"name":"RMV","description":"App ufficiale per metro (U-Bahn), S-Bahn, tram e bus di Francoforte e della regione Reno-Meno","description_en":"Official app for Frankfurt metro (U-Bahn), S-Bahn, trams and buses across the Rhine-Main region","ios_url":"https://apps.apple.com/de/app/rmv-app/id985596282","android_url":"https://play.google.com/store/apps/details?id=de.rmv.android"},{"name":"DB Navigator","description":"Treni regionali e intercity, ottimo per gite fuori porta (Magonza, Heidelberg, Colonia)","description_en":"Regional and intercity trains, excellent for day trips (Mainz, Heidelberg, Cologne)","ios_url":"https://apps.apple.com/de/app/db-navigator/id343555245","android_url":"https://play.google.com/store/apps/details?id=de.hafas.android.db"}]$$,
  $$[{"name":"Uber","description":"Taxi e NCC disponibili a Francoforte","description_en":"Taxis and private hire available in Frankfurt","ios_url":"https://apps.apple.com/app/uber/id368677368","android_url":"https://play.google.com/store/apps/details?id=com.ubercab"},{"name":"Google Maps","description":"Navigazione e ricerca luoghi","description_en":"Navigation and place search","ios_url":"https://apps.apple.com/app/google-maps/id585027354","android_url":"https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}]$$,
  ARRAY[$$La Torre Maintower (gratuita per la terrazza) offre il panorama migliore sullo skyline piu alto d'Europa: vacci al tramonto$$,'Il Museumsufer di Sachsenhausen ha 15 musei affacciati sul Meno: il biglietto unico e molto conveniente','La Buchmesse (Fiera del Libro, ottobre) e la piu grande del mondo: la citta e affollatissima, prenota con anticipo','Il Römerberg e stato ricostruito dopo la WWII: non e originale, ma l''atmosfera del mercatino di Natale e impagabile','I supermercati chiudono la domenica per legge: organizzati il sabato'],
  ARRAY[$$The Maintower (free terrace) offers the best view of Europe's tallest skyline — go at sunset$$,'The Museumsufer in Sachsenhausen has 15 riverside museums: the combined ticket is excellent value','The Buchmesse (Book Fair, October) is the world''s largest — the city is packed, book well in advance','The Römerberg was reconstructed after WWII: not original, but the Christmas market atmosphere is priceless','Supermarkets are closed on Sundays by law — organise yourself on Saturday']
);

-- ── Atene ─────────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'atene', 'Euro (€)', 'Euro (€)', 'Greco', 'Greek', 'alto',
  'Ottimo livello nelle zone turistiche e tra i giovani. Piu limitato nei quartieri locali e tra le generazioni piu anziane.',
  'Excellent level in tourist areas and among young people. More limited in local neighbourhoods and among older generations.',
  'EET (UTC+2) — ora legale EEST (UTC+3)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Polizia","label_en":"Police","number":"100"},{"label":"Ambulanza","label_en":"Ambulance","number":"166"},{"label":"Vigili del fuoco","label_en":"Fire brigade","number":"199"}]',
  '230V — presa tipo F (standard europeo)',
  'Tecnicamente potabile ad Atene, ma il sapore clorinato e marcato. Molti locali e turisti preferiscono acqua in bottiglia.',
  'Technically drinkable in Athens, but the chlorine taste is noticeable. Many locals and tourists prefer bottled water.',
  '5-10% al ristorante e apprezzato. Al bar si arrotonda. Non c''e pressione sociale ma il gesto e molto apprezzato.',
  '5-10% at restaurants is appreciated. Round up at bars. No social pressure but the gesture is warmly received.',
  $$[{"name":"OASA Telematics","description":"App ufficiale OASA per orari e percorsi di metro, bus e tram di Atene in tempo reale","description_en":"Official OASA app for real-time Athens metro, bus and tram schedules and routes","ios_url":"https://apps.apple.com/gr/app/oasa-telematics/id972007698","android_url":"https://play.google.com/store/apps/details?id=gr.oasa.oantelematics"},{"name":"eSthisi","description":"Biglietti digitali per metro e mezzi pubblici di Atene","description_en":"Digital tickets for Athens metro and public transport","ios_url":"https://apps.apple.com/gr/app/esthisi/id1454023610","android_url":"https://play.google.com/store/apps/details?id=gr.oasa.esthisi"}]$$,
  $$[{"name":"Beat","description":"Taxi locale ateniese molto diffuso, alternativa locale a Uber","description_en":"Popular local Athens taxi app, the local alternative to Uber","ios_url":"https://apps.apple.com/app/beat/id620067556","android_url":"https://play.google.com/store/apps/details?id=gr.grability.taxi"},{"name":"Google Maps","description":"Navigazione con trasporto pubblico integrato","description_en":"Navigation with integrated public transport","ios_url":"https://apps.apple.com/app/google-maps/id585027354","android_url":"https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}]$$,
  ARRAY['Visita l''Acropoli al mattino presto (apertura ore 8:00) o al tramonto per evitare code e caldo estremo','Il biglietto combinato (€30) include Acropoli + 6 siti archeologici: conveniente se visiti piu siti','La metropolitana di Atene e un museo sotterraneo: le stazioni espongono reperti originali trovati durante gli scavi','L''estate ateniese e torrida (35-40°C a luglio/agosto): porta acqua, crema solare e cappello',$$Il mercato delle pulci di Monastiraki la domenica mattina e un'esperienza autentica: arriva presto per i pezzi migliori$$],
  ARRAY['Visit the Acropolis early morning (opens 8 am) or at sunset to avoid queues and extreme heat','The combined ticket (€30) covers the Acropolis + 6 archaeological sites — excellent value if visiting multiple sites','Athens metro is an underground museum: stations display original artefacts found during excavations','Athens summers are scorching (35–40°C in July/August) — carry water, sunscreen and a hat',$$The Monastiraki flea market on Sunday mornings is an authentic experience — arrive early for the best finds$$]
);

-- ── Dublino ────────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'dublino', 'Euro (€)', 'Euro (€)', 'Inglese e Irlandese (Gaelico)', 'English and Irish (Gaelic)', 'alto',
  $$L'inglese e la lingua madre di tutti i dublinesi. L'irlandese (gaelico) e co-lingua ufficiale ma parlato quotidianamente solo nelle regioni del Gaeltacht, non a Dublino.$$,
  'English is the mother tongue of all Dubliners. Irish (Gaelic) is a co-official language but spoken daily only in Gaeltacht regions, not in Dublin.',
  'GMT (UTC+0) — ora legale IST (UTC+1)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Emergenze (alternativo)","label_en":"Emergency (alternative)","number":"999"},{"label":"Garda Siochana (Polizia)","label_en":"Garda Síochána (Police)","number":"112"}]',
  '230V — presa tipo G (identica al UK — porta un adattatore!)',
  'Potabile e di ottima qualita. Acqua di sorgente irlandese, fresca e dal sapore piacevole.',
  'Safe to drink and excellent quality. Irish spring water, fresh and pleasantly flavoured.',
  '10-15% al ristorante e la norma, sempre gradita. Al pub si arrotonda il conto.',
  '10-15% at restaurants is the norm and always welcomed. At pubs, round up the bill.',
  $$[{"name":"TFI Live","description":"App ufficiale Transport for Ireland per bus, treni DART e Luas tram di Dublino con orari in tempo reale","description_en":"Official Transport for Ireland app for buses, DART trains and Luas trams with real-time schedules","ios_url":"https://apps.apple.com/ie/app/tfi-live/id1030085614","android_url":"https://play.google.com/store/apps/details?id=com.transportforireland.android"},{"name":"Dublin Bus","description":"App ufficiale Dublin Bus con orari e percorsi di tutti i bus cittadini","description_en":"Official Dublin Bus app with schedules and routes for all city buses","ios_url":"https://apps.apple.com/ie/app/dublin-bus/id946758524","android_url":"https://play.google.com/store/apps/details?id=ie.dublinbus.dublinbusapp"}]$$,
  $$[{"name":"Free Now","description":"L'app taxi piu diffusa a Dublino (ex MyTaxi), molto usata dai locali","description_en":"The most popular taxi app in Dublin (formerly MyTaxi), widely used by locals","ios_url":"https://apps.apple.com/ie/app/free-now/id484853716","android_url":"https://play.google.com/store/apps/details?id=taxi.android.client"},{"name":"Google Maps","description":"Navigazione con trasporto pubblico e ciclabile integrati","description_en":"Navigation with integrated public transport and cycling modes","ios_url":"https://apps.apple.com/app/google-maps/id585027354","android_url":"https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}]$$,
  ARRAY[$$La presa elettrica e di tipo G come nel UK: porta sempre un adattatore, non e compatibile con quella europea standard$$,'I pub chiudono alle 23:30 nei giorni feriali e mezzanotte il venerdi e sabato: pianifica la serata di conseguenza','Il Trinity College e il Libro di Kells sono gratuiti per l''area esterna, ma richiedono biglietto per la biblioteca',$$Il meteo irlandese e imprevedibile tutto l'anno: porta sempre un impermeabile leggero, anche in estate$$,'La Guinness Storehouse e una visita turistica obbligatoria: prenota online per evitare code e risparmiare'],
  ARRAY[$$Irish plug sockets are Type G as in the UK — always bring an adaptor, they are not compatible with standard European plugs$$,'Pubs close at 11:30 pm on weekdays and midnight on Fridays and Saturdays — plan your evening accordingly','Trinity College and the Book of Kells are free for the grounds, but require a ticket for the library',$$Irish weather is unpredictable year-round — always carry a light waterproof, even in summer$$,'The Guinness Storehouse is a must-see tourist visit — book online to avoid queues and save money']
);

-- ── Venezia ────────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'venezia', 'Euro (€)', 'Euro (€)', 'Italiano (con dialetto veneziano)', 'Italian (with Venetian dialect)', 'medio',
  'Buon livello nelle zone turistiche e tra i giovani. Nei sestieri meno visitati e tra la popolazione locale anziana l''inglese e piu limitato.',
  'Good level in tourist areas and among young people. In less-visited sestieri and among the older local population, English is more limited.',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Ambulanza","label_en":"Ambulance","number":"118"},{"label":"Polizia","label_en":"Police","number":"113"},{"label":"Vigili del fuoco","label_en":"Fire brigade","number":"115"}]',
  '230V — presa tipo F/L (standard europeo + italiano)',
  $$Potabile e di buona qualita. Le fontanelle pubbliche ("le fonteghe") distribuiscono acqua gratuita in tutta la citta.$$,
  'Safe and good quality. Public fountains ("fonteghe") provide free water throughout the city.',
  'Non obbligatoria. Al ristorante si lascia il 5-10% per un servizio ottimo. Al bacaro si arrotonda.',
  'Not mandatory. Leave 5-10% at restaurants for excellent service. Round up at bacari.',
  $$[{"name":"AVM Venezia","description":"App ufficiale ACTV per vaporetti (linee 1, 2, 5...) con biglietti digitali integrati e orari in tempo reale","description_en":"Official ACTV app for vaporetti (lines 1, 2, 5...) with integrated digital tickets and real-time schedules","ios_url":"https://apps.apple.com/it/app/avm-venezia/id898857148","android_url":"https://play.google.com/store/apps/details?id=it.avmspa.avmvenezia"},{"name":"Venezia Unica","description":"Card turistica che include vaporetti illimitati, musei e wifi: conveniente da 24h in su","description_en":"Tourist card covering unlimited vaporetti, museums and wifi: good value from 24 hours upwards","ios_url":"https://apps.apple.com/it/app/venezia-unica/id936427523","android_url":"https://play.google.com/store/apps/details?id=it.avmspa.veneziaunica"}]$$,
  $$[{"name":"Google Maps","description":"Navigazione a piedi ottima a Venezia, anche offline nei sestieri meno conosciuti","description_en":"Walking navigation excellent in Venice, works offline too for the lesser-known sestieri","ios_url":"https://apps.apple.com/app/google-maps/id585027354","android_url":"https://play.google.com/store/apps/details?id=com.google.android.apps.maps"},{"name":"Moovit","description":"Pianificazione vaporetti e bus con orari in tempo reale","description_en":"Vaporetto and bus planning with real-time schedules","ios_url":"https://apps.apple.com/app/moovit/id498477945","android_url":"https://play.google.com/store/apps/details?id=com.tranzmate"}]$$,
  ARRAY[$$Venezia applica una tassa di accesso (da 5€) nei giorni di punta primaverili ed estivi: verifica le date prima di partire su veneziaunica.it$$,'Compra i biglietti vaporetto in anticipo sull''app AVM: ai moli il prezzo e piu alto e le code sono lunghe','Evita i ristoranti sulla Riva degli Schiavoni e vicino a San Marco: i prezzi sono tripli e la qualita bassa',$$I bacari aprono per i cicchetti dalle 18:00 alle 20:00 e poi chiudono: non perdere questo rito veneziano$$,'Venezia si esplora al meglio a piedi nei sestieri meno frequentati (Cannaregio, Castello): perditi senza meta'],
  ARRAY[$$Venice charges a day-tripper access fee (from €5) on busy spring and summer days — check dates in advance at veneziaunica.it$$,'Buy vaporetto tickets in advance on the AVM app — prices are higher at the jetties and queues are long','Avoid restaurants on the Riva degli Schiavoni and near San Marco: prices are triple and quality is low',$$Bacari open for cicchetti from 6 to 8 pm then close — do not miss this essential Venetian ritual$$,'Venice is best explored on foot through the less-visited sestieri (Cannaregio, Castello) — get lost without a plan']
);

-- ── Amsterdam ─────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'amsterdam', 'Euro (€)', 'Euro (€)', 'Olandese', 'Dutch', 'alto',
  'Praticamente universale, tra i livelli piu alti d''Europa. Gli olandesi parlano inglese con accento quasi perfetto fin dalle scuole elementari.',
  'Practically universal, among the highest levels in Europe. The Dutch speak English with a near-perfect accent from primary school onwards.',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Polizia (non urgente)","label_en":"Police (non-urgent)","number":"0900-8844"},{"label":"Ambulanza","label_en":"Ambulance","number":"112"}]',
  '230V — presa tipo F (standard europeo)',
  $$Potabile e di eccellente qualita. L'acqua del rubinetto di Amsterdam proviene da dune filtrate ed e tra le piu pure d'Europa.$$,
  $$Safe to drink and excellent quality. Amsterdam's tap water is filtered through dunes and is among the purest in Europe.$$,
  'Non obbligatoria. Al ristorante si lascia il 5-10% per un servizio ottimo o si arrotonda il conto.',
  'Not mandatory. Leave 5-10% at restaurants for excellent service or simply round up the bill.',
  $$[{"name":"GVB","description":"App ufficiale per tram, metro e bus di Amsterdam con biglietti digitali integrati","description_en":"Official app for Amsterdam trams, metro and buses with integrated digital tickets","ios_url":"https://apps.apple.com/nl/app/gvb-reis-app/id685985739","android_url":"https://play.google.com/store/apps/details?id=nl.gvb.reisapp"},{"name":"NS","description":"Treni nazionali olandesi, ottimi per gite fuori porta (Haarlem, Leiden, Utrecht, Delft)","description_en":"Dutch national trains, excellent for day trips (Haarlem, Leiden, Utrecht, Delft)","ios_url":"https://apps.apple.com/nl/app/ns/id370362301","android_url":"https://play.google.com/store/apps/details?id=nl.ns.android.activity"}]$$,
  $$[{"name":"OV-fiets","description":"Noleggio bici integrato con l'abbonamento OV-chipkaart alle stazioni: il modo piu olandese per muoversi","description_en":"Bike rental integrated with the OV-chipkaart pass at stations: the most Dutch way to get around","ios_url":"https://apps.apple.com/nl/app/ov-fiets/id1500716686","android_url":"https://play.google.com/store/apps/details?id=nl.ns.ovfiets"},{"name":"Google Maps","description":"Navigazione ottima con modalita ciclistica","description_en":"Excellent navigation with cycling mode","ios_url":"https://apps.apple.com/app/google-maps/id585027354","android_url":"https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}]$$,
  ARRAY[$$Non camminare mai sulle piste ciclabili: ad Amsterdam le bici hanno sempre la precedenza e i ciclisti non suonano il campanello$$,'Prenota Rijksmuseum e Anne Frank House online con mesi di anticipo: si esauriscono letteralmente sempre',$$La Amsterdam City Card include trasporti illimitati e ingresso a oltre 70 musei: conveniente da 24h in su$$,'Il cannabis e tollerato nei coffee shop autorizzati ma illegale da consumare in strada: rispetta le regole locali','I canali sono molto profondi e senza corrimano: fai attenzione di notte dopo aver bevuto'],
  ARRAY[$$Never walk on the cycle lanes: in Amsterdam bikes always have right of way and cyclists will not ring their bell$$,'Book the Rijksmuseum and Anne Frank House online months in advance — they literally always sell out',$$The Amsterdam City Card covers unlimited transport and entry to over 70 museums — great value from 24 hours$$,'Cannabis is tolerated in licensed coffee shops but illegal to consume on the street — respect local rules','The canals are very deep with no guardrails — be careful at night after drinking']
);

-- ── Praga ─────────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'praga', 'Corona ceca (Kč / CZK)', 'Czech Crown (Kč / CZK)', 'Ceco', 'Czech', 'medio',
  'Buon livello nelle zone turistiche e tra i giovani. Piu limitato nei quartieri locali e tra le generazioni piu anziane.',
  'Good level in tourist areas and among young people. More limited in local neighbourhoods and among older generations.',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Polizia","label_en":"Police","number":"158"},{"label":"Ambulanza","label_en":"Ambulance","number":"155"},{"label":"Vigili del fuoco","label_en":"Fire brigade","number":"150"}]',
  '230V — presa tipo F (standard europeo)',
  'Potabile e di buona qualita. Direttamente dal rubinetto in tutta la citta.',
  'Safe to drink and good quality. Directly from the tap throughout the city.',
  '10-15% al ristorante e la norma e ben gradito. Al pub si arrotonda il conto alla corona piu vicina.',
  '10-15% at restaurants is the norm and warmly appreciated. At pubs, round up to the nearest crown.',
  $$[{"name":"PID Lítačka","description":"App ufficiale per metro, tram, bus e treni suburbani di Praga con biglietti digitali e orari in tempo reale","description_en":"Official app for Prague metro, trams, buses and suburban trains with digital tickets and real-time schedules","ios_url":"https://apps.apple.com/cz/app/pid-litacka/id1098139548","android_url":"https://play.google.com/store/apps/details?id=cz.dpp.piddroid"},{"name":"České dráhy","description":"Treni nazionali cechi per gite fuori porta (Cesky Krumlov, Karlovy Vary, Brno)","description_en":"Czech national trains for day trips (Český Krumlov, Karlovy Vary, Brno)","ios_url":"https://apps.apple.com/cz/app/cd-travel/id582517107","android_url":"https://play.google.com/store/apps/details?id=cz.cd.cdapp"}]$$,
  $$[{"name":"Bolt","description":"Taxi piu economico rispetto ai taxi tradizionali di Praga, molto usato dai locali","description_en":"More affordable than traditional Prague taxis, widely used by locals","ios_url":"https://apps.apple.com/app/bolt-request-a-ride/id675033630","android_url":"https://play.google.com/store/apps/details?id=ee.mtakso.client"},{"name":"Google Maps","description":"Navigazione con trasporto pubblico integrato","description_en":"Navigation with integrated public transport","ios_url":"https://apps.apple.com/app/google-maps/id585027354","android_url":"https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}]$$,
  ARRAY[$$Praga usa la corona ceca (CZK), non l'euro: evita i money changer in centro (tassi pessimi), usa bancomat locali o paga con carta$$,'La birra ceca (Pilsner Urquell, Kozel, Budvar) e la migliore del mondo e costa meno dell''acqua nei pub: e normale','Il tram e il mezzo migliore per muoversi: linee notturne (900-910) coprono la citta tutta la notte','Il Castello di Praga e il complesso castellano piu grande del mondo: dedica almeno 3-4 ore e prenota in anticipo',$$I taxi non prenotati in strada a Praga praticano tariffe gonfiate: usa sempre Bolt o prenota via app$$],
  ARRAY[$$Prague uses the Czech crown (CZK), not euros — avoid city-centre money changers (terrible rates), use local ATMs or pay by card$$,'Czech beer (Pilsner Urquell, Kozel, Budvar) is among the world''s best and costs less than water in pubs — this is normal','Trams are the best way to get around: night lines (900-910) cover the city all night long','Prague Castle is the world''s largest castle complex — allow at least 3-4 hours and book in advance',$$Never hail a taxi on the street in Prague — they charge inflated rates. Always use Bolt or pre-book via app$$]
);

-- ── Budapest ──────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'budapest', 'Fiorino ungherese (Ft / HUF)', 'Hungarian Forint (Ft / HUF)', 'Ungherese', 'Hungarian', 'medio',
  'Buon livello tra i giovani e nelle zone turistiche. Le generazioni piu anziane parlano spesso tedesco come seconda lingua piuttosto che inglese.',
  'Good level among young people and in tourist areas. Older generations often speak German as a second language rather than English.',
  'CET (UTC+1) — ora legale CEST (UTC+2)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Polizia","label_en":"Police","number":"107"},{"label":"Ambulanza","label_en":"Ambulance","number":"104"},{"label":"Vigili del fuoco","label_en":"Fire brigade","number":"105"}]',
  '230V — presa tipo F (standard europeo)',
  'Potabile dal rubinetto in tutta la citta. Tuttavia molti locali preferiscono acqua in bottiglia per il sapore leggermente calcareo.',
  'Safe to drink from the tap throughout the city. However many locals prefer bottled water due to the slightly chalky taste.',
  $$Il 10-15% di mancia al ristorante e la norma e va consegnata direttamente al cameriere in contanti — non lasciata sul tavolo. Nei taxi si arrotonda la tariffa.$$,
  $$10-15% tip at restaurants is standard and should be handed directly to the waiter in cash — not left on the table. In taxis, round up the fare.$$,
  $$[{"name":"BKK Futár","description":"App ufficiale per metro, tram, bus e battello del Danubio di Budapest con biglietti digitali e mappe in tempo reale","description_en":"Official app for Budapest metro, trams, buses and Danube ferries with digital tickets and real-time maps","ios_url":"https://apps.apple.com/hu/app/bkk-futar/id916193835","android_url":"https://play.google.com/store/apps/details?id=hu.webvalto.bkk.futar"},{"name":"MÁV","description":"Treni nazionali ungheresi per gite fuori porta (Lago Balaton, Eger, Pecs)","description_en":"Hungarian national trains for day trips (Lake Balaton, Eger, Pécs)","ios_url":"https://apps.apple.com/hu/app/mav-alkalmazas/id1439635381","android_url":"https://play.google.com/store/apps/details?id=hu.mavstart.mavapp"}]$$,
  $$[{"name":"Bolt","description":"Taxi molto usato a Budapest, piu economico dei taxi di strada","description_en":"Widely used in Budapest, much cheaper than street taxis","ios_url":"https://apps.apple.com/app/bolt-request-a-ride/id675033630","android_url":"https://play.google.com/store/apps/details?id=ee.mtakso.client"},{"name":"Google Maps","description":"Navigazione ottima con tutti i mezzi pubblici integrati","description_en":"Excellent navigation with all public transport integrated","ios_url":"https://apps.apple.com/app/google-maps/id585027354","android_url":"https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}]$$,
  ARRAY[$$Budapest usa il fiorino ungherese (HUF), non l''euro: i tassi di cambio in centro sono pessimi, usa sempre il bancomat o paga con carta$$,$$Le terme sono un''istituzione: Szechenyi (la piu grande), Gellert e Rudas sono le migliori — prenota sempre online in anticipo$$,'Il biglietto BKK vale 80 minuti senza cambi: per muoversi liberamente conviene il carnet da 10 viaggi o il giornaliero',$$Il Parlamento e tra i piu belli al mondo: visita obbligatoria, prenota il tour guidato interno online (si esaurisce)$$,'I taxi di strada non prenotati possono essere molto cari: usa sempre Bolt o prenota via app'],
  ARRAY[$$Budapest uses the Hungarian forint (HUF), not euros — exchange rates in the centre are poor, always use an ATM or pay by card$$,$$The thermal baths are an institution: Széchenyi (the largest), Gellért and Rudas are the best — always book online in advance$$,'The BKK ticket is valid for 80 minutes without transfers — for unlimited travel a 10-ride carnet or day pass is better value','The Parliament building is among the most beautiful in the world — a must-visit; book the guided interior tour online (sells out fast)','Untbooked street taxis in Budapest can be very expensive — always use Bolt or pre-book via app']
);

-- ── Lisbona ───────────────────────────────────────────────────────────────────
INSERT INTO city_info (city, currency, currency_en, language, language_en, english_level, english_note, english_note_en, timezone, emergency_numbers, voltage, water, water_en, tipping, tipping_en, transport_apps, useful_apps, quick_tips, quick_tips_en) VALUES (
  'lisbona', 'Euro (€)', 'Euro (€)', 'Portoghese', 'Portuguese', 'alto',
  $$Livello molto alto soprattutto tra i giovani e nelle zone turistiche. I portoghesi sono naturalmente portati per le lingue e quasi tutti parlano inglese fluentemente.$$,
  'Very high level especially among young people and in tourist areas. The Portuguese are naturally gifted at languages and nearly everyone speaks fluent English.',
  'WET (UTC+0) — ora legale WEST (UTC+1)',
  '[{"label":"Emergenze generali","label_en":"General emergency","number":"112"},{"label":"Polizia","label_en":"Police","number":"213-421-634"},{"label":"Ambulanza","label_en":"Ambulance","number":"112"},{"label":"Guardia costiera","label_en":"Coastguard","number":"214-401-919"}]',
  '230V — presa tipo F (standard europeo)',
  'Potabile e di buona qualita in tutta la citta. Alcune persone preferiscono acqua in bottiglia ma non e necessario.',
  'Safe to drink and good quality throughout the city. Some people prefer bottled water but it is not necessary.',
  'Non obbligatoria ma apprezzata: 5-10% al ristorante per un servizio ottimo. Si arrotonda il conto in bar e taxi.',
  'Not mandatory but appreciated: 5-10% at restaurants for excellent service. Round up the bill at bars and in taxis.',
  $$[{"name":"Carris / Viva Viagem","description":"App ufficiale per tram, metro, bus e treno suburbano di Lisbona. La carta Viva Viagem e ricaricabile e usabile su tutti i mezzi","description_en":"Official app for Lisbon trams, metro, buses and suburban train. The Viva Viagem card is rechargeable and valid on all transport","ios_url":"https://apps.apple.com/pt/app/move-me/id505509016","android_url":"https://play.google.com/store/apps/details?id=com.fct.pt.move_me"},{"name":"CP Comboios","description":"Treni nazionali portoghesi per gite fuori porta (Sintra, Cascais, Porto, Obidos)","description_en":"Portuguese national trains for day trips (Sintra, Cascais, Porto, Óbidos)","ios_url":"https://apps.apple.com/pt/app/cp/id428218187","android_url":"https://play.google.com/store/apps/details?id=pt.cp.cportuguesa"}]$$,
  $$[{"name":"Uber","description":"Molto diffuso a Lisbona, prezzi ragionevoli e ottimo per evitare i taxi di strada","description_en":"Widely used in Lisbon, reasonable prices and great for avoiding street taxis","ios_url":"https://apps.apple.com/app/uber/id368677368","android_url":"https://play.google.com/store/apps/details?id=com.ubercab"},{"name":"GIRA Bicicletas","description":"Bike sharing del comune di Lisbona, pratico per zone pianeggianti (Belem, Parque das Nacoes)","description_en":"Lisbon city bike sharing, practical for flat areas (Belém, Parque das Nações)","ios_url":"https://apps.apple.com/pt/app/gira-bicicletas-de-lisboa/id1436250739","android_url":"https://play.google.com/store/apps/details?id=com.iou.gira"}]$$,
  ARRAY[$$Il Tram 28 e iconico ma affollatissimo di turisti: per l''esperienza autentica sali alle prime fermate (Martim Moniz) la mattina presto$$,'Lisbona e costruita su 7 colline: le scarpe comode sono obbligatorie — i sanpietrini bagnati sono scivolosissimi','I miradouros (belvederi) piu belli sono Portas do Sol, Santa Catarina e Sao Pedro de Alcantara: visitali al tramonto',$$Il Pasteis de Belem originale (fondato nel 1837) fa i migliori pasteis de nata del mondo — la coda vale sempre l''attesa$$,'La Linha de Cascais in treno e uno dei tragitti piu panoramici d''Europa: 40 minuti per mare aperto e spiagge atlantiche'],
  ARRAY[$$Tram 28 is iconic but packed with tourists — for the authentic experience board at the first stops (Martim Moniz) early in the morning$$,'Lisbon is built on 7 hills — comfortable shoes are essential, and wet cobblestones are extremely slippery','The best miradouros (viewpoints) are Portas do Sol, Santa Catarina and São Pedro de Alcântara — visit them at sunset',$$The original Pastéis de Belém (founded 1837) makes the world''s best pastéis de nata — the queue is always worth it$$,'The Cascais Line by train is one of Europe''s most scenic journeys — 40 minutes along the open sea and Atlantic beaches']
);
