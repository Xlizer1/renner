/* eslint-disable react/display-name */
import { getAllStrips } from "@/utils/ncsData";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const CARD_WIDTH = 150;
const CARD_HEIGHT = 500;
const FAN_SPREAD_ANGLE = 10; 

// 🔥 CRITICAL: Only render this many cards at once.
// 7 cards to the left, 7 to the right. Total ~15 views instead of 200.
const RENDER_WINDOW_SIZE = 13; 

export default function Index() {
  const [stripsColors, setStripsColors] = useState<any[]>([]);
  const [isReady, setIsReady] = useState(false);
  
  // Track the visible window in State
  const [windowRange, setWindowRange] = useState({ min: 0, max: 15 });

  useEffect(() => {
    const data = getAllStrips();
    setStripsColors(data);
    setIsReady(true);
  }, []);

  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);

  // 1. ANIMATED REACTION:
  // Watch rotation on the UI thread. When it changes significantly, 
  // update the React State to mount/unmount views.
  useAnimatedReaction(
    () => {
      return rotation.value;
    },
    (currentRotation) => {
      // Calculate which card index is currently in the "Middle"
      // (Negative rotation because dragging left increases negative angle)
      const centerIndex = Math.round(-currentRotation / FAN_SPREAD_ANGLE);
      
      const newMin = Math.max(0, centerIndex - RENDER_WINDOW_SIZE);
      const newMax = Math.min(stripsColors.length, centerIndex + RENDER_WINDOW_SIZE);

      // Call JS function to update state (throttled logic could go here)
      runOnJS(updateWindow)(newMin, newMax);
    },
    [stripsColors.length] // Dependency
  );

  function updateWindow(min: number, max: number) {
    // Only trigger re-render if indices actually changed
    setWindowRange((prev) => {
      if (prev.min === min && prev.max === max) return prev;
      return { min, max };
    });
  }

  const pan = Gesture.Pan()
    .onBegin(() => {
      savedRotation.value = rotation.value;
    })
    .onUpdate((e) => {
      rotation.value = savedRotation.value + e.translationX / 3; 
    })
    .onEnd((e) => {
      rotation.value = withDecay({
        velocity: e.velocityX / 3,
        rubberBandEffect: true,
        clamp: [-(stripsColors.length - 1) * FAN_SPREAD_ANGLE, 0],
      });
    });

  if (!isReady) {
    return <ActivityIndicator style={{ marginTop: 50 }} size="large" />;
  }

  const FAN_Y_OFFSET = SCREEN_HEIGHT / 2 - 90;

  // 2. VIRTUALIZATION:
  // Create a subset of data to render.
  // We strictly use the original Index to keep positions correct.
  const visibleItems = stripsColors
    .map((group, index) => ({ group, index }))
    .slice(windowRange.min, windowRange.max);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <GestureDetector gesture={pan}>
          {/* Use a transparent view to capture touches over the whole area */}
          <View style={styles.touchArea}>
            {visibleItems.map((item) => (
              <FanStrip
                key={item.index} // 🔥 KEY MUST BE STABLE (The original index)
                group={item.group}
                index={item.index}
                totalRotation={rotation}
                fanY={FAN_Y_OFFSET}
              />
            ))}
          </View>
        </GestureDetector>
        
        <View style={styles.instructions}>
            <Text style={styles.instructionText}>
                Index: {windowRange.min} - {windowRange.max}
            </Text>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

// Optimized Component
const FanStrip = React.memo(({ group, index, totalRotation, fanY }: any) => {
  const baseAngle = index * FAN_SPREAD_ANGLE;

  const animatedStyle = useAnimatedStyle(() => {
    // 1. Calculate where this card is relative to the center (0 degrees)
    const currentAngle = baseAngle + totalRotation.value;
    
    // 2. Calculate distance from center (absolute value)
    const distFromCenter = Math.abs(currentAngle);

    return {
      transform: [
        { translateY: fanY },
        { rotate: `${currentAngle}deg` },
      ],
      // 3. Dynamic Z-Index:
      // The closer to the center (distFromCenter is small), the higher the zIndex.
      // We round it to ensure it's an integer for the renderer.
      zIndex: 1000 - Math.round(distFromCenter), 
    };
  });

  return (
    <Animated.View style={[styles.fanItemContainer, animatedStyle]} pointerEvents="none">
      <View style={styles.stripCard} shouldRasterizeIOS={true} renderToHardwareTextureAndroid={true}>
        {group.strip.map((item: any, i: number) => (
          <View key={i} style={[styles.colorSwatch, { backgroundColor: item.hex }]}>
            <Text style={styles.swatchText}>{item.key}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef",
    overflow: "hidden",
  },
  touchArea: {
    flex: 1,
    width: "100%",
    zIndex: 10,
  },
  instructions: {
    position: "absolute",
    top: 60,
    width: "100%",
    alignItems: "center",
    pointerEvents: "none",
  },
  instructionText: {
    color: "#888",
    fontWeight: "bold",
  },
  fanItemContainer: {
    position: "absolute",
    left: "50%", // Center horizontally
    marginLeft: -CARD_WIDTH / 2, // Offset by half width
    width: CARD_WIDTH,
    height: CARD_HEIGHT * 2, 
    justifyContent: "flex-start",
    alignItems: "center",
  },
  stripCard: {
    width: "100%",
    height: CARD_HEIGHT,
    backgroundColor: "white",
    borderRadius: 8,
    // Removed Shadows for Android Performance
    borderWidth: 1,
    borderColor: "#ddd",
  },
  colorSwatch: {
    flex: 1,
    width: "100%",
    padding: 8,
    alignItems: "flex-end",
  },
  swatchText: {
    color: "rgba(0,0,0,0.6)",
    fontSize: 10,
    fontWeight: "700",
  },
});