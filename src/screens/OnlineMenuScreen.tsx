import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { multiplayerService } from "../services/multiplayerService";
import { useTheme } from "../theme/ThemeContext";

export default function OnlineMenuScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Simple unique ID for this session/device
  // In a real app, use authentication or persisted device ID
  const [myPlayerId] = useState(() => {
    // We can use a random string for now, distinct per run
    return Math.random().toString(36).substring(7);
  });

  const handleCreateRoom = async () => {
    setLoading(true);
    const code = await multiplayerService.createRoom(myPlayerId, "Player 1");
    setLoading(false);

    if (code) {
      navigation.navigate("WaitingRoom", {
        roomCode: code,
        playerId: myPlayerId,
        isHost: true,
      });
    } else {
      Alert.alert("Error", "Could not create room. Please try again.");
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode || joinCode.length !== 6) {
      Alert.alert("Invalid Code", "Please enter a valid 6-digit room code.");
      return;
    }

    setLoading(true);
    const result = await multiplayerService.joinRoom(
      joinCode,
      myPlayerId,
      "Player 2",
    );
    setLoading(false);

    if (result.success) {
      navigation.navigate("WaitingRoom", {
        roomCode: joinCode,
        playerId: myPlayerId,
        isHost: false,
      });
    } else {
      Alert.alert("Error", result.error || "Could not join room.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <Ionicons
          name="planet"
          size={80}
          color={theme.primary}
          style={{ marginBottom: 20 }}
        />
        <Text style={[styles.title, { color: theme.text }]}>Online Battle</Text>
        <Text style={[styles.subtitle, { color: isDark ? "#CCC" : "#666" }]}>
          Challenge a friend to a duel!
        </Text>

        <View style={styles.actionContainer}>
          {/* Create Room Section */}
          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: theme.primary }]}
            onPress={handleCreateRoom}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.mainButtonText}>Create Room</Text>
                <Ionicons name="add-circle" size={24} color="#FFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View
              style={[
                styles.line,
                { backgroundColor: isDark ? "#333" : "#DDD" },
              ]}
            />
            <Text style={[styles.orText, { color: isDark ? "#666" : "#999" }]}>
              OR
            </Text>
            <View
              style={[
                styles.line,
                { backgroundColor: isDark ? "#333" : "#DDD" },
              ]}
            />
          </View>

          {/* Join Room Section */}
          <Text style={[styles.label, { color: theme.text }]}>
            Join with Code
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#222" : "#F5F5F5",
                color: theme.text,
                borderColor: isDark ? "#444" : "#DDD",
              },
            ]}
            placeholder="123456"
            placeholderTextColor="#888"
            keyboardType="number-pad"
            maxLength={6}
            value={joinCode}
            onChangeText={setJoinCode}
          />

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                borderColor: theme.primary,
                borderWidth: 2,
                opacity: joinCode.length === 6 ? 1 : 0.5,
              },
            ]}
            onPress={handleJoinRoom}
            disabled={loading || joinCode.length !== 6}
          >
            {loading ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <>
                <Text
                  style={[styles.secondaryButtonText, { color: theme.primary }]}
                >
                  Join Game
                </Text>
                <Ionicons name="enter" size={24} color={theme.primary} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
  },
  actionContainer: {
    width: "100%",
    maxWidth: 350,
    alignItems: "center",
  },
  mainButton: {
    width: "100%",
    height: 60,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  mainButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 30,
    gap: 15,
  },
  line: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  label: {
    alignSelf: "flex-start",
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  input: {
    width: "100%",
    height: 60,
    borderRadius: 20,
    paddingHorizontal: 20,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 5,
    borderWidth: 1,
    marginBottom: 20,
  },
  secondaryButton: {
    width: "100%",
    height: 60,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
