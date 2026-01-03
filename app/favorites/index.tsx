import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useFavorites } from "@/src/core/context/FavoritesContext";
import { NcsGroup } from "@/src/core/types/ncs";
import { NcsRepository } from "@/src/features/color-fan/data/ncsRepository";

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites } = useFavorites();
  const [favoriteItems, setFavoriteItems] = useState<any[]>([]);

  useEffect(() => {
    // Convert list of Keys ["S 0502-Y"] into full Color Objects
    NcsRepository.getColors().then((groups: NcsGroup[]) => {
      const allColors = groups.flatMap((g) => g.strip);
      const found = allColors.filter((c) => favorites.includes(c.key));
      setFavoriteItems(found);
    });
  }, [favorites]);

  const openInFan = (colorKey: string) => {
    router.push({
      pathname: "/fans/ncs",
      params: { targetKey: colorKey },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-dislike-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>No favorites yet.</Text>
        </View>
      ) : (
        <FlatList
          data={favoriteItems}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => openInFan(item.key)}>
              <View style={[styles.swatch, { backgroundColor: item.hex }]} />
              <View style={styles.info}>
                <Text style={styles.keyText}>{item.key}</Text>
                <Text style={styles.hexText}>{item.hex.toUpperCase()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#555" />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
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
