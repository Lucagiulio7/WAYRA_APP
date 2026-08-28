import { en } from "./translations/en";
import { es } from "./translations/es";
import { fr } from "./translations/fr";
import { it } from "./translations/it";
import { Lang, LanguageOption, TranslationSet } from "./types";

export type { Lang, LanguageOption, TranslationSet } from "./types";

type LanguageRegistration = {
  option: Omit<LanguageOption, "code">;
  translations: TranslationSet;
};

export const DEFAULT_LANG: Lang = "it";

// Adding a UI language only requires its translation file and one registry entry.
export const LANGUAGE_REGISTRY: Record<string, LanguageRegistration> = {
  it: {
    option: { label: "Italiano", shortLabel: "IT", flag: "IT", flagIso: "it" },
    translations: it,
  },
  en: {
    option: { label: "English", shortLabel: "EN", flag: "GB", flagIso: "gb" },
    translations: en,
  },
  es: {
    option: { label: "Espa\u00f1ol", shortLabel: "ES", flag: "ES", flagIso: "es" },
    translations: es,
  },
  fr: {
    option: { label: "Français", shortLabel: "FR", flag: "FR", flagIso: "fr" },
    translations: fr,
  },
};

export const translations: Record<string, TranslationSet> = Object.fromEntries(
  Object.entries(LANGUAGE_REGISTRY).map(([code, registration]) => [code, registration.translations]),
);

export const LANGUAGE_OPTIONS: LanguageOption[] = Object.entries(LANGUAGE_REGISTRY).map(
  ([code, registration]) => ({ code, ...registration.option }),
);

export const SUPPORTED_LANGS = LANGUAGE_OPTIONS.map((option) => option.code);

export function isSupportedLang(value: unknown): value is Lang {
  return typeof value === "string" && SUPPORTED_LANGS.includes(value);
}

export function nextLang(current: Lang): Lang {
  const currentIndex = LANGUAGE_OPTIONS.findIndex((option) => option.code === current);
  return LANGUAGE_OPTIONS[(currentIndex + 1) % LANGUAGE_OPTIONS.length].code;
}

export function languageOption(code: Lang): LanguageOption {
  return LANGUAGE_OPTIONS.find((option) => option.code === code) ?? LANGUAGE_OPTIONS[0];
}

export function localText(
  lang: Lang,
  values: Record<string, string>,
): string {
  return values[lang] ?? values.en ?? values.it ?? Object.values(values)[0] ?? "";
}
