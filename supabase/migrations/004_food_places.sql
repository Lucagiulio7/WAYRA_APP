-- ============================================================
-- WAYRA — Migration 004: colonna places per piatti tipici
-- Aggiunge 2 ristoranti consigliati per ogni piatto tipico
-- ============================================================

ALTER TABLE public.foods
  ADD COLUMN IF NOT EXISTS places JSONB DEFAULT '[]'::jsonb;

-- ── Roma ─────────────────────────────────────────────────────────────────────

UPDATE public.foods SET places = '[
  {"name": "Tonnarello", "maps_link": "https://www.google.com/maps/search/Tonnarello+Trastevere+Roma"},
  {"name": "Da Enzo al 29", "maps_link": "https://www.google.com/maps/search/Da+Enzo+al+29+Roma"}
]'::jsonb WHERE city = 'roma' AND name = 'Cacio e Pepe';

UPDATE public.foods SET places = '[
  {"name": "Roscioli", "maps_link": "https://www.google.com/maps/search/Roscioli+Roma"},
  {"name": "Grotte del Tevere", "maps_link": "https://www.google.com/maps/search/Grotte+del+Tevere+Roma"}
]'::jsonb WHERE city = 'roma' AND name = 'Carbonara';

UPDATE public.foods SET places = '[
  {"name": "Supplì Roma", "maps_link": "https://www.google.com/maps/search/Suppl%C3%AC+Roma+Trastevere"},
  {"name": "I Supplì", "maps_link": "https://www.google.com/maps/search/I+Suppl%C3%AC+Via+San+Francesco+a+Ripa+Roma"}
]'::jsonb WHERE city = 'roma' AND name = 'Supplì al Telefono';

UPDATE public.foods SET places = '[
  {"name": "Da Bucatino", "maps_link": "https://www.google.com/maps/search/Da+Bucatino+Testaccio+Roma"},
  {"name": "Osteria dell''Antiquario", "maps_link": "https://www.google.com/maps/search/Osteria+dell+Antiquario+Roma"}
]'::jsonb WHERE city = 'roma' AND name = 'Amatriciana';

UPDATE public.foods SET places = '[
  {"name": "Flavio al Velavevodetto", "maps_link": "https://www.google.com/maps/search/Flavio+al+Velavevodetto+Roma"},
  {"name": "Checchino dal 1887", "maps_link": "https://www.google.com/maps/search/Checchino+dal+1887+Roma"}
]'::jsonb WHERE city = 'roma' AND name = 'Coda alla Vaccinara';

UPDATE public.foods SET places = '[
  {"name": "Da Enzo al 29", "maps_link": "https://www.google.com/maps/search/Da+Enzo+al+29+Roma"},
  {"name": "Filettaro a Santa Barbara", "maps_link": "https://www.google.com/maps/search/Filettaro+a+Santa+Barbara+Roma"}
]'::jsonb WHERE city = 'roma' AND name = 'Carciofo alla Romana e alla Giudia';

UPDATE public.foods SET places = '[
  {"name": "Pasticceria Regoli", "maps_link": "https://www.google.com/maps/search/Pasticceria+Regoli+Roma"},
  {"name": "Bar San Calisto", "maps_link": "https://www.google.com/maps/search/Bar+San+Calisto+Trastevere+Roma"}
]'::jsonb WHERE city = 'roma' AND name = 'Maritozzo con la Panna';

UPDATE public.foods SET places = '[
  {"name": "Trattoria Morgana", "maps_link": "https://www.google.com/maps/search/Trattoria+Morgana+Roma"},
  {"name": "Osteria dei Ponziani", "maps_link": "https://www.google.com/maps/search/Osteria+dei+Ponziani+Roma"}
]'::jsonb WHERE city = 'roma' AND name = 'Gricia';

-- ── Milano ────────────────────────────────────────────────────────────────────

UPDATE public.foods SET places = '[
  {"name": "Trattoria Milanese", "maps_link": "https://www.google.com/maps/search/Trattoria+Milanese+Milano"},
  {"name": "Ratanà", "maps_link": "https://www.google.com/maps/search/Ratan%C3%A0+Milano"}
]'::jsonb WHERE city = 'milano' AND name = 'Risotto alla milanese';

UPDATE public.foods SET places = '[
  {"name": "Trattoria del Nuovo Macello", "maps_link": "https://www.google.com/maps/search/Trattoria+del+Nuovo+Macello+Milano"},
  {"name": "Al Matarel", "maps_link": "https://www.google.com/maps/search/Al+Matarel+Milano"}
]'::jsonb WHERE city = 'milano' AND name = 'Cotoletta alla milanese';

UPDATE public.foods SET places = '[
  {"name": "Osteria dell''Acquabella", "maps_link": "https://www.google.com/maps/search/Osteria+dell+Acquabella+Milano"},
  {"name": "Trattoria Milanese", "maps_link": "https://www.google.com/maps/search/Trattoria+Milanese+Milano"}
]'::jsonb WHERE city = 'milano' AND name = 'Ossobuco';

UPDATE public.foods SET places = '[
  {"name": "Marchesi 1824", "maps_link": "https://www.google.com/maps/search/Marchesi+1824+Milano"},
  {"name": "Pasticceria Cova", "maps_link": "https://www.google.com/maps/search/Pasticceria+Cova+Milano"}
]'::jsonb WHERE city = 'milano' AND name = 'Panettone';

UPDATE public.foods SET places = '[
  {"name": "Trattoria Masuelli San Marco", "maps_link": "https://www.google.com/maps/search/Trattoria+Masuelli+San+Marco+Milano"},
  {"name": "Osteria dell''Acquabella", "maps_link": "https://www.google.com/maps/search/Osteria+dell+Acquabella+Milano"}
]'::jsonb WHERE city = 'milano' AND name = 'Mondeghili';

UPDATE public.foods SET places = '[
  {"name": "Antica Osteria del Sempione", "maps_link": "https://www.google.com/maps/search/Antica+Osteria+del+Sempione+Milano"},
  {"name": "Trattoria Masuelli San Marco", "maps_link": "https://www.google.com/maps/search/Trattoria+Masuelli+San+Marco+Milano"}
]'::jsonb WHERE city = 'milano' AND name = 'Cassoeula';

UPDATE public.foods SET places = '[
  {"name": "Panificio Longoni", "maps_link": "https://www.google.com/maps/search/Panificio+Longoni+Milano"},
  {"name": "Pasticceria Marchesi", "maps_link": "https://www.google.com/maps/search/Pasticceria+Marchesi+Milano"}
]'::jsonb WHERE city = 'milano' AND name = 'Michetta';

UPDATE public.foods SET places = '[
  {"name": "Bar Basso", "maps_link": "https://www.google.com/maps/search/Bar+Basso+Milano"},
  {"name": "Nottingham Forest Bar", "maps_link": "https://www.google.com/maps/search/Nottingham+Forest+Bar+Milano"}
]'::jsonb WHERE city = 'milano' AND name = 'Campari Soda';

-- ── Barcellona ────────────────────────────────────────────────────────────────

UPDATE public.foods SET places = '[
  {"name": "Bar Calders", "maps_link": "https://www.google.com/maps/search/Bar+Calders+Barcelona"},
  {"name": "La Pepita Gràcia", "maps_link": "https://www.google.com/maps/search/La+Pepita+Gr%C3%A0cia+Barcelona"}
]'::jsonb WHERE city = 'barcellona' AND name = 'Pa amb Tomàquet';

UPDATE public.foods SET places = '[
  {"name": "7 Portes", "maps_link": "https://www.google.com/maps/search/7+Portes+Barcelona"},
  {"name": "La Mar Salada", "maps_link": "https://www.google.com/maps/search/La+Mar+Salada+Barcelona"}
]'::jsonb WHERE city = 'barcellona' AND name = 'Fideuà';

UPDATE public.foods SET places = '[
  {"name": "El Xampanyet", "maps_link": "https://www.google.com/maps/search/El+Xampanyet+Barcelona"},
  {"name": "El Quim de la Boqueria", "maps_link": "https://www.google.com/maps/search/El+Quim+de+la+Boqueria+Barcelona"}
]'::jsonb WHERE city = 'barcellona' AND name = 'Croquetas de Jamón';

UPDATE public.foods SET places = '[
  {"name": "La Cova Fumada", "maps_link": "https://www.google.com/maps/search/La+Cova+Fumada+Barcelona"},
  {"name": "Bar Leo", "maps_link": "https://www.google.com/maps/search/Bar+Leo+Barceloneta+Barcelona"}
]'::jsonb WHERE city = 'barcellona' AND name = 'Bombas de la Barceloneta';

UPDATE public.foods SET places = '[
  {"name": "Els Quatre Gats", "maps_link": "https://www.google.com/maps/search/Els+Quatre+Gats+Barcelona"},
  {"name": "Hofmann Pastisseria", "maps_link": "https://www.google.com/maps/search/Hofmann+Pastisseria+Barcelona"}
]'::jsonb WHERE city = 'barcellona' AND name = 'Crema Catalana';

UPDATE public.foods SET places = '[
  {"name": "Bar Marsella", "maps_link": "https://www.google.com/maps/search/Bar+Marsella+Barcelona"},
  {"name": "La Pepita Gràcia", "maps_link": "https://www.google.com/maps/search/La+Pepita+Gr%C3%A0cia+Barcelona"}
]'::jsonb WHERE city = 'barcellona' AND name = 'Escalivada';

UPDATE public.foods SET places = '[
  {"name": "Bar Tomás", "maps_link": "https://www.google.com/maps/search/Bar+Tom%C3%A1s+Barcelona"},
  {"name": "El Xampanyet", "maps_link": "https://www.google.com/maps/search/El+Xampanyet+Barcelona"}
]'::jsonb WHERE city = 'barcellona' AND name = 'Patatas Bravas';

UPDATE public.foods SET places = '[
  {"name": "Forn de Sant Jaume", "maps_link": "https://www.google.com/maps/search/Forn+de+Sant+Jaume+Barcelona"},
  {"name": "Federal Café", "maps_link": "https://www.google.com/maps/search/Federal+Caf%C3%A9+Barcelona"}
]'::jsonb WHERE city = 'barcellona' AND name = 'Coca de Recapte';

-- ── Parigi ────────────────────────────────────────────────────────────────────

UPDATE public.foods SET places = '[
  {"name": "Du Pain et des Idées", "maps_link": "https://www.google.com/maps/search/Du+Pain+et+des+Id%C3%A9es+Paris"},
  {"name": "Blé Sucré", "maps_link": "https://www.google.com/maps/search/Bl%C3%A9+Sucr%C3%A9+Paris"}
]'::jsonb WHERE city = 'parigi' AND name = 'Croissant au Beurre';

UPDATE public.foods SET places = '[
  {"name": "Au Relais de l''Entrecôte", "maps_link": "https://www.google.com/maps/search/Relais+de+l+Entrecote+Paris"},
  {"name": "Bistrot Paul Bert", "maps_link": "https://www.google.com/maps/search/Bistrot+Paul+Bert+Paris"}
]'::jsonb WHERE city = 'parigi' AND name = 'Steak-Frites';

UPDATE public.foods SET places = '[
  {"name": "Au Pied de Cochon", "maps_link": "https://www.google.com/maps/search/Au+Pied+de+Cochon+Paris"},
  {"name": "Chez L''Ami Louis", "maps_link": "https://www.google.com/maps/search/Chez+L+Ami+Louis+Paris"}
]'::jsonb WHERE city = 'parigi' AND name = 'Soupe à l''Oignon';

UPDATE public.foods SET places = '[
  {"name": "Crêperie de Josselin", "maps_link": "https://www.google.com/maps/search/Cr%C3%AAperie+de+Josselin+Paris"},
  {"name": "Breizh Café", "maps_link": "https://www.google.com/maps/search/Breizh+Caf%C3%A9+Paris"}
]'::jsonb WHERE city = 'parigi' AND name = 'Crêpes Suzette';

UPDATE public.foods SET places = '[
  {"name": "Allard", "maps_link": "https://www.google.com/maps/search/Allard+Paris"},
  {"name": "Au Pied de Cochon", "maps_link": "https://www.google.com/maps/search/Au+Pied+de+Cochon+Paris"}
]'::jsonb WHERE city = 'parigi' AND name = 'Escargots de Bourgogne';

UPDATE public.foods SET places = '[
  {"name": "Angelina Paris", "maps_link": "https://www.google.com/maps/search/Angelina+Paris"},
  {"name": "Brasserie Lipp", "maps_link": "https://www.google.com/maps/search/Brasserie+Lipp+Paris"}
]'::jsonb WHERE city = 'parigi' AND name = 'Tarte Tatin';

UPDATE public.foods SET places = '[
  {"name": "Café de Flore", "maps_link": "https://www.google.com/maps/search/Caf%C3%A9+de+Flore+Paris"},
  {"name": "Le Procope", "maps_link": "https://www.google.com/maps/search/Le+Procope+Paris"}
]'::jsonb WHERE city = 'parigi' AND name = 'Croque-Monsieur';

UPDATE public.foods SET places = '[
  {"name": "Ladurée Saint-Germain", "maps_link": "https://www.google.com/maps/search/Laur%C3%A9e+Saint-Germain+Paris"},
  {"name": "Pierre Hermé", "maps_link": "https://www.google.com/maps/search/Pierre+Herm%C3%A9+Paris"}
]'::jsonb WHERE city = 'parigi' AND name = 'Macaron Parisien';

-- ── Londra ────────────────────────────────────────────────────────────────────

UPDATE public.foods SET places = '[
  {"name": "The Golden Hind", "maps_link": "https://www.google.com/maps/search/The+Golden+Hind+London"},
  {"name": "Rock & Sole Plaice", "maps_link": "https://www.google.com/maps/search/Rock+and+Sole+Plaice+London"}
]'::jsonb WHERE city = 'londra' AND name = 'Fish and Chips';

UPDATE public.foods SET places = '[
  {"name": "Regency Café", "maps_link": "https://www.google.com/maps/search/Regency+Caf%C3%A9+London"},
  {"name": "E. Pellicci", "maps_link": "https://www.google.com/maps/search/E.+Pellicci+London"}
]'::jsonb WHERE city = 'londra' AND name = 'Full English Breakfast';

UPDATE public.foods SET places = '[
  {"name": "The Anchor & Hope", "maps_link": "https://www.google.com/maps/search/The+Anchor+and+Hope+London"},
  {"name": "Hawksmoor Seven Dials", "maps_link": "https://www.google.com/maps/search/Hawksmoor+Seven+Dials+London"}
]'::jsonb WHERE city = 'londra' AND name = 'Sunday Roast';

UPDATE public.foods SET places = '[
  {"name": "Dishoom Covent Garden", "maps_link": "https://www.google.com/maps/search/Dishoom+Covent+Garden+London"},
  {"name": "Gymkhana", "maps_link": "https://www.google.com/maps/search/Gymkhana+London"}
]'::jsonb WHERE city = 'londra' AND name = 'Chicken Tikka Masala';

UPDATE public.foods SET places = '[
  {"name": "The Wolseley", "maps_link": "https://www.google.com/maps/search/The+Wolseley+London"},
  {"name": "Sketch London", "maps_link": "https://www.google.com/maps/search/Sketch+London"}
]'::jsonb WHERE city = 'londra' AND name = 'Afternoon Tea';

UPDATE public.foods SET places = '[
  {"name": "M. Manze Bermondsey", "maps_link": "https://www.google.com/maps/search/M.+Manze+Bermondsey+London"},
  {"name": "G. Kelly Pie & Mash", "maps_link": "https://www.google.com/maps/search/G.+Kelly+Pie+and+Mash+London"}
]'::jsonb WHERE city = 'londra' AND name = 'Pie and Mash';

UPDATE public.foods SET places = '[
  {"name": "Rules Restaurant", "maps_link": "https://www.google.com/maps/search/Rules+Restaurant+London"},
  {"name": "The Ivy", "maps_link": "https://www.google.com/maps/search/The+Ivy+London"}
]'::jsonb WHERE city = 'londra' AND name = 'Eton Mess';

UPDATE public.foods SET places = '[
  {"name": "The Harwood Arms", "maps_link": "https://www.google.com/maps/search/The+Harwood+Arms+London"},
  {"name": "Borough Market", "maps_link": "https://www.google.com/maps/search/Borough+Market+London"}
]'::jsonb WHERE city = 'londra' AND name = 'Scotch Egg';
