import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { useAudioPlayer } from "expo-audio";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

// Components
import { GameHeader } from "../components/game/GameHeader";
import { GameTile } from "../components/game/GameTile";
import { ResultOverlay } from "../components/game/ResultOverlay";
import { GamePhase, Tile } from "../components/game/types";

// Services & Store
import { socketService } from "../services/socketService";
import { useGameStore } from "../store/gameStore";
import { useTheme } from "../theme/ThemeContext";

const GRID_SIZE = 4;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
const BOMBS_COUNT = 5;
const HEARTS_COUNT = 1;

const screenWidth = Dimensions.get("window").width;

const SOUNDS = {
  flip: "https://raw.githubusercontent.com/lucsn/scavenge-the-stars/master/assets/audio/sfx/click.mp3",
  bomb: "https://raw.githubusercontent.com/vlad-ignat/retro-game-sounds/master/mp3/sfx_exp_medium1.mp3",
  heart:
    "https://raw.githubusercontent.com/vlad-ignat/retro-game-sounds/master/mp3/sfx_sounds_powerup12.mp3",
  win: "https://raw.githubusercontent.com/vlad-ignat/retro-game-sounds/master/mp3/sfx_sounds_fanfare3.mp3",
};

export default function GameScreen() {
  const route = useRoute<any>();
  const isCustomMode = route.params?.mode === "custom";
  const isOnlineMode = route.params?.mode === "online";

  const { theme, isDark } = useTheme();
  const { addWin, addLoss } = useGameStore();

  // --- Game State ---
  const [lives, setLives] = useState(3);
  const [grid, setGrid] = useState<Tile[]>([]);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);

  // --- Multiplayer State ---
  const [isMyTurn, setIsMyTurn] = useState(!isOnlineMode);
  const [opponentLives, setOpponentLives] = useState(3);

  // --- Custom Setup State ---
  const [selectedBombs, setSelectedBombs] = useState<number[]>([]);
  const [selectedHeart, setSelectedHeart] = useState<number | null>(null);

  // --- Animations ---
  const heartShake = useSharedValue(0);
  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: heartShake.value }],
  }));

  // --- Sound Players ---
  const flipPlayer = useAudioPlayer(SOUNDS.flip);
  const bombPlayer = useAudioPlayer(SOUNDS.bomb);
  const heartPlayer = useAudioPlayer(SOUNDS.heart);
  const winPlayer = useAudioPlayer(SOUNDS.win);

  const playSound = useCallback(
    (type: keyof typeof SOUNDS) => {
      try {
        const player =
          type === "flip"
            ? flipPlayer
            : type === "bomb"
              ? bombPlayer
              : type === "heart"
                ? heartPlayer
                : winPlayer;
        player?.seekTo(0);
        player?.play();
      } catch (e) {
        console.log("Error playing sound", e);
      }
    },
    [flipPlayer, bombPlayer, heartPlayer, winPlayer],
  );

  const triggerHeartShake = () => {
    heartShake.value = withSequence(
      withRepeat(withTiming(10, { duration: 50 }), 6, true),
      withTiming(0, { duration: 50 }),
    );
  };

  // --- Game Logic ---
  const initializeRandomGame = useCallback(() => {
    const tiles: Tile[] = Array.from({ length: TOTAL_TILES }, (_, i) => ({
      id: i,
      type: "safe",
      flipped: false,
    }));

    // Place bombs
    let bombsPlaced = 0;
    while (bombsPlaced < BOMBS_COUNT) {
      const idx = Math.floor(Math.random() * TOTAL_TILES);
      if (tiles[idx].type === "safe") {
        tiles[idx].type = "bomb";
        bombsPlaced++;
      }
    }

    // Place heart
    let heartsPlaced = 0;
    while (heartsPlaced < HEARTS_COUNT) {
      const idx = Math.floor(Math.random() * TOTAL_TILES);
      if (tiles[idx].type === "safe") {
        tiles[idx].type = "heart";
        heartsPlaced++;
      }
    }

    setGrid(tiles);
    setLives(3);
    setScore(0);
    setCombo(1);
    setMaxCombo(1);
    setPhase("playing");
  }, []);

  const startSetup = useCallback(() => {
    setGrid(
      Array.from({ length: TOTAL_TILES }, (_, i) => ({
        id: i,
        type: "safe",
        flipped: false,
      })),
    );
    setPhase("setup_bombs");
    setScore(0);
    setCombo(1);
    setMaxCombo(1);
    setSelectedBombs([]);
    setSelectedHeart(null);
  }, []);

  useEffect(() => {
    if (isCustomMode) {
      startSetup();
    } else if (isOnlineMode && route.params?.board) {
      setGrid(route.params.board);
      setPhase("playing");
      setIsMyTurn(route.params.isHost);
    } else {
      initializeRandomGame();
    }
  }, [
    isCustomMode,
    isOnlineMode,
    route.params,
    startSetup,
    initializeRandomGame,
  ]);

  // --- Remote Move Handler ---
  const handleRemoteMove = useCallback(
    (tileId: number) => {
      setGrid((prevGrid) => {
        const newGrid = [...prevGrid];
        if (newGrid[tileId]) {
          newGrid[tileId].flipped = true;
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
        return newGrid;
      });
    },
    [playSound],
  );

  useEffect(() => {
    if (isOnlineMode) {
      socketService.onMoveReceived((data: any) =>
        handleRemoteMove(data.tileId),
      );
      socketService.onOpponentWon(() => {
        setPhase("game_over");
        addLoss(score);
      });
    }
    return () => {
      // Cleanup listeners if needed
    };
  }, [isOnlineMode, handleRemoteMove, addLoss, score]);

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
      if (tile.flipped || (isOnlineMode && !isMyTurn)) return;

      const newGrid = [...grid];
      newGrid[tile.id].flipped = true;
      setGrid(newGrid);

      if (isOnlineMode) {
        socketService.emitMove(tile.id);
        setIsMyTurn(false);
      }

      if (tile.type === "bomb") {
        playSound("bomb");
        triggerHeartShake();
        const newLives = lives - 1;
        setLives(newLives);
        setCombo(1);
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
        const newCombo = Math.min(combo + 0.2, 5);
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
        if (isOnlineMode) socketService.emitWin();
      }
    }
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <GameHeader
        phase={phase}
        isOnlineMode={isOnlineMode}
        isMyTurn={isMyTurn}
        lives={lives}
        opponentLives={opponentLives}
        score={score}
        combo={combo}
        theme={theme}
        isDark={isDark}
        animatedHeartStyle={animatedHeartStyle}
        selectedBombsLength={selectedBombs.length}
        bombsCount={BOMBS_COUNT}
      />

      <View
        style={[
          styles.gridCard,
          { backgroundColor: isDark ? "#121212" : "#FFF" },
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
            onPress={() => setPhase("setup_heart")}
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
          fadeOut
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
  container: { flex: 1, alignItems: "center", paddingTop: 40 },
  gridCard: {
    padding: 10,
    borderRadius: 24,
    elevation: 8,
    shadowColor: "#000",
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
  footer: { marginTop: 40, width: "100%", alignItems: "center" },
  mainButton: {
    flexDirection: "row",
    paddingHorizontal: 35,
    paddingVertical: 16,
    borderRadius: 35,
    elevation: 6,
    alignItems: "center",
  },
  mainButtonText: { color: "#FFF", fontSize: 18, fontWeight: "800" },
});
