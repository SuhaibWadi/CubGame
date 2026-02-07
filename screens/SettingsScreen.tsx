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
import { useTheme } from "../theme/ThemeContext";

export default function SettingsScreen() {
  const { theme, toggleTheme, isDark } = useTheme();

  const SettingItem = ({ icon, label, rightElement }: any) => (
    <View
      style={[styles.item, { borderBottomColor: isDark ? "#333" : "#EEE" }]}
    >
      <View style={styles.itemLeft}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: isDark ? "#3A3A3C" : "#F2F2F7" },
          ]}
        >
          <Ionicons name={icon} size={20} color={theme.primary} />
        </View>
        <Text style={[styles.itemLabel, { color: theme.text }]}>{label}</Text>
      </View>
      {rightElement}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: isDark ? "#888" : "#666" }]}
        >
          APPEARANCE
        </Text>
        <SettingItem
          icon="moon"
          label="Dark Mode"
          rightElement={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor={isDark ? "#FFF" : "#f4f3f4"}
            />
          }
        />
      </View>

      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: isDark ? "#888" : "#666" }]}
        >
          GAME SETTINGS
        </Text>
        <SettingItem
          icon="notifications"
          label="Push Notifications"
          rightElement={
            <Switch
              value={true}
              trackColor={{ false: "#767577", true: theme.primary }}
            />
          }
        />
        <SettingItem
          icon="volume-high"
          label="Sound Effects"
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
          style={[styles.sectionTitle, { color: isDark ? "#888" : "#666" }]}
        >
          ABOUT
        </Text>
        <TouchableOpacity>
          <SettingItem
            icon="information-circle"
            label="Version"
            rightElement={<Text style={{ color: "#888" }}>1.0.0</Text>}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <SettingItem
            icon="help-circle"
            label="Support"
            rightElement={
              <Ionicons name="chevron-forward" size={18} color="#888" />
            }
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 25,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 8,
    textTransform: "uppercase",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 17,
    fontWeight: "400",
  },
});
