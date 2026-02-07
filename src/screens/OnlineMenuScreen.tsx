import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";

export default function OnlineMenuScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const [roomCode, setRoomCode] = useState("");

  const handleCreateRoom = () => {
    // Navigate to WaitingRoom as host
    navigation.navigate("WaitingRoom", { isHost: true });
  };

  const handleJoinRoom = () => {
    if (roomCode.length === 6) {
      navigation.navigate("WaitingRoom", { isHost: false, roomCode });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <View
          style={[styles.iconCircle, { backgroundColor: theme.primary + "22" }]}
        >
          <Ionicons name="globe" size={40} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>
          Online Multiplayer
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? "#AAA" : "#666" }]}>
          Play with your friends anywhere in the world. yes
        </Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.primary }]}
          onPress={handleCreateRoom}
        >
          <Ionicons name="add-circle" size={24} color="#FFF" />
          <Text style={styles.buttonText}>Create Private Room</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View
            style={[
              styles.dividerLine,
              { backgroundColor: isDark ? "#333" : "#EEE" },
            ]}
          />
          <Text
            style={[styles.dividerText, { color: isDark ? "#666" : "#999" }]}
          >
            OR JOIN ROOM
          </Text>
          <View
            style={[
              styles.dividerLine,
              { backgroundColor: isDark ? "#333" : "#EEE" },
            ]}
          />
        </View>

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" },
          ]}
        >
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Enter 6-digit code"
            placeholderTextColor={isDark ? "#666" : "#999"}
            maxLength={6}
            keyboardType="number-pad"
            value={roomCode}
            onChangeText={setRoomCode}
          />
          <TouchableOpacity
            style={[
              styles.joinButton,
              { backgroundColor: roomCode.length === 6 ? "#34C759" : "#888" },
            ]}
            disabled={roomCode.length !== 6}
            onPress={handleJoinRoom}
          >
            <Ionicons name="enter" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 50,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  content: {
    width: "100%",
  },
  createButton: {
    flexDirection: "row",
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 10,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: "row",
    height: 60,
    borderRadius: 18,
    paddingHorizontal: 15,
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 4,
  },
  joinButton: {
    width: 45,
    height: 45,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
