import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useHistory } from "@/src/core/context/HistoryContext";
import { NcsGroup } from "@/src/core/types/ncs";
import { NcsRepository } from "@/src/features/color-fan/data/ncsRepository";

export default function HistoryScreen() {
  const router = useRouter();
  const { history, clearHistory } = useHistory();
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  useEffect(() => {
    NcsRepository.getColors().then((groups: NcsGroup[]) => {
      const allColors = groups.flatMap((g) => g.strip);

      const found = history
        .map((historyKey) => {
          // 1. Try to find matched NCS Color
          const ncsMatch = allColors.find((c) => c.key === historyKey);

          if (ncsMatch) return ncsMatch;

          // 2. If not found, assume it is a Raw Hex (from Scan)
          if (historyKey.startsWith("#")) {
            return {
              key: historyKey.toUpperCase(), // Use Hex as the title
              hex: historyKey,
              isRaw: true, // Flag to identify it's not a real NCS fan item
            };
          }
          return null;
        })
        .filter((item) => item !== null);

      setHistoryItems(found);
    });
  }, [history]);

  const handlePress = (item: any) => {
    // If it's a real NCS color, open the fan
    if (!item.isRaw) {
      router.push({
        pathname: "/fans/ncs",
        params: { targetKey: item.key },
      });
    } else {
      // It's a Raw Scan -> Go to Results to find matches again!
      router.push({
        pathname: "/scan/results",
        params: { hex: item.hex }, // <--- SEND HEX, NOT URI
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.headerRow}>
        <Text style={styles.subtitle}>Recent Colors</Text>
        {history.length > 0 && (
          <Pressable onPress={clearHistory}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>

      {historyItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>No recent history.</Text>
        </View>
      ) : (
        <FlatList
          data={historyItems}
          keyExtractor={(item, index) => item.key + index} // Unique key
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, item.isRaw && styles.rawCard]} // Different style for raw scans
              onPress={() => handlePress(item)}
              // disabled={item.isRaw} // Disable click for raw colors for now
            >
              <View style={[styles.swatch, { backgroundColor: item.hex }]} />
              <View style={styles.info}>
                <Text style={styles.keyText}>
                  {item.isRaw ? "SCANNED" : item.key}
                </Text>
                <Text style={styles.hexText}>{item.hex.toUpperCase()}</Text>
              </View>
              {/* Only show arrow if it's clickable (NCS color) */}
              {!item.isRaw && (
                <Ionicons name="chevron-forward" size={20} color="#555" />
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  subtitle: {
    color: "#666",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  clearText: { color: "#FF5252", fontSize: 13, fontWeight: "600" },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.5,
  },
  emptyText: { color: "#FFF", marginTop: 10, fontSize: 16 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  // Optional: Make raw scans look slightly different
  rawCard: {
    borderColor: "#444",
    borderStyle: "dashed",
  },
  swatch: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  info: { flex: 1 },
  keyText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  hexText: { fontSize: 12, color: "#888", marginTop: 2 },
});
