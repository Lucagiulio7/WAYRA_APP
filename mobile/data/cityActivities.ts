export type ActivityKind =
  | "guided"
  | "ticket"
  | "cruise"
  | "dayTrip"
  | "food"
  | "nature"
  | "show"
  | "experience";

export type CityActivity = {
  kind: ActivityKind;
  subject: string;
};

const SUBJECT_REPLACEMENTS: Record<string, Array<[string, string]>> = {
  en: [
    ["città vecchia", "old town"], ["centro storico", "historic center"], ["al tramonto", "at sunset"],
    ["tour in bicicletta", "bike tour"], ["in bicicletta", "by bike"], ["bagno turco", "Turkish bath"],
    ["Museo dell'", "Museum of "], ["Museo del ", "Museum of "], ["Museo di ", "Museum of "], ["Museo ", "Museum "],
    ["Palazzo Reale", "Royal Palace"], ["Palazzo del ", "Palace of "], ["Castello del ", "Castle of "], ["Castello di ", "Castle of "],
    ["Cattedrale di ", "Cathedral of "], ["Cattedrale ", "Cathedral "], ["Basilica ", "Basilica "],
    ["isole", "islands"], ["canali", "canals"], ["cascate", "waterfalls"], ["fiordi", "fjords"], ["fiordo", "fjord"],
    ["lago di ", "Lake "], ["lago ", "lake "], ["monte ", "Mount "], ["valle del ", "valley of the "], ["Valle della Wachau", "Wachau Valley"],
    ["vigneti del ", "vineyards of "], ["vigneti", "vineyards"], ["cantine", "wine cellars"], ["vino", "wine"],
    ["cucina", "cuisine"], ["sapori", "flavors"], ["birrifici", "breweries"], ["birra", "beer"], ["cioccolato", "chocolate"],
    ["degustazione", "tasting"], ["musica classica", "classical music"], ["musica irlandese", "Irish music"],
    ["concerto di ", "concert of "], ["concerto ", "concert "], ["terme", "thermal baths"], ["sotterranei", "underground"],
    ["Gioielli della Corona", "Crown Jewels"], ["Guerra fredda", "Cold War"], ["grotta", "grotto"],
    ["spiaggia di ", "beach of "], ["parco nazionale", "national park"], ["parco", "park"], ["giardini", "gardens"],
    ["fortezza", "fortress"], ["souk", "souks"], ["palazzi", "palaces"], ["scogliere di ", "Cliffs of "],
    ["miniera di sale di ", "salt mine of "], ["quartiere ebraico", "Jewish quarter"], ["comunista", "communist history"],
    ["tradizionale", "traditional"], ["gastronomia", "food"], ["cima", "summit"], ["sei ponti sul ", "six bridges on the "],
    [" al ", " at "], [" sul ", " on "], [" della ", " of the "], [" delle ", " of the "], [" del ", " of the "], [" di ", " "], [" e ", " and "],
  ],
  fr: [
    ["città vecchia", "vieille ville"], ["centro storico", "centre historique"], ["al tramonto", "au coucher du soleil"],
    ["tour in bicicletta", "visite à vélo"], ["in bicicletta", "à vélo"], ["bagno turco", "bain turc"],
    ["Museo dell'", "Musée de l'"], ["Museo del ", "Musée du "], ["Museo di ", "Musée de "], ["Museo ", "Musée "],
    ["Palazzo Reale", "Palais royal"], ["Palazzo del ", "Palais du "], ["Castello del ", "Château du "], ["Castello di ", "Château de "],
    ["Cattedrale di ", "Cathédrale de "], ["Cattedrale ", "Cathédrale "], ["Basilica ", "Basilique "],
    ["isole", "îles"], ["canali", "canaux"], ["cascate", "cascades"], ["fiordi", "fjords"], ["fiordo", "fjord"],
    ["lago di ", "lac d'"], ["lago ", "lac "], ["monte ", "mont "], ["valle del ", "vallée du "], ["Valle della Wachau", "vallée de la Wachau"],
    ["vigneti del ", "vignobles du "], ["vigneti", "vignobles"], ["cantine", "caves"], ["vino", "vin"],
    ["cucina", "cuisine"], ["sapori", "saveurs"], ["birrifici", "brasseries"], ["birra", "bière"], ["cioccolato", "chocolat"],
    ["degustazione", "dégustation"], ["musica classica", "musique classique"], ["musica irlandese", "musique irlandaise"],
    ["concerto di ", "concert de "], ["concerto ", "concert "], ["terme", "thermes"], ["sotterranei", "souterrains"],
    ["Gioielli della Corona", "Joyaux de la Couronne"], ["Guerra fredda", "Guerre froide"], ["grotta", "grotte"],
    ["spiaggia di ", "plage d'"], ["parco nazionale", "parc national"], ["parco", "parc"], ["giardini", "jardins"],
    ["fortezza", "forteresse"], ["souk", "souks"], ["palazzi", "palais"], ["scogliere di ", "falaises de "],
    ["miniera di sale di ", "mine de sel de "], ["quartiere ebraico", "quartier juif"], ["comunista", "histoire communiste"],
    ["tradizionale", "traditionnel"], ["gastronomia", "gastronomie"], ["cima", "sommet"], ["sei ponti sul ", "six ponts sur le "],
    [" al ", " au "], [" sul ", " sur le "], [" della ", " de la "], [" delle ", " des "], [" del ", " du "], [" di ", " de "], [" e ", " et "],
  ],
  es: [
    ["città vecchia", "casco antiguo"], ["centro storico", "centro histórico"], ["al tramonto", "al atardecer"],
    ["tour in bicicletta", "tour en bicicleta"], ["in bicicletta", "en bicicleta"], ["bagno turco", "baño turco"],
    ["Museo dell'", "Museo de "], ["Museo del ", "Museo del "], ["Museo di ", "Museo de "], ["Museo ", "Museo "],
    ["Palazzo Reale", "Palacio Real"], ["Palazzo del ", "Palacio del "], ["Castello del ", "Castillo del "], ["Castello di ", "Castillo de "],
    ["Cattedrale di ", "Catedral de "], ["Cattedrale ", "Catedral "], ["Basilica ", "Basílica "],
    ["isole", "islas"], ["canali", "canales"], ["cascate", "cascadas"], ["fiordi", "fiordos"], ["fiordo", "fiordo"],
    ["lago di ", "lago de "], ["lago ", "lago "], ["monte ", "monte "], ["valle del ", "valle del "], ["Valle della Wachau", "valle de Wachau"],
    ["vigneti del ", "viñedos del "], ["vigneti", "viñedos"], ["cantine", "bodegas"], ["vino", "vino"],
    ["cucina", "cocina"], ["sapori", "sabores"], ["birrifici", "cervecerías"], ["birra", "cerveza"], ["cioccolato", "chocolate"],
    ["degustazione", "degustación"], ["musica classica", "música clásica"], ["musica irlandese", "música irlandesa"],
    ["concerto di ", "concierto de "], ["concerto ", "concierto "], ["terme", "termas"], ["sotterranei", "subterráneos"],
    ["Gioielli della Corona", "Joyas de la Corona"], ["Guerra fredda", "Guerra Fría"], ["grotta", "cueva"],
    ["spiaggia di ", "playa de "], ["parco nazionale", "parque nacional"], ["parco", "parque"], ["giardini", "jardines"],
    ["fortezza", "fortaleza"], ["souk", "zocos"], ["palazzi", "palacios"], ["scogliere di ", "acantilados de "],
    ["miniera di sale di ", "mina de sal de "], ["quartiere ebraico", "barrio judío"], ["comunista", "historia comunista"],
    ["tradizionale", "tradicional"], ["gastronomia", "gastronomía"], ["cima", "cima"], ["sei ponti sul ", "seis puentes sobre el "],
    [" al ", " al "], [" sul ", " sobre el "], [" della ", " de la "], [" delle ", " de las "], [" del ", " del "], [" di ", " de "], [" e ", " y "],
  ],
};

export function localizedActivitySubject(activity: CityActivity, lang: string, city?: string): string {
  if (lang === "it") return activity.subject;
  const cityKey = city?.toLocaleLowerCase();
  const activityIndex = cityKey ? CITY_ACTIVITY_CATALOG[cityKey]?.indexOf(activity) ?? -1 : -1;
  const curated = cityKey && activityIndex >= 0 ? ACTIVITY_SUBJECT_TRANSLATIONS[cityKey]?.[lang]?.[activityIndex] : undefined;
  if (curated) return curated;
  const replacements = SUBJECT_REPLACEMENTS[lang] ?? SUBJECT_REPLACEMENTS.en;
  return replacements.reduce((value, [source, target]) => value.replaceAll(source, target), activity.subject)
    .replace(/\s+/g, " ")
    .trim();
}

const a = (kind: ActivityKind, subject: string): CityActivity => ({ kind, subject });

export const CITY_ACTIVITY_CATALOG: Record<string, CityActivity[]> = {
  amburgo: [a("cruise", "Speicherstadt e porto"), a("ticket", "Miniatur Wunderland"), a("guided", "Elbphilharmonie"), a("guided", "Reeperbahn Beatles")],
  amsterdam: [a("cruise", "canali"), a("ticket", "Van Gogh Museum Rijksmuseum"), a("guided", "tour in bicicletta"), a("dayTrip", "Zaanse Schans Volendam")],
  annecy: [a("cruise", "lago di Annecy"), a("experience", "parapendio sul lago"), a("nature", "lago in bicicletta"), a("food", "centro storico")],
  antalya: [a("cruise", "città vecchia cascate Düden"), a("dayTrip", "Perge Aspendos Side"), a("nature", "cascate Düden"), a("experience", "bagno turco hammam")],
  atene: [a("guided", "Acropoli Partenone"), a("ticket", "Museo dell'Acropoli"), a("dayTrip", "Capo Sounion Tempio di Poseidone"), a("food", "sapori greci")],
  barcellona: [a("guided", "Sagrada Família"), a("ticket", "Park Güell"), a("food", "Barrio Gótico tapas"), a("dayTrip", "Montserrat")],
  bergen: [a("cruise", "fiordo Mostraumen"), a("experience", "Fløibanen monte Fløyen"), a("guided", "Bryggen"), a("dayTrip", "fiordi norvegesi")],
  berlino: [a("guided", "Muro di Berlino Guerra fredda"), a("ticket", "Isola dei Musei"), a("guided", "Reichstag centro storico"), a("dayTrip", "Sachsenhausen")],
  bratislava: [a("guided", "centro storico Castello di Bratislava"), a("cruise", "Danubio Castello di Devín"), a("dayTrip", "Castello di Devín"), a("food", "vini slovacchi")],
  bruxelles: [a("guided", "Grand-Place e Art Nouveau"), a("ticket", "Atomium e Mini-Europe"), a("food", "cioccolato e birra belga"), a("dayTrip", "Gand e Bruges")],
  bruges: [a("cruise", "canali di Bruges"), a("guided", "centro medievale cioccolato"), a("experience", "birrifici belgi"), a("dayTrip", "Gand e Bruges")],
  bucarest: [a("guided", "Palazzo del Parlamento"), a("guided", "Bucarest comunista centro storico"), a("experience", "Therme București"), a("dayTrip", "Castelli di Peleș e Bran")],
  budapest: [a("cruise", "Danubio al tramonto"), a("guided", "Parlamento di Budapest"), a("ticket", "terme Széchenyi"), a("food", "cucina ungherese")],
  candia: [a("guided", "Palazzo di Cnosso"), a("ticket", "Museo Archeologico di Heraklion"), a("food", "vino e olio cretesi"), a("dayTrip", "Spinalonga")],
  colonia: [a("guided", "Duomo di Colonia centro storico"), a("cruise", "Reno"), a("ticket", "Museo del Cioccolato"), a("food", "birra Kölsch")],
  copenaghen: [a("cruise", "canali di Copenaghen"), a("ticket", "Giardini di Tivoli"), a("food", "cucina nordica smørrebrød"), a("dayTrip", "castelli Selandia settentrionale")],
  cracovia: [a("guided", "Castello del Wawel centro storico"), a("dayTrip", "Auschwitz-Birkenau"), a("dayTrip", "Miniera di sale di Wieliczka"), a("guided", "Kazimierz quartiere ebraico")],
  dublino: [a("ticket", "Guinness Storehouse"), a("ticket", "Book of Kells Trinity College"), a("food", "whiskey pub musica irlandese"), a("dayTrip", "Scogliere di Moher")],
  dubrovnik: [a("guided", "mura e centro storico di Dubrovnik"), a("cruise", "isola di Lokrum e costa"), a("experience", "kayak sotto le mura"), a("dayTrip", "isole Elafiti")],
  reykjavik: [a("cruise", "avvistamento balene dalla baia di Reykjavík"), a("dayTrip", "Circolo d'Oro"), a("nature", "aurora boreale"), a("experience", "Sky Lagoon")],
  valletta: [a("guided", "Valletta e Concattedrale di San Giovanni"), a("cruise", "Grand Harbour e Three Cities"), a("dayTrip", "Mdina e Rabat"), a("nature", "Blue Grotto e templi megalitici")],
  edimburgo: [a("guided", "Castello di Edimburgo"), a("guided", "sotterranei fantasmi"), a("experience", "degustazione whisky scozzese"), a("dayTrip", "Highlands Loch Ness")],
  firenze: [a("guided", "Galleria degli Uffizi"), a("guided", "David di Michelangelo Accademia"), a("ticket", "Duomo Cupola del Brunelleschi"), a("dayTrip", "vigneti del Chianti")],
  francoforte: [a("cruise", "Meno skyline di Francoforte"), a("guided", "Römerberg centro storico"), a("dayTrip", "Valle del Reno"), a("dayTrip", "Heidelberg")],
  helsinki: [a("guided", "fortezza di Suomenlinna"), a("experience", "sauna finlandese sul Baltico"), a("cruise", "arcipelago di Helsinki"), a("guided", "design e architettura di Helsinki")],
  istanbul: [a("guided", "Santa Sofia Moschea Blu Topkapı"), a("cruise", "Bosforo al tramonto"), a("food", "sapori di Istanbul"), a("experience", "hammam tradizionale")],
  lione: [a("guided", "Vieux Lyon traboules"), a("food", "bouchon gastronomia lionese"), a("cruise", "Saona Rodano"), a("dayTrip", "vigneti del Beaujolais")],
  lisbona: [a("dayTrip", "Sintra Pena Cascais"), a("guided", "Belém monastero dos Jerónimos"), a("food", "pastéis de nata sapori portoghesi"), a("cruise", "Tago al tramonto")],
  londra: [a("guided", "Torre di Londra Gioielli della Corona"), a("guided", "Westminster Abbey Parlamento"), a("cruise", "Tamigi"), a("dayTrip", "Warner Bros Studio Harry Potter")],
  lubiana: [a("guided", "centro storico e architettura di Plečnik"), a("ticket", "Castello di Lubiana e funicolare"), a("food", "Mercato Centrale e cucina slovena"), a("dayTrip", "Lago di Bled e grotta di Postumia")],
  madrid: [a("guided", "Museo del Prado"), a("guided", "Palazzo Reale"), a("food", "tapas flamenco"), a("dayTrip", "Toledo Segovia")],
  marrakech: [a("guided", "medina souk palazzi"), a("experience", "deserto di Agafay al tramonto"), a("dayTrip", "Monti dell'Atlante"), a("food", "cucina marocchina mercato")],
  marsiglia: [a("nature", "Calanques in barca"), a("cruise", "Isole Frioul Château d'If"), a("food", "Vieux-Port bouillabaisse"), a("dayTrip", "Aix-en-Provence Cassis")],
  milano: [a("guided", "Duomo terrazze"), a("guided", "Ultima Cena di Leonardo"), a("guided", "Brera centro storico"), a("dayTrip", "Lago di Como")],
  monaco_di_baviera: [a("dayTrip", "Castello di Neuschwanstein"), a("guided", "centro storico di Monaco"), a("food", "birrifici birra bavarese"), a("dayTrip", "memoriale di Dachau")],
  "muğla": [a("cruise", "baie di Bodrum"), a("nature", "Dalyan spiaggia di İztuzu"), a("experience", "parapendio Ölüdeniz"), a("dayTrip", "Pamukkale")],
  napoli: [a("dayTrip", "Pompei Vesuvio"), a("food", "pizza napoletana centro storico"), a("dayTrip", "Capri Grotta Azzurra"), a("guided", "Napoli Sotterranea")],
  oslo: [a("cruise", "fiordo di Oslo"), a("ticket", "musei Fram Kon-Tiki"), a("guided", "Oslo parco Vigeland"), a("experience", "sauna sul fiordo")],
  parigi: [a("guided", "Museo del Louvre"), a("ticket", "Torre Eiffel cima"), a("cruise", "Senna al tramonto"), a("dayTrip", "Reggia di Versailles")],
  porto: [a("cruise", "sei ponti sul Douro"), a("experience", "cantine vino Porto Vila Nova de Gaia"), a("guided", "centro storico di Porto"), a("dayTrip", "Valle del Douro degustazione")],
  praga: [a("guided", "Castello di Praga Cattedrale San Vito"), a("cruise", "Moldava"), a("guided", "Città Vecchia Orologio Astronomico"), a("food", "birra ceca birrifici")],
  roma: [a("guided", "Colosseo Foro Romano Palatino"), a("guided", "Musei Vaticani Cappella Sistina"), a("food", "Trastevere cucina romana"), a("guided", "Catacombe Via Appia")],
  salisburgo: [a("guided", "fortezza Hohensalzburg centro storico"), a("experience", "Sound of Music"), a("dayTrip", "Hallstatt"), a("show", "concerto di Mozart")],
  siviglia: [a("guided", "Real Alcázar Cattedrale di Siviglia"), a("show", "flamenco"), a("food", "tapas Santa Cruz"), a("dayTrip", "Cordova Mezquita")],
  stoccolma: [a("cruise", "arcipelago di Stoccolma"), a("ticket", "Museo Vasa"), a("guided", "Gamla Stan"), a("food", "cucina svedese fika")],
  tallinn: [a("guided", "centro medievale di Tallinn"), a("dayTrip", "Parco nazionale Lahemaa"), a("food", "sapori estoni cucina medievale"), a("dayTrip", "Helsinki traghetto")],
  valencia: [a("ticket", "Città delle Arti Oceanogràfic"), a("food", "paella valenciana"), a("nature", "Albufera al tramonto"), a("guided", "Valencia in bicicletta")],
  varsavia: [a("guided", "Città Vecchia Castello Reale"), a("show", "concerto di Chopin"), a("guided", "Varsavia comunista"), a("dayTrip", "Żelazowa Wola casa natale Chopin")],
  venezia: [a("experience", "gondola Canal Grande"), a("guided", "Palazzo Ducale Basilica San Marco"), a("dayTrip", "Murano Burano Torcello"), a("food", "bacari cicchetti veneziani")],
  vienna: [a("guided", "Palazzo di Schönbrunn"), a("show", "concerto musica classica"), a("guided", "Hofburg Museo di Sissi"), a("dayTrip", "Valle della Wachau")],
  zurigo: [a("guided", "Altstadt e chiese della Riforma"), a("cruise", "lago di Zurigo"), a("nature", "Uetliberg e sentiero dei pianeti"), a("food", "formaggi e cioccolato svizzeri")],
};

const ACTIVITY_SUBJECT_TRANSLATIONS: Record<string, Record<string, string[]>> = {
  amburgo: { en: ["Speicherstadt and the harbor", "Miniatur Wunderland", "Elbphilharmonie", "Reeperbahn and the Beatles"], fr: ["Speicherstadt et le port", "Miniatur Wunderland", "Elbphilharmonie", "Reeperbahn et les Beatles"], es: ["Speicherstadt y el puerto", "Miniatur Wunderland", "Elbphilharmonie", "Reeperbahn y los Beatles"] },
  amsterdam: { en: ["Amsterdam canals", "Van Gogh Museum and Rijksmuseum", "bike tour", "Zaanse Schans and Volendam"], fr: ["canaux d'Amsterdam", "musée Van Gogh et Rijksmuseum", "visite à vélo", "Zaanse Schans et Volendam"], es: ["canales de Ámsterdam", "Museo Van Gogh y Rijksmuseum", "tour en bicicleta", "Zaanse Schans y Volendam"] },
  annecy: { en: ["Lake Annecy", "paragliding over the lake", "cycling around the lake", "Annecy old town"], fr: ["lac d'Annecy", "parapente au-dessus du lac", "tour du lac à vélo", "vieille ville d'Annecy"], es: ["lago de Annecy", "parapente sobre el lago", "vuelta al lago en bicicleta", "casco antiguo de Annecy"] },
  antalya: { en: ["old town and Düden waterfalls", "Perge, Aspendos and Side", "Düden waterfalls", "Turkish bath and hammam"], fr: ["vieille ville et cascades de Düden", "Perge, Aspendos et Side", "cascades de Düden", "bain turc et hammam"], es: ["casco antiguo y cascadas de Düden", "Perge, Aspendos y Side", "cascadas de Düden", "baño turco y hammam"] },
  atene: { en: ["Acropolis and Parthenon", "Acropolis Museum", "Cape Sounion and Temple of Poseidon", "Greek food and flavors"], fr: ["Acropole et Parthénon", "musée de l'Acropole", "cap Sounion et temple de Poséidon", "cuisine et saveurs grecques"], es: ["Acrópolis y Partenón", "Museo de la Acrópolis", "cabo Sunión y templo de Poseidón", "cocina y sabores griegos"] },
  barcellona: { en: ["Sagrada Família", "Park Güell", "Gothic Quarter and tapas", "Montserrat"], fr: ["Sagrada Família", "Park Güell", "quartier gothique et tapas", "Montserrat"], es: ["Sagrada Família", "Park Güell", "Barrio Gótico y tapas", "Montserrat"] },
  bergen: { en: ["Mostraumen fjord", "Fløibanen and Mount Fløyen", "Bryggen", "Norwegian fjords"], fr: ["fjord de Mostraumen", "Fløibanen et mont Fløyen", "Bryggen", "fjords norvégiens"], es: ["fiordo de Mostraumen", "Fløibanen y monte Fløyen", "Bryggen", "fiordos noruegos"] },
  berlino: { en: ["Berlin Wall and Cold War", "Museum Island", "Reichstag and historic center", "Sachsenhausen"], fr: ["mur de Berlin et Guerre froide", "île aux Musées", "Reichstag et centre historique", "Sachsenhausen"], es: ["Muro de Berlín y Guerra Fría", "Isla de los Museos", "Reichstag y centro histórico", "Sachsenhausen"] },
  bratislava: { en: ["historic center and Bratislava Castle", "Danube and Devín Castle", "Devín Castle", "Slovak wines"], fr: ["centre historique et château de Bratislava", "Danube et château de Devín", "château de Devín", "vins slovaques"], es: ["centro histórico y Castillo de Bratislava", "Danubio y Castillo de Devín", "Castillo de Devín", "vinos eslovacos"] },
  bruxelles: { en: ["Grand-Place and Art Nouveau", "Atomium and Mini-Europe", "Belgian chocolate and beer", "Ghent and Bruges"], fr: ["Grand-Place et Art nouveau", "Atomium et Mini-Europe", "chocolat et bière belges", "Gand et Bruges"], es: ["Grand-Place y Art Nouveau", "Atomium y Mini-Europe", "chocolate y cerveza belgas", "Gante y Brujas"] },
  bruges: { en: ["Bruges canals", "medieval center and chocolate", "Belgian breweries", "Ghent and Bruges"], fr: ["canaux de Bruges", "centre médiéval et chocolat", "brasseries belges", "Gand et Bruges"], es: ["canales de Brujas", "centro medieval y chocolate", "cervecerías belgas", "Gante y Brujas"] },
  bucarest: { en: ["Palace of Parliament", "communist Bucharest and old town", "Therme București", "Peleș and Bran castles"], fr: ["palais du Parlement", "Bucarest communiste et vieille ville", "Therme București", "châteaux de Peleș et Bran"], es: ["Palacio del Parlamento", "Bucarest comunista y casco antiguo", "Therme București", "castillos de Peleș y Bran"] },
  budapest: { en: ["Danube at sunset", "Hungarian Parliament", "Széchenyi thermal baths", "Hungarian cuisine"], fr: ["Danube au coucher du soleil", "Parlement hongrois", "thermes Széchenyi", "cuisine hongroise"], es: ["Danubio al atardecer", "Parlamento húngaro", "baños termales Széchenyi", "cocina húngara"] },
  candia: { en: ["Palace of Knossos", "Heraklion Archaeological Museum", "Cretan wine and olive oil", "Spinalonga"], fr: ["palais de Knossos", "musée archéologique d'Héraklion", "vin et huile d'olive crétois", "Spinalonga"], es: ["Palacio de Cnosos", "Museo Arqueológico de Heraclión", "vino y aceite de oliva cretenses", "Spinalonga"] },
  colonia: { en: ["Cologne Cathedral and old town", "Rhine", "Chocolate Museum", "Kölsch beer"], fr: ["cathédrale de Cologne et vieille ville", "Rhin", "musée du Chocolat", "bière Kölsch"], es: ["Catedral de Colonia y casco antiguo", "Rin", "Museo del Chocolate", "cerveza Kölsch"] },
  copenaghen: { en: ["Copenhagen canals", "Tivoli Gardens", "Nordic cuisine and smørrebrød", "castles of North Zealand"], fr: ["canaux de Copenhague", "jardins de Tivoli", "cuisine nordique et smørrebrød", "châteaux de Seeland du Nord"], es: ["canales de Copenhague", "Jardines de Tivoli", "cocina nórdica y smørrebrød", "castillos del norte de Selandia"] },
  cracovia: { en: ["Wawel Castle and old town", "Auschwitz-Birkenau", "Wieliczka Salt Mine", "Kazimierz Jewish Quarter"], fr: ["château du Wawel et vieille ville", "Auschwitz-Birkenau", "mine de sel de Wieliczka", "quartier juif de Kazimierz"], es: ["Castillo de Wawel y casco antiguo", "Auschwitz-Birkenau", "mina de sal de Wieliczka", "barrio judío de Kazimierz"] },
  dublino: { en: ["Guinness Storehouse", "Book of Kells and Trinity College", "whiskey, pubs and Irish music", "Cliffs of Moher"], fr: ["Guinness Storehouse", "Livre de Kells et Trinity College", "whiskey, pubs et musique irlandaise", "falaises de Moher"], es: ["Guinness Storehouse", "Libro de Kells y Trinity College", "whiskey, pubs y música irlandesa", "acantilados de Moher"] },
  dubrovnik: { en: ["Dubrovnik walls and old town", "Lokrum Island and coast", "kayaking beneath the walls", "Elaphiti Islands"], fr: ["remparts et vieille ville de Dubrovnik", "île de Lokrum et côte", "kayak sous les remparts", "îles Élaphites"], es: ["murallas y casco antiguo de Dubrovnik", "isla de Lokrum y costa", "kayak bajo las murallas", "islas Elafitas"] },
  reykjavik: { en: ["whale watching from Reykjavík bay", "Golden Circle", "northern lights", "Sky Lagoon"], fr: ["observation des baleines dans la baie de Reykjavík", "Cercle d'Or", "aurores boréales", "Sky Lagoon"], es: ["avistamiento de ballenas desde la bahía de Reikiavik", "Círculo Dorado", "aurora boreal", "Sky Lagoon"] },
  valletta: { en: ["Valletta and St John's Co-Cathedral", "Grand Harbour and the Three Cities", "Mdina and Rabat", "Blue Grotto and megalithic temples"], fr: ["La Valette et la co-cathédrale Saint-Jean", "Grand Harbour et les Trois Cités", "Mdina et Rabat", "Grotte Bleue et temples mégalithiques"], es: ["La Valeta y la Concatedral de San Juan", "Grand Harbour y las Tres Ciudades", "Mdina y Rabat", "Gruta Azul y templos megalíticos"] },
  edimburgo: { en: ["Edinburgh Castle", "underground vaults and ghosts", "Scotch whisky tasting", "Highlands and Loch Ness"], fr: ["château d'Édimbourg", "souterrains et fantômes", "dégustation de whisky écossais", "Highlands et Loch Ness"], es: ["Castillo de Edimburgo", "subterráneos y fantasmas", "degustación de whisky escocés", "Highlands y lago Ness"] },
  firenze: { en: ["Uffizi Gallery", "Michelangelo's David and Accademia", "Duomo and Brunelleschi's Dome", "Chianti vineyards"], fr: ["galerie des Offices", "David de Michel-Ange et Accademia", "Duomo et coupole de Brunelleschi", "vignobles du Chianti"], es: ["Galería Uffizi", "David de Miguel Ángel y Accademia", "Duomo y cúpula de Brunelleschi", "viñedos del Chianti"] },
  francoforte: { en: ["Main River and Frankfurt skyline", "Römerberg and old town", "Rhine Valley", "Heidelberg"], fr: ["Main et skyline de Francfort", "Römerberg et vieille ville", "vallée du Rhin", "Heidelberg"], es: ["río Meno y skyline de Fráncfort", "Römerberg y casco antiguo", "valle del Rin", "Heidelberg"] },
  helsinki: { en: ["Suomenlinna fortress", "Finnish sauna on the Baltic", "Helsinki archipelago", "Helsinki design and architecture"], fr: ["forteresse de Suomenlinna", "sauna finlandais sur la Baltique", "archipel d'Helsinki", "design et architecture d'Helsinki"], es: ["fortaleza de Suomenlinna", "sauna finlandesa junto al Báltico", "archipiélago de Helsinki", "diseño y arquitectura de Helsinki"] },
  istanbul: { en: ["Hagia Sophia, Blue Mosque and Topkapı", "Bosphorus at sunset", "flavors of Istanbul", "traditional hammam"], fr: ["Sainte-Sophie, Mosquée bleue et Topkapı", "Bosphore au coucher du soleil", "saveurs d'Istanbul", "hammam traditionnel"], es: ["Santa Sofía, Mezquita Azul y Topkapı", "Bósforo al atardecer", "sabores de Estambul", "hammam tradicional"] },
  lione: { en: ["Vieux Lyon and traboules", "bouchons and Lyon gastronomy", "Saône and Rhône", "Beaujolais vineyards"], fr: ["Vieux Lyon et traboules", "bouchons et gastronomie lyonnaise", "Saône et Rhône", "vignobles du Beaujolais"], es: ["Vieux Lyon y traboules", "bouchons y gastronomía lionesa", "Saona y Ródano", "viñedos del Beaujolais"] },
  lisbona: { en: ["Sintra, Pena and Cascais", "Belém and Jerónimos Monastery", "pastéis de nata and Portuguese flavors", "Tagus at sunset"], fr: ["Sintra, Pena et Cascais", "Belém et monastère des Hiéronymites", "pastéis de nata et saveurs portugaises", "Tage au coucher du soleil"], es: ["Sintra, Pena y Cascais", "Belém y Monasterio de los Jerónimos", "pastéis de nata y sabores portugueses", "Tajo al atardecer"] },
  londra: { en: ["Tower of London and Crown Jewels", "Westminster Abbey and Parliament", "River Thames", "Warner Bros. Harry Potter Studio"], fr: ["Tour de Londres et Joyaux de la Couronne", "abbaye de Westminster et Parlement", "Tamise", "studios Warner Bros. Harry Potter"], es: ["Torre de Londres y Joyas de la Corona", "Abadía de Westminster y Parlamento", "Támesis", "estudios Warner Bros. de Harry Potter"] },
  lubiana: { en: ["old town and Plečnik architecture", "Ljubljana Castle and funicular", "Central Market and Slovenian cuisine", "Lake Bled and Postojna Cave"], fr: ["vieille ville et architecture de Plečnik", "château de Ljubljana et funiculaire", "Marché central et cuisine slovène", "lac de Bled et grotte de Postojna"], es: ["casco antiguo y arquitectura de Plečnik", "Castillo de Liubliana y funicular", "Mercado Central y cocina eslovena", "lago Bled y cueva de Postojna"] },
  madrid: { en: ["Prado Museum", "Royal Palace", "tapas and flamenco", "Toledo and Segovia"], fr: ["musée du Prado", "Palais royal", "tapas et flamenco", "Tolède et Ségovie"], es: ["Museo del Prado", "Palacio Real", "tapas y flamenco", "Toledo y Segovia"] },
  marrakech: { en: ["medina, souks and palaces", "Agafay Desert at sunset", "Atlas Mountains", "Moroccan cuisine and markets"], fr: ["médina, souks et palais", "désert d'Agafay au coucher du soleil", "montagnes de l'Atlas", "cuisine marocaine et marchés"], es: ["medina, zocos y palacios", "desierto de Agafay al atardecer", "montañas del Atlas", "cocina marroquí y mercados"] },
  marsiglia: { en: ["Calanques by boat", "Frioul Islands and Château d'If", "Vieux-Port and bouillabaisse", "Aix-en-Provence and Cassis"], fr: ["Calanques en bateau", "îles du Frioul et château d'If", "Vieux-Port et bouillabaisse", "Aix-en-Provence et Cassis"], es: ["Calanques en barco", "islas Frioul y Château d'If", "Vieux-Port y bouillabaisse", "Aix-en-Provence y Cassis"] },
  milano: { en: ["Duomo and rooftop terraces", "Leonardo's Last Supper", "Brera and historic center", "Lake Como"], fr: ["Duomo et terrasses", "Cène de Léonard de Vinci", "Brera et centre historique", "lac de Côme"], es: ["Duomo y terrazas", "Última Cena de Leonardo", "Brera y centro histórico", "lago de Como"] },
  monaco_di_baviera: { en: ["Neuschwanstein Castle", "Munich old town", "Bavarian beer and breweries", "Dachau Memorial"], fr: ["château de Neuschwanstein", "vieille ville de Munich", "bière et brasseries bavaroises", "mémorial de Dachau"], es: ["Castillo de Neuschwanstein", "casco antiguo de Múnich", "cerveza y cervecerías bávaras", "Memorial de Dachau"] },
  "muğla": { en: ["Bodrum bays", "Dalyan and İztuzu Beach", "paragliding in Ölüdeniz", "Pamukkale"], fr: ["baies de Bodrum", "Dalyan et plage d'İztuzu", "parapente à Ölüdeniz", "Pamukkale"], es: ["bahías de Bodrum", "Dalyan y playa de İztuzu", "parapente en Ölüdeniz", "Pamukkale"] },
  napoli: { en: ["Pompeii and Mount Vesuvius", "Neapolitan pizza and old town", "Capri and Blue Grotto", "Naples Underground"], fr: ["Pompéi et Vésuve", "pizza napolitaine et centre historique", "Capri et Grotte Bleue", "Naples souterraine"], es: ["Pompeya y Vesubio", "pizza napolitana y centro histórico", "Capri y Gruta Azul", "Nápoles subterránea"] },
  oslo: { en: ["Oslo Fjord", "Fram and Kon-Tiki museums", "Oslo and Vigeland Park", "fjord sauna"], fr: ["fjord d'Oslo", "musées Fram et Kon-Tiki", "Oslo et parc Vigeland", "sauna sur le fjord"], es: ["fiordo de Oslo", "museos Fram y Kon-Tiki", "Oslo y parque Vigeland", "sauna en el fiordo"] },
  parigi: { en: ["Louvre Museum", "Eiffel Tower summit", "Seine at sunset", "Palace of Versailles"], fr: ["musée du Louvre", "sommet de la tour Eiffel", "Seine au coucher du soleil", "château de Versailles"], es: ["Museo del Louvre", "cima de la Torre Eiffel", "Sena al atardecer", "Palacio de Versalles"] },
  porto: { en: ["six bridges on the Douro", "Port wine cellars in Vila Nova de Gaia", "Porto historic center", "Douro Valley and wine tasting"], fr: ["six ponts sur le Douro", "caves de porto à Vila Nova de Gaia", "centre historique de Porto", "vallée du Douro et dégustation"], es: ["seis puentes sobre el Duero", "bodegas de vino de Oporto en Vila Nova de Gaia", "centro histórico de Oporto", "valle del Duero y degustación"] },
  praga: { en: ["Prague Castle and St. Vitus Cathedral", "Vltava River", "Old Town and Astronomical Clock", "Czech beer and breweries"], fr: ["château de Prague et cathédrale Saint-Guy", "Vltava", "Vieille Ville et horloge astronomique", "bière et brasseries tchèques"], es: ["Castillo de Praga y Catedral de San Vito", "río Moldava", "Ciudad Vieja y Reloj Astronómico", "cerveza y cervecerías checas"] },
  roma: { en: ["Colosseum, Roman Forum and Palatine Hill", "Vatican Museums and Sistine Chapel", "Trastevere and Roman cuisine", "Catacombs and Appian Way"], fr: ["Colisée, Forum romain et Palatin", "musées du Vatican et chapelle Sixtine", "Trastevere et cuisine romaine", "catacombes et voie Appienne"], es: ["Coliseo, Foro Romano y Palatino", "Museos Vaticanos y Capilla Sixtina", "Trastevere y cocina romana", "catacumbas y Vía Apia"] },
  salisburgo: { en: ["Hohensalzburg Fortress and old town", "Sound of Music", "Hallstatt", "Mozart concert"], fr: ["forteresse de Hohensalzburg et vieille ville", "Sound of Music", "Hallstatt", "concert de Mozart"], es: ["fortaleza de Hohensalzburg y casco antiguo", "Sound of Music", "Hallstatt", "concierto de Mozart"] },
  siviglia: { en: ["Royal Alcázar and Seville Cathedral", "flamenco", "tapas in Santa Cruz", "Córdoba and the Mezquita"], fr: ["Alcázar royal et cathédrale de Séville", "flamenco", "tapas à Santa Cruz", "Cordoue et Mezquita"], es: ["Real Alcázar y Catedral de Sevilla", "flamenco", "tapas en Santa Cruz", "Córdoba y Mezquita"] },
  stoccolma: { en: ["Stockholm archipelago", "Vasa Museum", "Gamla Stan", "Swedish cuisine and fika"], fr: ["archipel de Stockholm", "musée Vasa", "Gamla Stan", "cuisine suédoise et fika"], es: ["archipiélago de Estocolmo", "Museo Vasa", "Gamla Stan", "cocina sueca y fika"] },
  tallinn: { en: ["Tallinn medieval center", "Lahemaa National Park", "Estonian flavors and medieval cuisine", "ferry to Helsinki"], fr: ["centre médiéval de Tallinn", "parc national de Lahemaa", "saveurs estoniennes et cuisine médiévale", "ferry pour Helsinki"], es: ["centro medieval de Tallin", "Parque Nacional de Lahemaa", "sabores estonios y cocina medieval", "ferri a Helsinki"] },
  valencia: { en: ["City of Arts and Sciences and Oceanogràfic", "Valencian paella", "Albufera at sunset", "Valencia by bike"], fr: ["Cité des arts et des sciences et Oceanogràfic", "paella valencienne", "Albufera au coucher du soleil", "Valence à vélo"], es: ["Ciudad de las Artes y las Ciencias y Oceanogràfic", "paella valenciana", "Albufera al atardecer", "Valencia en bicicleta"] },
  varsavia: { en: ["Old Town and Royal Castle", "Chopin concert", "communist Warsaw", "Żelazowa Wola and Chopin's birthplace"], fr: ["Vieille Ville et Château royal", "concert de Chopin", "Varsovie communiste", "Żelazowa Wola et maison natale de Chopin"], es: ["Ciudad Vieja y Castillo Real", "concierto de Chopin", "Varsovia comunista", "Żelazowa Wola y casa natal de Chopin"] },
  venezia: { en: ["gondola on the Grand Canal", "Doge's Palace and St. Mark's Basilica", "Murano, Burano and Torcello", "bacari and Venetian cicchetti"], fr: ["gondole sur le Grand Canal", "Palais des Doges et basilique Saint-Marc", "Murano, Burano et Torcello", "bacari et cicchetti vénitiens"], es: ["góndola por el Gran Canal", "Palacio Ducal y Basílica de San Marcos", "Murano, Burano y Torcello", "bacari y cicchetti venecianos"] },
  vienna: { en: ["Schönbrunn Palace", "classical music concert", "Hofburg and Sisi Museum", "Wachau Valley"], fr: ["château de Schönbrunn", "concert de musique classique", "Hofburg et musée Sisi", "vallée de la Wachau"], es: ["Palacio de Schönbrunn", "concierto de música clásica", "Hofburg y Museo de Sisi", "valle de Wachau"] },
  zurigo: { en: ["old town and Reformation churches", "Lake Zurich", "Uetliberg and the Planet Trail", "Swiss cheese and chocolate"], fr: ["vieille ville et églises de la Réforme", "lac de Zurich", "Uetliberg et sentier des planètes", "fromages et chocolat suisses"], es: ["casco antiguo e iglesias de la Reforma", "lago de Zúrich", "Uetliberg y sendero de los planetas", "quesos y chocolate suizos"] },
};

export function cityActivities(city: string): CityActivity[] {
  return CITY_ACTIVITY_CATALOG[city.toLocaleLowerCase()] ?? [];
}
