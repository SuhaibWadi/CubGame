import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { GamePhase } from "./types";

interface GameHeaderProps {
  phase: GamePhase;
  isOnlineMode: boolean;
  isMyTurn: boolean;
  lives: number;
  opponentLives: number;
  score: number;
  combo: number;
  theme: any;
  isDark: boolean;
  animatedHeartStyle: any;
  selectedBombsLength: number;
  bombsCount: number;
}

export const GameHeader = ({
  phase,
  isOnlineMode,
  isMyTurn,
  lives,
  opponentLives,
  score,
  combo,
  theme,
  isDark,
  animatedHeartStyle,
  selectedBombsLength,
  bombsCount,
}: GameHeaderProps) => {
  const isSetup = phase === "setup_bombs" || phase === "setup_heart";

  if (isSetup) {
    return (
      <View style={styles.header}>
        <View style={styles.setupHeader}>
          <View style={[styles.setupBadge, { backgroundColor: theme.primary }]}>
            <Text style={styles.setupBadgeText}>BATTLE PREP</Text>
          </View>
          <Text style={[styles.setupText, { color: theme.text }]}>
            {phase === "setup_bombs"
              ? `PLACE ${bombsCount} MINES (${selectedBombsLength}/${bombsCount})`
              : "READY THE HEART"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.gameInfo}>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreLabel, { color: theme.primary }]}>
            {isOnlineMode ? "YOUR HP" : "SCORE"}
          </Text>
          <Text style={[styles.scoreValue, { color: theme.text }]}>
            {isOnlineMode ? lives : Math.floor(score).toLocaleString()}
          </Text>
        </View>

        <View style={styles.centerInfo}>
          {isOnlineMode ? (
            <View
              style={[
                styles.turnIndicator,
                { backgroundColor: isMyTurn ? theme.primary : "#3A3A3C" },
              ]}
            >
              <Text style={styles.turnText}>
                {isMyTurn ? "STRIKE NOW" : "OPPONENT'S MOVE"}
              </Text>
            </View>
          ) : (
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
          )}
        </View>

        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreLabel, { color: theme.secondary }]}>
            {isOnlineMode ? "ENEMY HP" : "COMBO"}
          </Text>
          <Text style={[styles.scoreValue, { color: theme.text }]}>
            {isOnlineMode ? opponentLives : `x${combo.toFixed(1)}`}
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
