"""Deterministic fallbacks for practical information missing from old records."""

from __future__ import annotations

import re
import unicodedata
from copy import deepcopy
from typing import Any


CITY_FALLBACKS: dict[str, dict[str, dict[str, Any]]] = {
    "muğla": {
        "fr": {
            "currency": "Livre turque (₺)",
            "language": "Turc",
            "english_note": "L'anglais est parlé dans les hébergements et restaurants des stations touristiques comme Bodrum, Marmaris et Fethiye. Il reste rare dans la ville de Muğla et les zones rurales.",
            "water": "L'eau du robinet n'est pas potable. Buvez uniquement de l'eau en bouteille, disponible partout à bas prix.",
            "tipping": "Le pourboire est apprécié : 10 à 15 % au restaurant et un arrondi pour les taxis et services. Il est moins courant dans les complexes tout compris, mais toujours bienvenu.",
            "quick_tips": [
                "Changez votre argent dans les bureaux döviz bürosu des centres-villes plutôt qu'à l'aéroport ou à l'hôtel.",
                "Les dolmuş, minibus partagés, sont le moyen le moins cher et le plus pittoresque de circuler entre les plages.",
                "Les plages publiques sont gratuites mais souvent fréquentées ; celles des hôtels sont mieux aménagées mais payantes.",
                "En été, la chaleur peut être intense : visitez le matin et reposez-vous aux heures les plus chaudes.",
                "Bodrum, Marmaris et Fethiye sont facilement accessibles depuis Muğla en autobus ou en dolmuş.",
            ],
        },
        "es": {
            "currency": "Lira turca (₺)",
            "language": "Turco",
            "english_note": "Se habla inglés en alojamientos y restaurantes de los destinos turísticos, como Bodrum, Marmaris y Fethiye. En la ciudad de Muğla y en las zonas rurales es poco frecuente.",
            "water": "El agua del grifo no es potable. Bebe únicamente agua embotellada, disponible en todas partes a precios bajos.",
            "tipping": "La propina se agradece: un 10-15 % en restaurantes y redondear la cuenta en taxis y servicios.",
            "quick_tips": [
                "Cambia dinero en las oficinas döviz bürosu de los centros urbanos y evita el aeropuerto y los hoteles.",
                "Los dolmuş, minibuses compartidos, son la forma más económica y pintoresca de moverse entre las playas.",
                "Las playas públicas son gratuitas pero suelen estar concurridas; las de los hoteles están mejor cuidadas, pero son de pago.",
                "En verano el calor puede ser intenso: visita las atracciones por la mañana y descansa durante las horas centrales.",
                "Bodrum, Marmaris y Fethiye se alcanzan fácilmente desde Muğla en autobús o dolmuş.",
            ],
        },
    },
}

EMERGENCY_LABELS = {
    "fr": {
        "emergenze generali": "Urgences générales", "emergenze": "Urgences",
        "emergenze alternativo": "Urgences (numéro alternatif)", "polizia": "Police",
        "polizia non urgente": "Police (hors urgence)", "ambulanza": "Ambulance",
        "ambulanza samu": "Ambulance (SAMU)", "vigili del fuoco": "Pompiers",
        "guardia costiera": "Garde côtière", "pronto soccorso non urgente": "Assistance médicale (hors urgence)",
        "garda siochana polizia": "Garda Síochána (police)",
    },
    "es": {
        "emergenze generali": "Emergencias generales", "emergenze": "Emergencias",
        "emergenze alternativo": "Emergencias (número alternativo)", "polizia": "Policía",
        "polizia non urgente": "Policía (no urgente)", "ambulanza": "Ambulancia",
        "ambulanza samu": "Ambulancia (SAMU)", "vigili del fuoco": "Bomberos",
        "guardia costiera": "Guardia costera", "pronto soccorso non urgente": "Asistencia médica (no urgente)",
        "garda siochana polizia": "Garda Síochána (policía)",
    },
}


def _key(value: Any) -> str:
    text = unicodedata.normalize("NFKD", str(value or "").casefold())
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def _translate_timezone(value: str, language: str) -> str:
    translations = {
        "en": (("la Turchia non adotta l'ora legale", "Turkey does not observe daylight saving time"), ("nessun orario legale", "no daylight saving time"), ("ora legale", "daylight saving time")),
        "fr": (("la Turchia non adotta l'ora legale", "la Turquie n'applique pas l'heure d'été"), ("nessun orario legale", "sans heure d'été"), ("ora legale", "heure d'été")),
        "es": (("la Turchia non adotta l'ora legale", "Turquía no aplica el horario de verano"), ("nessun orario legale", "sin horario de verano"), ("ora legale", "horario de verano")),
    }
    for source, target in translations.get(language, ()):
        value = value.replace(source, target)
    return value


def _translate_voltage(value: str, language: str) -> str:
    translations = {
        "en": (("presa tipo", "plug type"), ("prese tipo", "plug types"), ("standard europeo", "European standard"), ("standard francese", "French standard"), ("standard italiano", "Italian standard"), ("britannica", "British"), ("identica al UK", "same as the UK"), ("compatibile", "compatible"), ("porta un adattatore", "bring an adapter"), ("Serve adattatore dall'Europa", "an adapter from continental Europe is required"), ("3 pin rettangolari", "3 rectangular pins"), ("danese", "Danish")),
        "fr": (("presa tipo", "prise de type"), ("prese tipo", "prises de type"), ("standard europeo", "standard européen"), ("standard francese", "standard français"), ("standard italiano", "standard italien"), ("britannica", "britannique"), ("identica al UK", "identique au Royaume-Uni"), ("compatibile", "compatible"), ("porta un adattatore", "prévoyez un adaptateur"), ("Serve adattatore dall'Europa", "un adaptateur depuis l'Europe continentale est nécessaire"), ("3 pin rettangolari", "3 broches rectangulaires"), ("danese", "danois")),
        "es": (("presa tipo", "enchufe tipo"), ("prese tipo", "enchufes tipo"), ("standard europeo", "estándar europeo"), ("standard francese", "estándar francés"), ("standard italiano", "estándar italiano"), ("britannica", "británico"), ("identica al UK", "idéntico al del Reino Unido"), ("compatibile", "compatible"), ("porta un adattatore", "lleva un adaptador"), ("Serve adattatore dall'Europa", "se necesita un adaptador desde Europa continental"), ("3 pin rettangolari", "3 clavijas rectangulares"), ("danese", "danés")),
    }
    for source, target in translations.get(language, ()):
        value = value.replace(source, target)
    return value


def _modes(description: str, language: str) -> str:
    labels = {
        "fr": (("metro", "métro"), ("tram", "tramways"), ("bus", "autobus"), ("train", "trains"), ("ferr", "ferries"), ("funicular", "funiculaire"), ("bike", "vélos"), ("scooter", "trottinettes")),
        "es": (("metro", "metro"), ("tram", "tranvías"), ("bus", "autobuses"), ("train", "trenes"), ("ferr", "ferris"), ("funicular", "funicular"), ("bike", "bicicletas"), ("scooter", "patinetes")),
    }
    found = [label for token, label in labels.get(language, ()) if token in description.casefold()]
    if not found:
        return "transports publics" if language == "fr" else "transporte público"
    if len(found) == 1:
        return found[0]
    conjunction = " et " if language == "fr" else " y "
    return ", ".join(found[:-1]) + conjunction + found[-1]


def app_description(item: dict[str, Any], language: str) -> str | None:
    source = str(item.get("description_en") or item.get("description") or "").strip()
    lower = source.casefold()
    if not source:
        return None
    modes = _modes(source, language)
    details = " ".join(re.findall(r"\([^)]{2,}\)", source))
    if language == "fr":
        if "menus and signs" in lower:
            return "Utile pour traduire les menus et panneaux, notamment hors des zones les plus touristiques."
        if "wind and waves" in lower:
            return "Indispensable pour les activités en mer : vérifiez le vent et les vagues avant une sortie en bateau."
        if "communicating with guides" in lower:
            return "Indispensable pour communiquer avec les guides, riads et organisateurs d'excursions."
        if any(word in lower for word in ("taxi", "private hire", "vtc", "drivers")):
            return "Réservation de taxis ou VTC avec prix transparents et suivi du trajet."
        if any(word in lower for word in ("bike rental", "bike sharing", "dockless", "electric scooters", "e-scooters")):
            return f"Location et repérage de {modes} partagés pour les déplacements urbains."
        if any(word in lower for word in ("navigation", "place search", "route planning")):
            extras = " avec cartes hors ligne" if "offline" in lower or "download" in lower else ""
            return f"Navigation et recherche d'itinéraires pour {modes}{extras}."
        if any(word in lower for word in ("train", "railjet", "ave high-speed")) and "official app" not in lower:
            return f"Horaires, itinéraires et billets ferroviaires, utiles aussi pour les excursions {details}.".replace("  ", " ")
        return f"Horaires et itinéraires pour {modes}, avec billets numériques lorsqu'ils sont disponibles {details}.".replace("  ", " ")
    if language == "es":
        if "menus and signs" in lower:
            return "Útil para traducir menús y carteles, especialmente fuera de las zonas más turísticas."
        if "wind and waves" in lower:
            return "Fundamental para actividades en el mar: consulta el viento y las olas antes de una excursión en barco."
        if any(word in lower for word in ("taxi", "private hire", "vtc", "drivers")):
            return "Reserva de taxis o VTC con precios transparentes y seguimiento del trayecto."
        if any(word in lower for word in ("navigation", "place search", "route planning")):
            return f"Navegación y búsqueda de rutas para {modes}."
        if any(word in lower for word in ("train", "railjet", "ave high-speed")):
            return f"Horarios, rutas y billetes de tren, útiles también para excursiones {details}.".replace("  ", " ")
        return f"Horarios y rutas para {modes}, con billetes digitales cuando estén disponibles {details}.".replace("  ", " ")
    return None


def practical_fallbacks(city: str, item: dict[str, Any], language: str) -> tuple[dict[str, Any], dict[str, list[dict[str, Any]]]]:
    current = item.get("translations", {}).get(language, {})
    scalar = deepcopy(CITY_FALLBACKS.get(city.lower(), {}).get(language, {}))
    if not current.get("timezone") and item.get("timezone"):
        scalar["timezone"] = _translate_timezone(str(item["timezone"]), language)
    if not current.get("voltage") and item.get("voltage"):
        scalar["voltage"] = _translate_voltage(str(item["voltage"]), language)

    nested: dict[str, list[dict[str, Any]]] = {}
    for field in ("emergency_numbers", "transport_apps", "useful_apps"):
        records = []
        for nested_item in item.get(field, []):
            translation = nested_item.get("translations", {}).get(language, {}) if isinstance(nested_item, dict) else {}
            fallback: dict[str, Any] = {}
            if field == "emergency_numbers" and not translation.get("label"):
                label = EMERGENCY_LABELS.get(language, {}).get(_key(nested_item.get("label")))
                if label:
                    fallback["label"] = label
            elif field != "emergency_numbers" and not translation.get("description"):
                description = app_description(nested_item, language)
                if description:
                    fallback["description"] = description
            records.append(fallback)
        nested[field] = records
    return scalar, nested
