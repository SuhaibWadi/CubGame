import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AVATAR_MAP } from "../../theme/Avatars";

interface PlayerItemProps {
  name: string;
  status: string;
  isReady: boolean;
  isConnecting: boolean;
  isDark: boolean;
  theme: any;
  isMaster?: boolean;
  avatar?: string | null;
}

export const PlayerItem = ({
  name,
  status,
  isReady,
  isConnecting,
  isDark,
  theme,
  isMaster = false,
  avatar,
}: PlayerItemProps) => {
  return (
    <View
      style={[
        styles.playerItem,
        {
          backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
          opacity: isConnecting ? 0.6 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: isConnecting ? "#8E8E93" : "#FFF",
            overflow: "hidden",
          },
        ]}
      >
        {isConnecting ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : avatar && AVATAR_MAP[avatar] ? (
          <Image
            source={AVATAR_MAP[avatar]}
            style={styles.avatarImage}
            contentFit="cover"
          />
        ) : (
          <Ionicons name="person" size={24} color={theme.primary} />
        )}
      </View>
      <View style={styles.playerInfo}>
        <Text style={[styles.playerName, { color: theme.text }]}>
          {name} {isMaster ? "(Master)" : ""}
        </Text>
        <Text style={styles.playerStatus}>{status}</Text>
      </View>
      {isReady && (
        <Ionicons name="checkmark-circle" size={24} color="#34C759" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  avatarImage: {
    width: "100%",
    height: "100%",
  },
});
