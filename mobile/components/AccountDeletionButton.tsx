import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ColorPalette, useTheme } from "@/contexts/ThemeContext";
import { localText } from "@/i18n";

type Props = {
  onDeleted?: () => void;
};

export function AccountDeletionButton({ onDeleted }: Props) {
  const { user, deleteAccount } = useAuth();
  const { lang } = useLanguage();
  const { colors } = useTheme();
  const [deleting, setDeleting] = useState(false);
  const styles = makeStyles(colors);
  const tx = (values: Record<string, string>) => localText(lang, values);

  if (!user) return null;

  const runDeletion = async () => {
    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);

    if (error) {
      Alert.alert(
        tx({ it: "Cancellazione non riuscita", en: "Deletion failed", fr: "Échec de la suppression", es: "No se pudo eliminar" }),
        tx({ it: "Riprova tra poco. Se il problema continua, contatta privacy@wayra.app.", en: "Try again shortly. If the issue continues, contact privacy@wayra.app.", fr: "Réessayez dans un instant. Si le problème persiste, contactez privacy@wayra.app.", es: "Inténtalo de nuevo en unos instantes. Si el problema continúa, escribe a privacy@wayra.app." }),
      );
      return;
    }

    onDeleted?.();
    Alert.alert(
      tx({ it: "Account eliminato", en: "Account deleted", fr: "Compte supprimé", es: "Cuenta eliminada" }),
      tx({ it: "Il tuo account e gli itinerari sincronizzati sono stati eliminati.", en: "Your account and synced itineraries have been deleted.", fr: "Votre compte et vos itinéraires synchronisés ont été supprimés.", es: "Tu cuenta y los itinerarios sincronizados se han eliminado." }),
    );
  };

  const requestDeletion = () => {
    const title = tx({ it: "Elimina account", en: "Delete account", fr: "Supprimer le compte", es: "Eliminar cuenta" });
    const message = tx({
      it: "L'operazione è definitiva. Verranno eliminati l'account e gli itinerari sincronizzati associati.",
      en: "This action is permanent. Your account and associated synced itineraries will be deleted.",
      fr: "Cette action est définitive. Votre compte et les itinéraires synchronisés associés seront supprimés.",
      es: "Esta acción es permanente. Se eliminarán tu cuenta y los itinerarios sincronizados asociados.",
    });

    if (Platform.OS === "web") {
      if (window.confirm(`${title}\n\n${message}`)) void runDeletion();
      return;
    }

    Alert.alert(title, message, [
      { text: tx({ it: "Annulla", en: "Cancel", fr: "Annuler", es: "Cancelar" }), style: "cancel" },
      {
        text: tx({ it: "Elimina definitivamente", en: "Delete permanently", fr: "Supprimer définitivement", es: "Eliminar definitivamente" }),
        style: "destructive",
        onPress: () => void runDeletion(),
      },
    ]);
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={deleting}
      onPress={requestDeletion}
      activeOpacity={0.82}
      style={styles.button}
    >
      {deleting
        ? <ActivityIndicator color={colors.danger} size="small" />
        : <Ionicons name="trash-outline" size={18} color={colors.danger} />}
      <Text style={styles.text}>
        {deleting
          ? tx({ it: "Eliminazione in corso...", en: "Deleting...", fr: "Suppression...", es: "Eliminando..." })
          : tx({ it: "Elimina account", en: "Delete account", fr: "Supprimer le compte", es: "Eliminar cuenta" })}
      </Text>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ColorPalette) => StyleSheet.create({
  button: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.danger + "88",
    backgroundColor: colors.danger + "12",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
  },
  text: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
  },
});
