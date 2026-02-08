import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { GamePhase, Tile } from "./types";

const GRID_SIZE = 4;
const screenWidth = Dimensions.get("window").width;
const tileMargin = 10;
const tileSizeDefault =
  (screenWidth - (GRID_SIZE + 1) * tileMargin) / GRID_SIZE;

interface GameTileProps {
  tile: Tile;
  onPress?: () => void;
  isDark: boolean;
  theme: any;
  phase: GamePhase;
  selectedBombs?: number[];
  selectedHeart?: number | null;
  index: number;
  isLastRemoteMove?: boolean;
  size?: number;
}

export const GameTile = ({
  tile,
  onPress,
  isDark,
  theme,
  phase,
  selectedBombs = [],
  selectedHeart = null,
  index,
  isLastRemoteMove,
  size,
}: GameTileProps) => {
  const currentTileSize = size || tileSizeDefault;
  const flip = useSharedValue(0);
  const entry = useSharedValue(0);

  useEffect(() => {
    entry.value = withDelay(index * 40, withTiming(1, { duration: 500 }));
  }, []);

  useEffect(() => {
    if (tile.flipped || phase === "game_over" || phase === "game_won") {
      flip.value = withTiming(1, { duration: 400 });
    } else {
      flip.value = withTiming(0, { duration: 400 });
    }
  }, [tile.flipped, phase]);

  const animatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flip.value, [0, 1], [0, 180]);
    return {
      transform: [
        { perspective: 1000 },
        { scale: entry.value },
        { rotateY: `${rotateY}deg` },
      ],
      opacity: entry.value,
    };
  });

  const frontStyle = useAnimatedStyle(() => ({
    opacity: flip.value < 0.5 ? 1 : 0,
  }));

  const backStyle = useAnimatedStyle(() => ({
    opacity: flip.value >= 0.5 ? 1 : 0,
    transform: [{ rotateY: "180deg" }],
  }));

  const isSelected =
    phase === "setup_bombs" && (tile.type === "bomb" || tile.type === "heart");

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={(tile.flipped && phase === "playing") || !onPress}
      style={styles.tileContainer}
    >
      <Animated.View
        style={[
          styles.tile,
          { width: currentTileSize - 4, height: currentTileSize - 4 },
          animatedStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.tile,
            frontStyle,
            {
              backgroundColor: isSelected
                ? "#FFF"
                : isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(255,255,255,0.9)",
              borderWidth: isSelected ? 3 : 1,
              borderColor: isSelected ? theme.primary : "rgba(255,255,255,0.1)",
              position: "absolute",
              width: "100%",
              height: "100%",
            },
          ]}
        >
          {isSelected ? (
            <Ionicons
              name={tile.type === "bomb" ? "nuclear" : "heart"}
              size={currentTileSize * 0.5}
              color={theme.primary}
            />
          ) : (
            <Text
              style={{
                color: theme.primary,
                fontWeight: "900",
                fontSize: currentTileSize * 0.3,
                opacity: 0.5,
              }}
            >
              ?
            </Text>
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.tile,
            backStyle,
            {
              backgroundColor:
                tile.type === "bomb"
                  ? "#000"
                  : tile.type === "heart"
                    ? "#FFF"
                    : isDark
                      ? "rgba(255,255,255,0.15)"
                      : "#FFFFFF",
              borderWidth: isLastRemoteMove ? 4 : 2,
              borderColor: isLastRemoteMove
                ? "#FFD700" // Gold highlight for last remote move
                : tile.type === "bomb"
                  ? "#FF3B30"
                  : tile.type === "heart"
                    ? "#34C759"
                    : theme.primary,
              position: "absolute",
              width: "100%",
              height: "100%",
            },
          ]}
        >
          {tile.type === "bomb" ? (
            <MaterialCommunityIcons
              name="skull"
              size={currentTileSize * 0.4}
              color="#FF3B30"
            />
          ) : tile.type === "heart" ? (
            <Ionicons
              name="heart"
              size={currentTileSize * 0.4}
              color="#34C759"
            />
          ) : (
            <Ionicons
              name="flash"
              size={currentTileSize * 0.4}
              color={theme.primary}
            />
          )}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tileContainer: {
    margin: 2,
  },
  tile: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
});
