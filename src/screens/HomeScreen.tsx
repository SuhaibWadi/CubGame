import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { ms, s, vs } from "../theme/Dimensions";
import { useTheme } from "../theme/ThemeContext";

const { width } = Dimensions.get("window");

interface GameModeCardProps {
  title: string;
  description: string;
  icon: any;
  colors: string[];
  onPress?: () => void;
  index: number;
}

const GameModeCard = ({
  title,
  description,
  icon,
  colors,
  onPress,
  index,
}: GameModeCardProps) => {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 600 }));
    scale.value = withDelay(
      index * 100,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.5)) }),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(255,255,255,0.8)",
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
            borderWidth: 1,
          },
        ]}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <LinearGradient
          colors={colors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconWrapper}
        >
          <Ionicons name={icon} size={30} color="#FFF" />
        </LinearGradient>

        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            {title.toUpperCase()}
          </Text>
          <Text
            style={[
              styles.cardDescription,
              { color: isDark ? "#888" : "#666" },
            ]}
            numberOfLines={2}
          >
            {description}
          </Text>
        </View>

        <View
          style={[
            styles.arrowCircle,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
            },
          ]}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={isDark ? "#FFF" : "#000"}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const FloatingCircle = ({
  size,
  color,
  top,
  left,
  delay = 0,
  duration = 3000,
}: any) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-20, { duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
          opacity: 0.15,
        },
      ]}
    />
  );
};

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background Orbs */}
      <FloatingCircle size={200} color={theme.primary} top={-50} left={-50} />
      <FloatingCircle
        size={150}
        color={theme.secondary}
        top={400}
        left={width - 100}
        delay={1000}
      />
      <FloatingCircle
        size={100}
        color={theme.accent}
        top={700}
        left={-20}
        delay={500}
      />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>BETA v1.0</Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            CUB{"\n"}BLAST
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? "#888" : "#666" }]}>
            Choose your arena
          </Text>
        </View>

        <View style={styles.grid}>
          <GameModeCard
            title="Bot Match"
            description="Warm up against the AI"
            icon="rocket"
            colors={["#FF3B30", "#FF9500"]}
            index={0}
            onPress={() => navigation.navigate("Game", { mode: "random" })}
          />
          <GameModeCard
            title="Duel Friends"
            description="Create a private room"
            icon="people"
            colors={["#34C759", "#00C7BE"]}
            index={1}
            onPress={() => navigation.navigate("Game", { mode: "custom" })}
          />
          <GameModeCard
            title="Ranked Play"
            description="Compete with the world"
            icon="globe"
            colors={["#007AFF", "#5856D6"]}
            index={2}
            onPress={() => navigation.navigate("OnlineMenu")}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.statsCard,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(255,255,255,0.8)",
            },
          ]}
          onPress={() => navigation.navigate("Profile")}
        >
          <LinearGradient
            colors={[theme.primary, theme.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsIcon}
          >
            <Ionicons name="trophy" size={24} color="#FFF" />
          </LinearGradient>
          <View style={styles.statsInfo}>
            <Text style={[styles.statsTitle, { color: theme.text }]}>
              VIEW LEADERBOARD
            </Text>
            <Text
              style={[
                styles.statsSubtitle,
                { color: isDark ? "#888" : "#666" },
              ]}
            >
              See where you stand
            </Text>
          </View>
          <Ionicons name="flash" size={20} color={theme.accent} />
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text
            style={[styles.footerText, { color: isDark ? "#444" : "#CCC" }]}
          >
            DESIGNED BY SUHAIB WADI
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: s(24),
    paddingTop: vs(80),
  },
  header: {
    marginBottom: vs(40),
  },
  badge: {
    backgroundColor: "#FF2D55",
    alignSelf: "flex-start",
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(6),
    marginBottom: vs(12),
  },
  badgeText: {
    color: "#FFF",
    fontSize: ms(10),
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    fontSize: ms(48),
    fontWeight: "900",
    lineHeight: ms(48),
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: ms(18),
    fontWeight: "600",
    marginTop: vs(8),
    opacity: 0.8,
  },
  grid: {
    gap: vs(16),
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: s(16),
    borderRadius: s(24),
    // Blur effect simulation
    elevation: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modalContent: {
    borderTopLeftRadius: s(40),
    borderTopRightRadius: s(40),
    padding: s(30),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(30),
  },
  modalTitle: {
    fontSize: ms(20),
    fontWeight: "900",
    letterSpacing: 1,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s(16),
    justifyContent: "center",
  },
  avatarOption: {
    width: s(95),
    aspectRatio: 1,
    borderRadius: s(20),
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderWidth: 2,
    borderColor: "transparent",
  },
  iconWrapper: {
    width: s(60),
    height: s(60),
    borderRadius: s(20),
    alignItems: "center",
    justifyContent: "center",
    marginRight: s(16),
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: ms(18),
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: ms(13),
    marginTop: vs(2),
    fontWeight: "500",
  },
  arrowCircle: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    alignItems: "center",
    justifyContent: "center",
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: s(20),
    borderRadius: s(28),
    marginTop: vs(32),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  statsIcon: {
    width: s(48),
    height: s(48),
    borderRadius: s(16),
    alignItems: "center",
    justifyContent: "center",
    marginRight: s(16),
  },
  statsInfo: {
    flex: 1,
  },
  statsTitle: {
    fontSize: ms(16),
    fontWeight: "900",
  },
  statsSubtitle: {
    fontSize: ms(12),
    fontWeight: "600",
  },
  footer: {
    marginTop: vs(60),
    alignItems: "center",
  },
  footerText: {
    fontSize: ms(10),
    fontWeight: "900",
    letterSpacing: 2,
  },
});
