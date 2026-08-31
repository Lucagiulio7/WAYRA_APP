import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

import { useTheme } from "@/contexts/ThemeContext";
import { localText } from "@/i18n";
import type { TripAccommodation } from "@/services/accommodationStorage";
import { cityLabel } from "@/utils/cityLabels";
import { openExternalLink } from "@/utils/externalLinks";
import { contextHelpOutline, type ContextHelpContent } from "@/components/ContextHelp";

type Props = {
  city: string;
  startDate?: string;
  lang: string;
  value: TripAccommodation | null;
  onSave: (value: TripAccommodation) => Promise<void> | void;
  onRemove: () => Promise<void> | void;
  helpActive?: boolean;
  onHelpRequest?: (content: ContextHelpContent) => void;
};

function mapsSearchUrl(accommodation: Pick<TripAccommodation, "name" | "address" | "city">, lang: string): string {
  const query = [accommodation.name, accommodation.address, cityLabel(accommodation.city, lang)].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function AccommodationCard({ city, startDate, lang, value, onSave, onRemove, helpActive = false, onHelpRequest }: Props) {
  const { colors } = useTheme();
  const tx = (values: Record<string, string>) => localText(lang, values);
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState(value?.name ?? "");
  const [address, setAddress] = useState(value?.address ?? "");
  const [saving, setSaving] = useState(false);
  const helpContent: ContextHelpContent = {
    icon: "home-outline",
    title: tx({ it: "Il mio alloggio", en: "My accommodation", fr: "Mon logement", es: "Mi alojamiento" }),
    body: tx({
      it: "Salva qui l'indirizzo dopo la prenotazione. Potrai visualizzarlo sulle mappe, partire dall'alloggio verso la prima tappa e ottenere il percorso di ritorno. Urveya lo conserva solo sul dispositivo; la verifica e l'apertura della mappa lo inviano al servizio cartografico scelto.",
      en: "Save the address here after booking. You can view it on maps, start from the accommodation toward the first stop, and get return directions. Urveya stores it only on this device; checking it or opening the map sends it to the selected map provider.",
      fr: "Enregistrez ici l'adresse après la réservation. Vous pourrez l'afficher sur les cartes, partir du logement vers la première étape et obtenir l'itinéraire de retour. Urveya la conserve uniquement sur cet appareil ; sa vérification ou l'ouverture de la carte l'envoie au fournisseur cartographique choisi.",
      es: "Guarda aquí la dirección después de reservar. Podrás verla en los mapas, salir desde el alojamiento hacia la primera parada y obtener la ruta de regreso. Urveya la guarda solo en este dispositivo; al verificarla o abrir el mapa se envía al proveedor cartográfico elegido.",
    }),
  };
  const runOrExplain = (action: () => void) => helpActive ? onHelpRequest?.(helpContent) : action();

  useEffect(() => {
    setName(value?.name ?? "");
    setAddress(value?.address ?? "");
  }, [value]);

  const close = () => {
    if (saving) return;
    setName(value?.name ?? "");
    setAddress(value?.address ?? "");
    setVisible(false);
  };

  const save = async () => {
    const cleanAddress = address.trim();
    if (!cleanAddress) {
      Alert.alert(
        tx({ it: "Indirizzo mancante", en: "Missing address", fr: "Adresse manquante", es: "Falta la dirección" }),
        tx({ it: "Inserisci l'indirizzo completo dell'alloggio.", en: "Enter the accommodation's full address.", fr: "Saisissez l'adresse complète du logement.", es: "Introduce la dirección completa del alojamiento." }),
      );
      return;
    }

    setSaving(true);
    let coordinates: { latitude: number; longitude: number } | null = null;
    try {
      if (Platform.OS === "android") {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") throw new Error("permission-denied");
      }
      if (Platform.OS === "ios" || Platform.OS === "android") {
        const results = await Location.geocodeAsync(`${cleanAddress}, ${cityLabel(city, lang)}`);
        const first = results[0];
        if (first && Number.isFinite(first.latitude) && Number.isFinite(first.longitude)) {
          coordinates = { latitude: first.latitude, longitude: first.longitude };
        }
      }
    } catch {
      coordinates = null;
    }

    try {
      await onSave({
        city,
        startDate,
        name: name.trim() || undefined,
        address: cleanAddress,
        ...(coordinates ?? {}),
        updatedAt: new Date().toISOString(),
      });
      setVisible(false);
    } catch {
      Alert.alert(
        tx({ it: "Salvataggio non riuscito", en: "Could not save", fr: "Enregistrement impossible", es: "No se pudo guardar" }),
        tx({ it: "Riprova tra poco.", en: "Please try again shortly.", fr: "Veuillez réessayer dans un instant.", es: "Vuelve a intentarlo en unos instantes." }),
      );
      return;
    } finally {
      setSaving(false);
    }

    if (!coordinates) {
      Alert.alert(
        tx({ it: "Indirizzo salvato", en: "Address saved", fr: "Adresse enregistrée", es: "Dirección guardada" }),
        tx({ it: "Non ho potuto posizionarlo con precisione sulla mappa. Puoi comunque usarlo come partenza su Maps.", en: "It could not be placed precisely on the map, but you can still use it as a starting point in Maps.", fr: "Le logement n'a pas pu être placé précisément sur la carte, mais l'adresse peut servir de point de départ dans Maps.", es: "No se pudo situar con precisión en el mapa, pero puedes usar la dirección como punto de partida en Maps." }),
      );
    }
  };

  const remove = () => {
    Alert.alert(
      tx({ it: "Rimuovere l'alloggio?", en: "Remove accommodation?", fr: "Supprimer le logement ?", es: "¿Eliminar el alojamiento?" }),
      tx({ it: "L'indirizzo verrà eliminato solo da questo dispositivo.", en: "The address will only be removed from this device.", fr: "L'adresse sera supprimée uniquement de cet appareil.", es: "La dirección solo se eliminará de este dispositivo." }),
      [
        { text: tx({ it: "Annulla", en: "Cancel", fr: "Annuler", es: "Cancelar" }), style: "cancel" },
        { text: tx({ it: "Rimuovi", en: "Remove", fr: "Supprimer", es: "Eliminar" }), style: "destructive", onPress: () => void onRemove() },
      ],
    );
  };

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: value ? colors.accentBlue + "88" : colors.border }, contextHelpOutline(helpActive, colors.accentGold)]}>
        <View style={[styles.iconBox, { backgroundColor: colors.accentBlue + "18", borderColor: colors.accentBlue + "55" }]}>
          <Ionicons name="home" size={22} color={colors.accentBlue} />
        </View>
        <View style={styles.main}>
          <Text style={[styles.title, { color: colors.text }]}>
            {value?.name || tx({ it: "Il mio alloggio", en: "My accommodation", fr: "Mon logement", es: "Mi alojamiento" })}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={value ? 2 : 3}>
            {value?.address || tx({ it: "Aggiungi l'indirizzo dopo la prenotazione per partire dall'alloggio e visualizzarlo sulle mappe.", en: "Add the address after booking to start routes from your accommodation and see it on maps.", fr: "Ajoutez l'adresse après la réservation pour partir du logement et l'afficher sur les cartes.", es: "Añade la dirección después de reservar para iniciar las rutas desde el alojamiento y verlo en los mapas." })}
          </Text>
          <View style={styles.actions}>
            {value ? (
              <TouchableOpacity onPress={() => runOrExplain(() => void openExternalLink(mapsSearchUrl(value, lang), lang))} style={[styles.secondaryButton, { borderColor: colors.border2 }]}>
                <Ionicons name="map-outline" size={15} color={colors.accentBlue} />
                <Text style={[styles.secondaryText, { color: colors.accentBlue }]}>{tx({ it: "Verifica", en: "Check", fr: "Vérifier", es: "Verificar" })}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={() => runOrExplain(() => setVisible(true))} style={[styles.primaryButton, { backgroundColor: colors.accentBlue }]}>
              <Ionicons name={value ? "pencil-outline" : "add-outline"} size={16} color={colors.bg} />
              <Text style={[styles.primaryText, { color: colors.bg }]}>{value ? tx({ it: "Modifica", en: "Edit", fr: "Modifier", es: "Editar" }) : tx({ it: "Aggiungi", en: "Add", fr: "Ajouter", es: "Añadir" })}</Text>
            </TouchableOpacity>
            {value ? (
              <TouchableOpacity onPress={() => runOrExplain(remove)} style={styles.deleteButton} accessibilityLabel={tx({ it: "Rimuovi alloggio", en: "Remove accommodation", fr: "Supprimer le logement", es: "Eliminar alojamiento" })}>
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <TouchableOpacity style={[styles.backdrop, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={close}>
          <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sheetHeader}>
              <Ionicons name="home-outline" size={22} color={colors.accentBlue} />
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{tx({ it: "Il mio alloggio", en: "My accommodation", fr: "Mon logement", es: "Mi alojamiento" })}</Text>
            </View>
            <Text style={[styles.label, { color: colors.textSub }]}>{tx({ it: "Nome facoltativo", en: "Optional name", fr: "Nom facultatif", es: "Nombre opcional" })}</Text>
            <TextInput value={name} onChangeText={setName} editable={!saving} placeholder={tx({ it: "Es. Hotel Roma", en: "E.g. Central Hotel", fr: "Ex. Hôtel Central", es: "Ej. Hotel Central" })} placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]} />
            <Text style={[styles.label, { color: colors.textSub }]}>{tx({ it: "Indirizzo completo", en: "Full address", fr: "Adresse complète", es: "Dirección completa" })}</Text>
            <TextInput value={address} onChangeText={setAddress} editable={!saving} autoCapitalize="words" placeholder={tx({ it: "Via, numero civico, quartiere", en: "Street, number, area", fr: "Rue, numéro, quartier", es: "Calle, número, barrio" })} placeholderTextColor={colors.textMuted} style={[styles.input, styles.addressInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]} multiline />
            <Text style={[styles.note, { color: colors.textMuted }]}>{tx({ it: "Urveya salva l'indirizzo sul telefono. Per verificarlo, lo invia con la città al servizio cartografico del dispositivo.", en: "Urveya stores the address on this phone. To check it, the address and city are sent to the device's map service.", fr: "Urveya enregistre l'adresse sur ce téléphone. Pour la vérifier, l'adresse et la ville sont envoyées au service cartographique de l'appareil.", es: "Urveya guarda la dirección en este teléfono. Para verificarla, la dirección y la ciudad se envían al servicio cartográfico del dispositivo." })}</Text>
            <View style={styles.sheetActions}>
              <TouchableOpacity onPress={close} disabled={saving} style={[styles.cancelButton, { borderColor: colors.border }]}><Text style={[styles.cancelText, { color: colors.textSub }]}>{tx({ it: "Annulla", en: "Cancel", fr: "Annuler", es: "Cancelar" })}</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => void save()} disabled={saving} style={[styles.saveButton, { backgroundColor: colors.accentBlue, opacity: saving ? 0.65 : 1 }]}>
                {saving ? <ActivityIndicator size="small" color={colors.bg} /> : <Ionicons name="checkmark" size={17} color={colors.bg} />}
                <Text style={[styles.saveText, { color: colors.bg }]}>{tx({ it: "Verifica e salva", en: "Check and save", fr: "Vérifier et enregistrer", es: "Verificar y guardar" })}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: 12, borderWidth: 1, borderRadius: 8, padding: 14, marginBottom: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  main: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: "900" },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 11 },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, minHeight: 36, borderRadius: 7, paddingHorizontal: 12 },
  primaryText: { fontSize: 12, fontWeight: "900" },
  secondaryButton: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 36, borderRadius: 7, borderWidth: 1, paddingHorizontal: 10 },
  secondaryText: { fontSize: 12, fontWeight: "800" },
  deleteButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  backdrop: { flex: 1, justifyContent: "center", padding: 18 },
  sheet: { borderWidth: 1, borderRadius: 12, padding: 18, maxWidth: 520, width: "100%", alignSelf: "center" },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 17 },
  sheetTitle: { fontSize: 19, fontWeight: "900" },
  label: { fontSize: 12, fontWeight: "800", marginBottom: 6, marginTop: 9 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 7, paddingHorizontal: 12, fontSize: 14 },
  addressInput: { minHeight: 72, paddingTop: 11, textAlignVertical: "top" },
  note: { fontSize: 11, lineHeight: 16, marginTop: 10 },
  sheetActions: { flexDirection: "row", justifyContent: "flex-end", gap: 9, marginTop: 18 },
  cancelButton: { minHeight: 42, borderWidth: 1, borderRadius: 7, justifyContent: "center", paddingHorizontal: 15 },
  cancelText: { fontSize: 13, fontWeight: "800" },
  saveButton: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 7, paddingHorizontal: 15 },
  saveText: { fontSize: 13, fontWeight: "900" },
});
