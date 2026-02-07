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
const tileSize = (screenWidth - (GRID_SIZE + 1) * tileMargin) / GRID_SIZE;

interface GameTileProps {
  tile: Tile;
  onPress: () => void;
  isDark: boolean;
  theme: any;
  phase: GamePhase;
  selectedBombs: number[];
  selectedHeart: number | null;
  index: number;
}

export const GameTile = ({
  tile,
  onPress,
  isDark,
  theme,
  phase,
  selectedBombs,
  selectedHeart,
  index,
}: GameTileProps) => {
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
    (phase === "setup_bombs" && selectedBombs.includes(tile.id)) ||
    (phase === "setup_heart" && selectedHeart === tile.id);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={tile.flipped && phase === "playing"}
      style={styles.tileContainer}
    >
      <Animated.View style={[styles.tile, animatedStyle]}>
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
              name={phase === "setup_bombs" ? "nuclear" : "heart"}
              size={32}
              color={theme.primary}
            />
          ) : (
            <Text
              style={{
                color: theme.primary,
                fontWeight: "900",
                fontSize: 24,
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
              borderWidth: 2,
              borderColor:
                tile.type === "bomb"
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
            <MaterialCommunityIcons name="skull" size={32} color="#FF3B30" />
          ) : tile.type === "heart" ? (
            <Ionicons name="heart" size={32} color="#34C759" />
          ) : (
            <Ionicons name="flash" size={32} color={theme.primary} />
          )}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tileContainer: {
    width: tileSize - 4,
    height: tileSize - 4,
    margin: 4,
  },
  tile: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
});
