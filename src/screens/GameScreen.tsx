import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAudioPlayer } from "expo-audio";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

// Components
import { GameTile } from "../components/game/GameTile";
import { Tile, TileType } from "../components/game/types";

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
  const navigation = useNavigation<any>();

  // Extract params
  const {
    mode = "random",
    roomCode,
    playerId: paramPlayerId,
    isHost,
    opponentId,
  } = route.params || {};
  const isOnlineMode = mode === "online";
  const playerId = paramPlayerId || "You"; // Fallback for offline

  const { theme, isDark } = useTheme();
  const { addWin, addLoss } = useGameStore();

  // Track if stats have been updated to prevent duplicates
  const statsUpdated = React.useRef(false);

  // --- Game State ---
  const [phase, setPhase] = useState<
    "setup" | "waiting" | "playing" | "game_over"
  >("setup");
  const [myGrid, setMyGrid] = useState<Tile[]>([]);
  const [myLives, setMyLives] = useState(3);
  const [opponentGrid, setOpponentGrid] = useState<Tile[]>([]);
  const [opponentLives, setOpponentLives] = useState(3);
  const [currentTurn, setCurrentTurn] = useState<string>("");
  const [winner, setWinner] = useState<string | null>(null);

  // Version Control (Online Only)
  const lastProcessedVersion = React.useRef<number>(0);

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
        if (player) {
          player.seekTo(0);
          player.play();
        }
      } catch (e) {
        console.log(e);
      }
    },
    [flipPlayer, bombPlayer, heartPlayer, winPlayer],
  );

  // Helper: Generate Random Grid
  const generateRandomGrid = () => {
    const grid = Array.from({ length: TOTAL_TILES }, (_, i) => ({
      id: i,
      type: "safe" as TileType,
      flipped: false,
    }));

    let placedBombs = 0;
    while (placedBombs < BOMBS_COUNT) {
      const idx = Math.floor(Math.random() * TOTAL_TILES);
      if (grid[idx].type === "safe") {
        grid[idx].type = "bomb";
        placedBombs++;
      }
    }

    let placedHearts = 0;
    while (placedHearts < HEARTS_COUNT) {
      const idx = Math.floor(Math.random() * TOTAL_TILES);
      if (grid[idx].type === "safe") {
        grid[idx].type = "heart";
        placedHearts++;
      }
    }
    return grid;
  };

  // --- Initialization ---
  useEffect(() => {
    statsUpdated.current = false;
    setMyLives(3);
    setOpponentLives(3);
    setWinner(null);

    if (isOnlineMode) {
      // Online: Wait for setup
      const emptyGrid = Array.from({ length: TOTAL_TILES }, (_, i) => ({
        id: i,
        type: "safe" as TileType,
        flipped: false,
      }));
      setMyGrid(emptyGrid);
      setOpponentGrid(emptyGrid);
      setPhase("setup");
    } else {
      // Offline Modes
      if (mode === "random") {
        // Bot Match: Both Random, Start Immediately
        setMyGrid(generateRandomGrid());
        setOpponentGrid(generateRandomGrid());
        setPhase("playing");
        setCurrentTurn(playerId);
      } else {
        // Custom / Duel: Manual Setup for Me, Random for Opponent (Bot)
        const emptyGrid = Array.from({ length: TOTAL_TILES }, (_, i) => ({
          id: i,
          type: "safe" as TileType,
          flipped: false,
        }));
        setMyGrid(emptyGrid);
        setOpponentGrid(generateRandomGrid());
        setPhase("setup");
      }
    }
  }, [mode, roomCode, isOnlineMode, playerId]);

  // --- Online Logic ---
  useEffect(() => {
    if (!isOnlineMode || !roomCode) return;

    // 1. Subscribe to BROADCAST
    const unsubscribeBroadcast = multiplayerService.subscribeToBroadcast(
      roomCode,
      (event) => {
        if (event.type === "attack") {
          const { targetId, tileIndex, damage, nextTurn } = event.payload;

          if (targetId === playerId) {
            setMyGrid((prev) =>
              prev.map((t, i) => {
                if (i === tileIndex && !t.flipped) {
                  if (damage > 0) playSound("bomb");
                  else playSound("flip");
                  return { ...t, flipped: true };
                }
                return t;
              }),
            );
            if (damage > 0) {
              setMyLives((prev) => Math.max(0, prev - damage));
            }
          }

          setCurrentTurn(nextTurn);

          if (event.payload.version) {
            lastProcessedVersion.current = Math.max(
              lastProcessedVersion.current,
              event.payload.version,
            );
          }
        }
      },
    );

    // 2. Subscribe to ROOM updates
    const unsubscribe = multiplayerService.subscribeToRoom(roomCode, (room) => {
      // Game Started logic
      if (room.status === "playing") {
        setPhase((prevPhase) => {
          if (prevPhase !== "playing" && prevPhase !== "game_over") {
            return "playing";
          }
          return prevPhase;
        });

        // Load Opponent Board Data
        const oppId = isHost ? room.opponent_id : room.host_id;
        if (oppId && room.game_state[oppId]?.boardConfig) {
          setOpponentGrid((prev) => {
            // Only load if not already loaded to avoid overwrite?
            // Actually safe to overwrite if we preserve flips, but here flips come from sync.
            // We'll trust syncGameState for detailed updates.
            if (prev.length > 0 && prev[0].type !== "safe") return prev; // optimization?
            return room.game_state[oppId].boardConfig.map((t: Tile) => ({
              ...t,
              flipped: false,
            }));
          });
        }
        if (room.game_state.turn) setCurrentTurn(room.game_state.turn);
      }

      // Live Sync
      if (room.status === "playing" || room.status === "game_over") {
        // Sync My Defending Board
        const myState = room.game_state[playerId];
        if (myState && myState.revealedIndexes) {
          setMyGrid((prev) =>
            prev.map((t, i) => {
              if (myState.revealedIndexes.includes(i) && !t.flipped) {
                if (t.type === "bomb") playSound("bomb");
                else playSound("flip");
                return { ...t, flipped: true };
              }
              return t;
            }),
          );
          setMyLives(myState.lives);
        }

        // Sync Opponent Board
        const oppId = isHost ? room.opponent_id : room.host_id;
        if (oppId && room.game_state[oppId]) {
          const oppState = room.game_state[oppId];
          setOpponentLives(oppState.lives);
          if (oppState.revealedIndexes) {
            setOpponentGrid((prev) =>
              prev.map((t, i) => {
                const shouldFlip = oppState.revealedIndexes.includes(i);
                if (shouldFlip && !t.flipped) {
                  return { ...t, flipped: true };
                }
                return t;
              }),
            );
          }
        }

        // Check Winner
        if (myState?.lives === 0)
          setWinner(room.game_state.opponentName || "Opponent");
        const oppState =
          room.game_state[isHost ? room.opponent_id! : room.host_id];
        if (oppState?.lives === 0) setWinner("You");
      }
    });

    return () => {
      unsubscribe();
      unsubscribeBroadcast();
    };
  }, [isOnlineMode, roomCode, playerId, isHost]);

  // --- Stats Persistence ---
  useEffect(() => {
    if (winner && !statsUpdated.current) {
      statsUpdated.current = true;
      if (winner === "You") {
        const score = 1000 + myLives * 500;
        addWin(score, 1);
      } else {
        addLoss(200);
      }
    }
  }, [winner, myLives, addWin, addLoss]);

  // --- Handlers ---
  const handleSetupPress = (tile: Tile) => {
    const bombsCount = myGrid.filter((t) => t.type === "bomb").length;
    const heartCount = myGrid.filter((t) => t.type === "heart").length;

    setMyGrid((prev) =>
      prev.map((t) => {
        if (t.id === tile.id) {
          let next: TileType = "safe";
          if (t.type === "safe") {
            if (bombsCount < BOMBS_COUNT) next = "bomb";
            else if (heartCount < HEARTS_COUNT) next = "heart";
            else next = "safe";
          } else if (t.type === "bomb") {
            if (heartCount < HEARTS_COUNT) next = "heart";
            else next = "safe";
          } else {
            next = "safe";
          }
          return { ...t, type: next };
        }
        return t;
      }),
    );
    playSound("flip");
  };

  const confirmSetup = async () => {
    const bombs = myGrid.filter((t) => t.type === "bomb").length;
    const hearts = myGrid.filter((t) => t.type === "heart").length;

    if (bombs !== BOMBS_COUNT || hearts !== HEARTS_COUNT) {
      Alert.alert(
        "Setup Incomplete",
        `Place ${BOMBS_COUNT} bombs and ${HEARTS_COUNT} heart.`,
      );
      return;
    }

    if (isOnlineMode) {
      setPhase("waiting");
      try {
        const resultStatus = await multiplayerService.submitBoard(
          roomCode,
          playerId,
          myGrid,
        );
        if (resultStatus === "playing") {
          setPhase("playing");
        }
      } catch (e) {
        console.error("[GameScreen] submitBoard failed:", e);
      }
    } else {
      // Offline Custom: Start Game
      setPhase("playing");
      setCurrentTurn(playerId);
    }
  };

  const handleAttack = async (tile: Tile) => {
    if (phase !== "playing") return;
    if (currentTurn !== playerId) {
      if (isOnlineMode) Alert.alert("Wait!", "It's the opponent's turn.");
      return;
    }
    if (tile.flipped) return;

    // 1. Reveal locally
    const newGrid = [...opponentGrid];
    const targetTile = newGrid[tile.id];
    targetTile.flipped = true;
    setOpponentGrid(newGrid);

    let newOppLives = opponentLives;
    if (targetTile.type === "bomb") {
      playSound("bomb");
      newOppLives = Math.max(0, opponentLives - 1);
      setOpponentLives(newOppLives);
    } else if (targetTile.type === "heart") {
      playSound("heart");
    } else {
      playSound("flip");
    }

    if (isOnlineMode) {
      // --- ONLINE ---
      const targetId = opponentId;
      if (targetId) {
        const nextVersion = lastProcessedVersion.current + 1;
        lastProcessedVersion.current = nextVersion;

        multiplayerService.sendGameplayEvent(roomCode, {
          type: "attack",
          payload: {
            targetId: targetId,
            tileIndex: tile.id,
            damage: tile.type === "bomb" ? 1 : 0,
            nextTurn: targetId,
            version: nextVersion,
          },
        });
        setCurrentTurn(targetId);

        const revealed = newGrid.filter((t) => t.flipped).map((t) => t.id);
        multiplayerService
          .handleAttack(roomCode, targetId, newOppLives, revealed, targetId)
          .catch((e) => console.log(e));
      }
    } else {
      // --- OFFLINE BOT ---
      setCurrentTurn("Bot");

      if (newOppLives === 0) {
        setWinner("You");
        setPhase("game_over");
        return;
      }

      // Bot Turn logic
      setTimeout(() => {
        if (myLives <= 0) return;

        setMyGrid((prev) => {
          const unrevealed = prev.filter((t) => !t.flipped);
          if (unrevealed.length === 0) return prev;

          const choice =
            unrevealed[Math.floor(Math.random() * unrevealed.length)];
          const nextGrid = prev.map((t) => {
            if (t.id === choice.id) return { ...t, flipped: true };
            return t;
          });

          let damage = 0;
          if (choice.type === "bomb") {
            playSound("bomb");
            damage = 1;
          } else {
            playSound("flip");
          }

          setMyLives((lives) => {
            const nextLives = Math.max(0, lives - damage);
            if (nextLives === 0) {
              setWinner("Bot");
              setPhase("game_over");
            }
            return nextLives;
          });

          setCurrentTurn(playerId);
          return nextGrid;
        });
      }, 800);
    }
  };

  const syncGameState = useCallback(async () => {
    try {
      const room = await multiplayerService.getRoomData(roomCode);
      if (!room) return;

      const myState = room.game_state[playerId];
      const oppId = isHost ? room.opponent_id : room.host_id;
      const oppState = oppId ? room.game_state[oppId] : null;

      if (myState?.lives === 0) {
        setWinner(room.game_state.opponentName || "Opponent");
        setPhase("game_over");
      } else if (oppState?.lives === 0) {
        setWinner("You");
        setPhase("game_over");
      } else if (room.status === "playing") {
        if (phase !== "playing") setPhase("playing");

        const serverVersion = room.game_state.version || 0;
        if (serverVersion < lastProcessedVersion.current) return;
        lastProcessedVersion.current = serverVersion;

        if (room.game_state.turn && room.game_state.turn !== currentTurn) {
          setCurrentTurn(room.game_state.turn);
        }

        if (oppId && oppState) {
          if (oppState.lives !== undefined) setOpponentLives(oppState.lives);
          if (oppState.boardConfig) {
            setOpponentGrid((prev) => {
              return prev.map((t, i) => {
                const serverType = oppState.boardConfig[i]?.type || "safe";
                const serverFlipped = oppState.revealedIndexes?.includes(i);
                const isFlipped = t.flipped || serverFlipped;
                return { ...t, id: i, type: serverType, flipped: isFlipped };
              });
            });
          }
        }
        if (myState) {
          if (myState.lives !== undefined) setMyLives(myState.lives);
          if (myState.revealedIndexes) {
            setMyGrid((prev) =>
              prev.map((t, i) => {
                const serverFlipped = myState.revealedIndexes.includes(i);
                if (serverFlipped && !t.flipped) {
                  return { ...t, flipped: true };
                }
                return t;
              }),
            );
          }
        }
      }
    } catch (e) {}
  }, [roomCode, playerId, currentTurn, isHost, phase]);

  // --- Polling (Online Only) ---
  useEffect(() => {
    if (!roomCode || !isOnlineMode) return;
    syncGameState();
    const interval = setInterval(() => syncGameState(), 2000);
    return () => clearInterval(interval);
  }, [syncGameState, roomCode, isOnlineMode]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HUD */}
      <View style={styles.hud}>
        <View style={styles.playerStats}>
          <Ionicons name="person" size={20} color={isDark ? "#FFF" : "#333"} />
          <Text style={[styles.statsText, { color: theme.text }]}>
            You: {myLives} ❤️
          </Text>
        </View>

        <View style={styles.turnBadge}>
          {phase === "playing" ? (
            <Text
              style={[
                styles.turnText,
                { color: currentTurn === playerId ? "#4CAF50" : "#F44336" },
              ]}
            >
              {currentTurn === playerId ? "YOUR TURN" : "THEIR TURN"}
            </Text>
          ) : (
            <Text style={styles.turnText}>
              {phase === "setup" ? "SETUP" : "WAITING"}
            </Text>
          )}
        </View>
        <View style={styles.playerStats}>
          <Ionicons name="skull" size={20} color={isDark ? "#FFF" : "#333"} />
          <Text style={[styles.statsText, { color: theme.text }]}>
            {" "}
            Enemy: {opponentLives} ❤️
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ENEMY BOARD */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Enemy Territory (Attack!)
        </Text>
        <View
          style={[
            styles.gridContainer,
            {
              opacity:
                phase === "playing" && currentTurn === playerId ? 1 : 0.5,
            },
          ]}
        >
          {phase === "playing" ? (
            <View style={styles.grid}>
              {opponentGrid.map((tile, i) => (
                <GameTile
                  key={`opp-${i}`}
                  tile={tile}
                  index={i}
                  theme={theme}
                  isDark={isDark}
                  onPress={() => handleAttack(tile)}
                  phase={phase}
                  size={screenWidth / 6.5}
                />
              ))}
            </View>
          ) : (
            <View style={styles.placeholder}>
              <Text style={{ color: "#888" }}>Waiting for game start...</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* MY BOARD */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          My Base (Defend)
        </Text>
        <View style={styles.gridContainer}>
          <View style={styles.grid}>
            {myGrid.map((tile, i) => (
              <GameTile
                key={`my-${i}`}
                tile={tile}
                index={i}
                theme={theme}
                isDark={isDark}
                onPress={() => phase === "setup" && handleSetupPress(tile)}
                phase={phase === "setup" ? "setup_bombs" : "playing"}
                size={screenWidth / 6.5}
              />
            ))}
          </View>
        </View>

        {phase === "setup" && (
          <TouchableOpacity
            style={[styles.readyButton, { backgroundColor: theme.primary }]}
            onPress={confirmSetup}
          >
            <Text style={styles.readyText}>READY</Text>
          </TouchableOpacity>
        )}

        {phase === "waiting" && (
          <View style={{ alignItems: "center" }}>
            <ActivityIndicator
              size="large"
              color={theme.primary}
              style={{ marginTop: 20 }}
            />
            <Text style={{ marginTop: 20, color: theme.text, fontSize: 12 }}>
              Waiting for other player...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* WINNER MODAL */}
      <Modal visible={!!winner} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.winnerText, { color: theme.text }]}>
              Game Won By
            </Text>
            <Text style={[styles.winnerName, { color: theme.primary }]}>
              {winner}
            </Text>
            <TouchableOpacity
              style={[styles.homeButton, { backgroundColor: theme.primary }]}
              onPress={() => navigation.popToTop()}
            >
              <Text style={styles.homeButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
        {winner && <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} />}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  hud: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
    height: 50,
  },
  playerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statsText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  turnBadge: {
    backgroundColor: "#EEE",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  turnText: {
    fontWeight: "900",
    fontSize: 14,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 50,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    opacity: 0.7,
  },
  gridContainer: {
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 10,
    borderRadius: 20,
  },
  grid: {
    width: screenWidth - 40,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  placeholder: {
    width: screenWidth - 40,
    height: screenWidth - 40,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    width: "80%",
    height: 2,
    backgroundColor: "#DDD",
    marginVertical: 20,
  },
  readyButton: {
    marginTop: 20,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 5,
  },
  readyText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    elevation: 10,
  },
  winnerText: {
    fontSize: 20,
    marginBottom: 10,
  },
  winnerName: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 30,
  },
  homeButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  homeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
