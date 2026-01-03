import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const GAP = 15;
const CARD_WIDTH = (width - 40 - GAP) / 2; // (Screen - Padding - Gap) / 2

export default function HomeScreen() {
  const router = useRouter();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "We need access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 50, height: 50 } }],
          { format: ImageManipulator.SaveFormat.PNG }
        );
        router.push({
          pathname: "/scan/results",
          params: { uri: manipResult.uri },
        });
      } catch (error) {
        console.log("Error processing image:", error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 1. MODERN HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.subGreeting}>Ready to find your color?</Text>
          </View>
          <Pressable style={styles.profileBtn}>
            <Ionicons name="person" size={20} color="#555" />
          </Pressable>
        </View>

        {/* 2. HERO CARD (Bento Main Item) */}
        <Pressable
          style={styles.heroWrapper}
          onPress={() => router.push("/scan")}
        >
          <LinearGradient
            colors={["#4ECDC4", "#2EC4B6"]} // Teal Gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroTextContainer}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>NEW</Text>
                </View>
                <Text style={styles.heroTitle}>Scan Color</Text>
                <Text style={styles.heroSubtitle}>
                  Point your camera at any surface to find its NCS match.
                </Text>
              </View>
              <View style={styles.heroIconCircle}>
                <Ionicons name="camera" size={32} color="#2EC4B6" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        <Text style={styles.sectionTitle}>Tools</Text>

        {/* 3. SECONDARY GRID (Row) */}
        <View style={styles.gridRow}>
          {/* Color Fans Card */}
          <ActionCard
            title="Color Fans"
            subtitle="NCS, RAL & More"
            icon="color-filter"
            color="#FF6B6B"
            onPress={() => router.push("/fans/selection")}
          />

          {/* Pick Photo Card */}
          <ActionCard
            title="From Photo"
            subtitle="Pick from Gallery"
            icon="images"
            color="#6C5CE7"
            onPress={pickImage}
          />
        </View>

        {/* Future "Saved" Section can go here */}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- SUB COMPONENTS ---

const ActionCard = ({ title, subtitle, icon, color, onPress }: any) => (
  <Pressable
    style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
    onPress={onPress}
  >
    <View style={[styles.iconBox, { backgroundColor: color + "15" }]}>
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardSubtitle}>{subtitle}</Text>
  </Pressable>
);

// --- STYLES ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FB" },
  content: { padding: 20 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  greeting: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 16,
    color: "#8898AA",
    marginTop: 4,
    fontWeight: "500",
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEE",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  // Hero Card
  heroWrapper: {
    shadowColor: "#4ECDC4",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 30,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    height: 180,
    justifyContent: "center",
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroTextContainer: { flex: 1, paddingRight: 20 },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },
  heroIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },

  // Grid
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 15,
    marginLeft: 4,
  },
  gridRow: { flexDirection: "row", justifyContent: "space-between", gap: GAP },

  // Action Cards
  actionCard: {
    width: CARD_WIDTH,
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,

    // Modern Soft Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  pressed: { transform: [{ scale: 0.98 }] },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 4,
  },
  cardSubtitle: { fontSize: 13, color: "#A4B0BE", lineHeight: 18 },
});
