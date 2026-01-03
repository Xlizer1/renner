import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const API_URL = "http://192.168.0.169:3000/analyze";

export default function ResultsScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (uri) uploadImage(uri as string);
  }, [uri]);

  const uploadImage = async (imageUri: string) => {
    try {
      // 1. Prepare Form Data
      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        name: "scan.png",
        type: "image/png",
      } as any); // Type assertion needed for RN FormData

      // 2. Send to Server
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = await response.json();

      // 3. Set Data
      setResults(data); // { detectedColor: "#...", matches: [...] }
      setLoading(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not connect to server.");
      setLoading(false);
    }
  };

  const openInFan = (colorKey: string) => {
    // Since we currently only have NCS, we assume it's NCS.
    // If you add RAL later, you would check "if (colorKey.startsWith('RAL')) ..."

    router.push({
      pathname: "/fans/ncs",
      params: { targetKey: colorKey }, // Pass the key!
    });
  };

  if (loading)
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      {/* Show Captured Color returned by Server */}
      <View
        style={[styles.swatch, { backgroundColor: results?.detectedColor }]}
      />
      <Text style={styles.hex}>{results?.detectedColor?.toUpperCase()}</Text>

      <Text style={styles.title}>Matches (Calculated on Server)</Text>

      <FlatList
        data={results?.matches || []}
        keyExtractor={(item) => item.item.key}
        renderItem={({ item }) => (
          <View style={styles.matchCard}>
            {/* Left Side: Color Info */}
            <View style={styles.rowLeft}>
              <View
                style={[styles.miniSwatch, { backgroundColor: item.item.hex }]}
              />
              <View>
                <Text style={styles.matchKey}>{item.item.key}</Text>
                <Text style={styles.distance}>
                  Dist: {item.distance.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Right Side: Action Button */}
            <Pressable
              style={styles.viewFanButton}
              onPress={() => openInFan(item.item.key)}
            >
              <Text style={styles.viewFanText}>Locate</Text>
              <Ionicons name="chevron-forward" size={16} color="white" />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  swatch: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 10,
    borderWidth: 4,
    borderColor: "#fff",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  hex: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 30,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
  },
  matchCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Push button to right
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    // Shadow
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniSwatch: { width: 40, height: 40, borderRadius: 8, marginRight: 12 },
  matchKey: { fontWeight: "700", fontSize: 16, color: "#333" },
  distance: { fontSize: 12, color: "#888" },

  viewFanButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  viewFanText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
});
