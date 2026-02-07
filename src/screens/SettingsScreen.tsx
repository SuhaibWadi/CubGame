import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ms, s, vs } from "../theme/Dimensions";
import { useTheme } from "../theme/ThemeContext";

export default function SettingsScreen() {
  const { theme, toggleTheme, isDark } = useTheme();

  const SettingItem = ({
    icon,
    label,
    rightElement,
    color = theme.primary,
  }: any) => (
    <View
      style={[
        styles.item,
        {
          backgroundColor: isDark
            ? "rgba(255,255,255,0.03)"
            : "rgba(0,0,0,0.02)",
        },
      ]}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconWrapper, { backgroundColor: color + "22" }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.itemLabel, { color: theme.text }]}>{label}</Text>
      </View>
      {rightElement}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: isDark ? "#444" : "#BBB" }]}
        >
          PREFERENCES
        </Text>
        <SettingItem
          icon="moon"
          label="Dark Universe"
          color="#5856D6"
          rightElement={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor={isDark ? "#FFF" : "#f4f3f4"}
            />
          }
        />
        <SettingItem
          icon="volume-high"
          label="Sound Effects"
          color="#FF9500"
          rightElement={
            <Switch
              value={true}
              trackColor={{ false: "#767577", true: theme.primary }}
            />
          }
        />
        <SettingItem
          icon="notifications"
          label="Battle Alerts"
          color="#34C759"
          rightElement={
            <Switch
              value={true}
              trackColor={{ false: "#767577", true: theme.primary }}
            />
          }
        />
      </View>

      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: isDark ? "#444" : "#BBB" }]}
        >
          SYSTEM
        </Text>
        <TouchableOpacity activeOpacity={0.7}>
          <SettingItem
            icon="shield-checkmark"
            label="Privacy Policy"
            color="#00C7BE"
            rightElement={
              <Ionicons name="chevron-forward" size={16} color="#888" />
            }
          />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7}>
          <SettingItem
            icon="document-text"
            label="Terms of Service"
            color="#8E8E93"
            rightElement={
              <Ionicons name="chevron-forward" size={16} color="#888" />
            }
          />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.versionText, { color: isDark ? "#333" : "#DDD" }]}>
          VERSION 1.0.0 (BETA)
        </Text>
        <Text style={[styles.footerText, { color: isDark ? "#333" : "#DDD" }]}>
          MADE WITH ❤️ BY SUHAIB WADI
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: s(24),
    paddingTop: vs(80),
  },
  section: {
    marginBottom: vs(32),
  },
  sectionTitle: {
    fontSize: ms(12),
    fontWeight: "900",
    marginBottom: vs(12),
    letterSpacing: 2,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: s(16),
    borderRadius: s(20),
    marginBottom: vs(8),
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    alignItems: "center",
    justifyContent: "center",
    marginRight: s(16),
  },
  itemLabel: {
    fontSize: ms(16),
    fontWeight: "700",
  },
  footer: {
    marginTop: vs(40),
    alignItems: "center",
  },
  versionText: {
    fontSize: ms(10),
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: vs(4),
  },
  footerText: {
    fontSize: ms(10),
    fontWeight: "800",
    letterSpacing: 1,
  },
});
