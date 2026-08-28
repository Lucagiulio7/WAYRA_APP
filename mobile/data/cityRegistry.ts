export type LocalizedLabels = Record<string, string>;

export type CityRegistration = {
  id: string;
  country: string;
  labels: LocalizedLabels;
  icon: string;
};

export type CountryRegistration = {
  id: string;
  labels: LocalizedLabels;
};

const symbol = (...points: number[]) => String.fromCodePoint(...points);

export const COUNTRY_REGISTRY: CountryRegistration[] = [
  { id: "at", labels: { it: "Austria", en: "Austria", fr: "Autriche" , es: "Austria" } },
  { id: "be", labels: { it: "Belgio", en: "Belgium", fr: "Belgique" , es: "Belgica" } },
  { id: "cz", labels: { it: "Repubblica Ceca", en: "Czech Republic", fr: "Republique tcheque" , es: "Republica Checa" } },
  { id: "de", labels: { it: "Germania", en: "Germany", fr: "Allemagne" , es: "Alemania" } },
  { id: "dk", labels: { it: "Danimarca", en: "Denmark", fr: "Danemark" , es: "Dinamarca" } },
  { id: "ee", labels: { it: "Estonia", en: "Estonia", fr: "Estonie" , es: "Estonia" } },
  { id: "es", labels: { it: "Spagna", en: "Spain", fr: "Espagne" , es: "Espana" } },
  { id: "fr", labels: { it: "Francia", en: "France", fr: "France" , es: "Francia" } },
  { id: "fi", labels: { it: "Finlandia", en: "Finland", fr: "Finlande", es: "Finlandia" } },
  { id: "gb", labels: { it: "Regno Unito", en: "United Kingdom", fr: "Royaume-Uni" , es: "Reino Unido" } },
  { id: "gr", labels: { it: "Grecia", en: "Greece", fr: "Grece" , es: "Grecia" } },
  { id: "hu", labels: { it: "Ungheria", en: "Hungary", fr: "Hongrie" , es: "Hungria" } },
  { id: "hr", labels: { it: "Croazia", en: "Croatia", fr: "Croatie", es: "Croacia" } },
  { id: "is", labels: { it: "Islanda", en: "Iceland", fr: "Islande", es: "Islandia" } },
  { id: "ie", labels: { it: "Irlanda", en: "Ireland", fr: "Irlande" , es: "Irlanda" } },
  { id: "it", labels: { it: "Italia", en: "Italy", fr: "Italie" , es: "Italia" } },
  { id: "ma", labels: { it: "Marocco", en: "Morocco", fr: "Maroc" , es: "Marruecos" } },
  { id: "mt", labels: { it: "Malta", en: "Malta", fr: "Malte", es: "Malta" } },
  { id: "nl", labels: { it: "Paesi Bassi", en: "Netherlands", fr: "Pays-Bas" , es: "Paises Bajos" } },
  { id: "no", labels: { it: "Norvegia", en: "Norway", fr: "Norvege" , es: "Noruega" } },
  { id: "pl", labels: { it: "Polonia", en: "Poland", fr: "Pologne" , es: "Polonia" } },
  { id: "pt", labels: { it: "Portogallo", en: "Portugal", fr: "Portugal" , es: "Portugal" } },
  { id: "ro", labels: { it: "Romania", en: "Romania", fr: "Roumanie" , es: "Rumania" } },
  { id: "se", labels: { it: "Svezia", en: "Sweden", fr: "Suede" , es: "Suecia" } },
  { id: "ch", labels: { it: "Svizzera", en: "Switzerland", fr: "Suisse", es: "Suiza" } },
  { id: "si", labels: { it: "Slovenia", en: "Slovenia", fr: "Slovénie", es: "Eslovenia" } },
  { id: "sk", labels: { it: "Slovacchia", en: "Slovakia", fr: "Slovaquie" , es: "Eslovaquia" } },
  { id: "tr", labels: { it: "Turchia", en: "Turkey", fr: "Turquie" , es: "Turquia" } },
];

export const CITY_REGISTRY: CityRegistration[] = [
  { id: "amburgo", country: "de", labels: { it: "Amburgo", en: "Hamburg", fr: "Hambourg" , es: "Hamburgo" }, icon: symbol(0x2693) },
  { id: "amsterdam", country: "nl", labels: { it: "Amsterdam", en: "Amsterdam", fr: "Amsterdam" , es: "Amsterdam" }, icon: symbol(0x1f6b2) },
  { id: "annecy", country: "fr", labels: { it: "Annecy", en: "Annecy", fr: "Annecy" , es: "Annecy" }, icon: symbol(0x1f3de) },
  { id: "antalya", country: "tr", labels: { it: "Antalya", en: "Antalya", fr: "Antalya" , es: "Antalya" }, icon: symbol(0x1f3d6, 0xfe0f) },
  { id: "atene", country: "gr", labels: { it: "Atene", en: "Athens", fr: "Athenes" , es: "Atenas" }, icon: symbol(0x1f3db) },
  { id: "barcellona", country: "es", labels: { it: "Barcellona", en: "Barcelona", fr: "Barcelone" , es: "Barcelona" }, icon: symbol(0x1f30a) },
  { id: "bergen", country: "no", labels: { it: "Bergen", en: "Bergen", fr: "Bergen" , es: "Bergen" }, icon: symbol(0x1f3a3) },
  { id: "berlino", country: "de", labels: { it: "Berlino", en: "Berlin", fr: "Berlin" , es: "Berlin" }, icon: symbol(0x1f43b) },
  { id: "bratislava", country: "sk", labels: { it: "Bratislava", en: "Bratislava", fr: "Bratislava" , es: "Bratislava" }, icon: symbol(0x1f3ef) },
  { id: "bruxelles", country: "be", labels: { it: "Bruxelles", en: "Brussels", fr: "Bruxelles", es: "Bruselas" }, icon: symbol(0x269b, 0xfe0f) },
  { id: "bruges", country: "be", labels: { it: "Bruges", en: "Bruges", fr: "Bruges" , es: "Brujas" }, icon: symbol(0x1f6a4) },
  { id: "bucarest", country: "ro", labels: { it: "Bucarest", en: "Bucharest", fr: "Bucarest" , es: "Bucarest" }, icon: symbol(0x1f339) },
  { id: "budapest", country: "hu", labels: { it: "Budapest", en: "Budapest", fr: "Budapest" , es: "Budapest" }, icon: symbol(0x267e, 0xfe0f) },
  { id: "candia", country: "gr", labels: { it: "Candia", en: "Heraklion", fr: "Heraklion" , es: "Heraclion" }, icon: symbol(0x1f3fa) },
  { id: "colonia", country: "de", labels: { it: "Colonia", en: "Cologne", fr: "Cologne" , es: "Colonia" }, icon: symbol(0x26ea) },
  { id: "copenaghen", country: "dk", labels: { it: "Copenaghen", en: "Copenhagen", fr: "Copenhague" , es: "Copenhague" }, icon: symbol(0x1f6b2) },
  { id: "cracovia", country: "pl", labels: { it: "Cracovia", en: "Krakow", fr: "Cracovie" , es: "Cracovia" }, icon: symbol(0x1f985) },
  { id: "dublino", country: "ie", labels: { it: "Dublino", en: "Dublin", fr: "Dublin" , es: "Dublin" }, icon: symbol(0x1f340) },
  { id: "dubrovnik", country: "hr", labels: { it: "Dubrovnik", en: "Dubrovnik", fr: "Dubrovnik", es: "Dubrovnik" }, icon: symbol(0x1f3f0) },
  { id: "reykjavik", country: "is", labels: { it: "Reykjavík", en: "Reykjavík", fr: "Reykjavík", es: "Reikiavik" }, icon: symbol(0x1f30b) },
  { id: "edimburgo", country: "gb", labels: { it: "Edimburgo", en: "Edinburgh", fr: "Edimbourg" , es: "Edimburgo" }, icon: symbol(0x1f3f0) },
  { id: "firenze", country: "it", labels: { it: "Firenze", en: "Florence", fr: "Florence" , es: "Florencia" }, icon: symbol(0x1f338) },
  { id: "francoforte", country: "de", labels: { it: "Francoforte", en: "Frankfurt", fr: "Francfort" , es: "Francfort" }, icon: symbol(0x1f3e6) },
  { id: "helsinki", country: "fi", labels: { it: "Helsinki", en: "Helsinki", fr: "Helsinki", es: "Helsinki" }, icon: symbol(0x1f9ed) },
  { id: "istanbul", country: "tr", labels: { it: "Istanbul", en: "Istanbul", fr: "Istanbul" , es: "Estambul" }, icon: symbol(0x1f54c) },
  { id: "lione", country: "fr", labels: { it: "Lione", en: "Lyon", fr: "Lyon" , es: "Lyon" }, icon: symbol(0x1f981) },
  { id: "lisbona", country: "pt", labels: { it: "Lisbona", en: "Lisbon", fr: "Lisbonne" , es: "Lisboa" }, icon: symbol(0x1f68b) },
  { id: "londra", country: "gb", labels: { it: "Londra", en: "London", fr: "Londres" , es: "Londres" }, icon: symbol(0x1f3a1) },
  { id: "lubiana", country: "si", labels: { it: "Lubiana", en: "Ljubljana", fr: "Ljubljana", es: "Liubliana" }, icon: symbol(0x1f409) },
  { id: "madrid", country: "es", labels: { it: "Madrid", en: "Madrid", fr: "Madrid" , es: "Madrid" }, icon: symbol(0x1f3a8) },
  { id: "marrakech", country: "ma", labels: { it: "Marrakech", en: "Marrakech", fr: "Marrakech" , es: "Marrakech" }, icon: symbol(0x1f334) },
  { id: "marsiglia", country: "fr", labels: { it: "Marsiglia", en: "Marseille", fr: "Marseille" , es: "Marsella" }, icon: symbol(0x2693) },
  { id: "milano", country: "it", labels: { it: "Milano", en: "Milan", fr: "Milan" , es: "Milan" }, icon: symbol(0x1f48e) },
  { id: "monaco_di_baviera", country: "de", labels: { it: "Monaco di Baviera", en: "Munich", fr: "Munich" , es: "Munich" }, icon: symbol(0x1f37a) },
  { id: "muğla", country: "tr", labels: { it: "Muğla", en: "Muğla", fr: "Muğla" , es: "Mugla" }, icon: symbol(0x1f6e5, 0xfe0f) },
  { id: "napoli", country: "it", labels: { it: "Napoli", en: "Naples", fr: "Naples" , es: "Napoles" }, icon: symbol(0x1f355) },
  { id: "oslo", country: "no", labels: { it: "Oslo", en: "Oslo", fr: "Oslo" , es: "Oslo" }, icon: symbol(0x1f3d4, 0xfe0f) },
  { id: "parigi", country: "fr", labels: { it: "Parigi", en: "Paris", fr: "Paris" , es: "Paris" }, icon: symbol(0x1f5fc) },
  { id: "porto", country: "pt", labels: { it: "Porto", en: "Porto", fr: "Porto" , es: "Oporto" }, icon: symbol(0x1f377) },
  { id: "praga", country: "cz", labels: { it: "Praga", en: "Prague", fr: "Prague" , es: "Praga" }, icon: symbol(0x1f3f0) },
  { id: "roma", country: "it", labels: { it: "Roma", en: "Rome", fr: "Rome" , es: "Roma" }, icon: symbol(0x1f3db, 0xfe0f) },
  { id: "salisburgo", country: "at", labels: { it: "Salisburgo", en: "Salzburg", fr: "Salzbourg" , es: "Salzburgo" }, icon: symbol(0x1f3b5) },
  { id: "siviglia", country: "es", labels: { it: "Siviglia", en: "Seville", fr: "Seville" , es: "Sevilla" }, icon: symbol(0x1f483) },
  { id: "stoccolma", country: "se", labels: { it: "Stoccolma", en: "Stockholm", fr: "Stockholm" , es: "Estocolmo" }, icon: symbol(0x1f30a) },
  { id: "tallinn", country: "ee", labels: { it: "Tallinn", en: "Tallinn", fr: "Tallinn" , es: "Tallin" }, icon: symbol(0x1f3f0) },
  { id: "valencia", country: "es", labels: { it: "Valencia", en: "Valencia", fr: "Valence" , es: "Valencia" }, icon: symbol(0x1f34a) },
  { id: "valletta", country: "mt", labels: { it: "Valletta", en: "Valletta", fr: "La Valette", es: "La Valeta" }, icon: symbol(0x2694, 0xfe0f) },
  { id: "varsavia", country: "pl", labels: { it: "Varsavia", en: "Warsaw", fr: "Varsovie" , es: "Varsovia" }, icon: symbol(0x2694, 0xfe0f) },
  { id: "venezia", country: "it", labels: { it: "Venezia", en: "Venice", fr: "Venise" , es: "Venecia" }, icon: symbol(0x1f6a3) },
  { id: "vienna", country: "at", labels: { it: "Vienna", en: "Vienna", fr: "Vienne" , es: "Viena" }, icon: symbol(0x1f3b5) },
  { id: "zurigo", country: "ch", labels: { it: "Zurigo", en: "Zurich", fr: "Zurich", es: "Zúrich" }, icon: symbol(0x1f3d4, 0xfe0f) },
];

function localizedLabel(labels: LocalizedLabels, lang: string): string {
  return labels[lang] ?? labels.en ?? labels.it ?? Object.values(labels)[0] ?? "";
}

export const COUNTRIES = COUNTRY_REGISTRY.map((country) => ({
  id: country.id,
  label: country.labels.it,
  labelEn: country.labels.en,
  labels: country.labels,
  cities: CITY_REGISTRY.filter((city) => city.country === country.id).map((city) => ({
    id: city.id,
    label: city.labels.it,
    labelEn: city.labels.en,
    labels: city.labels,
    emoji: city.icon,
  })),
}));

export const CITIES = COUNTRIES.flatMap((country) => country.cities);
export const CITY_EMOJI_MAP = Object.fromEntries(CITY_REGISTRY.map((city) => [city.id, city.icon]));

export function registeredCityLabel(cityId: string, lang: string): string | undefined {
  const city = CITY_REGISTRY.find((item) => item.id === cityId);
  return city ? localizedLabel(city.labels, lang) : undefined;
}

export function registeredCountryLabel(countryId: string, lang: string): string | undefined {
  const country = COUNTRY_REGISTRY.find((item) => item.id === countryId);
  return country ? localizedLabel(country.labels, lang) : undefined;
}
