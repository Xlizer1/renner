/* eslint-disable react/display-name */
import { FAN_CONFIG } from "@/src/core/constants/fanConfig";
import { NcsGroup } from "@/src/core/types/ncs";
import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";
import ColorSwatch from "./ColorSwatch";

interface Props {
  group: NcsGroup;
  index: number;
  rotation: SharedValue<number>;
  activeItemIndex: number | null;
  onPress: (groupIndex: number, itemIndex: number) => void;
}

const FanStrip = memo(
  ({ group, index, rotation, activeItemIndex, onPress }: Props) => {
    const baseAngle = index * FAN_CONFIG.SPREAD_ANGLE;

    const animatedStyle = useAnimatedStyle(() => {
      const currentAngle = baseAngle + rotation.value;
      const distFromCenter = Math.abs(currentAngle);
      return {
        transform: [
          { translateY: FAN_CONFIG.PIVOT_Y },
          { rotate: `${currentAngle}deg` },
        ],
        // Dynamic Z-Index for stacking
        zIndex: 1000 - Math.round(distFromCenter),
      };
    });

    return (
      <Animated.View
        style={[styles.container, animatedStyle]}
        pointerEvents="box-none"
      >
        <View
          style={styles.card}
          shouldRasterizeIOS={true}
          renderToHardwareTextureAndroid={true}
        >
          {group.strip.map((item, i) => (
            <ColorSwatch
              key={i}
              item={item}
              isSelected={activeItemIndex === i}
              onPress={() => onPress(index, i)}
            />
          ))}
        </View>
      </Animated.View>
    );
  },
  (prev, next) => {
    // Optimization: Only re-render if indices match OR selection changed inside this specific strip
    return (
      prev.index === next.index &&
      prev.activeItemIndex === next.activeItemIndex &&
      prev.group === next.group
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: "50%",
    marginLeft: -FAN_CONFIG.CARD_WIDTH / 2,
    width: FAN_CONFIG.CARD_WIDTH,
    height: FAN_CONFIG.CARD_HEIGHT * 2, // Pivot trick
    justifyContent: "flex-start",
    alignItems: "center",
  },
  card: {
    width: "100%",
    height: FAN_CONFIG.CARD_HEIGHT,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
  },
});

export default FanStrip;
