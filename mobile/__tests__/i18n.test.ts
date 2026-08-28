import { LANGUAGE_OPTIONS, isSupportedLang, localText, translations } from "@/i18n";
import { registeredCityLabel, registeredCountryLabel } from "@/data/cityRegistry";
import { translateAttractionType } from "@/utils/attractionType";

describe("Spanish localization", () => {
  it("registers Spanish as a supported language", () => {
    expect(isSupportedLang("es")).toBe(true);
    expect(LANGUAGE_OPTIONS.some((option) => option.code === "es" && option.flagIso === "es")).toBe(true);
    expect(translations.es.generate).toBe("Generar itinerario");
  });

  it("resolves Spanish UI text without falling back", () => {
    expect(localText("es", { it: "Mappa", en: "Map", fr: "Carte", es: "Mapa" })).toBe("Mapa");
  });

  it("localizes registry labels and attraction types", () => {
    expect(registeredCityLabel("londra", "es")).toBe("Londres");
    expect(registeredCountryLabel("de", "es")).toBe("Alemania");
    expect(translateAttractionType("chiesa", "es")).toBe("Iglesia");
  });
});
