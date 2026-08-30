import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cityLabel } from "@/utils/cityLabels";
import { ActivityKind, cityActivities, localizedActivitySubject } from "@/data/cityActivities";
import { openExternalLink } from "@/utils/externalLinks";
import { contextHelpOutline, type ContextHelpAnchor, type ContextHelpContent } from "@/components/ContextHelp";

type Category = {
  icon: keyof typeof Ionicons.glyphMap;
  query: Record<string, string>;
  title: Record<string, string>;
  description: Record<string, string>;
  color: string;
};

const CATEGORIES: Category[] = [
  {
    icon: "walk-outline",
    color: "#7eb8f7",
    query: { it: "tour guidati", en: "guided tours", fr: "visites guidées", es: "visitas guiadas" },
    title: { it: "Tour guidati", en: "Guided tours", fr: "Visites guidées", es: "Visitas guiadas" },
    description: {
      it: "Passeggiate, tour privati e percorsi con guide locali.",
      en: "Walking tours, private visits and experiences with local guides.",
      fr: "Promenades, visites privées et expériences avec des guides locaux.",
      es: "Paseos, visitas privadas y experiencias con guías locales.",
    },
  },
  {
    icon: "ticket-outline",
    color: "#e8c06a",
    query: { it: "musei biglietti", en: "museum tickets", fr: "billets musées", es: "entradas museos" },
    title: { it: "Musei e biglietti", en: "Museums and tickets", fr: "Musées et billets", es: "Museos y entradas" },
    description: {
      it: "Ingressi, visite riservate e accessi salta fila.",
      en: "Admission, reserved visits and skip-the-line access.",
      fr: "Entrées, visites réservées et accès coupe-file.",
      es: "Entradas, visitas reservadas y accesos sin colas.",
    },
  },
  {
    icon: "restaurant-outline",
    color: "#f97316",
    query: { it: "tour gastronomici", en: "food tours", fr: "visites gastronomiques", es: "tours gastronómicos" },
    title: { it: "Esperienze gastronomiche", en: "Food experiences", fr: "Expériences gastronomiques", es: "Experiencias gastronómicas" },
    description: {
      it: "Degustazioni, corsi di cucina e tour dei sapori locali.",
      en: "Tastings, cooking classes and tours of local flavours.",
      fr: "Dégustations, cours de cuisine et circuits de saveurs locales.",
      es: "Degustaciones, clases de cocina y recorridos de sabores locales.",
    },
  },
  {
    icon: "leaf-outline",
    color: "#58c89b",
    query: { it: "attività all'aperto", en: "outdoor activities", fr: "activités plein air", es: "actividades al aire libre" },
    title: { it: "All'aperto", en: "Outdoors", fr: "Plein air", es: "Al aire libre" },
    description: {
      it: "Escursioni, bici, barca e attività nella natura.",
      en: "Hikes, cycling, boat trips and activities in nature.",
      fr: "Randonnées, vélo, bateau et activités dans la nature.",
      es: "Excursiones, bicicleta, barco y actividades en la naturaleza.",
    },
  },
  {
    icon: "bus-outline",
    color: "#a78bfa",
    query: { it: "escursioni giornaliere", en: "day trips", fr: "excursions journée", es: "excursiones de un día" },
    title: { it: "Gite di un giorno", en: "Day trips", fr: "Excursions à la journée", es: "Excursiones de un día" },
    description: {
      it: "Destinazioni vicine da raggiungere con un'escursione organizzata.",
      en: "Nearby destinations to discover on an organised day trip.",
      fr: "Destinations proches à découvrir lors d'une excursion organisée.",
      es: "Destinos cercanos para descubrir en una excursión organizada.",
    },
  },
  {
    icon: "moon-outline",
    color: "#ef78b4",
    query: { it: "spettacoli vita notturna", en: "shows nightlife", fr: "spectacles vie nocturne", es: "espectáculos vida nocturna" },
    title: { it: "Spettacoli e serate", en: "Shows and nightlife", fr: "Spectacles et soirées", es: "Espectáculos y noches" },
    description: {
      it: "Concerti, spettacoli, crociere serali ed esperienze dopo il tramonto.",
      en: "Concerts, shows, evening cruises and after-dark experiences.",
      fr: "Concerts, spectacles, croisières du soir et expériences nocturnes.",
      es: "Conciertos, espectáculos, cruceros nocturnos y experiencias al anochecer.",
    },
  },
];

const LOCALE_PATH: Record<string, string> = {
  it: "it-it",
  en: "en-gb",
  fr: "fr-fr",
  es: "es-es",
};

const KIND_META: Record<ActivityKind, {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: Record<string, string>;
}> = {
  guided: { icon: "walk-outline", color: "#7eb8f7", label: { it: "Visita guidata", en: "Guided tour", fr: "Visite guidée", es: "Visita guiada" } },
  ticket: { icon: "ticket-outline", color: "#e8c06a", label: { it: "Biglietti", en: "Tickets", fr: "Billets", es: "Entradas" } },
  cruise: { icon: "boat-outline", color: "#38bdf8", label: { it: "Crociera", en: "Cruise", fr: "Croisière", es: "Crucero" } },
  dayTrip: { icon: "bus-outline", color: "#a78bfa", label: { it: "Escursione", en: "Day trip", fr: "Excursion", es: "Excursión" } },
  food: { icon: "restaurant-outline", color: "#f97316", label: { it: "Tour gastronomico", en: "Food tour", fr: "Visite gastronomique", es: "Tour gastronómico" } },
  nature: { icon: "leaf-outline", color: "#58c89b", label: { it: "Attività all'aperto", en: "Outdoor activity", fr: "Activité en plein air", es: "Actividad al aire libre" } },
  show: { icon: "musical-notes-outline", color: "#ef78b4", label: { it: "Spettacolo", en: "Show", fr: "Spectacle", es: "Espectáculo" } },
  experience: { icon: "sparkles-outline", color: "#f59e0b", label: { it: "Esperienza", en: "Experience", fr: "Expérience", es: "Experiencia" } },
};

function textFor(values: Record<string, string>, lang: string): string {
  return values[lang] ?? values.en ?? values.it;
}

function getYourGuideSearchUrl(city: string, lang: string, query?: string): string {
  const destination = cityLabel(city, lang);
  const search = [destination, query].filter(Boolean).join(" ");
  const locale = LOCALE_PATH[lang] ?? LOCALE_PATH.en;
  return "https://www.getyourguide.com/" + locale + "/s/?q=" + encodeURIComponent(search);
}

export function ActivitiesTab({ city, helpActive = false, onHelpRequest }: { city: string; helpActive?: boolean; onHelpRequest?: (content: ContextHelpContent, anchor?: ContextHelpAnchor) => void }) {
  const { lang, t } = useLanguage();
  const { colors } = useTheme();

  const copy = useMemo(() => ({
    intro: t.activitiesIntro(city),
    provider: t.activitiesProvider,
    all: t.activitiesAll,
    error: t.activitiesOpenError,
  }), [city, t]);
  const curatedActivities = useMemo(() => cityActivities(city), [city]);
  const curatedTitle = lang === "es"
    ? "Búsquedas recomendadas"
    : lang === "fr"
      ? "Recherches recommandées"
      : lang === "en"
        ? "Recommended searches"
        : "Ricerche consigliate";
  const activityHelp: ContextHelpContent = {
    icon: "open-outline",
    title: lang === "es" ? "Abrir una actividad" : lang === "fr" ? "Ouvrir une activité" : lang === "en" ? "Open an activity" : "Apri un'attività",
    body: lang === "es" ? "Abre una búsqueda externa ya preparada con la actividad y la ciudad seleccionadas. Comprueba horarios, condiciones y precio antes de reservar." : lang === "fr" ? "Ouvre une recherche externe préparée avec l'activité et la ville choisies. Vérifiez horaires, conditions et prix avant de réserver." : lang === "en" ? "Opens a prepared external search for the selected activity and city. Check times, conditions and price before booking." : "Apre una ricerca esterna già compilata con attività e città. Controlla orari, condizioni e prezzo prima di prenotare.",
  };

  const activityPress = (action: () => void) => (event: any) => {
    if (helpActive) {
      onHelpRequest?.(activityHelp, { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
      return;
    }
    action();
  };

  const openSearch = async (query?: string) => {
    const url = getYourGuideSearchUrl(city, lang, query);
    await openExternalLink(url, lang, { title: t.errTitle, message: copy.error });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.intro, { color: colors.textMuted }]}>{copy.intro}</Text>

      <View style={styles.providerRow}>
        <View style={[styles.providerMark, { backgroundColor: "#ff5533" }]} />
        <Text style={[styles.providerText, { color: colors.textSub }]}>{copy.provider}</Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.accentGold }, contextHelpOutline(helpActive, colors.text)]}
        onPress={activityPress(() => openSearch())}
        activeOpacity={0.84}
        accessibilityRole="link"
      >
        <Ionicons name="sparkles-outline" size={19} color={colors.bg} />
        <Text style={[styles.primaryText, { color: colors.bg }]}>{copy.all}</Text>
        <Ionicons name="open-outline" size={17} color={colors.bg} />
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>{curatedTitle}</Text>
      <View style={styles.grid}>
        {curatedActivities.length > 0
          ? curatedActivities.map((activity) => {
              const meta = KIND_META[activity.kind];
              const subject = localizedActivitySubject(activity, lang, city);
              const title = textFor(meta.label, lang) + " " + subject;
              return (
                <TouchableOpacity
                  key={activity.kind + "-" + subject}
                  style={[styles.categoryCard, styles.curatedCard, { backgroundColor: colors.card, borderColor: colors.border }, contextHelpOutline(helpActive, colors.accentGold)]}
                  onPress={activityPress(() => openSearch(title))}
                  activeOpacity={0.82}
                  accessibilityRole="link"
                  accessibilityLabel={title + ", GetYourGuide"}
                >
                  <View style={[styles.iconBox, { backgroundColor: meta.color + "20", borderColor: meta.color + "55" }]}>
                    <Ionicons name={meta.icon} size={22} color={meta.color} />
                  </View>
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>{title}</Text>
                  <View style={styles.categoryAction}>
                    <Text style={[styles.categoryActionText, { color: meta.color }]}>GetYourGuide</Text>
                    <Ionicons name="open-outline" size={14} color={meta.color} />
                  </View>
                </TouchableOpacity>
              );
            })
          : CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.icon}
                style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }, contextHelpOutline(helpActive, colors.accentGold)]}
                onPress={activityPress(() => openSearch(textFor(category.query, lang)))}
                activeOpacity={0.82}
                accessibilityRole="link"
              >
                <View style={[styles.iconBox, { backgroundColor: category.color + "20", borderColor: category.color + "55" }]}>
                  <Ionicons name={category.icon} size={22} color={category.color} />
                </View>
                <Text style={[styles.categoryTitle, { color: colors.text }]}>{textFor(category.title, lang)}</Text>
                <Text style={[styles.categoryDescription, { color: colors.textMuted }]}>{textFor(category.description, lang)}</Text>
                <View style={styles.categoryAction}>
                  <Text style={[styles.categoryActionText, { color: category.color }]}>
                    {lang === "es" ? "Explorar" : lang === "fr" ? "Explorer" : lang === "en" ? "Explore" : "Esplora"}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={category.color} />
                </View>
              </TouchableOpacity>
            ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  intro: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 14,
  },
  providerMark: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  providerText: {
    fontSize: 11,
    fontWeight: "700",
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginBottom: 14,
  },
  primaryText: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "900",
  },
  sectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryCard: {
    width: "48.4%",
    minHeight: 190,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  curatedCard: {
    minHeight: 150,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  categoryDescription: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  categoryAction: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 9,
  },
  categoryActionText: {
    fontSize: 11,
    fontWeight: "900",
  },
});
