import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

type Lang = "it" | "en" | "fr" | "es" | string;
type IconName = ComponentProps<typeof Ionicons>["name"];

type VibeDefinition = {
  labels: Record<"it" | "en" | "fr" | "es", string>;
  color: string;
  icon: IconName;
  symbol: string;
};

const label = (it: string, en: string, fr: string, es: string) => ({ it, en, fr, es });

const DEFINITIONS: Record<string, VibeDefinition> = {
  "all inclusive": { labels: label("All inclusive", "All-inclusive", "Tout compris", "Todo incluido"), color: "#0891b2", icon: "checkmark-done-outline", symbol: "✓" },
  "art nouveau": { labels: label("Art Nouveau", "Art Nouveau", "Art nouveau", "Art nouveau"), color: "#7c3aed", icon: "color-palette-outline", symbol: "A" },
  arte: { labels: label("Arte", "Arts", "Art", "Arte"), color: "#7c3aed", icon: "color-palette-outline", symbol: "A" },
  architettura: { labels: label("Architettura", "Architecture", "Architecture", "Arquitectura"), color: "#7c3aed", icon: "business-outline", symbol: "A" },
  artigiani: { labels: label("Artigiani", "Crafts", "Artisanat", "Artesanía"), color: "#b45309", icon: "hammer-outline", symbol: "A" },
  attrazioni: { labels: label("Vicino alle attrazioni", "Near sights", "Proche des sites", "Cerca de las atracciones"), color: "#9333ea", icon: "location-outline", symbol: "★" },
  autentico: { labels: label("Autentico", "Authentic", "Authentique", "Auténtico"), color: "#b45309", icon: "sparkles-outline", symbol: "♥" },
  bazar: { labels: label("Bazar", "Bazaars", "Bazars", "Bazares"), color: "#ca8a04", icon: "storefront-outline", symbol: "B" },
  bohemien: { labels: label("Bohémien", "Bohemian", "Bohème", "Bohemio"), color: "#db2777", icon: "color-palette-outline", symbol: "B" },
  "boutique hotel": { labels: label("Boutique hotel", "Boutique hotels", "Hôtels de charme", "Hoteles boutique"), color: "#e8c06a", icon: "bed-outline", symbol: "H" },
  budget: { labels: label("Economico", "Budget-friendly", "Économique", "Económico"), color: "#d97706", icon: "wallet-outline", symbol: "$" },
  business: { labels: label("Business", "Business district", "Quartier d'affaires", "Distrito de negocios"), color: "#64748b", icon: "business-outline", symbol: "B" },
  cantine: { labels: label("Cantine e vino", "Wine cellars", "Caves et vin", "Bodegas y vino"), color: "#be123c", icon: "wine-outline", symbol: "V" },
  centrale: { labels: label("Centrale", "Central", "Central", "Central"), color: "#e8c06a", icon: "location-outline", symbol: "◎" },
  centro: { labels: label("Centrale", "Central", "Central", "Central"), color: "#e8c06a", icon: "location-outline", symbol: "◎" },
  "centro storico": { labels: label("Centro storico", "Historic center", "Centre historique", "Centro histórico"), color: "#e8c06a", icon: "location-outline", symbol: "◎" },
  chic: { labels: label("Chic", "Chic", "Chic", "Elegante"), color: "#e8c06a", icon: "diamond-outline", symbol: "♦" },
  collina: { labels: label("In collina", "Hillside", "Sur les hauteurs", "En la colina"), color: "#059669", icon: "trail-sign-outline", symbol: "△" },
  comfort: { labels: label("Confortevole", "Comfortable", "Confortable", "Cómodo"), color: "#16a34a", icon: "bed-outline", symbol: "C" },
  commerciale: { labels: label("Commerciale", "Commercial", "Commerçant", "Comercial"), color: "#db2777", icon: "bag-outline", symbol: "S" },
  cosmopolita: { labels: label("Cosmopolita", "Cosmopolitan", "Cosmopolite", "Cosmopolita"), color: "#2563eb", icon: "globe-outline", symbol: "C" },
  culturale: { labels: label("Culturale", "Cultural", "Culturel", "Cultural"), color: "#9333ea", icon: "color-palette-outline", symbol: "A" },
  design: { labels: label("Design", "Design", "Design", "Diseño"), color: "#db2777", icon: "color-palette-outline", symbol: "D" },
  ebraico: { labels: label("Patrimonio ebraico", "Jewish heritage", "Patrimoine juif", "Patrimonio judío"), color: "#7c3aed", icon: "book-outline", symbol: "J" },
  economico: { labels: label("Economico", "Affordable", "Abordable", "Económico"), color: "#d97706", icon: "wallet-outline", symbol: "$" },
  elegante: { labels: label("Elegante", "Elegant", "Élégant", "Elegante"), color: "#e8c06a", icon: "diamond-outline", symbol: "♦" },
  expat: { labels: label("Internazionale", "International", "International", "Internacional"), color: "#2563eb", icon: "globe-outline", symbol: "I" },
  famiglie: { labels: label("Adatto alle famiglie", "Family-friendly", "Adapté aux familles", "Ideal para familias"), color: "#16a34a", icon: "people-outline", symbol: "F" },
  flamenco: { labels: label("Flamenco", "Flamenco", "Flamenco", "Flamenco"), color: "#dc2626", icon: "musical-notes-outline", symbol: "F" },
  francese: { labels: label("Atmosfera francese", "French atmosphere", "Ambiance française", "Ambiente francés"), color: "#2563eb", icon: "cafe-outline", symbol: "F" },
  gastronomia: { labels: label("Gastronomia", "Food scene", "Gastronomie", "Gastronomía"), color: "#dc2626", icon: "restaurant-outline", symbol: "G" },
  gastronomico: { labels: label("Gastronomico", "Great food scene", "Gastronomique", "Gastronómico"), color: "#dc2626", icon: "restaurant-outline", symbol: "G" },
  georgiano: { labels: label("Architettura georgiana", "Georgian architecture", "Architecture géorgienne", "Arquitectura georgiana"), color: "#7c3aed", icon: "business-outline", symbol: "G" },
  hipster: { labels: label("Creativo", "Creative", "Créatif", "Creativo"), color: "#db2777", icon: "sparkles-outline", symbol: "C" },
  intellettuale: { labels: label("Intellettuale", "Intellectual", "Intellectuel", "Intelectual"), color: "#4f46e5", icon: "book-outline", symbol: "I" },
  lago: { labels: label("Vicino al lago", "Near the lake", "Près du lac", "Cerca del lago"), color: "#0891b2", icon: "water-outline", symbol: "≈" },
  locale: { labels: label("Atmosfera locale", "Local atmosphere", "Ambiance locale", "Ambiente local"), color: "#b45309", icon: "heart-outline", symbol: "♥" },
  locali: { labels: label("Locali", "Bars and venues", "Bars et sorties", "Bares y locales"), color: "#7c3aed", icon: "moon-outline", symbol: "☾" },
  lungomare: { labels: label("Lungomare", "Waterfront", "Front de mer", "Paseo marítimo"), color: "#0891b2", icon: "water-outline", symbol: "≈" },
  mare: { labels: label("Vicino al mare", "Near the sea", "Près de la mer", "Cerca del mar"), color: "#0891b2", icon: "water-outline", symbol: "≈" },
  lusso: { labels: label("Lusso", "Luxury", "Luxe", "Lujo"), color: "#e8c06a", icon: "diamond-outline", symbol: "♦" },
  medievale: { labels: label("Medievale", "Medieval", "Médiéval", "Medieval"), color: "#7c3aed", icon: "business-outline", symbol: "M" },
  mercati: { labels: label("Mercati", "Markets", "Marchés", "Mercados"), color: "#ca8a04", icon: "storefront-outline", symbol: "M" },
  metro: { labels: label("Metro vicina", "Near the metro", "Métro à proximité", "Metro cercano"), color: "#2563eb", icon: "train-outline", symbol: "M" },
  moderno: { labels: label("Moderno", "Modern", "Moderne", "Moderno"), color: "#2563eb", icon: "business-outline", symbol: "M" },
  moschee: { labels: label("Moschee", "Mosques", "Mosquées", "Mezquitas"), color: "#7c3aed", icon: "moon-outline", symbol: "M" },
  musei: { labels: label("Musei", "Museums", "Musées", "Museos"), color: "#9333ea", icon: "color-palette-outline", symbol: "A" },
  natura: { labels: label("Natura", "Nature", "Nature", "Naturaleza"), color: "#059669", icon: "leaf-outline", symbol: "❧" },
  paella: { labels: label("Paella", "Paella", "Paella", "Paella"), color: "#dc2626", icon: "restaurant-outline", symbol: "G" },
  panorama: { labels: label("Panorama", "Scenic views", "Vue panoramique", "Vistas panorámicas"), color: "#ea580c", icon: "trail-sign-outline", symbol: "◉" },
  panoramica: { labels: label("Panoramica", "Scenic", "Panoramique", "Panorámico"), color: "#ea580c", icon: "trail-sign-outline", symbol: "◉" },
  pedonale: { labels: label("Pedonale", "Walkable", "Piéton", "Peatonal"), color: "#16a34a", icon: "walk-outline", symbol: "P" },
  pesce: { labels: label("Cucina di pesce", "Seafood", "Cuisine de la mer", "Cocina marinera"), color: "#0891b2", icon: "restaurant-outline", symbol: "G" },
  pizza: { labels: label("Pizza", "Pizza", "Pizza", "Pizza"), color: "#dc2626", icon: "restaurant-outline", symbol: "G" },
  popolare: { labels: label("Popolare", "Local and lively", "Populaire et vivant", "Popular y animado"), color: "#b45309", icon: "people-outline", symbol: "L" },
  porto: { labels: label("Porto", "Harbor", "Port", "Puerto"), color: "#0891b2", icon: "boat-outline", symbol: "⚓" },
  pratico: { labels: label("Pratico", "Convenient", "Pratique", "Práctico"), color: "#2563eb", icon: "checkmark-circle-outline", symbol: "✓" },
  residenziale: { labels: label("Residenziale", "Residential", "Résidentiel", "Residencial"), color: "#16a34a", icon: "home-outline", symbol: "R" },
  resort: { labels: label("Resort", "Resorts", "Resorts", "Resorts"), color: "#0891b2", icon: "sunny-outline", symbol: "R" },
  riad: { labels: label("Riad", "Riads", "Riads", "Riads"), color: "#e8c06a", icon: "home-outline", symbol: "R" },
  rinascimento: { labels: label("Rinascimento", "Renaissance", "Renaissance", "Renacimiento"), color: "#7c3aed", icon: "color-palette-outline", symbol: "A" },
  ristoranti: { labels: label("Ristoranti", "Restaurants", "Restaurants", "Restaurantes"), color: "#dc2626", icon: "restaurant-outline", symbol: "G" },
  romantico: { labels: label("Romantico", "Romantic", "Romantique", "Romántico"), color: "#db2777", icon: "heart-outline", symbol: "♡" },
  rumoroso: { labels: label("Vivace e rumoroso", "Lively and noisy", "Animé et bruyant", "Animado y ruidoso"), color: "#ef4444", icon: "volume-high-outline", symbol: "!" },
  shopping: { labels: label("Shopping", "Shopping", "Shopping", "Compras"), color: "#db2777", icon: "bag-outline", symbol: "S" },
  spa: { labels: label("Spa e benessere", "Spa and wellness", "Spa et bien-être", "Spa y bienestar"), color: "#0891b2", icon: "water-outline", symbol: "S" },
  spiaggia: { labels: label("Spiaggia", "Beach", "Plage", "Playa"), color: "#0891b2", icon: "sunny-outline", symbol: "☀" },
  storico: { labels: label("Storico", "Historic", "Historique", "Histórico"), color: "#9333ea", icon: "time-outline", symbol: "★" },
  "street food": { labels: label("Street food", "Street food", "Cuisine de rue", "Comida callejera"), color: "#dc2626", icon: "restaurant-outline", symbol: "G" },
  studenti: { labels: label("Studenti", "Student area", "Quartier étudiant", "Zona estudiantil"), color: "#4f46e5", icon: "school-outline", symbol: "U" },
  tapas: { labels: label("Tapas", "Tapas", "Tapas", "Tapas"), color: "#dc2626", icon: "restaurant-outline", symbol: "G" },
  teatro: { labels: label("Teatro", "Theatre", "Théâtre", "Teatro"), color: "#9333ea", icon: "ticket-outline", symbol: "T" },
  tranquillo: { labels: label("Tranquillo", "Quiet", "Calme", "Tranquilo"), color: "#059669", icon: "shield-checkmark-outline", symbol: "❧" },
  trasporti: { labels: label("Ben collegato", "Well connected", "Bien desservi", "Bien comunicado"), color: "#2563eb", icon: "train-outline", symbol: "↔" },
  trekking: { labels: label("Trekking", "Hiking", "Randonnée", "Senderismo"), color: "#059669", icon: "walk-outline", symbol: "△" },
  trendy: { labels: label("Di tendenza", "Trendy", "Tendance", "De moda"), color: "#db2777", icon: "sparkles-outline", symbol: "T" },
  turisti: { labels: label("Molto turistico", "Very touristy", "Très touristique", "Muy turístico"), color: "#e8c06a", icon: "people-outline", symbol: "T" },
  turistico: { labels: label("Turistico", "Touristy", "Touristique", "Turístico"), color: "#e8c06a", icon: "location-outline", symbol: "T" },
  unesco: { labels: label("Patrimonio UNESCO", "UNESCO heritage", "Patrimoine UNESCO", "Patrimonio UNESCO"), color: "#9333ea", icon: "ribbon-outline", symbol: "U" },
  universita: { labels: label("Università", "University", "Université", "Universidad"), color: "#4f46e5", icon: "school-outline", symbol: "U" },
  veneziano: { labels: label("Atmosfera veneziana", "Venetian atmosphere", "Ambiance vénitienne", "Ambiente veneciano"), color: "#0891b2", icon: "boat-outline", symbol: "V" },
  verde: { labels: label("Verde", "Green", "Verdoyant", "Verde"), color: "#059669", icon: "leaf-outline", symbol: "❧" },
  vino: { labels: label("Vino", "Wine", "Vin", "Vino"), color: "#be123c", icon: "wine-outline", symbol: "V" },
  vintage: { labels: label("Vintage", "Vintage", "Vintage", "Vintage"), color: "#b45309", icon: "archive-outline", symbol: "V" },
  "vista panoramica": { labels: label("Vista panoramica", "Great views", "Belle vue", "Buenas vistas"), color: "#ea580c", icon: "trail-sign-outline", symbol: "◉" },
  "vita notturna": { labels: label("Vita notturna", "Nightlife", "Vie nocturne", "Vida nocturna"), color: "#7c3aed", icon: "moon-outline", symbol: "☾" },
  vivace: { labels: label("Vivace", "Lively", "Animé", "Animado"), color: "#7c3aed", icon: "musical-notes-outline", symbol: "V" },
};

export function normalizeVibeTag(value: string): string {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_-]+/g, " ");
}

export function neighborhoodVibe(tag: string, lang: Lang): { label: string; color: string; icon: IconName; symbol: string } {
  const key = normalizeVibeTag(tag);
  const definition = DEFINITIONS[key];
  if (definition) {
    const language = lang === "it" || lang === "fr" || lang === "es" ? lang : "en";
    return { label: definition.labels[language], color: definition.color, icon: definition.icon, symbol: definition.symbol };
  }
  const readable = tag.replace(/[_-]+/g, " ").trim();
  return { label: readable.charAt(0).toUpperCase() + readable.slice(1), color: "#64748b", icon: "pricetag-outline", symbol: "•" };
}

const COPY = {
  it: {
    central: "Posizione comoda per visitare la città", connected: "Ben collegata con i trasporti", local: "Atmosfera locale e caratteristica", food: "Buona scelta di ristoranti e locali", quiet: "Adatta a un soggiorno tranquillo", value: "Prezzi spesso più accessibili", waterfront: "Comoda per mare, lago o lungomare", culture: "Ricca di cultura e luoghi interessanti", lively: "Vivace anche la sera", green: "Buona presenza di natura e spazi aperti",
    busy: "Può essere affollata e più costosa", noisy: "Può essere rumorosa la sera", distant: "Può richiedere più spostamenti verso il centro", calm: "Poca vita notturna nelle vicinanze", simple: "Servizi e alloggi possono essere più semplici", hilly: "Gli spostamenti a piedi possono essere impegnativi", seasonal: "Prezzi e disponibilità variano molto in stagione", generic: "La comodità dipende dalla posizione precisa dell'alloggio",
  },
  en: {
    central: "Convenient base for exploring the city", connected: "Good public transport connections", local: "Distinctive local atmosphere", food: "Good choice of restaurants and venues", quiet: "Suitable for a quiet stay", value: "Prices are often more accessible", waterfront: "Convenient for the sea, lake or waterfront", culture: "Rich in culture and interesting places", lively: "Lively in the evening", green: "Good access to nature and open spaces",
    busy: "Can be crowded and more expensive", noisy: "Can be noisy in the evening", distant: "May require longer trips to the center", calm: "Limited nightlife nearby", simple: "Services and lodging may be simpler", hilly: "Walking can be demanding", seasonal: "Prices and availability vary greatly by season", generic: "Convenience depends on the exact location of the accommodation",
  },
  fr: {
    central: "Emplacement pratique pour découvrir la ville", connected: "Bien desservi par les transports", local: "Ambiance locale marquée", food: "Bon choix de restaurants et de lieux de sortie", quiet: "Adapté à un séjour calme", value: "Prix souvent plus accessibles", waterfront: "Pratique pour la mer, le lac ou le front d'eau", culture: "Riche en culture et en lieux intéressants", lively: "Animé en soirée", green: "Bon accès à la nature et aux espaces ouverts",
    busy: "Peut être fréquenté et plus cher", noisy: "Peut être bruyant le soir", distant: "Peut demander plus de trajets vers le centre", calm: "Peu de vie nocturne à proximité", simple: "Services et hébergements parfois plus simples", hilly: "Les déplacements à pied peuvent être exigeants", seasonal: "Prix et disponibilité très variables selon la saison", generic: "La commodité dépend de l'emplacement exact de l'hébergement",
  },
  es: {
    central: "Ubicación cómoda para conocer la ciudad", connected: "Bien comunicado por transporte público", local: "Ambiente local característico", food: "Buena oferta de restaurantes y locales", quiet: "Adecuado para una estancia tranquila", value: "Precios normalmente más accesibles", waterfront: "Cómodo para el mar, el lago o el paseo marítimo", culture: "Rico en cultura y lugares interesantes", lively: "Animado también por la noche", green: "Buen acceso a naturaleza y espacios abiertos",
    busy: "Puede estar concurrido y ser más caro", noisy: "Puede ser ruidoso por la noche", distant: "Puede requerir más desplazamientos al centro", calm: "Poca vida nocturna en los alrededores", simple: "Los servicios y alojamientos pueden ser más sencillos", hilly: "Los desplazamientos a pie pueden ser exigentes", seasonal: "Precios y disponibilidad muy variables según la temporada", generic: "La comodidad depende de la ubicación exacta del alojamiento",
  },
};

export function neighborhoodProsCons(tags: string[] | undefined, lang: Lang): { pros: string[]; cons: string[] } {
  const language = lang === "it" || lang === "fr" || lang === "es" ? lang : "en";
  const copy = COPY[language];
  const set = new Set((tags ?? []).map(normalizeVibeTag));
  const has = (...values: string[]) => values.some((value) => set.has(value));
  const pros: string[] = [];
  const cons: string[] = [];
  const add = (target: string[], value: string) => { if (target.length < 2 && !target.includes(value)) target.push(value); };

  if (has("centro", "centrale", "centro storico", "attrazioni", "turistico", "turisti", "pratico")) add(pros, copy.central);
  if (has("metro", "trasporti", "stazione")) add(pros, copy.connected);
  if (has("locale", "autentico", "popolare", "artigiani", "medievale", "veneziano")) add(pros, copy.local);
  if (has("gastronomia", "ristoranti", "mercati", "street food", "pizza", "tapas", "paella", "pesce", "vino", "cantine")) add(pros, copy.food);
  if (has("tranquillo", "residenziale", "famiglie", "comfort", "romantico")) add(pros, copy.quiet);
  if (has("budget", "economico")) add(pros, copy.value);
  if (has("mare", "spiaggia", "porto", "lungomare", "lago", "resort")) add(pros, copy.waterfront);
  if (has("culturale", "arte", "storico", "musei", "teatro", "rinascimento", "unesco", "art nouveau", "georgiano", "ebraico", "moschee")) add(pros, copy.culture);
  if (has("vita notturna", "locali", "studenti", "vivace", "flamenco", "trendy")) add(pros, copy.lively);
  if (has("verde", "natura", "trekking")) add(pros, copy.green);
  add(pros, copy.local);
  add(pros, copy.connected);

  if (has("centro", "centrale", "centro storico", "attrazioni", "turistico", "turisti", "lusso", "chic", "elegante", "shopping")) add(cons, copy.busy);
  if (has("vita notturna", "locali", "studenti", "vivace", "rumoroso", "trendy")) add(cons, copy.noisy);
  if (has("spiaggia", "porto", "lungomare", "lago", "resort", "tranquillo", "residenziale", "verde", "natura")) add(cons, copy.distant);
  if (has("tranquillo", "residenziale", "famiglie", "business")) add(cons, copy.calm);
  if (has("budget", "economico", "popolare")) add(cons, copy.simple);
  if (has("collina", "panorama", "vista panoramica", "trekking")) add(cons, copy.hilly);
  if (has("mare", "spiaggia", "porto", "resort", "lusso", "turistico", "turisti")) add(cons, copy.seasonal);
  add(cons, copy.generic);
  add(cons, copy.seasonal);

  return { pros, cons };
}
