import { en } from "./translations/en";
import { fr } from "./translations/fr";
import { it } from "./translations/it";
import { Lang, LanguageOption } from "./types";

export type { Lang, LanguageOption, TranslationSet } from "./types";

export const translations = { it, en, fr } as const;

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "it", label: "Italiano", shortLabel: "IT", flag: "🇮🇹", flagIso: "it" },
  { code: "en", label: "English", shortLabel: "EN", flag: "🇬🇧", flagIso: "gb" },
  { code: "fr", label: "Français", shortLabel: "FR", flag: "🇫🇷", flagIso: "fr" },
];

export const SUPPORTED_LANGS = LANGUAGE_OPTIONS.map((option) => option.code);

export function isSupportedLang(value: unknown): value is Lang {
  return typeof value === "string" && SUPPORTED_LANGS.includes(value as Lang);
}

export function nextLang(current: Lang): Lang {
  const currentIndex = LANGUAGE_OPTIONS.findIndex((option) => option.code === current);
  return LANGUAGE_OPTIONS[(currentIndex + 1) % LANGUAGE_OPTIONS.length].code;
}

export function languageOption(code: Lang): LanguageOption {
  return LANGUAGE_OPTIONS.find((option) => option.code === code) ?? LANGUAGE_OPTIONS[0];
}
