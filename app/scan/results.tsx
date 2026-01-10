import { useHistory } from "@/src/core/context/HistoryContext";
import { ColorMatcher } from "@/src/features/scan/domain/colorMatcher";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Helper to get the correct URL
const getApiUrl = () => {
  // In development, grab the host IP dynamically from Expo Go
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(":")[0];
  return `http://${localhost}:3000`;
};

const API_URL = getApiUrl();

export default function ResultsScreen() {
  const router = useRouter();
  const { addToHistory } = useHistory();

  // Accept 'uri' (Image) OR 'hex' (Direct Color)
  const { uri, hex } = useLocalSearchParams<{ uri?: string; hex?: string }>();

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any>(null);
  const [fullScreenColor, setFullScreenColor] = useState<string | null>(null);

  // Mode A: Upload Image (Camera/Gallery)
  const analyzeImage = useCallback(async (imageUri: string) => {
    try {
      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        name: "scan.png",
        type: "image/png",
      } as any);

      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = await response.json();
      const matches = ColorMatcher.findClosestMatches(data.detectedColor, 5);

      setResults({
        detectedColor: data.detectedColor,
        matches: matches,
      });
      setLoading(false);
    } catch (error) {
      handleError(error);
    }
  }, []);

  
  // --- 1. DETERMINE MODE ---
  useEffect(() => {
    if (uri) {
      analyzeImage(uri);
    } else if (hex) {
      findMatchesForHex(hex);
    }
  }, [uri, hex, analyzeImage]);

  // Mode B: Send Hex (History) -> NEW FUNCTION
  const findMatchesForHex = (colorHex: string) => {
    setLoading(true);

    // 1. Use local logic instead of fetch
    const matches = ColorMatcher.findClosestMatches(colorHex, 5);

    // 2. Format result to match what your UI expects
    setResults({
      detectedColor: colorHex,
      matches: matches, // { item: NcsItem, distance: number }[]
    });

    setLoading(false);
  };

  const handleError = (error: any) => {
    console.error(error);
    Alert.alert("Error", "Could not connect to server.");
    setLoading(false);
  };

  // ... (Rest of your component: openInFan, getTextColor, Render logic...)
  // NO CHANGES NEEDED BELOW THIS LINE, just paste the rest of your existing component
  const openInFan = (colorKey: string) => {
    router.push({
      pathname: "/fans/ncs",
      params: { targetKey: colorKey },
    });
  };

  const openFullScreen = (color: any) => {
    if (color) {
      addToHistory(color);
      setFullScreenColor(color);
    }
  };

  // ... Helper functions (getTextColor, getMatchQuality) ...
  const getTextColor = (hex: string) => {
    if (!hex) return "white";
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "black" : "white";
  };

  const getMatchQuality = (dist: number) => {
    if (dist < 1.5) return { label: "Perfect Match", color: "#00E676" };
    if (dist < 3.0) return { label: "Close Match", color: "#29B6F6" };
    if (dist < 10.0) return { label: "Similar", color: "#FFCA28" };
    return { label: "Poor Match", color: "#EF5350" };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Analyzing Pigments...</Text>
      </View>
    );
  }

  const contrastColor = getTextColor(results?.detectedColor);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <Modal
        visible={!!fullScreenColor}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setFullScreenColor(null)}
      >
        {fullScreenColor && (
          <View
            style={[
              styles.fullScreenContainer,
              { backgroundColor: fullScreenColor },
            ]}
          >
            <Pressable
              style={styles.closeButton}
              onPress={() => setFullScreenColor(null)}
            >
              <Ionicons
                name="close"
                size={30}
                color={getTextColor(fullScreenColor)}
              />
            </Pressable>
            <View style={styles.fullScreenInfo}>
              <Text
                style={[
                  styles.fullScreenText,
                  { color: getTextColor(fullScreenColor) },
                ]}
              >
                {results?.detectedColor?.toUpperCase()}
              </Text>
              <Text
                style={[
                  styles.fullScreenSub,
                  { color: getTextColor(fullScreenColor) },
                ]}
              >
                CAPTURED SOURCE
              </Text>
            </View>
          </View>
        )}
      </Modal>

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Analysis Results</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Pressable
          style={[styles.heroCard, { backgroundColor: results?.detectedColor }]}
          onPress={() => openFullScreen(results?.detectedColor)}
        >
          <View style={styles.glossOverlay} />
          <View style={styles.heroInfo}>
            <Text style={[styles.heroLabel, { color: contrastColor }]}>
              CAPTURED COLOR
            </Text>
            <Text style={[styles.heroHex, { color: contrastColor }]}>
              {results?.detectedColor?.toUpperCase()}
            </Text>
            <Ionicons
              name="expand"
              size={20}
              color={contrastColor}
              style={{ position: "absolute", top: 0, right: 0, opacity: 0.5 }}
            />
          </View>
        </Pressable>

        <Text style={styles.sectionTitle}>Top Matches</Text>

        <FlatList
          data={results?.matches || []}
          keyExtractor={(item) => item.item.key}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => {
            const badge = getMatchQuality(item.distance);
            return (
              <Pressable
                style={styles.matchCard}
                onPress={() => openInFan(item.item.key)}
              >
                <View style={styles.splitSwatchContainer}>
                  <View
                    style={[
                      styles.mainSwatch,
                      { backgroundColor: item.item.hex },
                    ]}
                  />
                  <View
                    style={[
                      styles.compareSliver,
                      { backgroundColor: results?.detectedColor },
                    ]}
                  />
                </View>
                <View style={styles.matchInfo}>
                  <Text style={styles.matchKey}>{item.item.key}</Text>
                  <View style={styles.badgeRow}>
                    <View
                      style={[styles.dot, { backgroundColor: badge.color }]}
                    />
                    <Text style={[styles.badgeText, { color: badge.color }]}>
                      {badge.label} ({item.distance.toFixed(1)})
                    </Text>
                  </View>
                </View>
                <View style={styles.actionIcon}>
                  <Ionicons name="chevron-forward" size={20} color="#555" />
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  center: { justifyContent: "center", alignItems: "center" },
  content: { flex: 1, paddingHorizontal: 20 },
  loadingText: { color: "#888", marginTop: 16, fontSize: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  heroCard: {
    height: 140,
    borderRadius: 24,
    marginBottom: 30,
    padding: 24,
    justifyContent: "flex-end",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  glossOverlay: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 75,
    transform: [{ scaleX: 2 }],
  },
  heroInfo: { zIndex: 1 },
  heroLabel: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.8,
    marginBottom: 4,
    letterSpacing: 1,
  },
  heroHex: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#888",
    marginBottom: 15,
    marginLeft: 4,
  },
  matchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  splitSwatchContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "row",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  mainSwatch: { flex: 1 },
  compareSliver: { width: 12 },
  matchInfo: { flex: 1 },
  matchKey: { fontSize: 18, fontWeight: "700", color: "#FFF", marginBottom: 4 },
  badgeRow: { flexDirection: "row", alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#252525",
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 30,
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  fullScreenInfo: { position: "absolute", bottom: 100, alignItems: "center" },
  fullScreenText: { fontSize: 32, fontWeight: "900" },
  fullScreenSub: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
    letterSpacing: 2,
    opacity: 0.7,
  },
});
