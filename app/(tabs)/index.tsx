import { DashboardCard } from "@/src/features/home/presentation/components/DashboardCard";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();

  const pickImage = async () => {
    // A. Request Permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "We need access to your photos to pick a color."
      );
      return;
    }

    // B. Open Gallery with Cropping Enabled
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // <--- CRITICAL: Lets user zoom/crop to the specific color
      aspect: [1, 1], // Force a square crop
      quality: 1,
    });

    if (!result.canceled) {
      const sourceUri = result.assets[0].uri;

      // C. Optimization: Resize before uploading
      // Even though the user cropped it, the image might still be 10MB.
      // We shrink it to 50x50px so the upload to your Bun server is instant.
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          sourceUri,
          [{ resize: { width: 50, height: 50 } }], // Shrink to thumbnail
          { format: ImageManipulator.SaveFormat.PNG }
        );

        // D. Reuse the existing Results Screen!
        router.push({
          pathname: "/scan/results",
          params: { uri: manipResult.uri },
        });
      } catch (error) {
        console.log("Error resizing image:", error);
      }
    }
  };

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

        <DashboardCard
          title="Pick from Photo"
          subtitle="Analyze an image from your gallery"
          icon="images" // Ionicons name
          color="#6C5CE7" // A nice purple
          onPress={pickImage}
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
