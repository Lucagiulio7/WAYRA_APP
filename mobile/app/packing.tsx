import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { localText } from "@/i18n";
import { ContextHelpUI, contextHelpOutline, useContextHelpController, type ContextHelpContent } from "@/components/ContextHelp";
import { useFirstVisitGuide } from "@/hooks/useFirstVisitGuide";
import {
  generatePackingItems,
  getPackingProfile,
  normalizePackingDays,
  packingProgress,
  packingProfileKey,
  PackingCategory,
  PackingClimate,
  PackingCollectionState,
  PackingItem,
  PackingListState,
  PackingTripType,
  upsertPackingProfile,
} from "@/utils/packingList";
import { readWithBackup, writeWithBackup } from "@/services/resilientStorage";

const STORAGE_KEY = "wayra_packing_lists_v2";
const BACKUP_STORAGE_KEY = "wayra_packing_lists_backup_v2";
const LEGACY_STORAGE_KEY = "wayra_packing_list_v1";
const CATEGORIES: PackingCategory[] = ["documents", "clothing", "toiletries", "health", "tech", "extras"];
const CLIMATES: PackingClimate[] = ["mild", "warm", "cold", "rainy"];
const TRIP_TYPES: PackingTripType[] = ["city", "beach", "nature", "business"];

const CATEGORY_ICONS: Record<PackingCategory, keyof typeof Ionicons.glyphMap> = {
  documents: "documents-outline",
  clothing: "shirt-outline",
  toiletries: "water-outline",
  health: "medkit-outline",
  tech: "phone-portrait-outline",
  extras: "bag-add-outline",
};

const CLIMATE_ICONS: Record<PackingClimate, keyof typeof Ionicons.glyphMap> = {
  mild: "partly-sunny-outline",
  warm: "sunny-outline",
  cold: "snow-outline",
  rainy: "rainy-outline",
};

const TRIP_ICONS: Record<PackingTripType, keyof typeof Ionicons.glyphMap> = {
  city: "business-outline",
  beach: "umbrella-outline",
  nature: "leaf-outline",
  business: "briefcase-outline",
};

const ITEM_LABELS: Record<string, Record<string, string>> = {
  identityDocument: { it: "Documento d'identità", en: "Identity document", fr: "Pièce d'identité", es: "Documento de identidad" },
  tickets: { it: "Biglietti e prenotazioni", en: "Tickets and bookings", fr: "Billets et réservations", es: "Billetes y reservas" },
  wallet: { it: "Portafoglio e carte", en: "Wallet and cards", fr: "Portefeuille et cartes", es: "Cartera y tarjetas" },
  insurance: { it: "Assicurazione e contatti utili", en: "Insurance and useful contacts", fr: "Assurance et contacts utiles", es: "Seguro y contactos útiles" },
  healthCard: { it: "Tessera sanitaria", en: "Health insurance card", fr: "Carte d’assurance maladie", es: "Tarjeta sanitaria" },
  underwear: { it: "Biancheria intima", en: "Underwear", fr: "Sous-vêtements", es: "Ropa interior" },
  socks: { it: "Calze", en: "Socks", fr: "Chaussettes", es: "Calcetines" },
  tops: { it: "Maglie", en: "Tops", fr: "Hauts", es: "Camisetas" },
  bottoms: { it: "Pantaloni o gonne", en: "Trousers or skirts", fr: "Pantalons ou jupes", es: "Pantalones o faldas" },
  sleepwear: { it: "Pigiama", en: "Sleepwear", fr: "Pyjama", es: "Pijama" },
  comfortableShoes: { it: "Scarpe comode", en: "Comfortable shoes", fr: "Chaussures confortables", es: "Calzado cómodo" },
  lightJacket: { it: "Giacca leggera", en: "Light jacket", fr: "Veste légère", es: "Chaqueta ligera" },
  rainJacket: { it: "Giacca impermeabile", en: "Rain jacket", fr: "Veste imperméable", es: "Chaqueta impermeable" },
  warmCoat: { it: "Cappotto caldo", en: "Warm coat", fr: "Manteau chaud", es: "Abrigo cálido" },
  sweaters: { it: "Maglioni", en: "Sweaters", fr: "Pulls", es: "Jerséis" },
  thermalLayers: { it: "Completi termici", en: "Thermal base-layer sets", fr: "Ensembles de sous-vêtements thermiques", es: "Conjuntos de ropa térmica" },
  scarfGloves: { it: "Sciarpa, guanti e berretto", en: "Scarf, gloves and hat", fr: "Écharpe, gants et bonnet", es: "Bufanda, guantes y gorro" },
  sunHat: { it: "Cappello da sole", en: "Sun hat", fr: "Chapeau de soleil", es: "Sombrero para el sol" },
  swimwear: { it: "Costumi da bagno", en: "Swimwear", fr: "Maillots de bain", es: "Bañadores" },
  flipFlops: { it: "Ciabatte", en: "Flip-flops", fr: "Tongs", es: "Chanclas" },
  formalOutfit: { it: "Completo elegante", en: "Formal outfit", fr: "Tenue habillée", es: "Conjunto formal" },
  toothbrush: { it: "Spazzolino", en: "Toothbrush", fr: "Brosse à dents", es: "Cepillo de dientes" },
  toothpaste: { it: "Dentifricio", en: "Toothpaste", fr: "Dentifrice", es: "Pasta de dientes" },
  deodorant: { it: "Deodorante", en: "Deodorant", fr: "Déodorant", es: "Desodorante" },
  shampoo: { it: "Shampoo", en: "Shampoo", fr: "Shampooing", es: "Champú" },
  showerGel: { it: "Bagnoschiuma", en: "Shower gel", fr: "Gel douche", es: "Gel de ducha" },
  conditioner: { it: "Balsamo per capelli", en: "Hair conditioner", fr: "Après-shampooing", es: "Acondicionador" },
  hairbrush: { it: "Spazzola o pettine", en: "Hairbrush or comb", fr: "Brosse ou peigne", es: "Cepillo o peine" },
  razor: { it: "Rasoio e prodotti per la rasatura", en: "Razor and shaving products", fr: "Rasoir et produits de rasage", es: "Maquinilla y productos de afeitado" },
  moisturizer: { it: "Crema idratante", en: "Moisturizer", fr: "Crème hydratante", es: "Crema hidratante" },
  medicines: { it: "Farmaci personali", en: "Personal medicines", fr: "Médicaments personnels", es: "Medicamentos personales" },
  plastersDisinfectant: { it: "Cerotti e disinfettante", en: "Plasters and disinfectant", fr: "Pansements et désinfectant", es: "Tiritas y desinfectante" },
  painReliever: { it: "Antidolorifico o antipiretico", en: "Pain reliever or fever reducer", fr: "Antidouleur ou antipyrétique", es: "Analgésico o antipirético" },
  sunscreen: { it: "Protezione solare", en: "Sunscreen", fr: "Crème solaire", es: "Protector solar" },
  afterSun: { it: "Doposole", en: "After-sun lotion", fr: "Lait après-soleil", es: "Loción para después del sol" },
  phone: { it: "Telefono", en: "Phone", fr: "Téléphone", es: "Teléfono" },
  phoneCharger: { it: "Caricatore del telefono", en: "Phone charger", fr: "Chargeur de téléphone", es: "Cargador del teléfono" },
  powerBank: { it: "Power bank", en: "Power bank", fr: "Batterie externe", es: "Batería externa" },
  powerAdapter: { it: "Adattatore prese", en: "Power adapter", fr: "Adaptateur de prise", es: "Adaptador de enchufe" },
  headphones: { it: "Auricolari", en: "Headphones", fr: "Écouteurs", es: "Auriculares" },
  umbrella: { it: "Ombrello compatto", en: "Compact umbrella", fr: "Parapluie compact", es: "Paraguas compacto" },
  sunglasses: { it: "Occhiali da sole", en: "Sunglasses", fr: "Lunettes de soleil", es: "Gafas de sol" },
  waterBottle: { it: "Borraccia", en: "Water bottle", fr: "Gourde", es: "Botella reutilizable" },
  daypack: { it: "Zaino giornaliero", en: "Daypack", fr: "Sac à dos de journée", es: "Mochila de día" },
  beachTowel: { it: "Telo mare", en: "Beach towel", fr: "Serviette de plage", es: "Toalla de playa" },
  hikingShoes: { it: "Scarpe da trekking", en: "Hiking shoes", fr: "Chaussures de randonnée", es: "Calzado de senderismo" },
  insectRepellent: { it: "Repellente per insetti", en: "Insect repellent", fr: "Répulsif anti-insectes", es: "Repelente de insectos" },
  backpackRainCover: { it: "Copertura impermeabile per lo zaino", en: "Waterproof backpack cover", fr: "Housse imperméable pour sac à dos", es: "Funda impermeable para mochila" },
  laundryDetergent: { it: "Detersivo da viaggio per il bucato", en: "Travel laundry detergent", fr: "Lessive de voyage", es: "Detergente de viaje para la colada" },
  laundryBag: { it: "Sacca per la biancheria sporca", en: "Laundry bag", fr: "Sac à linge sale", es: "Bolsa para ropa sucia" },
  workDocuments: { it: "Documenti e materiale di lavoro", en: "Work documents and equipment", fr: "Documents et matériel de travail", es: "Documentos y material de trabajo" },
  laptop: { it: "Computer portatile", en: "Laptop", fr: "Ordinateur portable", es: "Ordenador portátil" },
  laptopCharger: { it: "Caricatore del computer", en: "Laptop charger", fr: "Chargeur de l’ordinateur", es: "Cargador del ordenador" },
};

function validState(value: unknown): value is PackingListState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PackingListState>;
  return Array.isArray(candidate.items) && typeof candidate.days === "number";
}

function validCollection(value: unknown): value is PackingCollectionState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PackingCollectionState>;
  return candidate.version === 2
    && typeof candidate.activeKey === "string"
    && Boolean(candidate.profiles)
    && typeof candidate.profiles === "object";
}

function decodeCollection(raw: string): PackingCollectionState | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return validCollection(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export default function PackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ days?: string }>();
  const { lang } = useLanguage();
  const { colors } = useTheme();
  const tx = (values: Record<string, string>) => localText(lang, values);

  const initialDays = normalizePackingDays(Number(params.days ?? 3));
  const [days, setDays] = useState(initialDays);
  const [climate, setClimate] = useState<PackingClimate>("mild");
  const [tripType, setTripType] = useState<PackingTripType>("city");
  const [items, setItems] = useState<PackingItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState<PackingCategory>("extras");
  const [collapsed, setCollapsed] = useState<Partial<Record<PackingCategory, boolean>>>({});
  const profilesRef = useRef<Record<string, PackingListState>>({});
  const contextHelp = useContextHelpController();

  useEffect(() => {
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      readWithBackup(STORAGE_KEY, BACKUP_STORAGE_KEY, decodeCollection)
      .then(async (parsed) => {
        if (cancelled) return;
        if (parsed) {
          const profile = parsed.profiles[parsed.activeKey] ?? Object.values(parsed.profiles)[0];
          if (profile && validState(profile)) {
            if (cancelled) return;
            profilesRef.current = parsed.profiles;
            setDays(normalizePackingDays(profile.days));
            setClimate(profile.climate ?? "mild");
            setTripType(profile.tripType ?? "city");
            setItems(profile.items);
            return;
          }
        }

        const legacyRaw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
        if (cancelled) return;
        if (legacyRaw) {
          const legacy: unknown = JSON.parse(legacyRaw);
          if (validState(legacy)) {
            if (cancelled) return;
            const legacyDays = normalizePackingDays(legacy.days);
            const legacyClimate = legacy.climate ?? "mild";
            const legacyTripType = legacy.tripType ?? "city";
            const migratedItems = generatePackingItems(legacyDays, legacyClimate, legacyTripType, legacy.items);
            const key = packingProfileKey(legacyDays, legacyClimate, legacyTripType);
            profilesRef.current = {
              [key]: {
                days: legacyDays,
                climate: legacyClimate,
                tripType: legacyTripType,
                items: migratedItems,
                updatedAt: new Date().toISOString(),
              },
            };
            setDays(legacyDays);
            setClimate(legacyClimate);
            setTripType(legacyTripType);
            setItems(migratedItems);
            return;
          }
        }
        setItems(generatePackingItems(initialDays, "mild", "city"));
      })
      .catch(() => {
        if (!cancelled) setItems(generatePackingItems(initialDays, "mild", "city"));
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const activeKey = packingProfileKey(days, climate, tripType);
    const state: PackingListState = {
      days,
      climate,
      tripType,
      items,
      updatedAt: new Date().toISOString(),
    };
    profilesRef.current = upsertPackingProfile(profilesRef.current, state);
    const collection: PackingCollectionState = {
      version: 2,
      activeKey,
      profiles: profilesRef.current,
      updatedAt: state.updatedAt,
    };
    void writeWithBackup(
      STORAGE_KEY,
      BACKUP_STORAGE_KEY,
      JSON.stringify(collection),
      decodeCollection,
    ).catch(() => {});
  }, [climate, days, hydrated, items, tripType]);

  const progress = useMemo(() => packingProgress(items), [items]);

  const labels = {
    title: tx({ it: "Valigia smart", en: "Smart packing", fr: "Valise intelligente", es: "Maleta inteligente" }),
    subtitle: tx({ it: "Tutto ciò che serve, senza dimenticare nulla.", en: "Everything you need, nothing forgotten.", fr: "Tout le nécessaire, sans rien oublier.", es: "Todo lo necesario, sin olvidar nada." }),
    duration: tx({ it: "Durata", en: "Duration", fr: "Durée", es: "Duración" }),
    day: tx({ it: days === 1 ? "giorno" : "giorni", en: days === 1 ? "day" : "days", fr: days === 1 ? "jour" : "jours", es: days === 1 ? "día" : "días" }),
    climate: tx({ it: "Clima previsto", en: "Expected weather", fr: "Climat prévu", es: "Clima previsto" }),
    trip: tx({ it: "Tipo di viaggio", en: "Trip type", fr: "Type de voyage", es: "Tipo de viaje" }),
    update: tx({ it: "Aggiorna i suggerimenti", en: "Update suggestions", fr: "Actualiser les suggestions", es: "Actualizar sugerencias" }),
    packed: tx({ it: "in valigia", en: "packed", fr: "rangés", es: "guardados" }),
    add: tx({ it: "Aggiungi", en: "Add", fr: "Ajouter", es: "Añadir" }),
    addPlaceholder: tx({ it: "Aggiungi qualcosa di tuo", en: "Add your own item", fr: "Ajouter un objet personnel", es: "Añade algo tuyo" }),
    clearChecks: tx({ it: "Azzera spunte", en: "Clear checks", fr: "Effacer les coches", es: "Borrar marcas" }),
    offline: tx({ it: "La lista si salva automaticamente sul telefono e funziona offline.", en: "The list is saved automatically on your phone and works offline.", fr: "La liste est enregistrée automatiquement sur le téléphone et fonctionne hors ligne.", es: "La lista se guarda automáticamente en el teléfono y funciona sin conexión." }),
  };

  const help = (icon: keyof typeof Ionicons.glyphMap, title: Record<string, string>, body: Record<string, string>): ContextHelpContent => ({
    icon,
    title: tx(title),
    body: tx(body),
  });
  const packingHelp = {
    back: help("arrow-back-outline", { it: "Indietro", en: "Back", fr: "Retour", es: "Atrás" }, { it: "Torna alla schermata principale. La lista resta salvata automaticamente sul telefono.", en: "Return to the main screen. Your list remains saved automatically on the phone.", fr: "Revenez à l'écran principal. La liste reste enregistrée automatiquement sur le téléphone.", es: "Vuelve a la pantalla principal. La lista permanece guardada automáticamente en el teléfono." }),
    progress: help("checkmark-done-outline", { it: "Avanzamento", en: "Progress", fr: "Progression", es: "Progreso" }, { it: "Mostra la percentuale di elementi già messi in valigia.", en: "Shows the percentage of items already packed.", fr: "Affiche le pourcentage d'objets déjà rangés.", es: "Muestra el porcentaje de objetos ya guardados." }),
    duration: help("calendar-outline", { it: "Durata", en: "Duration", fr: "Durée", es: "Duración" }, { it: "Ogni durata ha una valigia indipendente. Se l'hai già modificata viene ripristinata; altrimenti viene creata con quantità adatte ai giorni.", en: "Each duration has its own packing list. A previously edited list is restored; otherwise a new one is created with quantities suited to the trip length.", fr: "Chaque durée possède sa propre valise. Une liste déjà modifiée est restaurée ; sinon, une nouvelle liste est créée avec des quantités adaptées.", es: "Cada duración tiene su propia maleta. Si ya la modificaste, se restaura; de lo contrario, se crea una nueva con cantidades adecuadas." }),
    climate: help("partly-sunny-outline", { it: "Clima", en: "Weather", fr: "Climat", es: "Clima" }, { it: "Il clima fa parte della combinazione salvata. Cambiandolo apri la lista dedicata a quelle condizioni, senza perdere quella attuale.", en: "Weather is part of the saved combination. Changing it opens the list for those conditions without losing the current one.", fr: "Le climat fait partie de la combinaison enregistrée. Le modifier ouvre la liste correspondante sans perdre la liste actuelle.", es: "El clima forma parte de la combinación guardada. Al cambiarlo se abre su lista sin perder la actual." }),
    trip: help("briefcase-outline", { it: "Tipo di viaggio", en: "Trip type", fr: "Type de voyage", es: "Tipo de viaje" }, { it: "Città, mare, natura e lavoro conservano liste separate per la durata e il clima selezionati.", en: "City, beach, nature and business trips keep separate lists for the selected duration and weather.", fr: "Les voyages urbains, balnéaires, nature et professionnels conservent des listes distinctes selon la durée et le climat.", es: "Ciudad, playa, naturaleza y trabajo conservan listas separadas según la duración y el clima." }),
    update: help("sparkles-outline", { it: "Aggiorna suggerimenti", en: "Update suggestions", fr: "Actualiser les suggestions", es: "Actualizar sugerencias" }, { it: "Ripristina elementi e quantità consigliati solo per la combinazione attuale, mantenendo gli elementi personali e le spunte compatibili.", en: "Restores suggested items and quantities only for the current combination while keeping custom items and compatible checks.", fr: "Restaure les objets et quantités conseillés uniquement pour la combinaison actuelle, en conservant les objets personnels et les coches compatibles.", es: "Restaura los elementos y cantidades sugeridos solo para la combinación actual, manteniendo los objetos personales y las marcas compatibles." }),
    checklist: help("checkbox-outline", { it: "Lista", en: "Checklist", fr: "Liste", es: "Lista" }, { it: "Tocca un elemento per segnarlo, usa più e meno per la quantità e il cestino per eliminarlo.", en: "Tap an item to check it, use plus and minus for quantity, and the bin to remove it.", fr: "Touchez un objet pour le cocher, utilisez plus et moins pour la quantité et la corbeille pour le supprimer.", es: "Toca un objeto para marcarlo, usa más y menos para la cantidad y la papelera para eliminarlo." }),
    reset: help("refresh-outline", { it: "Azzera spunte", en: "Clear checks", fr: "Effacer les coches", es: "Borrar marcas" }, { it: "Deseleziona tutti gli elementi, mantenendo intatta la lista.", en: "Unchecks every item while keeping the list unchanged.", fr: "Décoche tous les objets sans modifier la liste.", es: "Desmarca todos los objetos sin cambiar la lista." }),
    add: help("add-circle-outline", { it: "Elemento personale", en: "Custom item", fr: "Objet personnel", es: "Objeto personal" }, { it: "Scegli una categoria, scrivi ciò che vuoi aggiungere e premi Aggiungi.", en: "Choose a category, type the item and press Add.", fr: "Choisissez une catégorie, saisissez l'objet puis appuyez sur Ajouter.", es: "Elige una categoría, escribe el objeto y pulsa Añadir." }),
  };
  const firstVisitGuide = useFirstVisitGuide({
    guideId: "packing-v1",
    controller: contextHelp,
    enabled: hydrated,
    steps: [
      { content: packingHelp.duration },
      { content: packingHelp.climate },
      { content: packingHelp.trip },
      { content: packingHelp.update },
      { content: packingHelp.checklist },
      { content: packingHelp.add },
      { content: packingHelp.progress },
    ],
  });

  const categoryLabel = (category: PackingCategory) => localText(lang, {
    documents: { it: "Documenti", en: "Documents", fr: "Documents", es: "Documentos" },
    clothing: { it: "Abbigliamento", en: "Clothing", fr: "Vêtements", es: "Ropa" },
    toiletries: { it: "Igiene", en: "Toiletries", fr: "Hygiène", es: "Higiene" },
    health: { it: "Salute", en: "Health", fr: "Santé", es: "Salud" },
    tech: { it: "Tecnologia", en: "Technology", fr: "Technologie", es: "Tecnología" },
    extras: { it: "Extra", en: "Extras", fr: "Extras", es: "Extras" },
  }[category]);

  const climateLabel = (value: PackingClimate) => localText(lang, {
    mild: { it: "Mite", en: "Mild", fr: "Doux", es: "Templado" },
    warm: { it: "Caldo", en: "Warm", fr: "Chaud", es: "Cálido" },
    cold: { it: "Freddo", en: "Cold", fr: "Froid", es: "Frío" },
    rainy: { it: "Piovoso", en: "Rainy", fr: "Pluvieux", es: "Lluvioso" },
  }[value]);

  const tripLabel = (value: PackingTripType) => localText(lang, {
    city: { it: "Città", en: "City", fr: "Ville", es: "Ciudad" },
    beach: { it: "Mare", en: "Beach", fr: "Mer", es: "Playa" },
    nature: { it: "Natura", en: "Nature", fr: "Nature", es: "Naturaleza" },
    business: { it: "Lavoro", en: "Business", fr: "Travail", es: "Trabajo" },
  }[value]);

  const itemLabel = (item: PackingItem) => item.customLabel || localText(lang, ITEM_LABELS[item.key ?? ""] ?? { it: item.key ?? "", en: item.key ?? "", fr: item.key ?? "", es: item.key ?? "" });

  const switchPackingProfile = (
    nextDays: number,
    nextClimate: PackingClimate,
    nextTripType: PackingTripType,
  ) => {
    const now = new Date().toISOString();
    profilesRef.current = upsertPackingProfile(
      profilesRef.current,
      { days, climate, tripType, items, updatedAt: now },
    );

    const normalizedDays = normalizePackingDays(nextDays);
    const existing = getPackingProfile(profilesRef.current, normalizedDays, nextClimate, nextTripType);
    setDays(normalizedDays);
    setClimate(nextClimate);
    setTripType(nextTripType);
    setItems(existing?.items ?? generatePackingItems(normalizedDays, nextClimate, nextTripType));
  };

  const updateSuggestions = () => {
    setItems((current) => generatePackingItems(days, climate, tripType, current));
  };

  const addCustomItem = () => {
    const label = newItem.trim();
    if (!label) return;
    setItems((current) => [...current, {
      id: `custom:${Date.now()}`,
      category: newCategory,
      quantity: 1,
      checked: false,
      customLabel: label,
    }]);
    setNewItem("");
  };

  const resetChecks = () => {
    if (!items.some((item) => item.checked)) return;
    Alert.alert(
      labels.clearChecks,
      tx({ it: "Vuoi deselezionare tutti gli elementi?", en: "Do you want to uncheck every item?", fr: "Voulez-vous décocher tous les éléments ?", es: "¿Quieres desmarcar todos los elementos?" }),
      [
        { text: tx({ it: "Annulla", en: "Cancel", fr: "Annuler", es: "Cancelar" }), style: "cancel" },
        { text: tx({ it: "Azzera", en: "Clear", fr: "Effacer", es: "Borrar" }), style: "destructive", onPress: () => setItems((current) => current.map((item) => ({ ...item, checked: false }))) },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }, contextHelpOutline(contextHelp.active, colors.accentGold)]} onPress={contextHelp.guard(packingHelp.back, () => router.back())} accessibilityLabel={tx({ it: "Indietro", en: "Back", fr: "Retour", es: "Atrás" })}>
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>{labels.title}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>{labels.subtitle}</Text>
          </View>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.accentGold + "70" }]}
            onPress={firstVisitGuide.onHelpPress}
            accessibilityLabel={tx({ it: "Guida contestuale", en: "Context help", fr: "Aide contextuelle", es: "Ayuda contextual" })}
          >
            <Ionicons name={contextHelp.active ? "close" : "help-circle-outline"} size={22} color={colors.accentGold} />
          </TouchableOpacity>
          <TouchableOpacity onPress={contextHelp.guard(packingHelp.progress, () => {})} activeOpacity={1} style={[styles.progressBadge, { backgroundColor: colors.accentGreen + "18", borderColor: colors.accentGreen + "50" }, contextHelpOutline(contextHelp.active, colors.accentGold)]}>
            <Text style={[styles.progressBadgeText, { color: colors.accentGreen }]}>{progress.percentage}%</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.setup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.durationRow}>
              <View>
                <Text style={[styles.fieldLabel, { color: colors.textSub }]}>{labels.duration}</Text>
                <Text style={[styles.durationValue, { color: colors.text }]}>{days} {labels.day}</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity style={[styles.stepButton, { backgroundColor: colors.card2, borderColor: colors.border }, contextHelpOutline(contextHelp.active, colors.accentGold)]} onPress={contextHelp.guard(packingHelp.duration, () => switchPackingProfile(days - 1, climate, tripType))}>
                  <Ionicons name="remove" size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.stepButton, { backgroundColor: colors.card2, borderColor: colors.border }, contextHelpOutline(contextHelp.active, colors.accentGold)]} onPress={contextHelp.guard(packingHelp.duration, () => switchPackingProfile(days + 1, climate, tripType))}>
                  <Ionicons name="add" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSub }]}>{labels.climate}</Text>
            <View style={styles.optionGrid}>
              {CLIMATES.map((value) => {
                const active = value === climate;
                return (
                  <TouchableOpacity key={value} onPress={contextHelp.guard(packingHelp.climate, () => switchPackingProfile(days, value, tripType))} style={[styles.option, { backgroundColor: colors.card2, borderColor: colors.border }, active && { borderColor: colors.accentBlue, backgroundColor: colors.accentBlue + "16" }, contextHelpOutline(contextHelp.active, colors.accentGold)]}>
                    <Ionicons name={CLIMATE_ICONS[value]} size={18} color={active ? colors.accentBlue : colors.textMuted} />
                    <Text style={[styles.optionText, { color: active ? colors.accentBlue : colors.textSub }]}>{climateLabel(value)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSub, marginTop: 4 }]}>{labels.trip}</Text>
            <View style={styles.optionGrid}>
              {TRIP_TYPES.map((value) => {
                const active = value === tripType;
                return (
                  <TouchableOpacity key={value} onPress={contextHelp.guard(packingHelp.trip, () => switchPackingProfile(days, climate, value))} style={[styles.option, { backgroundColor: colors.card2, borderColor: colors.border }, active && { borderColor: colors.accentPurple, backgroundColor: colors.accentPurple + "16" }, contextHelpOutline(contextHelp.active, colors.accentGold)]}>
                    <Ionicons name={TRIP_ICONS[value]} size={18} color={active ? colors.accentPurple : colors.textMuted} />
                    <Text style={[styles.optionText, { color: active ? colors.accentPurple : colors.textSub }]}>{tripLabel(value)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={[styles.generateButton, { backgroundColor: colors.accentGold }, contextHelpOutline(contextHelp.active, colors.text)]} onPress={contextHelp.guard(packingHelp.update, updateSuggestions)}>
              <Ionicons name="sparkles-outline" size={18} color={colors.bg} />
              <Text style={[styles.generateText, { color: colors.bg }]}>{labels.update}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.listTitle, { color: colors.text }]}>{progress.checked}/{progress.total} {labels.packed}</Text>
              <View style={[styles.progressTrack, { backgroundColor: colors.card2 }]}>
                <View style={[styles.progressFill, { width: `${progress.percentage}%`, backgroundColor: colors.accentGreen }]} />
              </View>
            </View>
            <TouchableOpacity onPress={contextHelp.guard(packingHelp.reset, resetChecks)} style={[styles.clearButton, { borderColor: colors.border }, contextHelpOutline(contextHelp.active, colors.accentGold)]}>
              <Ionicons name="refresh-outline" size={15} color={colors.textMuted} />
              <Text style={[styles.clearText, { color: colors.textMuted }]}>{labels.clearChecks}</Text>
            </TouchableOpacity>
          </View>

          {CATEGORIES.map((category) => {
            const categoryItems = items.filter((item) => item.category === category);
            if (categoryItems.length === 0) return null;
            const categoryDone = categoryItems.filter((item) => item.checked).length;
            const isCollapsed = Boolean(collapsed[category]);
            return (
              <View key={category} style={[styles.category, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity style={styles.categoryHeader} onPress={contextHelp.guard(packingHelp.checklist, () => setCollapsed((value) => ({ ...value, [category]: !value[category] })))}>
                  <View style={[styles.categoryIcon, { backgroundColor: colors.accentGold + "18" }]}>
                    <Ionicons name={CATEGORY_ICONS[category]} size={19} color={colors.accentGold} />
                  </View>
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>{categoryLabel(category)}</Text>
                  <Text style={[styles.categoryCount, { color: categoryDone === categoryItems.length ? colors.accentGreen : colors.textMuted }]}>{categoryDone}/{categoryItems.length}</Text>
                  <Ionicons name={isCollapsed ? "chevron-down" : "chevron-up"} size={17} color={colors.textMuted} />
                </TouchableOpacity>
                {!isCollapsed && categoryItems.map((item, index) => (
                  <View key={item.id} style={[styles.itemRow, index > 0 && { borderTopColor: colors.border2, borderTopWidth: StyleSheet.hairlineWidth }]}>
                    <TouchableOpacity style={styles.itemMain} onPress={contextHelp.guard(packingHelp.checklist, () => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, checked: !entry.checked } : entry)))}>
                      <Ionicons name={item.checked ? "checkmark-circle" : "ellipse-outline"} size={23} color={item.checked ? colors.accentGreen : colors.textMuted} />
                      <Text style={[styles.itemText, { color: item.checked ? colors.textMuted : colors.text }, item.checked && styles.itemChecked]}>{itemLabel(item)}</Text>
                    </TouchableOpacity>
                    <View style={styles.quantity}>
                      <TouchableOpacity onPress={contextHelp.guard(packingHelp.checklist, () => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, quantity: Math.max(1, entry.quantity - 1) } : entry)))} style={styles.quantityButton}>
                        <Ionicons name="remove" size={14} color={colors.textMuted} />
                      </TouchableOpacity>
                      <Text style={[styles.quantityText, { color: colors.textSub }]}>{item.quantity}</Text>
                      <TouchableOpacity onPress={contextHelp.guard(packingHelp.checklist, () => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry)))} style={styles.quantityButton}>
                        <Ionicons name="add" size={14} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={contextHelp.guard(packingHelp.checklist, () => setItems((current) => current.filter((entry) => entry.id !== item.id)))} style={styles.deleteButton} accessibilityLabel={tx({ it: "Elimina", en: "Delete", fr: "Supprimer", es: "Eliminar" })}>
                      <Ionicons name="trash-outline" size={17} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })}

          <View style={[styles.addCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPicker}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity key={category} onPress={contextHelp.guard(packingHelp.add, () => setNewCategory(category))} style={[styles.categoryChip, { borderColor: colors.border }, newCategory === category && { borderColor: colors.accentGold, backgroundColor: colors.accentGold + "16" }, contextHelpOutline(contextHelp.active, colors.accentGold)]}>
                  <Ionicons name={CATEGORY_ICONS[category]} size={15} color={newCategory === category ? colors.accentGold : colors.textMuted} />
                  <Text style={[styles.categoryChipText, { color: newCategory === category ? colors.accentGold : colors.textMuted }]}>{categoryLabel(category)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={[styles.addRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <TextInput value={newItem} onChangeText={setNewItem} editable={!contextHelp.active} onPressIn={() => { if (contextHelp.active) contextHelp.explain(packingHelp.add); }} placeholder={labels.addPlaceholder} placeholderTextColor={colors.textMuted} style={[styles.addInput, { color: colors.text }]} returnKeyType="done" onSubmitEditing={addCustomItem} />
              <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.accentGreen }, contextHelpOutline(contextHelp.active, colors.accentGold)]} onPress={contextHelp.guard(packingHelp.add, addCustomItem)}>
                <Ionicons name="add" size={20} color={colors.bg} />
                <Text style={[styles.addButtonText, { color: colors.bg }]}>{labels.add}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.offlineNote}>
            <Ionicons name="phone-portrait-outline" size={15} color={colors.textMuted} />
            <Text style={[styles.offlineText, { color: colors.textMuted }]}>{labels.offline}</Text>
          </View>
        </ScrollView>
        <ContextHelpUI controller={contextHelp} lang={lang} guided={firstVisitGuide.guided} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { minHeight: 68, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: 11 },
  iconButton: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1, minWidth: 0 },
  title: { fontSize: 21, fontWeight: "900" },
  subtitle: { fontSize: 12, marginTop: 2 },
  progressBadge: { minWidth: 48, height: 34, paddingHorizontal: 9, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  progressBadgeText: { fontSize: 13, fontWeight: "900" },
  content: { padding: 14, paddingBottom: 34, gap: 12 },
  setup: { borderWidth: 1, borderRadius: 8, padding: 13, gap: 10 },
  fieldLabel: { fontSize: 12, fontWeight: "800" },
  durationRow: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  durationValue: { fontSize: 18, fontWeight: "900", marginTop: 3 },
  stepper: { flexDirection: "row", gap: 8 },
  stepButton: { width: 38, height: 38, borderRadius: 7, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  option: { width: "48.8%", minHeight: 40, borderWidth: 1, borderRadius: 7, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 7 },
  optionText: { fontSize: 12, fontWeight: "800", flexShrink: 1 },
  generateButton: { minHeight: 44, borderRadius: 7, marginTop: 3, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  generateText: { fontSize: 14, fontWeight: "900" },
  progressHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12, paddingHorizontal: 2 },
  listTitle: { fontSize: 16, fontWeight: "900" },
  progressTrack: { width: 150, height: 5, borderRadius: 3, overflow: "hidden", marginTop: 7 },
  progressFill: { height: "100%", borderRadius: 3 },
  clearButton: { minHeight: 34, borderRadius: 7, borderWidth: 1, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 5 },
  clearText: { fontSize: 11, fontWeight: "700" },
  category: { borderWidth: 1, borderRadius: 8, overflow: "hidden" },
  categoryHeader: { minHeight: 50, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 9 },
  categoryIcon: { width: 32, height: 32, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  categoryTitle: { flex: 1, fontSize: 14, fontWeight: "900" },
  categoryCount: { fontSize: 11, fontWeight: "900" },
  itemRow: { minHeight: 49, paddingLeft: 12, paddingRight: 7, flexDirection: "row", alignItems: "center" },
  itemMain: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 9 },
  itemText: { flex: 1, fontSize: 13, fontWeight: "600" },
  itemChecked: { textDecorationLine: "line-through" },
  quantity: { height: 30, minWidth: 70, borderRadius: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  quantityButton: { width: 23, height: 30, alignItems: "center", justifyContent: "center" },
  quantityText: { minWidth: 20, textAlign: "center", fontSize: 12, fontWeight: "900" },
  deleteButton: { width: 34, height: 38, alignItems: "center", justifyContent: "center" },
  addCard: { borderRadius: 8, borderWidth: 1, padding: 10, gap: 9 },
  categoryPicker: { gap: 6 },
  categoryChip: { minHeight: 31, borderRadius: 7, borderWidth: 1, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 5 },
  categoryChipText: { fontSize: 10, fontWeight: "800" },
  addRow: { minHeight: 44, borderRadius: 7, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingLeft: 10 },
  addInput: { flex: 1, fontSize: 13, paddingVertical: 0 },
  addButton: { height: 36, marginRight: 4, borderRadius: 6, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 4 },
  addButtonText: { fontSize: 12, fontWeight: "900" },
  offlineNote: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, paddingHorizontal: 12 },
  offlineText: { flexShrink: 1, textAlign: "center", fontSize: 11, lineHeight: 15 },
});
