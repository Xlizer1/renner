import { FAN_CONFIG } from "@/src/core/constants/fanConfig";
import * as Haptics from "expo-haptics";
import {
    runOnJS,
    SharedValue,
    useAnimatedReaction,
} from "react-native-reanimated";

export const useFanHaptics = (rotation: SharedValue<number>) => {
  const triggerTick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {
    });
  };

  useAnimatedReaction(
    () => rotation.value,
    (currentRotation, previousRotation) => {
      if (previousRotation === null) return;

      // Calculate which card index is currently in the center
      const idxNow = Math.round(-currentRotation / FAN_CONFIG.SPREAD_ANGLE);
      const idxPrev = Math.round(-previousRotation / FAN_CONFIG.SPREAD_ANGLE);

      // If the index changed -> TICK
      if (idxNow !== idxPrev) {
        runOnJS(triggerTick)();
      }
    },
    []
  );
};
