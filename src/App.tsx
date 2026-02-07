import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ThemeProvider, useTheme } from "./theme/ThemeContext";

import GameScreen from "./screens/GameScreen";
import HomeScreen from "./screens/HomeScreen";
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
          } else if (route.name === "Settings") {
            iconName = focused ? "options" : "options-outline";
          }

          return <Ionicons name={iconName} size={28} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: isDark ? "#444" : "#AAA",
        tabBarShowLabel: false,
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
            headerTitle: "CubGame",
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Navigation />
    </ThemeProvider>
  );
}
