import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useGameStore } from "../store/gameStore";
import { useTheme } from "../theme/ThemeContext";

export default function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const { profile, stats } = useGameStore();

  const StatItem = ({ label, value }: any) => (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: isDark ? "#888" : "#666" }]}>
        {label}
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <View
          style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="person" size={50} color="#FFF" />
        </View>
        <Text style={[styles.userName, { color: theme.text }]}>
          {profile.name}
        </Text>
        <Text style={[styles.userHandle, { color: isDark ? "#AAA" : "#888" }]}>
          {profile.handle}
        </Text>
      </View>

      <View
        style={[
          styles.statsContainer,
          { backgroundColor: isDark ? "#1E1E1E" : "#F9F9F9" },
        ]}
      >
        <StatItem label="Wins" value={stats.wins.toString()} />
        <View
          style={[
            styles.divider,
            { backgroundColor: isDark ? "#333" : "#E0E0E0" },
          ]}
        />
        <StatItem label="Score" value={stats.totalScore.toString()} />
        <View
          style={[
            styles.divider,
            { backgroundColor: isDark ? "#333" : "#E0E0E0" },
          ]}
        />
        <StatItem label="GAMES" value={stats.gamesPlayed.toString()} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <View style={styles.recentActivity}>
          <Text style={[styles.activityTitle, { color: theme.text }]}>
            Recent Activity
          </Text>
          <View
            style={[styles.activityItem, { borderLeftColor: theme.primary }]}
          >
            <Text style={[styles.activityText, { color: theme.text }]}>
              Won a match against CubMaster
            </Text>
            <Text style={styles.activityTime}>2 hours ago</Text>
          </View>
          <View style={[styles.activityItem, { borderLeftColor: "#888" }]}>
            <Text style={[styles.activityText, { color: theme.text }]}>
              Updated profile picture
            </Text>
            <Text style={styles.activityTime}>Yesterday</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingVertical: 40,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
  },
  userHandle: {
    fontSize: 16,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 20,
    justifyContent: "space-around",
    alignItems: "center",
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textTransform: "uppercase",
  },
  divider: {
    width: 1,
    height: "60%",
  },
  content: {
    padding: 20,
    marginTop: 10,
  },
  actionButton: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  recentActivity: {
    marginTop: 10,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },
  activityItem: {
    borderLeftWidth: 3,
    paddingLeft: 15,
    paddingVertical: 10,
    marginBottom: 15,
  },
  activityText: {
    fontSize: 15,
    fontWeight: "500",
  },
  activityTime: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
});
