import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
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
  const [showPrivacy, setShowPrivacy] = React.useState(false);
  const [showTerms, setShowTerms] = React.useState(false);

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
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowPrivacy(true)}
        >
          <SettingItem
            icon="shield-checkmark"
            label="Privacy Policy"
            color="#00C7BE"
            rightElement={
              <Ionicons name="chevron-forward" size={16} color="#888" />
            }
          />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowTerms(true)}
        >
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

      <Modal
        animationType="fade"
        transparent={true}
        visible={showPrivacy}
        onRequestClose={() => setShowPrivacy(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Ionicons name="finger-print" size={50} color={theme.primary} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              TOP SECRET
            </Text>
            <Text style={[styles.modalText, { color: theme.text }]}>
              Do not share this app with anyone yet! 🤫{"\n"}
              We are still working on it.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowPrivacy(false)}
            >
              <Text style={styles.modalButtonText}>I PROMISE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showTerms}
        onRequestClose={() => setShowTerms(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Ionicons name="happy" size={50} color={theme.primary} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              TERMS OF FUN
            </Text>
            <Text style={[styles.modalText, { color: theme.text }]}>
              By using this app you agree that Suhaib is the coolest developer
              ever. 😎
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowTerms(false)}
            >
              <Text style={styles.modalButtonText}>AGREED 100%</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    padding: 30,
    borderRadius: 25,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 1,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
    marginBottom: 25,
    lineHeight: 24,
  },
  modalButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
  },
  modalButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
