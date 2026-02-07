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
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: isDark ? "#888" : "#666",
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: isDark ? "#333" : "#EEE",
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#333" : "#EEE",
        },
        headerTintColor: theme.text,
      })}
    >
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
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
