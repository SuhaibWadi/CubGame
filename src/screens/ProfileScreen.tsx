import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useGameStore } from "../store/gameStore";
import { useTheme } from "../theme/ThemeContext";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const { profile, stats } = useGameStore();

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
                <View style={[styles.avatar, { backgroundColor: "#FFF" }]}>
                  <Ionicons name="person" size={50} color={theme.primary} />
                </View>
              </View>
              <TouchableOpacity style={styles.editBadge}>
                <Ionicons name="camera" size={16} color="#FFF" />
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
          >
            <Text style={styles.logoutText}>SIGN OUT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 60,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  headerContent: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarBorder: {
    padding: 4,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#000",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  userName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: -0.5,
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  rankText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 4,
  },
  content: {
    padding: 24,
    marginTop: -30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 16,
    opacity: 0.6,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statBox: {
    width: (width - 60) / 2,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  achievementsScroll: {
    flexDirection: "row",
    gap: 12,
  },
  achievementCard: {
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    width: 120,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 12,
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
});
