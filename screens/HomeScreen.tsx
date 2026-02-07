import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";

interface GameModeCardProps {
  title: string;
  description: string;
  icon: any;
  color: string;
  onPress?: () => void;
}

const GameModeCard = ({
  title,
  description,
  icon,
  color,
  onPress,
}: GameModeCardProps) => {
  const { theme, isDark } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
          shadowColor: color,
        },
      ]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={[styles.iconWrapper, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
        <Text
          style={[styles.cardDescription, { color: isDark ? "#AAA" : "#666" }]}
        >
          {description}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={isDark ? "#444" : "#CCC"}
      />
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: isDark ? "#AAA" : "#666" }]}>
          Ready to play?
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>Choose Mode</Text>
      </View>

      <GameModeCard
        title="Random Game"
        description="Jump into a quick match with a random opponent."
        icon="dice"
        color="#FF3B30"
        onPress={() => navigation.navigate("Game", { mode: "random" })}
      />
      <GameModeCard
        title="Custom Game"
        description="Create a private room and play with your friends."
        icon="people"
        color="#34C759"
        onPress={() => navigation.navigate("Game", { mode: "custom" })}
      />
      <GameModeCard
        title="Online Game"
        description="Compete in ranked matches to climb the leaderboard."
        icon="globe"
        color="#007AFF"
        onPress={() => navigation.navigate("OnlineMenu")}
      />

      <View
        style={[
          styles.infoBox,
          { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" },
        ]}
      >
        <Ionicons name="flash" size={20} color={theme.primary} />
        <Text style={[styles.infoText, { color: isDark ? "#888" : "#666" }]}>
          New competitive season starts in 2 days!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
    marginTop: 10,
  },
  greeting: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    // iOS Shadows
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    // Android Elevation
    elevation: 5,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 10,
    fontWeight: "500",
  },
});
