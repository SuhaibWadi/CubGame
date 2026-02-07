import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { useAudioPlayer } from "expo-audio";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { socketService } from "../services/socketService";
import { useGameStore } from "../store/gameStore";
import { useTheme } from "../theme/ThemeContext";

const GRID_SIZE = 4;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
const BOMBS_COUNT = 5;
const HEARTS_COUNT = 1;

const SOUNDS = {
  flip: "https://raw.githubusercontent.com/lucsn/scavenge-the-stars/master/assets/audio/sfx/click.mp3", // Modern Juicy Click
  bomb: "https://raw.githubusercontent.com/vlad-ignat/retro-game-sounds/master/mp3/sfx_exp_medium1.mp3", // Deep Cinematic Boom
  heart:
    "https://raw.githubusercontent.com/vlad-ignat/retro-game-sounds/master/mp3/sfx_sounds_powerup12.mp3", // Shimmering Magic Fill
  win: "https://raw.githubusercontent.com/vlad-ignat/retro-game-sounds/master/mp3/sfx_sounds_fanfare3.mp3", // Premium Fanfare
};

type TileType = "safe" | "bomb" | "heart";
type GamePhase =
  | "setup_bombs"
  | "setup_heart"
  | "playing"
  | "game_over"
  | "game_won";

interface Tile {
  id: number;
  type: TileType;
  flipped: boolean;
}

const screenWidth = Dimensions.get("window").width;
const tileMargin = 10;
const tileSize = (screenWidth - (GRID_SIZE + 1) * tileMargin) / GRID_SIZE;

// --- Sub-component for Animated Tile ---
const GameTile = ({
  tile,
  onPress,
  isDark,
  theme,
  phase,
  selectedBombs,
  selectedHeart,
  index,
}: {
  tile: Tile;
  onPress: () => void;
  isDark: boolean;
  theme: any;
  phase: GamePhase;
  selectedBombs: number[];
  selectedHeart: number | null;
  index: number;
}) => {
  const flip = useSharedValue(0);
  const entry = useSharedValue(0);

  // Staggered entry animation (scale and fade)
  useEffect(() => {
    entry.value = withDelay(index * 40, withTiming(1, { duration: 500 }));
  }, []);

  // Sync flip state if it's already flipped (e.g. from remote)
  useEffect(() => {
    if (tile.flipped || phase === "game_over" || phase === "game_won") {
      flip.value = withTiming(1, { duration: 400 });
    } else {
      flip.value = withTiming(0, { duration: 400 });
    }
  }, [tile.flipped, phase]);

  const animatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flip.value, [0, 1], [0, 180]);
    return {
      transform: [
        { perspective: 1000 },
        { scale: entry.value },
        { rotateY: `${rotateY}deg` },
      ],
      opacity: entry.value,
    };
  });

  const frontStyle = useAnimatedStyle(() => ({
    opacity: flip.value < 0.5 ? 1 : 0,
  }));

  const backStyle = useAnimatedStyle(() => ({
    opacity: flip.value >= 0.5 ? 1 : 0,
    transform: [{ rotateY: "180deg" }],
  }));

  const isSelected =
    (phase === "setup_bombs" && selectedBombs.includes(tile.id)) ||
    (phase === "setup_heart" && selectedHeart === tile.id);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={tile.flipped && phase === "playing"}
      style={styles.tileContainer}
    >
      <Animated.View style={[styles.tile, animatedStyle]}>
        {/* Front Face (Hidden/Closed) */}
        <Animated.View
          style={[
            styles.tile,
            frontStyle,
            {
              backgroundColor: isSelected
                ? theme.primary
                : isDark
                  ? "#1C1C1E"
                  : "#F1F1F1",
              borderWidth: isSelected ? 3 : 0,
              borderColor: "#FFF",
              position: "absolute",
              width: "100%",
              height: "100%",
            },
          ]}
        >
          {isSelected ? (
            <Ionicons
              name={phase === "setup_bombs" ? "nuclear" : "heart"}
              size={32}
              color="#FFF"
            />
          ) : (
            <Text
              style={{ color: theme.primary, fontWeight: "900", fontSize: 24 }}
            >
              ?
            </Text>
          )}
        </Animated.View>

        {/* Back Face (Revealed) */}
        <Animated.View
          style={[
            styles.tile,
            backStyle,
            {
              backgroundColor:
                tile.type === "bomb"
                  ? "#FF3B30"
                  : tile.type === "heart"
                    ? "#34C759"
                    : isDark
                      ? "#2C2C2E"
                      : "#FFFFFF",
              position: "absolute",
              width: "100%",
              height: "100%",
            },
          ]}
        >
          {tile.type === "bomb" ? (
            <MaterialCommunityIcons name="bomb" size={32} color="#FFF" />
          ) : tile.type === "heart" ? (
            <Ionicons name="heart" size={32} color="#FFF" />
          ) : (
            <Ionicons name="checkmark-circle" size={32} color={theme.primary} />
          )}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// --- Result Overlay Component ---
const ResultOverlay = ({
  phase,
  score,
  maxCombo,
  onReset,
  theme,
  isDark,
}: any) => {
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

// --- Main Game Component ---
export default function GameScreen() {
  const route = useRoute<any>();
  const isCustomMode = route.params?.mode === "custom";
  const isOnlineMode = route.params?.mode === "online";

  const { theme, isDark } = useTheme();
  const { addWin, addLoss } = useGameStore();

  const [lives, setLives] = useState(3);
  const [grid, setGrid] = useState<Tile[]>([]);
  const [phase, setPhase] = useState<GamePhase>("playing");

  // Multiplayer State
  const [isMyTurn, setIsMyTurn] = useState(!isOnlineMode);
  const [opponentLives, setOpponentLives] = useState(3);

  // Score & Combo
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);

  // Custom setup state
  const [selectedBombs, setSelectedBombs] = useState<number[]>([]);
  const [selectedHeart, setSelectedHeart] = useState<number | null>(null);

  // Animations
  const heartShake = useSharedValue(0);

  // Sound Players (expo-audio)
  const flipPlayer = useAudioPlayer(SOUNDS.flip);
  const bombPlayer = useAudioPlayer(SOUNDS.bomb);
  const heartPlayer = useAudioPlayer(SOUNDS.heart);
  const winPlayer = useAudioPlayer(SOUNDS.win);

  useEffect(() => {
    if (isCustomMode) {
      startSetup();
    } else if (isOnlineMode && route.params?.board) {
      setGrid(route.params.board);
      setPhase("playing");
      setIsMyTurn(route.params.isHost); // Host usually goes first
    } else {
      initializeRandomGame();
    }
  }, []);

  useEffect(() => {
    if (isOnlineMode) {
      socketService.onMoveReceived((data: any) => {
        handleRemoteMove(data.tileId);
      });

      socketService.onOpponentWon(() => {
        setPhase("game_over");
        addLoss(score);
      });
    }
  }, [grid, isMyTurn]);

  const handleRemoteMove = (tileId: number) => {
    const newGrid = [...grid];
    if (newGrid[tileId]) {
      newGrid[tileId].flipped = true;
      setGrid(newGrid);
      setIsMyTurn(true);

      const tile = newGrid[tileId];
      if (tile.type === "bomb") {
        setOpponentLives((prev) => prev - 1);
        playSound("bomb");
      } else if (tile.type === "heart") {
        setOpponentLives((prev) => Math.min(prev + 1, 5));
        playSound("heart");
      } else {
        playSound("flip");
      }
    }
  };

  const playSound = (type: keyof typeof SOUNDS) => {
    try {
      if (type === "flip") {
        flipPlayer?.seekTo(0);
        flipPlayer?.play();
      } else if (type === "bomb") {
        bombPlayer?.seekTo(0);
        bombPlayer?.play();
      } else if (type === "heart") {
        heartPlayer?.seekTo(0);
        heartPlayer?.play();
      } else if (type === "win") {
        winPlayer?.seekTo(0);
        winPlayer?.play();
      }
    } catch (e) {
      console.log("Error playing sound", e);
    }
  };

  const triggerHeartShake = () => {
    heartShake.value = withSequence(
      withRepeat(withTiming(10, { duration: 50 }), 6, true),
      withTiming(0, { duration: 50 }),
    );
  };

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: heartShake.value }],
  }));

  const startSetup = () => {
    const tiles: Tile[] = [];
    for (let i = 0; i < TOTAL_TILES; i++) {
      tiles.push({ id: i, type: "safe", flipped: false });
    }
    setGrid(tiles);
    setPhase("setup_bombs");
    setScore(0);
    setCombo(1);
    setMaxCombo(1);
    setSelectedBombs([]);
    setSelectedHeart(null);
  };

  const initializeRandomGame = () => {
    const tiles: Tile[] = [];
    for (let i = 0; i < TOTAL_TILES; i++) {
      tiles.push({ id: i, type: "safe", flipped: false });
    }

    // Place bombs
    let bombsPlaced = 0;
    while (bombsPlaced < BOMBS_COUNT) {
      const randomIndex = Math.floor(Math.random() * TOTAL_TILES);
      if (tiles[randomIndex].type === "safe") {
        tiles[randomIndex].type = "bomb";
        bombsPlaced++;
      }
    }

    // Place heart
    let heartPlaced = 0;
    while (heartPlaced < HEARTS_COUNT) {
      const randomIndex = Math.floor(Math.random() * TOTAL_TILES);
      if (tiles[randomIndex].type === "safe") {
        tiles[randomIndex].type = "heart";
        heartPlaced++;
      }
    }

    setGrid(tiles);
    setLives(3);
    setScore(0);
    setCombo(1);
    setMaxCombo(1);
    setPhase("playing");
  };

  const startCustomGame = () => {
    playSound("flip");
    const newGrid = [...grid];
    selectedBombs.forEach((id) => (newGrid[id].type = "bomb"));
    if (selectedHeart !== null) newGrid[selectedHeart].type = "heart";

    setGrid(newGrid);
    setLives(3);
    setPhase("playing");
  };

  const handleTilePress = (tile: Tile) => {
    if (phase === "setup_bombs") {
      playSound("flip");
      if (selectedBombs.includes(tile.id)) {
        setSelectedBombs(selectedBombs.filter((id) => id !== tile.id));
      } else if (selectedBombs.length < BOMBS_COUNT) {
        setSelectedBombs([...selectedBombs, tile.id]);
      }
    } else if (phase === "setup_heart") {
      if (selectedBombs.includes(tile.id)) return;
      playSound("flip");
      setSelectedHeart(tile.id);
    } else if (phase === "playing") {
      if (tile.flipped) return;

      // Online turn check
      if (isOnlineMode && !isMyTurn) return;

      const newGrid = [...grid];
      newGrid[tile.id].flipped = true;
      setGrid(newGrid);

      // Sync move if online
      if (isOnlineMode) {
        socketService.emitMove(tile.id);
        setIsMyTurn(false);
      }

      if (tile.type === "bomb") {
        playSound("bomb");
        triggerHeartShake();
        const newLives = lives - 1;
        setLives(newLives);
        setCombo(1); // Break combo
        if (newLives <= 0) {
          setPhase("game_over");
          addLoss(score);
        }
      } else if (tile.type === "heart") {
        playSound("heart");
        setLives((prev) => Math.min(prev + 1, 5));
        setScore((prev) => prev + 500);
      } else {
        playSound("flip");
        setScore((prev) => prev + 100 * combo);
        const newCombo = combo + 0.2;
        setCombo(newCombo);
        if (newCombo > maxCombo) setMaxCombo(newCombo);
      }

      const safeTilesLeft = newGrid.filter(
        (t) => t.type === "safe" && !t.flipped,
      ).length;
      if (safeTilesLeft === 0 && phase === "playing") {
        setPhase("game_won");
        playSound("win");
        addWin(score, maxCombo);
        if (isOnlineMode) {
          socketService.emitWin();
        }
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        {phase === "playing" ||
        phase === "game_over" ||
        phase === "game_won" ? (
          <View style={styles.gameInfo}>
            <View style={styles.scoreContainer}>
              <Text
                style={[styles.scoreLabel, { color: isDark ? "#AAA" : "#666" }]}
              >
                {isOnlineMode ? "YOU" : "SCORE"}
              </Text>
              <Text style={[styles.scoreValue, { color: theme.text }]}>
                {isOnlineMode ? lives : Math.floor(score)}
              </Text>
            </View>

            <View style={styles.centerInfo}>
              {isOnlineMode ? (
                <View
                  style={[
                    styles.turnIndicator,
                    { backgroundColor: isMyTurn ? theme.primary : "#888" },
                  ]}
                >
                  <Text style={styles.turnText}>
                    {isMyTurn ? "YOUR TURN" : "OPPONENT'S TURN"}
                  </Text>
                </View>
              ) : (
                <Animated.View
                  style={[
                    styles.livesContainer,
                    { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" },
                    animatedHeartStyle,
                  ]}
                >
                  {[...Array(Math.max(lives, 3))].map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < lives ? "heart" : "heart-outline"}
                      size={24}
                      color="#FF3B30"
                      style={{ marginHorizontal: 2 }}
                    />
                  ))}
                </Animated.View>
              )}
            </View>

            <View style={styles.scoreContainer}>
              <Text
                style={[styles.scoreLabel, { color: isDark ? "#AAA" : "#666" }]}
              >
                {isOnlineMode ? "ENEMY" : "COMBO"}
              </Text>
              <Text style={[styles.scoreValue, { color: theme.primary }]}>
                {isOnlineMode ? opponentLives : `x${combo.toFixed(1)}`}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.setupHeader}>
            <View
              style={[
                styles.setupBadge,
                { backgroundColor: theme.primary + "22" },
              ]}
            >
              <Text style={[styles.setupBadgeText, { color: theme.primary }]}>
                SETUP MODE
              </Text>
            </View>
            <Text style={[styles.setupText, { color: theme.text }]}>
              {phase === "setup_bombs"
                ? `Place 5 Bombs (${selectedBombs.length}/5)`
                : "Place 1 Hidden Heart"}
            </Text>
          </View>
        )}
      </View>

      <View
        style={[
          styles.gridCard,
          {
            backgroundColor: isDark ? "#121212" : "#FFFFFF",
            shadowColor: isDark ? "#000" : "#444",
          },
        ]}
      >
        <View style={styles.grid}>
          {grid.map((tile, idx) => (
            <GameTile
              key={tile.id}
              tile={tile}
              onPress={() => handleTilePress(tile)}
              isDark={isDark}
              theme={theme}
              phase={phase}
              selectedBombs={selectedBombs}
              selectedHeart={selectedHeart}
              index={idx}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        {phase === "setup_bombs" && selectedBombs.length === BOMBS_COUNT && (
          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              playSound("flip");
              setPhase("setup_heart");
            }}
          >
            <Text style={styles.mainButtonText}>Confirm Bombs</Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color="#FFF"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        )}

        {phase === "setup_heart" && selectedHeart !== null && (
          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: "#34C759" }]}
            onPress={startCustomGame}
          >
            <Text style={styles.mainButtonText}>Start Game</Text>
            <Ionicons
              name="play"
              size={20}
              color="#FFF"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        )}
      </View>

      {phase === "game_won" && (
        <ConfettiCannon
          count={200}
          origin={{ x: screenWidth / 2, y: -50 }}
          fadeOut={true}
        />
      )}

      {(phase === "game_won" || phase === "game_over") && (
        <ResultOverlay
          phase={phase}
          score={score}
          maxCombo={maxCombo}
          theme={theme}
          isDark={isDark}
          onReset={isCustomMode ? startSetup : initializeRandomGame}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
  },
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
    backgroundColor: "#FF2D55",
  },
  turnText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 12,
  },
  comboBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 5,
  },
  comboText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
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
  livesWrapper: {
    alignItems: "center",
    marginBottom: 10,
  },
  livesContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  gridCard: {
    padding: 10,
    borderRadius: 24,
    elevation: 8,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  grid: {
    width: screenWidth - 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  tileContainer: {
    width: tileSize - 4,
    height: tileSize - 4,
    margin: 4,
  },
  tile: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  tileNumber: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 40,
    width: "100%",
    alignItems: "center",
  },
  mainButton: {
    flexDirection: "row",
    paddingHorizontal: 35,
    paddingVertical: 16,
    borderRadius: 35,
    elevation: 6,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  mainButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
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
