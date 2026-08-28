export type TranslationValue = string | string[] | null;
export type TranslationMap = Record<string, Record<string, TranslationValue | undefined> | undefined>;
export interface TranslatableContent {
  translations?: TranslationMap | null;
}

export interface Stop extends TranslatableContent {
  type: "attraction" | "food" | "meal" | "free_time";
  id: number;
  name: string;
  name_en?: string | null;
  name_fr?: string | null;
  name_es?: string | null;
  description?: string;
  description_en?: string | null;
  description_fr?: string | null;
  description_es?: string | null;
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
  booking_required?: boolean | null;
  free_entry?: boolean | null;
  opening_hours_note?: string | null;
  opening_hours_note_en?: string | null;
  opening_hours_note_fr?: string | null;
  opening_hours_note_es?: string | null;
  price_note?: string | null;
  price_note_en?: string | null;
  price_note_fr?: string | null;
  price_note_es?: string | null;
  closed_days?: string[] | null;
  last_verified_at?: string | null;
  must_see?: boolean;
  must_see_rank?: number | null;
  notes?: string;           // nota libera dell'utente
}

export interface Attraction extends TranslatableContent {
  id: number;
  name: string;
  name_en?: string | null;
  name_fr?: string | null;
  name_es?: string | null;
  description?: string | null;
  description_en?: string | null;
  description_fr?: string | null;
  description_es?: string | null;
  wiki_snippet?: string | null;
  category_level: number;
  latitude: number;
  longitude: number;
  estimated_visit_time?: number | null;
  ticket_url?: string | null;
  booking_required?: boolean | null;
  free_entry?: boolean | null;
  opening_hours_note?: string | null;
  opening_hours_note_en?: string | null;
  opening_hours_note_fr?: string | null;
  opening_hours_note_es?: string | null;
  price_note?: string | null;
  price_note_en?: string | null;
  price_note_fr?: string | null;
  price_note_es?: string | null;
  closed_days?: string[] | null;
  last_verified_at?: string | null;
  tags: string[];
  must_see?: boolean;
  must_see_rank?: number | null;
}

export interface Restaurant extends TranslatableContent {
  id: number;
  name: string;
  name_en?: string | null;
  name_fr?: string | null;
  name_es?: string | null;
  description?: string;
  description_en?: string | null;
  description_fr?: string | null;
  description_es?: string | null;
  food_type?: string;
  meal_type?: "lunch" | "dinner" | "both" | string | null;
  rating?: number;
  latitude: number;
  longitude: number;
  maps_link: string;
  recommended_dishes?: string[];
  recommended_dishes_en?: string[];
  recommended_dishes_fr?: string[];
  recommended_dishes_es?: string[];
  has_curated_dish_match?: boolean;
}

export interface ItineraryDay {
  day: number;
  date?: string;
  day_type?: "urban" | "excursion";
  transfer_required?: boolean;
  transfer_distance_km?: number;
  transfer_mode?: "public_transport" | "ferry";
  walking_distance_km?: number;
  internal_transfer_required?: boolean;
  transfer_legs?: Array<{
    from_stop_id?: number;
    to_stop_id?: number;
    distance_km: number;
    mode: "public_transport" | "ferry";
  }>;
  stops: Stop[];
  maps_link: string;
  restaurants: Restaurant[];
}

export interface FoodPlace extends TranslatableContent {
  name: string;
  name_en?: string | null;
  name_fr?: string | null;
  name_es?: string | null;
  maps_link: string;
  rating?: number | null;
  food_type?: string | null;
  curated?: boolean;
}

export interface Food extends TranslatableContent {
  id: number;
  name: string;
  name_en?: string | null;
  name_fr?: string | null;
  name_es?: string | null;
  description: string;
  description_en?: string | null;
  description_fr?: string | null;
  description_es?: string | null;
  ingredients: string[];
  ingredients_en?: string[] | null;
  ingredients_fr?: string[] | null;
  ingredients_es?: string[] | null;
  city: string;
  places?: FoodPlace[] | null;
}

export interface CultureFact extends TranslatableContent {
  icon: string;
  title: string;
  title_en?: string | null;
  title_fr?: string | null;
  title_es?: string | null;
  body: string;
  body_en?: string | null;
  body_fr?: string | null;
  body_es?: string | null;
}

export type ItineraryQualityIssueCode =
  | "empty_day"
  | "duplicate_stop"
  | "too_few_stops"
  | "too_few_minutes"
  | "too_many_stops"
  | "too_many_minutes"
  | "too_many_museums"
  | "walking_limit"
  | "must_see_missing";

export interface ItineraryQualityIssue {
  code: ItineraryQualityIssueCode;
  day?: number;
  actual?: number;
  expected?: number;
}

export interface ItineraryQuality {
  status: "ok" | "adjusted" | "limited";
  adjusted: boolean;
  issues: ItineraryQualityIssue[];
}

export interface Itinerary {
  city: string;
  start_date?: string;
  num_days: number;
  level: number | number[];
  creation_mode?: "generated" | "manual";
  quality?: ItineraryQuality;
  max_walk_km?: number;
  days: ItineraryDay[];
  food_recommendations: Food[];
  culture_facts: CultureFact[];
}

export type ExperienceLevel = 1 | "mix";

export interface Neighborhood extends TranslatableContent {
  id: number;
  name: string;
  name_en?: string | null;
  name_fr?: string | null;
  name_es?: string | null;
  description: string;
  description_en?: string | null;
  description_fr?: string | null;
  description_es?: string | null;
  vibe_tags: string[];
  geojson?: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  } | null;
}

export interface TransportApp extends TranslatableContent {
  name: string;
  description?: string;
  description_en?: string;
  description_fr?: string;
  description_es?: string;
  ios_url?: string;
  android_url?: string;
}

export interface EmergencyNumber extends TranslatableContent {
  label: string;
  label_en?: string;
  label_fr?: string;
  label_es?: string;
  number: string;
}

export interface CityInfo extends TranslatableContent {
  city: string;
  currency: string;
  currency_en?: string;
  currency_fr?: string;
  currency_es?: string;
  language: string;
  language_en?: string;
  language_fr?: string;
  language_es?: string;
  english_level: "alto" | "medio" | "basso";
  english_note?: string;
  english_note_en?: string;
  english_note_fr?: string;
  english_note_es?: string;
  timezone: string;
  emergency_numbers: EmergencyNumber[];
  voltage?: string;
  water?: string;
  water_en?: string;
  water_fr?: string;
  water_es?: string;
  tipping?: string;
  tipping_en?: string;
  tipping_fr?: string;
  tipping_es?: string;
  transport_apps: TransportApp[];
  useful_apps: TransportApp[];
  quick_tips?: string[];
  quick_tips_en?: string[];
  quick_tips_fr?: string[];
  quick_tips_es?: string[];
  max_days_iconico?: number | null;
  max_days_esploratore?: number | null;
}
