import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Tile } from "../components/game/types";
import { PlayerItem } from "../components/multiplayer/PlayerItem";
import { multiplayerService } from "../services/multiplayerService";
import { useGameStore } from "../store/gameStore";
import { useTheme } from "../theme/ThemeContext";

const GRID_SIZE = 4;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
const BOMBS_COUNT = 5;
const HEARTS_COUNT = 1;

export default function WaitingRoomScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useTheme();
  const { profile } = useGameStore();

  const { isHost, roomCode: joinCode } = route.params;
  const [roomCode, setRoomCode] = useState(joinCode || "");
  const [status, setStatus] = useState("Connecting to Firebase...");
  const [opponent, setOpponent] = useState<any>(null);

  const generateBoard = useCallback(() => {
    const tiles: Tile[] = Array.from({ length: TOTAL_TILES }, (_, i) => ({
      id: i,
      type: "safe",
      flipped: false,
    }));

    let bombsPlaced = 0;
    while (bombsPlaced < BOMBS_COUNT) {
      const idx = Math.floor(Math.random() * TOTAL_TILES);
      if (tiles[idx].type === "safe") {
        tiles[idx].type = "bomb";
        bombsPlaced++;
      }
    }

    let heartsPlaced = 0;
    while (heartsPlaced < HEARTS_COUNT) {
      const idx = Math.floor(Math.random() * TOTAL_TILES);
      if (tiles[idx].type === "safe") {
        tiles[idx].type = "heart";
        heartsPlaced++;
      }
    }
    return tiles;
  }, []);

  const handleStartGame = async () => {
    if (!roomCode) return;
    const hostBoard = generateBoard();
    const opponentBoard = generateBoard();
    await multiplayerService.startGame(roomCode, { hostBoard, opponentBoard });
    navigation.navigate("Game", {
      mode: "online",
      myBoard: hostBoard,
      opponentBoard: opponentBoard,
      isHost: true,
      roomCode,
      opponentProfile: opponent,
    });
  };

  useEffect(() => {
    const playerData = {
      name: profile.name,
      avatar: profile.avatar,
      handle: profile.handle,
    };

    const setupMultiplayer = async () => {
      try {
        if (isHost) {
          const code = await multiplayerService.createRoom(playerData);
          setRoomCode(code);
          setStatus("Room created! Waiting for opponent...");

          multiplayerService.onOpponentJoined(code, (opponentProfile) => {
            setOpponent(opponentProfile);
            setStatus("Opponent ready! You can start the battle.");
          });
        } else {
          const result = await multiplayerService.joinRoom(
            joinCode,
            playerData,
          );
          if (result.success) {
            setOpponent(result.host);
            setStatus("Joined! Waiting for Host to start...");

            multiplayerService.onGameStarted(joinCode, (gameData) => {
              navigation.navigate("Game", {
                mode: "online",
                myBoard: gameData.opponentBoard, // We are opponent, so opponentBoard is our board
                opponentBoard: gameData.hostBoard,
                isHost: false,
                roomCode: joinCode,
                opponentProfile: result.host,
              });
            });
          } else {
            setStatus("Error: Room not found or full.");
          }
        }
      } catch (error) {
        console.error(error);
        setStatus("Firebase Error: Check your connection.");
      }
    };

    setupMultiplayer();

    return () => {
      if (roomCode) multiplayerService.cleanup(roomCode);
    };
  }, [navigation, isHost, joinCode]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my Cub Blast battle! Room Code: ${roomCode}`,
      });
    } catch (error: any) {
      console.log(error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Battle Lobby</Text>
        <View
          style={[
            styles.codeBox,
            { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" },
          ]}
        >
          <Text style={[styles.codeLabel, { color: isDark ? "#888" : "#666" }]}>
            BATTLE CODE
          </Text>
          <Text style={[styles.codeText, { color: theme.primary }]}>
            {roomCode || "------"}
          </Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={theme.primary} />
            <Text style={[styles.shareText, { color: theme.primary }]}>
              Invite Opponent
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.playersList}>
        <PlayerItem
          name={profile.name}
          status="Ready"
          isReady={true}
          isConnecting={false}
          isDark={isDark}
          theme={theme}
          isMaster={isHost}
          avatar={profile.avatar}
        />

        <PlayerItem
          name={opponent ? opponent.name : "Waiting..."}
          status={opponent ? "Ready" : "Searching..."}
          isReady={!!opponent}
          isConnecting={!opponent}
          isDark={isDark}
          theme={theme}
          isMaster={!isHost}
          avatar={opponent ? opponent.avatar : null}
        />
      </View>

      <View style={styles.footer}>
        {isHost && opponent && (
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: theme.primary }]}
            onPress={handleStartGame}
          >
            <Text style={styles.startText}>START BATTLE</Text>
          </TouchableOpacity>
        )}
        <ActivityIndicator
          color={theme.primary}
          size="large"
          style={{ marginBottom: 10 }}
        />
        <Text style={[styles.statusText, { color: isDark ? "#AAA" : "#666" }]}>
          {status}
        </Text>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>Leave Battle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30 },
  header: { alignItems: "center", marginTop: 20 },
  title: { fontSize: 24, fontWeight: "900", marginBottom: 30 },
  codeBox: {
    width: "100%",
    padding: 25,
    borderRadius: 24,
    alignItems: "center",
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 10,
  },
  codeText: {
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 8,
    marginBottom: 20,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: "rgba(52, 120, 246, 0.1)",
    borderRadius: 12,
  },
  shareText: { marginLeft: 8, fontWeight: "700" },
  playersList: { marginTop: 50, flex: 1 },
  footer: { alignItems: "center", paddingBottom: 40 },
  statusText: { marginTop: 15, fontSize: 15, fontWeight: "600" },
  startButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  startText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
  cancelButton: { marginTop: 30 },
  cancelText: { color: "#FF3B30", fontWeight: "700" },
});
