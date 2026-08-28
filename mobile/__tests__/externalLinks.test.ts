const canOpenURL = jest.fn();
const openURL = jest.fn();
const alert = jest.fn();

jest.mock("react-native", () => ({
  Linking: { canOpenURL, openURL },
  Alert: { alert },
}));

import { openExternalLink, validateExternalUrl } from "../utils/externalLinks";

beforeEach(() => {
  jest.clearAllMocks();
  canOpenURL.mockResolvedValue(true);
  openURL.mockResolvedValue(undefined);
});

describe("external links", () => {
  it("accetta soltanto protocolli esterni sicuri", () => {
    expect(validateExternalUrl("https://example.com")).toBeNull();
    expect(validateExternalUrl("tel:112")).toBeNull();
    expect(validateExternalUrl("mailto:support@example.com")).toBeNull();
    expect(validateExternalUrl("javascript:alert(1)")).toBe("unsafe");
    expect(validateExternalUrl(" ")).toBe("empty");
  });

  it("apre un link valido senza mostrare errori", async () => {
    await expect(openExternalLink("https://example.com", "it")).resolves.toBe(true);
    expect(openURL).toHaveBeenCalledWith("https://example.com");
    expect(alert).not.toHaveBeenCalled();
  });

  it("usa il fallback quando il collegamento principale non e supportato", async () => {
    canOpenURL.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    await expect(openExternalLink("tel:123", "en", { fallbackUrl: "https://example.com" })).resolves.toBe(true);

    expect(openURL).toHaveBeenCalledWith("https://example.com");
  });

  it("mostra un messaggio nella lingua scelta se nessun link si apre", async () => {
    canOpenURL.mockResolvedValue(false);

    await expect(openExternalLink("https://example.com", "fr")).resolves.toBe(false);

    expect(alert).toHaveBeenCalledWith("Lien indisponible", expect.stringContaining("connexion"));
  });

  it("riutilizza la stessa apertura durante due tocchi simultanei", async () => {
    let release: (value: boolean) => void = () => {};
    canOpenURL.mockReturnValue(new Promise((resolve) => { release = resolve; }));

    const first = openExternalLink("https://example.com", "it");
    const second = openExternalLink("https://example.com", "it");
    expect(first).toBe(second);
    release(true);
    await Promise.all([first, second]);

    expect(canOpenURL).toHaveBeenCalledTimes(1);
    expect(openURL).toHaveBeenCalledTimes(1);
  });
});
