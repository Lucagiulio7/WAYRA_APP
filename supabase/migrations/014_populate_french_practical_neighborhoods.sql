-- WAYRA - Migration 014: French content for practical info and neighborhoods.
-- Covers the cities already present in the original city_info/neighborhood seeds.

-- ---------------------------------------------------------------------------
-- Practical info
-- ---------------------------------------------------------------------------

UPDATE city_info
SET
  currency_fr = $$Euro (€)$$,
  language_fr = $$Italien$$,
  english_note_fr = $$Courant dans les zones touristiques, moins dans les quartiers locaux.$$,
  water_fr = $$L'eau du robinet est potable. Les nasoni, petites fontaines vertes, fournissent de l'eau fraîche gratuite partout en ville.$$,
  tipping_fr = $$Pas obligatoire. Au restaurant, on arrondit ou on laisse 5 à 10 % si le service a été excellent.$$,
  quick_tips_fr = ARRAY[
    $$Validez votre billet AVANT de monter dans les bus et les trams : les contrôleurs verbalisent sans avertissement.$$,
    $$Le billet simple dure 100 minutes et couvre un trajet en métro plus des bus illimités.$$,
    $$Évitez les taxis non officiels devant Termini : utilisez toujours les taxis blancs avec compteur ou Uber.$$,
    $$De nombreux musées nationaux sont gratuits le premier dimanche du mois.$$,
    $$Emportez toujours de l'eau : les étés romains sont très chauds et l'ombre est rare.$$
  ],
  emergency_numbers = $$[
    {"label": "Emergenze generali", "label_en": "General emergency", "label_fr": "Urgences générales", "number": "112"},
    {"label": "Ambulanza", "label_en": "Ambulance", "label_fr": "Ambulance", "number": "118"},
    {"label": "Polizia", "label_en": "Police", "label_fr": "Police", "number": "113"},
    {"label": "Vigili del fuoco", "label_en": "Fire brigade", "label_fr": "Pompiers", "number": "115"}
  ]$$::jsonb,
  transport_apps = $$[
    {"name": "Moovit", "description": "Pianifica percorsi su metro, bus e tram con orari in tempo reale", "description_en": "Plan metro, bus and tram routes with real-time schedules", "description_fr": "Planifie les trajets en métro, bus et tram avec horaires en temps réel", "ios_url": "https://apps.apple.com/app/moovit/id498477945", "android_url": "https://play.google.com/store/apps/details?id=com.tranzmate"},
    {"name": "Roma Mobilita", "description": "App ufficiale ATAC per metro e bus di Roma", "description_en": "Official ATAC app for Rome metro and buses", "description_fr": "Application officielle ATAC pour le métro et les bus de Rome", "ios_url": "https://apps.apple.com/it/app/roma-mobilita/id1062913438", "android_url": "https://play.google.com/store/apps/details?id=it.atac.romamobilita"},
    {"name": "Trenitalia", "description": "Per treni regionali e gite fuori porta", "description_en": "For regional trains and day trips", "description_fr": "Pour les trains régionaux et les excursions hors de la ville", "ios_url": "https://apps.apple.com/it/app/trenitalia/id522343829", "android_url": "https://play.google.com/store/apps/details?id=it.trenitalia"}
  ]$$::jsonb,
  useful_apps = $$[
    {"name": "TheFork", "description": "Prenotazione ristoranti con sconti fino al 50%", "description_en": "Restaurant bookings with discounts up to 50%", "description_fr": "Réservation de restaurants avec des réductions jusqu'à 50 %", "ios_url": "https://apps.apple.com/app/thefork/id535276978", "android_url": "https://play.google.com/store/apps/details?id=com.lafourchette.lafourchette"},
    {"name": "Google Maps", "description": "Navigazione e ricerca luoghi offline", "description_en": "Navigation and offline place search", "description_fr": "Navigation et recherche de lieux hors ligne", "ios_url": "https://apps.apple.com/app/google-maps/id585027354", "android_url": "https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}
  ]$$::jsonb
WHERE city = 'roma';

UPDATE city_info
SET
  currency_fr = $$Euro (€)$$,
  language_fr = $$Italien$$,
  english_note_fr = $$Bon niveau dans le centre et les quartiers de mode et design, moins courant en périphérie.$$,
  water_fr = $$Potable et de bonne qualité. Les fontaines publiques sont sûres.$$,
  tipping_fr = $$Pas obligatoire. Dans les bars et restaurants, on arrondit ou on laisse 1 à 2 € au comptoir.$$,
  quick_tips_fr = ARRAY[
    $$L'aperitivo milanais, à partir de 18 h, inclut souvent un buffet généreux avec la consommation.$$,
    $$Le dimanche, de nombreuses zones commerçantes comme le Quadrilatère de la mode sont fermées.$$,
    $$Les transports de nuit couvrent les lignes principales, mais avec une fréquence réduite.$$,
    $$Validez toujours votre billet : les contrôleurs ATM sont très présents.$$,
    $$Pendant la Fashion Week et le Salone del Mobile, les prix des hôtels triplent : réservez plusieurs mois à l'avance.$$
  ],
  emergency_numbers = $$[
    {"label": "Emergenze generali", "label_en": "General emergency", "label_fr": "Urgences générales", "number": "112"},
    {"label": "Ambulanza", "label_en": "Ambulance", "label_fr": "Ambulance", "number": "118"},
    {"label": "Polizia", "label_en": "Police", "label_fr": "Police", "number": "113"}
  ]$$::jsonb,
  transport_apps = $$[
    {"name": "ATM Milano", "description": "App ufficiale per metro, tram e bus di Milano con orari in tempo reale", "description_en": "Official app for Milan metro, trams and buses with real-time schedules", "description_fr": "Application officielle du métro, des trams et des bus de Milan avec horaires en temps réel", "ios_url": "https://apps.apple.com/it/app/atm-milano/id635490946", "android_url": "https://play.google.com/store/apps/details?id=it.atm.app"},
    {"name": "Moovit", "description": "Pianificazione percorsi multimodale", "description_en": "Multimodal route planning", "description_fr": "Planification d'itinéraires multimodaux", "ios_url": "https://apps.apple.com/app/moovit/id498477945", "android_url": "https://play.google.com/store/apps/details?id=com.tranzmate"},
    {"name": "BikeMi", "description": "Bike sharing ufficiale di Milano", "description_en": "Milan official bike-sharing service", "description_fr": "Service officiel de vélos en libre-service de Milan", "ios_url": "https://apps.apple.com/it/app/bikemi/id556577567", "android_url": "https://play.google.com/store/apps/details?id=com.cbw.bikemi"}
  ]$$::jsonb,
  useful_apps = $$[
    {"name": "Satispay", "description": "Pagamenti digitali molto usati nei locali milanesi", "description_en": "Digital payments widely used in Milan venues", "description_fr": "Paiements numériques très utilisés dans les établissements milanais", "ios_url": "https://apps.apple.com/it/app/satispay/id982085702", "android_url": "https://play.google.com/store/apps/details?id=com.satispay.customer"},
    {"name": "Google Maps", "description": "Navigazione e ricerca luoghi", "description_en": "Navigation and place search", "description_fr": "Navigation et recherche de lieux", "ios_url": "https://apps.apple.com/app/google-maps/id585027354", "android_url": "https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}
  ]$$::jsonb
WHERE city = 'milano';

UPDATE city_info
SET
  currency_fr = $$Euro (€)$$,
  language_fr = $$Catalan et castillan (espagnol)$$,
  english_note_fr = $$Excellent dans les zones touristiques et chez les jeunes. Les panneaux de rue sont en catalan.$$,
  water_fr = $$Techniquement potable, mais le goût de chlore est marqué. Beaucoup d'habitants conseillent l'eau en bouteille.$$,
  tipping_fr = $$Pas obligatoire mais apprécié. Laissez 5 à 10 % au restaurant et arrondissez dans les bars.$$,
  quick_tips_fr = ARRAY[
    $$La T-Casual, avec 10 trajets, est la carte la plus pratique pour un court séjour.$$,
    $$Attention aux pickpockets sur les Ramblas et dans le métro : gardez votre sac devant vous.$$,
    $$Les restaurants ouvrent tard : déjeuner à partir de 14 h, dîner à partir de 21 h.$$,
    $$La plage est accessible par la ligne 4 du métro, couleur jaune, jusqu'à Barceloneta.$$,
    $$Uber n'est pas disponible : utilisez Cabify ou les taxis officiels avec compteur.$$
  ],
  emergency_numbers = $$[
    {"label": "Emergenze generali", "label_en": "General emergency", "label_fr": "Urgences générales", "number": "112"},
    {"label": "Polizia Nazionale", "label_en": "National Police", "label_fr": "Police nationale", "number": "091"},
    {"label": "Ambulanza", "label_en": "Ambulance", "label_fr": "Ambulance", "number": "061"}
  ]$$::jsonb,
  transport_apps = $$[
    {"name": "TMB App", "description": "App ufficiale per metro e bus di Barcellona con mappe e orari", "description_en": "Official app for Barcelona metro and buses with maps and timetables", "description_fr": "Application officielle du métro et des bus de Barcelone avec plans et horaires", "ios_url": "https://apps.apple.com/app/tmb-app/id1076566093", "android_url": "https://play.google.com/store/apps/details?id=cat.tmb.appandroid"},
    {"name": "Moovit", "description": "Pianificazione percorsi e orari in tempo reale", "description_en": "Route planning and real-time schedules", "description_fr": "Planification d'itinéraires et horaires en temps réel", "ios_url": "https://apps.apple.com/app/moovit/id498477945", "android_url": "https://play.google.com/store/apps/details?id=com.tranzmate"},
    {"name": "Bicing", "description": "Bike sharing pubblico di Barcellona (richiede abbonamento mensile)", "description_en": "Barcelona public bike-sharing (requires monthly subscription)", "description_fr": "Vélos publics de Barcelone, avec abonnement mensuel requis", "ios_url": "https://apps.apple.com/es/app/bicing/id1475440734", "android_url": "https://play.google.com/store/apps/details?id=com.bsmsa.bicing"}
  ]$$::jsonb,
  useful_apps = $$[
    {"name": "Cabify", "description": "Alternativa locale a Uber per taxi e NCC", "description_en": "Local alternative to Uber for taxis and private hire", "description_fr": "Alternative locale à Uber pour taxis et VTC", "ios_url": "https://apps.apple.com/app/cabify/id476087442", "android_url": "https://play.google.com/store/apps/details?id=com.cabify.rider"},
    {"name": "Google Maps", "description": "Navigazione con modalita trasporto pubblico integrata", "description_en": "Navigation with integrated public transport mode", "description_fr": "Navigation avec mode transports publics intégré", "ios_url": "https://apps.apple.com/app/google-maps/id585027354", "android_url": "https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}
  ]$$::jsonb
WHERE city = 'barcellona';

UPDATE city_info
SET
  currency_fr = $$Euro (€)$$,
  language_fr = $$Français$$,
  english_note_fr = $$L'anglais est parlé dans les zones touristiques, mais les Parisiens apprécient beaucoup un effort en français, même un simple Bonjour.$$,
  water_fr = $$Potable et d'excellente qualité. Des fontaines publiques gratuites sont disponibles dans toute la ville, avec une carte sur Eau de Paris.$$,
  tipping_fr = $$Pas obligatoire : le service est inclus dans le prix par la loi. Laissez 1 à 2 € au café ou 5 à 10 % au restaurant si le service vous a plu.$$,
  quick_tips_fr = ARRAY[
    $$Commencez toujours par Bonjour Madame ou Bonjour Monsieur : les Parisiens répondent beaucoup mieux.$$,
    $$Gardez votre ticket de métro jusqu'à la sortie : les contrôles sont fréquents.$$,
    $$Réservez les grands musées à l'avance, surtout Louvre, Orsay et Sainte-Chapelle.$$,
    $$Les boulangeries ferment souvent un jour par semaine : vérifiez les horaires avant de traverser la ville.$$,
    $$Les terrasses sont plus chères que le comptoir dans certains cafés historiques.$$
  ],
  emergency_numbers = $$[
    {"label": "Emergenze generali", "label_en": "General emergency", "label_fr": "Urgences générales", "number": "112"},
    {"label": "SAMU (ambulanza)", "label_en": "SAMU (ambulance)", "label_fr": "SAMU (ambulance)", "number": "15"},
    {"label": "Polizia", "label_en": "Police", "label_fr": "Police", "number": "17"},
    {"label": "Pompieri", "label_en": "Fire brigade", "label_fr": "Pompiers", "number": "18"}
  ]$$::jsonb,
  transport_apps = $$[
    {"name": "RATP", "description": "App ufficiale per metro, RER, bus e tram parigini con orari in tempo reale", "description_en": "Official app for Paris metro, RER, buses and trams with real-time info", "description_fr": "Application officielle pour métro, RER, bus et tramways parisiens avec informations en temps réel", "ios_url": "https://apps.apple.com/app/ratp/id507107090", "android_url": "https://play.google.com/store/apps/details?id=com.fabernovel.ratp"},
    {"name": "Citymapper", "description": "Pianificazione percorsi avanzata con tutte le modalita di trasporto", "description_en": "Advanced route planning covering all transport modes", "description_fr": "Planification avancée d'itinéraires couvrant tous les modes de transport", "ios_url": "https://apps.apple.com/app/citymapper/id469463298", "android_url": "https://play.google.com/store/apps/details?id=com.citymapper.app.release"},
    {"name": "Velib Metropole", "description": "Bike sharing con oltre 1.400 stazioni in citta", "description_en": "Bike-sharing with over 1,400 stations across the city", "description_fr": "Vélos en libre-service avec plus de 1 400 stations dans la ville", "ios_url": "https://apps.apple.com/fr/app/velib-metropole/id1360768361", "android_url": "https://play.google.com/store/apps/details?id=com.massmob.velib"}
  ]$$::jsonb,
  useful_apps = $$[
    {"name": "Ile-de-France Mobilites", "description": "Acquisto biglietti Navigo e abbonamenti ufficiali", "description_en": "Buy Navigo tickets and official transport passes", "description_fr": "Achat de tickets Navigo et d'abonnements officiels", "ios_url": "https://apps.apple.com/fr/app/ile-de-france-mobilites/id1440799600", "android_url": "https://play.google.com/store/apps/details?id=fr.iledefrance.mobilites.journey"},
    {"name": "Google Maps", "description": "Navigazione e ricerca luoghi con modalita offline", "description_en": "Navigation and offline place search", "description_fr": "Navigation et recherche de lieux avec mode hors ligne", "ios_url": "https://apps.apple.com/app/google-maps/id585027354", "android_url": "https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}
  ]$$::jsonb
WHERE city = 'parigi';

UPDATE city_info
SET
  currency_fr = $$Livre sterling (£)$$,
  language_fr = $$Anglais$$,
  english_note_fr = $$Très facile pour les voyageurs : l'anglais est la langue locale, avec de nombreux accents selon les quartiers.$$,
  water_fr = $$L'eau du robinet est potable et largement disponible. Demandez tap water au restaurant pour éviter l'eau en bouteille.$$,
  tipping_fr = $$Le service est souvent inclus. Sinon, laissez environ 10 à 12,5 % au restaurant si le service a été bon.$$,
  quick_tips_fr = ARRAY[
    $$Utilisez une carte sans contact ou Apple/Google Pay dans les transports : c'est le moyen le plus simple.$$,
    $$Tenez-vous à droite dans les escalators du métro londonien.$$,
    $$Les distances entre stations peuvent être courtes : marcher est parfois plus rapide que changer de ligne.$$,
    $$Les musées nationaux sont souvent gratuits, mais les expositions temporaires sont payantes.$$,
    $$Prévoyez de la pluie légère même quand la météo semble correcte.$$
  ],
  emergency_numbers = $$[
    {"label": "Emergenze generali", "label_en": "General emergency", "label_fr": "Urgences générales", "number": "999"},
    {"label": "Emergenze non urgenti", "label_en": "Non-urgent police", "label_fr": "Police non urgente", "number": "101"},
    {"label": "NHS non urgente", "label_en": "NHS non-emergency", "label_fr": "NHS non urgent", "number": "111"}
  ]$$::jsonb,
  transport_apps = $$[
    {"name": "TfL Go", "description": "App ufficiale Transport for London per Tube, bus e treni urbani", "description_en": "Official Transport for London app for Tube, buses and urban rail", "description_fr": "Application officielle Transport for London pour métro, bus et trains urbains", "ios_url": "https://apps.apple.com/gb/app/tfl-go/id1419541638", "android_url": "https://play.google.com/store/apps/details?id=uk.gov.tfl.gotfl"},
    {"name": "Citymapper", "description": "La migliore app per combinare Tube, bus, treni e camminate", "description_en": "The best app for combining Tube, buses, trains and walking", "description_fr": "La meilleure application pour combiner métro, bus, trains et marche", "ios_url": "https://apps.apple.com/app/citymapper/id469463298", "android_url": "https://play.google.com/store/apps/details?id=com.citymapper.app.release"},
    {"name": "Uber Boat by Thames Clippers", "description": "Battelli sul Tamigi integrati nel trasporto urbano", "description_en": "Thames river boats integrated into urban transport", "description_fr": "Bateaux sur la Tamise intégrés au transport urbain", "ios_url": "https://apps.apple.com/gb/app/uber-boat-by-thames-clippers/id1481405741", "android_url": "https://play.google.com/store/apps/details?id=com.thamesclippers.thamesclippers"}
  ]$$::jsonb,
  useful_apps = $$[
    {"name": "OpenTable", "description": "Prenotazione ristoranti e pub", "description_en": "Restaurant and pub reservations", "description_fr": "Réservations de restaurants et pubs", "ios_url": "https://apps.apple.com/app/opentable/id296581815", "android_url": "https://play.google.com/store/apps/details?id=com.opentable"},
    {"name": "Google Maps", "description": "Navigazione e ricerca luoghi", "description_en": "Navigation and place search", "description_fr": "Navigation et recherche de lieux", "ios_url": "https://apps.apple.com/app/google-maps/id585027354", "android_url": "https://play.google.com/store/apps/details?id=com.google.android.apps.maps"}
  ]$$::jsonb
WHERE city = 'londra';

-- ---------------------------------------------------------------------------
-- Neighborhoods
-- ---------------------------------------------------------------------------

UPDATE neighborhoods SET name_fr = $$Trastevere$$, description_fr = $$Le quartier le plus authentique et bohème de Rome. Ruelles pavées, trattorias historiques et vie nocturne animée. Idéal pour vivre la "vraie" Rome loin des foules touristiques du centre.$$ WHERE city = 'roma' AND name = 'Trastevere';
UPDATE neighborhoods SET name_fr = $$Centre historique$$, description_fr = $$Au coeur de Rome, à quelques pas des principaux monuments. Cher, mais imbattable pour l'emplacement. Idéal si vous voulez vous réveiller avec la fontaine de Trevi à cinq minutes à pied.$$ WHERE city = 'roma' AND name = 'Centro Storico';
UPDATE neighborhoods SET name_fr = $$Prati$$, description_fr = $$Quartier résidentiel élégant de l'autre côté du Tibre. Très bonne connexion au métro, calme le soir et riche en restaurants de qualité. À deux pas du Castel Sant'Angelo.$$ WHERE city = 'roma' AND name = 'Prati';
UPDATE neighborhoods SET name_fr = $$Testaccio$$, description_fr = $$Quartier authentique et populaire, coeur de la gastronomie romaine. On y mange une des meilleures cuisines traditionnelles de la ville. Très fréquenté par les locaux, moins par les touristes.$$ WHERE city = 'roma' AND name = 'Testaccio';
UPDATE neighborhoods SET name_fr = $$Monti$$, description_fr = $$Le quartier le plus créatif et décontracté de Rome, à deux pas du Colisée. Boutiques artisanales, bars à cocktails, galeries d'art et atmosphère agréable. Bon équilibre entre emplacement et prix.$$ WHERE city = 'roma' AND name = 'Monti';
UPDATE neighborhoods SET name_fr = $$Esquilino / Termini$$, description_fr = $$Zone pratique et bien reliée autour de la gare Termini. Prix accessibles et excellents transports. Idéale si vous vous déplacez beaucoup ou voulez économiser sur l'hébergement.$$ WHERE city = 'roma' AND name = 'Esquilino / Termini';

UPDATE neighborhoods SET name_fr = $$Brera$$, description_fr = $$Le quartier des artistes et des galeries, avec des rues élégantes et des adresses tendance. Excellente position centrale, près du Duomo. Prix élevés mais atmosphère unique.$$ WHERE city = 'milano' AND name = 'Brera';
UPDATE neighborhoods SET name_fr = $$Navigli$$, description_fr = $$Les canaux de Milan, coeur de la vie nocturne. Aperitivo au bord de l'eau, bars variés et street art. Idéal pour vivre la nuit milanaise.$$ WHERE city = 'milano' AND name = 'Navigli';
UPDATE neighborhoods SET name_fr = $$Porta Venezia$$, description_fr = $$Quartier multiculturel et vivant, avec l'une des plus longues rues commerçantes d'Europe, Corso Buenos Aires. Métro direct, prix raisonnables et grande variété de restaurants.$$ WHERE city = 'milano' AND name = 'Porta Venezia';
UPDATE neighborhoods SET name_fr = $$Centrale / Repubblica$$, description_fr = $$Zone autour de la gare centrale, pratique si vous arrivez en train. Très bien reliée à toute la ville par le métro. Bon rapport qualité-prix pour l'hébergement.$$ WHERE city = 'milano' AND name = 'Centrale / Repubblica';

UPDATE neighborhoods SET name_fr = $$El Born$$, description_fr = $$Quartier médiéval devenu un pôle créatif. Boutiques, bars à cocktails, galeries d'art et marché de Santa Caterina. À quelques pas de la Barceloneta et du quartier gothique.$$ WHERE city = 'barcellona' AND name = 'El Born';
UPDATE neighborhoods SET name_fr = $$Eixample$$, description_fr = $$Le quartier bourgeois dessiné par Cerdà, avec sa grille caractéristique. On y trouve la Sagrada Família. Très bonnes connexions en métro, restaurants de qualité et atmosphère moderne.$$ WHERE city = 'barcellona' AND name = 'Eixample';
UPDATE neighborhoods SET name_fr = $$Barceloneta$$, description_fr = $$Le quartier de la plage, idéal si vous ne voulez pas renoncer à la mer. Nombreux chiringuitos et restaurants de poisson. Il peut être bruyant en été, mais l'expérience est unique.$$ WHERE city = 'barcellona' AND name = 'Barceloneta';
UPDATE neighborhoods SET name_fr = $$Gràcia$$, description_fr = $$Ancien village absorbé par la ville, avec places animées, marchés locaux et atmosphère bohème très différente du centre touristique. Prix abordables et beaucoup d'authenticité.$$ WHERE city = 'barcellona' AND name = 'Gràcia';

UPDATE neighborhoods SET name_fr = $$Le Marais$$, description_fr = $$Le coeur historique et culturel de Paris, avec de beaux hôtels particuliers, des musées d'art moderne et une excellente vie nocturne. Vivant, coloré et toujours animé.$$ WHERE city = 'parigi' AND name = 'Le Marais';
UPDATE neighborhoods SET name_fr = $$Saint-Germain-des-Prés$$, description_fr = $$Le quartier littéraire et intellectuel de Paris, avec cafés historiques, boutiques de luxe et atmosphère élégante. Proche du musée d'Orsay et du jardin du Luxembourg.$$ WHERE city = 'parigi' AND name = 'Saint-Germain-des-Prés';
UPDATE neighborhoods SET name_fr = $$Montmartre$$, description_fr = $$Le quartier légendaire des artistes, avec la basilique du Sacré-Coeur et de superbes vues sur la ville. Romantique et pittoresque le jour, animé le soir.$$ WHERE city = 'parigi' AND name = 'Montmartre';
UPDATE neighborhoods SET name_fr = $$Bastille / Oberkampf$$, description_fr = $$Le quartier le plus vivant de Paris pour la vie nocturne. Bars, clubs, concerts et jeunesse locale remplissent les rues. Prix plus accessibles que dans le centre.$$ WHERE city = 'parigi' AND name = 'Bastille / Oberkampf';

UPDATE neighborhoods SET name_fr = $$Shoreditch$$, description_fr = $$La capitale créative de Londres, avec street art, marchés vintage et quelques-uns des meilleurs bars de la ville. Le secteur le plus tendance du moment, fréquenté par artistes et jeunes professionnels.$$ WHERE city = 'londra' AND name = 'Shoreditch';
UPDATE neighborhoods SET name_fr = $$South Bank$$, description_fr = $$Sur la rive sud de la Tamise, avec la Tate Modern, le Shakespeare's Globe et Borough Market. Très bon emplacement pour visiter les grands musées sans prendre le métro.$$ WHERE city = 'londra' AND name = 'South Bank';
UPDATE neighborhoods SET name_fr = $$Notting Hill$$, description_fr = $$Élégant et pittoresque, avec les célèbres maisons colorées de Portobello Road et son marché. Proche des musées de South Kensington. Idéal pour les familles et les amateurs de style britannique.$$ WHERE city = 'londra' AND name = 'Notting Hill';
UPDATE neighborhoods SET name_fr = $$Covent Garden$$, description_fr = $$Emplacement ultra central, à quelques pas du West End et de la National Gallery. Très touristique, mais pratique si vous voulez être près de tout. Prix élevés.$$ WHERE city = 'londra' AND name = 'Covent Garden';
