import { DashboardCard } from "@/src/features/home/presentation/components/DashboardCard";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

const FANS = [
  {
    id: "ncs",
    name: "NCS Standard",
    desc: "Natural Color System® 2050 colors",
    color: "#F1C40F",
    route: "/fans/ncs", // Static Route
  },
  // --- NEW SEPARATE FANS ---
  {
    id: "chroma",
    name: "Renner Chroma",
    desc: "High coverage pigmented finishes",
    color: "#E91E63", // Pink/Red icon
    route: "/fans/renner/chroma", // Dynamic Route
  },
  {
    id: "cs",
    name: "Renner CS",
    desc: "Special effects and stains",
    color: "#9C27B0", // Purple icon
    route: "/fans/renner/cs",
  },
  {
    id: "tm",
    name: "Renner TM-M006",
    desc: "Wood tones matching system",
    color: "#795548", // Brown icon
    route: "/fans/renner/tm",
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
              // @ts-ignore - Dynamic routes can be tricky in TS
              router.push(item.route);
            }}
          />
        )}
      />
    </View>
  );
}

// ... styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", paddingTop: 80 },
  headerOverlay: { position: "absolute", top: 50, left: 20, zIndex: 50 },
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
