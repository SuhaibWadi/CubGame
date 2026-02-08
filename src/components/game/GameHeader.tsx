import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useGameStore } from "../../store/gameStore";
import { AVATAR_MAP } from "../../theme/Avatars";
import { GamePhase } from "./types";

interface GameHeaderProps {
  phase: GamePhase;
  lives: number;
  score: number;
  combo: number;
  theme: any;
  isDark: boolean;
  animatedHeartStyle: any;
  selectedBombsLength: number;
  bombsCount: number;
  heartsCount: number;
}

export const GameHeader = ({
  phase,
  lives,
  score,
  combo,
  theme,
  isDark,
  animatedHeartStyle,
  selectedBombsLength,
  bombsCount,
  heartsCount,
}: GameHeaderProps) => {
  const { profile } = useGameStore();
  const isSetup = phase === "setup_bombs";

  if (isSetup) {
    return (
      <View style={styles.header}>
        <View style={styles.setupHeader}>
          <View style={[styles.setupBadge, { backgroundColor: theme.primary }]}>
            <Text style={styles.setupBadgeText}>BATTLE PREP</Text>
          </View>
          <Text style={[styles.setupText, { color: theme.text }]}>
            {selectedBombsLength < bombsCount
              ? `PLACE ${bombsCount} MINES (${selectedBombsLength}/${bombsCount})`
              : heartsCount < 1
                ? "READY THE HEART"
                : "SETUP COMPLETE"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.gameInfo}>
        <View style={styles.scoreContainer}>
          <View style={styles.playerWrapper}>
            <View
              style={[
                styles.avatarMini,
                { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#FFF" },
              ]}
            >
              {profile.avatar && AVATAR_MAP[profile.avatar] ? (
                <Image
                  source={AVATAR_MAP[profile.avatar]}
                  style={styles.avatarMiniImage}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="person" size={14} color={theme.primary} />
              )}
            </View>
            <View>
              <Text style={[styles.scoreLabel, { color: theme.primary }]}>
                SCORE
              </Text>
              <Text style={[styles.scoreValue, { color: theme.text }]}>
                {Math.floor(score).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.centerInfo}>
          <Animated.View
            style={[
              styles.livesContainer,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)",
              },
              animatedHeartStyle,
            ]}
          >
            {[...Array(Math.max(lives, 3))].map((_, i) => (
              <Ionicons
                key={i}
                name={i < lives ? "heart" : "heart-outline"}
                size={24}
                color={theme.primary}
                style={{ marginHorizontal: 2 }}
              />
            ))}
          </Animated.View>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreLabel, { color: theme.secondary }]}>
            COMBO
          </Text>
          <Text style={[styles.scoreValue, { color: theme.text }]}>
            {`x${combo.toFixed(1)}`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: 30,
    height: 100,
    justifyContent: "center",
    width: "100%",
  },
  gameInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    alignItems: "center",
  },
  scoreContainer: {
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "900",
  },
  playerWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  avatarMiniImage: {
    width: "100%",
    height: "100%",
  },
  centerInfo: {
    alignItems: "center",
  },
  turnIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  turnText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 12,
  },
  livesContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  setupHeader: {
    alignItems: "center",
  },
  setupBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
  },
  setupBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  setupText: {
    fontSize: 24,
    fontWeight: "900",
  },
});
