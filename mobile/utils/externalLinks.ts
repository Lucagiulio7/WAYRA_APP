import { Alert, Linking } from "react-native";

export type ExternalLinkFailure = "empty" | "unsafe" | "unsupported" | "failed";

export interface OpenExternalLinkOptions {
  fallbackUrl?: string | null;
  showAlert?: boolean;
  title?: string;
  message?: string;
}

const pending = new Map<string, Promise<boolean>>();
const ALLOWED_PROTOCOL = /^(https?:\/\/|tel:|mailto:)/i;

export function validateExternalUrl(value: unknown): ExternalLinkFailure | null {
  if (typeof value !== "string" || !value.trim()) return "empty";
  return ALLOWED_PROTOCOL.test(value.trim()) ? null : "unsafe";
}

function localizedError(lang: string): { title: string; message: string } {
  if (lang === "es") return { title: "Enlace no disponible", message: "Comprueba la conexión o inténtalo de nuevo más tarde." };
  if (lang === "fr") return { title: "Lien indisponible", message: "Vérifiez votre connexion ou réessayez plus tard." };
  if (lang === "en") return { title: "Link unavailable", message: "Check your connection or try again later." };
  return { title: "Link non disponibile", message: "Controlla la connessione o riprova più tardi." };
}

async function tryOpen(url: string): Promise<boolean> {
  try {
    if (!(await Linking.canOpenURL(url))) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Unico punto di apertura per link esterni. Valida il protocollo, evita doppi
 * tocchi concorrenti e prova il fallback web prima di mostrare un errore.
 */
export function openExternalLink(
  value: unknown,
  lang = "it",
  options: OpenExternalLinkOptions = {},
): Promise<boolean> {
  const primary = typeof value === "string" ? value.trim() : "";
  const fallback = typeof options.fallbackUrl === "string" ? options.fallbackUrl.trim() : "";
  const operationKey = `${primary}|${fallback}`;
  const existing = pending.get(operationKey);
  if (existing) return existing;

  const operation = (async () => {
    const candidates = [primary, fallback]
      .filter((url, index, values) => Boolean(url) && values.indexOf(url) === index)
      .filter((url) => validateExternalUrl(url) === null);

    for (const url of candidates) {
      if (await tryOpen(url)) return true;
    }

    if (options.showAlert !== false) {
      const copy = localizedError(lang);
      Alert.alert(options.title ?? copy.title, options.message ?? copy.message);
    }
    return false;
  })().finally(() => pending.delete(operationKey));

  pending.set(operationKey, operation);
  return operation;
}
