import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
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

const formatTime12Hour = (time24: string) => {
  if (!time24) return "";
  const [hourStr, minute] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${minute} ${ampm}`;
};

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);

  useEffect(() => {
    if (showPrayerModal && !prayerTimes) {
      const fetchPrayerTimes = async () => {
        setIsLoadingTimes(true);
        try {
          const response = await fetch(
            "https://api.aladhan.com/v1/timingsByCity?city=Amman&country=Jordan&method=23"
          );
          const json = await response.json();
          if (json.data && json.data.timings) {
            setPrayerTimes(json.data.timings);
          }
        } catch (e) {
          console.warn("Failed to fetch prayer times", e);
        } finally {
          setIsLoadingTimes(false);
        }
      };
      fetchPrayerTimes();
    }
  }, [showPrayerModal]);

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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>BETA v1.0</Text>
              </View>
              <Text style={[styles.title, { color: theme.text }]}>
                CUB{"\n"}BLAST
              </Text>
              <Text style={[styles.subtitle, { color: isDark ? "#888" : "#666" }]}>
                Yes Cub not Cup Don't Judge Me :)
              </Text>
            </View>

            <TouchableOpacity 
              style={{
                width: s(44),
                height: s(44),
                borderRadius: s(22),
                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                alignItems: "center",
                justifyContent: "center",
                marginTop: vs(8)
              }} 
              onPress={() => setShowPrayerModal(true)}
            >
              <Ionicons name="moon" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>
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
            onPress={() => navigation.navigate("LocalDuel")}
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

      <Modal visible={showPrayerModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={[styles.prayerModalContainer, { backgroundColor: theme.background }]}>
            <View style={styles.prayerModalHeader}>
              <Text style={[styles.prayerModalTitle, { color: theme.text }]}>Prayer Times (Amman)</Text>
              <TouchableOpacity
                onPress={() => setShowPrayerModal(false)}
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            {isLoadingTimes || !prayerTimes ? (
              <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: vs(40) }} />
            ) : (
              <View style={styles.prayerGrid}>
                {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
                  <View key={prayer} style={[styles.prayerItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                    <Text style={[styles.prayerName, { color: theme.text }]}>{prayer}</Text>
                    <Text style={[styles.prayerTimeText, { color: theme.primary }]}>{formatTime12Hour(prayerTimes[prayer])}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  prayerModalContainer: {
    borderTopLeftRadius: s(30),
    borderTopRightRadius: s(30),
    padding: s(24),
    paddingBottom: vs(50),
    minHeight: vs(300),
  },
  prayerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(20),
  },
  prayerModalTitle: {
    fontSize: ms(20),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  prayerGrid: {
    gap: vs(12),
  },
  prayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: vs(12),
    borderBottomWidth: 1,
  },
  prayerName: {
    fontSize: ms(16),
    fontWeight: '600',
  },
  prayerTimeText: {
    fontSize: ms(16),
    fontWeight: '800',
  },
});
