import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LANG_KEY = "wayra_lang";

export type Lang = "it" | "en";

const translations = {
  it: {
    // Home
    destination: "Destinazione",
    numDays: "Numero di giorni",
    experienceType: "Tipo di esperienza",
    iconicLabel: "Iconico",
    iconicSubtitle: "Le meraviglie imperdibili della città",
    explorerLabel: "Esploratore",
    explorerSubtitle: "Iconici + gemme autentiche e luoghi segreti",
    generating: "Generando itinerario…",
    generate: "Genera Itinerario",
    chooseDestination: "Scegli destinazione",
    // Itinerary screen
    tabItinerary: "Itinerario",
    tabNeighborhoods: "Alloggi",
    tabFood: "Cucina",
    tabCulture: "Cultura",
    days: "giorni",
    fullMix: "Mix totale",
    levelIconic: "Iconico",
    levelCurated: "Ricercato",
    levelHidden: "Nascosto",
    foodIntro: (city: string) => `Piatti tipici da provare assolutamente a ${city.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
    cultureIntro: (city: string) => `Curiosità e pillole di storia su ${city.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
    neighborhoodsIntro: (city: string) => `Le zone migliori dove soggiornare a ${city.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}, divise per stile`,
    viewOnMap: "Vedi su Maps",
    noNeighborhoodsData: "Dati non ancora disponibili per questa città.",
    whereToEat: "Dove mangiarlo",
    itineraryUnavailable: "Itinerario non disponibile.",
    goBack: "Torna indietro",
    // DayCard
    day: "Giorno",
    places: "luoghi",
    openRouteMaps: "Apri percorso su Maps",
    wantToEat: "Vuoi mangiare qualcosa?",
    // StopCard
    freeTimeLabel: "TEMPO LIBERO",
    levelIconicBadge: "Iconico",
    levelCuratedBadge: "Ricercato",
    levelHiddenBadge: "Nascosto",
    // Practical info tab
    tabPractical: "Info",
    practicalIntro: (city: string) => `Tutto quello che devi sapere per visitare ${city.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
    practicalEssentials: "Essenziali",
    practicalCurrency: "Moneta",
    practicalLanguage: "Lingua",
    practicalEnglish: "Inglese parlato",
    practicalTimezone: "Fuso orario",
    practicalVoltage: "Corrente elettrica",
    practicalWater: "Acqua del rubinetto",
    practicalTipping: "Mance",
    practicalEmergency: "Numeri di emergenza",
    practicalTransportApps: "App mezzi pubblici",
    practicalUsefulApps: "App utili",
    practicalTips: "Consigli pratici",
    noPracticalData: "Informazioni pratiche non ancora disponibili per questa città.",
  },
  en: {
    // Home
    destination: "Destination",
    numDays: "Number of days",
    experienceType: "Experience type",
    iconicLabel: "Iconic",
    iconicSubtitle: "The unmissable wonders of the city",
    explorerLabel: "Explorer",
    explorerSubtitle: "Iconic + authentic gems and hidden spots",
    generating: "Generating itinerary…",
    generate: "Generate Itinerary",
    chooseDestination: "Choose destination",
    // Itinerary screen
    tabItinerary: "Itinerary",
    tabNeighborhoods: "Stay",
    tabFood: "Food",
    tabCulture: "Culture",
    days: "days",
    fullMix: "Full mix",
    levelIconic: "Iconic",
    levelCurated: "Curated",
    levelHidden: "Hidden",
    foodIntro: (city: string) => `Must-try dishes in ${city.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
    cultureIntro: (city: string) => `Curiosities and history about ${city.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
    neighborhoodsIntro: (city: string) => `Best neighborhoods to stay in ${city.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}, sorted by vibe`,
    viewOnMap: "View on Maps",
    noNeighborhoodsData: "No data available for this city yet.",
    whereToEat: "Where to eat it",
    itineraryUnavailable: "Itinerary not available.",
    goBack: "Go back",
    // DayCard
    day: "Day",
    places: "places",
    openRouteMaps: "Open route on Maps",
    wantToEat: "Want to eat something?",
    // StopCard
    freeTimeLabel: "FREE TIME",
    levelIconicBadge: "Iconic",
    levelCuratedBadge: "Curated",
    levelHiddenBadge: "Hidden",
    // Practical info tab
    tabPractical: "Info",
    practicalIntro: (city: string) => `Everything you need to know to visit ${city.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
    practicalEssentials: "Essentials",
    practicalCurrency: "Currency",
    practicalLanguage: "Language",
    practicalEnglish: "English spoken",
    practicalTimezone: "Time zone",
    practicalVoltage: "Electricity",
    practicalWater: "Tap water",
    practicalTipping: "Tipping",
    practicalEmergency: "Emergency numbers",
    practicalTransportApps: "Transport apps",
    practicalUsefulApps: "Useful apps",
    practicalTips: "Practical tips",
    noPracticalData: "Practical information not yet available for this city.",
  },
};

type Translations = typeof translations.it;

interface LanguageContextType {
  lang: Lang;
  t: Translations;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "it",
  t: translations.it,
  toggle: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("it");

  // Carica lingua salvata al primo avvio
  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY)
      .then((val) => { if (val === "it" || val === "en") setLang(val); })
      .catch((e) => { if (__DEV__) console.warn("[LanguageContext] AsyncStorage read failed:", e); });
  }, []);

  const toggle = () => {
    setLang((l) => {
      const next = l === "it" ? "en" : "it";
      AsyncStorage.setItem(LANG_KEY, next);
      return next;
    });
  };

  const t = translations[lang] as Translations;

  return (
    <LanguageContext.Provider value={{ lang, t, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
