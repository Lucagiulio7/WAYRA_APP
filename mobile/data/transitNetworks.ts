import AsyncStorage from "@react-native-async-storage/async-storage";

export type TransitCoordinate = [number, number];
export type TransitMode = "metro" | "tram" | "train" | "trolleybus" | "bus" | "water" | "mixed";

export interface TransitLine {
  id: string;
  name: string;
  color: string;
  textColor: string;
  mode?: Exclude<TransitMode, "mixed">;
  paths: TransitCoordinate[][];
}

export interface TransitStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  lineIds: string[];
  linePositions: Array<{
    lineId: string;
    latitude: number;
    longitude: number;
  }>;
}

export interface TransitNetwork {
  city: string;
  label: string;
  mode: TransitMode;
  badge: string;
  lines: TransitLine[];
  stations: TransitStation[];
  fetchedAt: number;
}

export function transitPresentation(mode: TransitMode | undefined, lang: string) {
  const language = (["it", "en", "fr", "es"].includes(lang) ? lang : "it") as "it" | "en" | "fr" | "es";
  const copy = {
    metro: {
      label: { it: "Metro", en: "Metro", fr: "Métro", es: "Metro" },
      station: { it: "Stazione metro", en: "Metro station", fr: "Station de métro", es: "Estación de metro" },
      loading: { it: "Caricamento metro...", en: "Loading metro...", fr: "Chargement du métro...", es: "Cargando metro..." },
    },
    tram: {
      label: { it: "Tram", en: "Tram", fr: "Tramway", es: "Tranvía" },
      station: { it: "Fermata tram", en: "Tram stop", fr: "Arrêt de tramway", es: "Parada de tranvía" },
      loading: { it: "Caricamento tram...", en: "Loading trams...", fr: "Chargement des tramways...", es: "Cargando tranvías..." },
    },
    train: {
      label: { it: "Treno", en: "Train", fr: "Train", es: "Tren" },
      station: { it: "Stazione ferroviaria", en: "Railway station", fr: "Gare", es: "Estación ferroviaria" },
      loading: { it: "Caricamento treni...", en: "Loading trains...", fr: "Chargement des trains...", es: "Cargando trenes..." },
    },
    trolleybus: {
      label: { it: "Filobus", en: "Trolleybus", fr: "Trolleybus", es: "Trolebús" },
      station: { it: "Fermata filobus", en: "Trolleybus stop", fr: "Arrêt de trolleybus", es: "Parada de trolebús" },
      loading: { it: "Caricamento filobus...", en: "Loading trolleybuses...", fr: "Chargement des trolleybus...", es: "Cargando trolebuses..." },
    },
    bus: {
      label: { it: "Bus utili", en: "Useful buses", fr: "Bus utiles", es: "Autobuses útiles" },
      station: { it: "Fermata bus", en: "Bus stop", fr: "Arrêt de bus", es: "Parada de autobús" },
      loading: { it: "Caricamento bus...", en: "Loading buses...", fr: "Chargement des bus...", es: "Cargando autobuses..." },
    },
    water: {
      label: { it: "Vaporetti", en: "Water buses", fr: "Bateaux-bus", es: "Vaporetti" },
      station: { it: "Approdo", en: "Water-bus stop", fr: "Arrêt de bateau-bus", es: "Parada de vaporetto" },
      loading: { it: "Caricamento vaporetti...", en: "Loading water buses...", fr: "Chargement des bateaux-bus...", es: "Cargando vaporetti..." },
    },
    mixed: {
      label: { it: "Trasporti", en: "Transport", fr: "Transports", es: "Transportes" },
      station: { it: "Fermata", en: "Stop", fr: "Arrêt", es: "Parada" },
      loading: { it: "Caricamento trasporti...", en: "Loading transport...", fr: "Chargement des transports...", es: "Cargando transportes..." },
    },
  } as const;
  const selected = copy[mode ?? "metro"];
  return { label: selected.label[language], station: selected.station[language], loading: selected.loading[language] };
}

type TransitCityConfig = {
  bbox: [number, number, number, number];
  label: string;
  mode?: TransitMode;
  badge?: string;
  routeTypes?: Array<"subway" | "light_rail" | "tram" | "trolleybus" | "bus" | "ferry" | "train">;
  routeRefPattern?: string;
  acceptsLine: (ref: string, name: string, network: string) => boolean;
  colors: Record<string, string>;
};

type OsmMember = { type: string; ref: number; role?: string };
type OsmElement = {
  type: "node" | "relation" | string;
  id: number;
  lat?: number;
  lon?: number;
  nodes?: number[];
  members?: OsmMember[];
  tags?: Record<string, string>;
};

const CACHE_VERSION = 9;
const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const pendingRequests = new Map<string, Promise<TransitNetwork | null>>();

const LONDON_COLORS: Record<string, string> = {
  BAKERLOO: "#B36305",
  CENTRAL: "#E32017",
  CIRCLE: "#FFD300",
  DISTRICT: "#00782A",
  "HAMMERSMITH&CITY": "#F3A9BB",
  HAMMERSMITHCITY: "#F3A9BB",
  "HAMMERSMITHANDCITY": "#F3A9BB",
  JUBILEE: "#7A868C",
  METROPOLITAN: "#9B0056",
  NORTHERN: "#111111",
  PICCADILLY: "#003688",
  VICTORIA: "#0098D4",
  "WATERLOO&CITY": "#95CDBA",
  WATERLOOCITY: "#95CDBA",
  "WATERLOOANDCITY": "#95CDBA",
};

const PARIS_COLORS: Record<string, string> = {
  "1": "#FFCD00", "2": "#003CA6", "3": "#837902", "3BIS": "#6EC4E8",
  "4": "#CF009E", "5": "#FF7E2E", "6": "#6ECA97", "7": "#FA9ABA",
  "7BIS": "#6ECA97", "8": "#E19BDF", "9": "#B6BD00", "10": "#C9910D",
  "11": "#704B1C", "12": "#007852", "13": "#6EC4E8", "14": "#62259D",
};

const BERLIN_COLORS: Record<string, string> = {
  U1: "#7DAD4C", U2: "#DA421E", U3: "#16683D", U4: "#F0D722",
  U5: "#7E5330", U6: "#8C6DAB", U7: "#528DBA", U8: "#224F86", U9: "#F3791D",
};

const MADRID_COLORS: Record<string, string> = {
  "1": "#2DBEF0", "2": "#E1261C", "3": "#FFD100", "4": "#A05DA5",
  "5": "#97D700", "6": "#9E7C0C", "7": "#F58220", "8": "#F3A4C7",
  "9": "#A5A7AA", "10": "#0050A4", "11": "#00A651", "12": "#A49800",
  R: "#FFFFFF",
};

const MILAN_COLORS: Record<string, string> = {
  M1: "#E31E24", M2: "#60A644", M3: "#F8C300", M4: "#2E79B9", M5: "#9B59B6",
  "1": "#E31E24", "2": "#60A644", "3": "#F8C300", "4": "#2E79B9", "5": "#9B59B6",
};

const EXPANDED_METRO_COLORS: Record<string, Record<string, string>> = {
  amburgo: { U1: "#0066B3", U2: "#E2001A", U3: "#FFD800", U4: "#00A6A6" },
  amsterdam: { "50": "#00A651", "51": "#F58220", "52": "#E31E24", "53": "#0072BC", "54": "#FFD200" },
  atene: { "1": "#009640", "2": "#E30613", "3": "#0072BC", M1: "#009640", M2: "#E30613", M3: "#0072BC" },
  barcellona: { L1: "#E30613", L2: "#9B2583", L3: "#1EB53A", L4: "#FFD100", L5: "#005EB8", L6: "#7B2D8E", L7: "#8B6F4E", L8: "#E84A8A", L9N: "#F28C00", L9S: "#F28C00", L10N: "#00A6D6", L10S: "#00A6D6", L11: "#A6CE39", L12: "#B59A57" },
  bucarest: { M1: "#F2C500", M2: "#0057A8", M3: "#E31E24", M4: "#55A646", M5: "#F58220" },
  budapest: { M1: "#FFD200", M2: "#E41F25", M3: "#005CA9", M4: "#4CA22F" },
  copenaghen: { M1: "#009A44", M2: "#FFD500", M3: "#E31E24", M4: "#0072CE" },
  helsinki: { M1: "#F28C00", M2: "#F28C00", "1": "#169B62", "2": "#169B62", "3": "#169B62", "4": "#169B62", "6": "#169B62", "7": "#169B62", "8": "#169B62", "9": "#169B62", "10": "#169B62" },
  francoforte: { U1: "#009640", U2: "#E30613", U3: "#005CA9", U4: "#FFD500", U5: "#6F2C91", U6: "#00A6A6", U7: "#F58220", U8: "#8B6F47", U9: "#A6CE39" },
  lione: { A: "#E94B87", B: "#0072BC", C: "#F58220", D: "#009A44" },
  lisbona: { AZUL: "#0072BC", BLUE: "#0072BC", AMARELA: "#FFD500", YELLOW: "#FFD500", VERDE: "#009A44", GREEN: "#009A44", VERMELHA: "#E31E24", RED: "#E31E24" },
  marsiglia: { M1: "#0072BC", M2: "#E31E24", "1": "#0072BC", "2": "#E31E24" },
  monaco_di_baviera: { U1: "#009A44", U2: "#E31E24", U3: "#F58220", U4: "#00A6A6", U5: "#8B5A2B", U6: "#0072BC", U7: "#009A44", U8: "#E31E24" },
  napoli: { "1": "#FFD500", "6": "#0072BC", L1: "#FFD500", L6: "#0072BC" },
  oslo: { "1": "#00A651", "2": "#F58220", "3": "#6F2C91", "4": "#0072BC", "5": "#009A44" },
  porto: { A: "#0072BC", B: "#E31E24", C: "#009A44", D: "#FFD500", E: "#7B2D8E", F: "#F58220" },
  praga: { A: "#009A44", B: "#FFD500", C: "#E31E24" },
  roma: { A: "#F58220", B: "#0072BC", B1: "#0072BC", C: "#009A44" },
  stoccolma: { "10": "#0072BC", "11": "#0072BC", "13": "#E31E24", "14": "#E31E24", "17": "#009A44", "18": "#009A44", "19": "#009A44" },
  valencia: { "1": "#F2C500", "2": "#E94B87", "3": "#E31E24", "5": "#009A44", "7": "#F58220", "9": "#8B5A2B" },
  varsavia: { M1: "#0072BC", M2: "#E31E24" },
  vienna: { U1: "#E31E24", U2: "#8B2D8E", U3: "#F58220", U4: "#009A44", U6: "#8B5A2B" },
};

const SURFACE_TRANSIT_COLORS: Record<string, Record<string, string>> = {
  antalya: { T1: "#E31E24", T2: "#6F2C91", T3: "#0072BC", "1": "#E31E24", "2": "#6F2C91", "3": "#0072BC" },
  bergen: { "1": "#E6007E", "2": "#00A6D6" },
  bruxelles: { "1": "#B2388D", "2": "#F58220", "3": "#A7A9AC", "4": "#F7A8B8", "5": "#E6C700", "6": "#0067A0", "7": "#F58220", "8": "#8B5A2B", "9": "#C8102E", "10": "#6F2C91", "18": "#009A44", "19": "#B2388D", "25": "#0072BC", "39": "#D97706", "44": "#DC2626", "51": "#059669", "55": "#6F2C91", "62": "#2563EB", "81": "#E6B800", "82": "#E31E24", "92": "#009A44", "93": "#0072BC", "97": "#F58220" },
  dublino: { RED: "#D71920", GREEN: "#009A44" },
  firenze: { T1: "#008D7C", T2: "#6F2C91", "1": "#008D7C", "2": "#6F2C91" },
  siviglia: { "1": "#008D58", L1: "#008D58" },
  tallinn: { T1: "#E31E24", T2: "#0072BC", T3: "#009A44", T4: "#6F2C91", T5: "#F58220" },
  venezia: { "1": "#E31E24", "2": "#0072BC", "4.1": "#009A44", "4.2": "#009A44", "5.1": "#F58220", "5.2": "#F58220", "6": "#6F2C91", "12": "#00A6D6", N: "#1F2937" },
};

const CONFIGS: Record<string, TransitCityConfig> = {
  londra: {
    bbox: [51.28, -0.52, 51.70, 0.34],
    label: "London Underground",
    colors: LONDON_COLORS,
    acceptsLine: (_ref, name, network) => /underground/i.test(`${name} ${network}`),
  },
  parigi: {
    bbox: [48.78, 2.12, 49.02, 2.58],
    label: "Metro de Paris",
    colors: PARIS_COLORS,
    acceptsLine: (ref, name, network) => /^(?:[1-9]|1[0-4])(?:bis)?$/i.test(ref) && /m[eé]tro|ratp/i.test(`${name} ${network}`),
  },
  berlino: {
    bbox: [52.33, 13.08, 52.68, 13.76],
    label: "Berlin U-Bahn",
    colors: BERLIN_COLORS,
    acceptsLine: (ref) => /^U[1-9]$/i.test(ref),
  },
  madrid: {
    bbox: [40.20, -3.95, 40.65, -3.45],
    label: "Metro de Madrid",
    colors: MADRID_COLORS,
    acceptsLine: (ref, name, network) => /^(?:L)?(?:[1-9]|1[0-2]|R)$/i.test(ref) && /metro/i.test(`${name} ${network}`),
  },
  milano: {
    bbox: [45.35, 9.02, 45.58, 9.35],
    label: "Metropolitana di Milano",
    colors: MILAN_COLORS,
    acceptsLine: (ref, name, network) => /^(?:M)?[1-5]$/i.test(ref) && /metro|atm/i.test(`${name} ${network}`),
  },
  amburgo: { bbox: [53.35, 9.65, 53.75, 10.35], label: "Hamburg U-Bahn", colors: EXPANDED_METRO_COLORS.amburgo, acceptsLine: (ref) => /^U[1-4]$/i.test(ref) },
  amsterdam: { bbox: [52.20, 4.65, 52.55, 5.10], label: "Amsterdam Metro", colors: EXPANDED_METRO_COLORS.amsterdam, acceptsLine: (ref) => /^(?:M)?5[0-4]$/i.test(ref) },
  atene: { bbox: [37.75, 23.55, 38.15, 24.10], label: "Athens Metro", colors: EXPANDED_METRO_COLORS.atene, acceptsLine: (ref) => /^(?:M)?[123]$/i.test(ref) },
  barcellona: { bbox: [41.25, 1.95, 41.55, 2.35], label: "Metro de Barcelona", colors: EXPANDED_METRO_COLORS.barcellona, acceptsLine: (ref) => /^L(?:[1-8]|9[NS]?|10[NS]?|11|12)$/i.test(ref) },
  bucarest: { bbox: [44.30, 25.90, 44.65, 26.35], label: "Metrou Bucuresti", colors: EXPANDED_METRO_COLORS.bucarest, acceptsLine: (ref) => /^M[1-5]$/i.test(ref) },
  budapest: { bbox: [47.35, 18.85, 47.65, 19.25], label: "Budapest Metro", colors: EXPANDED_METRO_COLORS.budapest, acceptsLine: (ref) => /^M?[1-4]$/i.test(ref) },
  copenaghen: { bbox: [55.55, 12.40, 55.80, 12.75], label: "Copenhagen Metro", colors: EXPANDED_METRO_COLORS.copenaghen, acceptsLine: (ref) => /^M[1-4]$/i.test(ref) },
  helsinki: { bbox: [60.10, 24.75, 60.30, 25.25], label: "HSL", mode: "mixed", badge: "H", routeTypes: ["subway", "tram", "ferry"], colors: EXPANDED_METRO_COLORS.helsinki, acceptsLine: (ref, name, network) => /^(?:M[12]|[1-9]|10)$/i.test(ref) || /metro|raitiolinja|tram|suomenlinna|hsl/i.test(`${name} ${network}`) },
  francoforte: { bbox: [49.95, 8.45, 50.30, 8.95], label: "Frankfurt U-Bahn", routeTypes: ["subway", "light_rail"], colors: EXPANDED_METRO_COLORS.francoforte, acceptsLine: (ref) => /^U[1-9]$/i.test(ref) },
  istanbul: { bbox: [40.75, 28.50, 41.35, 29.55], label: "Istanbul Metro", colors: {}, acceptsLine: (ref) => /^M(?:1[AB]?|[2-9]|10|11)$/i.test(ref) },
  lione: { bbox: [45.60, 4.65, 45.95, 5.05], label: "Metro de Lyon", colors: EXPANDED_METRO_COLORS.lione, acceptsLine: (ref) => /^[ABCD]$/i.test(ref) },
  lisbona: {
    bbox: [38.60, -9.30, 38.90, -9.00],
    label: "Transportes de Lisboa",
    mode: "mixed",
    badge: "T",
    routeTypes: ["subway", "tram", "light_rail", "train", "ferry"],
    colors: {
      ...EXPANDED_METRO_COLORS.lisbona,
      "12E": "#E6B800", "15E": "#E6B800", "18E": "#E6B800", "24E": "#E6B800", "25E": "#E6B800", "28E": "#E6B800",
      CASCAIS: "#D97706", SINTRA: "#2563EB", AZAMBUJA: "#DC2626", SADO: "#059669",
    },
    acceptsLine: (ref, name, network) => {
      const value = `${ref} ${name} ${network}`;
      return /azul|amarela|verde|vermelha|blue|yellow|green|red/i.test(value)
        || /^(?:12E|15E|18E|24E|25E|28E)$/i.test(ref)
        || /cascais|sintra|azambuja|sado/i.test(value)
        || /transtejo|soflusa|ttsl|cacilhas|trafaria|barreiro|seixal|montijo/i.test(value);
    },
  },
  marsiglia: { bbox: [43.15, 5.15, 43.50, 5.60], label: "Metro de Marseille", colors: EXPANDED_METRO_COLORS.marsiglia, acceptsLine: (ref) => /^(?:M)?[12]$/i.test(ref) },
  monaco_di_baviera: { bbox: [47.95, 11.30, 48.35, 11.85], label: "Munich U-Bahn", colors: EXPANDED_METRO_COLORS.monaco_di_baviera, acceptsLine: (ref) => /^U[1-8]$/i.test(ref) },
  napoli: { bbox: [40.70, 14.05, 41.00, 14.50], label: "Metropolitana di Napoli", colors: EXPANDED_METRO_COLORS.napoli, acceptsLine: (ref) => /^(?:L)?[16]$/i.test(ref) },
  oslo: { bbox: [59.75, 10.45, 60.10, 11.15], label: "Oslo T-bane", colors: EXPANDED_METRO_COLORS.oslo, acceptsLine: (ref) => /^[1-5]$/i.test(ref) },
  porto: { bbox: [41.05, -8.80, 41.35, -8.45], label: "Metro do Porto", routeTypes: ["subway", "light_rail"], colors: EXPANDED_METRO_COLORS.porto, acceptsLine: (ref, name, network) => /^(?:[A-F]|H)$/i.test(ref) && /metro do porto|metro/i.test(`${name} ${network}`) },
  praga: { bbox: [49.90, 14.20, 50.25, 14.75], label: "Prague Metro", colors: EXPANDED_METRO_COLORS.praga, acceptsLine: (ref) => /^[ABC]$/i.test(ref) },
  roma: { bbox: [41.65, 12.20, 42.10, 12.80], label: "Metropolitana di Roma", colors: EXPANDED_METRO_COLORS.roma, acceptsLine: (ref) => /^(?:M)?(?:A|B1?|C)$/i.test(ref) },
  stoccolma: { bbox: [59.15, 17.70, 59.60, 18.35], label: "Stockholm Tunnelbana", colors: EXPANDED_METRO_COLORS.stoccolma, acceptsLine: (ref) => /^(?:10|11|13|14|17|18|19)$/i.test(ref) },
  valencia: { bbox: [39.25, -0.65, 39.70, -0.15], label: "Metrovalencia", routeTypes: ["subway", "light_rail"], colors: EXPANDED_METRO_COLORS.valencia, acceptsLine: (ref) => /^(?:L)?(?:1|2|3|5|7|9)$/i.test(ref) },
  valletta: { bbox: [35.78, 14.34, 35.96, 14.58], label: "Tallinja", mode: "bus", badge: "B", routeTypes: ["bus"], routeRefPattern: "^(13|14|15|16|51|52|53|74|80|81|82|85|91|92|93|94|133)$", colors: {}, acceptsLine: (ref) => /^(?:13|14|15|16|51|52|53|74|80|81|82|85|91|92|93|94|133)$/i.test(ref) },
  varsavia: { bbox: [52.05, 20.75, 52.45, 21.30], label: "Warsaw Metro", colors: EXPANDED_METRO_COLORS.varsavia, acceptsLine: (ref) => /^M[12]$/i.test(ref) },
  vienna: { bbox: [48.05, 16.10, 48.40, 16.65], label: "Vienna U-Bahn", colors: EXPANDED_METRO_COLORS.vienna, acceptsLine: (ref) => /^U[1-4]$|^U6$/i.test(ref) },
  annecy: { bbox: [45.80, 5.95, 46.05, 6.35], label: "SIBRA Annecy", mode: "bus", badge: "B", routeTypes: ["bus"], routeRefPattern: "^[1-5]$", colors: {}, acceptsLine: (ref) => /^[1-5]$/.test(ref) },
  antalya: { bbox: [36.75, 30.45, 37.05, 30.95], label: "AntRay", mode: "tram", badge: "T", routeTypes: ["tram", "light_rail"], colors: SURFACE_TRANSIT_COLORS.antalya, acceptsLine: (ref, name) => /^(?:T)?[1-3][A-Z]?$/i.test(ref) || /antray/i.test(name) },
  bergen: { bbox: [60.20, 5.15, 60.55, 5.55], label: "Bybanen", mode: "tram", badge: "T", routeTypes: ["tram", "light_rail"], routeRefPattern: "^[12]$", colors: SURFACE_TRANSIT_COLORS.bergen, acceptsLine: (ref, name) => /^[12]$/.test(ref) || /bybanen/i.test(name) },
  bratislava: { bbox: [48.05, 16.95, 48.30, 17.30], label: "Elektricky Bratislava", mode: "tram", badge: "T", routeTypes: ["tram"], routeRefPattern: "^[1-9][0-9]?$", colors: {}, acceptsLine: (ref) => /^[1-9][0-9]?$/.test(ref) },
  bruxelles: { bbox: [50.76, 4.24, 50.94, 4.53], label: "STIB-MIVB", mode: "mixed", badge: "M", routeTypes: ["subway", "light_rail", "tram"], routeRefPattern: "^(1|2|3|4|5|6|7|8|9|10|18|19|25|39|44|51|55|62|81|82|92|93|97)$", colors: SURFACE_TRANSIT_COLORS.bruxelles, acceptsLine: (ref, name, network) => /^(?:1|2|3|4|5|6|7|8|9|10|18|19|25|39|44|51|55|62|81|82|92|93|97)$/i.test(ref) && /stib|mivb|metro|tram/i.test(`${name} ${network}`) },
  bruges: { bbox: [50.95, 3.05, 51.35, 3.45], label: "De Lijn Brugge", mode: "bus", badge: "B", routeTypes: ["bus"], routeRefPattern: "^[1-6]$", colors: {}, acceptsLine: (ref) => /^[1-6]$/.test(ref) },
  candia: { bbox: [35.20, 25.00, 35.45, 25.30], label: "Heraklion CityBus", mode: "bus", badge: "B", routeTypes: ["bus"], routeRefPattern: "^[1-4]$", colors: {}, acceptsLine: (ref, name, network) => /^[1-4]$/.test(ref) || /citybus|mini bus/i.test(`${name} ${network}`) },
  colonia: { bbox: [50.75, 6.70, 51.15, 7.20], label: "KVB Stadtbahn", mode: "tram", badge: "U", routeTypes: ["light_rail", "tram"], routeRefPattern: "^(1|3|4|5|7|9|12|13|15|16|17|18)$", colors: {}, acceptsLine: (ref) => /^(?:1|3|4|5|7|9|12|13|15|16|17|18)$/.test(ref) },
  cracovia: { bbox: [49.90, 19.70, 50.25, 20.25], label: "Tramwaje Krakowskie", mode: "tram", badge: "T", routeTypes: ["tram"], routeRefPattern: "^[0-9]{1,2}$", colors: {}, acceptsLine: (ref) => /^[0-9]{1,2}$/.test(ref) },
  dublino: { bbox: [53.15, -6.60, 53.55, -6.00], label: "Luas", mode: "tram", badge: "L", routeTypes: ["tram", "light_rail"], colors: SURFACE_TRANSIT_COLORS.dublino, acceptsLine: (ref, name) => /red|green/i.test(`${ref} ${name}`) },
  dubrovnik: { bbox: [42.60, 18.00, 42.70, 18.16], label: "Libertas Dubrovnik", mode: "bus", badge: "B", routeTypes: ["bus"], routeRefPattern: "^(1A|1B|3|4|6|8)$", colors: {}, acceptsLine: (ref, name, network) => /^(?:1A|1B|3|4|6|8)$/i.test(ref) || /libertas/i.test(`${name} ${network}`) },
  reykjavik: { bbox: [64.04, -22.05, 64.25, -21.70], label: "Strætó", mode: "bus", badge: "B", routeTypes: ["bus"], routeRefPattern: "^(1|2|3|4|5|6|11|12|13|14|15|18)$", colors: {}, acceptsLine: (ref, name, network) => /^(?:1|2|3|4|5|6|11|12|13|14|15|18)$/i.test(ref) || /strætó|straeto/i.test(`${name} ${network}`) },
  edimburgo: { bbox: [55.85, -3.45, 56.05, -2.95], label: "Edinburgh Trams", mode: "tram", badge: "T", routeTypes: ["tram", "light_rail"], colors: { T: "#72246C" }, acceptsLine: (_ref, name, network) => /edinburgh tram/i.test(`${name} ${network}`) },
  firenze: { bbox: [43.65, 11.05, 43.90, 11.45], label: "Tramvia di Firenze", mode: "tram", badge: "T", routeTypes: ["tram", "light_rail"], colors: SURFACE_TRANSIT_COLORS.firenze, acceptsLine: (ref, name) => /^(?:T)?[12]$/i.test(ref) || /tramvia/i.test(name) },
  marrakech: { bbox: [31.45, -8.20, 31.80, -7.75], label: "Bus Marrakech", mode: "bus", badge: "B", routeTypes: ["bus"], routeRefPattern: "^(1|3|8|10|11|12|19)$", colors: {}, acceptsLine: (ref) => /^(?:1|3|8|10|11|12|19)$/.test(ref) },
  lubiana: { bbox: [45.98, 14.38, 46.16, 14.67], label: "LPP Ljubljana", mode: "bus", badge: "B", routeTypes: ["bus"], routeRefPattern: "^(1|2|3|5|6|7|8|9|11|13|18|20|27)$", colors: {}, acceptsLine: (ref, name, network) => /^(?:1|2|3|5|6|7|8|9|11|13|18|20|27)$/i.test(ref) && /lpp|ljubljana|mestni/i.test(`${name} ${network}`) },
  "muğla": { bbox: [37.05, 28.20, 37.35, 28.55], label: "Mugla Buyuksehir Otobusleri", mode: "bus", badge: "B", routeTypes: ["bus"], routeRefPattern: "^[0-9]{1,2}$", colors: {}, acceptsLine: (ref) => /^[0-9]{1,2}$/.test(ref) },
  salisburgo: { bbox: [47.70, 12.90, 47.90, 13.20], label: "Salzburg Obus", mode: "trolleybus", badge: "F", routeTypes: ["trolleybus"], routeRefPattern: "^[1-9][0-9]?$", colors: {}, acceptsLine: (ref) => /^[1-9][0-9]?$/.test(ref) },
  siviglia: { bbox: [37.25, -6.15, 37.50, -5.75], label: "Metro de Sevilla", mode: "metro", badge: "M", routeTypes: ["subway", "light_rail"], colors: SURFACE_TRANSIT_COLORS.siviglia, acceptsLine: (ref, name, network) => /^(?:L)?1$/i.test(ref) && /metro/i.test(`${name} ${network}`) },
  tallinn: { bbox: [59.30, 24.55, 59.55, 24.95], label: "Tallinna tramm", mode: "tram", badge: "T", routeTypes: ["tram"], routeRefPattern: "^(T)?[1-5]$", colors: SURFACE_TRANSIT_COLORS.tallinn, acceptsLine: (ref) => /^(?:T)?[1-5]$/i.test(ref) },
  venezia: { bbox: [45.30, 12.15, 45.60, 12.60], label: "ACTV Navigazione", mode: "water", badge: "V", routeTypes: ["ferry"], routeRefPattern: "^(1|2|4[.]1|4[.]2|5[.]1|5[.]2|6|9|10|12|13|14|15|17|20|N)$", colors: SURFACE_TRANSIT_COLORS.venezia, acceptsLine: (ref, name, network) => /^(?:1|2|4[.]1|4[.]2|5[.]1|5[.]2|6|9|10|12|13|14|15|17|20|N)$/i.test(ref) && /actv|vaporetto|navigazione/i.test(`${name} ${network}`) },
  zurigo: { bbox: [47.30, 8.43, 47.46, 8.66], label: "VBZ Zürich", mode: "tram", badge: "T", routeTypes: ["tram", "light_rail"], routeRefPattern: "^(2|3|4|5|6|7|8|9|10|11|13|14|15|17)$", colors: {}, acceptsLine: (ref, name, network) => /^(?:2|3|4|5|6|7|8|9|10|11|13|14|15|17)$/i.test(ref) && /vbz|zürich|zurich|tram/i.test(`${name} ${network}`) },
};

function key(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(line|ligne|linea)\b/gi, "")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();
}

function normalizeLineRef(ref: string, city: string): string {
  let value = ref.trim().toUpperCase().replace(/\s+/g, "");
  if (city === "londra") value = value.replace(/LINE$/, "");
  if (city === "parigi") value = value.replace(/^LIGNE(?=\d)/, "");
  if (city === "madrid") value = value.replace(/^L(?=\d)/, "");
  if (city === "milano" && /^\d$/.test(value)) value = `M${value}`;
  if (city === "amsterdam") value = value.replace(/^M(?=5[0-4]$)/, "");
  if (city === "budapest" && /^[1-4]$/.test(value)) value = `M${value}`;
  if (city === "roma") value = value.replace(/^M(?=A|B1?|C$)/, "");
  if (city === "napoli") value = value.replace(/^L(?=[16]$)/, "");
  if (city === "valencia") value = value.replace(/^L(?=\d$)/, "");
  if (city === "dublino") {
    if (/RED/.test(value)) value = "RED";
    if (/GREEN/.test(value)) value = "GREEN";
  }
  if (city === "antalya") {
    const match = value.match(/(?:ANTRAY)?T?([1-3][A-Z]?)$/);
    if (match) value = `T${match[1]}`;
  }
  if (city === "bergen") {
    const match = value.match(/(?:BYBANEN)?([12])$/);
    if (match) value = match[1];
  }
  if (city === "lisbona") {
    if (/CASCAIS/.test(value)) value = "CASCAIS";
    else if (/SINTRA/.test(value)) value = "SINTRA";
    else if (/AZAMBUJA/.test(value)) value = "AZAMBUJA";
    else if (/SADO/.test(value)) value = "SADO";
    else if (/CACILHAS/.test(value)) value = "CACILHAS";
    else if (/TRAFARIA|PORTOBRANDAO/.test(value)) value = "TRAFARIA";
    else if (/BARREIRO/.test(value)) value = "BARREIRO";
    else if (/SEIXAL/.test(value)) value = "SEIXAL";
    else if (/MONTIJO/.test(value)) value = "MONTIJO";
  }
  if (city === "edimburgo") value = "T";
  if (city === "firenze") {
    const match = value.match(/(?:TRAMVIA)?T?([12])$/);
    if (match) value = `T${match[1]}`;
  }
  if (city === "tallinn") {
    const match = value.match(/(?:TRAMM?|T)?([1-5])$/);
    if (match) value = `T${match[1]}`;
  }
  return value;
}

function routeMode(route: string | undefined, fallback: TransitMode | undefined): Exclude<TransitMode, "mixed"> {
  if (route === "tram" || route === "light_rail") return "tram";
  if (route === "train") return "train";
  if (route === "ferry") return "water";
  if (route === "trolleybus") return "trolleybus";
  if (route === "bus") return "bus";
  return fallback && fallback !== "mixed" ? fallback : "metro";
}

function readableTextColor(color: string): string {
  const hex = color.replace("#", "");
  if (hex.length !== 6) return "#FFFFFF";
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 165 ? "#161616" : "#FFFFFF";
}

function lineColor(config: TransitCityConfig, ref: string, tags: Record<string, string>): string {
  const configured = config.colors[key(ref)] ?? config.colors[ref];
  if (configured) return configured;
  const osmColor = tags.colour || tags.color;
  if (/^#[0-9a-f]{6}$/i.test(osmColor || "")) return osmColor;
  const palette = ["#2563EB", "#DC2626", "#059669", "#D97706", "#7C3AED", "#0891B2", "#DB2777", "#4D7C0F"];
  const hash = [...ref].reduce((sum, character) => (sum * 31 + character.charCodeAt(0)) >>> 0, 0);
  return palette[hash % palette.length];
}

function stationKey(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function searchable(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function simplifyPath(points: TransitCoordinate[], tolerance = 0.000055): TransitCoordinate[] {
  if (points.length <= 2) return points;
  const sqTolerance = tolerance * tolerance;

  const sqSegmentDistance = (point: TransitCoordinate, start: TransitCoordinate, end: TransitCoordinate) => {
    let x = start[0];
    let y = start[1];
    let dx = end[0] - x;
    let dy = end[1] - y;
    if (dx !== 0 || dy !== 0) {
      const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) {
        x = end[0];
        y = end[1];
      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }
    dx = point[0] - x;
    dy = point[1] - y;
    return dx * dx + dy * dy;
  };

  const kept = new Uint8Array(points.length);
  kept[0] = 1;
  kept[points.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!;
    let maxDistance = sqTolerance;
    let index = -1;
    for (let i = first + 1; i < last; i += 1) {
      const distance = sqSegmentDistance(points[i], points[first], points[last]);
      if (distance > maxDistance) {
        index = i;
        maxDistance = distance;
      }
    }
    if (index >= 0) {
      kept[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_point, index) => kept[index] === 1);
}

function mergeConnectedPaths(paths: TransitCoordinate[][]): TransitCoordinate[][] {
  const usable = paths.filter((path) => path.length >= 2);
  if (usable.length <= 1) return usable;
  const endpointKey = (point: TransitCoordinate) => `${point[0].toFixed(7)}:${point[1].toFixed(7)}`;
  const endpointIndex = new Map<string, number[]>();
  usable.forEach((path, index) => {
    [path[0], path[path.length - 1]].forEach((point) => {
      const pointKey = endpointKey(point);
      endpointIndex.set(pointKey, [...(endpointIndex.get(pointKey) || []), index]);
    });
  });

  const unused = new Set(usable.map((_path, index) => index));
  const merged: TransitCoordinate[][] = [];
  const takeConnected = (point: TransitCoordinate): { index: number; reversed: boolean } | null => {
    const candidates = endpointIndex.get(endpointKey(point)) || [];
    const index = candidates.find((candidate) => unused.has(candidate));
    if (index == null) return null;
    return { index, reversed: endpointKey(usable[index][usable[index].length - 1]) === endpointKey(point) };
  };

  while (unused.size) {
    const seed = unused.values().next().value as number;
    unused.delete(seed);
    let chain = [...usable[seed]];

    while (true) {
      const match = takeConnected(chain[chain.length - 1]);
      if (!match) break;
      unused.delete(match.index);
      const next = match.reversed ? [...usable[match.index]].reverse() : usable[match.index];
      chain = chain.concat(next.slice(1));
    }
    while (true) {
      const match = takeConnected(chain[0]);
      if (!match) break;
      unused.delete(match.index);
      const previous = match.reversed ? usable[match.index] : [...usable[match.index]].reverse();
      chain = previous.slice(0, -1).concat(chain);
    }
    merged.push(chain);
  }
  return merged;
}

type StationAccumulator = {
  id: string;
  name: string;
  pointsByLine: Map<string, TransitCoordinate[]>;
};

function coordinateDistanceKm(a: TransitCoordinate, b: TransitCoordinate): number {
  const radiusKm = 6371;
  const toRadians = (value: number) => value * Math.PI / 180;
  const latitudeDelta = toRadians(b[0] - a[0]);
  const longitudeDelta = toRadians(b[1] - a[1]);
  const latitudeA = toRadians(a[0]);
  const latitudeB = toRadians(b[0]);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function stationIdentity(name: string, coordinate: TransitCoordinate, stations: Map<string, StationAccumulator>): string {
  const base = stationKey(name);
  if (!base) return "";
  let candidate = base;
  let suffix = 2;
  while (stations.has(candidate)) {
    const existing = stations.get(candidate)!;
    const nearby = [...existing.pointsByLine.values()].flat()
      .some((point) => coordinateDistanceKm(point, coordinate) <= 0.35);
    if (nearby) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function parseTransitNetworkPhysicalLegacy(city: string, elements: OsmElement[], fetchedAt = Date.now()): TransitNetwork | null {
  const config = CONFIGS[city];
  if (!config) return null;

  const nodes = new Map<number, OsmElement>();
  const ways = new Map<number, OsmElement>();
  elements.forEach((element) => {
    if (element.type === "node" && Number.isFinite(element.lat) && Number.isFinite(element.lon)) nodes.set(element.id, element);
    if (element.type === "way" && Array.isArray(element.nodes)) ways.set(element.id, element);
  });

  const lines = new Map<string, TransitLine>();
  const stations = new Map<string, StationAccumulator>();
  const seenWaysByLine = new Map<string, Set<number>>();

  elements.forEach((element) => {
    if (element.type !== "relation" || !element.members) return;
    const tags = element.tags || {};
    const rawRef = tags.ref || tags.short_name || tags.name || "";
    const ref = normalizeLineRef(rawRef, city);
    if (!ref || !config.acceptsLine(ref, searchable(tags.name || ""), searchable(tags.network || ""))) return;

    const color = lineColor(config, ref, tags);
    const line = lines.get(ref) || {
      id: ref,
      name: tags.name || ref,
      color,
      textColor: readableTextColor(color),
      mode: routeMode(tags.route, config.mode),
      paths: [],
    };
    const fallbackPath: TransitCoordinate[] = [];

    const stopMembers = element.members.filter((member) => member.type === "node" && /^stop/i.test(member.role || ""));
    const stationMembers = stopMembers.length >= 2
      ? stopMembers
      : element.members.filter((member) => member.type === "node" && /^platform/i.test(member.role || ""));

    stationMembers.forEach((member) => {
      const node = nodes.get(member.ref);
      if (!node || node.lat == null || node.lon == null) return;
      const name = node.tags?.name || node.tags?.["name:en"] || "";
      if (!name) return;
      const coordinate: TransitCoordinate = [node.lat, node.lon];
      const previous = fallbackPath[fallbackPath.length - 1];
      if (!previous || previous[0] !== coordinate[0] || previous[1] !== coordinate[1]) fallbackPath.push(coordinate);

      const normalizedName = stationKey(name);
      const existing = stations.get(normalizedName);
      if (existing) {
        const points = existing.pointsByLine.get(ref) || [];
        if (!points.some((point) => point[0] === coordinate[0] && point[1] === coordinate[1])) points.push(coordinate);
        existing.pointsByLine.set(ref, points);
      } else {
        stations.set(normalizedName, {
          id: normalizedName || String(member.ref),
          name,
          pointsByLine: new Map([[ref, [coordinate]]]),
        });
      }
    });

    const seenWays = seenWaysByLine.get(ref) || new Set<number>();
    let geometryCount = 0;
    element.members.forEach((member) => {
      if (member.type !== "way" || /^platform|station/i.test(member.role || "") || seenWays.has(member.ref)) return;
      const way = ways.get(member.ref);
      if (!way?.nodes) return;
      const path = way.nodes
        .map((nodeId) => nodes.get(nodeId))
        .filter((node): node is OsmElement => Boolean(node && node.lat != null && node.lon != null))
        .map((node) => [node.lat!, node.lon!] as TransitCoordinate);
      if (path.length < 2) return;
      line.paths.push(simplifyPath(path));
      seenWays.add(member.ref);
      geometryCount += 1;
    });
    seenWaysByLine.set(ref, seenWays);

    if (geometryCount === 0 && seenWays.size === 0 && fallbackPath.length >= 2) {
      line.paths.push(fallbackPath);
    }
    lines.set(ref, line);
  });

  const resultLines = [...lines.values()]
    .filter((line) => line.paths.length > 0)
    .map((line) => ({ ...line, paths: mergeConnectedPaths(line.paths) }))
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const validLineIds = new Set(resultLines.map((line) => line.id));
  const resultStations = [...stations.values()]
    .map((station): TransitStation | null => {
      const linePositions = [...station.pointsByLine.entries()]
        .filter(([lineId]) => validLineIds.has(lineId))
        .map(([lineId, points]) => ({
          lineId,
          latitude: points.reduce((sum, point) => sum + point[0], 0) / points.length,
          longitude: points.reduce((sum, point) => sum + point[1], 0) / points.length,
        }))
        .sort((a, b) => a.lineId.localeCompare(b.lineId, undefined, { numeric: true }));
      if (!linePositions.length) return null;
      return {
        id: station.id,
        name: station.name,
        latitude: linePositions.reduce((sum, point) => sum + point.latitude, 0) / linePositions.length,
        longitude: linePositions.reduce((sum, point) => sum + point.longitude, 0) / linePositions.length,
        lineIds: linePositions.map((point) => point.lineId),
        linePositions,
      };
    })
    .filter((station): station is TransitStation => station !== null)
    .filter((station) => station.lineIds.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!resultLines.length || !resultStations.length) return null;
  return { city, label: config.label, mode: config.mode ?? "metro", badge: config.badge ?? "M", lines: resultLines, stations: resultStations, fetchedAt };
}

type TransitEdge = { from: string; to: string };

function edgeKey(from: string, to: string): string {
  return from < to ? `${from}|${to}` : `${to}|${from}`;
}

function buildSchematicPaths(edges: TransitEdge[], coordinates: Map<string, TransitCoordinate>): TransitCoordinate[][] {
  const adjacency = new Map<string, Set<string>>();
  edges.forEach(({ from, to }) => {
    if (!coordinates.has(from) || !coordinates.has(to) || from === to) return;
    adjacency.set(from, new Set([...(adjacency.get(from) || []), to]));
    adjacency.set(to, new Set([...(adjacency.get(to) || []), from]));
  });

  const visited = new Set<string>();
  const paths: TransitCoordinate[][] = [];
  const walk = (start: string, firstNeighbor: string) => {
    const ids = [start];
    let previous = start;
    let current = firstNeighbor;
    visited.add(edgeKey(previous, current));
    ids.push(current);
    while ((adjacency.get(current)?.size || 0) === 2) {
      const next = [...(adjacency.get(current) || [])].find((candidate) => candidate !== previous && !visited.has(edgeKey(current, candidate)));
      if (!next) break;
      previous = current;
      current = next;
      visited.add(edgeKey(previous, current));
      ids.push(current);
    }
    const path = ids.map((id) => coordinates.get(id)).filter((point): point is TransitCoordinate => Boolean(point));
    if (path.length >= 2) paths.push(path);
  };

  [...adjacency.entries()]
    .filter(([, neighbors]) => neighbors.size !== 2)
    .forEach(([stationId, neighbors]) => {
      neighbors.forEach((neighbor) => {
        if (!visited.has(edgeKey(stationId, neighbor))) walk(stationId, neighbor);
      });
    });

  edges.forEach(({ from, to }) => {
    if (!visited.has(edgeKey(from, to))) walk(from, to);
  });
  return paths;
}

export function parseTransitNetwork(city: string, elements: OsmElement[], fetchedAt = Date.now()): TransitNetwork | null {
  const config = CONFIGS[city];
  if (!config) return null;

  const nodes = new Map<number, OsmElement>();
  elements.forEach((element) => {
    if (element.type === "node" && Number.isFinite(element.lat) && Number.isFinite(element.lon)) nodes.set(element.id, element);
  });

  const lineMetadata = new Map<string, Omit<TransitLine, "paths">>();
  const edgesByLine = new Map<string, Map<string, TransitEdge>>();
  const stations = new Map<string, StationAccumulator>();

  elements.forEach((element) => {
    if (element.type !== "relation" || !element.members) return;
    const tags = element.tags || {};
    const rawRef = tags.ref || tags.short_name || tags.name || "";
    const ref = normalizeLineRef(rawRef, city);
    if (!ref || !config.acceptsLine(ref, searchable(tags.name || ""), searchable(tags.network || ""))) return;

    if (!lineMetadata.has(ref)) {
      const color = lineColor(config, ref, tags);
      lineMetadata.set(ref, { id: ref, name: tags.name || ref, color, textColor: readableTextColor(color), mode: routeMode(tags.route, config.mode) });
    }

    const stopMembers = element.members.filter((member) => member.type === "node" && /^stop/i.test(member.role || ""));
    const stationMembers = stopMembers.length >= 2
      ? stopMembers
      : element.members.filter((member) => member.type === "node" && /^platform/i.test(member.role || ""));
    const sequence: string[] = [];

    stationMembers.forEach((member) => {
      const node = nodes.get(member.ref);
      if (!node || node.lat == null || node.lon == null) return;
      const name = node.tags?.name || node.tags?.["name:en"] || "";
      if (!name) return;
      const coordinate: TransitCoordinate = [node.lat, node.lon];
      const id = stationIdentity(name, coordinate, stations);
      if (!id) return;
      if (sequence[sequence.length - 1] !== id) sequence.push(id);

      const existing = stations.get(id);
      if (existing) {
        const points = existing.pointsByLine.get(ref) || [];
        if (!points.some((point) => point[0] === coordinate[0] && point[1] === coordinate[1])) points.push(coordinate);
        existing.pointsByLine.set(ref, points);
      } else {
        stations.set(id, { id, name, pointsByLine: new Map([[ref, [coordinate]]]) });
      }
    });

    const lineEdges = edgesByLine.get(ref) || new Map<string, TransitEdge>();
    for (let index = 0; index < sequence.length - 1; index += 1) {
      const from = sequence[index];
      const to = sequence[index + 1];
      if (from !== to) lineEdges.set(edgeKey(from, to), { from, to });
    }
    edgesByLine.set(ref, lineEdges);
  });

  const validLineIds = new Set([...lineMetadata.keys()].filter((lineId) => (edgesByLine.get(lineId)?.size || 0) > 0));
  const resultStations = [...stations.values()]
    .map((station): TransitStation | null => {
      const linePositions = [...station.pointsByLine.entries()]
        .filter(([lineId]) => validLineIds.has(lineId))
        .map(([lineId, points]) => ({
          lineId,
          latitude: points.reduce((sum, point) => sum + point[0], 0) / points.length,
          longitude: points.reduce((sum, point) => sum + point[1], 0) / points.length,
        }))
        .sort((a, b) => a.lineId.localeCompare(b.lineId, undefined, { numeric: true }));
      if (!linePositions.length) return null;
      return {
        id: station.id,
        name: station.name,
        latitude: linePositions.reduce((sum, point) => sum + point.latitude, 0) / linePositions.length,
        longitude: linePositions.reduce((sum, point) => sum + point.longitude, 0) / linePositions.length,
        lineIds: linePositions.map((point) => point.lineId),
        linePositions,
      };
    })
    .filter((station): station is TransitStation => station !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  const coordinates = new Map(resultStations.map((station) => [station.id, [station.latitude, station.longitude] as TransitCoordinate]));
  const resultLines = [...lineMetadata.values()]
    .filter((line) => validLineIds.has(line.id))
    .map((line): TransitLine => ({ ...line, paths: buildSchematicPaths([...(edgesByLine.get(line.id)?.values() || [])], coordinates) }))
    .filter((line) => line.paths.length > 0)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  if (!resultLines.length || !resultStations.length) return null;
  return { city, label: config.label, mode: config.mode ?? "metro", badge: config.badge ?? "M", lines: resultLines, stations: resultStations, fetchedAt };
}

function overpassQuery(config: TransitCityConfig): string {
  const bbox = config.bbox.join(",");
  const refFilter = config.routeRefPattern ? `[\"ref\"~\"${config.routeRefPattern}\",i]` : "";
  const relations = (config.routeTypes ?? ["subway"])
    .map((routeType) => `relation[\"type\"=\"route\"][\"route\"=\"${routeType}\"]${refFilter}(${bbox});`)
    .join("");
  return `[out:json][timeout:45];(${relations})->.routes;.routes out body;node(r.routes);out body qt;`;
}

async function fetchElements(config: TransitCityConfig): Promise<OsmElement[]> {
  let lastError: unknown;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Accept: "application/json",
          "User-Agent": "UrveyaTravelApp/1.0 (transit map)",
        },
        body: `data=${encodeURIComponent(overpassQuery(config))}`,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Transit HTTP ${response.status}`);
      const payload = await response.json() as { elements?: OsmElement[] };
      if (!Array.isArray(payload.elements)) throw new Error("Transit response without elements");
      return payload.elements;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Transit data unavailable");
}

export function supportsTransit(city: string): boolean {
  return Boolean(CONFIGS[city]);
}

export function transitModeForCity(city: string): TransitMode {
  return CONFIGS[city]?.mode ?? "metro";
}

export function transitBadgeForCity(city: string): string {
  return CONFIGS[city]?.badge ?? "M";
}

function validCoordinate(value: unknown): value is TransitCoordinate {
  return Array.isArray(value)
    && value.length === 2
    && Number.isFinite(value[0])
    && Number.isFinite(value[1])
    && Math.abs(value[0]) <= 90
    && Math.abs(value[1]) <= 180;
}

export function isTransitNetworkUsable(value: unknown, expectedCity?: string): value is TransitNetwork {
  if (!value || typeof value !== "object") return false;
  const network = value as Partial<TransitNetwork>;
  if (typeof network.city !== "string" || (expectedCity && network.city !== expectedCity)) return false;
  if (!Array.isArray(network.lines) || !network.lines.length || !Array.isArray(network.stations) || !network.stations.length) return false;
  if (!Number.isFinite(network.fetchedAt)) return false;

  const stationCoordinates = new Set<string>();
  const stationLineIds = new Set<string>();
  for (const station of network.stations) {
    if (!station || typeof station.name !== "string" || !station.name.trim()) return false;
    if (!Number.isFinite(station.latitude) || !Number.isFinite(station.longitude)) return false;
    if (Math.abs(station.latitude) > 90 || Math.abs(station.longitude) > 180) return false;
    if (!Array.isArray(station.lineIds) || !station.lineIds.length) return false;
    stationCoordinates.add(`${station.latitude.toFixed(7)}:${station.longitude.toFixed(7)}`);
    station.lineIds.forEach((lineId) => stationLineIds.add(lineId));
  }

  const lineIds = new Set<string>();
  for (const line of network.lines) {
    if (!line || typeof line.id !== "string" || !line.id.trim() || lineIds.has(line.id)) return false;
    if (!/^#[0-9a-f]{6}$/i.test(line.color) || !Array.isArray(line.paths) || !line.paths.length) return false;
    lineIds.add(line.id);
    for (const path of line.paths) {
      if (!Array.isArray(path) || path.length < 2 || !path.every(validCoordinate)) return false;
      const start = path[0];
      const end = path[path.length - 1];
      if (!stationCoordinates.has(`${start[0].toFixed(7)}:${start[1].toFixed(7)}`)) return false;
      if (!stationCoordinates.has(`${end[0].toFixed(7)}:${end[1].toFixed(7)}`)) return false;
    }
  }
  return [...stationLineIds].every((lineId) => lineIds.has(lineId));
}

async function loadTransitNetwork(city: string): Promise<TransitNetwork | null> {
  const config = CONFIGS[city];
  if (!config) return null;
  const cacheKey = `wayra:transit:${CACHE_VERSION}:${city}`;
  let stale: TransitNetwork | null = null;

  // Conserva le reti già scaricate dopo un aggiornamento del formato cache.
  // Se una versione precedente è ancora valida, viene migrata alla chiave attuale.
  for (let version = CACHE_VERSION; version >= 1; version -= 1) {
    try {
      const candidateKey = `wayra:transit:${version}:${city}`;
      const raw = await AsyncStorage.getItem(candidateKey);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as unknown;
      if (isTransitNetworkUsable(parsed, city)) {
        stale = parsed;
        if (version !== CACHE_VERSION) {
          await AsyncStorage.setItem(cacheKey, JSON.stringify(stale));
        }
        if (Date.now() - stale.fetchedAt < CACHE_TTL_MS) return stale;
        break;
      }
    } catch {
      // Un singolo record corrotto non deve bloccare le altre cache o la rete.
    }
  }

  try {
    const network = parseTransitNetwork(city, await fetchElements(config));
    if (!isTransitNetworkUsable(network, city)) return stale;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(network));
    return network;
  } catch {
    return stale;
  }
}

export function getTransitNetwork(city: string): Promise<TransitNetwork | null> {
  const cityKey = city.trim().toLowerCase();
  const existing = pendingRequests.get(cityKey);
  if (existing) return existing;
  const request = loadTransitNetwork(cityKey).finally(() => pendingRequests.delete(cityKey));
  pendingRequests.set(cityKey, request);
  return request;
}

export async function removeCachedTransitNetwork(city: string): Promise<void> {
  const cityKey = city.trim().toLowerCase();
  if (!cityKey) return;
  pendingRequests.delete(cityKey);
  await Promise.all(
    Array.from({ length: CACHE_VERSION }, (_, index) =>
      AsyncStorage.removeItem(`wayra:transit:${index + 1}:${cityKey}`),
    ),
  );
}
