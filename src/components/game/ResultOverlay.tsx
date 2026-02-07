import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { GamePhase } from "./types";

interface ResultOverlayProps {
  phase: GamePhase;
  score: number;
  maxCombo: number;
  onReset: () => void;
  theme: any;
  isDark: boolean;
}

export const ResultOverlay = ({
  phase,
  score,
  maxCombo,
  onReset,
  theme,
  isDark,
}: ResultOverlayProps) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 500 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isWin = phase === "game_won";

  return (
    <View style={styles.overlayContainer}>
      <Animated.View
        style={[
          styles.resultCard,
          animatedStyle,
          { backgroundColor: isDark ? "#1C1C1E" : "#FFF" },
        ]}
      >
        <Text style={[styles.resultTitle, { color: theme.text }]}>
          {isWin ? "VICTORY!" : "GAME OVER"}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statDetail}>
            <Text style={styles.statLabel}>FINAL SCORE</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {Math.floor(score)}
            </Text>
          </View>
          <View style={styles.statDetail}>
            <Text style={styles.statLabel}>MAX COMBO</Text>
            <Text style={[styles.statValue, { color: theme.primary }]}>
              x{maxCombo.toFixed(1)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.resultButton,
            { backgroundColor: isWin ? "#34C759" : theme.primary },
          ]}
          onPress={onReset}
        >
          <Text style={styles.resultButtonText}>
            {isWin ? "Play Again" : "Retry Battle"}
          </Text>
          <Ionicons
            name="refresh"
            size={20}
            color="#FFF"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  resultCard: {
    width: "85%",
    padding: 30,
    borderRadius: 30,
    alignItems: "center",
    elevation: 20,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 20,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 30,
  },
  statDetail: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
  },
  resultButton: {
    flexDirection: "row",
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 40,
    alignItems: "center",
    elevation: 5,
  },
  resultButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
});
