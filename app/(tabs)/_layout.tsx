// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useColorScheme } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? "#F9FAFB" : "#2563EB",
        tabBarInactiveTintColor: isDark ? "#4B5563" : "#94A3B8",
        tabBarStyle: {
          backgroundColor: isDark ? "#111827" : "#FFFFFF",
          borderTopColor: isDark ? "#1E2D45" : "#E2E8F0",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="objetivo" // Certifique-se que o arquivo app/(tabs)/objetivo.tsx existe
        options={{
          title: "Metas",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="locate" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
