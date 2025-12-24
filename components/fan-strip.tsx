import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
} from "react-native-reanimated";

const SPREAD_PER_ITEM_DEFAULT = 3.5;

function FanStrip({
  item,
  index,
  virtualIndex,
  progress,
  stripHeight = 0,
  stripWidth = 0,
  spreadPerItem = SPREAD_PER_ITEM_DEFAULT,
  isInteracting = false,
}: {
  item: { strip: any[]; hueFamily: string };
  index: number;
  virtualIndex: SharedValue<number>;
  progress: SharedValue<number>;
  stripHeight?: number;
  stripWidth?: number;
  spreadPerItem?: number;
  isInteracting?: boolean;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const distFromCenter = index - virtualIndex.value;
    const targetRotate = distFromCenter * spreadPerItem;

    const rotateZ = interpolate(
      progress.value,
      [0, 1],
      [0, targetRotate],
      Extrapolation.EXTEND
    );

    const translateY = interpolate(
      progress.value,
      [0, 1],
      [0, Math.abs(distFromCenter) * -2]
    );

    const translateX = interpolate(
      progress.value,
      [0, 1],
      [0, distFromCenter * 3]
    );

    return {
      transform: [
        { translateY: stripHeight },
        { rotateZ: `${rotateZ}deg` },
        { translateY: -stripHeight },
        { translateX },
        { translateY },
      ],
      zIndex: 1000 - Math.abs(Math.round(distFromCenter)),
    };
  });

  return (
    <Animated.View
      // Hardware texture caching is crucial for performance during interaction
      renderToHardwareTextureAndroid={isInteracting}
      shouldRasterizeIOS={isInteracting}
      style={[
        styles.stripContainer,
        { width: stripWidth || 0, height: stripHeight || "100%" },
        animatedStyle,
      ]}
    >
      {item.strip.map((colorItem: any) => {
        const isDark = parseInt(colorItem.blackness) > 40;
        return (
          <View
            key={colorItem.key}
            style={[styles.colorBlock, { backgroundColor: colorItem.hex }]}
          >
            <Text
              style={[
                styles.codeText,
                { color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.7)" },
              ]}
            >
              {colorItem.key}
            </Text>
          </View>
        );
      })}

      <View style={styles.headerTab}>
        <Text style={styles.headerTabText}>{item.hueFamily}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stripContainer: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
    overflow: "hidden",
  },
  colorBlock: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 5,
  },
  codeText: {
    fontSize: 8,
    fontWeight: "700",
  },
  headerTab: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#000",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderBottomLeftRadius: 6,
  },
  headerTabText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});

// Update memo comparison to handle isInteracting changes
const MemoFanStrip = React.memo(FanStrip, (prev, next) => {
  return (
    prev.index === next.index &&
    prev.isInteracting === next.isInteracting &&
    prev.item === next.item
  );
});

MemoFanStrip.displayName = "FanStrip";

export default MemoFanStrip;
