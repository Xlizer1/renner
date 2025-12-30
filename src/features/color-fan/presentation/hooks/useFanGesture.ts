import { FAN_CONFIG } from "@/src/core/constants/fanConfig";
import { Gesture } from "react-native-gesture-handler";
import { useSharedValue, withDecay } from "react-native-reanimated";

export const useFanGesture = (totalItems: number) => {
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Allow taps to pass through
    .onBegin(() => {
      savedRotation.value = rotation.value;
    })
    .onUpdate((e) => {
      rotation.value =
        savedRotation.value + e.translationX / FAN_CONFIG.ANIMATION_DAMPING;
    })
    .onEnd((e) => {
      rotation.value = withDecay({
        velocity: e.velocityX / FAN_CONFIG.ANIMATION_DAMPING,
        rubberBandEffect: false,
        clamp: [-(totalItems - 1) * FAN_CONFIG.SPREAD_ANGLE, 0],
      });
    });

  return { rotation, panGesture };
};
