import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#007AFF",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              iconName={focused ? "home" : "home-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const TabIcon = ({ iconName, color, focused }: any) => (
  <View style={{ alignItems: "center", top: Platform.OS === "ios" ? 10 : 0 }}>
    <Ionicons name={iconName} size={24} color={color} />
    {focused && (
      <View
        style={{
          position: "absolute",
          bottom: -10,
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: color,
        }}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 25,
    marginHorizontal: 10,
    left: 20,
    right: 20,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    height: 60,
    borderTopWidth: 0,
    
    // --- ANDROID ---
    elevation: 2, // Reduced from 5 to 3 for a softer lift

    // --- IOS ---
    shadowColor: "#000",
    shadowOffset: { 
      width: 0, 
      height: 4 // Reduced from 10 to 4 (keeps shadow closer to bar)
    },
    shadowOpacity: 0.05, // Reduced from 0.1 to 0.05 (much lighter)
    shadowRadius: 8,     // Slightly reduced blur
  },
});