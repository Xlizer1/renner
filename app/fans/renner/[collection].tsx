import FanScreen from "@/src/features/color-fan/presentation/screens/NcsFanScreen";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";

export default function RennerDynamicRoute() {
  // Get the 'collection' param from the URL (chroma, cs, tm)
  const { collection } = useLocalSearchParams<{ collection: string }>();

  // Map IDs to nice Titles for the Header
  const titles: Record<string, string> = {
    chroma: "Renner Chroma",
    cs: "Renner CS",
    tm: "Renner TM-M006",
  };

  const title = titles[collection || ""] || "Renner Wood";

  return (
    <>
      <Stack.Screen
        options={{
          title: title,
          headerTintColor: "#fff",
          headerStyle: { backgroundColor: "#121212" },
          headerBackTitle: "Fans",
        }}
      />

      {/* Pass the ID down to the logic layer */}
      <FanScreen mode="renner" collectionId={collection} />
    </>
  );
}
