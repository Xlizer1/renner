import { DashboardCard } from "@/src/features/home/presentation/components/DashboardCard";
import { router } from "expo-router";
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";

// Mock Data for available fans
const FANS = [
  {
    id: "ncs",
    name: "NCS Standard",
    desc: "Natural Color System® 2050 colors",
    color: "#F1C40F",
    route: "/fans/ncs" as const, // Type safety
  },
  {
    id: "renner",
    name: "Renner",
    desc: "Coming soon...",
    color: "#007AFF",
    route: null,
  },
];

export default function FanSelectionScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={FANS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
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
  container: { flex: 1, backgroundColor: "#F7F9FC" },
});
