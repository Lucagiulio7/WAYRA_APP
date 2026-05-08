-- Tabella quartieri consigliati per l'alloggio
CREATE TABLE IF NOT EXISTS neighborhoods (
  id             SERIAL PRIMARY KEY,
  city           TEXT NOT NULL,
  name           TEXT NOT NULL,
  name_en        TEXT,
  description    TEXT NOT NULL,
  description_en TEXT,
  vibe_tags      TEXT[] DEFAULT '{}',
  booking_url    TEXT,        -- link diretto Booking.com (se NULL genera ricerca automatica)
  sort_order     INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_neighborhoods_city ON neighborhoods(city);

ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "neighborhoods_public_read" ON neighborhoods
  FOR SELECT USING (true);

-- ── Roma ─────────────────────────────────────────────────────────────────────
INSERT INTO neighborhoods (city, name, name_en, description, description_en, vibe_tags, booking_url, sort_order) VALUES

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
 'https://www.booking.com/searchresults.html?ss=Esquilino%2C+Roma&lang=it', 6);

-- ── Milano ────────────────────────────────────────────────────────────────────
INSERT INTO neighborhoods (city, name, name_en, description, description_en, vibe_tags, booking_url, sort_order) VALUES

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
 'https://www.booking.com/searchresults.html?ss=Stazione+Centrale%2C+Milano&lang=it', 4);

-- ── Barcellona ────────────────────────────────────────────────────────────────
INSERT INTO neighborhoods (city, name, name_en, description, description_en, vibe_tags, booking_url, sort_order) VALUES

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
 'https://www.booking.com/searchresults.html?ss=Gracia%2C+Barcellona&lang=it', 4);

-- ── Parigi ────────────────────────────────────────────────────────────────────
INSERT INTO neighborhoods (city, name, name_en, description, description_en, vibe_tags, booking_url, sort_order) VALUES

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
 'https://www.booking.com/searchresults.html?ss=Bastille%2C+Parigi&lang=it', 4);

-- ── Londra ────────────────────────────────────────────────────────────────────
INSERT INTO neighborhoods (city, name, name_en, description, description_en, vibe_tags, booking_url, sort_order) VALUES

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
 'https://www.booking.com/searchresults.html?ss=Covent+Garden%2C+Londra&lang=it', 4);
