import FanStrip from "@/components/fan-strip";
import { getAllStrips } from "@/utils/ncsData";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withDecay,
  withSpring,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

// --- Configuration ---
const STRIP_WIDTH = width * 0.35;
const STRIP_HEIGHT = height * 0.6;
const SPREAD_PER_ITEM = 3.5;

// Tuned virtualization parameters:
// VISIBLE_WINDOW: Base number of items to render (approx 1.5x screen width coverage)
// WINDOW_OVERLAP: Extra buffer on each side to absorb fast scrolls before React renders
const VISIBLE_WINDOW = 40;
const WINDOW_OVERLAP = 20;

// --- 2. Main Screen Component ---
export default function HueSelectionScreen() {
  const [loading, setLoading] = useState(true);
  const [allStrips, setAllStrips] = useState<any[]>([]);

  // Header display state
  const [centerIdx, setCenterIdx] = useState(0);
  // Virtualized window state
  const [renderWindow, setRenderWindow] = useState({
    start: 0,
    end: VISIBLE_WINDOW + WINDOW_OVERLAP,
  });

  // Load ALL Data on Mount
  useEffect(() => {
    setTimeout(() => {
      const data = getAllStrips();
      setAllStrips(data);

      // Initial Window
      const halfWindow = VISIBLE_WINDOW / 2;
      let start = Math.floor(0 - halfWindow) - WINDOW_OVERLAP;
      let end = Math.ceil(0 + halfWindow) + WINDOW_OVERLAP;
      if (start < 0) start = 0;
      if (end > data.length) end = data.length;
      setRenderWindow({ start, end });

      setCenterIdx(0);
      setLoading(false);
    }, 50);
  }, []);

  const TOTAL_STRIPS = allStrips.length;

  // Animation Values
  const progress = useSharedValue(0);
  const virtualIndex = useSharedValue(0);
  const context = useSharedValue({ startProgress: 0, startIndex: 0 });

  // Interaction state for hardware acceleration
  const [isInteracting, setIsInteracting] = useState(false);
  const [progressLevel, setProgressLevel] = useState(0);
  const lastWindowUpdate = useSharedValue(0);

  // PRELOAD_EDGE: If virtualIndex gets within this many items of the render window edge, update.
  const PRELOAD_EDGE = 15;
  // WINDOW_THRESHOLD: Minimum movement to trigger a non-edge update
  const WINDOW_THRESHOLD = 5;

  const updateWindow = (center: number) => {
    const halfWindow = Math.floor(VISIBLE_WINDOW / 2);
    // Rounding center ensures consistent window snapping
    const centerIdxForWindow = Math.round(center);

    // Compute consistent fixed-size window around center
    let start = centerIdxForWindow - halfWindow - WINDOW_OVERLAP;
    if (start < 0) start = 0;

    const windowSize = VISIBLE_WINDOW + WINDOW_OVERLAP * 2;
    let end = start + windowSize;

    // Clamp to data bounds
    if (end > TOTAL_STRIPS) {
      end = TOTAL_STRIPS;
      // Adjust start to maintain window size at end of list if possible
      start = Math.max(0, end - windowSize);
    }

    setRenderWindow({ start, end });
  };

  useAnimatedReaction(
    () => virtualIndex.value,
    (curr, prev) => {
      // 1. Mirror center index for header text (lightweight)
      runOnJS(setCenterIdx)(
        Math.min(Math.max(Math.round(curr), 0), Math.max(TOTAL_STRIPS - 1, 0))
      );

      if (TOTAL_STRIPS === 0) return;

      // 2. Window Management Logic
      // If we don't have a previous value, force update
      if (prev == null) {
        runOnJS(updateWindow)(curr);
        return;
      }

      // Edge Detection: Am I close to the edge of the currently rendered set?
      const c = Math.round(curr);
      const { start, end } = renderWindow;

      const isCloseToStart = c <= start + PRELOAD_EDGE;
      const isCloseToEnd = c >= end - PRELOAD_EDGE;

      if (isCloseToStart || isCloseToEnd) {
        runOnJS(updateWindow)(curr);
        return;
      }

      // Fallback: If we jumped a large distance without hitting edge logic
      if (Math.abs(curr - prev) > WINDOW_THRESHOLD) {
        runOnJS(updateWindow)(curr);
      }
    }
  );

  // Mirror progress value into React state (used to estimate projected X
  // position during render to skip strips that would be entirely off-screen
  // to the left). Kept lightweight.
  useAnimatedReaction(
    () => progress.value,
    (p) => {
      runOnJS(setProgressLevel)(p);
    }
  );

  // --- Gesture Handler ---
  const pan = Gesture.Pan()
    .onStart(() => {
      cancelAnimation(virtualIndex);
      context.value = {
        startProgress: progress.value,
        startIndex: virtualIndex.value,
      };
      runOnJS(setIsInteracting)(true);
    })
    .onUpdate((event) => {
      // Vertical
      const newProgress =
        context.value.startProgress + event.translationY / -300;
      progress.value = Math.min(Math.max(newProgress, 0), 1);

      // Horizontal
      if (progress.value > 0.1) {
        // Sensitivity: 1 screen width = 25 items
        const deltaIndex = (event.translationX / width) * -25;
        let newIndex = context.value.startIndex + deltaIndex;

        // Boundaries
        if (newIndex < 0) newIndex = 0;
        if (newIndex > TOTAL_STRIPS - 1) newIndex = TOTAL_STRIPS - 1;

        virtualIndex.value = newIndex;

        // Proactive Update for Fast Flings
        // If moving fast, don't wait for the reaction hook (which might lag).
        // Force a window update, throttled to avoid bridge congestion.
        const VELOCITY_THRESHOLD = 800;
        const MIN_UPDATE_INTERVAL = 100; // ms

        if (Math.abs(event.velocityX) > VELOCITY_THRESHOLD) {
          const now = Date.now();
          if (now - lastWindowUpdate.value > MIN_UPDATE_INTERVAL) {
            lastWindowUpdate.value = now;
            runOnJS(updateWindow)(newIndex);
          }
        }
      }
    })
    .onEnd((event) => {
      // Snap Logic
      if (progress.value > 0.2 || event.velocityY < -500) {
        progress.value = withSpring(1);

        // Momentum Scrolling
        virtualIndex.value = withDecay({
          velocity: (event.velocityX / width) * -25,
          clamp: [0, TOTAL_STRIPS - 1],
        });
      } else {
        progress.value = withSpring(0);
      }

      // Predictive Loading:
      // Calculate where the decay will likely take us and move the window there NOW.
      // This prevents the "blank gap" when the animation moves faster than React can render.
      const velocityIndex = (event.velocityX / width) * -25;
      const PREDICTION_FACTOR = 0.8; // 60% of raw velocity vector
      const predicted = virtualIndex.value + velocityIndex * PREDICTION_FACTOR;
      const predictedClamped = Math.min(
        Math.max(Math.round(predicted), 0),
        Math.max(TOTAL_STRIPS - 1, 0)
      );

      runOnJS(updateWindow)(predictedClamped);
      runOnJS(setIsInteracting)(false);
    });

  const currentItem = allStrips[centerIdx];
  const currentHue = currentItem ? currentItem.hueFamily : "NCS";

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{currentHue}</Text>
        <Text style={styles.headerSubtitle}>
          {loading ? "Loading..." : `${centerIdx} / ${TOTAL_STRIPS}`}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: "#888", marginTop: 10 }}>
            Generating Fan...
          </Text>
        </View>
      ) : (
        <GestureDetector gesture={pan}>
          <View style={styles.interactionArea}>
            <View style={styles.fanAnchor}>
              {allStrips
                .slice(renderWindow.start, renderWindow.end)
                .map((item, i) => {
                  const realIndex = renderWindow.start + i;
                  // Estimate whether this strip will be rendered off-screen
                  // to the left once transforms are applied. We approximate
                  // translateX = distFromCenter * 3 * progressLevel (matches
                  // FanStrip's transform logic). If the projected right edge
                  // is left of the screen, skip rendering.
                  const distFromCenter = realIndex - centerIdx;
                  const projectedX = distFromCenter * 3 * progressLevel;
                  const projectedRight = projectedX + STRIP_WIDTH;
                  if (projectedRight < -STRIP_WIDTH * 0.25) {
                    return null;
                  }

                  return (
                    <View key={realIndex} style={styles.stripWrapper}>
                      <FanStrip
                        item={item}
                        index={realIndex}
                        virtualIndex={virtualIndex}
                        progress={progress}
                        stripHeight={STRIP_HEIGHT}
                        stripWidth={STRIP_WIDTH}
                        spreadPerItem={SPREAD_PER_ITEM}
                        isInteracting={isInteracting}
                      />
                    </View>
                  );
                })}
            </View>
            <Text style={styles.hintText}>Swipe Up to Open</Text>
          </View>
        </GestureDetector>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 60,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    marginBottom: 20,
    alignItems: "center",
    paddingHorizontal: 20,
    position: "absolute",
    top: 60,
    width: "100%",
    zIndex: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "#666",
    fontSize: 13,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  interactionArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 40,
  },
  fanAnchor: {
    width: STRIP_WIDTH,
    height: STRIP_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 30,
  },
  stripWrapper: {
    position: "absolute",
    bottom: 0,
  },
  hintText: {
    color: "#444",
    marginTop: 40,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});
