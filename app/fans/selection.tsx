import { DashboardCard } from "@/src/features/home/presentation/components/DashboardCard";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

// Mock Data for available fans
const FANS = [
  {
    id: "ncs",
    name: "NCS Standard",
    desc: "Natural Color System® 2050 colors",
    color: "#F1C40F", // Gold/Yellow icon
    route: "/fans/ncs" as const,
  },
  {
    id: "renner",
    name: "Renner",
    desc: "Wood coatings & specialized finishes",
    color: "#007AFF", // Blue icon
    route: null,
  },
];

export default function FanSelectionScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.headerOverlay}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </Pressable>
      </View>

      <FlatList
        data={FANS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: 30 }}
        renderItem={({ item }) => (
          <DashboardCard
            title={item.name}
            subtitle={item.desc}
            icon="albums"
            color={item.color}
            onPress={() => {
              if (item.route) router.push(item.route);
            }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Changed from Light (#F7F9FC) to Dark (#121212)
  container: { flex: 1, backgroundColor: "#121212", paddingTop: 80 },
  headerOverlay: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 50,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(30,30,30,0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
});
