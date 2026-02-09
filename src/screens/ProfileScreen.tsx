import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useGameStore } from "../store/gameStore";
import { ms, s, vs } from "../theme/Dimensions";
import { useTheme } from "../theme/ThemeContext";

import { AVATAR_LIST, AVATAR_MAP } from "../theme/Avatars";

export default function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const { profile, stats, updateProfile } = useGameStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [wipModalVisible, setWipModalVisible] = useState(false);
  const [tempName, setTempName] = useState(profile.name);

  useEffect(() => {
    if (modalVisible) {
      setTempName(profile.name);
    }
  }, [modalVisible, profile.name]);

  const StatItem = ({ label, value, icon, color }: any) => (
    <View
      style={[
        styles.statBox,
        { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFF" },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View>
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: isDark ? "#888" : "#666" }]}>
          {label}
        </Text>
      </View>
    </View>
  );

  const handleSaveProfile = (avatarKey?: string) => {
    updateProfile({
      name: tempName,
      avatar: avatarKey || profile.avatar,
    });
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[theme.primary, theme.secondary]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarBorder}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: "#FFF", overflow: "hidden" },
                  ]}
                >
                  {profile.avatar && AVATAR_MAP[profile.avatar] ? (
                    <Image
                      source={AVATAR_MAP[profile.avatar]}
                      style={styles.avatarImage}
                      contentFit="cover"
                    />
                  ) : (
                    <Ionicons name="person" size={50} color={theme.primary} />
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.editBadge}
                onPress={() => setModalVisible(true)}
              >
                <Ionicons name="pencil" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.userName}>{profile.name}</Text>
            <View
              style={[
                styles.rankBadge,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
            >
              <Ionicons name="flash" size={12} color="#FFD60A" />
              <Text style={styles.rankText}>CUB MASTER II</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            CAREER STATS
          </Text>
          <View style={styles.statsGrid}>
            <StatItem
              label="Total Wins"
              value={stats.wins.toString()}
              icon="trophy"
              color="#FF9500"
            />
            <StatItem
              label="Total Score"
              value={stats.totalScore.toLocaleString()}
              icon="star"
              color="#FF2D55"
            />
            <StatItem
              label="Games Played"
              value={stats.gamesPlayed.toString()}
              icon="game-controller"
              color="#5856D6"
            />
            <StatItem
              label="Win Rate"
              value={
                stats.gamesPlayed > 0
                  ? `${Math.round((stats.wins / stats.gamesPlayed) * 100)}%`
                  : "0%"
              }
              icon="trending-up"
              color="#34C759"
            />
          </View>

          <Text
            style={[styles.sectionTitle, { color: theme.text, marginTop: 30 }]}
          >
            RECENT ACHIEVEMENTS
          </Text>
          <View style={styles.achievementsScroll}>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: isDark ? "#1C1C1E" : "#FFF" },
              ]}
            >
              <View
                style={[
                  styles.achievementIcon,
                  { backgroundColor: "#FFD60A22" },
                ]}
              >
                <Ionicons name="medal" size={24} color="#FFD60A" />
              </View>
              <Text style={[styles.achievementName, { color: theme.text }]}>
                10 Wins
              </Text>
            </View>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: isDark ? "#1C1C1E" : "#FFF" },
              ]}
            >
              <View
                style={[
                  styles.achievementIcon,
                  { backgroundColor: "#5856D622" },
                ]}
              >
                <Ionicons name="flash" size={24} color="#5856D6" />
              </View>
              <Text style={[styles.achievementName, { color: theme.text }]}>
                Combo King
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.logoutButton,
              { borderColor: "#FF3B30", borderWidth: 1 },
            ]}
            onPress={() => setWipModalVisible(true)}
          >
            <Text style={styles.logoutText}>SIGN OUT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Avatar Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? "#121212" : "#FFF" },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                EDIT PROFILE
              </Text>
              <TouchableOpacity onPress={() => handleSaveProfile()}>
                <Text
                  style={{
                    color: theme.primary,
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  SAVE
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: isDark ? "#888" : "#666",
                  marginBottom: 5,
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                DISPLAY NAME
              </Text>
              <TextInput
                style={{
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "#F0F0F0",
                  padding: 15,
                  borderRadius: 15,
                  color: theme.text,
                  fontSize: 16,
                  fontWeight: "bold",
                }}
                value={tempName}
                onChangeText={setTempName}
                placeholder="Enter your name"
                placeholderTextColor="#999"
              />
            </View>

            <Text
              style={{
                color: isDark ? "#888" : "#666",
                marginBottom: 10,
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              CHOOSE AVATAR
            </Text>

            <View style={styles.avatarGrid}>
              {AVATAR_LIST.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.avatarOption,
                    profile.avatar === key && {
                      borderColor: theme.primary,
                      borderWidth: 3,
                    },
                  ]}
                  onPress={() => handleSaveProfile(key)}
                >
                  <Image
                    source={AVATAR_MAP[key]}
                    style={styles.optionImage}
                    contentFit="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Work In Progress Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={wipModalVisible}
        onRequestClose={() => setWipModalVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View
            style={[
              styles.wipContent,
              { backgroundColor: isDark ? "#1C1C1E" : "#FFF" },
            ]}
          >
            <View style={styles.wipIconContainer}>
              <Ionicons name="construct" size={40} color="#FF9500" />
            </View>
            <Text style={[styles.wipTitle, { color: theme.text }]}>
              Work in Progress
            </Text>
            <Text style={[styles.wipText, { color: isDark ? "#CCC" : "#666" }]}>
              We are still working on it! 🛠️
            </Text>
            <TouchableOpacity
              style={[styles.wipButton, { backgroundColor: theme.primary }]}
              onPress={() => setWipModalVisible(false)}
            >
              <Text style={styles.wipButtonText}>GOT IT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: vs(90),
    paddingBottom: vs(60),
    borderBottomLeftRadius: s(50),
    borderBottomRightRadius: s(50),
  },
  headerContent: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: vs(16),
  },
  avatarBorder: {
    padding: s(4),
    borderRadius: s(60),
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  avatar: {
    width: s(100),
    height: s(100),
    borderRadius: s(50),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#000",
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  userName: {
    fontSize: ms(28),
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: -0.5,
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: s(12),
    marginTop: vs(8),
  },
  rankText: {
    color: "#FFF",
    fontSize: ms(12),
    fontWeight: "800",
    marginLeft: s(4),
  },
  content: {
    padding: s(24),
  },
  sectionTitle: {
    fontSize: ms(14),
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: vs(16),
    opacity: 0.6,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s(12),
  },
  statBox: {
    width: s(165),
    flexDirection: "row",
    alignItems: "center",
    padding: s(16),
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  statIcon: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    alignItems: "center",
    justifyContent: "center",
    marginRight: s(12),
  },
  statValue: {
    fontSize: ms(18),
    fontWeight: "900",
  },
  statLabel: {
    fontSize: ms(11),
    fontWeight: "700",
    marginTop: vs(2),
  },
  achievementsScroll: {
    flexDirection: "row",
    gap: s(12),
  },
  achievementCard: {
    padding: s(16),
    borderRadius: s(20),
    alignItems: "center",
    width: s(120),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  achievementIcon: {
    width: s(50),
    height: s(50),
    borderRadius: s(25),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: vs(8),
  },
  achievementName: {
    fontSize: ms(12),
    fontWeight: "800",
    textAlign: "center",
  },
  logoutButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: s(40),
    borderTopRightRadius: s(40),
    padding: s(30),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(30),
  },
  modalTitle: {
    fontSize: ms(20),
    fontWeight: "900",
    letterSpacing: 1,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s(16),
    justifyContent: "center",
  },
  avatarOption: {
    width: s(95),
    aspectRatio: 1,
    borderRadius: s(20),
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionImage: {
    width: "100%",
    height: "100%",
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  wipContent: {
    width: "80%",
    padding: 30,
    borderRadius: 24,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  wipIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 149, 0, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  wipTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center",
  },
  wipText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  wipButton: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 20,
  },
  wipButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 1,
  },
});
