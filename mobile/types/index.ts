export interface Stop {
  type: "attraction" | "food" | "meal" | "free_time";
  id: number;
  name: string;
  name_en?: string | null;
  description?: string;
  description_en?: string | null;
  latitude: number;
  longitude: number;
  category_level?: number;
  estimated_visit_time?: number;
  tags?: string[];
  city?: string;
  is_food_spot?: boolean;
  attraction_type?: string | null;
  food_type?: string | null;
  meal_type?: string | null;
  empty_meal_slot?: boolean;
  rating?: number | null;
  ticket_url?: string | null;
  must_see?: boolean;
  must_see_rank?: number | null;
  notes?: string;           // nota libera dell'utente
}

export interface Attraction {
  id: number;
  name: string;
  name_en?: string | null;
  description?: string | null;
  description_en?: string | null;
  wiki_snippet?: string | null;
  category_level: number;
  latitude: number;
  longitude: number;
  estimated_visit_time?: number | null;
  tags: string[];
  must_see?: boolean;
  must_see_rank?: number | null;
}

export interface Restaurant {
  id: number;
  name: string;
  name_en?: string | null;
  description?: string;
  description_en?: string | null;
  food_type?: string;
  meal_type?: "lunch" | "dinner" | "both" | string | null;
  rating?: number;
  latitude: number;
  longitude: number;
  maps_link: string;
}

export interface ItineraryDay {
  day: number;
  stops: Stop[];
  maps_link: string;
  restaurants: Restaurant[];
}

export interface FoodPlace {
  name: string;
  name_en?: string | null;
  maps_link: string;
  rating?: number | null;
  food_type?: string | null;
  curated?: boolean;
}

export interface Food {
  id: number;
  name: string;
  name_en?: string | null;
  description: string;
  description_en?: string | null;
  ingredients: string[];
  ingredients_en?: string[] | null;
  city: string;
  places?: FoodPlace[] | null;
}

export interface CultureFact {
  icon: string;
  title: string;
  title_en?: string | null;
  body: string;
  body_en?: string | null;
}

export interface Itinerary {
  city: string;
  num_days: number;
  level: number | number[];
  max_walk_km?: number;
  days: ItineraryDay[];
  food_recommendations: Food[];
  culture_facts: CultureFact[];
}

export type ExperienceLevel = 1 | "mix";

export interface Neighborhood {
  id: number;
  name: string;
  name_en?: string | null;
  description: string;
  description_en?: string | null;
  vibe_tags: string[];
  geojson?: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  } | null;
}

export interface TransportApp {
  name: string;
  description?: string;
  description_en?: string;
  ios_url?: string;
  android_url?: string;
}

export interface EmergencyNumber {
  label: string;
  label_en?: string;
  number: string;
}

export interface CityInfo {
  city: string;
  currency: string;
  currency_en?: string;
  language: string;
  language_en?: string;
  english_level: "alto" | "medio" | "basso";
  english_note?: string;
  english_note_en?: string;
  timezone: string;
  emergency_numbers: EmergencyNumber[];
  voltage?: string;
  water?: string;
  water_en?: string;
  tipping?: string;
  tipping_en?: string;
  transport_apps: TransportApp[];
  useful_apps: TransportApp[];
  quick_tips?: string[];
  quick_tips_en?: string[];
  max_days_iconico?: number | null;
  max_days_esploratore?: number | null;
}
