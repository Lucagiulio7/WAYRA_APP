jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

import { darkColors, lightColors } from "@/contexts/ThemeContext";

function luminance(hex: string): number {
  const normalized = hex.length === 4
    ? hex.slice(1).split("").map((value) => value + value)
    : hex.slice(1).match(/.{2}/g) ?? [];
  const [red, green, blue] = normalized.map((value) => {
    const channel = Number.parseInt(value, 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe("accessibility essentials", () => {
  it("mantiene leggibili i testi attenuati nei due temi", () => {
    expect(contrast(darkColors.textMuted, darkColors.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(lightColors.textMuted, lightColors.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(lightColors.accentGold, lightColors.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("descrive i comandi iconici principali", () => {
    const fs = require("fs");
    const path = require("path");
    const files = [
      "../app/index.tsx",
      "../app/itinerary.tsx",
      "../app/create-itinerary.tsx",
      "../components/DayCard.tsx",
      "../components/DayMap.tsx",
    ].map((file) => fs.readFileSync(path.join(__dirname, file), "utf8")).join("\n");

    expect(files).toContain('accessibilityRole="button"');
    expect(files).toContain('accessibilityRole="link"');
    expect(files).toContain("accessibilityState={{ selected: active }}");
    expect(files).toContain("hitSlop={6}");
  });
});
