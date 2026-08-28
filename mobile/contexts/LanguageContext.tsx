import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_LANG, isSupportedLang, Lang, nextLang, translations, TranslationSet } from "@/i18n";

const LANG_KEY = "wayra_lang";

interface LanguageContextType {
  lang: Lang;
  t: TranslationSet;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: DEFAULT_LANG,
  t: translations[DEFAULT_LANG],
  setLang: () => {},
  toggle: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY)
      .then((val) => { if (isSupportedLang(val)) setLangState(val); })
      .catch((e) => { if (__DEV__) console.warn("[LanguageContext] AsyncStorage read failed:", e); });
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    AsyncStorage.setItem(LANG_KEY, next)
      .catch((e) => { if (__DEV__) console.warn("[LanguageContext] AsyncStorage write failed:", e); });
  };

  const toggle = () => setLang(nextLang(lang));

  const value = useMemo(() => ({
    lang,
    t: translations[lang] ?? translations[DEFAULT_LANG],
    setLang,
    toggle,
  }), [lang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
export type { Lang };
