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
    // 1. Connect to Socket
    socketService.connect();

    if (isHost) {
      // 2. Create the room on the server
      socketService.createRoom((newCode) => {
        setRoomCode(newCode);
        setStatus("Room created! Waiting for opponent...");
      });
    } else {
      // 3. Join the existing room
      socketService.joinRoom(joinCode, (success) => {
        if (success) {
          setStatus("Joined successfully! Waiting for host to start...");
        } else {
          setStatus("Error: Room not found or full.");
        }
      });
    }

    // 4. Listen for opponent
    socketService.onOpponentJoined((player) => {
      setOpponent(player);
      setStatus("Opponent ready! Starting game...");
    });

    // 5. Listen for Game Start (from server)
    socketService.onGameStart((gameData) => {
      navigation.navigate("Game", { mode: "online", board: gameData.board });
    });

    return () => {
      // Avoid disconnecting globally if we want to stay connected in game
      // but we should clean up listeners if needed
    };
  }, []);

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
            {roomCode}
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
        <View
          style={[
            styles.playerItem,
            { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Ionicons name="person" size={24} color="#FFF" />
          </View>
          <View style={styles.playerInfo}>
            <Text style={[styles.playerName, { color: theme.text }]}>
              You (Master)
            </Text>
            <Text style={styles.playerStatus}>Ready</Text>
          </View>
          <Ionicons name="checkmark-circle" size={24} color="#34C759" />
        </View>

        <View
          style={[
            styles.playerItem,
            { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7", opacity: 0.6 },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: "#8E8E93" }]}>
            <ActivityIndicator size="small" color="#FFF" />
          </View>
          <View style={styles.playerInfo}>
            <Text style={[styles.playerName, { color: theme.text }]}>
              Opponent
            </Text>
            <Text style={styles.playerStatus}>Connecting...</Text>
          </View>
        </View>
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
  container: {
    flex: 1,
    padding: 30,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 30,
  },
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
  shareText: {
    marginLeft: 8,
    fontWeight: "700",
  },
  playersList: {
    marginTop: 50,
    flex: 1,
  },
  playerItem: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 17,
    fontWeight: "700",
  },
  playerStatus: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  footer: {
    alignItems: "center",
    paddingBottom: 40,
  },
  statusText: {
    marginTop: 15,
    fontSize: 15,
    fontWeight: "600",
  },
  cancelButton: {
    marginTop: 30,
  },
  cancelText: {
    color: "#FF3B30",
    fontWeight: "700",
  },
});
