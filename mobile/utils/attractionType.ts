export type AttractionTypeLang = "it" | "en" | "fr" | "es" | string;

export { isMuseumType } from "./routeMetrics";

const TYPE_MAP: Record<string, { it: string; en: string; fr: string; es: string }> = {
  museo: { it: "Museo", en: "Museum", fr: "Musee", es: "Museo" },
  chiesa: { it: "Chiesa", en: "Church", fr: "Eglise", es: "Iglesia" },
  basilica: { it: "Basilica", en: "Basilica", fr: "Basilique", es: "Basilica" },
  parco: { it: "Parco", en: "Park", fr: "Parc", es: "Parque" },
  "parco urbano": { it: "Parco urbano", en: "Urban park", fr: "Parc urbain", es: "Parque urbano" },
  piazza: { it: "Piazza", en: "Square", fr: "Place", es: "Plaza" },
  "piazza urbana": { it: "Piazza urbana", en: "Urban square", fr: "Place urbaine", es: "Plaza urbana" },
  monumento: { it: "Monumento", en: "Monument", fr: "Monument", es: "Monumento" },
  palazzo: { it: "Palazzo", en: "Palace", fr: "Palais", es: "Palacio" },
  castello: { it: "Castello", en: "Castle", fr: "Chateau", es: "Castillo" },
  torre: { it: "Torre", en: "Tower", fr: "Tour", es: "Torre" },
  ponte: { it: "Ponte", en: "Bridge", fr: "Pont", es: "Puente" },
  mercato: { it: "Mercato", en: "Market", fr: "Marche", es: "Mercado" },
  panorama: { it: "Panorama", en: "Viewpoint", fr: "Point de vue", es: "Mirador" },
  belvedere: { it: "Belvedere", en: "Viewpoint", fr: "Point de vue", es: "Mirador" },
  quartiere: { it: "Quartiere", en: "Neighborhood", fr: "Quartier", es: "Barrio" },
  canale: { it: "Canale", en: "Canal", fr: "Canal", es: "Canal" },
  lungocanale: { it: "Lungocanale", en: "Canal walk", fr: "Promenade du canal", es: "Paseo del canal" },
  giardino: { it: "Giardino", en: "Garden", fr: "Jardin", es: "Jardin" },
  archeologia: { it: "Archeologia", en: "Archaeology", fr: "Archeologie", es: "Arqueologia" },
  memoriale: { it: "Memoriale", en: "Memorial", fr: "Memorial", es: "Memorial" },
  "complesso storico": { it: "Complesso storico", en: "Historic complex", fr: "Complexe historique", es: "Complejo historico" },
  "infrastruttura storica": { it: "Infrastruttura storica", en: "Historic infrastructure", fr: "Infrastructure historique", es: "Infraestructura historica" },
  "passeggiata urbana": { it: "Passeggiata urbana", en: "Urban walk", fr: "Promenade urbaine", es: "Paseo urbano" },
  porta: { it: "Porta", en: "Gate", fr: "Porte", es: "Puerta" },
  mulino: { it: "Mulino", en: "Windmill", fr: "Moulin", es: "Molino" },
  mura: { it: "Mura", en: "Walls", fr: "Murailles", es: "Murallas" },
};

function titleCase(value: string): string {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function translateAttractionType(type?: string | null, lang: AttractionTypeLang = "it"): string | null {
  if (!type) return null;
  const key = type.trim().toLowerCase();
  const mapped = TYPE_MAP[key];
  if (mapped) {
    if (lang === "fr") return mapped.fr;
    if (lang === "en") return mapped.en;
    if (lang === "es") return mapped.es;
    return mapped.it;
  }
  return titleCase(type);
}
