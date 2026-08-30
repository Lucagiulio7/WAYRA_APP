import { Ionicons } from "@expo/vector-icons";
import { ContextHelpContent } from "@/components/ContextHelp";
import { localText } from "@/i18n";

type Copy = Record<string, string>;

export function homeContextHelp(lang: string): Record<string, ContextHelpContent> {
  const item = (
    icon: keyof typeof Ionicons.glyphMap,
    title: Copy,
    body: Copy,
    note?: Copy,
  ): ContextHelpContent => ({
    icon,
    title: localText(lang, title),
    body: localText(lang, body),
    note: note ? localText(lang, note) : undefined,
  });

  return {
    saved: item(
      "bookmark-outline",
      { it: "Itinerari salvati", en: "Saved itineraries", fr: "Itinéraires enregistrés", es: "Itinerarios guardados" },
      { it: "Apre i viaggi che hai salvato. Puoi riaprire un itinerario anche dopo aver chiuso l'app.", en: "Opens the trips you saved, so you can resume an itinerary after closing the app.", fr: "Ouvre les voyages enregistrés pour reprendre un itinéraire après avoir fermé l'application.", es: "Abre los viajes guardados para retomar un itinerario después de cerrar la aplicación." },
    ),
    brand: item(
      "contrast-outline",
      { it: "Tema dell'app", en: "App theme", fr: "Thème de l'application", es: "Tema de la aplicación" },
      { it: "Toccando URVEYA passi dal tema scuro a quello chiaro e viceversa. La scelta viene ricordata sul dispositivo.", en: "Tap URVEYA to switch between dark and light themes. Your choice is saved on the device.", fr: "Touchez URVEYA pour alterner entre les thèmes sombre et clair. Le choix est mémorisé sur l'appareil.", es: "Toca URVEYA para cambiar entre los temas oscuro y claro. La elección se guarda en el dispositivo." },
    ),
    settings: item(
      "settings-outline",
      { it: "Impostazioni", en: "Settings", fr: "Paramètres", es: "Configuración" },
      { it: "Qui puoi cambiare lingua e tema e gestire privacy, account e dati disponibili offline.", en: "Change language and theme, and manage privacy, account and offline data.", fr: "Modifiez la langue et le thème, puis gérez la confidentialité, le compte et les données hors ligne.", es: "Cambia el idioma y el tema, y gestiona la privacidad, la cuenta y los datos sin conexión." },
    ),
    cityList: item(
      "search-outline",
      { it: "Scegli dalla lista", en: "Choose from the list", fr: "Choisir dans la liste", es: "Elegir de la lista" },
      { it: "Apre tutte le destinazioni disponibili, raggruppate per Paese. Puoi cercare una città per nome e ritrovare le ultime selezionate.", en: "Opens every destination grouped by country. Search by city name or use your recent choices.", fr: "Ouvre toutes les destinations par pays. Recherchez une ville ou retrouvez vos choix récents.", es: "Abre todos los destinos agrupados por país. Busca una ciudad o usa tus elecciones recientes." },
    ),
    cityMap: item(
      "earth-outline",
      { it: "Scegli dalla mappa", en: "Choose from the map", fr: "Choisir sur la carte", es: "Elegir en el mapa" },
      { it: "Mostra le città disponibili su una mappa mondiale. Toccando un indicatore selezioni quella destinazione.", en: "Shows available cities on a world map. Tap a marker to select that destination.", fr: "Affiche les villes disponibles sur une carte du monde. Touchez un repère pour choisir la destination.", es: "Muestra las ciudades disponibles en un mapa mundial. Toca un marcador para elegir el destino." },
    ),
    days: item(
      "calendar-outline",
      { it: "Durata del viaggio", en: "Trip duration", fr: "Durée du voyage", es: "Duración del viaje" },
      { it: "Imposta quanti giorni deve coprire l'itinerario. Il numero scelto determina come le attrazioni vengono distribuite tra le giornate.", en: "Sets how many days the itinerary covers and how attractions are distributed across them.", fr: "Définit le nombre de jours et la répartition des attractions entre les journées.", es: "Define cuántos días cubre el itinerario y cómo se reparten las atracciones." },
      { it: "Esploratore può offrire anche 6 e 7 giorni.", en: "Explorer can also offer 6 and 7 days.", fr: "Explorateur peut aussi proposer 6 et 7 jours.", es: "Explorador también puede ofrecer 6 y 7 días." },
    ),
    iconic: item(
      "star-outline",
      { it: "Esperienza Iconico", en: "Iconic experience", fr: "Expérience Iconique", es: "Experiencia Icónica" },
      { it: "Dà priorità ai luoghi imperdibili e più rappresentativi della città, mantenendo il viaggio concentrato sui grandi classici.", en: "Prioritizes the city's unmissable and most representative sights.", fr: "Privilégie les lieux incontournables et les plus représentatifs de la ville.", es: "Prioriza los lugares imprescindibles y más representativos de la ciudad." },
    ),
    explorer: item(
      "compass-outline",
      { it: "Esperienza Esploratore", en: "Explorer experience", fr: "Expérience Explorateur", es: "Experiencia Explorador" },
      { it: "Combina gli imperdibili con luoghi ricercati e nascosti. È pensata per chi vuole conoscere più quartieri e sfumature della città.", en: "Combines must-sees with curated and hidden places for a broader view of the city.", fr: "Combine incontournables, lieux recherchés et endroits cachés pour découvrir davantage la ville.", es: "Combina imprescindibles con lugares seleccionados y ocultos para conocer mejor la ciudad." },
    ),
    relaxed: item(
      "leaf-outline",
      { it: "Ritmo rilassato", en: "Relaxed pace", fr: "Rythme détendu", es: "Ritmo relajado" },
      { it: "Limita la camminata stimata a circa 3 km al giorno e costruisce giornate più leggere.", en: "Targets about 3 km of walking per day and builds lighter days.", fr: "Vise environ 3 km de marche par jour et crée des journées plus légères.", es: "Limita la caminata a unos 3 km diarios y crea días más ligeros." },
    ),
    balanced: item(
      "walk-outline",
      { it: "Ritmo bilanciato", en: "Balanced pace", fr: "Rythme équilibré", es: "Ritmo equilibrado" },
      { it: "Usa fino a circa 5 km al giorno per bilanciare quantità di tappe, qualità dei luoghi e tempo libero.", en: "Uses up to about 5 km per day to balance stops, quality and free time.", fr: "Utilise jusqu'à environ 5 km par jour pour équilibrer étapes, qualité et temps libre.", es: "Usa hasta unos 5 km al día para equilibrar paradas, calidad y tiempo libre." },
    ),
    intense: item(
      "flash-outline",
      { it: "Ritmo intenso", en: "Intense pace", fr: "Rythme intense", es: "Ritmo intenso" },
      { it: "Consente fino a circa 7 km al giorno e favorisce giornate più dense quando le distanze lo permettono.", en: "Allows up to about 7 km per day and favors denser days when distances allow.", fr: "Autorise jusqu'à environ 7 km par jour et privilégie des journées plus denses.", es: "Permite hasta unos 7 km diarios y favorece días más completos." },
    ),
    generate: item(
      "sparkles-outline",
      { it: "Genera itinerario", en: "Generate itinerary", fr: "Générer l'itinéraire", es: "Generar itinerario" },
      { it: "Crea automaticamente le giornate usando destinazione, durata, esperienza e ritmo selezionati. Urveya distribuisce e ordina le tappe rispettando i vincoli del viaggio.", en: "Automatically builds the trip using the selected destination, duration, experience and pace.", fr: "Crée automatiquement le voyage selon la destination, la durée, l'expérience et le rythme choisis.", es: "Crea automáticamente el viaje según el destino, la duración, la experiencia y el ritmo elegidos." },
    ),
    create: item(
      "construct-outline",
      { it: "Crea itinerario manualmente", en: "Build manually", fr: "Créer manuellement", es: "Crear manualmente" },
      { it: "Apre l'editor manuale. Scegli personalmente le attrazioni e costruisci ogni giornata trascinando le tappe negli slot.", en: "Opens the manual editor so you can choose attractions and fill each day yourself.", fr: "Ouvre l'éditeur manuel pour choisir les attractions et remplir chaque journée.", es: "Abre el editor manual para elegir atracciones y completar cada día." },
    ),
    packing: item(
      "bag-handle-outline",
      { it: "Valigia smart", en: "Smart packing", fr: "Valise intelligente", es: "Maleta inteligente" },
      { it: "Apre una checklist offline personalizzata in base a durata, clima e tipo di viaggio. Puoi cambiare quantità e aggiungere elementi personali.", en: "Opens an offline checklist based on duration, weather and trip type.", fr: "Ouvre une liste hors ligne adaptée à la durée, au climat et au type de voyage.", es: "Abre una lista sin conexión adaptada a la duración, el clima y el tipo de viaje." },
    ),
  };
}
