import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard"; // Import Clipboard
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

import { NcsGroup, SelectionPath } from "@/src/core/types/ncs";
import { NcsRepository } from "@/src/features/color-fan/data/ncsRepository";
import FanStrip from "@/src/features/color-fan/presentation/components/FanStrip";
import { useFanGesture } from "@/src/features/color-fan/presentation/hooks/useFanGesture";
import { useFanVirtualization } from "@/src/features/color-fan/presentation/hooks/useFanVirtualization";

export default function FanScreen() {
  const [data, setData] = useState<NcsGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<SelectionPath | null>(null);

  // New State for features
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]); // Store IDs of favorites

  useEffect(() => {
    NcsRepository.getColors().then((result) => {
      setData(result);
      setLoading(false);
    });
  }, []);

  const { rotation, panGesture } = useFanGesture(data.length);
  const { min, max } = useFanVirtualization(rotation, data.length);

  const handlePress = useCallback((groupIndex: number, itemIndex: number) => {
    if(groupIndex === selection?.groupIndex && itemIndex === selection?.itemIndex) {
      // Deselect if the same item is tapped
      setSelection(null);
    } else {
      setSelection({ groupIndex, itemIndex });
    }
  }, [selection?.groupIndex, selection?.itemIndex]);

  // --- NEW HANDLERS ---

  const handleCopy = async (text: string, type: "Key" | "Hex") => {
    await Clipboard.setStringAsync(text);
    // In a real app, use a Toast component here
    Alert.alert("Copied!", `${type} (${text}) copied to clipboard.`);
  };

  const toggleFavorite = (key: string) => {
    setFavorites((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const getSelectedItem = () => {
    if (!selection) return null;
    return data[selection.groupIndex].strip[selection.itemIndex];
  };

  const selectedItem = getSelectedItem();
  const isFav = selectedItem ? favorites.includes(selectedItem.key) : false;

  if (loading) return <ActivityIndicator style={styles.loader} size="large" />;

  const visibleItems = data
    .map((group, index) => ({ group, index }))
    .slice(min, max);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* 1. FULL SCREEN MODAL */}
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
            <StatusBar hidden />

            {/* Close Button */}
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

            {/* Centered Info */}
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

      <View
        style={[
          styles.container,
          {
            backgroundColor: selectedItem ? selectedItem.hex + "15" : "#F2F4F8",
          },
        ]}
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.05)"]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

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

        {selectedItem ? (
          <View style={styles.detailPanel}>
            {/* 2. Color Preview (Click for Full Screen) */}
            <Pressable
              style={[styles.previewBox, { backgroundColor: selectedItem.hex }]}
              onPress={() => setIsFullScreen(true)}
            >
              <Ionicons name="expand" size={16} color="rgba(0,0,0,0.3)" />
            </Pressable>

            <View style={styles.infoContainer}>
              <Text style={styles.colorCode}>{selectedItem.key}</Text>
              <Text style={styles.hexCode}>
                {selectedItem.hex.toUpperCase()}
              </Text>
            </View>

            {/* 3. Action Buttons Row */}
            <View style={styles.actions}>
              {/* Copy Key Button */}
              <Pressable
                style={styles.iconButton}
                onPress={() => handleCopy(selectedItem.key, "Key")}
              >
                <Ionicons name="text-outline" size={18} color="#555" />
              </Pressable>

              {/* Copy Hex Button */}
              <Pressable
                style={styles.iconButton}
                onPress={() => handleCopy(selectedItem.hex, "Hex")}
              >
                <Ionicons name="copy-outline" size={18} color="#555" />
              </Pressable>

              {/* Favorite Button */}
              <Pressable
                style={[styles.iconButton, isFav && styles.favButtonActive]}
                onPress={() => toggleFavorite(selectedItem.key)}
              >
                <Ionicons
                  name={isFav ? "heart" : "heart-outline"}
                  size={20}
                  color={isFav ? "#FF3B30" : "#555"}
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
  container: {
    flex: 1,
    backgroundColor: "#F2F4F8",
    overflow: "hidden",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  touchArea: {
    flex: 1,
    width: "100%",
    zIndex: 10,
  },
  detailPanel: {
    position: "absolute",
    bottom: 25,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  previewBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  colorCode: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
  },
  hexCode: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    marginTop: 2,
    fontVariant: ["tabular-nums"], // Monospaced numbers
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
  },
  favButtonActive: {
    backgroundColor: "#FFE5E5", // Light red background when active
  },
  hintContainer: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 20,
  },
  hintText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },

  // Full Screen Styles
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
    backgroundColor: "rgba(0,0,0,0.1)", // Subtle backing
  },
  fullScreenInfo: {
    position: "absolute",
    bottom: 100,
  },
  fullScreenText: {
    fontSize: 24,
    fontWeight: "bold",
    opacity: 0.8,
  },
});
