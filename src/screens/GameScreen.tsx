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
import { useTheme } from "../theme/ThemeContext";

const GRID_SIZE = 4;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
const BOMBS_COUNT = 5;
const HEARTS_COUNT = 1;

const screenWidth = Dimensions.get("window").width;
// Smaller tile size for better fit
// GRID_SIZE = 4. 4 tiles + margins.
// previous logic was auto.
// Let's rely on passing size prop.

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
  const isOnlineMode = route.params?.mode === "online";
  const { roomCode, playerId, isHost, opponentId } = route.params || {};

  const { theme, isDark } = useTheme();
  // We can use gameStore for offline stats, but for online logic we manage state locally
  // to avoid conflicting with single player store.

  // --- Game State ---
  const [phase, setPhase] = useState<
    "setup" | "waiting" | "playing" | "game_over"
  >("setup");

  // My Board (Defending)
  const [myGrid, setMyGrid] = useState<Tile[]>([]);
  const [myLives, setMyLives] = useState(3);

  // Opponent Board (Attacking)
  const [opponentGrid, setOpponentGrid] = useState<Tile[]>([]);
  const [opponentLives, setOpponentLives] = useState(3);

  const [currentTurn, setCurrentTurn] = useState<string>("");
  const [winner, setWinner] = useState<string | null>(null);

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
        console.log(e);
      }
    },
    [flipPlayer, bombPlayer, heartPlayer, winPlayer],
  );

  // --- Initialization ---
  useEffect(() => {
    // Initialize empty grids
    const emptyGrid = Array.from({ length: TOTAL_TILES }, (_, i) => ({
      id: i,
      type: "safe" as TileType,
      flipped: false,
    }));
    setMyGrid([...emptyGrid]);
    setOpponentGrid([...emptyGrid]);

    if (isOnlineMode) {
      setPhase("setup");
    } else {
      // Fallback for offline (not the focus now but keep simple)
      setPhase("setup"); // Or standard setup
    }
  }, [isOnlineMode]);

  // --- Online Logic ---
  useEffect(() => {
    if (!isOnlineMode || !roomCode) return;

    const unsubscribe = multiplayerService.subscribeToRoom(roomCode, (room) => {
      console.log(
        "[GameScreen] Subscription Update:",
        room.status,
        room.game_state?.version,
      );
      // Game Started logic
      if (room.status === "playing") {
        setPhase((prevPhase) => {
          // Only transition if we are not already playing
          if (prevPhase !== "playing" && prevPhase !== "game_over") {
            // Initialize Opponent Board logic here?
            // We need to do this OUTSIDE the state updater or use a separate synchronization effect.
            // Ideally, we just setPhase here, and a separate useEffect handles 'playing' mount?
            // Or we just do it here carefully.
            // We can't access stale closures easily if we remove deps.
            // But room data IS available here (payload).
            return "playing";
          }
          return prevPhase;
        });

        // Load Opponent Board Data (always safe to overwrite if we are playing)
        const oppId = isHost ? room.opponent_id : room.host_id;
        if (oppId && room.game_state[oppId]?.boardConfig) {
          // We should check if we already have it to avoid flicker?
          // But this runs on every update.
          // Actually, preventing re-set is good.
          setOpponentGrid((prev) => {
            if (prev.length > 0 && prev[0].flipped === undefined) return prev; // already set?
            // No, checking length is not enough.
            // Let's just map it. React handles diffing.
            return room.game_state[oppId].boardConfig.map((t: Tile) => ({
              ...t,
              flipped: false, // Start hidden
            }));
          });
        }

        if (room.game_state.turn) setCurrentTurn(room.game_state.turn);
      }

      // Listening to Moves
      if (room.status === "playing" || room.status === "game_over") {
        if (room.game_state.turn) setCurrentTurn(room.game_state.turn);

        // Sync My Defending Board
        const myState = room.game_state[playerId];
        if (myState && myState.revealedIndexes) {
          setMyGrid((prev) =>
            prev.map((t, i) => {
              if (myState.revealedIndexes.includes(i) && !t.flipped) {
                if (t.type === "bomb") playSound("bomb");
                else playSound("flip");
                return { ...t, flipped: true }; // This reveals the tile on My Board
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
                // Determine if we need to reveal
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
    };
  }, [isOnlineMode, roomCode, playerId, isHost]);

  // --- Handlers ---

  // Setup Phase: Place Bombs/Hearts on MyGrid
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
          } else if (t.type === "bomb") {
            if (heartCount < HEARTS_COUNT) next = "heart";
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

    setPhase("waiting");
    try {
      const resultStatus = await multiplayerService.submitBoard(
        roomCode,
        playerId,
        myGrid,
      );
      if (resultStatus === "playing") {
        setPhase("playing");

        // Trigger refresh immediately
        const room = await multiplayerService.getRoomData(roomCode);
        if (room) {
          // Turn
          if (room.game_state.turn) setCurrentTurn(room.game_state.turn);

          // Opponent
          const oppId = isHost ? room.opponent_id : room.host_id;
          if (oppId && room.game_state[oppId]) {
            const oppConfig = room.game_state[oppId].boardConfig;
            if (oppConfig) {
              setOpponentGrid((prev) => {
                if (prev.length > 0 && prev[0].flipped === undefined)
                  return prev;
                return oppConfig.map((t: any) => ({ ...t, flipped: false }));
              });
            }
            if (room.game_state[oppId].lives !== undefined) {
              setOpponentLives(room.game_state[oppId].lives);
            }
          }
        }
      }
    } catch (e) {
      console.error("[GameScreen] submitBoard failed:", e);
    }
  };

  // Playing Phase: Attack Opponent
  const handleAttack = async (tile: Tile) => {
    if (phase !== "playing") return;
    if (currentTurn !== playerId) {
      Alert.alert("Wait!", "It's the opponent's turn.");
      return;
    }
    if (tile.flipped) return;

    // 1. Reveal locally immediately for responsiveness
    const newGrid = [...opponentGrid];
    const targetTile = newGrid[tile.id];
    targetTile.flipped = true;
    setOpponentGrid(newGrid);

    let newOppLives = opponentLives;
    let hitBomb = false;

    if (targetTile.type === "bomb") {
      playSound("bomb");
      newOppLives = Math.max(0, opponentLives - 1);
      setOpponentLives(newOppLives);
      hitBomb = true;
    } else if (targetTile.type === "heart") {
      playSound("heart");
      // No effect for hitting a heart logic defined, just sound
    } else {
      playSound("flip");
    }

    // 2. Sync to DB
    const targetId = opponentId;

    if (targetId) {
      const revealed = newGrid.filter((t) => t.flipped).map((t) => t.id);

      // Atomic Update: Update Board AND Switch Turn
      // We read the latest room data inside the service usually, but here we construct the payload.
      // To be safe, we should fetch-merge-write or trust our local calculation if we are the turn holder.
      // Since we know it's our turn, we are the authority on the next state of the board.

      try {
        const room = await multiplayerService.getRoomData(roomCode);
        if (room) {
          const currentState = room.game_state;
          const nextState = {
            ...currentState,
            [targetId]: {
              ...currentState[targetId],
              lives: newOppLives,
              revealedIndexes: revealed,
            },
            turn: targetId, // Switch turn IMMEDIATELY in the same update
            version: (currentState.version || 0) + 1,
          };

          await multiplayerService.updateGameState(roomCode, nextState);
          setCurrentTurn(targetId); // Update local immediately
        }
      } catch (e) {
        console.error("Failed to sync attack:", e);
      }
    }
  };

  const syncGameState = async () => {
    try {
      const room = await multiplayerService.getRoomData(roomCode);
      if (!room) return;

      // Check Game Over
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

        // Sync Turn
        if (room.game_state.turn && room.game_state.turn !== currentTurn) {
          setCurrentTurn(room.game_state.turn);
        }

        // Sync Opponent
        if (oppId && oppState) {
          if (oppState.lives !== undefined) {
            setOpponentLives(oppState.lives);
          }

          // Sync Grid: Merge Types and Flips
          if (oppState.boardConfig) {
            setOpponentGrid((prev) => {
              return prev.map((t, i) => {
                const serverType = oppState.boardConfig[i]?.type || "safe";
                const serverFlipped = oppState.revealedIndexes?.includes(i);
                // Keep local flip if true (optimistic), otherwise use server
                const isFlipped = t.flipped || serverFlipped;

                return {
                  ...t,
                  id: i, // ensure ID consistency
                  type: serverType,
                  flipped: isFlipped,
                };
              });
            });
          }
        }

        // Sync My Board
        if (myState) {
          if (myState.lives !== undefined) setMyLives(myState.lives);
          if (myState.revealedIndexes) {
            setMyGrid((prev) =>
              prev.map((t, i) => {
                const serverFlipped = myState.revealedIndexes.includes(i);
                // For my board, we play sound if new flip detected (optional, but skip for sync fn)
                if (serverFlipped && !t.flipped) {
                  return { ...t, flipped: true };
                }
                return t;
              }),
            );
          }
        }
      }
    } catch (e) {
      // console.log("Sync failed:", e);
    }
  };

  // --- Polling Fallback ---
  useEffect(() => {
    if (!roomCode) return;

    // Initial sync
    syncGameState();

    const interval = setInterval(() => {
      syncGameState();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [phase, roomCode, isHost]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* --- HUD --- */}
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
        {/* --- TOP: ENEMY BOARD (ATTACK) --- */}
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

        {/* --- DIVIDER --- */}
        <View style={styles.divider} />

        {/* --- BOTTOM: MY BOARD (DEFEND) --- */}
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
                // "setup_bombs" allows editing. "playing" shows reveals.
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
            {/* DEBUG INFO: Helps user/dev see why it's waiting */}
            <Text style={{ marginTop: 20, color: theme.text, fontSize: 12 }}>
              Waiting for other player...
            </Text>
            <Text style={{ marginTop: 5, color: "#888", fontSize: 10 }}>
              DEBUG: {roomCode}
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
  debugContainer: {
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  debugText: {
    fontSize: 12,
    marginBottom: 5,
  },
  debugButton: {
    padding: 5,
    borderRadius: 5,
  },
  debugButtonText: {
    color: "white",
    fontSize: 10,
  },
});
