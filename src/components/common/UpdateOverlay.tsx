import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Updates from "expo-updates";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../theme/ThemeContext";

const { width, height } = Dimensions.get("window");

export const UpdateOverlay = () => {
  const { theme, isDark } = useTheme();
  const { isUpdateAvailable, isUpdatePending, isChecking, isDownloading } =
    Updates.useUpdates();

  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isDownloading || isChecking) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      rotation.value = 0;
    }
  }, [isDownloading, isChecking]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleReload = async () => {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      console.error("Failed to reload app:", e);
    }
  };

  if (!isUpdateAvailable && !isUpdatePending && !isChecking && !isDownloading) {
    return null;
  }

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.container}>
      <View style={styles.overlay}>
        <Animated.View
          entering={SlideInDown.springify()}
          exiting={SlideOutDown}
          style={[
            styles.card,
            { backgroundColor: isDark ? "#121212" : "#FFF" },
          ]}
        >
          <LinearGradient
            colors={[theme.primary, theme.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerIcon}
          >
            <Animated.View style={spinStyle}>
              <Ionicons
                name={isUpdatePending ? "cloud-done" : "cloud-download"}
                size={32}
                color="#FFF"
              />
            </Animated.View>
          </LinearGradient>

          <Text style={[styles.title, { color: theme.text }]}>
            {isUpdatePending ? "SYSTEM UPGRADED" : "INITIATING UPDATE"}
          </Text>

          <Text
            style={[styles.description, { color: isDark ? "#888" : "#666" }]}
          >
            {isUpdatePending
              ? "The latest battle data has been downloaded. Restart to apply changes."
              : "Downloading new levels and tactical enhancements... Please wait."}
          </Text>

          {isUpdatePending ? (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleReload}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>LAUNCH RELOAD</Text>
              <Ionicons
                name="flash"
                size={18}
                color="#FFF"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.progressContainer}>
              <ActivityIndicator color={theme.primary} size="small" />
              <Text style={[styles.progressText, { color: theme.primary }]}>
                {isDownloading ? "DOWNLOADING..." : "CHECKING..."}
              </Text>
            </View>
          )}

          {!isUpdatePending && (
            <Text style={styles.tipText}>DO NOT CLOSE THE APP</Text>
          )}
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
    padding: 24,
  },
  card: {
    borderRadius: 32,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: "500",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    width: "100%",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  progressText: {
    marginLeft: 12,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  tipText: {
    fontSize: 10,
    color: "#444",
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 16,
  },
});
