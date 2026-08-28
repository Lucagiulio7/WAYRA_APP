import { registeredCityLabel } from "@/data/cityRegistry";

function fallbackCityLabel(city: string): string {
  return city
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function cityLabel(city: string, lang: string = "it"): string {
  return registeredCityLabel(city, lang) ?? fallbackCityLabel(city);
}
