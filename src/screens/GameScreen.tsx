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
import { multiplayerService } from "../services/multiplayerService";
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
  const roomCode = route.params?.roomCode;

  const { theme, isDark } = useTheme();
  const { addWin, addLoss } = useGameStore();

  // --- Game State ---
  const [lives, setLives] = useState(3);
  const [myGrid, setMyGrid] = useState<Tile[]>([]);
  const [opponentGrid, setOpponentGrid] = useState<Tile[]>([]);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);

  // --- Multiplayer State ---
  const [isMyTurn, setIsMyTurn] = useState(!isOnlineMode);
  const [opponentLives, setOpponentLives] = useState(3);
  const [lastRemoteMoveId, setLastRemoteMoveId] = useState<number | null>(null);

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

    setMyGrid(tiles);
    setLives(3);
    setScore(0);
    setCombo(1);
    setMaxCombo(1);
    setPhase("playing");
  }, []);

  const startSetup = useCallback(() => {
    setMyGrid(
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
    } else if (
      isOnlineMode &&
      route.params?.myBoard &&
      route.params?.opponentBoard
    ) {
      setMyGrid(route.params.myBoard);
      setOpponentGrid(route.params.opponentBoard);
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
      setLastRemoteMoveId(tileId);
      setOpponentGrid((prevGrid) => {
        const newGrid = [...prevGrid];
        if (newGrid[tileId] && !newGrid[tileId].flipped) {
          newGrid[tileId].flipped = true;

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
    if (isOnlineMode && roomCode) {
      multiplayerService.onMoveReceived(roomCode, (data: any) => {
        if (data && data.tileId !== undefined) {
          handleRemoteMove(data.tileId);
        }
      });

      multiplayerService.onTurnChanged(roomCode, (turn) => {
        const amIHost = route.params.isHost;
        const myTurnString = amIHost ? "host" : "opponent";
        const itIsMyTurn = turn === myTurnString;

        setIsMyTurn(itIsMyTurn);
      });

      multiplayerService.onGameOver(roomCode, (winner) => {
        const amIHost = route.params.isHost;
        const didIWin =
          (amIHost && winner === "host") || (!amIHost && winner === "opponent");

        if (didIWin) {
          setPhase("game_won");
          playSound("win");
          addWin(score, maxCombo);
        } else {
          setPhase("game_over");
          addLoss(score);
        }
      });

      return () => {
        if (roomCode) multiplayerService.cleanup(roomCode);
      };
    }
  }, [
    isOnlineMode,
    roomCode,
    handleRemoteMove,
    addWin,
    addLoss,
    score,
    maxCombo,
    playSound,
    route.params.isHost,
  ]);

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

      const newGrid = [...myGrid];
      newGrid[tile.id].flipped = true;
      setMyGrid(newGrid);

      if (isOnlineMode && roomCode) {
        multiplayerService.emitMove(roomCode, tile.id);
        setLastRemoteMoveId(null); // Clear ours when we move
        multiplayerService.updateTurn(
          roomCode,
          route.params.isHost ? "opponent" : "host",
        );
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
          if (isOnlineMode && roomCode) {
            multiplayerService.emitGameOver(
              roomCode,
              route.params.isHost ? "opponent" : "host",
            );
          }
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
        if (isOnlineMode && roomCode) {
          multiplayerService.emitGameOver(
            roomCode,
            route.params.isHost ? "host" : "opponent",
          );
        }
      }
    }
  };

  const startCustomGame = () => {
    playSound("flip");
    const newGrid = [...myGrid];
    selectedBombs.forEach((id) => (newGrid[id].type = "bomb"));
    if (selectedHeart !== null) newGrid[selectedHeart].type = "heart";
    setMyGrid(newGrid);
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

      {isOnlineMode && (
        <View style={styles.opponentSection}>
          <Text style={[styles.sectionTitle, { color: theme.secondary }]}>
            ENEMY FIELD
          </Text>
          <View style={styles.opponentGridMini}>
            {opponentGrid.map((tile, idx) => (
              <GameTile
                key={`opp-${tile.id}`}
                tile={tile}
                onPress={() => {}}
                isDark={isDark}
                theme={theme}
                phase={phase}
                selectedBombs={[]}
                selectedHeart={null}
                index={idx}
                isLastRemoteMove={lastRemoteMoveId === tile.id}
                size={miniTileSize}
              />
            ))}
          </View>
        </View>
      )}

      <View
        style={[
          styles.gridCard,
          {
            backgroundColor: isDark ? "#121212" : "#FFF",
            marginTop: isOnlineMode ? 20 : 0,
          },
        ]}
        pointerEvents={isOnlineMode && !isMyTurn ? "none" : "auto"}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.primary, marginBottom: 10 },
          ]}
        >
          {isOnlineMode ? "YOUR FIELD" : ""}
        </Text>
        <View
          style={[styles.grid, isOnlineMode && !isMyTurn && { opacity: 0.7 }]}
        >
          {myGrid.map((tile, idx) => (
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
  footer: { marginTop: 20, width: "100%", alignItems: "center" },
  mainButton: {
    flexDirection: "row",
    paddingHorizontal: 35,
    paddingVertical: 16,
    borderRadius: 35,
    elevation: 6,
    alignItems: "center",
  },
  mainButtonText: { color: "#FFF", fontSize: 18, fontWeight: "800" },
  opponentSection: {
    width: "90%",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 5,
  },
  opponentGridMini: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    opacity: 0.8,
  },
});

const miniTileSize = (screenWidth * 0.45) / 4;
