import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { ms, s, vs } from "../theme/Dimensions";
import { useTheme } from "../theme/ThemeContext";

const HIGH_SCORE_KEY = "memory_game_high_score";

const GRID_SIZE = 3;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
const { width } = Dimensions.get("window");
// Ensure TILE_SIZE is calculated correctly
const TILE_SIZE = (width - s(60)) / GRID_SIZE;

const P1_COLOR = "#007AFF"; // Blue
const P2_COLOR = "#FF3B30"; // Red

type GameMode = "SOLO" | "FRIEND";
type ViewMode = "MENU" | "GAME";
type GameState =
  | "IDLE"
  | "PLAYING_SEQUENCE"
  | "WAITING_FOR_INPUT"
  | "GAME_OVER";

// --- Memory Tile Component ---
const MemoryTile = ({
  id,
  onPress,
  disabled,
  highlight,
  color,
  size = TILE_SIZE,
}: {
  id: number;
  onPress?: (id: number) => void;
  disabled?: boolean;
  highlight?: boolean;
  color?: string;
  size?: number;
}) => {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);
  const elevation = useSharedValue(0);

  useEffect(() => {
    if (highlight) {
      scale.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withTiming(1, { duration: 100 }),
      );
      opacity.value = withTiming(1, { duration: 100 });
      elevation.value = withTiming(10, { duration: 100 });
    } else {
      opacity.value = withTiming(0.8, { duration: 200 });
      elevation.value = withTiming(0, { duration: 200 });
    }
  }, [highlight]);

  const animatedStyle = useAnimatedStyle(() => {
    // Default color logic
    const activeColor = color || theme.primary;
    const neutralColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)";

    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
      backgroundColor: highlight ? activeColor : neutralColor,
      shadowColor: highlight ? activeColor : "transparent",
      shadowOpacity: highlight ? 0.6 : 0,
      shadowRadius: highlight ? 15 : 0,
      borderColor: highlight ? "rgba(255,255,255,0.5)" : "transparent",
      borderWidth: highlight ? 2 : 0,
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress && onPress(id)}
      disabled={disabled}
      style={{
        width: size,
        height: size,
        margin: s(6),
      }}
    >
      <Animated.View style={[styles.tile, animatedStyle]} />
    </TouchableOpacity>
  );
};

export default function MemoryGameScreen() {
  const { theme, isDark } = useTheme();

  // View State
  const [viewMode, setViewMode] = useState<ViewMode>("MENU");

  const [mode, setMode] = useState<GameMode>("SOLO");
  const [gameState, setGameState] = useState<GameState>("IDLE");
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1); // For Friend Mode

  useEffect(() => {
    AsyncStorage.getItem(HIGH_SCORE_KEY).then((val) => {
      if (val) setHighScore(parseInt(val, 10));
    });
  }, []);
  const [message, setMessage] = useState("");

  // Helper to get current color
  const getCurrentColor = () => {
    if (mode === "SOLO") return theme.primary;
    return currentPlayer === 1 ? P1_COLOR : P2_COLOR;
  };

  // --- Game Logic ---

  const startGame = (selectedMode: GameMode) => {
    setViewMode("GAME");
    setMode(selectedMode);
    setGameState("IDLE");
    setSequence([]);
    setPlayerInput([]);
    setRound(1);
    setScore(0);
    setCurrentPlayer(1);

    if (selectedMode === "SOLO") {
      setMessage("Watch the sequence!");
    } else {
      setMessage("PLAYER 1\nGet Ready!");
    }

    // Start first round after a short delay
    setTimeout(() => {
      const initialCount = selectedMode === "FRIEND" ? 3 : 1;
      startRound(1, [], initialCount);
    }, 1500);
  };

  const startRound = (
    currentRound: number,
    currentSequence: number[],
    countToAdd: number = 1,
  ) => {
    setGameState("PLAYING_SEQUENCE");
    setPlayerInput([]);
    setRound(currentRound);

    // Add new steps to the sequence
    const newItems = Array.from({ length: countToAdd }, () =>
      Math.floor(Math.random() * TOTAL_TILES),
    );
    const newSequence = [...currentSequence, ...newItems];
    setSequence(newSequence);

    playSequence(newSequence);
  };

  const playSequence = async (seq: number[]) => {
    setGameState("PLAYING_SEQUENCE");

    if (mode === "SOLO") {
      setMessage(`Level ${seq.length}`);
    } else {
      // Neutral message during sequence playback
      setMessage(`Round ${round}`);
    }

    // Initial pause before sequence starts
    await new Promise((resolve) => setTimeout(resolve, 800));

    for (let i = 0; i < seq.length; i++) {
      setActiveTile(seq[i]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setActiveTile(null);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setGameState("WAITING_FOR_INPUT");
    if (mode === "SOLO") {
      setMessage("Your Turn!");
    } else {
      setMessage(`PLAYER ${currentPlayer}`);
    }
  };

  const handleTilePress = (id: number) => {
    if (gameState !== "WAITING_FOR_INPUT") return;

    // Visual feedback
    setActiveTile(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => setActiveTile(null), 200);

    const newInput = [...playerInput, id];
    setPlayerInput(newInput);

    // Check correctness
    const currentIndex = newInput.length - 1;
    if (newInput[currentIndex] !== sequence[currentIndex]) {
      handleGameOver();
      return;
    }

    // Check if round complete
    if (newInput.length === sequence.length) {
      handleRoundSuccess();
    }
  };

  const handleRoundSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setGameState("IDLE");

    if (mode === "SOLO") {
      const newScore = score + 1;
      setScore(newScore);
      if (newScore > highScore) {
        setHighScore(newScore);
        AsyncStorage.setItem(HIGH_SCORE_KEY, newScore.toString());
      }
      setMessage("Great!");
      setTimeout(() => {
        startRound(round + 1, sequence);
      }, 1000);
    } else {
      // Friend Mode Logic
      if (currentPlayer === 1) {
        setMessage("PLAYER 1 DONE!\nPlayer 2 Is Next");

        setTimeout(() => {
          setCurrentPlayer(2);
          setPlayerInput([]);
          setGameState("WAITING_FOR_INPUT");
          playSequence(sequence);
        }, 1500);
      } else {
        // P2 finished round
        setMessage("ROUND COMPLETE!");
        setTimeout(() => {
          setCurrentPlayer(1);
          startRound(round + 1, sequence);
        }, 1500);
      }
    }
  };

  const handleGameOver = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setGameState("GAME_OVER");
    if (mode === "FRIEND") {
      setMessage(`Player ${currentPlayer === 1 ? 2 : 1} Wins!`);
    } else {
      setMessage("Game Over!");
    }
  };

  const returnToMenu = () => {
    setViewMode("MENU");
    setGameState("IDLE");
  };

  // --- Renders ---

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      {/* Header Stats */}
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={styles.header}
      >
        <Text style={[styles.roundText, { color: theme.text }]}>MEMORY</Text>
        <Text style={[styles.roundTextSubtitle, { color: theme.primary }]}>
          Master
        </Text>
        <View style={styles.scorePill}>
          <Ionicons
            name="trophy"
            size={16}
            color={theme.accent}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.scoreText, { color: theme.text }]}>
            Best: {highScore}
          </Text>
        </View>
      </Animated.View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
            onPress={() => startGame("SOLO")}
          >
            <LinearGradient
              colors={["#FF2D55", "#FF3B30"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="person" size={24} color="#FF2D55" />
              </View>
              <View style={styles.buttonContent}>
                <Text style={styles.buttonTitle}>Solo Mode</Text>
                <Text style={styles.buttonSubtitle}>Beat your high score</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color="rgba(255,255,255,0.8)"
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
            onPress={() => startGame("FRIEND")}
          >
            <LinearGradient
              colors={["#5856D6", "#5E5CE6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="people" size={24} color="#5856D6" />
              </View>
              <View style={styles.buttonContent}>
                <Text style={styles.buttonTitle}>Friend Mode</Text>
                <Text style={styles.buttonSubtitle}>Challenge a friend</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color="rgba(255,255,255,0.8)"
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.9}
            onPress={() => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning,
              );
              alert("Coming soon!");
            }}
          >
            <LinearGradient
              colors={isDark ? ["#333", "#444"] : ["#E5E5EA", "#D1D1D6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: isDark ? "#555" : "#FFF" },
                ]}
              >
                <Ionicons
                  name="globe-outline"
                  size={24}
                  color={isDark ? "#FFF" : "#666"}
                />
              </View>
              <View style={styles.buttonContent}>
                <Text
                  style={[
                    styles.buttonTitle,
                    { color: isDark ? "#FFF" : "#000" },
                  ]}
                >
                  Online Mode
                </Text>
                <Text
                  style={[
                    styles.buttonSubtitle,
                    { color: isDark ? "#AAA" : "#666" },
                  ]}
                >
                  Play with the world
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>SOON</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );

  const renderGame = () => (
    <Animated.View entering={ZoomIn} style={styles.gameContainer}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          {gameState === "GAME_OVER" ? "GAME OVER" : `Round ${round}`}
        </Text>

        {mode === "SOLO" && (
          <View style={{ flexDirection: "row", gap: 15, marginTop: 5 }}>
            <Text style={[styles.subtitle, { color: theme.text }]}>
              Score: {score}
            </Text>
            <Text
              style={[styles.subtitle, { color: theme.text, opacity: 0.6 }]}
            >
              Best: {highScore}
            </Text>
          </View>
        )}

        <Text
          style={[
            styles.status,
            { color: getCurrentColor(), textAlign: "center" },
          ]}
        >
          {message}
        </Text>
      </View>

      <View style={styles.gridContainer}>
        {Array.from({ length: GRID_SIZE }).map((_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: GRID_SIZE }).map((_, col) => {
              const id = row * GRID_SIZE + col;
              return (
                <MemoryTile
                  key={id}
                  id={id}
                  onPress={handleTilePress}
                  disabled={gameState !== "WAITING_FOR_INPUT"}
                  highlight={activeTile === id}
                  color={getCurrentColor()}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* In-Game / Game Over Controls */}
      {gameState === "GAME_OVER" && (
        <Animated.View
          entering={FadeInUp.springify()}
          style={styles.bottomControls}
        >
          <TouchableOpacity
            style={[styles.smallButton, { backgroundColor: theme.primary }]}
            onPress={() => startGame(mode)}
          >
            <Text style={styles.smallButtonText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.smallButton,
              { backgroundColor: isDark ? "#333" : "#E5E5EA", marginTop: 15 },
            ]}
            onPress={returnToMenu}
          >
            <Text style={[styles.smallButtonText, { color: theme.text }]}>
              Exit to Menu
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Back Button during Game */}
      {gameState !== "GAME_OVER" && (
        <TouchableOpacity style={styles.backButton} onPress={returnToMenu}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  return (
    <LinearGradient
      colors={
        isDark ? ["#0F2027", "#203A43", "#2C5364"] : ["#FFFFFF", "#F0F2F5"]
      }
      style={styles.container}
    >
      <View style={[styles.contentContainer]}>
        {viewMode === "MENU" ? renderMenu() : renderGame()}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: vs(40),
  },
  // Menu Styles
  menuContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(20),
    width: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: vs(40),
  },
  roundText: {
    fontSize: ms(42),
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
  },
  roundTextSubtitle: {
    fontSize: ms(42),
    fontWeight: "300",
    letterSpacing: 1,
    textAlign: "center",
    marginTop: -10,
  },
  scorePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(120,120,120,0.1)",
    paddingHorizontal: s(16),
    paddingVertical: vs(8),
    borderRadius: 20,
    marginTop: vs(15),
  },
  scoreText: {
    fontSize: ms(14),
    fontWeight: "600",
  },
  actionsContainer: {
    width: "100%",
    gap: vs(15),
    paddingHorizontal: s(10),
  },
  actionButton: {
    width: "100%",
    height: vs(80),
    borderRadius: s(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(20),
    borderRadius: s(20),
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginRight: s(15),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    color: "#FFF",
    fontSize: ms(18),
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  buttonSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: ms(13),
    marginTop: 2,
  },
  badge: {
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#666",
  },

  // Game Styles
  gameContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: ms(32),
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: ms(18),
    opacity: 0.7,
  },
  status: {
    fontSize: ms(24),
    marginTop: vs(10),
    fontWeight: "600",
    textAlign: "center",
    height: vs(60), // Fix height to prevent jumping
  },
  gridContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: vs(20),
  },
  row: {
    flexDirection: "row",
  },
  tile: {
    borderRadius: s(20), // Softer corners
    flex: 1,
  },
  bottomControls: {
    position: "absolute",
    bottom: vs(30),
    width: "70%",
    alignItems: "center",
  },
  smallButton: {
    paddingVertical: vs(14),
    paddingHorizontal: s(24),
    borderRadius: s(16),
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  smallButtonText: {
    color: "white",
    fontSize: ms(16),
    fontWeight: "bold",
  },
  backButton: {
    position: "absolute",
    top: vs(60),
    left: s(20),
    padding: s(10),
    zIndex: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 20,
  },
});
