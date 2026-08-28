const FOOD_ICON_ROWS: Record<string, Array<[string, string]>> = {
  amburgo: [
    ["Fischbrötchen", "🥪"], ["Labskaus", "🍳"], ["Franzbrötchen", "🥐"], ["Rote Grütze", "🍓"],
    ["Birnen, Bohnen und Speck", "🍐"], ["Hamburger Aalsuppe", "🥣"], ["Scholle Finkenwerder Art", "🐟"], ["Grünkohl mit Kassler", "🥬"],
  ],
  amsterdam: [
    ["Stamppot", "🥔"], ["Hollandse Nieuwe", "🐟"], ["Stroopwafel", "🧇"], ["Bitterballen", "🧆"],
    ["Rijsttafel", "🍛"], ["Poffertjes", "🥞"], ["Erwtensoep", "🥣"], ["Kaas", "🧀"],
  ],
  annecy: [
    ["Tartiflette", "🥔"], ["Fondue Savoyarde", "🫕"], ["Raclette", "🧀"], ["Diots au vin blanc", "🌭"],
    ["Gratins Savoyard", "🍲"], ["Truite du lac", "🐟"], ["Reblochon Fermier", "🥛"], ["Génépi", "🥃"],
  ],
  antalya: [
    ["Piyaz di Antalya", "🫘"], ["Kabak tatlısı", "🎃"], ["Hibeş", "🥣"], ["Şiş köfte", "🍢"],
    ["Gözleme", "🫓"], ["Tahinli pide", "🥖"], ["Dondurma turca", "🍦"], ["Simit", "🥨"],
  ],
  atene: [
    ["Moussaka", "🍆"], ["Souvlaki", "🍢"], ["Spanakopita", "🥧"], ["Tzatziki", "🥒"],
    ["Taramasalata", "🐟"], ["Loukoumades", "🍩"], ["Saganaki", "🧀"], ["Pastitsio", "🍝"],
  ],
  barcellona: [
    ["Pa amb Tomàquet", "🍅"], ["Fideuà", "🥘"], ["Croquetas de Jamón", "🧆"], ["Bombas de la Barceloneta", "🥔"],
    ["Crema Catalana", "🍮"], ["Escalivada", "🥗"], ["Patatas Bravas", "🍟"], ["Coca de Recapte", "🫓"],
  ],
  bergen: [
    ["Bergensk fiskesuppe", "🥣"], ["Persetorsk", "🐟"], ["Raspeballer", "🥔"], ["Skillingsboller", "🥐"],
    ["Pinnekjøtt", "🍖"], ["Gravlaks", "🍣"], ["Svele", "🥞"], ["Brunost", "🧀"],
  ],
  berlino: [
    ["Currywurst", "🌭"], ["Doner berlinese", "🥙"], ["Eisbein mit Sauerkraut", "🍖"], ["Berliner Pfannkuchen", "🍩"],
    ["Sauerbraten", "🥩"], ["Boulette mit Kartoffelsalat", "🍔"], ["Königsberger Klopse", "🧆"], ["Berliner Weisse", "🍺"],
  ],
  bratislava: [
    ["Bryndzové halušky", "🍝"], ["Kapustnica", "🥣"], ["Bratislavský rožok", "🥐"], ["Vyprážaný syr", "🧀"],
    ["Zemiakové placky", "🥞"], ["Gulas slovacco", "🍲"], ["Pirohy", "🥟"], ["Birra slovacca", "🍺"],
  ],
  bruges: [
    ["Moules-frites", "🦪"], ["Carbonade fiamminga", "🍲"], ["Crocchette di gamberi", "🍤"], ["Waffle belga", "🧇"],
    ["Cioccolato belga", "🍫"], ["Stoemp", "🥔"], ["Birra trappista", "🍺"], ["Speculoos", "🍪"],
  ],
  bucarest: [
    ["Sarmale", "🥬"], ["Mici", "🌭"], ["Ciorbă de burtă", "🥣"], ["Papanași", "🍩"],
    ["Cozonac", "🍞"], ["Zacuscă", "🍆"], ["Ciorbă de perișoare", "🍲"], ["Țuică", "🥃"],
  ],
  budapest: [
    ["Gulyás", "🍲"], ["Lángos", "🫓"], ["Halászlé", "🐟"], ["Töltött káposzta", "🥬"],
    ["Gundel palacsinta", "🥞"], ["Tokaji Aszú", "🍷"], ["Kürtőskalács", "🧁"], ["Foie gras ungherese", "🦆"],
  ],
  candia: [
    ["Dakos", "🥗"], ["Kalitsounia", "🥧"], ["Gamopilafo", "🍚"], ["Antikristo", "🍖"],
    ["Bougatsa cretese", "🥐"], ["Chochlioi boubouristi", "🐌"], ["Souvlaki greco", "🍢"], ["Raki cretese", "🥃"],
  ],
  colonia: [
    ["Kölsch", "🍺"], ["Himmel un Äd", "🍎"], ["Halve Hahn", "🥪"], ["Rheinischer Sauerbraten", "🥩"],
    ["Reibekuchen", "🥞"], ["Kölner Kaviar", "🌭"], ["Muscheln in Kölsch", "🦪"], ["Eau de Cologne Cake", "🍰"],
  ],
  copenaghen: [
    ["Smørrebrød", "🥪"], ["Frikadeller", "🧆"], ["Stegt flæsk", "🥓"], ["Flæskestegssandwich", "🍔"],
    ["Rød pølse", "🌭"], ["Æbleskiver", "🥞"], ["Kanelsnegl", "🥐"], ["Risalamande", "🍚"],
  ],
  helsinki: [
    ["Lohikeitto", "🍲"], ["Karjalanpiirakka", "🥟"], ["Poronkäristys", "🍖"], ["Paistetut silakat", "🐟"],
    ["Korvapuusti", "🥐"], ["Leipäjuusto e lakka", "🧀"], ["Hernekeitto e pannukakku", "🥣"], ["Vorschmack", "🍛"],
  ],
  cracovia: [
    ["Pierogi", "🥟"], ["Obwarzanek krakowski", "🥨"], ["Żurek", "🥣"], ["Zapiekanka", "🥖"],
    ["Bigos", "🍲"], ["Kiełbasa", "🌭"], ["Sernik", "🍰"], ["Kompot", "🥤"],
  ],
  dublino: [
    ["Irish Stew", "🍲"], ["Boxty", "🥞"], ["Coddle", "🌭"], ["Fish and Chips", "🐟"],
    ["Full Irish Breakfast", "🍳"], ["Seafood Chowder", "🦪"], ["Soda Bread", "🍞"], ["Barmbrack", "🍰"],
  ],
  dubrovnik: [
    ["Crni rižot", "🦑"], ["Šporki makaruli", "🍝"], ["Zelena menestra", "🥬"], ["Dubrovačka rozata", "🍮"],
    ["Peka dalmata", "🍖"], ["Salata od hobotnice", "🐙"], ["Stonske kamenice", "🦪"], ["Mantala", "🍇"],
  ],
  reykjavik: [
    ["Kjötsúpa", "🍲"], ["Plokkfiskur", "🐟"], ["Íslenskt lambakjöt", "🍖"], ["Pylsur", "🌭"],
    ["Rúgbrauð", "🍞"], ["Skyr", "🥛"], ["Kleinur", "🍩"], ["Hákarl", "🦈"],
  ],
  edimburgo: [
    ["Haggis", "🍖"], ["Cullen Skink", "🥣"], ["Scotch Pie", "🥧"], ["Shortbread", "🍪"],
    ["Cranachan", "🍓"], ["Neeps and Tatties", "🥕"], ["Salmone affumicato scozzese", "🍣"], ["Tablet", "🍬"],
  ],
  firenze: [
    ["Bistecca alla Fiorentina", "🥩"], ["Lampredotto", "🥪"], ["Pappa al Pomodoro", "🍅"], ["Ribollita", "🥣"],
    ["Crostini Neri", "🥖"], ["Panzanella", "🥗"], ["Schiacciata Fiorentina", "🍰"], ["Cantucci con Vin Santo", "🍪"],
  ],
  francoforte: [
    ["Frankfurter Würstchen", "🌭"], ["Apfelwein", "🥂"], ["Grüne Soße", "🌿"], ["Handkäs mit Musik", "🧀"],
    ["Bethmännchen", "🍪"], ["Rippchen mit Kraut", "🍖"], ["Brezel", "🥨"], ["Currywurst", "🍛"],
  ],
  istanbul: [
    ["Kebap", "🍢"], ["Balik ekmek", "🥪"], ["Meze", "🫒"], ["Lahmacun", "🍕"],
    ["Simit", "🥨"], ["Baklava", "🍯"], ["Kofte", "🧆"], ["Midye dolma", "🦪"],
  ],
  lione: [
    ["Quenelle de brochet", "🐟"], ["Salade Lyonnaise", "🥗"], ["Grattons", "🥓"], ["Cervelle de canut", "🧀"],
    ["Tarte à la praline", "🥧"], ["Andouillette à la lyonnaise", "🌭"], ["Gratin de cardons à la moelle", "🍲"], ["Beaujolais Nouveau", "🍷"],
  ],
  lisbona: [
    ["Bacalhau à Brás", "🐟"], ["Pastel de Nata", "🥧"], ["Cataplana de Marisco", "🦐"], ["Caldo Verde", "🥬"],
    ["Açorda de Mariscos", "🥣"], ["Arroz de Pato", "🍚"], ["Ginjinha", "🍷"], ["Bifana", "🥪"],
  ],
  londra: [
    ["Fish and Chips", "🐟"], ["Full English Breakfast", "🍳"], ["Sunday Roast", "🍖"], ["Chicken Tikka Masala", "🍛"],
    ["Afternoon Tea", "🫖"], ["Pie and Mash", "🥧"], ["Eton Mess", "🍓"], ["Scotch Egg", "🥚"],
  ],
  madrid: [
    ["Cocido madrileño", "🍲"], ["Bocadillo de calamares", "🥪"], ["Tortilla española", "🍳"], ["Callos a la madrileña", "🥣"],
    ["Churros con chocolate", "🍩"], ["Croquetas de jamón", "🧆"], ["Patatas bravas", "🥔"], ["Oreja a la plancha", "🥩"],
  ],
  marrakech: [
    ["Tagine", "🥘"], ["Couscous", "🍚"], ["Pastilla", "🥧"], ["Harira", "🥣"],
    ["Msemen", "🫓"], ["Baghrir", "🥞"], ["Chebakia", "🍯"], ["Tè alla menta", "🫖"],
  ],
  marsiglia: [
    ["Bouillabaisse", "🐟"], ["Panisse", "🧆"], ["Aïoli", "🧄"], ["Pieds et paquets", "🍲"],
    ["Navettes", "🍪"], ["Chichi frégi", "🍩"], ["Tapenade", "🫒"], ["Pastis", "🥃"],
  ],
  milano: [
    ["Risotto alla milanese", "🍚"], ["Cotoletta alla milanese", "🍖"], ["Ossobuco", "🥩"], ["Panettone", "🍰"],
    ["Mondeghili", "🧆"], ["Cassoeula", "🍲"], ["Michetta", "🥖"], ["Campari Soda", "🍹"],
  ],
  monaco_di_baviera: [
    ["Weißwurst", "🌭"], ["Brezel", "🥨"], ["Schweinshaxe", "🍖"], ["Leberkäse", "🥪"],
    ["Obatzda", "🧀"], ["Käsespätzle", "🍝"], ["Apfelstrudel", "🍎"], ["Helles", "🍺"],
  ],
  "muğla": [
    ["Muğla Köftesi", "🧆"], ["Çökertme Kebabı", "🍢"], ["Keşkek", "🍲"], ["Gözleme", "🫓"],
    ["Börek", "🥧"], ["Simit", "🥨"], ["Lokma", "🍩"], ["Sütlaç", "🍮"],
  ],
  napoli: [
    ["Pizza napoletana", "🍕"], ["Ragù napoletano", "🍝"], ["Genovese", "🧅"], ["Cuoppo", "🍤"],
    ["Pizza a portafoglio", "🫓"], ["Tarallo nzogna e pepe", "🥨"], ["Sfogliatella", "🥐"], ["Babà", "🍰"],
  ],
  oslo: [
    ["Fårikål", "🍲"], ["Kjøttkaker", "🧆"], ["Rakfisk", "🐟"], ["Gravlaks", "🍣"],
    ["Reinsdyrgryte", "🥩"], ["Skillingsbolle", "🥐"], ["Waffle norvegese", "🧇"], ["Brunost", "🧀"],
  ],
  parigi: [
    ["Croissant au Beurre", "🥐"], ["Steak-Frites", "🥩"], ["Soupe à l'Oignon", "🥣"], ["Crêpes Suzette", "🥞"],
    ["Escargots de Bourgogne", "🐌"], ["Tarte Tatin", "🍎"], ["Croque-Monsieur", "🥪"], ["Macaron Parisien", "🍪"],
  ],
  porto: [
    ["Francesinha", "🥪"], ["Tripas à moda do Porto", "🍲"], ["Bacalhau à Gomes de Sá", "🐟"], ["Pastel de nata", "🥧"],
    ["Bolinho de bacalhau", "🧆"], ["Caldo verde", "🥣"], ["Polvo à lagareiro", "🐙"], ["Rabanadas", "🍞"],
  ],
  praga: [
    ["Svíčková na smetaně", "🥩"], ["Vepřo knedlo zelo", "🍖"], ["Pilsner Urquell", "🍺"], ["Trdelník", "🥨"],
    ["Guláš ceco", "🍲"], ["Smažený sýr", "🧀"], ["Bramborové knedlíky", "🥔"], ["Utopenci", "🌭"],
  ],
  roma: [
    ["Cacio e Pepe", "🧀"], ["Carbonara", "🍳"], ["Supplì al Telefono", "🍙"], ["Amatriciana", "🍅"],
    ["Coda alla Vaccinara", "🍲"], ["Carciofo alla Romana e alla Giudia", "🥬"], ["Maritozzo con la Panna", "🥐"], ["Gricia", "🥓"],
  ],
  salisburgo: [
    ["Mozartkugel", "🍫"], ["Salzburger Nockerl", "🍰"], ["Tafelspitz", "🥩"], ["Weißwurst", "🌭"],
    ["Kasnocken", "🍝"], ["Tiroler Gröstl", "🥔"], ["Strudel di mele", "🍎"], ["Brettljause", "🧀"],
  ],
  siviglia: [
    ["Espinacas con garbanzos", "🫘"], ["Pescaíto frito", "🐟"], ["Solomillo al whisky", "🥩"], ["Montadito de pringá", "🥪"],
    ["Gazpacho andaluz", "🍅"], ["Torrijas", "🍞"], ["Huevos a la flamenca", "🍳"], ["Caracoles", "🐌"],
  ],
  stoccolma: [
    ["Köttbullar", "🧆"], ["Toast Skagen", "🍤"], ["Gravlax", "🍣"], ["Smörgåsbord", "🍽️"],
    ["Kanelbulle", "🥐"], ["Räkmacka", "🥪"], ["Sill", "🐟"], ["Prinsesstårta", "🍰"],
  ],
  tallinn: [
    ["Mulgipuder", "🥔"], ["Verivorst", "🌭"], ["Sült", "🍖"], ["Kiluvõileib", "🥪"],
    ["Kama", "🥣"], ["Hapukapsas", "🥬"], ["Vastlakukkel", "🥐"], ["Kohuke", "🍫"],
  ],
  valencia: [
    ["Paella Valenciana", "🥘"], ["Fideuà", "🍝"], ["Esgarraet", "🐟"], ["All i Pebre", "🍲"],
    ["Clóchinas", "🦪"], ["Bunyols de Carbassa", "🍩"], ["Horchata con Fartons", "🥛"], ["Agua de Valencia", "🍹"],
  ],
  valletta: [
    ["Pastizzi", "🥟"], ["Fenkata", "🐇"], ["Stuffat tal-fenek", "🍲"], ["Ftira Għawdxija", "🫓"],
    ["Aljotta", "🐟"], ["Timpana", "🥧"], ["Imqaret", "🌴"], ["Qagħaq tal-għasel", "🍯"],
  ],
  varsavia: [
    ["Pierogi", "🥟"], ["Żurek", "🥣"], ["Bigos", "🍲"], ["Kotlet Schabowy", "🍖"],
    ["Zapiekanka", "🥖"], ["Pączki", "🍩"], ["Barszcz", "🍅"], ["Sernik", "🍰"],
  ],
  venezia: [
    ["Sarde in saor", "🐟"], ["Baccalà mantecato", "🥣"], ["Cicchetti", "🥪"], ["Fegato alla veneziana", "🥩"],
    ["Risi e bisi", "🍚"], ["Moeche", "🦀"], ["Bigoli in salsa", "🍝"], ["Bussolà", "🍪"],
  ],
  vienna: [
    ["Wiener Schnitzel", "🍖"], ["Tafelspitz", "🥩"], ["Apfelstrudel", "🍎"], ["Sachertorte", "🍫"],
    ["Kaiserschmarrn", "🥞"], ["Gulasch viennese", "🍲"], ["Melange", "☕"], ["Käsekrainer", "🌭"],
  ],
};

function normalizeKey(value: string): string {
  return value.trim().toLocaleLowerCase();
}

const FOOD_ICONS = new Map<string, string>();

Object.entries(FOOD_ICON_ROWS).forEach(([city, rows]) => {
  rows.forEach(([name, icon]) => {
    FOOD_ICONS.set(normalizeKey(city) + ":" + normalizeKey(name), icon);
  });
});

export function curatedFoodIcon(city: string, canonicalName: string): string | undefined {
  return FOOD_ICONS.get(normalizeKey(city) + ":" + normalizeKey(canonicalName));
}

export function curatedFoodIconCount(): number {
  return FOOD_ICONS.size;
}

export function curatedFoodIconCities(): string[] {
  return Object.keys(FOOD_ICON_ROWS);
}

export function curatedFoodIconsForCity(city: string): Array<[string, string]> {
  return [...(FOOD_ICON_ROWS[normalizeKey(city)] ?? [])];
}
