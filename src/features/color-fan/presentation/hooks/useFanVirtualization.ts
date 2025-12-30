import { FAN_CONFIG } from "@/src/core/constants/fanConfig";
import { useState } from "react";
import {
    runOnJS,
    SharedValue,
    useAnimatedReaction,
} from "react-native-reanimated";

/**
 * Handles the logic of deciding which items should be rendered
 * based on the current rotation angle.
 */
export const useFanVirtualization = (
  rotation: SharedValue<number>,
  totalItems: number
) => {
  const [windowRange, setWindowRange] = useState({ min: 0, max: 15 });

  const updateWindow = (min: number, max: number) => {
    setWindowRange((prev) =>
      prev.min === min && prev.max === max ? prev : { min, max }
    );
  };

  useAnimatedReaction(
    () => rotation.value,
    (currentRotation) => {
      const centerIndex = Math.round(
        -currentRotation / FAN_CONFIG.SPREAD_ANGLE
      );
      const newMin = Math.max(0, centerIndex - FAN_CONFIG.RENDER_WINDOW);
      const newMax = Math.min(
        totalItems,
        centerIndex + FAN_CONFIG.RENDER_WINDOW
      );
      runOnJS(updateWindow)(newMin, newMax);
    },
    [totalItems]
  );

  return windowRange;
};
