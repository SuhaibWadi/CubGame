import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { multiplayerService, RoomData } from "../services/multiplayerService";
import { useTheme } from "../theme/ThemeContext";

export default function WaitingRoomScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { roomCode, playerId, isHost } = route.params || {};

  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [status, setStatus] = useState("Waiting for opponent...");

  useEffect(() => {
    if (!roomCode) {
      Alert.alert("Error", "No room code provided");
      navigation.goBack();
      return;
    }

    // Subscribe to room updates
    const unsubscribe = multiplayerService.subscribeToRoom(roomCode, (room) => {
      console.log("Room update:", room);
      setRoomData(room);

      if (room.status === "playing" || (room.opponent_id && room.host_id)) {
        // Game is ready!
        // We add a slight delay so the user sees "Connected!"
        setStatus("Opponent Connected! Starting...");
        setTimeout(() => {
          navigation.replace("Game", {
            mode: "online",
            roomCode,
            playerId,
            isHost: room.host_id === playerId,
            opponentId:
              room.host_id === playerId ? room.opponent_id : room.host_id,
          });
        }, 1500);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomCode, playerId, navigation]);

  const copyCode = async () => {
    await Clipboard.setStringAsync(roomCode);
  };

  const shareCode = async () => {
    try {
      await Share.share({
        message: `Join my Cub Blast game! Room Code: ${roomCode}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.card}>
        <Text style={[styles.header, { color: theme.text }]}>Room Code</Text>

        <TouchableOpacity style={styles.codeContainer} onPress={copyCode}>
          <Text style={styles.code}>{roomCode}</Text>
          <Ionicons
            name="copy-outline"
            size={24}
            color={theme.text}
            style={{ marginLeft: 10 }}
          />
        </TouchableOpacity>

        <Text style={[styles.subtext, { color: isDark ? "#CCC" : "#666" }]}>
          {status}
        </Text>

        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: theme.primary }]}
          onPress={shareCode}
        >
          <Ionicons name="share-social" size={24} color="#FFF" />
          <Text style={styles.shareButtonText}>Share Code</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: "red", fontSize: 16 }}>Cancel Return</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 350,
    padding: 30,
    borderRadius: 24,
    backgroundColor: "rgba(120,120,120,0.1)",
    alignItems: "center",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    marginBottom: 30,
  },
  code: {
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 5,
    color: "#0B845C",
  },
  subtext: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    gap: 10,
  },
  shareButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 50,
    padding: 15,
  },
});
