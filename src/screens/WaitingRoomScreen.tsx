import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PlayerItem } from "../components/multiplayer/PlayerItem";
import { socketService } from "../services/socketService";
import { useTheme } from "../theme/ThemeContext";

export default function WaitingRoomScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useTheme();

  const { isHost, roomCode: joinCode } = route.params;
  const [roomCode, setRoomCode] = useState(joinCode || "");
  const [status, setStatus] = useState("Connecting to server...");
  const [opponent, setOpponent] = useState<any>(null);

  useEffect(() => {
    socketService.connect();

    if (isHost) {
      socketService.createRoom((newCode) => {
        setRoomCode(newCode);
        setStatus("Room created! Waiting for opponent...");
      });
    } else {
      socketService.joinRoom(joinCode, (success) => {
        if (success) {
          setStatus("Joined successfully! Waiting for host to start...");
        } else {
          setStatus("Error: Room not found or full.");
        }
      });
    }

    socketService.onOpponentJoined((player) => {
      setOpponent(player);
      setStatus("Opponent ready! Starting game...");
    });

    socketService.onGameStart((gameData) => {
      navigation.navigate("Game", { mode: "online", board: gameData.board });
    });

    return () => {};
  }, [navigation, isHost, joinCode]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my CubGame! Room Code: ${roomCode}`,
      });
    } catch (error: any) {
      console.log(error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Waiting Lobby</Text>
        <View
          style={[
            styles.codeBox,
            { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" },
          ]}
        >
          <Text style={[styles.codeLabel, { color: isDark ? "#888" : "#666" }]}>
            ROOM CODE
          </Text>
          <Text style={[styles.codeText, { color: theme.primary }]}>
            {roomCode || "------"}
          </Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={theme.primary} />
            <Text style={[styles.shareText, { color: theme.primary }]}>
              Invite Friend
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.playersList}>
        <PlayerItem
          name="You"
          status="Ready"
          isReady={true}
          isConnecting={false}
          isDark={isDark}
          theme={theme}
          isMaster={true}
        />

        <PlayerItem
          name={opponent ? "Opponent" : "Waiting..."}
          status={opponent ? "Ready" : "Searching..."}
          isReady={!!opponent}
          isConnecting={!opponent}
          isDark={isDark}
          theme={theme}
        />
      </View>

      <View style={styles.footer}>
        <ActivityIndicator color={theme.primary} size="large" />
        <Text style={[styles.statusText, { color: isDark ? "#AAA" : "#666" }]}>
          {status}
        </Text>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>Leave Room</Text>
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
  cancelButton: { marginTop: 30 },
  cancelText: { color: "#FF3B30", fontWeight: "700" },
});
