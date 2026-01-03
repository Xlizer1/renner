import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

import { useFavorites } from "@/src/core/context/FavoritesContext";
import { useHistory } from "@/src/core/context/HistoryContext";
import { NcsGroup, SelectionPath } from "@/src/core/types/ncs";
import { NcsRepository } from "@/src/features/color-fan/data/ncsRepository";
import FanStrip from "@/src/features/color-fan/presentation/components/FanStrip";
import { useFanGesture } from "@/src/features/color-fan/presentation/hooks/useFanGesture";
import { useFanVirtualization } from "@/src/features/color-fan/presentation/hooks/useFanVirtualization";

export default function FanScreen() {
  const router = useRouter();

  // 1. USE GLOBAL CONTEXT (The Brain)
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToHistory } = useHistory();

  const { targetKey } = useLocalSearchParams<{ targetKey: string }>();

  const [data, setData] = useState<NcsGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<SelectionPath | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const openFullScreen = () => {
    if (selectedItem) {
      addToHistory(selectedItem.key); // <--- Save to History
      setIsFullScreen(true);
    }
  };

  useEffect(() => {
    NcsRepository.getColors().then((result) => {
      setData(result);
      setLoading(false);
    });
  }, []);

  const { rotation, panGesture, scrollToIndex } = useFanGesture(data.length);
  const { min, max } = useFanVirtualization(rotation, data.length);

  // --- DEEP LINK LOGIC ---
  useEffect(() => {
    if (!loading && data.length > 0 && targetKey) {
      const groupIndex = data.findIndex((g) =>
        g.strip.some((item) => item.key === targetKey)
      );

      if (groupIndex !== -1) {
        const itemIndex = data[groupIndex].strip.findIndex(
          (item) => item.key === targetKey
        );

        setTimeout(() => {
          scrollToIndex(groupIndex, true);
        }, 300);

        setSelection({ groupIndex, itemIndex });
      }
    }
  }, [loading, data, targetKey, scrollToIndex]);

  const handlePress = useCallback((groupIndex: number, itemIndex: number) => {
    setSelection({ groupIndex, itemIndex });
  }, []);

  const handleCopy = async (text: string, type: "Key" | "Hex") => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied!", `${type} (${text}) copied to clipboard.`);
  };

  // ❌ DELETED: const toggleFavorite = ... (Local function removed)

  if (loading)
    return (
      <ActivityIndicator style={styles.loader} size="large" color="#FFF" />
    );

  const visibleItems = data
    .map((group, index) => ({ group, index }))
    .slice(min, max);

  const selectedItem = selection
    ? data[selection.groupIndex].strip[selection.itemIndex]
    : null;

  // 2. CHECK GLOBAL STATE
  const isFav = selectedItem ? isFavorite(selectedItem.key) : false;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />

      {/* Full Screen Modal */}
      <Modal
        visible={isFullScreen}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setIsFullScreen(false)}
      >
        {selectedItem && (
          <View
            style={[
              styles.fullScreenContainer,
              { backgroundColor: selectedItem.hex },
            ]}
          >
            <RNStatusBar hidden />
            <Pressable
              style={styles.closeButton}
              onPress={() => setIsFullScreen(false)}
            >
              <Ionicons
                name="close"
                size={30}
                color={
                  parseInt(selectedItem.blackness) > 50 ? "white" : "black"
                }
              />
            </Pressable>
            <View style={styles.fullScreenInfo}>
              <Text
                style={[
                  styles.fullScreenText,
                  {
                    color:
                      parseInt(selectedItem.blackness) > 50 ? "white" : "black",
                  },
                ]}
              >
                {selectedItem.key}
              </Text>
            </View>
          </View>
        )}
      </Modal>

      {/* Main View */}
      <View style={styles.container}>
        {selectedItem && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: selectedItem.hex, opacity: 0.1 },
            ]}
          />
        )}

        <LinearGradient
          colors={["transparent", "#121212"]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <View style={styles.headerOverlay}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </Pressable>
        </View>

        <GestureDetector gesture={panGesture}>
          <View style={styles.touchArea}>
            {visibleItems.map(({ group, index }) => (
              <FanStrip
                key={index}
                group={group}
                index={index}
                rotation={rotation}
                activeItemIndex={
                  selection?.groupIndex === index ? selection.itemIndex : null
                }
                onPress={handlePress}
              />
            ))}
          </View>
        </GestureDetector>

        {/* Bottom Panel */}
        {selectedItem ? (
          <View style={styles.detailPanel}>
            <Pressable
              style={[styles.previewBox, { backgroundColor: selectedItem.hex }]}
              onPress={openFullScreen}
            >
              <Ionicons name="expand" size={16} color="rgba(0,0,0,0.3)" />
            </Pressable>

            <View style={styles.infoContainer}>
              <Text style={styles.colorCode}>{selectedItem.key}</Text>
              <Text style={styles.hexCode}>
                {selectedItem.hex.toUpperCase()}
              </Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                style={styles.iconButton}
                onPress={() => handleCopy(selectedItem.key, "Key")}
              >
                <Ionicons name="text-outline" size={18} color="#FFF" />
              </Pressable>
              <Pressable
                style={styles.iconButton}
                onPress={() => handleCopy(selectedItem.hex, "Hex")}
              >
                <Ionicons name="copy-outline" size={18} color="#FFF" />
              </Pressable>

              {/* 3. TRIGGER GLOBAL TOGGLE */}
              <Pressable
                style={[styles.iconButton, isFav && styles.favButtonActive]}
                onPress={() => {
                  toggleFavorite(selectedItem.key);
                }}
              >
                <Ionicons
                  name={isFav ? "heart" : "heart-outline"}
                  size={20}
                  color={isFav ? "#FF3B30" : "#FFF"}
                />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Swipe to rotate • Tap to select</Text>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", overflow: "hidden" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  touchArea: { flex: 1, width: "100%", zIndex: 10 },

  headerOverlay: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 50,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(30,30,30,0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
  },

  detailPanel: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#333",
  },
  previewBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: { flex: 1, justifyContent: "center" },
  colorCode: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
  hexCode: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  actions: { flexDirection: "row", gap: 8 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2C2C2C",
    alignItems: "center",
    justifyContent: "center",
  },
  favButtonActive: { backgroundColor: "#3D0000" },

  hintContainer: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    backgroundColor: "rgba(30,30,30,0.8)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  hintText: { color: "#AAA", fontSize: 12, fontWeight: "600" },

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
  fullScreenInfo: { position: "absolute", bottom: 100 },
  fullScreenText: { fontSize: 24, fontWeight: "bold", opacity: 0.8 },
});
