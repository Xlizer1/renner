import { DashboardCard } from "@/src/features/home/presentation/components/DashboardCard";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, User</Text>
          <Text style={styles.subGreeting}>
            What do you want to design today?
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Tools</Text>

        {/* 1. Navigate to Fan List */}
        <DashboardCard
          title="Color Fans"
          subtitle="Interactive NCS, RAL, and Pantone decks"
          icon="color-filter"
          color="#FF6B6B"
          onPress={() => router.push("/fans/selection")}
        />

        {/* Placeholder for future features */}
        {/* <DashboardCard
          title="Saved Palettes"
          subtitle="Your favorite combinations"
          icon="heart"
          color="#4ECDC4"
          onPress={() => console.log("Coming soon")}
        /> */}

        <DashboardCard
          title="Scan Color"
          subtitle="Find matching colors from camera"
          icon="camera"
          color="#4ECDC4"
          onPress={() => router.push("/scan")} // Navigates to camera
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F9FC" },
  content: { padding: 20, paddingBottom: 100 }, // Padding for Tab Bar
  header: { marginBottom: 30, marginTop: 10 },
  greeting: { fontSize: 32, fontWeight: "800", color: "#1A1A1A" },
  subGreeting: { fontSize: 16, color: "#666", marginTop: 5 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    color: "#333",
    marginLeft: 5,
  },
});
