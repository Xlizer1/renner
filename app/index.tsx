import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  StyleSheet as RNStyleSheet,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const GAP = 12; // Tighter gap
const CARD_WIDTH = (width - 40 - GAP) / 2;

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
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/renner-italia.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerButtons}>
            <Pressable style={styles.profileBtn}>
              <Ionicons name="person" size={20} color="#E0E0E0" />
            </Pressable>
            <Pressable style={styles.profileBtn}>
              <Ionicons name="settings" size={20} color="#E0E0E0" />
            </Pressable>
          </View>
        </View>

        {/* --- HERO CARD (Cleaned Up) --- */}
        <Pressable
          style={({ pressed }) => [
            styles.heroCard,
            pressed && styles.heroPressed,
          ]}
          onPress={() => router.push("/scan")}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroTextContainer}>
              {/* Badge Removed */}
              <Text style={styles.heroTitle}>Scan Color</Text>
              <Text style={styles.heroSubtitle}>Camera match.</Text>
            </View>

            <View style={styles.heroIconCircle}>
              <Ionicons name="camera" size={32} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.heroAccentLine} />
        </Pressable>

        <Text style={styles.sectionTitle}>Tools</Text>

        {/* --- SECONDARY GRID (Compact) --- */}
        <View style={styles.gridRow}>
          <ActionCard
            title="Color Fans"
            subtitle="NCS & RAL"
            icon="color-filter"
            onPress={() => router.push("/fans/selection")}
          />

          <ActionCard
            title="From Photo"
            subtitle="Gallery"
            icon="images"
            onPress={pickImage}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- SUB COMPONENTS ---

const ActionCard = ({ title, subtitle, icon, onPress }: any) => (
  <Pressable
    style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
    onPress={onPress}
  >
    <View style={styles.iconBox}>
      <Ionicons name={icon} size={24} color="#EEEEEE" />
    </View>
    <View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </View>
  </Pressable>
);

// --- STYLES ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  content: { padding: 20 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 10,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 10
  },
  // Adjust width/height to fit your specific logo aspect ratio
  logo: {
    width: 130,
    height: 40,
    // If your logo is black text, use tintColor to make it white:
    // tintColor: '#FFFFFF'
  },
  greeting: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  subGreeting: { fontSize: 15, color: "#888", marginTop: 2, fontWeight: "500" },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: RNStyleSheet.hairlineWidth,
    borderColor: "#444",
  },

  // HERO CARD
  heroCard: {
    borderRadius: 24,
    padding: 24,
    height: 160, // Slightly reduced height
    justifyContent: "center",
    marginBottom: 24,
    backgroundColor: "#E0E0E0",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  heroPressed: { transform: [{ scale: 0.99 }], opacity: 0.9 },

  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroTextContainer: { flex: 1, paddingRight: 20 },

  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#121212",
    marginBottom: 4,
  },
  heroSubtitle: { fontSize: 14, color: "#555", fontWeight: "500" },

  heroIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
  },
  heroAccentLine: {
    position: "absolute",
    bottom: 24,
    left: 24,
    height: 3,
    backgroundColor: "#121212",
    borderRadius: 1.5,
    width: 24,
  },

  // Grid
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#E0E0E0",
    marginBottom: 12,
    marginLeft: 4,
  },
  gridRow: { flexDirection: "row", justifyContent: "space-between", gap: GAP },

  // ACTION CARDS (Compact)
  actionCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH - 40, // Square Aspect Ratio (Compact)
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    padding: 16, // Reduced padding
    justifyContent: "space-between", // Push content to edges
    borderWidth: RNStyleSheet.hairlineWidth,
    borderColor: "#444",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: { transform: [{ scale: 0.98 }] },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  cardSubtitle: { fontSize: 12, color: "#888" },
});
