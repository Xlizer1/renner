import { FAN_CONFIG } from "@/src/core/constants/fanConfig";
import { useCallback } from "react";
import { Gesture } from "react-native-gesture-handler";
import { useSharedValue, withDecay, withSpring } from "react-native-reanimated";

export const useFanGesture = (totalItems: number) => {
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onBegin(() => {
      savedRotation.value = rotation.value;
    })
    .onUpdate((e) => {
      const change = e.translationX / FAN_CONFIG.ANIMATION_DAMPING;
      let nextValue = savedRotation.value + change;

      // --- RESISTANCE LOGIC (Prevent flying off screen) ---
      const maxRot = 0;
      const minRot = -(totalItems - 1) * FAN_CONFIG.SPREAD_ANGLE;

      if (nextValue > maxRot) {
        const overscroll = nextValue - maxRot;
        nextValue = maxRot + Math.log(overscroll + 1) * 2;
      } else if (nextValue < minRot) {
        const overscroll = minRot - nextValue;
        nextValue = minRot - Math.log(overscroll + 1) * 2;
      }

      rotation.value = nextValue;
    })
    .onEnd((e) => {
      rotation.value = withDecay({
        velocity: e.velocityX / FAN_CONFIG.ANIMATION_DAMPING,
        rubberBandEffect: false, // Hard stop at edges
        clamp: [-(totalItems - 1) * FAN_CONFIG.SPREAD_ANGLE, 0],
      });
    });

  const scrollToIndex = useCallback((index: number, animated = true) => {
    const targetAngle = -(index * FAN_CONFIG.SPREAD_ANGLE);
    const clampedAngle = Math.max(
      -(totalItems - 1) * FAN_CONFIG.SPREAD_ANGLE, 
      Math.min(0, targetAngle)
    );

    if (animated) {
      rotation.value = withSpring(clampedAngle, { damping: 15, stiffness: 90 });
    } else {
      rotation.value = clampedAngle;
    }
    savedRotation.value = clampedAngle;
  }, [rotation, savedRotation, totalItems]);

  return { rotation, panGesture, scrollToIndex };
};
