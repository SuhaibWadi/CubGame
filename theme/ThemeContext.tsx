import React, { createContext, ReactNode, useContext, useState } from "react";
import { useColorScheme } from "react-native";

export const Colors = {
  light: {
    background: "#FFFFFF",
    text: "#000000",
    primary: "#007AFF",
  },
  dark: {
    background: "#121212",
    text: "#FFFFFF",
    primary: "#0A84FF",
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
