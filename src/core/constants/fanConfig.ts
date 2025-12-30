import { Dimensions } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export const FAN_CONFIG = {
  CARD_WIDTH: 150,
  CARD_HEIGHT: 500,
  SPREAD_ANGLE: 10,
  RENDER_WINDOW: 8, // Render 8 cards left/right
  PIVOT_Y: SCREEN_HEIGHT / 2 - 90,
  ANIMATION_DAMPING: 3, // Higher = heavier feel
};
