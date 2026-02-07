import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

export default function TestScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>🧪 Test Screen</Text>
      <Text
        style={{
          color: theme.text,
          textAlign: "center",
          paddingHorizontal: 40,
        }}
      >
        This is a temporary screen for testing the tab navigation and theme
        persistence.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
});
