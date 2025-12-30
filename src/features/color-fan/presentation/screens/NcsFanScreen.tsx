import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
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
  // 1. Data State
  const [data, setData] = useState<NcsGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<SelectionPath | null>(null);

  // 2. Load Data
  useEffect(() => {
    NcsRepository.getColors().then((result) => {
      setData(result);
      setLoading(false);
    });
  }, []);

  // 3. Init Logic Hooks
  const { rotation, panGesture } = useFanGesture(data.length);
  const { min, max } = useFanVirtualization(rotation, data.length);

  // 4. Handlers
  const handlePress = useCallback((groupIndex: number, itemIndex: number) => {
    setSelection({ groupIndex, itemIndex });
  }, []);

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  // 5. Calculate Visible Subset
  const visibleItems = data
    .map((group, index) => ({ group, index }))
    .slice(min, max);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
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

        {/* Info Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {selection
              ? `Selected: ${
                  data[selection.groupIndex].strip[selection.itemIndex].key
                }`
              : "Tap a color"}
          </Text>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef",
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
  footer: {
    position: "absolute",
    top: 60,
    width: "100%",
    alignItems: "center",
    pointerEvents: "none",
    zIndex: 20,
  },
  footerText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
