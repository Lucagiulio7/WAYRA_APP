import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "wayra_theme";

export const darkColors = {
  bg: "#0f0f1e",
  card: "#161625",
  card2: "#1e1e30",
  border: "#2a2a42",
  border2: "#1e1e30",
  text: "#f0f0f0",
  textSub: "#888",
  textMuted: "#7c7c90",
  accentGold: "#e8c06a",
  accentGreen: "#6ee7b7",
  accentBlue: "#7eb8f7",
  accentPurple: "#a78bfa",
  danger: "#f87171",
  inputBg: "#161625",
  overlay: "#00000080",
};

export const lightColors = {
  bg: "#ecebe4",
  card: "#fbfaf5",
  card2: "#e2e0d8",
  border: "#b8b5c4",
  border2: "#c7c4d0",
  text: "#1a1928",
  textSub: "#4e4c5b",
  textMuted: "#666370",
  accentGold: "#856006",
  accentGreen: "#136b49",
  accentBlue: "#13558d",
  accentPurple: "#5533aa",
  danger: "#dc2626",
  inputBg: "#f7f5ee",
  overlay: "#00000060",
};

export type ColorPalette = typeof darkColors;

interface ThemeContextValue {
  colors: ColorPalette;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  isDark: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => { if (val === "light") setIsDark(false); })
      .catch((e) => { if (__DEV__) console.warn("[ThemeContext] AsyncStorage read failed:", e); });
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ colors: isDark ? darkColors : lightColors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
