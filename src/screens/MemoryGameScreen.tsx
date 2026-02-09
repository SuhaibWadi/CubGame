import { Ionicons } from "@expo/vector-icons";
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
import { MMKV } from "react-native-mmkv";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ms, s, vs } from "../theme/Dimensions";
import { useTheme } from "../theme/ThemeContext";

const HIGH_SCORE_KEY = "memory_game_high_score";

// Safe Storage Wrapper
const createStorage = () => {
  try {
    const mmkv = new MMKV();
    return {
      getItem: (key: string) => mmkv.getNumber(key) || 0,
      setItem: (key: string, value: number) => mmkv.set(key, value),
    };
  } catch (e) {
    console.warn(
      "MMKV failed to initialize (likely due to Remote Debugger). Falling back to in-memory storage.",
    );
    const memoryStore: Record<string, number> = {};
    return {
      getItem: (key: string) => memoryStore[key] || 0,
      setItem: (key: string, value: number) => {
        memoryStore[key] = value;
      },
    };
  }
};

const storage = createStorage();

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

  useEffect(() => {
    if (highlight) {
      scale.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withTiming(1, { duration: 100 }),
      );
      opacity.value = withTiming(1, { duration: 100 });
    } else {
      opacity.value = withTiming(0.8, { duration: 200 });
    }
  }, [highlight]);

  const animatedStyle = useAnimatedStyle(() => {
    // Default color logic
    const activeColor = color || theme.primary;
    const neutralColor = isDark ? "#333" : "#ddd";

    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
      backgroundColor: highlight ? activeColor : neutralColor,
      shadowColor: highlight ? activeColor : "transparent",
      shadowOpacity: highlight ? 0.8 : 0,
      shadowRadius: highlight ? 10 : 0,
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
        margin: s(5),
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
  const [highScore, setHighScore] = useState(storage.getItem(HIGH_SCORE_KEY));
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1); // For Friend Mode
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
      setMessage(`PLAYER ${currentPlayer}\nWatch Closely!`);
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
      setMessage(`PLAYER ${currentPlayer}\nRepeat It!`);
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
        storage.setItem(HIGH_SCORE_KEY, newScore);
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
      <View style={styles.header}>
        <Text style={[styles.roundText, { color: theme.text }]}>
          MEMORY{"\n"}GAME
        </Text>
        <Text style={[styles.scoreText, { color: isDark ? "#888" : "#666" }]}>
          Best: {highScore}
        </Text>
      </View>

      {/* Decorative Grid */}
      <View style={styles.menuGridContainer}>
        {Array.from({ length: 9 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.menuGridItem,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#E0E0E0",
                borderRadius: s(16),
              },
            ]}
          />
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
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
            <Ionicons
              name="person"
              size={24}
              color="#FFF"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Solo Mode</Text>
          </LinearGradient>
        </TouchableOpacity>

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
            <Ionicons
              name="people"
              size={24}
              color="#FFF"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Friend Mode</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGame = () => (
    <>
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
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={[styles.smallButton, { backgroundColor: theme.primary }]}
            onPress={() => startGame(mode)}
          >
            <Text style={styles.smallButtonText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.smallButton,
              { backgroundColor: "#888", marginTop: 10 },
            ]}
            onPress={returnToMenu}
          >
            <Text style={styles.smallButtonText}>Exit to Menu</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Back Button during Game */}
      {gameState !== "GAME_OVER" && (
        <TouchableOpacity style={styles.backButton} onPress={returnToMenu}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
      )}
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {viewMode === "MENU" ? renderMenu() : renderGame()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Menu Styles
  menuContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: vs(60),
    paddingHorizontal: s(20),
    width: "100%",
  },
  roundText: {
    fontSize: ms(32),
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: vs(5),
    textAlign: "center",
  },
  scoreText: {
    fontSize: ms(16),
    fontWeight: "600",
  },
  menuGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: s(12),
    width: width - s(80),
    aspectRatio: 1,
    marginBottom: vs(50),
    marginTop: vs(20),
  },
  menuGridItem: {
    width: "30%",
    aspectRatio: 1,
  },
  actionsContainer: {
    width: "100%",
    gap: vs(15),
    paddingHorizontal: s(10),
  },
  actionButton: {
    width: "100%",
    height: vs(60),
    borderRadius: s(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  gradientButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: s(16),
  },
  buttonIcon: {
    marginRight: s(10),
  },
  buttonText: {
    color: "#FFF",
    fontSize: ms(18),
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  // Game Styles
  header: {
    position: "absolute",
    top: vs(60),
    alignItems: "center",
    zIndex: 10,
    width: "100%",
    paddingHorizontal: 20,
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
  },
  gridContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
  },
  tile: {
    borderRadius: s(15),
    flex: 1,
  },
  bottomControls: {
    position: "absolute",
    bottom: vs(50),
    width: "60%",
    alignItems: "center",
  },
  smallButton: {
    paddingVertical: vs(12),
    paddingHorizontal: s(24),
    borderRadius: s(12),
    width: "100%",
    alignItems: "center",
  },
  smallButtonText: {
    color: "white",
    fontSize: ms(16),
    fontWeight: "bold",
  },
  backButton: {
    position: "absolute",
    top: vs(50),
    left: s(20),
    padding: s(10),
    zIndex: 20,
  },
});
