import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAudioPlayer } from "expo-audio";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { GameTile } from "../components/game/GameTile";
import { Tile, TileType } from "../components/game/types";
import { useTheme } from "../theme/ThemeContext";

const GRID_SIZE = 4;
const TOTAL_TILES = 16;
const BOMBS_COUNT = 5;
const HEARTS_COUNT = 1;
const screenWidth = Dimensions.get("window").width;

const SOUNDS = {
  flip: "https://raw.githubusercontent.com/lucsn/scavenge-the-stars/master/assets/audio/sfx/click.mp3",
  bomb: "https://raw.githubusercontent.com/vlad-ignat/retro-game-sounds/master/mp3/sfx_exp_medium1.mp3",
  heart:
    "https://raw.githubusercontent.com/vlad-ignat/retro-game-sounds/master/mp3/sfx_sounds_powerup12.mp3",
  win: "https://raw.githubusercontent.com/vlad-ignat/retro-game-sounds/master/mp3/sfx_sounds_fanfare3.mp3",
};

export default function LocalDuelScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();

  // State
  const [phase, setPhase] = useState<
    "setup" | "pass" | "playing" | "game_over"
  >("setup");
  const [grid, setGrid] = useState<Tile[]>([]);
  const [lives, setLives] = useState(3);
  const [winner, setWinner] = useState<"Attacker" | "Defender" | null>(null);

  // Sound
  const flipPlayer = useAudioPlayer(SOUNDS.flip);
  const bombPlayer = useAudioPlayer(SOUNDS.bomb);
  const heartPlayer = useAudioPlayer(SOUNDS.heart);
  const winPlayer = useAudioPlayer(SOUNDS.win);

  const playSound = useCallback(
    (type: keyof typeof SOUNDS) => {
      try {
        const player =
          type === "flip"
            ? flipPlayer
            : type === "bomb"
              ? bombPlayer
              : type === "heart"
                ? heartPlayer
                : winPlayer;
        if (player) {
          player.seekTo(0);
          player.play();
        }
      } catch (e) {
        console.log(e);
      }
    },
    [flipPlayer, bombPlayer, heartPlayer, winPlayer],
  );

  // Init
  useEffect(() => {
    const emptyGrid = Array.from({ length: TOTAL_TILES }, (_, i) => ({
      id: i,
      type: "safe" as TileType,
      flipped: false,
    }));
    setGrid(emptyGrid);
  }, []);

  // Handlers
  const handleSetupPress = (tile: Tile) => {
    if (phase !== "setup") return;

    const bombs = grid.filter((t) => t.type === "bomb").length;
    const hearts = grid.filter((t) => t.type === "heart").length;

    setGrid((prev) =>
      prev.map((t) => {
        if (t.id === tile.id) {
          let next: TileType = "safe";
          if (t.type === "safe") {
            if (bombs < BOMBS_COUNT) next = "bomb";
            else if (hearts < HEARTS_COUNT) next = "heart";
            else next = "safe";
          } else if (t.type === "bomb") {
            if (hearts < HEARTS_COUNT) next = "heart";
            else next = "safe";
          } else {
            next = "safe";
          }
          return { ...t, type: next };
        }
        return t;
      }),
    );
    playSound("flip");
  };

  const confirmSetup = () => {
    const bombs = grid.filter((t) => t.type === "bomb").length;
    const hearts = grid.filter((t) => t.type === "heart").length;

    if (bombs !== BOMBS_COUNT || hearts !== HEARTS_COUNT) {
      Alert.alert(
        "Setup Incomplete",
        `Place ${BOMBS_COUNT} bombs and ${HEARTS_COUNT} heart.`,
      );
      return;
    }
    setPhase("pass");
  };

  const startPlaying = () => {
    // Hide everything visually (reset flips just in case, though they should be false)
    setGrid((prev) => prev.map((t) => ({ ...t, flipped: false })));
    setPhase("playing");
  };

  const handleAttack = (tile: Tile) => {
    if (phase !== "playing") return;
    if (tile.flipped) return;

    // Apply move
    const newGrid = [...grid];
    const targetTile = newGrid[tile.id];
    targetTile.flipped = true;
    setGrid(newGrid);

    if (targetTile.type === "bomb") {
      playSound("bomb");
      const nextLives = lives - 1;
      setLives(nextLives);
      if (nextLives === 0) {
        setWinner("Defender"); // Defender (Builder) wins
        setPhase("game_over");
      }
    } else if (targetTile.type === "heart") {
      playSound("heart");
      playSound("win");
      setWinner("Attacker"); // Attacker wins
      setPhase("game_over");
    } else {
      playSound("flip");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          {phase === "setup"
            ? "DEFENDER"
            : phase === "pass"
              ? "PASS THE PHONE"
              : "ATTACKER"}
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? "#CCC" : "#666" }]}>
          {phase === "setup"
            ? `Place ${BOMBS_COUNT} Bombs & ${HEARTS_COUNT} Heart`
            : phase === "pass"
              ? "Hand over to the attacker"
              : `Lives: ${lives} ❤️`}
        </Text>
      </View>

      {/* Grid */}
      {phase !== "pass" && (
        <View style={styles.gridContainer}>
          <View style={styles.grid}>
            {grid.map((tile, i) => (
              <GameTile
                key={i}
                tile={tile}
                index={i}
                theme={theme}
                isDark={isDark}
                onPress={() =>
                  phase === "setup"
                    ? handleSetupPress(tile)
                    : handleAttack(tile)
                }
                phase={phase === "setup" ? "setup_bombs" : "playing"}
                size={(screenWidth - 40) / 4}
              />
            ))}
          </View>
        </View>
      )}

      {/* Pass Screen */}
      {phase === "pass" && (
        <View style={styles.passContainer}>
          <Ionicons name="phone-portrait" size={100} color={theme.primary} />
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.primary, marginTop: 40 },
            ]}
            onPress={startPlaying}
          >
            <Text style={styles.buttonText}>I AM READY</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Setup Button */}
      {phase === "setup" && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={confirmSetup}
        >
          <Text style={styles.buttonText}>READY</Text>
        </TouchableOpacity>
      )}

      {/* Winner Modal */}
      <Modal visible={phase === "game_over"} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.winnerText, { color: theme.text }]}>
              {winner === "Attacker" ? "ATTACKER WINS!" : "DEFENDER WINS!"}
            </Text>
            {winner === "Attacker" && <Text style={{ fontSize: 50 }}>🏆</Text>}
            {winner === "Defender" && <Text style={{ fontSize: 50 }}>🛡️</Text>}

            <TouchableOpacity
              style={[styles.homeButton, { backgroundColor: theme.primary }]}
              onPress={() => navigation.popToTop()}
            >
              <Text style={styles.homeButtonText}>Back into Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
        {phase === "game_over" && (
          <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} />
        )}
      </Modal>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 60 },
  header: { alignItems: "center", marginBottom: 40 },
  title: { fontSize: 28, fontWeight: "900", letterSpacing: 2 },
  subtitle: { fontSize: 16, marginTop: 10 },
  gridContainer: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  grid: {
    width: screenWidth - 40,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  passContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 300,
  },
  actionButton: {
    marginTop: 30,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    elevation: 10,
  },
  winnerText: { fontSize: 24, fontWeight: "900", marginBottom: 20 },
  homeButton: {
    marginTop: 30,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  homeButtonText: { color: "white", fontWeight: "bold" },
  backButton: { position: "absolute", top: 50, left: 20, padding: 10 },
});
