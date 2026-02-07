import React, { createContext, ReactNode, useContext, useState } from "react";
import { useColorScheme } from "react-native";

export const Colors = {
  light: {
    background: "#F0F2F5",
    text: "#1A1A1A",
    primary: "#FF2D55",
    secondary: "#5856D6",
    card: "rgba(255, 255, 255, 0.8)",
    accent: "#FF9500",
  },
  dark: {
    background: "#0A0A0B",
    text: "#FFFFFF",
    primary: "#FF2D55",
    secondary: "#5E5CE6",
    card: "rgba(28, 28, 30, 0.7)",
    accent: "#FFD60A",
  },
};

type ThemeType = typeof Colors.light;

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === "dark");

  const toggleTheme = () => setIsDark(!isDark);
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
