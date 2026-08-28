export type AppLang = string;

export type TranslationPrimitive = string | string[] | null;
export type TranslationValues = Record<string, TranslationPrimitive | undefined>;
export type TranslationMap = Record<string, TranslationValues | undefined>;

export type LocalizedContent = object;

const BASE_LANGUAGE = "it";
const FALLBACK_LANGUAGE = "en";

function legacyValue(item: LocalizedContent, field: string, lang: AppLang): unknown {
  const key = lang === BASE_LANGUAGE ? field : `${field}_${lang}`;
  return (item as Record<string, unknown>)[key];
}

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0);
}

export function localizedField<T>(
  item: LocalizedContent | null | undefined,
  field: string,
  lang: AppLang,
  fallback: T,
): T {
  if (!item) return fallback;
  const languageOrder = Array.from(new Set([lang, FALLBACK_LANGUAGE, BASE_LANGUAGE]));

  for (const language of languageOrder) {
    const translated = (item as { translations?: TranslationMap | null }).translations?.[language]?.[field];
    if (hasValue(translated)) return translated as T;
    const legacy = legacyValue(item, field, language);
    if (hasValue(legacy)) return legacy as T;
  }
  return fallback;
}

export function exactLocalizedField<T>(
  item: LocalizedContent | null | undefined,
  field: string,
  lang: AppLang,
  fallback: T,
): T {
  if (!item) return fallback;
  const translated = (item as { translations?: TranslationMap | null }).translations?.[lang]?.[field];
  if (hasValue(translated)) return translated as T;
  const legacy = legacyValue(item, field, lang);
  return hasValue(legacy) ? legacy as T : fallback;
}

export function localizedName<T extends LocalizedContent>(item: T, lang: AppLang): string {
  return localizedField<string>(item, "name", lang, "");
}

export function localizedDescription<T extends LocalizedContent>(item: T, lang: AppLang): string {
  return localizedField<string>(item, "description", lang, "");
}

export function localizedTitle<T extends LocalizedContent>(item: T, lang: AppLang): string {
  return localizedField<string>(item, "title", lang, "");
}

export function localizedBody<T extends LocalizedContent>(item: T, lang: AppLang): string {
  return localizedField<string>(item, "body", lang, "");
}

// Compatibility helpers for call sites not yet holding the full object.
export function localizedString(
  value: string | null | undefined,
  valueEn: string | null | undefined,
  valueFr: string | null | undefined,
  lang: AppLang,
): string {
  return localizedField<string>(
    { value, value_en: valueEn, value_fr: valueFr },
    "value",
    lang,
    "",
  );
}

export function localizedStringArray(
  value: string[] | null | undefined,
  valueEn: string[] | null | undefined,
  valueFr: string[] | null | undefined,
  lang: AppLang,
): string[] {
  return localizedField<string[]>(
    { value, value_en: valueEn, value_fr: valueFr },
    "value",
    lang,
    [],
  );
}
