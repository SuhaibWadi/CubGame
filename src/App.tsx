import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { ThemeProvider, useTheme } from "./theme/ThemeContext";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

import { UpdateOverlay } from "./components/common/UpdateOverlay";
import GameScreen from "./screens/GameScreen";
import HomeScreen from "./screens/HomeScreen";
import LocalDuelScreen from "./screens/LocalDuelScreen";
import MemoryGameScreen from "./screens/MemoryGameScreen";
import OnlineMenuScreen from "./screens/OnlineMenuScreen";
import ProfileScreen from "./screens/ProfileScreen";
import SettingsScreen from "./screens/SettingsScreen";
import WaitingRoomScreen from "./screens/WaitingRoomScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === "Home") {
            iconName = focused ? "game-controller" : "game-controller-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "trophy" : "trophy-outline";
          } else if (route.name === "Memory") {
            iconName = focused ? "grid" : "grid-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "options" : "options-outline";
          }

          return <Ionicons name={iconName} size={28} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: isDark ? "#444" : "#AAA",
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#0A0A0B" : "#F0F2F5",
          borderTopWidth: 0,
          elevation: 0,
          height: 85,
          paddingBottom: 20,
        },
        headerStyle: {
          backgroundColor: theme.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontWeight: "900",
          fontSize: 20,
          letterSpacing: 0.5,
        },
        headerTintColor: theme.text,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Memory" component={MemoryGameScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function Navigation() {
  const { theme } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={{
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerTitle: "Cub Blast",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="OnlineMenu"
          component={OnlineMenuScreen}
          options={{
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerTitle: "Online Battle",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="WaitingRoom"
          component={WaitingRoomScreen}
          options={{
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerTitle: "Matchmaking",
            headerBackTitle: "Exit",
          }}
        />
        <Stack.Screen
          name="LocalDuel"
          component={LocalDuelScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        // We add an artificial delay to show the cool logo!
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately!
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <Navigation />
        <UpdateOverlay />
      </View>
    </ThemeProvider>
  );
}
