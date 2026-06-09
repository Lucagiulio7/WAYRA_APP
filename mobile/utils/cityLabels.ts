const CITY_LABELS: Record<string, { it: string; en: string; fr?: string }> = {
  amburgo: { it: "Amburgo", en: "Hamburg" },
  amsterdam: { it: "Amsterdam", en: "Amsterdam" },
  annecy: { it: "Annecy", en: "Annecy" },
  antalya: { it: "Antalya", en: "Antalya" },
  atene: { it: "Atene", en: "Athens" },
  barcellona: { it: "Barcellona", en: "Barcelona" },
  bergen: { it: "Bergen", en: "Bergen" },
  berlino: { it: "Berlino", en: "Berlin" },
  bratislava: { it: "Bratislava", en: "Bratislava" },
  bruges: { it: "Bruges", en: "Bruges" },
  bucarest: { it: "Bucarest", en: "Bucharest" },
  budapest: { it: "Budapest", en: "Budapest" },
  candia: { it: "Candia", en: "Heraklion" },
  colonia: { it: "Colonia", en: "Cologne" },
  copenaghen: { it: "Copenaghen", en: "Copenhagen" },
  cracovia: { it: "Cracovia", en: "Krakow" },
  dublino: { it: "Dublino", en: "Dublin" },
  edimburgo: { it: "Edimburgo", en: "Edinburgh" },
  firenze: { it: "Firenze", en: "Florence" },
  francoforte: { it: "Francoforte", en: "Frankfurt" },
  istanbul: { it: "Istanbul", en: "Istanbul" },
  lione: { it: "Lione", en: "Lyon" },
  lisbona: { it: "Lisbona", en: "Lisbon" },
  londra: { it: "Londra", en: "London" },
  madrid: { it: "Madrid", en: "Madrid" },
  marrakech: { it: "Marrakech", en: "Marrakech" },
  marsiglia: { it: "Marsiglia", en: "Marseille" },
  milano: { it: "Milano", en: "Milan" },
  monaco_di_baviera: { it: "Monaco di Baviera", en: "Munich" },
  "muğla": { it: "Muğla", en: "Muğla" },
  napoli: { it: "Napoli", en: "Naples" },
  oslo: { it: "Oslo", en: "Oslo" },
  parigi: { it: "Parigi", en: "Paris" },
  porto: { it: "Porto", en: "Porto" },
  praga: { it: "Praga", en: "Prague" },
  roma: { it: "Roma", en: "Rome" },
  salisburgo: { it: "Salisburgo", en: "Salzburg" },
  siviglia: { it: "Siviglia", en: "Seville" },
  stoccolma: { it: "Stoccolma", en: "Stockholm" },
  tallinn: { it: "Tallinn", en: "Tallinn" },
  valencia: { it: "Valencia", en: "Valencia" },
  varsavia: { it: "Varsavia", en: "Warsaw" },
  venezia: { it: "Venezia", en: "Venice" },
  vienna: { it: "Vienna", en: "Vienna" },
};

function fallbackCityLabel(city: string): string {
  return city
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function cityLabel(city: string, lang: string = "it"): string {
  const labels = CITY_LABELS[city];
  if (!labels) return fallbackCityLabel(city);
  if (lang === "fr") return labels.fr ?? labels.en ?? labels.it;
  return lang === "en" ? labels.en : labels.it;
}
