import {
  calculateMedianColor,
  ColorMatch,
  ColorMatcher,
} from "@/src/features/scan/domain/colorMatcher";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// A tiny helper to read pixel - simplified for demo
// In production, use 'react-native-pixels'
const getDominantColorFromImage = async (uri: string) => {
    // 1. IN PRODUCTION: Use 'react-native-pixels' or 'expo-gl' here.
    // const pixels = await Pixels.getPixels(uri); // Returns array of {r,g,b}
    
    // 2. FOR NOW (Simulator): 
    // We will generate a fake "noisy" array of pixels to demonstrate 
    // how the median function works if we had real data.
    
    // Simulating 400 pixels (20x20) with some noise
    const fakePixels = [];
    for(let i=0; i<400; i++) {
        // Mostly Red with some noise
        fakePixels.push({
            r: 200 + Math.random() * 20, 
            g: 50 + Math.random() * 50,  
            b: 50 + Math.random() * 10 
        });
    }
    
    // 3. APPLY MEDIAN ALGORITHM
    const medianHex = calculateMedianColor(fakePixels);
    
    // In a real device without pixel reading lib, 
    // you might fallback to a server call or just returning a fixed test color
    // until you eject from Expo Go.
    return medianHex; 
}

export default function ResultsScreen() {
  const { uri } = useLocalSearchParams();
  const router = useRouter();
  const [capturedColor, setCapturedColor] = useState<string | null>(null);
  const [matches, setMatches] = useState<ColorMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const analyze = async () => {
      if (typeof uri === "string") {
        // 1. Get the Hex from the image (Mocked for now)
        const hex = await getDominantColorFromImage(uri);
        setCapturedColor(hex);

        // 2. Find Matches
        const results = ColorMatcher.findClosestMatches(hex, 5);
        setMatches(results);
        setLoading(false);
      }
    };
    analyze();
  }, [uri]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.title}>Scan Results</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      ) : (
        <View style={styles.content}>
          {/* Captured Preview */}
          <View style={styles.previewContainer}>
            <View
              style={[
                styles.capturedSwatch,
                { backgroundColor: capturedColor || "#fff" },
              ]}
            />
            <Text style={styles.capturedText}>Captured Color</Text>
            <Text style={styles.capturedHex}>
              {capturedColor?.toUpperCase()}
            </Text>

            {/* Debug: show the 1x1 pixel image stretched */}
            <Image source={{ uri: uri as string }} style={styles.debugImage} />
          </View>

          <Text style={styles.sectionTitle}>Closest Matches</Text>

          <FlatList
            data={matches}
            keyExtractor={(item) => item.item.key}
            renderItem={({ item }) => (
              <View style={styles.matchCard}>
                <View
                  style={[
                    styles.matchSwatch,
                    { backgroundColor: item.item.hex },
                  ]}
                />
                <View style={styles.matchInfo}>
                  <Text style={styles.matchKey}>{item.item.key}</Text>
                  <Text style={styles.matchHex}>
                    {item.item.hex.toUpperCase()}
                  </Text>
                </View>
                {/* Show accuracy score */}
                <View style={styles.accuracyBadge}>
                  <Text style={styles.accuracyText}>
                    {item.distance < 2
                      ? "Perfect"
                      : item.distance < 10
                      ? "Close"
                      : "Similar"}
                    ({item.distance.toFixed(1)})
                  </Text>
                </View>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F9FC", paddingTop: 60 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
    padding: 8,
    marginRight: 10,
    backgroundColor: "white",
    borderRadius: 20,
  },
  title: { fontSize: 24, fontWeight: "800" },
  content: { flex: 1, paddingHorizontal: 20 },

  previewContainer: {
    alignItems: "center",
    marginBottom: 30,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
  },
  capturedSwatch: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#eee",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  capturedText: { fontSize: 14, color: "#888", fontWeight: "600" },
  capturedHex: { fontSize: 18, fontWeight: "800", color: "#333" },
  debugImage: { width: 20, height: 20, marginTop: 10, opacity: 0.5 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    color: "#333",
  },

  matchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  matchSwatch: { width: 50, height: 50, borderRadius: 10, marginRight: 15 },
  matchInfo: { flex: 1 },
  matchKey: { fontSize: 16, fontWeight: "700", color: "#333" },
  matchHex: { fontSize: 12, color: "#888" },
  accuracyBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  accuracyText: { color: "#2E7D32", fontSize: 12, fontWeight: "700" },
});
