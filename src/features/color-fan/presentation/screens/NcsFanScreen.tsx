import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
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
import { RennerRepository } from "@/src/features/color-fan/data/rennerRepository";
import FanStrip from "@/src/features/color-fan/presentation/components/FanStrip";
import { useFanGesture } from "@/src/features/color-fan/presentation/hooks/useFanGesture";
import { useFanVirtualization } from "@/src/features/color-fan/presentation/hooks/useFanVirtualization";

interface FanScreenProps {
  mode?: "ncs" | "renner";
  collectionId?: string;
}

export default function FanScreen({
  mode = "ncs",
  collectionId = "",
}: FanScreenProps) {
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToHistory } = useHistory();
  const { targetKey } = useLocalSearchParams<{ targetKey: string }>();

  const [data, setData] = useState<NcsGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<SelectionPath | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // --- DATA LOADING ---
  useEffect(() => {
    setLoading(true);

    if (mode === "ncs") {
      NcsRepository.getColors().then((result) => {
        setData(result);
        setLoading(false);
      });
    } else {
      RennerRepository.getColors(collectionId).then((result) => {
        setData(result);
        setLoading(false);
      });
    }
  }, [mode, collectionId]);

  // --- GESTURES ---
  const { rotation, panGesture, scrollToIndex } = useFanGesture(data.length);
  const { min, max } = useFanVirtualization(rotation, data.length);

  // --- DEEP LINKING ---
  useEffect(() => {
    if (!loading && data.length > 0 && targetKey) {
      const groupIndex = data.findIndex((g) =>
        g.strip.some((item) => item.key === targetKey)
      );
      if (groupIndex !== -1) {
        const itemIndex = data[groupIndex].strip.findIndex(
          (item) => item.key === targetKey
        );
        setTimeout(() => scrollToIndex(groupIndex, true), 300);
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

  const visibleItems = React.useMemo(() => {
    return data.map((group, index) => ({ group, index })).slice(min, max);
  }, [data, min, max]);

  if (loading)
    return (
      <ActivityIndicator style={styles.loader} size="large" color="#FFF" />
    );

  const selectedItem = selection
    ? data[selection.groupIndex].strip[selection.itemIndex]
    : null;

  const isFav = selectedItem ? isFavorite(selectedItem.key) : false;

  const getBackgroundStyle = () => {
    if (!selectedItem) return {};
    if (selectedItem.isTexture) return { backgroundColor: "#000" };
    return { backgroundColor: selectedItem.hex as string };
  };

  const openFullScreen = () => {
    if (selectedItem) {
      addToHistory(selectedItem.key);
      setIsFullScreen(true);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />

      {/* --- FULL SCREEN MODAL --- */}
      <Modal
        visible={isFullScreen}
        animationType="fade"
        onRequestClose={() => setIsFullScreen(false)}
      >
        {selectedItem && (
          <View style={[styles.fullScreenContainer, getBackgroundStyle()]}>
            <RNStatusBar hidden />

            {/* If Texture, render Full Image */}
            {selectedItem.isTexture && (
              <Image
                source={selectedItem.hex}
                style={[
                  StyleSheet.absoluteFill,
                  // --- FIX: Zoom in if it is CS ---
                  selectedItem.hue === "CS" && { transform: [{ scale: 2.5 }] },
                ]}
                contentFit="cover"
              />
            )}

            <Pressable
              style={styles.closeButton}
              onPress={() => setIsFullScreen(false)}
            >
              <Ionicons name="close" size={30} color="#FFF" />
            </Pressable>

            <View style={styles.fullScreenInfo}>
              <Text style={[styles.fullScreenText, { color: "#FFF" }]}>
                {selectedItem.key}
              </Text>
            </View>
          </View>
        )}
      </Modal>

      {/* --- MAIN VIEW --- */}
      <View style={styles.container}>
        {/* Dynamic Background */}
        {selectedItem && !selectedItem.isTexture && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: selectedItem.hex as string, opacity: 0.1 },
            ]}
          />
        )}

        <LinearGradient
          colors={["transparent", "#121212"]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
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

        {/* --- BOTTOM PANEL --- */}
        {selectedItem ? (
          <View style={styles.detailPanel}>
            {/* Tiny Preview Box */}
            <Pressable
              style={[
                styles.previewBox,
                !selectedItem.isTexture && {
                  backgroundColor: selectedItem.hex as string,
                },
              ]}
              onPress={openFullScreen}
            >
              {selectedItem.isTexture ? (
                <Image
                  source={selectedItem.hex}
                  style={[
                    { width: "100%", height: "100%" },
                    // Optional: You can apply the zoom to the preview icon too if you want
                    selectedItem.hue === "CS" && {
                      transform: [{ scale: 1.5 }],
                    },
                  ]}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="expand" size={16} color="rgba(0,0,0,0.3)" />
              )}
            </Pressable>

            <View style={styles.infoContainer}>
              <Text style={styles.colorCode}>{selectedItem.key}</Text>

              {!selectedItem.isTexture && (
                <Text style={styles.hexCode}>
                  {(selectedItem.hex as string).toUpperCase()}
                </Text>
              )}
              {selectedItem.isTexture && (
                <Text style={styles.hexCode}>Wood Finish</Text>
              )}
            </View>

            <View style={styles.actions}>
              <Pressable
                style={styles.iconButton}
                onPress={() => handleCopy(selectedItem.key, "Key")}
              >
                <Ionicons name="text-outline" size={18} color="#FFF" />
              </Pressable>

              {!selectedItem.isTexture && (
                <Pressable
                  style={styles.iconButton}
                  onPress={() => handleCopy(selectedItem.hex as string, "Hex")}
                >
                  <Ionicons name="copy-outline" size={18} color="#FFF" />
                </Pressable>
              )}

              <Pressable
                style={[styles.iconButton, isFav && styles.favButtonActive]}
                onPress={() => toggleFavorite(selectedItem.key)}
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
    overflow: "hidden",
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
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  fullScreenInfo: { position: "absolute", bottom: 100 },
  fullScreenText: { fontSize: 24, fontWeight: "bold", opacity: 0.8 },
});